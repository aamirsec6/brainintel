/**
 * API Gateway - Entry point for all external requests
 * Responsibilities:
 * - Authentication (API keys)
 * - Rate limiting
 * - Request routing
 * - Request/response logging
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { apiGatewayConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import { dbConfig } from '@retail-brain/config';
import { requestIdMiddleware } from './middleware/requestId';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { logMiddleware } from './middleware/logging';
import apiRoutes from './routes';

const logger = createLogger({
  service: 'api-gateway',
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV === 'development',
});

const app = express();

// Trust proxy (for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware (order matters!)
app.use(requestIdMiddleware);
app.use(logMiddleware(logger));
app.use(rateLimitMiddleware);
app.use(authMiddleware); // Auth middleware skips webhooks automatically

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// API routes (includes webhooks which bypass auth)
app.use('/', apiRoutes);
app.use('/v1', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler(logger));

// Start server
async function start() {
  try {
    // Initialize database
    logger.info('Connecting to database...');
    const db = initDb(dbConfig);
    await db.connect();
    logger.info('Database connected successfully');

    // Start HTTP server
    const port = apiGatewayConfig.port;
    app.listen(port, () => {
      logger.info(`API Gateway listening on port ${port}`, {
        port,
        env: process.env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.fatal(
      'Failed to start API Gateway',
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

