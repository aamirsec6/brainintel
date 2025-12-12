/**
 * Profile routes
 */
import { Router } from 'express';
import { getCustomer360, searchCustomers, getCustomerTimeline, getStats, getAnalytics, getRecentActivity, getActivityChart } from '../controllers/profileController';

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
 * GET /activity
 * Get recent activity feed
 */
router.get('/activity', getRecentActivity);

/**
 * GET /activity/chart
 * Get activity chart data (events and customers by day)
 */
router.get('/activity/chart', getActivityChart);

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
