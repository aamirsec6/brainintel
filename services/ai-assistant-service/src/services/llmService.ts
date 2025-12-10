/**
 * LLM Service
 * Integrates with local LLM (Ollama) for query answering
 */
import { createLogger } from '@retail-brain/logger';
import axios from 'axios';

const logger = createLogger({
  service: 'llm-service',
});

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || 'llama2';

interface LLMResponse {
  answer: string;
  model: string;
}

/**
 * Generate answer using LLM
 */
export async function generateAnswer(
  question: string,
  context: string
): Promise<LLMResponse> {
  try {
    // Check if Ollama is available
    if (process.env.USE_OLLAMA === 'true') {
      return await generateWithOllama(question, context);
    }

    // Fallback: Rule-based response for MVP
    return generateRuleBasedAnswer(question, context);
  } catch (error) {
    logger.warn('LLM generation failed, using rule-based fallback', error instanceof Error ? error : undefined);
    return generateRuleBasedAnswer(question, context);
  }
}

/**
 * Generate answer using Ollama
 */
async function generateWithOllama(
  question: string,
  context: string
): Promise<LLMResponse> {
  try {
    const prompt = `You are a retail customer data assistant. Answer the question ONLY using the provided context. If the context doesn't contain the answer, say "I don't have enough information to answer that question."

Context:
${context}

Question: ${question}

Answer concisely and cite specific data from the context.`;

    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: LLM_MODEL,
        prompt,
        stream: false,
      },
      {
        timeout: 30000,
      }
    );

    return {
      answer: response.data.response,
      model: LLM_MODEL,
    };
  } catch (error) {
    logger.error('Ollama generation failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Generate rule-based answer (MVP fallback)
 */
function generateRuleBasedAnswer(question: string, context: string): LLMResponse {
  const lowerQuestion = question.toLowerCase();

  // Extract relevant info from context
  const lines = context.split('\n').filter(l => l.trim());
  
  let answer = '';

  // Pattern matching for common questions
  if (lowerQuestion.includes('how many') && lowerQuestion.includes('customer')) {
    // Extract customer count from context
    const match = context.match(/Total Customers: (\d+)/);
    if (match) {
      const count = parseInt(match[1]);
      answer = `Based on the data, there are **${count}** customer profiles in the system.`;
      
      // Add more context
      const revenueMatch = context.match(/Total Revenue: ₹([\d.]+)/);
      const eventMatch = context.match(/Total Events: (\d+)/);
      
      if (revenueMatch && eventMatch) {
        answer += `\n\n📊 Quick Stats:\n- Total Events: ${eventMatch[1]}\n- Total Revenue: ₹${revenueMatch[1]}\n- Average Events per Customer: ${Math.round(parseInt(eventMatch[1]) / count)}`;
      }
    } else {
      answer = `I found ${lines.filter(l => l.includes('PROFILE')).length} customer profiles.`;
    }
  } else if (lowerQuestion.includes('total') && (lowerQuestion.includes('revenue') || lowerQuestion.includes('spent'))) {
    const spentMatches = context.match(/Total Spent: ([\d.]+)/g);
    if (spentMatches) {
      const total = spentMatches.reduce((sum, match) => {
        const value = parseFloat(match.split(': ')[1]);
        return sum + value;
      }, 0);
      answer = `The total amount spent across all customers is ₹${total.toLocaleString()}.`;
    }
  } else if (lowerQuestion.includes('high value') || lowerQuestion.includes('top customer')) {
    const profiles = lines.filter(l => l.includes('PROFILE'));
    if (profiles.length > 0) {
      answer = `Top customers:\n${profiles.slice(0, 3).join('\n')}`;
    }
  } else {
    // Generic response with context
    answer = `Based on the available data:\n\n${context.substring(0, 500)}...`;
  }

  if (!answer) {
    answer = 'I don\'t have enough information to answer that question. Please try asking about customers, orders, or revenue.';
  }

  return {
    answer,
    model: 'rule-based-mvp',
  };
}

