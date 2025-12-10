/**
 * Pricing Service
 * Channel-specific and segment-based pricing management
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import pricingRoutes from './routes/pricing';

const logger = createLogger({ service: 'pricing-service' });
const config = getConfig();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pricing-service' });
});

// Routes
app.use('/v1/pricing', pricingRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.PRICING_SERVICE_PORT || 3010;

app.listen(PORT, () => {
  logger.info(`Pricing service listening on port ${PORT}`);
});

