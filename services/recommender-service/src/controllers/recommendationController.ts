/**
 * Recommendation Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { generateRecommendations } from '../services/recommendationEngine';

const logger = createLogger({
  service: 'recommendation-controller',
});

export async function getRecommendations(req: Request, res: Response) {
  try {
    const { profile_id } = req.params;

    logger.info('Generating recommendations', { profile_id });

    const recommendations = await generateRecommendations(profile_id);

    res.json({
      profile_id,
      recommendations,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to generate recommendations', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to generate recommendations', code: 'INTERNAL_ERROR' },
    });
  }
}

