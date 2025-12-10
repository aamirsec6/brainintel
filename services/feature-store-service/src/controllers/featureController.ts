/**
 * Feature Store Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { featureStoreService } from '../services/featureStore';

const logger = createLogger({ service: 'feature-store-controller' });

export const featureStoreController = {
  async getProfileFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { profile_id } = req.params;
      const { dataset_id } = req.query;

      const features = await featureStoreService.getProfileFeatures(
        profile_id,
        dataset_id as string | undefined
      );

      res.json({
        profile_id,
        features,
      });
    } catch (error) {
      logger.error('Failed to get profile features', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to retrieve features',
          code: 'FEATURE_RETRIEVAL_ERROR',
        },
      });
    }
  },

  async getFeature(req: Request, res: Response): Promise<void> {
    try {
      const { profile_id, feature_name } = req.params;
      const { dataset_id } = req.query;

      const feature = await featureStoreService.getFeature(
        profile_id,
        feature_name,
        dataset_id as string | undefined
      );

      if (!feature) {
        res.status(404).json({
          error: {
            message: 'Feature not found',
            code: 'FEATURE_NOT_FOUND',
          },
        });
        return;
      }

      res.json(feature);
    } catch (error) {
      logger.error('Failed to get feature', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to retrieve feature',
          code: 'FEATURE_RETRIEVAL_ERROR',
        },
      });
    }
  },

  async writeFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { profile_id } = req.params;
      const { features, dataset_id } = req.body;

      if (!features || !Array.isArray(features)) {
        res.status(400).json({
          error: {
            message: 'Features array is required',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      await featureStoreService.writeFeatures(profile_id, features, dataset_id);

      res.json({
        status: 'success',
        profile_id,
        features_written: features.length,
      });
    } catch (error) {
      logger.error('Failed to write features', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to write features',
          code: 'FEATURE_WRITE_ERROR',
        },
      });
    }
  },

  async getBatchFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { profile_ids, feature_names, dataset_id } = req.body;

      if (!profile_ids || !Array.isArray(profile_ids)) {
        res.status(400).json({
          error: {
            message: 'profile_ids array is required',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      const features = await featureStoreService.getBatchFeatures(
        profile_ids,
        feature_names,
        dataset_id
      );

      res.json({
        features,
      });
    } catch (error) {
      logger.error('Failed to get batch features', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to retrieve batch features',
          code: 'FEATURE_BATCH_ERROR',
        },
      });
    }
  },

  async getFeatureMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { feature_name } = req.params;

      const metadata = await featureStoreService.getFeatureMetadata(feature_name);

      if (!metadata) {
        res.status(404).json({
          error: {
            message: 'Feature metadata not found',
            code: 'METADATA_NOT_FOUND',
          },
        });
        return;
      }

      res.json(metadata);
    } catch (error) {
      logger.error('Failed to get feature metadata', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to retrieve feature metadata',
          code: 'METADATA_RETRIEVAL_ERROR',
        },
      });
    }
  },

  async registerFeatureMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { feature_name, description, feature_type, schema_definition } = req.body;

      if (!feature_name || !feature_type) {
        res.status(400).json({
          error: {
            message: 'feature_name and feature_type are required',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      const metadata = await featureStoreService.registerFeatureMetadata({
        feature_name,
        description,
        feature_type,
        schema_definition,
      });

      res.json({
        status: 'success',
        metadata,
      });
    } catch (error) {
      logger.error('Failed to register feature metadata', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: {
          message: 'Failed to register feature metadata',
          code: 'METADATA_REGISTRATION_ERROR',
        },
      });
    }
  },
};

