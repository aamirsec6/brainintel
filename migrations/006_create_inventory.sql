-- Migration: 005_create_inventory
-- Description: Creates inventory tracking tables for omnichannel stock management

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product identification
  sku VARCHAR(255) NOT NULL,
  
  -- Channel and location
  channel VARCHAR(100) NOT NULL, -- 'web', 'pos', 'marketplace', 'app'
  warehouse_id UUID,
  warehouse_name VARCHAR(255),
  
  -- Stock levels
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  
  -- Reorder settings
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ,
  sync_source VARCHAR(100), -- 'manual', 'webhook', 'api', 'connector'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one inventory record per SKU per channel per warehouse
  UNIQUE(sku, channel, warehouse_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_channel ON inventory(channel);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(available_quantity) WHERE available_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(sku, channel) WHERE available_quantity <= reorder_point;

-- Inventory history table for tracking changes
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  
  -- Change details
  change_type VARCHAR(50) NOT NULL, -- 'adjustment', 'sale', 'return', 'restock', 'reserve', 'release'
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- Context
  order_id VARCHAR(255),
  event_id UUID,
  reason TEXT,
  user_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_history_inventory_id ON inventory_history(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

COMMENT ON TABLE inventory IS 'Real-time inventory tracking across channels and warehouses';
COMMENT ON TABLE inventory_history IS 'Audit trail for all inventory changes';

