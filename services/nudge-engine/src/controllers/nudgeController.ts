/**
 * Nudge Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import { evaluateNudgeForProfile, executeNudgeAction, getNudgeHistoryForProfile } from '../services/nudgeService';

const logger = createLogger({
  service: 'nudge-controller',
});

export async function evaluateNudge(req: Request, res: Response) {
  try {
    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({
        error: { message: 'profile_id is required', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Evaluating nudge', { profile_id });

    const nudgeDecision = await evaluateNudgeForProfile(profile_id);

    res.json({
      profile_id,
      nudge: nudgeDecision,
      evaluated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to evaluate nudge', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to evaluate nudge', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function executeNudge(req: Request, res: Response) {
  try {
    const { profile_id, nudge_type, action } = req.body;

    if (!profile_id || !nudge_type || !action) {
      return res.status(400).json({
        error: { message: 'profile_id, nudge_type, and action are required', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Executing nudge', { profile_id, nudge_type, action });

    const result = await executeNudgeAction(profile_id, nudge_type, action);

    res.json({
      profile_id,
      nudge_type,
      action,
      result,
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to execute nudge', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to execute nudge', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function getNudgeHistory(req: Request, res: Response) {
  try {
    const { profile_id } = req.params;

    logger.info('Fetching nudge history', { profile_id });

    const history = await getNudgeHistoryForProfile(profile_id);

    res.json({
      profile_id,
      nudges: history,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch nudge history', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to fetch nudge history', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Get all recent nudge executions (across all profiles)
 */
export async function getRecentNudges(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const db = getDb();

    const result = await db.query(
      `SELECT 
        nl.*,
        cp.full_name,
        cp.primary_email,
        cp.primary_phone
       FROM nudge_log nl
       LEFT JOIN customer_profile cp ON cp.id = nl.profile_id
       ORDER BY nl.executed_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      nudges: result.rows,
      count: result.rows.length,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch recent nudges', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to fetch recent nudges', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Evaluate nudges for multiple customers (bulk evaluation)
 */
export async function evaluateBulkNudges(req: Request, res: Response) {
  try {
    const { limit = 100, auto_execute = false } = req.body;
    const db = getDb();

    // Get customers who haven't been nudged recently or at all
    const customersQuery = await db.query(
      `SELECT cp.id, cp.full_name, cp.total_spent, cp.total_orders, cp.last_seen_at
       FROM customer_profile cp
       WHERE cp.is_merged = false
         AND (cp.total_spent > 0 OR cp.total_orders > 0)
       ORDER BY cp.last_seen_at DESC
       LIMIT $1`,
      [limit]
    );

    const customers = customersQuery.rows;
    const results = [];

    for (const customer of customers) {
      try {
        const decision = await evaluateNudgeForProfile(customer.id);
        
        if (decision.should_nudge && decision.action) {
          results.push({
            profile_id: customer.id,
            customer_name: customer.full_name,
            nudge: decision,
          });

          // Auto-execute if enabled
          if (auto_execute && decision.action) {
            await executeNudgeAction(customer.id, decision.nudge_type!, decision.action);
          }
        }
      } catch (error) {
        logger.warn('Failed to evaluate nudge for customer', {
          profile_id: customer.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    res.json({
      evaluated: customers.length,
      nudges_recommended: results.length,
      results,
      auto_executed: auto_execute,
      evaluated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to evaluate bulk nudges', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to evaluate bulk nudges', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Get nudge statistics
 */
export async function getNudgeStats(req: Request, res: Response) {
  try {
    const db = getDb();

    const statsQuery = await db.query(
      `SELECT 
        COUNT(*) as total_nudges,
        COUNT(DISTINCT profile_id) as unique_customers,
        COUNT(DISTINCT nudge_type) as nudge_types,
        COUNT(*) FILTER (WHERE executed_at >= NOW() - INTERVAL '24 hours') as nudges_today,
        COUNT(*) FILTER (WHERE executed_at >= NOW() - INTERVAL '7 days') as nudges_this_week
       FROM nudge_log`
    );

    const byTypeQuery = await db.query(
      `SELECT 
        nudge_type,
        COUNT(*) as count
       FROM nudge_log
       GROUP BY nudge_type
       ORDER BY count DESC`
    );

    const byChannelQuery = await db.query(
      `SELECT 
        channel,
        COUNT(*) as count
       FROM nudge_log
       GROUP BY channel
       ORDER BY count DESC`
    );

    res.json({
      stats: statsQuery.rows[0],
      by_type: byTypeQuery.rows,
      by_channel: byChannelQuery.rows,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch nudge stats', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to fetch nudge stats', code: 'INTERNAL_ERROR' },
    });
  }
}

