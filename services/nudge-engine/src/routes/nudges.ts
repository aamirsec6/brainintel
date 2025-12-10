/**
 * Nudge routes
 */
import { Router } from 'express';
import { 
  evaluateNudge, 
  executeNudge, 
  getNudgeHistory,
  getRecentNudges,
  evaluateBulkNudges,
  getNudgeStats,
} from '../controllers/nudgeController';

const router = Router();

router.post('/evaluate', evaluateNudge);
router.post('/execute', executeNudge);
router.get('/history/:profile_id', getNudgeHistory);
router.get('/recent', getRecentNudges);
router.post('/evaluate/bulk', evaluateBulkNudges);
router.get('/stats', getNudgeStats);

export default router;

