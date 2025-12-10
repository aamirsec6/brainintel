/**
 * Event Collector Service
 * Responsibilities:
 * - Accept incoming events via REST API
 * - Validate event schema (Zod)
 * - Store raw events in database
 * - Normalize and enrich events
 * - Forward to Identity Engine (Phase 3)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { servicePorts, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import eventRoutes from './routes/events';

const logger = createLogger({
  service: 'event-collector',
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV === 'development',
});

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'event-collector',
    timestamp: new Date().toISOString(),
  });
});

// Event routes
app.use('/events', eventRoutes);

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
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    error: {
      message: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

// Start server
async function start() {
  try {
    // Initialize database
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected successfully');

    // Start HTTP server
    const port = servicePorts.eventCollector;
    app.listen(port, () => {
      logger.info(`Event Collector listening on port ${port}`, {
        port,
        env: process.env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.fatal(
      'Failed to start Event Collector',
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start();

