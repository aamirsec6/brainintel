/**
 * Query Processor
 * Main RAG pipeline: Retrieve → Generate → Cite
 */
import { createLogger } from '@retail-brain/logger';
import { retrieveContext, formatContextForLLM } from './ragService';
import { generateAnswer } from './llmService';

const logger = createLogger({
  service: 'query-processor',
});

interface QueryResult {
  question: string;
  answer: string;
  citations: Array<{
    type: string;
    id: string;
    content: string;
    relevance: number;
  }>;
  model: string;
  processing_time_ms: number;
}

/**
 * Process a natural language query using RAG
 */
export async function processQuery(question: string): Promise<QueryResult> {
  const startTime = Date.now();

  try {
    logger.info('Processing query', { question });

    // Step 1: Retrieve relevant context
    const context = await retrieveContext(question, 5);

    logger.debug('Context retrieved', {
      items: context.length,
    });

    // Step 2: Format context for LLM
    const formattedContext = formatContextForLLM(context);

    // Step 3: Generate answer
    const llmResponse = await generateAnswer(question, formattedContext);

    // Step 4: Build citations
    const citations = context.map((item) => ({
      type: item.type,
      id: item.id,
      content: item.content,
      relevance: item.similarity,
    }));

    const processingTime = Date.now() - startTime;

    logger.info('Query processed successfully', {
      question,
      citations_count: citations.length,
      processing_time_ms: processingTime,
      model: llmResponse.model,
    });

    return {
      question,
      answer: llmResponse.answer,
      citations,
      model: llmResponse.model,
      processing_time_ms: processingTime,
    };
  } catch (error) {
    logger.error('Query processing failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

