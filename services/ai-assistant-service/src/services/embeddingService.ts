/**
 * Embedding Service
 * Generates vector embeddings for semantic search
 * 
 * Options:
 * 1. SentenceTransformers (Python service) - Recommended for production
 * 2. Ollama (local) - Good for development
 * 3. Mock embeddings - Fallback for testing
 */
import { createLogger } from '@retail-brain/logger';
import axios from 'axios';

const logger = createLogger({
  service: 'embedding-service',
});

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const EMBEDDING_DIM = 768;
const SENTENCE_TRANSFORMERS_URL = process.env.SENTENCE_TRANSFORMERS_URL || 'http://localhost:3016';

/**
 * Generate embedding vector for text
 */
export async function generateEmbeddingVector(text: string): Promise<number[]> {
  try {
    // Try SentenceTransformers service first (if available)
    if (process.env.USE_SENTENCE_TRANSFORMERS === 'true') {
      return await generateSentenceTransformerEmbedding(text);
    }

    // Try Ollama (if available)
    if (process.env.USE_OLLAMA === 'true') {
      return await generateOllamaEmbedding(text);
    }

    // Fallback: Simple mock embedding for MVP
    return generateMockEmbedding(text);
  } catch (error) {
    logger.warn('Failed to generate real embedding, using mock', error instanceof Error ? error : undefined);
    return generateMockEmbedding(text);
  }
}

/**
 * Generate embedding using SentenceTransformers service
 */
async function generateSentenceTransformerEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      `${SENTENCE_TRANSFORMERS_URL}/v1/embeddings/generate`,
      { text },
      { timeout: 10000 }
    );

    return response.data.embedding;
  } catch (error) {
    logger.error('SentenceTransformer embedding failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Generate embedding using Ollama
 */
async function generateOllamaEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/embeddings`,
      {
        model: EMBEDDING_MODEL,
        prompt: text,
      },
      {
        timeout: 10000,
      }
    );

    return response.data.embedding;
  } catch (error) {
    logger.error('Ollama embedding failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Generate simple mock embedding
 * For MVP/testing - not production quality
 */
function generateMockEmbedding(text: string): number[] {
  // Simple hash-based mock embedding
  const embedding = new Array(EMBEDDING_DIM).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = charCode % EMBEDDING_DIM;
    embedding[index] += charCode / 1000;
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

