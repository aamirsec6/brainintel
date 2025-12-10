/**
 * Profile routes
 */
import { Router } from 'express';
import { getCustomer360, searchCustomers, getCustomerTimeline, getStats, getAnalytics } from '../controllers/profileController';

const router = Router();

/**
 * GET /stats
 * Get platform statistics
 */
router.get('/stats', getStats);

/**
 * GET /analytics
 * Get comprehensive analytics with time-series data
 */
router.get('/analytics', getAnalytics);

/**
 * GET /search
 * Search customers by identifiers
 * NOTE: Must come before /:id route to avoid matching "search" as an ID
 */
router.get('/search', searchCustomers);

/**
 * GET /:id
 * Get full Customer 360 view
 */
router.get('/:id', getCustomer360);

/**
 * GET /:id/timeline
 * Get customer event timeline
 */
router.get('/:id/timeline', getCustomerTimeline);

export default router;
