/**
 * Merge Log Service
 * Retrieves merge history and logs
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'merge-log-service',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Get merge logs with pagination
 */
export async function getMergeLogs(
  page: number = 1,
  limit: number = 50
): Promise<{ logs: any[]; total: number; page: number; pages: number }> {
  const db = getDb();

  try {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM identity_merge_log
    `;

    const countResult = await db.query<{ total: string }>(countQuery);
    const total = parseInt(countResult.rows[0].total);

    // Get logs
    const logsQuery = `
      SELECT 
        iml.id,
        iml.source_profile_id,
        iml.target_profile_id,
        iml.merge_type,
        iml.confidence_score,
        iml.reason,
        iml.triggered_by,
        iml.rolled_back,
        iml.rolled_back_at,
        iml.rolled_back_by,
        iml.rollback_reason,
        iml.merged_at,
        s.full_name as source_name,
        s.primary_email as source_email,
        t.full_name as target_name,
        t.primary_email as target_email
      FROM identity_merge_log iml
      LEFT JOIN customer_profile s ON s.id = iml.source_profile_id
      LEFT JOIN customer_profile t ON t.id = iml.target_profile_id
      ORDER BY iml.merged_at DESC
      LIMIT $1 OFFSET $2
    `;

    const logsResult = await db.query(logsQuery, [limit, offset]);

    return {
      logs: logsResult.rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error(
      'Failed to get merge logs',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Get merge log by ID
 */
export async function getMergeLogById(mergeLogId: string): Promise<any> {
  const db = getDb();

  try {
    const query = `
      SELECT 
        iml.*,
        s.full_name as source_name,
        t.full_name as target_name
      FROM identity_merge_log iml
      LEFT JOIN customer_profile s ON s.id = iml.source_profile_id
      LEFT JOIN customer_profile t ON t.id = iml.target_profile_id
      WHERE iml.id = $1
    `;

    const result = await db.query(query, [mergeLogId]);

    if (result.rows.length === 0) {
      throw new Error('Merge log not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error(
      'Failed to get merge log',
      error instanceof Error ? error : new Error(String(error)),
      { merge_log_id: mergeLogId }
    );
    throw error;
  }
}

