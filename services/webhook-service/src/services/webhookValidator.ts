/**
 * Webhook Signature Validation
 */
import { createHmac } from 'crypto';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({ service: 'webhook-validator' });

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  provider: 'shopify' | 'woocommerce' | 'generic',
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Allow testing without secret in development
  if (!secret && process.env.NODE_ENV === 'development') {
    logger.warn('Webhook secret not configured - allowing in development mode', { provider });
    return true; // Allow in development for testing
  }
  
  if (!secret) {
    logger.warn('Webhook secret not configured', { provider });
    return false; // In production, require secret
  }

  try {
    if (provider === 'shopify') {
      // Shopify uses HMAC SHA256
      const calculated = createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');
      
      return calculated === signature;
    }

    if (provider === 'woocommerce') {
      // WooCommerce uses HMAC SHA256
      const calculated = createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return calculated === signature;
    }

    // Generic: accept if secret matches
    return signature === secret;
  } catch (error) {
    logger.error('Signature validation failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

