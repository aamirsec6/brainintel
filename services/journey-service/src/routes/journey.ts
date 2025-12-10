/**
 * Journey Routes
 */
import { Router } from 'express';
import { journeyController } from '../controllers/journeyController';

const router = Router();

// Get journey by profile ID
router.get('/profile/:profileId', journeyController.getByProfile);

// Get journey by journey ID
router.get('/:journeyId', journeyController.getByJourneyId);

// Get journey analytics
router.get('/analytics/summary', journeyController.getAnalytics);

// Get conversion funnel
router.get('/analytics/funnel', journeyController.getFunnel);

export default router;

