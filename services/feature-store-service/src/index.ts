/**
 * Feature Store Service
 * Manages feature storage and retrieval for ML models
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import { featureStoreRouter } from './routes/features';

const logger = createLogger({ service: 'feature-store-service' });
const config = getConfig();

const app: Express = express();
const PORT = config.servicePorts.featureStore || 3014;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Routes
app.use('/v1/features', featureStoreRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'feature-store-service' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Feature Store Service started', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
  });
});

