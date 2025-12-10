/**
 * Sync Scheduler
 * Schedules periodic syncs for enabled connectors
 */
import * as cron from 'node-cron';
import { createLogger } from '@retail-brain/logger';
import { connectorService } from './connectorService';
import { syncService } from './syncService';

const logger = createLogger({ service: 'sync-scheduler' });

export async function startScheduledSyncs(): Promise<void> {
  logger.info('Starting sync scheduler');

  // Run every hour to check for connectors that need syncing
  cron.schedule('0 * * * *', async () => {
    try {
      const connectors = await connectorService.getAll();
      
      for (const connector of connectors) {
        if (!connector.enabled) continue;

        // Check if it's time to sync based on sync_frequency
        const lastSync = connector.last_synced_at;
        const now = new Date();
        
        // For MVP, sync if last sync was more than 6 hours ago
        if (!lastSync || (now.getTime() - lastSync.getTime()) > 6 * 60 * 60 * 1000) {
          logger.info('Triggering scheduled sync', { connector_id: connector.id });
          
          try {
            await syncService.syncConnector(connector.id);
          } catch (error) {
            logger.error('Scheduled sync failed', {
              connector_id: connector.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    } catch (error) {
      logger.error('Sync scheduler error', error instanceof Error ? error : new Error(String(error)));
    }
  });

  logger.info('Sync scheduler started');
}

