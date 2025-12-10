/**
 * Nudge Service
 * Decision logic for autonomous nudges based on ML predictions
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import axios from 'axios';

const logger = createLogger({
  service: 'nudge-service',
});

const config = getConfig();
const ML_SCORER_URL = config.ML_SCORER_SERVICE_URL;

export interface NudgeDecision {
  should_nudge: boolean;
  nudge_type?: 'churn_prevention' | 'upsell' | 'cross_sell' | 're_engagement' | 'abandoned_cart';
  priority: number; // 0-1, higher = more urgent
  reason: string;
  predicted_churn_prob?: number;
  predicted_ltv?: number;
  action?: NudgeAction;
}

export interface NudgeAction {
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  template: string;
  personalization: Record<string, any>;
}

/**
 * Evaluate if a nudge should be sent to a profile
 */
export async function evaluateNudgeForProfile(profileId: string): Promise<NudgeDecision> {
  const db = getDb();

  try {
    // Fetch profile data
    const profileQuery = await db.query(
      `SELECT * FROM customer_profile WHERE id = $1`,
      [profileId]
    );

    if (profileQuery.rows.length === 0) {
      return {
        should_nudge: false,
        priority: 0,
        reason: 'Profile not found',
      };
    }

    const profile = profileQuery.rows[0];

    // Calculate days since last activity
    const lastSeenDate = profile.last_seen_at ? new Date(profile.last_seen_at) : new Date();
    const daysSinceLastActivity = Math.floor((Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24));
    profile.last_activity_days = daysSinceLastActivity;

    // Get ML predictions
    let churnProb = 0;
    let predictedLTV = 0;

    try {
      const churnResponse = await axios.post(
        `${ML_SCORER_URL}/v1/predict/churn`,
        { profile_id: profileId },
        { headers: { 'X-API-KEY': config.API_KEY }, timeout: 3000 }
      );
      churnProb = churnResponse.data.churn_probability || 0;
    } catch (error) {
      logger.warn('Churn prediction failed, using fallback', {
        profileId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const ltvResponse = await axios.post(
        `${ML_SCORER_URL}/v1/predict/ltv`,
        { profile_id: profileId },
        { headers: { 'X-API-KEY': config.API_KEY }, timeout: 3000 }
      );
      predictedLTV = ltvResponse.data.predicted_ltv || 0;
    } catch (error) {
      logger.warn('LTV prediction failed, using fallback', {
        profileId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Decision logic
    const decision = makeNudgeDecision(profile, churnProb, predictedLTV);

    return {
      ...decision,
      predicted_churn_prob: churnProb,
      predicted_ltv: predictedLTV,
    };
  } catch (error) {
    logger.error('Nudge evaluation failed', error instanceof Error ? error : new Error(String(error)));
    return {
      should_nudge: false,
      priority: 0,
      reason: 'Evaluation error',
    };
  }
}

/**
 * Make nudge decision based on profile and predictions
 */
function makeNudgeDecision(
  profile: any,
  churnProb: number,
  predictedLTV: number
): NudgeDecision {
  // Churn prevention (high priority)
  if (churnProb > 0.7) {
    return {
      should_nudge: true,
      nudge_type: 'churn_prevention',
      priority: 0.9,
      reason: `High churn risk (${(churnProb * 100).toFixed(1)}%)`,
      action: {
        channel: 'email',
        template: 'churn_prevention',
        personalization: {
          name: profile.full_name || 'Customer',
          discount: 15,
        },
      },
    };
  }

  // Re-engagement (medium-high priority)
  const daysSinceLastActivity = profile.last_activity_days || 999;
  if (daysSinceLastActivity > 30 && churnProb > 0.4) {
    return {
      should_nudge: true,
      nudge_type: 're_engagement',
      priority: 0.7,
      reason: `Inactive for ${daysSinceLastActivity} days`,
      action: {
        channel: 'email',
        template: 're_engagement',
        personalization: {
          name: profile.full_name || 'Customer',
          days_inactive: daysSinceLastActivity,
        },
      },
    };
  }

  // Upsell (medium priority, high LTV customers)
  if (predictedLTV > 10000 && profile.total_orders > 0) {
    return {
      should_nudge: true,
      nudge_type: 'upsell',
      priority: 0.6,
      reason: `High LTV potential (₹${predictedLTV.toFixed(0)})`,
      action: {
        channel: 'email',
        template: 'upsell',
        personalization: {
          name: profile.full_name || 'Customer',
        },
      },
    };
  }

  // Cross-sell (low-medium priority)
  if (profile.total_orders > 2 && churnProb < 0.3) {
    return {
      should_nudge: true,
      nudge_type: 'cross_sell',
      priority: 0.5,
      reason: 'Active customer, good cross-sell opportunity',
      action: {
        channel: 'email',
        template: 'cross_sell',
        personalization: {
          name: profile.full_name || 'Customer',
        },
      },
    };
  }

  // No nudge needed
  return {
    should_nudge: false,
    priority: 0,
    reason: 'No nudge criteria met',
  };
}

/**
 * Execute a nudge action
 */
export async function executeNudgeAction(
  profileId: string,
  nudgeType: string,
  action: NudgeAction
): Promise<{ success: boolean; message_id?: string }> {
  const db = getDb();

  try {
    // Log nudge execution with personalization data
    await db.query(
      `INSERT INTO nudge_log (
        profile_id, 
        nudge_type, 
        channel, 
        template, 
        personalization_data,
        executed_at
      )
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        profileId, 
        nudgeType, 
        action.channel, 
        action.template,
        JSON.stringify(action.personalization || {})
      ]
    );

    // In production, this would integrate with email/SMS/push services
    logger.info('Nudge executed', {
      profileId,
      nudgeType,
      channel: action.channel,
      template: action.template,
    });

    // TODO: Integrate with actual messaging services
    // - Email: SendGrid, AWS SES
    // - SMS: Twilio, AWS SNS
    // - Push: Firebase, OneSignal
    // - WhatsApp: Twilio API

    return {
      success: true,
      message_id: `nudge-${Date.now()}`,
    };
  } catch (error) {
    logger.error('Nudge execution failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
    };
  }
}

/**
 * Get nudge history for a profile
 */
export async function getNudgeHistoryForProfile(profileId: string): Promise<any[]> {
  const db = getDb();

  try {
    const result = await db.query(
      `SELECT 
        nl.*,
        cp.full_name,
        cp.primary_email
       FROM nudge_log nl
       LEFT JOIN customer_profile cp ON cp.id = nl.profile_id
       WHERE nl.profile_id = $1
       ORDER BY nl.executed_at DESC
       LIMIT 50`,
      [profileId]
    );

    // Format the results
    return result.rows.map(row => ({
      profile_id: row.profile_id,
      nudge_type: row.nudge_type,
      action: {
        type: row.template,
        channel: row.channel,
        personalization: row.personalization_data || {},
      },
      executed_at: row.executed_at,
      result: 'sent',
    }));
  } catch (error) {
    logger.error('Failed to fetch nudge history', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

