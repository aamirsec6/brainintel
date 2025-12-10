/**
 * Attribution Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { attributionService } from '../services/attributionService';

const logger = createLogger({ service: 'attribution-controller' });

export const attributionController = {
  async calculateAttribution(req: Request, res: Response): Promise<void> {
    try {
      const { conversionEventId, journeyId, model } = req.body;
      const attribution = await attributionService.calculateAttribution(
        conversionEventId,
        journeyId,
        model || 'linear'
      );
      res.json({ attribution });
    } catch (error) {
      logger.error('Failed to calculate attribution', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to calculate attribution' });
    }
  },

  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { model, startDate, endDate } = req.query;
      const report = await attributionService.getReport(
        model as string,
        startDate as string,
        endDate as string
      );
      res.json({ report });
    } catch (error) {
      logger.error('Failed to get attribution report', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get report' });
    }
  },

  async getChannelPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { model, startDate, endDate } = req.query;
      const performance = await attributionService.getChannelPerformance(
        model as string,
        startDate as string,
        endDate as string
      );
      res.json({ performance });
    } catch (error) {
      logger.error('Failed to get channel performance', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get channel performance' });
    }
  },

  async getCampaignPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { model, startDate, endDate } = req.query;
      const performance = await attributionService.getCampaignPerformance(
        model as string,
        startDate as string,
        endDate as string
      );
      res.json({ performance });
    } catch (error) {
      logger.error('Failed to get campaign performance', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get campaign performance' });
    }
  },
};

