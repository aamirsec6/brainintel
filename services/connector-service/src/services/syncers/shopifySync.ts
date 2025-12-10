/**
 * Shopify Sync
 * Syncs products, orders, and customers from Shopify
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

const logger = createLogger({ service: 'shopify-sync' });

export async function shopifySync(connector: Connector): Promise<SyncResult> {
  const storeUrl = connector.config.store_url as string;
  const apiKey = connector.config.api_key as string;
  const apiSecret = connector.config.api_secret as string;

  if (!storeUrl || !apiKey) {
    throw new Error('Shopify connector missing required configuration');
  }

  const client: AxiosInstance = axios.create({
    baseURL: `https://${storeUrl}/admin/api/2024-01`,
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
    const ordersResponse = await client.get('/orders.json', {
      params: {
        limit: 250,
        status: 'any',
        created_at_min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    for (const order of ordersResponse.data.orders || []) {
      try {
        const event = {
          source: 'shopify',
          event_type: 'purchase',
          event_ts: order.created_at,
          identifiers: {
            email: order.email,
            phone: order.phone,
          },
          payload: {
            order_id: order.id.toString(),
            total_price: parseFloat(order.total_price || '0'),
            line_items: order.line_items || [],
          },
        };

        await forwardToEventCollector(event);
        result.records_synced++;
      } catch (error) {
        result.errors.push(`Failed to sync order ${order.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.info('Shopify sync completed', {
      connector_id: connector.id,
      records_synced: result.records_synced,
    });
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Shopify sync failed', { error: error instanceof Error ? error.message : String(error) });
  }

  return result;
}

