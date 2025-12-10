/**
 * Event Storage Service
 * Handles database operations for raw events
 */
import { getDb } from '@retail-brain/db';
import { IncomingEvent, EventStatus } from '@retail-brain/types';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'event-storage',
  level: process.env.LOG_LEVEL || 'info',
});

interface RequestMetadata {
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Store raw event in database
 * Returns the event ID
 */
export async function storeRawEvent(
  event: IncomingEvent,
  metadata: RequestMetadata
): Promise<string> {
  const db = getDb();

  try {
    const query = `
      INSERT INTO customer_raw_event (
        source,
        event_type,
        event_ts,
        identifiers,
        payload,
        status,
        request_id,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      event.source,
      event.event_type,
      event.event_ts,
      JSON.stringify(event.identifiers),
      JSON.stringify(event.payload),
      EventStatus.ACCEPTED,
      metadata.request_id || null,
      metadata.ip_address || null,
      metadata.user_agent || null,
    ];

    const result = await db.query<{ id: string }>(query, values);

    const eventId = result.rows[0].id;

    logger.debug('Raw event stored', {
      event_id: eventId,
      source: event.source,
      event_type: event.event_type,
    });

    // Forward to Identity Engine (async - don't wait)
    forwardToIdentityEngine(eventId, event.identifiers).catch((err) => {
      logger.error('Failed to forward to Identity Engine', err, { event_id: eventId });
    });

    return eventId;
  } catch (error) {
    logger.error(
      'Failed to store raw event',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: event.source,
        event_type: event.event_type,
      }
    );
    throw error;
  }
}

/**
 * Store quarantined event
 * For events that fail validation
 */
export async function quarantineEvent(
  event: unknown,
  errorMessage: string,
  metadata: RequestMetadata
): Promise<string> {
  const db = getDb();

  try {
    const query = `
      INSERT INTO customer_raw_event (
        source,
        event_type,
        event_ts,
        identifiers,
        payload,
        status,
        error_message,
        request_id,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    // Extract what we can from the invalid event
    const eventData = event as Record<string, unknown>;
    const source = (eventData.source as string) || 'unknown';
    const eventType = (eventData.event_type as string) || 'unknown';
    const eventTs = (eventData.event_ts as string) || new Date().toISOString();
    const identifiers = eventData.identifiers || {};
    const payload = eventData.payload || {};

    const values = [
      source,
      eventType,
      eventTs,
      JSON.stringify(identifiers),
      JSON.stringify(payload),
      EventStatus.QUARANTINED,
      errorMessage,
      metadata.request_id || null,
      metadata.ip_address || null,
      metadata.user_agent || null,
    ];

    const result = await db.query<{ id: string }>(query, values);

    const eventId = result.rows[0].id;

    logger.warn('Event quarantined', {
      event_id: eventId,
      error: errorMessage,
    });

    return eventId;
  } catch (error) {
    logger.error(
      'Failed to quarantine event',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Forward event to Identity Engine for resolution
 */
async function forwardToIdentityEngine(
  eventId: string,
  identifiers: Record<string, unknown>
): Promise<void> {
  try {
    const identityEngineUrl =
      process.env.IDENTITY_ENGINE_URL || 'http://localhost:3002';

    const response = await fetch(`${identityEngineUrl}/identity/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        identifiers,
      }),
    });

    if (!response.ok) {
      throw new Error(`Identity Engine returned ${response.status}`);
    }

    const result = await response.json();

    logger.info('Event forwarded to Identity Engine', {
      event_id: eventId,
      profile_id: result.profile_id,
      action: result.action,
    });
  } catch (error) {
    logger.error(
      'Failed to forward to Identity Engine',
      error instanceof Error ? error : new Error(String(error)),
      { event_id: eventId }
    );
    throw error;
  }
}

/**
 * Mark event as processed
 */
export async function markEventProcessed(eventId: string): Promise<void> {
  const db = getDb();

  try {
    const query = `
      UPDATE customer_raw_event
      SET status = $1, processed_at = NOW()
      WHERE id = $2
    `;

    await db.query(query, [EventStatus.PROCESSED, eventId]);

    logger.debug('Event marked as processed', { event_id: eventId });
  } catch (error) {
    logger.error(
      'Failed to mark event as processed',
      error instanceof Error ? error : new Error(String(error)),
      { event_id: eventId }
    );
    throw error;
  }
}

