/**
 * Inventory Service
 * Manages inventory across channels and warehouses
 */
import { createLogger } from '@retail-brain/logger';
import { getDb } from '@retail-brain/db';
import Redis from 'ioredis';
import { getConfig } from '@retail-brain/config';

const logger = createLogger({ service: 'inventory-service' });
const db = getDb();
const config = getConfig();

// Redis client for caching
const redis = new Redis({
  host: config.REDIS_HOST || 'localhost',
  port: config.REDIS_PORT || 6379,
});

export interface InventoryItem {
  id: string;
  sku: string;
  channel: string;
  warehouse_id: string | null;
  warehouse_name: string | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const inventoryService = {
  async getBySku(sku: string): Promise<InventoryItem[]> {
    // Check cache first
    const cacheKey = `inventory:sku:${sku}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await db.query(
      `SELECT * FROM inventory WHERE sku = $1 ORDER BY channel, warehouse_id`,
      [sku]
    );

    const inventory = result.rows;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(inventory));

    return inventory;
  },

  async getByChannel(channel: string): Promise<InventoryItem[]> {
    const result = await db.query(
      `SELECT * FROM inventory WHERE channel = $1 ORDER BY sku`,
      [channel]
    );

    return result.rows;
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const result = await db.query(
      `SELECT * FROM inventory 
       WHERE available_quantity <= reorder_point 
       ORDER BY available_quantity ASC`
    );

    return result.rows;
  },

  async updateQuantity(
    id: string,
    quantity: number,
    reason?: string,
    order_id?: string
  ): Promise<InventoryItem> {
    return await db.transaction(async (client) => {
      // Get current inventory
      const current = await client.query(
        `SELECT * FROM inventory WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (current.rows.length === 0) {
        throw new Error(`Inventory not found: ${id}`);
      }

      const currentItem = current.rows[0];
      const quantityBefore = currentItem.quantity;
      const quantityAfter = quantity;
      const quantityChange = quantityAfter - quantityBefore;

      // Update inventory
      const updateResult = await client.query(
        `UPDATE inventory 
         SET quantity = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantity, id]
      );

      const updated = updateResult.rows[0];

      // Record history
      await client.query(
        `INSERT INTO inventory_history (
          inventory_id, change_type, quantity_change, 
          quantity_before, quantity_after, order_id, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          'adjustment',
          quantityChange,
          quantityBefore,
          quantityAfter,
          order_id || null,
          reason || null,
        ]
      );

      // Invalidate cache
      await redis.del(`inventory:sku:${updated.sku}`);

      logger.info('Inventory updated', {
        id,
        sku: updated.sku,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
      });

      return updated;
    });
  },

  async reserve(id: string, quantity: number, order_id: string): Promise<InventoryItem> {
    return await db.transaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM inventory WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (current.rows.length === 0) {
        throw new Error(`Inventory not found: ${id}`);
      }

      const item = current.rows[0];

      if (item.available_quantity < quantity) {
        throw new Error(`Insufficient inventory. Available: ${item.available_quantity}, Requested: ${quantity}`);
      }

      const quantityBefore = item.reserved_quantity;
      const quantityAfter = quantityBefore + quantity;

      const updateResult = await client.query(
        `UPDATE inventory 
         SET reserved_quantity = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantityAfter, id]
      );

      const updated = updateResult.rows[0];

      // Record history
      await client.query(
        `INSERT INTO inventory_history (
          inventory_id, change_type, quantity_change,
          quantity_before, quantity_after, order_id
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          'reserve',
          quantity,
          quantityBefore,
          quantityAfter,
          order_id,
        ]
      );

      await redis.del(`inventory:sku:${updated.sku}`);

      return updated;
    });
  },

  async release(id: string, quantity: number, order_id: string): Promise<InventoryItem> {
    return await db.transaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM inventory WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (current.rows.length === 0) {
        throw new Error(`Inventory not found: ${id}`);
      }

      const item = current.rows[0];
      const quantityBefore = item.reserved_quantity;
      const quantityAfter = Math.max(0, quantityBefore - quantity);

      const updateResult = await client.query(
        `UPDATE inventory 
         SET reserved_quantity = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantityAfter, id]
      );

      const updated = updateResult.rows[0];

      // Record history
      await client.query(
        `INSERT INTO inventory_history (
          inventory_id, change_type, quantity_change,
          quantity_before, quantity_after, order_id
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          'release',
          -quantity,
          quantityBefore,
          quantityAfter,
          order_id,
        ]
      );

      await redis.del(`inventory:sku:${updated.sku}`);

      return updated;
    });
  },

  async getHistory(id: string): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM inventory_history 
       WHERE inventory_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [id]
    );

    return result.rows;
  },

  async bulkUpdate(updates: Array<{ id: string; quantity: number }>): Promise<InventoryItem[]> {
    const results: InventoryItem[] = [];

    for (const update of updates) {
      try {
        const item = await this.updateQuantity(update.id, update.quantity);
        results.push(item);
      } catch (error) {
        logger.error('Bulk update failed for item', {
          id: update.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  },
};

