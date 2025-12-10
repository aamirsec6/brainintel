/**
 * Pricing Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { pricingService } from '../services/pricingService';

const logger = createLogger({ service: 'pricing-controller' });

export const pricingController = {
  async getPrice(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const { channel, segment, region } = req.query;
      
      const price = await pricingService.getPrice(
        sku,
        channel as string,
        segment as string,
        region as string
      );
      
      res.json({ price });
    } catch (error) {
      logger.error('Failed to get price', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get price' });
    }
  },

  async createRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = await pricingService.createRule(req.body);
      res.status(201).json({ rule });
    } catch (error) {
      logger.error('Failed to create pricing rule', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to create rule' });
    }
  },

  async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await pricingService.updateRule(id, req.body);
      res.json({ rule });
    } catch (error) {
      logger.error('Failed to update pricing rule', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to update rule' });
    }
  },

  async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await pricingService.deleteRule(id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete pricing rule', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to delete rule' });
    }
  },

  async getRules(req: Request, res: Response): Promise<void> {
    try {
      const { sku, channel } = req.query;
      const rules = await pricingService.getRules(sku as string, channel as string);
      res.json({ rules });
    } catch (error) {
      logger.error('Failed to get pricing rules', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get rules' });
    }
  },

  async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const history = await pricingService.getPriceHistory(sku);
      res.json({ history });
    } catch (error) {
      logger.error('Failed to get price history', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get history' });
    }
  },
};

