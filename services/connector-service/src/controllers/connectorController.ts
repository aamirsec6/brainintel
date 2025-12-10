/**
 * Connector Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { connectorService } from '../services/connectorService';
import { syncService } from '../services/syncService';

const logger = createLogger({ service: 'connector-controller' });

export const connectorController = {
  async listConnectors(req: Request, res: Response): Promise<void> {
    try {
      const connectors = await connectorService.getAll();
      res.json({ connectors });
    } catch (error) {
      logger.error('Failed to list connectors', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to list connectors' });
    }
  },

  async getConnector(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connector = await connectorService.getById(id);
      
      if (!connector) {
        res.status(404).json({ error: 'Connector not found' });
        return;
      }
      
      res.json({ connector });
    } catch (error) {
      logger.error('Failed to get connector', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get connector' });
    }
  },

  async createConnector(req: Request, res: Response): Promise<void> {
    try {
      const connector = await connectorService.create(req.body);
      res.status(201).json({ connector });
    } catch (error) {
      logger.error('Failed to create connector', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to create connector' });
    }
  },

  async updateConnector(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connector = await connectorService.update(id, req.body);
      res.json({ connector });
    } catch (error) {
      logger.error('Failed to update connector', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to update connector' });
    }
  },

  async deleteConnector(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await connectorService.delete(id);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete connector', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to delete connector' });
    }
  },

  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const syncResult = await syncService.syncConnector(id);
      res.json({ sync: syncResult });
    } catch (error) {
      logger.error('Failed to trigger sync', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to trigger sync' });
    }
  },

  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = await syncService.getSyncStatus(id);
      res.json({ status });
    } catch (error) {
      logger.error('Failed to get sync status', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  },
};

