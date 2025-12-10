/**
 * CSV Service
 * Parse and import CSV files
 */
import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import { generateHash, normalizePhone, normalizeEmail } from '@retail-brain/utils';

const logger = createLogger({ service: 'csv-service' });

/**
 * Parse CSV file
 */
export async function parseCSV(filePath: string): Promise<Record<string, string>[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  } catch (error) {
    logger.error('CSV parsing failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Auto-detect column mapping
 */
export function detectColumns(row: Record<string, string>): Record<string, string> {
  const mapping: Record<string, string> = {};
  const columns = Object.keys(row);

  // Phone detection
  const phoneColumns = ['phone', 'mobile', 'cell', 'telephone', 'contact'];
  for (const col of columns) {
    if (phoneColumns.some(p => col.toLowerCase().includes(p))) {
      mapping.phone = col;
      break;
    }
  }

  // Email detection
  const emailColumns = ['email', 'e-mail', 'mail'];
  for (const col of columns) {
    if (emailColumns.some(e => col.toLowerCase().includes(e))) {
      mapping.email = col;
      break;
    }
  }

  // Name detection
  const nameColumns = ['name', 'full_name', 'fullname', 'customer_name'];
  for (const col of columns) {
    if (nameColumns.some(n => col.toLowerCase().includes(n))) {
      mapping.name = col;
      break;
    }
  }

  // First name
  const firstNameColumns = ['first_name', 'firstname', 'fname'];
  for (const col of columns) {
    if (firstNameColumns.some(f => col.toLowerCase().includes(f))) {
      mapping.first_name = col;
      break;
    }
  }

  // Last name
  const lastNameColumns = ['last_name', 'lastname', 'lname'];
  for (const col of columns) {
    if (lastNameColumns.some(l => col.toLowerCase().includes(l))) {
      mapping.last_name = col;
      break;
    }
  }

  logger.debug('Column mapping detected', { mapping });

  return mapping;
}

/**
 * Import customers from CSV
 */
export async function importCustomersFromCSV(
  filePath: string,
  columnMapping: Record<string, string>
): Promise<{ created: number; updated: number; errors: number; duration: number }> {
  const db = getDb();
  const startTime = Date.now();
  
  let created = 0;
  let updated = 0;
  let errors = 0;

  try {
    const rows = await parseCSV(filePath);

    logger.info('Starting CSV import', { total_rows: rows.length });

    for (const row of rows) {
      try {
        await db.transaction(async (client) => {
          // Extract data using column mapping
          const phone = row[columnMapping.phone || 'phone'];
          const email = row[columnMapping.email || 'email'];
          const firstName = row[columnMapping.first_name || 'first_name'];
          const lastName = row[columnMapping.last_name || 'last_name'];
          const fullName = row[columnMapping.name || 'name'] || 
                          (firstName && lastName ? `${firstName} ${lastName}` : null);

          if (!phone && !email) {
            errors++;
            return; // Skip rows without identifiers
          }

          // Check if profile exists
          let profileId: string | null = null;

          if (phone) {
            const phoneHash = generateHash(normalizePhone(phone));
            const existingQuery = `
              SELECT profile_id 
              FROM profile_identifier 
              WHERE type = 'phone' AND value_hash = $1
              LIMIT 1
            `;
            const existing = await client.query(existingQuery, [phoneHash]);
            
            if (existing.rows.length > 0) {
              profileId = existing.rows[0].profile_id;
              updated++;
            }
          }

          if (!profileId && email) {
            const emailHash = generateHash(normalizeEmail(email));
            const existingQuery = `
              SELECT profile_id 
              FROM profile_identifier 
              WHERE type = 'email' AND value_hash = $1
              LIMIT 1
            `;
            const existing = await client.query(existingQuery, [emailHash]);
            
            if (existing.rows.length > 0) {
              profileId = existing.rows[0].profile_id;
              updated++;
            }
          }

          if (!profileId) {
            // Create new profile
            const createProfileQuery = `
              INSERT INTO customer_profile (
                first_name,
                last_name,
                full_name,
                primary_phone,
                primary_email
              ) VALUES ($1, $2, $3, $4, $5)
              RETURNING id
            `;

            const result = await client.query(createProfileQuery, [
              firstName || null,
              lastName || null,
              fullName || null,
              phone || null,
              email || null,
            ]);

            profileId = result.rows[0].id;
            created++;

            // Add identifiers
            if (phone) {
              const phoneHash = generateHash(normalizePhone(phone));
              await client.query(
                `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
                 VALUES ($1, 'phone', $2, $3) 
                 ON CONFLICT (profile_id, type, value_hash) DO NOTHING`,
                [profileId, phone, phoneHash]
              );
            }

            if (email) {
              const emailHash = generateHash(normalizeEmail(email));
              await client.query(
                `INSERT INTO profile_identifier (profile_id, type, value, value_hash) 
                 VALUES ($1, 'email', $2, $3) 
                 ON CONFLICT (profile_id, type, value_hash) DO NOTHING`,
                [profileId, email, emailHash]
              );
            }
          }
        });
      } catch (error) {
        errors++;
        logger.warn('Failed to import row', { error: (error as Error).message });
      }
    }

    const duration = Date.now() - startTime;

    logger.info('CSV import completed', {
      created,
      updated,
      errors,
      duration_ms: duration,
    });

    return { created, updated, errors, duration };
  } catch (error) {
    logger.error('CSV import failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

