/**
 * AI Assistant Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { processQuery } from '../services/queryProcessor';
import { generateEmbeddingVector } from '../services/embeddingService';

const logger = createLogger({
  service: 'assistant-controller',
});

/**
 * Query the AI assistant
 */
export async function queryAssistant(req: Request, res: Response) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: {
          message: 'Question is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    logger.info('Processing AI query', { question });

    const result = await processQuery(question);

    res.json(result);
  } catch (error) {
    logger.error('Query processing failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to process query',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

/**
 * Generate embedding for text
 */
export async function generateEmbedding(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: {
          message: 'Text is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const embedding = await generateEmbeddingVector(text);

    res.json({
      embedding,
      dimensions: embedding.length,
    });
  } catch (error) {
    logger.error('Embedding generation failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: {
        message: 'Failed to generate embedding',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}

