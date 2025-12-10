/**
 * Shopify Webhook Transformer
 * Transforms Shopify webhook events to Retail Brain format
 */
import { createLogger } from '@retail-brain/logger';
import { IncomingEvent } from '@retail-brain/types';

const logger = createLogger({ service: 'shopify-transformer' });

export const shopifyTransformer = {
  /**
   * Transform Shopify webhook to Retail Brain events
   */
  async transform(shopifyData: any, topic: string): Promise<IncomingEvent[]> {
    const events: IncomingEvent[] = [];

    try {
      switch (topic) {
        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
          events.push(transformOrder(shopifyData, topic));
          break;

        case 'customers/create':
        case 'customers/update':
          events.push(transformCustomer(shopifyData, topic));
          break;

        case 'checkouts/create':
        case 'checkouts/update':
          events.push(transformCheckout(shopifyData, topic));
          break;

        case 'carts/create':
        case 'carts/update':
          events.push(transformCart(shopifyData, topic));
          break;

        default:
          logger.warn('Unknown Shopify topic', { topic });
      }
    } catch (error) {
      logger.error('Shopify transformation failed', error instanceof Error ? error : new Error(String(error)));
    }

    return events;
  },
};

function transformOrder(order: any, topic: string): IncomingEvent {
  const eventType = topic.includes('paid') ? 'purchase' : topic.includes('create') ? 'order_created' : 'order_updated';

  return {
    source: 'shopify',
    event_type: eventType,
    event_ts: order.created_at || new Date().toISOString(),
    identifiers: {
      email: order.email,
      phone: order.phone,
    },
    payload: {
      order_id: order.id?.toString(),
      order_number: order.order_number,
      total_price: parseFloat(order.total_price || '0'),
      currency: order.currency,
      line_items: order.line_items || [],
      customer_id: order.customer?.id?.toString(),
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
    },
  };
}

function transformCustomer(customer: any, topic: string): IncomingEvent {
  return {
    source: 'shopify',
    event_type: topic.includes('create') ? 'customer_created' : 'customer_updated',
    event_ts: customer.created_at || customer.updated_at || new Date().toISOString(),
    identifiers: {
      email: customer.email,
      phone: customer.phone,
    },
    payload: {
      customer_id: customer.id?.toString(),
      first_name: customer.first_name,
      last_name: customer.last_name,
      total_spent: parseFloat(customer.total_spent || '0'),
      orders_count: customer.orders_count || 0,
      tags: customer.tags,
    },
  };
}

function transformCheckout(checkout: any, topic: string): IncomingEvent {
  return {
    source: 'shopify',
    event_type: 'checkout',
    event_ts: checkout.created_at || new Date().toISOString(),
    identifiers: {
      email: checkout.email,
      phone: checkout.phone,
    },
    payload: {
      checkout_id: checkout.id?.toString(),
      total_price: parseFloat(checkout.total_price || '0'),
      line_items: checkout.line_items || [],
      abandoned: !checkout.completed_at,
    },
  };
}

function transformCart(cart: any, topic: string): IncomingEvent {
  return {
    source: 'shopify',
    event_type: 'add_to_cart',
    event_ts: cart.updated_at || cart.created_at || new Date().toISOString(),
    identifiers: {
      email: cart.email,
    },
    payload: {
      cart_id: cart.id?.toString(),
      line_items: cart.line_items || [],
      total_price: parseFloat(cart.total_price || '0'),
    },
  };
}

