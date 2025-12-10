/**
 * Sync Service
 * Handles syncing data from external APIs
 */
import { createLogger } from '@retail-brain/logger';
import { connectorService, Connector } from './connectorService';
import { shopifySync } from './syncers/shopifySync';
import { woocommerceSync } from './syncers/woocommerceSync';

const logger = createLogger({ service: 'sync-service' });

export interface SyncResult {
  connector_id: string;
  status: 'success' | 'failed' | 'partial';
  synced_at: Date;
  records_synced: number;
  errors: string[];
}

export const syncService = {
  async syncConnector(connectorId: string): Promise<SyncResult> {
    const connector = await connectorService.getById(connectorId);
    
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    if (!connector.enabled) {
      throw new Error(`Connector is disabled: ${connectorId}`);
    }

    logger.info('Starting sync', { connector_id: connectorId, type: connector.type });

    try {
      let result: SyncResult;

      switch (connector.type) {
        case 'shopify':
          result = await shopifySync(connector);
          break;
        case 'woocommerce':
          result = await woocommerceSync(connector);
          break;
        default:
          throw new Error(`Unsupported connector type: ${connector.type}`);
      }

      // Update last_synced_at
      await connectorService.update(connectorId, { last_synced_at: new Date() });

      logger.info('Sync completed', { connector_id: connectorId, status: result.status });
      return result;
    } catch (error) {
      logger.error('Sync failed', {
        connector_id: connectorId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async getSyncStatus(connectorId: string): Promise<{ status: string; last_synced: Date | null }> {
    const connector = await connectorService.getById(connectorId);
    
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return {
      status: connector.enabled ? 'active' : 'disabled',
      last_synced: connector.last_synced_at,
    };
  },
};

