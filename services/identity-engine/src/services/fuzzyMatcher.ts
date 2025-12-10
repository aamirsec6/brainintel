/**
 * Fuzzy Matcher
 * Finds profiles using fuzzy matching on names, emails, etc.
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { stringSimilarity } from '@retail-brain/utils';
import { NormalizedIdentifiers } from '../../../event-collector/src/utils/normalize';

const logger = createLogger({
  service: 'fuzzy-matcher',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Find profiles using fuzzy matching
 */
export async function findFuzzyMatches(
  normalized: NormalizedIdentifiers,
  rawIdentifiers: Record<string, unknown>
): Promise<string[]> {
  const db = getDb();
  const candidates = new Set<string>();

  try {
    // Strategy 1: Email username similarity
    if (normalized.email) {
      const username = normalized.email.normalized.split('@')[0];
      
      const emailQuery = `
        SELECT DISTINCT pi.profile_id, pi.value
        FROM profile_identifier pi
        WHERE pi.type = 'email'
        LIMIT 1000
      `;

      const emailResult = await db.query<{ profile_id: string; value: string }>(
        emailQuery
      );

      emailResult.rows.forEach((row) => {
        const candidateUsername = row.value.split('@')[0];
        const similarity = stringSimilarity(username, candidateUsername);
        
        if (similarity >= 0.8) {
          candidates.add(row.profile_id);
        }
      });
    }

    // Strategy 2: Name similarity (if we add name to identifiers in future)
    const name = rawIdentifiers.name as string | undefined;
    if (name) {
      const nameQuery = `
        SELECT id, full_name
        FROM customer_profile
        WHERE full_name IS NOT NULL
        LIMIT 1000
      `;

      const nameResult = await db.query<{ id: string; full_name: string }>(
        nameQuery
      );

      nameResult.rows.forEach((row) => {
        const similarity = stringSimilarity(
          name.toLowerCase(),
          row.full_name.toLowerCase()
        );
        
        if (similarity >= 0.85) {
          candidates.add(row.id);
        }
      });
    }

    // Strategy 3: Phone partial match (last 7 digits)
    if (normalized.phone && normalized.phone.normalized.length >= 7) {
      const lastDigits = normalized.phone.normalized.slice(-7);
      
      const phoneQuery = `
        SELECT DISTINCT profile_id
        FROM profile_identifier
        WHERE type = 'phone'
        AND value LIKE '%' || $1
        LIMIT 100
      `;

      const phoneResult = await db.query<{ profile_id: string }>(
        phoneQuery,
        [lastDigits]
      );

      phoneResult.rows.forEach((row) => candidates.add(row.profile_id));
    }

    logger.debug('Fuzzy match search completed', {
      candidates_found: candidates.size,
    });

    return Array.from(candidates);
  } catch (error) {
    logger.error(
      'Fuzzy matching failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

