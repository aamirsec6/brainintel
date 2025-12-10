/**
 * Onboarding Service
 * Responsibilities:
 * - CSV import with auto-column mapping
 * - Webhook connectors (Shopify, WooCommerce, etc.)
 * - Bulk data import
 * - Data preview and validation
 * - Guided onboarding wizard
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { servicePorts, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import onboardingRoutes from './routes/onboarding';

const logger = createLogger({
  service: 'onboarding-service',
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV === 'development',
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'onboarding-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/onboarding', onboardingRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { message: 'Route not found', code: 'NOT_FOUND' },
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Request error', err);
  res.status(500).json({
    error: { message: err.message || 'Internal server error', code: 'INTERNAL_ERROR' },
  });
});

async function start() {
  try {
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected successfully');

    const port = servicePorts.onboarding;
    app.listen(port, () => {
      logger.info(`Onboarding Service listening on port ${port}`, { port });
    });
  } catch (error) {
    logger.fatal('Failed to start Onboarding Service', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

start();

