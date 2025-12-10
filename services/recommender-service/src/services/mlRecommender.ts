/**
 * ML-based Recommendation Engine
 * Integrates LightFM model for collaborative filtering
 */
import { createLogger } from '@retail-brain/logger';
import axios from 'axios';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({
  service: 'ml-recommender',
});

const config = getConfig();
const ML_SCORER_URL = config.ML_SCORER_SERVICE_URL;

interface MLRecommendationRequest {
  user_id: string;
  item_ids?: string[];
  n_recommendations?: number;
}

interface MLRecommendationResponse {
  recommendations: Array<{
    item_id: string;
    score: number;
  }>;
  method: 'ml' | 'rule_based_fallback';
}

/**
 * Get ML-based recommendations using LightFM
 */
export async function getMLRecommendations(
  userId: string,
  nRecommendations: number = 10
): Promise<MLRecommendationResponse> {
  try {
    const response = await axios.post<MLRecommendationResponse>(
      `${ML_SCORER_URL}/v1/recommendations/predict`,
      {
        user_id: userId,
        n_recommendations: nRecommendations,
      } as MLRecommendationRequest,
      {
        headers: { 'X-API-KEY': config.API_KEY },
        timeout: 5000,
      }
    );

    logger.info('ML recommendations retrieved', {
      userId,
      count: response.data.recommendations.length,
    });

    return response.data;
  } catch (error) {
    logger.warn('ML recommendation failed, falling back to rule-based', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty recommendations to trigger rule-based fallback
    return {
      recommendations: [],
      method: 'rule_based_fallback',
    };
  }
}

