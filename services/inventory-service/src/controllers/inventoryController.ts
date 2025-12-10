/**
 * Inventory Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { inventoryService } from '../services/inventoryService';

const logger = createLogger({ service: 'inventory-controller' });

export const inventoryController = {
  async getBySku(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      const inventory = await inventoryService.getBySku(sku);
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to get inventory by SKU', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  },

  async getByChannel(req: Request, res: Response): Promise<void> {
    try {
      const { channel } = req.params;
      const inventory = await inventoryService.getByChannel(channel);
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to get inventory by channel', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  },

  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await inventoryService.getLowStock();
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to get low stock', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get low stock' });
    }
  },

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, reason, order_id } = req.body;
      const inventory = await inventoryService.updateQuantity(id, quantity, reason, order_id);
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to update inventory', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  },

  async reserveInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, order_id } = req.body;
      const inventory = await inventoryService.reserve(id, quantity, order_id);
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to reserve inventory', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to reserve inventory' });
    }
  },

  async releaseInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, order_id } = req.body;
      const inventory = await inventoryService.release(id, quantity, order_id);
      res.json({ inventory });
    } catch (error) {
      logger.error('Failed to release inventory', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to release inventory' });
    }
  },

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const history = await inventoryService.getHistory(id);
      res.json({ history });
    } catch (error) {
      logger.error('Failed to get inventory history', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get history' });
    }
  },

  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;
      const results = await inventoryService.bulkUpdate(updates);
      res.json({ results });
    } catch (error) {
      logger.error('Failed to bulk update inventory', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to bulk update' });
    }
  },
};

