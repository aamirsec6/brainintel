/**
 * Identity Controller
 * Handles identity resolution requests
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { resolveIdentityForEvent } from '../services/identityResolver';
import { getMergeLogs } from '../services/mergeLogService';
import { rollbackMergeById } from '../services/mergeService';

const logger = createLogger({
  service: 'identity-controller',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Resolve identity for an event
 */
export async function resolveIdentity(req: Request, res: Response) {
  try {
    const { event_id, identifiers } = req.body;

    if (!event_id || !identifiers) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: event_id, identifiers',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    logger.info('Resolving identity', { event_id });

    const result = await resolveIdentityForEvent(event_id, identifiers);

    res.json(result);
  } catch (error) {
    logger.error('Identity resolution failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to resolve identity',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get merge logs
 */
export async function getMergeLog(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getMergeLogs(page, limit);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get merge logs', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve merge logs',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Rollback a merge
 */
export async function rollbackMerge(req: Request, res: Response) {
  try {
    const { merge_log_id, reason, rolled_back_by } = req.body;

    if (!merge_log_id || !reason) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: merge_log_id, reason',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    logger.info('Rolling back merge', { merge_log_id, reason });

    await rollbackMergeById(merge_log_id, reason, rolled_back_by);

    res.json({
      success: true,
      message: 'Merge rolled back successfully',
    });
  } catch (error) {
    logger.error('Merge rollback failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to rollback merge',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

