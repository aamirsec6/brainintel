/**
 * Exact Matcher
 * Finds profiles with exact identifier matches
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { NormalizedIdentifiers } from '../../../event-collector/src/utils/normalize';

const logger = createLogger({
  service: 'exact-matcher',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Find profiles with exact identifier matches
 * Matches on hashed values of phone, email, device, etc.
 */
export async function findExactMatches(
  normalized: NormalizedIdentifiers
): Promise<string[]> {
  const db = getDb();
  const profileIds = new Set<string>();

  try {
    // Collect all hashes to search for
    const hashes: { type: string; hash: string }[] = [];

    if (normalized.phone) {
      hashes.push({ type: 'phone', hash: normalized.phone.hash });
    }
    if (normalized.email) {
      hashes.push({ type: 'email', hash: normalized.email.hash });
    }
    if (normalized.device) {
      hashes.push({ type: 'device', hash: normalized.device.hash });
    }
    if (normalized.cookie) {
      hashes.push({ type: 'cookie', hash: normalized.cookie.hash });
    }
    if (normalized.loyalty_id) {
      hashes.push({ type: 'loyalty_id', hash: normalized.loyalty_id.hash });
    }
    if (normalized.invoice_id) {
      hashes.push({ type: 'invoice_id', hash: normalized.invoice_id.hash });
    }

    if (hashes.length === 0) {
      logger.warn('No identifiers provided for exact matching');
      return [];
    }

    // Query for matching profiles
    const query = `
      SELECT DISTINCT profile_id
      FROM profile_identifier
      WHERE (type, value_hash) IN (
        ${hashes.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
      )
    `;

    const values = hashes.flatMap((h) => [h.type, h.hash]);

    const result = await db.query<{ profile_id: string }>(query, values);

    result.rows.forEach((row) => profileIds.add(row.profile_id));

    logger.debug('Exact match search completed', {
      identifiers_searched: hashes.length,
      profiles_found: profileIds.size,
    });

    return Array.from(profileIds);
  } catch (error) {
    logger.error(
      'Exact matching failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

