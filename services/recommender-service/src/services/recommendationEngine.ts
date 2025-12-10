/**
 * Recommendation Engine (ML + Rule-Based Hybrid)
 */
import { getDb } from '@retail-brain/db';
import { createLogger } from '@retail-brain/logger';
import { Recommendation } from '@retail-brain/types';
import { getMLRecommendations } from './mlRecommender';

const logger = createLogger({ service: 'recommendation-engine' });

export async function generateRecommendations(profileId: string): Promise<Recommendation[]> {
  const db = getDb();
  const recommendations: Recommendation[] = [];

  try {
    // Try ML recommendations first
    const mlRecs = await getMLRecommendations(profileId, 10);
    
    if (mlRecs.recommendations.length > 0 && mlRecs.method === 'ml') {
      // Convert ML recommendations to format
      const mlItems = await Promise.all(
        mlRecs.recommendations.map(async (rec) => {
          // Fetch product details from database
          const productQuery = await db.query(
            `SELECT sku, name, category, price FROM product_catalog WHERE sku = $1 LIMIT 1`,
            [rec.item_id]
          );
          
          if (productQuery.rows.length > 0) {
            const product = productQuery.rows[0];
            return {
              sku: product.sku,
              name: product.name,
              category: product.category,
              price: product.price,
              score: rec.score,
            };
          }
          
          return null;
        })
      );
      
      const validItems = mlItems.filter(item => item !== null);
      
      if (validItems.length > 0) {
        recommendations.push({
          type: 'ml_recommendations',
          items: validItems as any,
          reason: 'Personalized recommendations for you',
        });
        
        logger.info('ML recommendations generated', {
          profileId,
          count: validItems.length,
        });
      }
    }
    
    // Fallback to rule-based if ML didn't provide enough recommendations
    if (recommendations.length === 0 || recommendations[0].items.length < 5) {
    // Rule 1: Recently viewed categories
    const recentCategoriesQuery = `
      SELECT DISTINCT payload->>'category' as category
      FROM customer_raw_event cre
      JOIN profile_identifier pi ON (cre.identifiers->>'phone' = pi.value OR cre.identifiers->>'email' = pi.value)
      WHERE pi.profile_id = $1
        AND payload->>'category' IS NOT NULL
        AND event_type = 'view'
      ORDER BY category
      LIMIT 3
    `;

    const categories = await db.query(recentCategoriesQuery, [profileId]);

    if (categories.rows.length > 0) {
      recommendations.push({
        type: 'recently_viewed_categories',
        items: categories.rows.map(r => ({
          sku: `CAT-${r.category}`,
          name: r.category,
          category: r.category,
          price: 0,
          score: 0.8,
        })),
        reason: 'Based on your recently viewed items',
      });
    }

      // Rule 2: Top sellers (generic)
      recommendations.push({
        type: 'top_sellers',
        items: [
          { sku: 'TOP-001', name: 'Bestseller Item 1', category: 'Electronics', price: 9999, score: 0.9 },
          { sku: 'TOP-002', name: 'Bestseller Item 2', category: 'Fashion', price: 2999, score: 0.85 },
        ],
        reason: 'Popular items this month',
      });
    }

    return recommendations;
  } catch (error) {
    logger.error('Recommendation generation failed', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

