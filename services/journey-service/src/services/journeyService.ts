/**
 * Journey Service
 * Builds and analyzes customer journeys
 */
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';

const logger = createLogger({ service: 'journey-service' });
const db = getDb();

export interface JourneyTouchpoint {
  id: string;
  profile_id: string;
  journey_id: string;
  touchpoint_number: number;
  channel: string;
  event_type: string;
  event_ts: Date;
  session_id: string | null;
  device_id: string | null;
  referrer: string | null;
  campaign: string | null;
  converted: boolean;
  conversion_value: number | null;
  journey_stage: string | null;
  time_to_conversion: number | null;
}

export const journeyService = {
  /**
   * Build journey from events and store touchpoints
   */
  async buildJourney(profileId: string, events: any[]): Promise<string> {
    const journeyId = `journey_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Sort events by timestamp
    const sortedEvents = events.sort((a, b) => 
      new Date(a.event_ts).getTime() - new Date(b.event_ts).getTime()
    );

    // Determine if journey converted
    const hasPurchase = sortedEvents.some(e => e.event_type === 'purchase');
    const conversionEvent = sortedEvents.find(e => e.event_type === 'purchase');
    const conversionValue = conversionEvent?.payload?.price || conversionEvent?.payload?.total || null;

    // Calculate time to conversion
    const firstEvent = sortedEvents[0];
    const timeToConversion = hasPurchase && conversionEvent
      ? Math.floor((new Date(conversionEvent.event_ts).getTime() - new Date(firstEvent.event_ts).getTime()) / 60000)
      : null;

    // Insert touchpoints
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const stage = determineJourneyStage(i, sortedEvents.length, hasPurchase);

      await db.query(
        `INSERT INTO customer_journey (
          profile_id, journey_id, touchpoint_number, channel, event_type, event_ts,
          session_id, device_id, referrer, campaign, converted, conversion_value,
          conversion_event_id, journey_stage, time_to_conversion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          profileId,
          journeyId,
          i + 1,
          event.source,
          event.event_type,
          event.event_ts,
          event.payload?.session_id || null,
          event.payload?.device_id || null,
          event.payload?.referrer || null,
          event.payload?.campaign || null,
          hasPurchase && i === sortedEvents.length - 1, // Mark last touchpoint if converted
          i === sortedEvents.length - 1 ? conversionValue : null,
          conversionEvent?.id || null,
          stage,
          i === sortedEvents.length - 1 ? timeToConversion : null,
        ]
      );
    }

    logger.info('Journey built', { journey_id: journeyId, profile_id: profileId, touchpoints: sortedEvents.length });
    return journeyId;
  },

  async getByProfile(profileId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT DISTINCT journey_id, 
              MIN(event_ts) as started_at,
              MAX(event_ts) as ended_at,
              COUNT(*) as touchpoints,
              MAX(converted::int)::boolean as converted,
              MAX(conversion_value) as conversion_value
       FROM customer_journey
       WHERE profile_id = $1
       GROUP BY journey_id
       ORDER BY started_at DESC
       LIMIT 50`,
      [profileId]
    );

    return result.rows;
  },

  async getByJourneyId(journeyId: string): Promise<JourneyTouchpoint[]> {
    const result = await db.query(
      `SELECT * FROM customer_journey
       WHERE journey_id = $1
       ORDER BY touchpoint_number ASC`,
      [journeyId]
    );

    return result.rows;
  },

  async getAnalytics(): Promise<any> {
    const totalJourneys = await db.query(`SELECT COUNT(DISTINCT journey_id) as count FROM customer_journey`);
    const convertedJourneys = await db.query(`SELECT COUNT(DISTINCT journey_id) as count FROM customer_journey WHERE converted = TRUE`);
    const avgTouchpoints = await db.query(`SELECT AVG(touchpoint_count) as avg FROM (SELECT journey_id, COUNT(*) as touchpoint_count FROM customer_journey GROUP BY journey_id) sub`);
    const avgTimeToConversion = await db.query(`SELECT AVG(time_to_conversion) as avg FROM customer_journey WHERE time_to_conversion IS NOT NULL`);

    return {
      total_journeys: parseInt(totalJourneys.rows[0].count),
      converted_journeys: parseInt(convertedJourneys.rows[0].count),
      conversion_rate: totalJourneys.rows[0].count > 0 
        ? (parseInt(convertedJourneys.rows[0].count) / parseInt(totalJourneys.rows[0].count) * 100).toFixed(2)
        : 0,
      avg_touchpoints: parseFloat(avgTouchpoints.rows[0].avg || 0).toFixed(2),
      avg_time_to_conversion_minutes: parseFloat(avgTimeToConversion.rows[0].avg || 0).toFixed(2),
    };
  },

  async getConversionFunnel(): Promise<any> {
    const result = await db.query(
      `SELECT 
        journey_stage,
        COUNT(DISTINCT journey_id) as journeys,
        COUNT(*) as touchpoints
       FROM customer_journey
       WHERE journey_stage IS NOT NULL
       GROUP BY journey_stage
       ORDER BY 
         CASE journey_stage
           WHEN 'awareness' THEN 1
           WHEN 'consideration' THEN 2
           WHEN 'purchase' THEN 3
           WHEN 'retention' THEN 4
         END`
    );

    return result.rows;
  },
};

function determineJourneyStage(index: number, total: number, hasPurchase: boolean): string {
  if (!hasPurchase) {
    return index < total * 0.3 ? 'awareness' : 'consideration';
  }

  if (index < total * 0.3) return 'awareness';
  if (index < total * 0.7) return 'consideration';
  if (index === total - 1) return 'purchase';
  return 'retention';
}

