/**
 * Attribution Service
 * Implements multiple attribution models
 */
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import { firstTouchModel } from './models/firstTouch';
import { lastTouchModel } from './models/lastTouch';
import { linearModel } from './models/linear';
import { timeDecayModel } from './models/timeDecay';
import { positionBasedModel } from './models/positionBased';

const logger = createLogger({ service: 'attribution-service' });
const db = getDb();

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

export const attributionService = {
  /**
   * Calculate attribution for a conversion event
   */
  async calculateAttribution(
    conversionEventId: string,
    journeyId: string,
    model: AttributionModel = 'linear'
  ): Promise<any[]> {
    // Get journey touchpoints
    const journeyResult = await db.query(
      `SELECT * FROM customer_journey
       WHERE journey_id = $1
       ORDER BY touchpoint_number ASC`,
      [journeyId]
    );

    const touchpoints = journeyResult.rows;

    if (touchpoints.length === 0) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    // Get conversion event
    const conversionResult = await db.query(
      `SELECT * FROM events WHERE id = $1`,
      [conversionEventId]
    );

    if (conversionResult.rows.length === 0) {
      throw new Error(`Conversion event not found: ${conversionEventId}`);
    }

    const conversionEvent = conversionResult.rows[0];
    const conversionValue = parseFloat(conversionEvent.revenue || conversionEvent.price || '0');

    // Calculate attribution weights based on model
    let weights: number[];

    switch (model) {
      case 'first_touch':
        weights = firstTouchModel(touchpoints.length);
        break;
      case 'last_touch':
        weights = lastTouchModel(touchpoints.length);
        break;
      case 'linear':
        weights = linearModel(touchpoints.length);
        break;
      case 'time_decay':
        weights = timeDecayModel(touchpoints);
        break;
      case 'position_based':
        weights = positionBasedModel(touchpoints.length);
        break;
      default:
        weights = linearModel(touchpoints.length);
    }

    // Store attribution records
    const attributionRecords = [];

    for (let i = 0; i < touchpoints.length; i++) {
      const touchpoint = touchpoints[i];
      const weight = weights[i];
      const attributedValue = conversionValue * weight;

      // Get event ID for touchpoint
      const eventResult = await db.query(
        `SELECT id FROM events 
         WHERE profile_id = $1 
           AND source = $2 
           AND event_type = $3 
           AND event_ts = $4
         LIMIT 1`,
        [
          touchpoint.profile_id,
          touchpoint.channel,
          touchpoint.event_type,
          touchpoint.event_ts,
        ]
      );

      const touchpointEventId = eventResult.rows[0]?.id;

      if (touchpointEventId) {
        const result = await db.query(
          `INSERT INTO attribution (
            profile_id, conversion_event_id, touchpoint_event_id,
            attribution_model, attribution_weight, channel, campaign,
            touchpoint_number, conversion_value, attributed_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
          RETURNING *`,
          [
            touchpoint.profile_id,
            conversionEventId,
            touchpointEventId,
            model,
            weight,
            touchpoint.channel,
            touchpoint.campaign,
            touchpoint.touchpoint_number,
            conversionValue,
            attributedValue,
          ]
        );

        if (result.rows.length > 0) {
          attributionRecords.push(result.rows[0]);
        }
      }
    }

    logger.info('Attribution calculated', {
      conversion_event_id: conversionEventId,
      model,
      touchpoints: touchpoints.length,
    });

    return attributionRecords;
  },

  async getReport(model: AttributionModel, startDate?: string, endDate?: string): Promise<any> {
    let query = `
      SELECT 
        channel,
        COUNT(DISTINCT conversion_event_id) as conversions,
        SUM(attributed_value) as attributed_revenue,
        AVG(attribution_weight) as avg_weight
      FROM attribution
      WHERE attribution_model = $1
    `;

    const params: any[] = [model];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` GROUP BY channel ORDER BY attributed_revenue DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  async getChannelPerformance(model: AttributionModel, startDate?: string, endDate?: string): Promise<any> {
    let query = `
      SELECT 
        channel,
        COUNT(DISTINCT conversion_event_id) as conversions,
        SUM(attributed_value) as revenue,
        AVG(attribution_weight) as avg_weight
      FROM attribution
      WHERE attribution_model = $1
    `;

    const params: any[] = [model];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` GROUP BY channel ORDER BY revenue DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  async getCampaignPerformance(model: AttributionModel, startDate?: string, endDate?: string): Promise<any> {
    let query = `
      SELECT 
        campaign,
        channel,
        COUNT(DISTINCT conversion_event_id) as conversions,
        SUM(attributed_value) as revenue
      FROM attribution
      WHERE attribution_model = $1 AND campaign IS NOT NULL
    `;

    const params: any[] = [model];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` GROUP BY campaign, channel ORDER BY revenue DESC LIMIT 50`;

    const result = await db.query(query, params);
    return result.rows;
  },
};

