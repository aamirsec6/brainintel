/**
 * Event Normalization Utilities
 * Normalize identifiers for consistent matching
 */
import { normalizePhone, normalizeEmail, generateHash } from '@retail-brain/utils';
import { IncomingEvent } from '@retail-brain/types';

export interface NormalizedIdentifiers {
  phone?: {
    raw: string;
    normalized: string;
    hash: string;
  };
  email?: {
    raw: string;
    normalized: string;
    hash: string;
  };
  device?: {
    raw: string;
    hash: string;
  };
  cookie?: {
    raw: string;
    hash: string;
  };
  loyalty_id?: {
    raw: string;
    hash: string;
  };
  invoice_id?: {
    raw: string;
    hash: string;
  };
}

/**
 * Normalize all identifiers in an event
 */
export function normalizeIdentifiers(
  identifiers: IncomingEvent['identifiers']
): NormalizedIdentifiers {
  const normalized: NormalizedIdentifiers = {};

  // Normalize phone
  if (identifiers.phone) {
    const normalizedPhone = normalizePhone(identifiers.phone);
    normalized.phone = {
      raw: identifiers.phone,
      normalized: normalizedPhone,
      hash: generateHash(normalizedPhone),
    };
  }

  // Normalize email
  if (identifiers.email) {
    const normalizedEmail = normalizeEmail(identifiers.email);
    normalized.email = {
      raw: identifiers.email,
      normalized: normalizedEmail,
      hash: generateHash(normalizedEmail),
    };
  }

  // Device (just hash, no normalization needed)
  if (identifiers.device) {
    normalized.device = {
      raw: identifiers.device,
      hash: generateHash(identifiers.device.toLowerCase().trim()),
    };
  }

  // Cookie (just hash)
  if (identifiers.cookie) {
    normalized.cookie = {
      raw: identifiers.cookie,
      hash: generateHash(identifiers.cookie.toLowerCase().trim()),
    };
  }

  // Loyalty ID (just hash)
  if (identifiers.loyalty_id) {
    normalized.loyalty_id = {
      raw: identifiers.loyalty_id,
      hash: generateHash(identifiers.loyalty_id.toLowerCase().trim()),
    };
  }

  // Invoice ID (just hash)
  if (identifiers.invoice_id) {
    normalized.invoice_id = {
      raw: identifiers.invoice_id,
      hash: generateHash(identifiers.invoice_id.toLowerCase().trim()),
    };
  }

  return normalized;
}

/**
 * Extract e-commerce fields from payload for denormalization
 */
export function extractEcommerceFields(payload: Record<string, unknown>) {
  return {
    sku: typeof payload.sku === 'string' ? payload.sku : null,
    product_name:
      typeof payload.product_name === 'string' ? payload.product_name : null,
    category: typeof payload.category === 'string' ? payload.category : null,
    price:
      typeof payload.price === 'number'
        ? payload.price
        : typeof payload.price === 'string'
        ? parseFloat(payload.price)
        : null,
    quantity:
      typeof payload.quantity === 'number'
        ? payload.quantity
        : typeof payload.quantity === 'string'
        ? parseInt(payload.quantity, 10)
        : null,
    revenue:
      typeof payload.revenue === 'number'
        ? payload.revenue
        : typeof payload.revenue === 'string'
        ? parseFloat(payload.revenue)
        : null,
  };
}

/**
 * Extract session information from payload
 */
export function extractSessionInfo(payload: Record<string, unknown>) {
  return {
    session_id:
      typeof payload.session_id === 'string' ? payload.session_id : null,
    channel: typeof payload.channel === 'string' ? payload.channel : null,
    campaign: typeof payload.campaign === 'string' ? payload.campaign : null,
    utm_source:
      typeof payload.utm_source === 'string' ? payload.utm_source : null,
    utm_medium:
      typeof payload.utm_medium === 'string' ? payload.utm_medium : null,
    utm_campaign:
      typeof payload.utm_campaign === 'string' ? payload.utm_campaign : null,
  };
}

