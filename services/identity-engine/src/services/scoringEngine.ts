/**
 * Scoring Engine
 * Calculates confidence scores for profile matching
 * 
 * Score Formula (from PRD):
 * score = 0.6 * phone_match
 *       + 0.4 * email_match
 *       + 0.3 * name_similarity
 *       + 0.4 * device_match
 *       + 0.2 * purchase_overlap
 * 
 * ML Fallback: If rule-based score is in ambiguous range (0.45-0.80),
 * call ML scorer service for more accurate prediction.
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { stringSimilarity } from '@retail-brain/utils';
import { getConfig } from '@retail-brain/config';
import { NormalizedIdentifiers } from '../../../event-collector/src/utils/normalize';
import { ScoringDetails } from '@retail-brain/types';
import axios from 'axios';

const logger = createLogger({
  service: 'scoring-engine',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Calculate confidence score between profiles
 * Uses rule-based scoring first, then ML scorer if in ambiguous range
 */
export async function calculateScore(
  sourceProfileId: string | null,
  targetProfileId: string,
  normalized: NormalizedIdentifiers
): Promise<number> {
  try {
    // First, calculate rule-based score
    const details = await calculateScoringDetails(
      sourceProfileId,
      targetProfileId,
      normalized
    );

    const ruleScore = details.total_score;

    // If score is in ambiguous range and ML scorer is enabled, try ML fallback
    if (
      ML_SCORER_ENABLED &&
      ruleScore >= ML_SCORER_AMBIGUOUS_MIN &&
      ruleScore < ML_SCORER_AMBIGUOUS_MAX &&
      sourceProfileId
    ) {
      try {
        const mlScore = await getMLScore(
          sourceProfileId,
          targetProfileId,
          normalized
        );

        if (mlScore !== null) {
          logger.debug('Using ML score', {
            source_profile_id: sourceProfileId,
            target_profile_id: targetProfileId,
            rule_score: ruleScore,
            ml_score: mlScore,
          });
          return mlScore;
        }
      } catch (error) {
        logger.warn(
          'ML scorer failed, using rule-based score',
          error instanceof Error ? error : new Error(String(error)),
          {
            source_profile_id: sourceProfileId,
            target_profile_id: targetProfileId,
          }
        );
      }
    }

    return ruleScore;
  } catch (error) {
    logger.error(
      'Score calculation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}

/**
 * Get ML score from ML scorer service
 */
async function getMLScore(
  sourceProfileId: string,
  targetProfileId: string,
  normalized: NormalizedIdentifiers
): Promise<number | null> {
  try {
    const db = getDb();

    // Get profile data
    const profileQuery = `
      SELECT * FROM customer_profile WHERE id IN ($1, $2)
    `;
    const profiles = await db.query(profileQuery, [sourceProfileId, targetProfileId]);

    if (profiles.rows.length !== 2) {
      return null;
    }

    const profileA = profiles.rows.find((p) => p.id === sourceProfileId);
    const profileB = profiles.rows.find((p) => p.id === targetProfileId);

    if (!profileA || !profileB) {
      return null;
    }

    // Get identifiers
    const identifiersQuery = `
      SELECT type, value, value_hash
      FROM profile_identifier
      WHERE profile_id IN ($1, $2)
    `;
    const identifiers = await db.query(identifiersQuery, [sourceProfileId, targetProfileId]);

    const identifiersA = identifiers.rows
      .filter((i) => i.profile_id === sourceProfileId)
      .map((i) => ({ type: i.type, value: i.value, value_hash: i.value_hash }));
    const identifiersB = identifiers.rows
      .filter((i) => i.profile_id === targetProfileId)
      .map((i) => ({ type: i.type, value: i.value, value_hash: i.value_hash }));

    // Get events (optional)
    const eventsQuery = `
      SELECT event_type, payload, event_ts
      FROM events
      WHERE profile_id = $1
      ORDER BY event_ts DESC
      LIMIT 50
    `;
    const eventsA = await db.query(eventsQuery, [sourceProfileId]);
    const eventsB = await db.query(eventsQuery, [targetProfileId]);

    // Call ML scorer service
    const mlScorerUrl = config.ML_SCORER_SERVICE_URL || `http://localhost:${config.servicePorts.mlScorer}`;
    const response = await axios.post(
      `${mlScorerUrl}/v1/score/identity`,
      {
        profile_a_id: sourceProfileId,
        profile_b_id: targetProfileId,
        profile_a: profileA,
        profile_b: profileB,
        identifiers_a: identifiersA,
        identifiers_b: identifiersB,
        events_a: eventsA.rows.map((e) => ({
          event_type: e.event_type,
          sku: e.payload?.sku,
          event_ts: e.event_ts,
        })),
        events_b: eventsB.rows.map((e) => ({
          event_type: e.event_type,
          sku: e.payload?.sku,
          event_ts: e.event_ts,
        })),
      },
      {
        timeout: 2000, // 2 second timeout
      }
    );

    return response.data.score;
  } catch (error) {
    logger.debug(
      'ML scorer call failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Calculate detailed scoring breakdown
 */
export async function calculateScoringDetails(
  sourceProfileId: string | null,
  targetProfileId: string,
  normalized: NormalizedIdentifiers
): Promise<ScoringDetails> {
  const db = getDb();
  const scoring: ScoringDetails = {
    total_score: 0,
  };

  // Get target profile identifiers
  const identifierQuery = `
    SELECT type, value_hash
    FROM profile_identifier
    WHERE profile_id = $1
  `;

  const identifiers = await db.query<{ type: string; value_hash: string }>(
    identifierQuery,
    [targetProfileId]
  );

  const targetHashes = new Map(
    identifiers.rows.map((row) => [row.type, row.value_hash])
  );

  // Phone match (weight: 0.6)
  if (normalized.phone) {
    const phoneHash = targetHashes.get('phone');
    if (phoneHash === normalized.phone.hash) {
      scoring.phone_match = 1.0;
      scoring.total_score += 0.6;
    } else {
      scoring.phone_match = 0.0;
    }
  }

  // Email match (weight: 0.4)
  if (normalized.email) {
    const emailHash = targetHashes.get('email');
    if (emailHash === normalized.email.hash) {
      scoring.email_match = 1.0;
      scoring.total_score += 0.4;
    } else {
      // Check email username similarity
      const emailQuery = `
        SELECT value
        FROM profile_identifier
        WHERE profile_id = $1 AND type = 'email'
        LIMIT 1
      `;
      const emailResult = await db.query<{ value: string }>(emailQuery, [
        targetProfileId,
      ]);

      if (emailResult.rows.length > 0) {
        const targetEmail = emailResult.rows[0].value;
        const targetUsername = targetEmail.split('@')[0];
        const sourceUsername = normalized.email.normalized.split('@')[0];
        const similarity = stringSimilarity(sourceUsername, targetUsername);
        scoring.email_match = similarity * 0.5; // Partial credit
        scoring.total_score += scoring.email_match * 0.4;
      } else {
        scoring.email_match = 0.0;
      }
    }
  }

  // Device match (weight: 0.4)
  if (normalized.device) {
    const deviceHash = targetHashes.get('device');
    if (deviceHash === normalized.device.hash) {
      scoring.device_match = 1.0;
      scoring.total_score += 0.4;
    } else {
      scoring.device_match = 0.0;
    }
  }

  // Name similarity (weight: 0.3)
  if (sourceProfileId) {
    const nameQuery = `
      SELECT 
        s.full_name as source_name,
        t.full_name as target_name
      FROM customer_profile s
      CROSS JOIN customer_profile t
      WHERE s.id = $1 AND t.id = $2
    `;

    const nameResult = await db.query<{
      source_name: string;
      target_name: string;
    }>(nameQuery, [sourceProfileId, targetProfileId]);

    if (
      nameResult.rows.length > 0 &&
      nameResult.rows[0].source_name &&
      nameResult.rows[0].target_name
    ) {
      const similarity = stringSimilarity(
        nameResult.rows[0].source_name.toLowerCase(),
        nameResult.rows[0].target_name.toLowerCase()
      );
      scoring.name_similarity = similarity;
      scoring.total_score += similarity * 0.3;
    }
  }

  // Purchase overlap (weight: 0.2)
  if (sourceProfileId) {
    const overlapQuery = `
      SELECT COUNT(DISTINCT e1.sku) as overlap_count
      FROM events e1
      INNER JOIN events e2 ON e1.sku = e2.sku
      WHERE e1.profile_id = $1
        AND e2.profile_id = $2
        AND e1.sku IS NOT NULL
    `;

    const overlapResult = await db.query<{ overlap_count: string }>(
      overlapQuery,
      [sourceProfileId, targetProfileId]
    );

    const overlapCount = parseInt(overlapResult.rows[0].overlap_count || '0');
    
    // Normalize: 5+ overlapping products = 1.0, linear scale below
    const overlapScore = Math.min(overlapCount / 5, 1.0);
    scoring.purchase_overlap = overlapScore;
    scoring.total_score += overlapScore * 0.2;
  }

  logger.debug('Scoring calculated', {
    source_profile_id: sourceProfileId,
    target_profile_id: targetProfileId,
    total_score: scoring.total_score,
    breakdown: scoring,
  });

  return scoring;
}

