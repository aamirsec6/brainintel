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
  if (lowerQuestion.includes('how many') && (lowerQuestion.includes('customer') || lowerQuestion.includes('profile'))) {
    // Extract customer count from context
    const match = context.match(/Total Customers: (\d+)/);
    if (match) {
      const count = parseInt(match[1]);
      answer = `Based on the data, there are **${count}** customer profiles in the system.`;
      
      // Add more context
      const revenueMatch = context.match(/Total Revenue: ₹([\d,]+)/);
      const eventMatch = context.match(/Total Events: (\d+)/);
      
      if (revenueMatch && eventMatch) {
        const revenue = revenueMatch[1].replace(/,/g, '');
        const events = parseInt(eventMatch[1]);
        answer += `\n\n📊 Quick Stats:\n- Total Events: ${events}\n- Total Revenue: ₹${revenue}\n- Average Events per Customer: ${Math.round(events / count)}`;
      }
    } else {
      const profileCount = lines.filter(l => l.includes('PROFILE')).length;
      answer = `I found **${profileCount}** customer profiles in the system.`;
    }
  } else if (lowerQuestion.includes('total') && (lowerQuestion.includes('revenue') || lowerQuestion.includes('spent'))) {
    const revenueMatch = context.match(/Total Revenue: ₹([\d,]+)/);
    if (revenueMatch) {
      const revenue = revenueMatch[1];
      answer = `The total revenue across all customers is **₹${revenue}**.`;
    } else {
      const spentMatches = context.match(/Total Spent: ([\d.]+)/g);
      if (spentMatches) {
        const total = spentMatches.reduce((sum, match) => {
          const value = parseFloat(match.split(': ')[1]);
          return sum + value;
        }, 0);
        answer = `The total amount spent across all customers is **₹${total.toLocaleString()}**.`;
      } else {
        answer = 'I don\'t have revenue data available. Please check the analytics dashboard for detailed revenue information.';
      }
    }
  } else if (lowerQuestion.includes('total') && lowerQuestion.includes('order')) {
    const eventMatch = context.match(/Total Events: (\d+)/);
    if (eventMatch) {
      answer = `There are **${eventMatch[1]}** total events in the system.`;
    } else {
      const orderMatches = context.match(/Orders: (\d+)/g);
      if (orderMatches) {
        const total = orderMatches.reduce((sum, match) => {
          return sum + parseInt(match.split(': ')[1]);
        }, 0);
        answer = `The total number of orders is **${total}**.`;
      } else {
        answer = 'I found order data in the system. Check the analytics dashboard for detailed order statistics.';
      }
    }
  } else if (lowerQuestion.includes('details') || lowerQuestion.includes('info') || lowerQuestion.includes('information') || 
             (lowerQuestion.includes('show') && !lowerQuestion.includes('top')) || 
             (lowerQuestion.includes('tell') && lowerQuestion.includes('about')) ||
             (lowerQuestion.includes('send') && lowerQuestion.includes('details'))) {
    // Specific customer query - extract customer info from context
    const profiles = lines.filter(l => l.includes('PROFILE') || l.includes('Customer Profile:'));
    
    // Extract search term from question
    const namePattern = /(?:details|info|information|show|tell|about|send|me)\s+(?:me\s+)?([a-z]+(?:\s+[a-z]+)?)/i;
    const nameMatch = question.match(namePattern);
    const searchTerm = nameMatch ? nameMatch[1].toLowerCase() : '';
    
    if (profiles.length > 0) {
      // Find the most relevant profile (one that matches the search term)
      let bestProfile = profiles[0];
      if (searchTerm) {
        const matchingProfile = profiles.find(p => {
          const nameMatch = p.match(/Name: ([^,]+)/i);
          const emailMatch = p.match(/Email: ([^,]+)/i);
          const phoneMatch = p.match(/Phone: ([^,]+)/i);
          
          const name = nameMatch ? nameMatch[1].toLowerCase() : '';
          const email = emailMatch ? emailMatch[1].toLowerCase() : '';
          const phone = phoneMatch ? phoneMatch[1].toLowerCase() : '';
          
          return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
        });
        
        if (matchingProfile) {
          bestProfile = matchingProfile;
        }
      }
      
      // Extract the most relevant profile
      const profileLine = bestProfile;
      const nameMatch = profileLine.match(/Name: ([^,]+)/);
      const emailMatch = profileLine.match(/Email: ([^,]+)/);
      const phoneMatch = profileLine.match(/Phone: ([^,]+)/);
      const cityMatch = profileLine.match(/City: ([^,]+)/);
      const ordersMatch = profileLine.match(/Orders: (\d+)/);
      const spentMatch = profileLine.match(/Total Spent: ₹([\d.]+)/);
      const ltvMatch = profileLine.match(/LTV: ₹([\d.]+)/);
      
      if (nameMatch || emailMatch || phoneMatch) {
        answer = `**Customer Details:**\n\n`;
        if (nameMatch && nameMatch[1] !== 'N/A') answer += `👤 **Name:** ${nameMatch[1]}\n`;
        if (emailMatch && emailMatch[1] !== 'N/A') answer += `📧 **Email:** ${emailMatch[1]}\n`;
        if (phoneMatch && phoneMatch[1] !== 'N/A') answer += `📱 **Phone:** ${phoneMatch[1]}\n`;
        if (cityMatch && cityMatch[1] !== 'N/A') answer += `📍 **City:** ${cityMatch[1]}\n`;
        answer += `\n**Purchase History:**\n`;
        if (ordersMatch) answer += `- Total Orders: ${ordersMatch[1]}\n`;
        if (spentMatch) answer += `- Total Spent: ₹${parseFloat(spentMatch[1]).toLocaleString()}\n`;
        if (ltvMatch) answer += `- Lifetime Value: ₹${parseFloat(ltvMatch[1]).toLocaleString()}\n`;
      } else {
        // Fallback: show all matching profiles
        answer = `I found ${profiles.length} matching customer(s):\n\n`;
        profiles.slice(0, 3).forEach((profile, idx) => {
          const contentMatch = profile.match(/Customer Profile: (.+)/);
          if (contentMatch) {
            answer += `${idx + 1}. ${contentMatch[1]}\n\n`;
          }
        });
      }
    } else {
      answer = 'I couldn\'t find any customer matching that name. Please try searching with a different name or check the Customers page.';
    }
  } else if (lowerQuestion.includes('high value') || lowerQuestion.includes('top customer') || lowerQuestion.includes('best customer')) {
    const profiles = lines.filter(l => l.includes('PROFILE') || l.includes('Customer:'));
    if (profiles.length > 0) {
      answer = `Here are the top customers:\n\n`;
      profiles.slice(0, 5).forEach((profile, idx) => {
        const nameMatch = profile.match(/Customer: ([^,]+)/) || profile.match(/Name: ([^,]+)/);
        const spentMatch = profile.match(/Total Spent: ([\d.]+)/) || profile.match(/Total Spent: ₹([\d.]+)/);
        const ordersMatch = profile.match(/Orders: (\d+)/);
        
        if (nameMatch) {
          answer += `${idx + 1}. ${nameMatch[1]}`;
          if (spentMatch) answer += ` - ₹${spentMatch[1]}`;
          if (ordersMatch) answer += ` (${ordersMatch[1]} orders)`;
          answer += '\n';
        }
      });
    } else {
      answer = 'I found customer data, but couldn\'t extract specific details. Check the Customers page for a full list.';
    }
  } else if (lowerQuestion.includes('average') || lowerQuestion.includes('avg')) {
    if (lowerQuestion.includes('order') || lowerQuestion.includes('revenue')) {
      const avgMatch = context.match(/Average.*: ([\d.]+)/);
      if (avgMatch) {
        answer = `The average value is **${avgMatch[1]}**.`;
      } else {
        answer = 'Average statistics are available in the analytics dashboard.';
      }
    } else {
      answer = 'I can help you find average statistics. Please be more specific (e.g., "average order value", "average revenue").';
    }
  } else if (lowerQuestion.includes('recent') || lowerQuestion.includes('latest') || lowerQuestion.includes('new')) {
    answer = 'Recent activity and latest updates are available in the dashboard. Check the "Recent Activity" section for the most up-to-date information.';
  } else {
    // Generic response with context
    if (context && context.length > 50) {
      answer = `Based on the available data:\n\n${context.substring(0, 800)}`;
      if (context.length > 800) {
        answer += '\n\n... (more data available in the dashboard)';
      }
    } else {
      answer = 'I can help you with questions about:\n- Customer counts and statistics\n- Revenue and orders\n- Top customers\n- Recent activity\n\nTry asking: "How many customers do we have?" or "What is the total revenue?"';
    }
  }

  if (!answer) {
    answer = 'I don\'t have enough information to answer that question. Please try asking about:\n- Customer counts ("How many customers?")\n- Revenue ("What is the total revenue?")\n- Orders ("How many orders?")\n- Top customers ("Show me top customers")';
  }

  return {
    answer,
    model: 'rule-based-mvp',
  };
}

