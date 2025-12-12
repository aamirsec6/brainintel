/**
 * Profile Controller
 * Handles customer profile retrieval and search
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import { getProfileById, searchProfiles, getTimeline } from '../services/profileService';
import { calculateProfileMetrics } from '../services/metricsService';

const logger = createLogger({
  service: 'profile-controller',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Get Customer 360 view
 */
export async function getCustomer360(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          message: 'Profile ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    logger.info('Fetching Customer 360', { profile_id: id });

    const profile = await getProfileById(id);

    if (!profile) {
      return res.status(404).json({
        error: {
          message: 'Customer profile not found',
          code: 'NOT_FOUND',
        },
      });
    }

    res.json(profile);
  } catch (error) {
    logger.error('Failed to fetch Customer 360', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve customer profile',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Search customers
 * If no search parameters provided, returns all customers (paginated)
 */
export async function searchCustomers(req: Request, res: Response) {
  try {
    const { phone, email, device, loyalty_id, name, limit } = req.query;

    const limitNum = limit ? parseInt(limit as string) : 100;

    // If no search parameters, return all customers
    if (!phone && !email && !device && !loyalty_id && !name) {
      logger.info('Fetching all customers', { limit: limitNum });
      
      const db = getDb();
      const query = `
        SELECT 
          cp.*,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object(
              'id', pi.id,
              'profile_id', pi.profile_id,
              'type', pi.type,
              'value_hash', pi.value_hash,
              'created_at', pi.created_at
            )) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as identifiers
        FROM customer_profile cp
        LEFT JOIN profile_identifier pi ON pi.profile_id = cp.id
        WHERE cp.is_merged = false
        GROUP BY cp.id
        ORDER BY cp.last_seen_at DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limitNum]);
      
      return res.json({
        results: result.rows,
        count: result.rows.length,
      });
    }

    logger.info('Searching customers', { phone, email, device });

    const results = await searchProfiles({
      phone: phone as string,
      email: email as string,
      device: device as string,
      loyalty_id: loyalty_id as string,
      name: name as string,
      limit: limitNum,
    });

    res.json({
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Customer search failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to search customers',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get platform statistics
 */
export async function getStats(req: Request, res: Response) {
  try {
    const db = getDb();
    
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM customer_profile WHERE is_merged = false) as total_profiles,
        (SELECT COUNT(*) FROM customer_raw_event) as total_events,
        (SELECT COUNT(*) FROM identity_merge_log WHERE merge_type = 'auto') as total_merges,
        (SELECT SUM(total_spent) FROM customer_profile WHERE is_merged = false) as total_revenue,
        (SELECT AVG(total_spent) FROM customer_profile WHERE is_merged = false) as avg_revenue,
        (SELECT SUM(total_orders) FROM customer_profile WHERE is_merged = false) as total_orders,
        (SELECT AVG(avg_order_value) FROM customer_profile WHERE is_merged = false AND avg_order_value > 0) as avg_order_value
    `;
    
    const result = await db.query(query);
    
    res.json({
      totalProfiles: parseInt(result.rows[0].total_profiles) || 0,
      totalEvents: parseInt(result.rows[0].total_events) || 0,
      totalMerges: parseInt(result.rows[0].total_merges) || 0,
      totalRevenue: parseFloat(result.rows[0].total_revenue) || 0,
      avgRevenue: parseFloat(result.rows[0].avg_revenue) || 0,
      totalOrders: parseInt(result.rows[0].total_orders) || 0,
      avgOrderValue: parseFloat(result.rows[0].avg_order_value) || 0,
    });
  } catch (error) {
    logger.error('Failed to get stats', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve statistics',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get activity chart data (events and customers by day)
 */
export async function getActivityChart(req: Request, res: Response) {
  try {
    const db = getDb();
    const days = parseInt(req.query.days as string) || 7;
    
    // Get events by day
    const eventsQuery = `
      SELECT 
        DATE(received_at) as date,
        COUNT(*) as count
      FROM customer_raw_event
      WHERE received_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(received_at)
      ORDER BY DATE(received_at) ASC
    `;
    
    const eventsResult = await db.query(eventsQuery);
    
    // Get unique customers by day - count distinct profile_ids from events table
    // If events table doesn't have data, count distinct identifiers from raw events
    let customersResult;
    try {
      const customersQuery = `
        SELECT 
          DATE(event_ts) as date,
          COUNT(DISTINCT profile_id) as count
        FROM events
        WHERE event_ts >= NOW() - INTERVAL '${days} days'
          AND profile_id IS NOT NULL
        GROUP BY DATE(event_ts)
        ORDER BY DATE(event_ts) ASC
      `;
      customersResult = await db.query(customersQuery);
      
      // If no results, use fallback
      if (customersResult.rows.length === 0) {
        throw new Error('No events data');
      }
    } catch (error) {
      // Fallback: count distinct identifiers from raw events
      const fallbackQuery = `
        SELECT 
          DATE(received_at) as date,
          COUNT(DISTINCT 
            COALESCE(
              identifiers->>'phone',
              identifiers->>'email',
              id::text
            )
          ) as count
        FROM customer_raw_event
        WHERE received_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(received_at)
        ORDER BY DATE(received_at) ASC
      `;
      customersResult = await db.query(fallbackQuery);
    }
    
    // Create a map of dates to counts
    const eventsMap = new Map<string, number>();
    eventsResult.rows.forEach((row: any) => {
      eventsMap.set(row.date.toISOString().split('T')[0], parseInt(row.count));
    });
    
    const customersMap = new Map<string, number>();
    customersResult.rows.forEach((row: any) => {
      customersMap.set(row.date.toISOString().split('T')[0], parseInt(row.count));
    });
    
    // Generate array for last N days
    const data: Array<{ date: string; events: number; customers: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      data.push({
        date: dayName,
        events: eventsMap.get(dateStr) || 0,
        customers: customersMap.get(dateStr) || 0,
      });
    }
    
    res.json({ data });
  } catch (error) {
    logger.error('Failed to get activity chart data', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve activity chart data',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get recent activity feed
 */
export async function getRecentActivity(req: Request, res: Response) {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent activities from multiple sources
    const query = `
      (
        -- New profiles
        SELECT 
          'profile' as type,
          'New customer profile created' as title,
          COALESCE(cp.full_name, 'A customer') || ' was added to the database' as description,
          cp.created_at as activity_time
        FROM customer_profile cp
        WHERE cp.is_merged = false
        ORDER BY cp.created_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Merges
        SELECT 
          'merge' as type,
          'Identity merge completed' as title,
          '2 profiles were merged into one unified identity' as description,
          merged_at as activity_time
        FROM identity_merge_log
        ORDER BY merged_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Purchase events
        SELECT 
          'purchase' as type,
          'Purchase event captured' as title,
          COALESCE('₹' || revenue::text, '$0') || ' transaction from customer' as description,
          event_ts as activity_time
        FROM events
        WHERE event_type = 'order_placed' AND revenue > 0
        ORDER BY event_ts DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Nudges
        SELECT 
          'campaign' as type,
          'Nudge executed' as title,
          nudge_type || ' nudge sent via ' || channel as description,
          executed_at as activity_time
        FROM nudge_log
        ORDER BY executed_at DESC
        LIMIT ${limit}
      )
      UNION ALL
      (
        -- Intent detections
        SELECT 
          'intent' as type,
          'Intent detected' as title,
          COALESCE(intent, 'Unknown') || ' intent from ' || channel as description,
          created_at as activity_time
        FROM intent_message_log
        ORDER BY created_at DESC
        LIMIT ${limit}
      )
      ORDER BY activity_time DESC
      LIMIT ${limit}
    `;
    
    const result = await db.query(query);
    
    const activities = result.rows.map((row: any) => ({
      type: row.type,
      title: row.title,
      description: row.description,
      time: row.activity_time,
    }));
    
    res.json({ activities });
  } catch (error) {
    logger.error('Failed to get recent activity', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve recent activity',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get comprehensive analytics with time-series data
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const db = getDb();
    
    // Get overall stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM customer_profile WHERE is_merged = false) as total_profiles,
        (SELECT COUNT(*) FROM customer_raw_event) as total_events,
        (SELECT SUM(total_spent) FROM customer_profile WHERE is_merged = false) as total_revenue,
        (SELECT AVG(total_spent) FROM customer_profile WHERE is_merged = false) as avg_revenue,
        (SELECT SUM(total_orders) FROM customer_profile WHERE is_merged = false) as total_orders,
        (SELECT AVG(avg_order_value) FROM customer_profile WHERE is_merged = false AND avg_order_value > 0) as avg_order_value
    `;
    
    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Get revenue by day (last 30 days)
    const revenueByDayQuery = `
      SELECT 
        DATE(event_ts) as date,
        COUNT(*) as orders,
        SUM(
          CASE 
            WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
            WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
            WHEN payload->>'amount' IS NOT NULL THEN (payload->>'amount')::numeric
            ELSE 0
          END
        ) as revenue
      FROM customer_raw_event
      WHERE event_type = 'order_placed'
        AND event_ts >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(event_ts)
      ORDER BY DATE(event_ts) DESC
      LIMIT 30
    `;
    
    const revenueByDayResult = await db.query(revenueByDayQuery);
    // Reverse to chronological order for the chart (oldest to newest)
    const revenueByDayChrono = revenueByDayResult.rows.slice().reverse();
    
    // Get top cities
    const topCitiesQuery = `
      SELECT 
        city,
        COUNT(*) as count,
        SUM(total_spent) as revenue
      FROM customer_profile
      WHERE is_merged = false AND city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const topCitiesResult = await db.query(topCitiesQuery);
    
    // Get events by type
    const eventsByTypeQuery = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM customer_raw_event
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const eventsByTypeResult = await db.query(eventsByTypeQuery);
    
    // Get customer segments
    const segmentsQuery = `
      SELECT 
        CASE 
          WHEN total_spent >= 100000 THEN 'High Value'
          WHEN total_spent >= 20000 THEN 'Medium Value'
          ELSE 'New Customers'
        END as segment,
        COUNT(*) as count
      FROM customer_profile
      WHERE is_merged = false
      GROUP BY 
        CASE 
          WHEN total_spent >= 100000 THEN 'High Value'
          WHEN total_spent >= 20000 THEN 'Medium Value'
          ELSE 'New Customers'
        END
    `;
    
    const segmentsResult = await db.query(segmentsQuery);
    
    // Calculate trends (compare last 7 days vs previous 7 days)
    const trendQuery = `
      WITH recent_period AS (
        SELECT 
          SUM(
            CASE 
              WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
              WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
              ELSE 0
            END
          ) as revenue,
          COUNT(*) as orders
        FROM customer_raw_event
        WHERE event_type = 'order_placed'
          AND event_ts >= NOW() - INTERVAL '7 days'
      ),
      previous_period AS (
        SELECT 
          SUM(
            CASE 
              WHEN payload->>'total' IS NOT NULL THEN (payload->>'total')::numeric
              WHEN payload->>'price' IS NOT NULL THEN (payload->>'price')::numeric
              ELSE 0
            END
          ) as revenue,
          COUNT(*) as orders
        FROM customer_raw_event
        WHERE event_type = 'order_placed'
          AND event_ts >= NOW() - INTERVAL '14 days'
          AND event_ts < NOW() - INTERVAL '7 days'
      )
      SELECT 
        r.revenue as recent_revenue,
        p.revenue as previous_revenue,
        r.orders as recent_orders,
        p.orders as previous_orders,
        CASE 
          WHEN p.revenue > 0 THEN ((r.revenue - p.revenue) / p.revenue * 100)
          ELSE 0
        END as revenue_change_percent,
        CASE 
          WHEN p.orders > 0 THEN ((r.orders - p.orders) / p.orders * 100)
          ELSE 0
        END as orders_change_percent
      FROM recent_period r, previous_period p
    `;
    
    const trendResult = await db.query(trendQuery);
    const trends = trendResult.rows[0] || {
      recent_revenue: 0,
      previous_revenue: 0,
      recent_orders: 0,
      previous_orders: 0,
      revenue_change_percent: 0,
      orders_change_percent: 0,
    };
    
    res.json({
      totalProfiles: parseInt(stats.total_profiles) || 0,
      totalEvents: parseInt(stats.total_events) || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      avgRevenue: parseFloat(stats.avg_revenue) || 0,
      totalOrders: parseInt(stats.total_orders) || 0,
      avgOrderValue: parseFloat(stats.avg_order_value) || 0,
      revenueByDay: revenueByDayResult.rows.map(row => ({
        date: row.date,
        orders: parseInt(row.orders) || 0,
        revenue: parseFloat(row.revenue) || 0,
      })),
      topCities: topCitiesResult.rows.map(row => ({
        city: row.city,
        count: parseInt(row.count) || 0,
        revenue: parseFloat(row.revenue) || 0,
      })),
      eventsByType: eventsByTypeResult.rows.map(row => ({
        event_type: row.event_type,
        count: parseInt(row.count) || 0,
      })),
      segments: segmentsResult.rows.map(row => ({
        segment: row.segment,
        count: parseInt(row.count) || 0,
      })),
      trends: {
        revenueChangePercent: parseFloat(trends.revenue_change_percent) || 0,
        ordersChangePercent: parseFloat(trends.orders_change_percent) || 0,
        recentRevenue: parseFloat(trends.recent_revenue) || 0,
        previousRevenue: parseFloat(trends.previous_revenue) || 0,
        recentOrders: parseInt(trends.recent_orders) || 0,
        previousOrders: parseInt(trends.previous_orders) || 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get analytics', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve analytics',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Get customer timeline
 */
export async function getCustomerTimeline(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const timeline = await getTimeline(id, limit);

    res.json({
      profile_id: id,
      timeline,
      count: timeline.length,
    });
  } catch (error) {
    logger.error('Failed to get timeline', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to retrieve customer timeline',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

