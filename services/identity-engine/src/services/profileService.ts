/**
 * Profile Service
 * Creates and manages customer profiles
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { NormalizedIdentifiers } from '../../../event-collector/src/utils/normalize';

const logger = createLogger({
  service: 'profile-service',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Create a new customer profile
 */
export async function createProfile(
  normalized: NormalizedIdentifiers,
  rawIdentifiers: Record<string, unknown>
): Promise<string> {
  const db = getDb();

  return await db.transaction(async (client) => {
    try {
      // Extract profile data
      const firstName = (rawIdentifiers.first_name as string) || null;
      const lastName = (rawIdentifiers.last_name as string) || null;
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                       (rawIdentifiers.name as string) || null;

      const primaryPhone = normalized.phone?.raw || null;
      const primaryEmail = normalized.email?.raw || null;

      // Create profile
      const profileQuery = `
        INSERT INTO customer_profile (
          first_name,
          last_name,
          full_name,
          primary_phone,
          primary_email,
          first_seen_at,
          last_seen_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;

      const profileResult = await client.query(profileQuery, [
        firstName,
        lastName,
        fullName,
        primaryPhone,
        primaryEmail,
      ]);

      const profileId = profileResult.rows[0].id;

      logger.info('Created new profile', {
        profile_id: profileId,
        has_phone: !!normalized.phone,
        has_email: !!normalized.email,
      });

      // Add identifiers
      const identifierInserts = [];

      if (normalized.phone) {
        identifierInserts.push({
          type: 'phone',
          value: normalized.phone.raw,
          hash: normalized.phone.hash,
        });
      }

      if (normalized.email) {
        identifierInserts.push({
          type: 'email',
          value: normalized.email.raw,
          hash: normalized.email.hash,
        });
      }

      if (normalized.device) {
        identifierInserts.push({
          type: 'device',
          value: normalized.device.raw,
          hash: normalized.device.hash,
        });
      }

      if (normalized.cookie) {
        identifierInserts.push({
          type: 'cookie',
          value: normalized.cookie.raw,
          hash: normalized.cookie.hash,
        });
      }

      if (normalized.loyalty_id) {
        identifierInserts.push({
          type: 'loyalty_id',
          value: normalized.loyalty_id.raw,
          hash: normalized.loyalty_id.hash,
        });
      }

      if (normalized.invoice_id) {
        identifierInserts.push({
          type: 'invoice_id',
          value: normalized.invoice_id.raw,
          hash: normalized.invoice_id.hash,
        });
      }

      // Insert all identifiers
      for (const identifier of identifierInserts) {
        const identifierQuery = `
          INSERT INTO profile_identifier (
            profile_id,
            type,
            value,
            value_hash,
            confidence
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (profile_id, type, value_hash) DO NOTHING
        `;

        await client.query(identifierQuery, [
          profileId,
          identifier.type,
          identifier.value,
          identifier.hash,
          1.0,
        ]);
      }

      logger.info('Profile identifiers added', {
        profile_id: profileId,
        identifier_count: identifierInserts.length,
      });

      return profileId;
    } catch (error) {
      logger.error(
        'Profile creation failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  });
}

