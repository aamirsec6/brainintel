/**
 * Attribution Routes
 */
import { Router } from 'express';
import { attributionController } from '../controllers/attributionController';

const router = Router();

// Calculate attribution for conversion
router.post('/calculate', attributionController.calculateAttribution);

// Get attribution report
router.get('/report', attributionController.getReport);

// Get channel performance
router.get('/channels', attributionController.getChannelPerformance);

// Get campaign performance
router.get('/campaigns', attributionController.getCampaignPerformance);

export default router;

