/**
 * Journey Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { journeyService } from '../services/journeyService';

const logger = createLogger({ service: 'journey-controller' });

export const journeyController = {
  async getByProfile(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const journeys = await journeyService.getByProfile(profileId);
      res.json({ journeys });
    } catch (error) {
      logger.error('Failed to get journeys by profile', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get journeys' });
    }
  },

  async getByJourneyId(req: Request, res: Response): Promise<void> {
    try {
      const { journeyId } = req.params;
      const journey = await journeyService.getByJourneyId(journeyId);
      res.json({ journey });
    } catch (error) {
      logger.error('Failed to get journey', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get journey' });
    }
  },

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await journeyService.getAnalytics();
      res.json({ analytics });
    } catch (error) {
      logger.error('Failed to get journey analytics', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  },

  async getFunnel(req: Request, res: Response): Promise<void> {
    try {
      const funnel = await journeyService.getConversionFunnel();
      res.json({ funnel });
    } catch (error) {
      logger.error('Failed to get conversion funnel', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get funnel' });
    }
  },
};

