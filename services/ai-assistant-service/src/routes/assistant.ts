/**
 * AI Assistant routes
 */
import { Router } from 'express';
import { queryAssistant, generateEmbedding } from '../controllers/assistantController';

const router = Router();

/**
 * POST /query
 * Ask a question to the AI assistant
 */
router.post('/query', queryAssistant);

/**
 * POST /embed
 * Generate embeddings for text
 */
router.post('/embed', generateEmbedding);

export default router;

