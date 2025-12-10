/**
 * WooCommerce Sync
 * Syncs products, orders, and customers from WooCommerce
 */
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '@retail-brain/logger';
import { Connector } from '../connectorService';
import { SyncResult } from '../syncService';
import axios from 'axios';
import { getConfig } from '@retail-brain/config';

const config = getConfig();
const EVENT_COLLECTOR_URL = config.EVENT_COLLECTOR_URL || 'http://localhost:3001';

async function forwardToEventCollector(event: any): Promise<void> {
  await axios.post(
    `${EVENT_COLLECTOR_URL}/v1/events`,
    event,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.API_KEY || 'test_api_key'}`,
      },
    }
  );
}

const logger = createLogger({ service: 'woocommerce-sync' });

export async function woocommerceSync(connector: Connector): Promise<SyncResult> {
  const storeUrl = connector.config.store_url as string;
  const apiKey = connector.config.api_key as string;
  const apiSecret = connector.config.api_secret as string;

  if (!storeUrl || !apiKey || !apiSecret) {
    throw new Error('WooCommerce connector missing required configuration');
  }

  const client: AxiosInstance = axios.create({
    baseURL: `${storeUrl}/wp-json/wc/v3`,
    auth: {
      username: apiKey,
      password: apiSecret,
    },
    timeout: 30000,
  });

  const result: SyncResult = {
    connector_id: connector.id,
    status: 'success',
    synced_at: new Date(),
    records_synced: 0,
    errors: [],
  };

  try {
    // Sync recent orders
    const ordersResponse = await client.get('/orders', {
      params: {
        per_page: 100,
        after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    for (const order of ordersResponse.data || []) {
      try {
        const event = {
          source: 'woocommerce',
          event_type: 'purchase',
          event_ts: order.date_created,
          identifiers: {
            email: order.billing?.email,
            phone: order.billing?.phone,
          },
          payload: {
            order_id: order.id.toString(),
            total: parseFloat(order.total || '0'),
            line_items: order.line_items || [],
          },
        };

        await forwardToEventCollector(event);
        result.records_synced++;
      } catch (error) {
        result.errors.push(`Failed to sync order ${order.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.info('WooCommerce sync completed', {
      connector_id: connector.id,
      records_synced: result.records_synced,
    });
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('WooCommerce sync failed', { error: error instanceof Error ? error.message : String(error) });
  }

  return result;
}

