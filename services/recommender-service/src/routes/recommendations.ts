/**
 * Recommendation routes
 */
import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationController';

const router = Router();

router.get('/:profile_id', getRecommendations);

export default router;

