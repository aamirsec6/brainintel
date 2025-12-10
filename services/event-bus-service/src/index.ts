/**
 * Event Bus Service
 * Pub/sub for cross-service communication using Redis
 */
import { createLogger } from '@retail-brain/logger';
import { getConfig } from '@retail-brain/config';
import { publisher } from './services/publisher';
import { subscriber } from './services/subscriber';
import { eventRegistry } from './services/eventRegistry';

const logger = createLogger({ service: 'event-bus-service' });
const config = getConfig();

async function start() {
  logger.info('Starting Event Bus Service');

  // Initialize publisher
  await publisher.initialize();

  // Initialize subscriber and register handlers
  await subscriber.initialize();
  
  // Register event handlers
  eventRegistry.registerHandlers();

  logger.info('Event Bus Service started');
}

start().catch((error) => {
  logger.error('Failed to start Event Bus Service', error);
  process.exit(1);
});

