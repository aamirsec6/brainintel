/**
 * Experiment Service
 * Manages A/B tests with randomization and statistical analysis
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import crypto from 'crypto';

const logger = createLogger({
  service: 'experiment-service',
});

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: string[];
  traffic_split: Record<string, number>; // e.g., { 'A': 50, 'B': 50 }
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
}

/**
 * Create a new experiment
 */
export async function createExperiment(params: {
  name: string;
  description?: string;
  variants: string[];
  traffic_split?: Record<string, number>;
  start_date?: string;
  end_date?: string;
}): Promise<Experiment> {
  const db = getDb();

  // Validate traffic split
  const trafficSplit = params.traffic_split || {};
  if (Object.keys(trafficSplit).length === 0) {
    // Default: equal split
    params.variants.forEach((variant) => {
      trafficSplit[variant] = 100 / params.variants.length;
    });
  }

  const totalSplit = Object.values(trafficSplit).reduce((sum, val) => sum + val, 0);
  if (Math.abs(totalSplit - 100) > 0.01) {
    throw new Error('Traffic split must sum to 100%');
  }

  const result = await db.query(
    `INSERT INTO ab_experiment (name, description, variants, traffic_split, start_date, end_date, status)
     VALUES ($1, $2, $3::text[], $4::jsonb, $5, $6, 'draft')
     RETURNING *`,
    [
      params.name,
      params.description || null,
      params.variants,
      JSON.stringify(trafficSplit),
      params.start_date || null,
      params.end_date || null,
    ]
  );

  return result.rows[0];
}

/**
 * Assign a variant to a profile (deterministic randomization)
 */
export async function assignVariant(experimentId: string, profileId: string): Promise<string> {
  const db = getDb();

  // Check if already assigned
  const existing = await db.query(
    `SELECT variant FROM ab_assignment
     WHERE experiment_id = $1 AND profile_id = $2`,
    [experimentId, profileId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].variant;
  }

  // Get experiment
  const experiment = await db.query(
    `SELECT * FROM ab_experiment WHERE id = $1 AND status = 'running'`,
    [experimentId]
  );

  if (experiment.rows.length === 0) {
    throw new Error('Experiment not found or not running');
  }

  const exp = experiment.rows[0];
  const variants = exp.variants;
  const trafficSplit = exp.traffic_split;

  // Deterministic assignment based on hash
  const hash = crypto
    .createHash('sha256')
    .update(`${experimentId}:${profileId}`)
    .digest('hex');

  const hashInt = parseInt(hash.substring(0, 8), 16);
  const randomValue = (hashInt % 10000) / 100; // 0-99.99

  // Assign based on traffic split
  let cumulative = 0;
  let assignedVariant = variants[0];

  for (const variant of variants) {
    cumulative += trafficSplit[variant] || 0;
    if (randomValue < cumulative) {
      assignedVariant = variant;
      break;
    }
  }

  // Store assignment
  await db.query(
    `INSERT INTO ab_assignment (experiment_id, profile_id, variant, assigned_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (experiment_id, profile_id) DO UPDATE SET variant = $3`,
    [experimentId, profileId, assignedVariant]
  );

  logger.info('Variant assigned', {
    experimentId,
    profileId,
    variant: assignedVariant,
  });

  return assignedVariant;
}

/**
 * Record a conversion event
 */
export async function recordConversion(
  experimentId: string,
  profileId: string,
  conversionType: string,
  value?: number
): Promise<void> {
  const db = getDb();

  // Verify assignment
  const assignment = await db.query(
    `SELECT variant FROM ab_assignment
     WHERE experiment_id = $1 AND profile_id = $2`,
    [experimentId, profileId]
  );

  if (assignment.rows.length === 0) {
    throw new Error('Profile not assigned to experiment');
  }

  // Record conversion
  await db.query(
    `INSERT INTO ab_conversion (experiment_id, profile_id, variant, conversion_type, value, converted_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [experimentId, profileId, assignment.rows[0].variant, conversionType, value || null]
  );

  logger.info('Conversion recorded', {
    experimentId,
    profileId,
    conversionType,
    value,
  });
}

/**
 * Get experiment results with statistical analysis
 */
export async function getExperimentResults(experimentId: string): Promise<any> {
  const db = getDb();

  // Get experiment
  const experiment = await db.query(
    `SELECT * FROM ab_experiment WHERE id = $1`,
    [experimentId]
  );

  if (experiment.rows.length === 0) {
    throw new Error('Experiment not found');
  }

  // Get assignments and conversions by variant
  const results = await db.query(
    `SELECT 
       a.variant,
       COUNT(DISTINCT a.profile_id) as assigned_count,
       COUNT(DISTINCT c.profile_id) as converted_count,
       COUNT(c.id) as total_conversions,
       COALESCE(SUM(c.value), 0) as total_value,
       COALESCE(AVG(c.value), 0) as avg_value
     FROM ab_assignment a
     LEFT JOIN ab_conversion c ON a.experiment_id = c.experiment_id 
       AND a.profile_id = c.profile_id
     WHERE a.experiment_id = $1
     GROUP BY a.variant`,
    [experimentId]
  );

  // Calculate conversion rates and uplift
  const variantResults = results.rows.map((row) => {
    const conversionRate = row.assigned_count > 0
      ? (row.converted_count / row.assigned_count) * 100
      : 0;

    return {
      variant: row.variant,
      assigned_count: parseInt(row.assigned_count),
      converted_count: parseInt(row.converted_count),
      conversion_rate: conversionRate,
      total_conversions: parseInt(row.total_conversions),
      total_value: parseFloat(row.total_value),
      avg_value: parseFloat(row.avg_value),
    };
  });

  // Calculate uplift vs control (first variant)
  const control = variantResults[0];
  const uplift = variantResults.map((variant) => {
    if (variant.variant === control.variant) {
      return { ...variant, uplift: 0 };
    }

    const upliftPercent = control.conversion_rate > 0
      ? ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100
      : variant.conversion_rate > 0 ? 100 : 0;

    return {
      ...variant,
      uplift: upliftPercent,
    };
  });

  return {
    experiment: experiment.rows[0],
    results: uplift,
    summary: {
      total_assigned: variantResults.reduce((sum, v) => sum + v.assigned_count, 0),
      total_converted: variantResults.reduce((sum, v) => sum + v.converted_count, 0),
      overall_conversion_rate: variantResults.reduce((sum, v) => sum + v.conversion_rate, 0) / variantResults.length,
    },
  };
}

/**
 * List all experiments
 */
export async function listExperiments(): Promise<Experiment[]> {
  const db = getDb();

  const result = await db.query(
    `SELECT * FROM ab_experiment ORDER BY created_at DESC`
  );

  return result.rows;
}

