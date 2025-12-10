/**
 * Event Subscriber
 * Subscribes to Redis channels and handles events
 */
import Redis from 'ioredis';
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({ service: 'event-subscriber' });
const config = getConfig();

let redis: Redis | null = null;
const handlers: Map<string, Array<(event: any) => Promise<void>>> = new Map();

export const subscriber = {
  async initialize(): Promise<void> {
    redis = new Redis({
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
    });

    redis.on('error', (error) => {
      logger.error('Redis subscriber error', error);
    });

    redis.on('message', async (channel, message) => {
      try {
        const event = JSON.parse(message);
        await this.handleEvent(channel, event);
      } catch (error) {
        logger.error('Failed to process event', {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info('Event subscriber initialized');
  },

  async subscribe(channel: string, handler: (event: any) => Promise<void>): Promise<void> {
    if (!redis) {
      throw new Error('Subscriber not initialized');
    }

    if (!handlers.has(channel)) {
      handlers.set(channel, []);
      await redis.subscribe(channel);
      logger.info('Subscribed to channel', { channel });
    }

    handlers.get(channel)!.push(handler);
  },

  async handleEvent(channel: string, event: any): Promise<void> {
    const channelHandlers = handlers.get(channel);
    if (!channelHandlers) {
      return;
    }

    for (const handler of channelHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Event handler failed', {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  },
};

