/**
 * Webhook Routes
 */
import { Router, Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { webhookController } from '../controllers/webhookController';

const logger = createLogger({ service: 'webhook-routes' });
const router = Router();

// Shopify webhook
router.post('/shopify', webhookController.handleShopify);

// WooCommerce webhook
router.post('/woocommerce', webhookController.handleWooCommerce);

// Generic webhook (for POS, custom systems)
router.post('/generic', webhookController.handleGeneric);

// Webhook status/health
router.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'webhook-service' });
});

export default router;

