/**
 * A/B Testing Service
 * Manages experiments, randomization, and uplift measurement
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import experimentRoutes from './routes/experiments';

const logger = createLogger({
  service: 'ab-testing-service',
});

const app = express();
const config = getConfig();
const PORT = config.servicePorts?.abTesting || 3019;

// Initialize and connect database
async function initializeDatabase() {
  try {
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', error instanceof Error ? error : new Error(String(error)));
  }
}

initializeDatabase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/v1/experiments', experimentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ab-testing-service' });
});

app.listen(PORT, () => {
  logger.info(`A/B Testing service listening on port ${PORT}`);
});

