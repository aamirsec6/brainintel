/**
 * RAG Service (Retrieval Augmented Generation)
 * Retrieves relevant context using pgvector semantic search
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { generateEmbeddingVector } from './embeddingService';

const logger = createLogger({
  service: 'rag-service',
});

interface RetrievedContext {
  type: 'profile' | 'event' | 'merge_log';
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
  query: string,
  limit: number = 5
): Promise<RetrievedContext[]> {
  const db = getDb();
  const context: RetrievedContext[] = [];

  try {
    logger.info('Retrieving context for query', {
      query: query.substring(0, 50),
      limit,
    });

    // For MVP, retrieve all context types
    const lowerQuery = query.toLowerCase();

    // Check if query is asking for a specific customer by name
    // Try multiple patterns to extract name
    const patterns = [
      /(?:send|show|tell|give)\s+me\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:details|info|information)/i,
      /([a-z]+(?:\s+[a-z]+)?)\s+(?:details|info|information)/i,
      /(?:details|info|information|show|tell|about|for|send)\s+(?:me\s+)?([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:about|for)\s+([a-z]+(?:\s+[a-z]+)?)/i,
    ];
    
    let searchName = null;
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Skip common words
        if (!['me', 'the', 'all', 'top', 'high', 'value', 'send', 'show', 'tell', 'give'].includes(candidate.toLowerCase())) {
          searchName = candidate;
          logger.debug('Extracted search name', { searchName, pattern: pattern.toString(), originalQuery: query });
          break;
        }
      }
    }

    // If asking about count/total/how many, get aggregated stats
    if (lowerQuery.includes('how many') || lowerQuery.includes('total') || lowerQuery.includes('count')) {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM customer_profile WHERE is_merged = false) as total_profiles,
          (SELECT COUNT(*) FROM customer_raw_event) as total_events,
          (SELECT COALESCE(SUM(total_spent), 0) FROM customer_profile WHERE is_merged = false) as total_revenue,
          (SELECT COALESCE(AVG(ltv), 0) FROM customer_profile WHERE is_merged = false) as avg_ltv
      `;
      
      const statsResult = await db.query(statsQuery);
      const stats = statsResult.rows[0];

      context.push({
        type: 'profile',
        id: 'stats-aggregate',
        content: `Total Customers: ${stats.total_profiles}, Total Events: ${stats.total_events}, Total Revenue: ₹${stats.total_revenue}, Average LTV: ₹${stats.avg_ltv}`,
        similarity: 1.0,
        metadata: stats,
      });
    }

    // If searching for a specific customer by name
    let profileQuery: string;
    let profileParams: any[];
    
    if (searchName) {
      // Search by name
      logger.debug('Searching for customer by name', { searchName, limit });
      profileQuery = `
        SELECT 
          id,
          primary_phone,
          primary_email,
          full_name,
          city,
          total_orders,
          total_spent,
          ltv,
          created_at,
          last_seen_at
        FROM customer_profile
        WHERE is_merged = false
          AND (
            LOWER(full_name) LIKE $1
            OR LOWER(primary_email) LIKE $1
            OR LOWER(primary_phone) LIKE $1
          )
        ORDER BY 
          CASE 
            WHEN LOWER(full_name) LIKE $2 THEN 1
            WHEN LOWER(primary_email) LIKE $2 THEN 2
            ELSE 3
          END,
          ltv DESC
        LIMIT $3
      `;
      const searchPattern = `%${searchName.toLowerCase()}%`;
      const exactPattern = `${searchName.toLowerCase()}%`;
      profileParams = [searchPattern, exactPattern, limit];
      logger.debug('Executing profile search query', { searchPattern, exactPattern });
    } else {
      // Get top customers (default)
      profileQuery = `
        SELECT 
          id,
          primary_phone,
          primary_email,
          full_name,
          city,
          total_orders,
          total_spent,
          ltv
        FROM customer_profile
        WHERE is_merged = false
        ORDER BY ltv DESC
        LIMIT $1
      `;
      profileParams = [limit];
    }

    const profileResult = await db.query(profileQuery, profileParams);

    profileResult.rows.forEach((row) => {
      const customerInfo = [
        `Name: ${row.full_name || 'N/A'}`,
        `Email: ${row.primary_email || 'N/A'}`,
        `Phone: ${row.primary_phone || 'N/A'}`,
        `City: ${row.city || 'N/A'}`,
        `Orders: ${row.total_orders || 0}`,
        `Total Spent: ₹${row.total_spent || 0}`,
        `LTV: ₹${row.ltv || 0}`,
      ].join(', ');
      
      context.push({
        type: 'profile',
        id: row.id,
        content: `Customer Profile: ${customerInfo}`,
        similarity: searchName ? 0.95 : 0.8, // Higher similarity for name matches
        metadata: row,
      });
    });

    // Search events
    const eventQuery = `
      SELECT 
        id,
        source,
        event_type,
        event_ts,
        payload
      FROM customer_raw_event
      WHERE payload::text ILIKE $1
        OR event_type ILIKE $1
        OR source ILIKE $1
      ORDER BY received_at DESC
      LIMIT $2
    `;

    const eventResult = await db.query(eventQuery, [`%${query}%`, limit]);

    eventResult.rows.forEach((row) => {
      context.push({
        type: 'event',
        id: row.id,
        content: `Event: ${row.event_type} from ${row.source} at ${row.event_ts}. Details: ${JSON.stringify(row.payload)}`,
        similarity: 0.7,
        metadata: row,
      });
    });

    logger.info('Context retrieved', {
      total_items: context.length,
      profiles: context.filter(c => c.type === 'profile').length,
      events: context.filter(c => c.type === 'event').length,
    });

    return context;
  } catch (error) {
    logger.error('Context retrieval failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Format context for LLM prompt
 */
export function formatContextForLLM(context: RetrievedContext[]): string {
  if (context.length === 0) {
    return 'No relevant information found in the database.';
  }

  let formattedContext = 'Relevant information from the database:\n\n';

  context.forEach((item, index) => {
    formattedContext += `[${index + 1}] ${item.type.toUpperCase()}: ${item.content}\n`;
    formattedContext += `    Source ID: ${item.id}\n`;
    formattedContext += `    Relevance: ${(item.similarity * 100).toFixed(0)}%\n\n`;
  });

  return formattedContext;
}

