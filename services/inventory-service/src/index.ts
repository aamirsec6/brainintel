/**
 * Inventory Service
 * Real-time inventory tracking across channels and warehouses
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import inventoryRoutes from './routes/inventory';

const logger = createLogger({ service: 'inventory-service' });
const config = getConfig();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service' });
});

// Routes
app.use('/v1/inventory', inventoryRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.INVENTORY_SERVICE_PORT || 3009;

app.listen(PORT, () => {
  logger.info(`Inventory service listening on port ${PORT}`);
});

