/**
 * WooCommerce Webhook Transformer
 * Transforms WooCommerce webhook events to Retail Brain format
 */
import { createLogger } from '@retail-brain/logger';
import { IncomingEvent } from '@retail-brain/types';

const logger = createLogger({ service: 'woocommerce-transformer' });

export const woocommerceTransformer = {
  /**
   * Transform WooCommerce webhook to Retail Brain events
   */
  async transform(wooData: any, action: string, resource: string): Promise<IncomingEvent[]> {
    const events: IncomingEvent[] = [];

    try {
      if (resource === 'order') {
        events.push(transformOrder(wooData, action));
      } else if (resource === 'customer') {
        events.push(transformCustomer(wooData, action));
      } else if (resource === 'product') {
        events.push(transformProduct(wooData, action));
      }
    } catch (error) {
      logger.error('WooCommerce transformation failed', error instanceof Error ? error : new Error(String(error)));
    }

    return events;
  },
};

function transformOrder(order: any, action: string): IncomingEvent {
  const eventType = order.status === 'completed' || order.status === 'processing' 
    ? 'purchase' 
    : action === 'created' ? 'order_created' : 'order_updated';

  return {
    source: 'woocommerce',
    event_type: eventType,
    event_ts: order.date_created || new Date().toISOString(),
    identifiers: {
      email: order.billing?.email,
      phone: order.billing?.phone,
    },
    payload: {
      order_id: order.id?.toString(),
      order_number: order.number,
      total: parseFloat(order.total || '0'),
      currency: order.currency,
      line_items: order.line_items || [],
      customer_id: order.customer_id?.toString(),
      status: order.status,
      billing: order.billing,
      shipping: order.shipping,
    },
  };
}

function transformCustomer(customer: any, action: string): IncomingEvent {
  return {
    source: 'woocommerce',
    event_type: action === 'created' ? 'customer_created' : 'customer_updated',
    event_ts: customer.date_created || customer.date_modified || new Date().toISOString(),
    identifiers: {
      email: customer.email,
    },
    payload: {
      customer_id: customer.id?.toString(),
      first_name: customer.first_name,
      last_name: customer.last_name,
      total_spent: parseFloat(customer.total_spent || '0'),
      orders_count: customer.orders_count || 0,
    },
  };
}

function transformProduct(product: any, action: string): IncomingEvent {
  return {
    source: 'woocommerce',
    event_type: 'product_updated',
    event_ts: product.date_created || product.date_modified || new Date().toISOString(),
    identifiers: {},
    payload: {
      product_id: product.id?.toString(),
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price || '0'),
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
    },
  };
}

