/**
 * Event Registry
 * Registers event handlers for different event types
 */
import { createLogger } from '@retail-brain/logger';
import { subscriber } from './subscriber';

const logger = createLogger({ service: 'event-registry' });

export const eventRegistry = {
  registerHandlers(): void {
    // Inventory update handlers
    subscriber.subscribe('inventory:update', async (event) => {
      logger.info('Inventory update received', { sku: event.sku, channel: event.channel });
      // Services can subscribe to this and update their caches
    });

    // Price update handlers
    subscriber.subscribe('pricing:update', async (event) => {
      logger.info('Price update received', { sku: event.sku, price: event.price });
      // Services can subscribe to this and invalidate caches
    });

    // Order update handlers
    subscriber.subscribe('order:update', async (event) => {
      logger.info('Order update received', { order_id: event.order_id, status: event.status });
      // Services can subscribe to this for order status sync
    });

    // Profile update handlers
    subscriber.subscribe('profile:update', async (event) => {
      logger.info('Profile update received', { profile_id: event.profile_id });
      // Services can subscribe to this for profile sync
    });

    logger.info('Event handlers registered');
  },
};

