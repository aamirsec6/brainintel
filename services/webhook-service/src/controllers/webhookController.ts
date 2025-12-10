/**
 * Webhook Controller
 * Handles incoming webhooks from external systems
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { shopifyTransformer } from '../services/shopifyTransformer';
import { woocommerceTransformer } from '../services/woocommerceTransformer';
import { validateWebhookSignature } from '../services/webhookValidator';
import { forwardToEventCollector } from '../services/webhookProcessor';

const logger = createLogger({ service: 'webhook-controller' });

export const webhookController = {
  /**
   * Handle Shopify webhooks
   */
  async handleShopify(req: Request, res: Response): Promise<void> {
    try {
      const shopifyShop = req.headers['x-shopify-shop-domain'] as string;
      const topic = req.headers['x-shopify-topic'] as string;
      const hmac = req.headers['x-shopify-hmac-sha256'] as string;

      logger.info('Received Shopify webhook', { shop: shopifyShop, topic });

      // Validate signature
      const isValid = validateWebhookSignature(
        'shopify',
        JSON.stringify(req.body),
        hmac,
        process.env.SHOPIFY_WEBHOOK_SECRET || ''
      );

      if (!isValid) {
        logger.warn('Invalid Shopify webhook signature', { shop: shopifyShop });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Transform Shopify event to Retail Brain format
      const transformedEvents = await shopifyTransformer.transform(req.body, topic);

      // Forward to event collector
      for (const event of transformedEvents) {
        await forwardToEventCollector(event);
      }

      res.status(200).json({ status: 'accepted', events: transformedEvents.length });
    } catch (error) {
      logger.error('Shopify webhook processing failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Handle WooCommerce webhooks
   */
  async handleWooCommerce(req: Request, res: Response): Promise<void> {
    try {
      const action = req.headers['x-wc-webhook-event'] as string;
      const resource = req.headers['x-wc-webhook-resource'] as string;

      logger.info('Received WooCommerce webhook', { action, resource });

      // Validate signature (WooCommerce uses HMAC)
      const signature = req.headers['x-wc-webhook-signature'] as string;
      const isValid = validateWebhookSignature(
        'woocommerce',
        JSON.stringify(req.body),
        signature,
        process.env.WOOCOMMERCE_WEBHOOK_SECRET || ''
      );

      if (!isValid) {
        logger.warn('Invalid WooCommerce webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Transform WooCommerce event
      const transformedEvents = await woocommerceTransformer.transform(req.body, action, resource);

      // Forward to event collector
      for (const event of transformedEvents) {
        await forwardToEventCollector(event);
      }

      res.status(200).json({ status: 'accepted', events: transformedEvents.length });
    } catch (error) {
      logger.error('WooCommerce webhook processing failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Handle generic webhooks (POS, custom systems)
   */
  async handleGeneric(req: Request, res: Response): Promise<void> {
    try {
      const source = req.headers['x-webhook-source'] as string || 'generic';
      const eventType = req.headers['x-webhook-event'] as string || 'unknown';

      logger.info('Received generic webhook', { source, eventType });

      // Basic validation
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      // Transform to Retail Brain format
      const transformedEvent = {
        source,
        event_type: eventType,
        event_ts: new Date().toISOString(),
        identifiers: req.body.identifiers || {},
        payload: req.body.payload || req.body,
      };

      // Forward to event collector
      await forwardToEventCollector(transformedEvent);

      res.status(200).json({ status: 'accepted' });
    } catch (error) {
      logger.error('Generic webhook processing failed', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
};

