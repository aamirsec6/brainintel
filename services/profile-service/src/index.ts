/**
 * Profile Service
 * Responsibilities:
 * - Retrieve customer profiles (Customer 360)
 * - Search customers by identifiers
 * - Calculate LTV and metrics
 * - Provide customer timeline
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { servicePorts, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import profileRoutes from './routes/profiles';

const logger = createLogger({
  service: 'profile-service',
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV === 'development',
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'profile-service',
    timestamp: new Date().toISOString(),
  });
});

// Profile routes
app.use('/profiles', profileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Request error', err);
  res.status(500).json({
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

async function start() {
  try {
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected successfully');

    const port = servicePorts.profileService;
    app.listen(port, () => {
      logger.info(`Profile Service listening on port ${port}`, { port });
    });
  } catch (error) {
    logger.fatal('Failed to start Profile Service', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();

