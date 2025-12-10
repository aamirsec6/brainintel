/**
 * Journey Service
 * Tracks customer journeys across channels and calculates conversion paths
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import journeyRoutes from './routes/journey';

const logger = createLogger({ service: 'journey-service' });
const config = getConfig();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'journey-service' });
});

// Routes
app.use('/v1/journey', journeyRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.JOURNEY_SERVICE_PORT || 3011;

app.listen(PORT, () => {
  logger.info(`Journey service listening on port ${PORT}`);
});

