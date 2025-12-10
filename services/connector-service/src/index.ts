/**
 * Connector Service
 * Polls external APIs (Shopify, WooCommerce, BigCommerce) and syncs data
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import connectorRoutes from './routes/connectors';
import { startScheduledSyncs } from './services/syncScheduler';

const logger = createLogger({ service: 'connector-service' });
const config = getConfig();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'connector-service' });
});

// Routes
app.use('/connectors', connectorRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.CONNECTOR_SERVICE_PORT || 3008;

app.listen(PORT, async () => {
  logger.info(`Connector service listening on port ${PORT}`);
  
  // Start scheduled syncs
  await startScheduledSyncs();
});

