/**
 * Profile Service
 * Core business logic for profile operations
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { Customer360 } from '@retail-brain/types';
import { generateHash, normalizePhone, normalizeEmail } from '@retail-brain/utils';
import axios from 'axios';

const logger = createLogger({
  service: 'profile-service',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Get complete Customer 360 view
 */
export async function getProfileById(profileId: string): Promise<Customer360 | null> {
  const db = getDb();

  try {
    // Get profile
    const profileQuery = `
      SELECT *
      FROM customer_profile
      WHERE id = $1 AND is_merged = false
    `;

    const profileResult = await db.query(profileQuery, [profileId]);

    if (profileResult.rows.length === 0) {
      return null;
    }

    const profile = profileResult.rows[0];

    // Get identifiers
    const identifiersQuery = `
      SELECT *
      FROM profile_identifier
      WHERE profile_id = $1
      ORDER BY type, created_at
    `;

    const identifiersResult = await db.query(identifiersQuery, [profileId]);

    // Get recent events (timeline)
    const timelineQuery = `
      SELECT *
      FROM customer_raw_event
      WHERE id IN (
        SELECT id 
        FROM customer_raw_event
        WHERE identifiers->>'phone' = $1
           OR identifiers->>'email' = $2
        ORDER BY event_ts DESC
        LIMIT 100
      )
      ORDER BY event_ts DESC
    `;

    const timelineResult = await db.query(timelineQuery, [
      profile.primary_phone,
      profile.primary_email,
    ]);

    // Calculate stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT event_type) as unique_event_types
      FROM customer_raw_event
      WHERE identifiers->>'phone' = $1
         OR identifiers->>'email' = $2
    `;

    const statsResult = await db.query(statsQuery, [
      profile.primary_phone,
      profile.primary_email,
    ]);

    const stats = statsResult.rows[0];

    // Get ML predictions (churn, LTV, intent)
    let mlPredictions: Customer360['ml_predictions'] = undefined;
    
    try {
      const mlScorerUrl = process.env.ML_SCORER_SERVICE_URL || 'http://localhost:3015';
      const intentServiceUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
      
      // Fetch churn prediction
      let churnProb = null;
      try {
        const churnResponse = await axios.post(
          `${mlScorerUrl}/v1/predict/churn`,
          { profile_id: profileId },
          { timeout: 2000 }
        );
        churnProb = churnResponse.data.churn_probability;
      } catch (error) {
        logger.warn('Failed to fetch churn prediction', { profile_id: profileId });
      }
      
      // Fetch LTV prediction
      let predictedLTV = null;
      try {
        const ltvResponse = await axios.post(
          `${mlScorerUrl}/v1/predict/ltv`,
          { profile_id: profileId },
          { timeout: 2000 }
        );
        predictedLTV = ltvResponse.data.predicted_ltv;
      } catch (error) {
        logger.warn('Failed to fetch LTV prediction', { profile_id: profileId });
      }
      
      // Get latest intent from recent messages (if available)
      let intentScore = null;
      try {
        // Check for recent WhatsApp messages or interactions
        const recentMessagesQuery = `
          SELECT payload->>'message' as message
          FROM customer_raw_event
          WHERE identifiers->>'phone' = $1
            AND event_type IN ('whatsapp_message', 'message', 'chat')
          ORDER BY event_ts DESC
          LIMIT 1
        `;
        const messagesResult = await db.query(recentMessagesQuery, [profile.primary_phone]);
        
        if (messagesResult.rows.length > 0 && messagesResult.rows[0].message) {
          const intentResponse = await axios.post(
            `${intentServiceUrl}/v1/intent/detect`,
            { text: messagesResult.rows[0].message },
            { timeout: 2000 }
          );
          intentScore = intentResponse.data.confidence;
        }
      } catch (error) {
        logger.warn('Failed to fetch intent score', { profile_id: profileId });
      }
      
      if (churnProb !== null || predictedLTV !== null || intentScore !== null) {
        mlPredictions = {
          churn_probability: churnProb ?? undefined,
          predicted_ltv: predictedLTV ?? undefined,
          intent_score: intentScore ?? undefined,
          last_predicted_at: new Date(),
        };
      }
    } catch (error) {
      logger.warn('Failed to fetch ML predictions', { profile_id: profileId });
    }

    // Build Customer 360
    const customer360: Customer360 = {
      profile,
      identifiers: identifiersResult.rows,
      timeline: timelineResult.rows,
      stats: {
        total_events: parseInt(stats.total_events),
        event_types: {},
        recent_categories: [],
      },
      ml_predictions: mlPredictions,
    };

    return customer360;
  } catch (error) {
    logger.error('Failed to get profile', error instanceof Error ? error : new Error(String(error)), {
      profile_id: profileId,
    });
    throw error;
  }
}

/**
 * Search profiles by identifiers
 */
export async function searchProfiles(params: {
  phone?: string;
  email?: string;
  device?: string;
  loyalty_id?: string;
  name?: string;
  limit: number;
}): Promise<any[]> {
  const db = getDb();

  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build search conditions based on identifiers
    if (params.phone) {
      const phoneHash = generateHash(normalizePhone(params.phone));
      conditions.push(`pi.value_hash = $${paramIndex} AND pi.type = 'phone'`);
      values.push(phoneHash);
      paramIndex++;
    }

    if (params.email) {
      const emailHash = generateHash(normalizeEmail(params.email));
      conditions.push(`pi.value_hash = $${paramIndex} AND pi.type = 'email'`);
      values.push(emailHash);
      paramIndex++;
    }

    if (params.device) {
      const deviceHash = generateHash(params.device.toLowerCase().trim());
      conditions.push(`pi.value_hash = $${paramIndex} AND pi.type = 'device'`);
      values.push(deviceHash);
      paramIndex++;
    }

    if (params.loyalty_id) {
      const loyaltyHash = generateHash(params.loyalty_id.toLowerCase().trim());
      conditions.push(`pi.value_hash = $${paramIndex} AND pi.type = 'loyalty_id'`);
      values.push(loyaltyHash);
      paramIndex++;
    }

    if (conditions.length === 0 && !params.name) {
      return [];
    }

    let query: string;

    if (conditions.length > 0) {
      // Search by identifiers
      query = `
        SELECT
          cp.*,
          array_agg(row_to_json(pi.*)) FILTER (WHERE pi.id IS NOT NULL) as identifiers
        FROM customer_profile cp
        LEFT JOIN profile_identifier pi ON pi.profile_id = cp.id
        WHERE (${conditions.join(' OR ')})
          AND cp.is_merged = false
        GROUP BY cp.id
        ORDER BY cp.last_seen_at DESC
        LIMIT $${paramIndex}
      `;
      values.push(params.limit);
    } else {
      // Search by name
      query = `
        SELECT *
        FROM customer_profile
        WHERE full_name ILIKE $1
          AND is_merged = false
        ORDER BY last_seen_at DESC
        LIMIT $2
      `;
      values.push(`%${params.name}%`, params.limit);
    }

    const result = await db.query(query, values);

    logger.info('Customer search completed', {
      results_count: result.rows.length,
    });

    return result.rows;
  } catch (error) {
    logger.error('Customer search failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get customer timeline
 */
export async function getTimeline(profileId: string, limit: number = 50): Promise<any[]> {
  const db = getDb();

  try {
    // Get profile's identifiers first
    const identifiersQuery = `
      SELECT value
      FROM profile_identifier
      WHERE profile_id = $1
    `;

    const identifiersResult = await db.query(identifiersQuery, [profileId]);
    const identifierValues = identifiersResult.rows.map(r => r.value);

    if (identifierValues.length === 0) {
      return [];
    }

    // Get events matching any of these identifiers
    const timelineQuery = `
      SELECT 
        id,
        source,
        event_type,
        event_ts,
        payload,
        received_at
      FROM customer_raw_event
      WHERE identifiers ?| $1
      ORDER BY event_ts DESC
      LIMIT $2
    `;

    const result = await db.query(timelineQuery, [identifierValues, limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get timeline', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

