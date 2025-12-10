/**
 * Event routes
 * Handles incoming event submissions
 */
import { Router } from 'express';
import { ingestEvent } from '../controllers/eventController';

const router = Router();

/**
 * POST /events
 * Accept and process incoming events
 */
router.post('/', ingestEvent);

export default router;

