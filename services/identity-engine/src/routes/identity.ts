/**
 * Identity resolution routes
 */
import { Router } from 'express';
import { resolveIdentity, getMergeLog, rollbackMerge } from '../controllers/identityController';

const router = Router();

/**
 * POST /identity/resolve
 * Resolve identity for a raw event
 */
router.post('/resolve', resolveIdentity);

/**
 * GET /identity/merge-logs
 * Get merge history
 */
router.get('/merge-logs', getMergeLog);

/**
 * POST /identity/rollback
 * Rollback a merge
 */
router.post('/rollback', rollbackMerge);

export default router;

