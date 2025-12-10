/**
 * Feature Store Routes
 */
import { Router, Request, Response } from 'express';
import { featureStoreController } from '../controllers/featureController';

export const featureStoreRouter = Router();

// Get all features for a profile
featureStoreRouter.get('/:profile_id', async (req: Request, res: Response) => {
  await featureStoreController.getProfileFeatures(req, res);
});

// Get specific feature for a profile
featureStoreRouter.get('/:profile_id/:feature_name', async (req: Request, res: Response) => {
  await featureStoreController.getFeature(req, res);
});

// Write features for a profile
featureStoreRouter.post('/:profile_id', async (req: Request, res: Response) => {
  await featureStoreController.writeFeatures(req, res);
});

// Batch retrieval
featureStoreRouter.post('/batch', async (req: Request, res: Response) => {
  await featureStoreController.getBatchFeatures(req, res);
});

// Get feature metadata
featureStoreRouter.get('/metadata/:feature_name', async (req: Request, res: Response) => {
  await featureStoreController.getFeatureMetadata(req, res);
});

// Register feature metadata
featureStoreRouter.post('/metadata', async (req: Request, res: Response) => {
  await featureStoreController.registerFeatureMetadata(req, res);
});

