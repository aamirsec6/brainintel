/**
 * Nudge Engine Service
 * Autonomous marketing engine that sends personalized nudges based on ML predictions
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import nudgeRoutes from './routes/nudges';

const logger = createLogger({
  service: 'nudge-engine',
});

const app = express();
const config = getConfig();
const PORT = config.servicePorts?.nudge || 3018;

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
app.use('/v1/nudges', nudgeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'nudge-engine' });
});

app.listen(PORT, () => {
  logger.info(`Nudge Engine service listening on port ${PORT}`);
});

