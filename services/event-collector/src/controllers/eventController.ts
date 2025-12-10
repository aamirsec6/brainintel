/**
 * Event Controller
 * Handles HTTP requests for event ingestion
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { validateIncomingEvent } from '@retail-brain/validators';
import { validateEvent } from '../services/eventValidator';
import { storeRawEvent } from '../services/eventStorage';
import { EventAcceptedResponse } from '@retail-brain/types';

const logger = createLogger({
  service: 'event-collector',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Ingest incoming event
 */
export async function ingestEvent(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // Extract request metadata
    const requestMetadata = {
      request_id: req.headers['x-request-id'] as string | undefined,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    };

    logger.info('Received event', {
      request_id: requestMetadata.request_id,
      source: req.body.source,
      event_type: req.body.event_type,
    });

    // Step 1: Validate schema
    const schemaValidation = validateIncomingEvent(req.body);

    if (!schemaValidation.success) {
      logger.warn('Event schema validation failed', {
        request_id: requestMetadata.request_id,
        errors: schemaValidation.error,
      });

      return res.status(400).json({
        error: {
          message: 'Event validation failed',
          code: 'VALIDATION_ERROR',
          details: schemaValidation.error,
        },
      });
    }

    const eventData = schemaValidation.data;

    // Step 2: Additional business validation
    const businessValidation = validateEvent(eventData);

    if (!businessValidation.valid) {
      logger.warn('Event business validation failed', {
        request_id: requestMetadata.request_id,
        reason: businessValidation.reason,
      });

      return res.status(400).json({
        error: {
          message: businessValidation.reason || 'Event validation failed',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Step 3: Store raw event
    const eventId = await storeRawEvent(eventData, requestMetadata);

    const duration = Date.now() - startTime;

    logger.info('Event accepted', {
      request_id: requestMetadata.request_id,
      event_id: eventId,
      duration_ms: duration,
    });

    // Step 4: Return success response
    const response: EventAcceptedResponse = {
      status: 'accepted',
      event_id: eventId,
    };

    res.status(202).json(response);

    // Step 5: Forward to Identity Engine (Phase 3)
    // TODO: Implement in Phase 3
    // await forwardToIdentityEngine(eventId, eventData);
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Event ingestion failed', error instanceof Error ? error : new Error(String(error)), {
      request_id: req.headers['x-request-id'],
      duration_ms: duration,
    });

    res.status(500).json({
      error: {
        message: 'Failed to process event',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

