/**
 * Review Queue Service
 * Manages manual review queue for medium-confidence matches
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'review-queue',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Queue a pair of profiles for manual review
 */
export async function queueForReview(
  sourceProfileId: string,
  targetProfileId: string,
  confidenceScore: number
): Promise<void> {
  const db = getDb();

  try {
    // For now, we'll create a merge log entry with "pending_review" status
    // In a production system, this might go to a separate review queue table
    const query = `
      INSERT INTO identity_merge_log (
        source_profile_id,
        target_profile_id,
        merge_type,
        confidence_score,
        reason,
        source_snapshot,
        target_snapshot,
        scoring_details
      )
      SELECT 
        $1,
        $2,
        'pending_review'::merge_status,
        $3,
        'Medium confidence match - requires manual review',
        row_to_json(s.*)::jsonb,
        row_to_json(t.*)::jsonb,
        '{}'::jsonb
      FROM customer_profile s
      CROSS JOIN customer_profile t
      WHERE s.id = $1 AND t.id = $2
    `;

    await db.query(query, [sourceProfileId, targetProfileId, confidenceScore]);

    logger.info('Profiles queued for review', {
      source_profile_id: sourceProfileId,
      target_profile_id: targetProfileId,
      confidence_score: confidenceScore,
    });
  } catch (error) {
    logger.error(
      'Failed to queue for review',
      error instanceof Error ? error : new Error(String(error)),
      {
        source_profile_id: sourceProfileId,
        target_profile_id: targetProfileId,
      }
    );
    throw error;
  }
}

/**
 * Get pending reviews
 */
export async function getPendingReviews(
  page: number = 1,
  limit: number = 50
): Promise<any[]> {
  const db = getDb();

  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        iml.id,
        iml.source_profile_id,
        iml.target_profile_id,
        iml.confidence_score,
        iml.reason,
        iml.merged_at as queued_at,
        s.full_name as source_name,
        s.primary_email as source_email,
        s.primary_phone as source_phone,
        t.full_name as target_name,
        t.primary_email as target_email,
        t.primary_phone as target_phone
      FROM identity_merge_log iml
      JOIN customer_profile s ON s.id = iml.source_profile_id
      JOIN customer_profile t ON t.id = iml.target_profile_id
      WHERE iml.merge_type = 'pending_review'
        AND iml.rolled_back = false
      ORDER BY iml.merged_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    return result.rows;
  } catch (error) {
    logger.error(
      'Failed to get pending reviews',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

