/**
 * Feature Store Service
 * Manages feature storage and retrieval (Postgres + Redis)
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import Redis from 'ioredis';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({ service: 'feature-store' });
const config = getConfig();

let redis: Redis | null = null;

// Initialize Redis connection
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
      password: config.REDIS_PASSWORD || undefined,
      keyPrefix: 'feature:',
      ttl: 3600, // 1 hour default TTL
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error', error);
    });
  }
  return redis;
}

export interface FeatureValue {
  feature_name: string;
  feature_value: unknown;
  feature_type: string;
  computed_at: Date;
  dataset_id?: string;
}

export interface FeatureMetadata {
  feature_name: string;
  description?: string;
  feature_type: string;
  version: number;
  schema_definition?: Record<string, unknown>;
}

export const featureStoreService = {
  /**
   * Get all features for a profile
   */
  async getProfileFeatures(
    profileId: string,
    datasetId?: string
  ): Promise<FeatureValue[]> {
    const db = getDb();
    const redisClient = getRedis();

    // Try Redis cache first
    const cacheKey = `profile:${profileId}:${datasetId || 'latest'}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Feature cache hit', { profile_id: profileId });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read failed', error instanceof Error ? error : new Error(String(error)));
    }

    // Query database
    let query = `
      SELECT 
        feature_name,
        feature_value,
        feature_type,
        computed_at,
        dataset_id
      FROM feature_values
      WHERE profile_id = $1
    `;
    const params: unknown[] = [profileId];

    if (datasetId) {
      query += ' AND dataset_id = $2';
      params.push(datasetId);
    } else {
      // Get latest features
      query += `
        AND computed_at = (
          SELECT MAX(computed_at)
          FROM feature_values fv2
          WHERE fv2.profile_id = feature_values.profile_id
            AND fv2.feature_name = feature_values.feature_name
        )
      `;
    }

    query += ' ORDER BY feature_name';

    const result = await db.query<{
      feature_name: string;
      feature_value: unknown;
      feature_type: string;
      computed_at: Date;
      dataset_id: string | null;
    }>(query, params);

    const features: FeatureValue[] = result.rows.map((row) => ({
      feature_name: row.feature_name,
      feature_value: row.feature_value,
      feature_type: row.feature_type,
      computed_at: row.computed_at,
      dataset_id: row.dataset_id || undefined,
    }));

    // Cache in Redis
    try {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(features));
    } catch (error) {
      logger.warn('Redis cache write failed', error instanceof Error ? error : new Error(String(error)));
    }

    return features;
  },

  /**
   * Get specific feature for a profile
   */
  async getFeature(
    profileId: string,
    featureName: string,
    datasetId?: string
  ): Promise<FeatureValue | null> {
    const db = getDb();

    let query = `
      SELECT 
        feature_name,
        feature_value,
        feature_type,
        computed_at,
        dataset_id
      FROM feature_values
      WHERE profile_id = $1 AND feature_name = $2
    `;
    const params: unknown[] = [profileId, featureName];

    if (datasetId) {
      query += ' AND dataset_id = $3';
      params.push(datasetId);
    } else {
      query += ' ORDER BY computed_at DESC LIMIT 1';
    }

    const result = await db.query<{
      feature_name: string;
      feature_value: unknown;
      feature_type: string;
      computed_at: Date;
      dataset_id: string | null;
    }>(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      feature_name: row.feature_name,
      feature_value: row.feature_value,
      feature_type: row.feature_type,
      computed_at: row.computed_at,
      dataset_id: row.dataset_id || undefined,
    };
  },

  /**
   * Write features for a profile
   */
  async writeFeatures(
    profileId: string,
    features: Array<{
      feature_name: string;
      feature_value: unknown;
      feature_type: string;
      dataset_id?: string;
    }>,
    datasetId?: string
  ): Promise<void> {
    const db = getDb();
    const redisClient = getRedis();

    // Insert features in transaction
    await db.query('BEGIN');

    try {
      for (const feature of features) {
        await db.query(
          `
          INSERT INTO feature_values (
            profile_id,
            feature_name,
            feature_value,
            feature_type,
            dataset_id,
            computed_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT DO NOTHING
        `,
          [
            profileId,
            feature.feature_name,
            JSON.stringify(feature.feature_value),
            feature.feature_type,
            feature.dataset_id || datasetId || null,
          ]
        );
      }

      await db.query('COMMIT');

      // Invalidate cache
      const cacheKey = `profile:${profileId}:*`;
      try {
        const keys = await redisClient.keys(cacheKey);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (error) {
        logger.warn('Cache invalidation failed', error instanceof Error ? error : new Error(String(error)));
      }

      logger.info('Features written', {
        profile_id: profileId,
        feature_count: features.length,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },

  /**
   * Batch retrieval of features
   */
  async getBatchFeatures(
    profileIds: string[],
    featureNames?: string[],
    datasetId?: string
  ): Promise<Record<string, FeatureValue[]>> {
    const db = getDb();

    let query = `
      SELECT 
        profile_id,
        feature_name,
        feature_value,
        feature_type,
        computed_at,
        dataset_id
      FROM feature_values
      WHERE profile_id = ANY($1)
    `;
    const params: unknown[] = [profileIds];

    if (featureNames && featureNames.length > 0) {
      query += ' AND feature_name = ANY($2)';
      params.push(featureNames);
    }

    if (datasetId) {
      query += ` AND dataset_id = $${params.length + 1}`;
      params.push(datasetId);
    } else {
      // Get latest features
      query += `
        AND computed_at = (
          SELECT MAX(computed_at)
          FROM feature_values fv2
          WHERE fv2.profile_id = feature_values.profile_id
            AND fv2.feature_name = feature_values.feature_name
        )
      `;
    }

    query += ' ORDER BY profile_id, feature_name';

    const result = await db.query<{
      profile_id: string;
      feature_name: string;
      feature_value: unknown;
      feature_type: string;
      computed_at: Date;
      dataset_id: string | null;
    }>(query, params);

    // Group by profile_id
    const featuresByProfile: Record<string, FeatureValue[]> = {};

    for (const row of result.rows) {
      if (!featuresByProfile[row.profile_id]) {
        featuresByProfile[row.profile_id] = [];
      }

      featuresByProfile[row.profile_id].push({
        feature_name: row.feature_name,
        feature_value: row.feature_value,
        feature_type: row.feature_type,
        computed_at: row.computed_at,
        dataset_id: row.dataset_id || undefined,
      });
    }

    return featuresByProfile;
  },

  /**
   * Get feature metadata
   */
  async getFeatureMetadata(featureName: string): Promise<FeatureMetadata | null> {
    const db = getDb();

    const result = await db.query<{
      feature_name: string;
      description: string | null;
      feature_type: string;
      version: number;
      schema_definition: unknown;
    }>(
      `
      SELECT 
        feature_name,
        description,
        feature_type,
        version,
        schema_definition
      FROM feature_metadata
      WHERE feature_name = $1
      ORDER BY version DESC
      LIMIT 1
    `,
      [featureName]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      feature_name: row.feature_name,
      description: row.description || undefined,
      feature_type: row.feature_type,
      version: row.version,
      schema_definition: row.schema_definition as Record<string, unknown> | undefined,
    };
  },

  /**
   * Register feature metadata
   */
  async registerFeatureMetadata(metadata: {
    feature_name: string;
    description?: string;
    feature_type: string;
    schema_definition?: Record<string, unknown>;
  }): Promise<FeatureMetadata> {
    const db = getDb();

    // Get current version
    const versionResult = await db.query<{ version: number }>(
      `
      SELECT MAX(version) as version
      FROM feature_metadata
      WHERE feature_name = $1
    `,
      [metadata.feature_name]
    );

    const currentVersion = versionResult.rows[0]?.version || 0;
    const newVersion = currentVersion + 1;

    // Insert new version
    await db.query(
      `
      INSERT INTO feature_metadata (
        feature_name,
        description,
        feature_type,
        version,
        schema_definition
      ) VALUES ($1, $2, $3, $4, $5)
    `,
      [
        metadata.feature_name,
        metadata.description || null,
        metadata.feature_type,
        newVersion,
        metadata.schema_definition ? JSON.stringify(metadata.schema_definition) : null,
      ]
    );

    return {
      feature_name: metadata.feature_name,
      description: metadata.description,
      feature_type: metadata.feature_type,
      version: newVersion,
      schema_definition: metadata.schema_definition,
    };
  },
};

