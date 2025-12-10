/**
 * AI Assistant Service
 * Responsibilities:
 * - Answer queries using RAG (Retrieval Augmented Generation)
 * - Semantic search using pgvector
 * - Local LLM integration (Llama/Mistral via Ollama)
 * - Always provide citations (no hallucination)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@retail-brain/logger';
import { servicePorts, dbConfig } from '@retail-brain/config';
import { initDb } from '@retail-brain/db';
import assistantRoutes from './routes/assistant';

const logger = createLogger({
  service: 'ai-assistant',
  level: process.env.LOG_LEVEL || 'info',
  pretty: process.env.NODE_ENV === 'development',
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-assistant',
    timestamp: new Date().toISOString(),
  });
});

app.use('/assistant', assistantRoutes);

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

    const port = servicePorts.aiAssistant;
    app.listen(port, () => {
      logger.info(`AI Assistant listening on port ${port}`, { port });
    });
  } catch (error) {
    logger.fatal('Failed to start AI Assistant', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

start();

