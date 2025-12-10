/**
 * Event Publisher
 * Publishes events to Redis channels
 */
import Redis from 'ioredis';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({ service: 'event-publisher' });
const config = getConfig();

let redis: Redis | null = null;

export const publisher = {
  async initialize(): Promise<void> {
    redis = new Redis({
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
    });

    redis.on('error', (error) => {
      logger.error('Redis publisher error', error);
    });

    logger.info('Event publisher initialized');
  },

  async publish(channel: string, event: any): Promise<void> {
    if (!redis) {
      throw new Error('Publisher not initialized');
    }

    try {
      const message = JSON.stringify({
        ...event,
        published_at: new Date().toISOString(),
      });

      await redis.publish(channel, message);
      logger.debug('Event published', { channel, event_type: event.type });
    } catch (error) {
      logger.error('Failed to publish event', {
        channel,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async publishInventoryUpdate(sku: string, channel: string, quantity: number): Promise<void> {
    await this.publish('inventory:update', {
      type: 'inventory_update',
      sku,
      channel,
      quantity,
      timestamp: new Date().toISOString(),
    });
  },

  async publishPriceUpdate(sku: string, price: number, channel?: string): Promise<void> {
    await this.publish('pricing:update', {
      type: 'price_update',
      sku,
      price,
      channel,
      timestamp: new Date().toISOString(),
    });
  },

  async publishOrderUpdate(orderId: string, status: string, channel: string): Promise<void> {
    await this.publish('order:update', {
      type: 'order_update',
      order_id: orderId,
      status,
      channel,
      timestamp: new Date().toISOString(),
    });
  },

  async publishProfileUpdate(profileId: string, changes: any): Promise<void> {
    await this.publish('profile:update', {
      type: 'profile_update',
      profile_id: profileId,
      changes,
      timestamp: new Date().toISOString(),
    });
  },
};

