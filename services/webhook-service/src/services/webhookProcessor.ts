/**
 * Webhook Processor
 * Forwards transformed events to Event Collector
 */
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import { IncomingEvent } from '@retail-brain/types';
import axios from 'axios';

const logger = createLogger({ service: 'webhook-processor' });
const config = getConfig();

const EVENT_COLLECTOR_URL = config.EVENT_COLLECTOR_URL || 'http://localhost:3001';

/**
 * Forward event to Event Collector
 */
export async function forwardToEventCollector(event: IncomingEvent): Promise<void> {
  try {
    const response = await axios.post(
      `${EVENT_COLLECTOR_URL}/v1/events`,
      event,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.API_KEY || 'test_api_key'}`,
        },
        timeout: 10000,
      }
    );

    logger.debug('Event forwarded to collector', {
      event_type: event.event_type,
      source: event.source,
      status: response.status,
    });
  } catch (error) {
    logger.error('Failed to forward event to collector', {
      error: error instanceof Error ? error.message : String(error),
      event_type: event.event_type,
      source: event.source,
    });
    throw error;
  }
}

