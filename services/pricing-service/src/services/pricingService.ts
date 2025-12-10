/**
 * Pricing Service
 * Manages pricing rules and calculates prices
 */
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import Redis from 'ioredis';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({ service: 'pricing-service' });
const db = getDb();
const config = getConfig();

const redis = new Redis({
  host: config.REDIS_HOST || 'localhost',
  port: config.REDIS_PORT || 6379,
});

export interface PricingRule {
  id: string;
  sku: string;
  channel: string | null;
  segment: string | null;
  region: string | null;
  base_price: number;
  promotional_price: number | null;
  valid_from: Date | null;
  valid_until: Date | null;
  priority: number;
  rule_name: string | null;
  enabled: boolean;
}

export interface Price {
  sku: string;
  base_price: number;
  final_price: number;
  promotional_price: number | null;
  rule_id: string | null;
  channel: string | null;
  segment: string | null;
}

export const pricingService = {
  /**
   * Get price for SKU with context
   */
  async getPrice(
    sku: string,
    channel?: string,
    segment?: string,
    region?: string
  ): Promise<Price> {
    const cacheKey = `price:${sku}:${channel || 'all'}:${segment || 'all'}:${region || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Find matching pricing rule with highest priority
    const now = new Date();
    
    let query = `
      SELECT * FROM pricing_rules
      WHERE sku = $1 
        AND enabled = TRUE
        AND (valid_from IS NULL OR valid_from <= $2)
        AND (valid_until IS NULL OR valid_until >= $2)
    `;
    
    const params: any[] = [sku, now];
    let paramIndex = 3;

    // Add context filters
    if (channel) {
      query += ` AND (channel = $${paramIndex} OR channel IS NULL)`;
      params.push(channel);
      paramIndex++;
    } else {
      query += ` AND channel IS NULL`;
    }

    if (segment) {
      query += ` AND (segment = $${paramIndex} OR segment IS NULL)`;
      params.push(segment);
      paramIndex++;
    } else {
      query += ` AND segment IS NULL`;
    }

    if (region) {
      query += ` AND (region = $${paramIndex} OR region IS NULL)`;
      params.push(region);
      paramIndex++;
    } else {
      query += ` AND region IS NULL`;
    }

    query += ` ORDER BY priority DESC, created_at DESC LIMIT 1`;

    const result = await db.query(query, params);

    let price: Price;

    if (result.rows.length > 0) {
      const rule = result.rows[0];
      const finalPrice = rule.promotional_price && 
        (!rule.valid_until || new Date(rule.valid_until) >= now) &&
        (!rule.valid_from || new Date(rule.valid_from) <= now)
        ? rule.promotional_price
        : rule.base_price;

      price = {
        sku,
        base_price: parseFloat(rule.base_price),
        final_price: parseFloat(finalPrice),
        promotional_price: rule.promotional_price ? parseFloat(rule.promotional_price) : null,
        rule_id: rule.id,
        channel: rule.channel,
        segment: rule.segment,
      };
    } else {
      // Default price (should come from product catalog in production)
      price = {
        sku,
        base_price: 0,
        final_price: 0,
        promotional_price: null,
        rule_id: null,
        channel: channel || null,
        segment: segment || null,
      };
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(price));

    return price;
  },

  async createRule(data: Partial<PricingRule>): Promise<PricingRule> {
    const result = await db.query(
      `INSERT INTO pricing_rules (
        sku, channel, segment, region, base_price, promotional_price,
        valid_from, valid_until, priority, rule_name, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.sku,
        data.channel || null,
        data.segment || null,
        data.region || null,
        data.base_price,
        data.promotional_price || null,
        data.valid_from || null,
        data.valid_until || null,
        data.priority || 0,
        data.rule_name || null,
        data.enabled ?? true,
      ]
    );

    const rule = result.rows[0];
    
    // Invalidate cache
    await redis.del(`price:${rule.sku}:*`);

    // Record price history if price changed
    if (data.base_price) {
      await db.query(
        `INSERT INTO price_history (pricing_rule_id, sku, old_price, new_price, channel)
         VALUES ($1, $2, NULL, $3, $4)`,
        [rule.id, rule.sku, rule.base_price, rule.channel]
      );
    }

    return rule;
  },

  async updateRule(id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    // Get old price
    const oldRule = await db.query(`SELECT * FROM pricing_rules WHERE id = $1`, [id]);
    
    if (oldRule.rows.length === 0) {
      throw new Error(`Pricing rule not found: ${id}`);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.base_price !== undefined) {
      updates.push(`base_price = $${paramIndex++}`);
      params.push(data.base_price);
    }
    if (data.promotional_price !== undefined) {
      updates.push(`promotional_price = $${paramIndex++}`);
      params.push(data.promotional_price);
    }
    if (data.valid_from !== undefined) {
      updates.push(`valid_from = $${paramIndex++}`);
      params.push(data.valid_from);
    }
    if (data.valid_until !== undefined) {
      updates.push(`valid_until = $${paramIndex++}`);
      params.push(data.valid_until);
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      params.push(data.enabled);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await db.query(
      `UPDATE pricing_rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const rule = result.rows[0];

    // Record price history if price changed
    if (data.base_price !== undefined && data.base_price !== parseFloat(oldRule.rows[0].base_price)) {
      await db.query(
        `INSERT INTO price_history (pricing_rule_id, sku, old_price, new_price, channel)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, rule.sku, oldRule.rows[0].base_price, rule.base_price, rule.channel]
      );
    }

    // Invalidate cache
    await redis.del(`price:${rule.sku}:*`);

    return rule;
  },

  async deleteRule(id: string): Promise<void> {
    const rule = await db.query(`SELECT sku FROM pricing_rules WHERE id = $1`, [id]);
    
    await db.query(`DELETE FROM pricing_rules WHERE id = $1`, [id]);

    if (rule.rows.length > 0) {
      await redis.del(`price:${rule.rows[0].sku}:*`);
    }
  },

  async getRules(sku?: string, channel?: string): Promise<PricingRule[]> {
    let query = `SELECT * FROM pricing_rules WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (sku) {
      query += ` AND sku = $${paramIndex++}`;
      params.push(sku);
    }

    if (channel) {
      query += ` AND (channel = $${paramIndex} OR channel IS NULL)`;
      params.push(channel);
    }

    query += ` ORDER BY priority DESC, created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  async getPriceHistory(sku: string): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM price_history WHERE sku = $1 ORDER BY created_at DESC LIMIT 100`,
      [sku]
    );

    return result.rows;
  },
};

