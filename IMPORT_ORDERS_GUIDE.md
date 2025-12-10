# 📦 Import Orders as Events Guide

## Overview

The marketplace orders CSV contains order data, but to see them in customer activity timelines, they need to be imported as **events** into the platform.

## Quick Start

### Step 1: Import Customers First
```bash
# Go to dashboard and import customers
# http://localhost:3100/import
# Upload: marketplace-customers.csv
```

### Step 2: Import Orders as Events
```bash
# Make sure Event Collector service is running
# Then run the import script:
python3 scripts/import-orders-as-events.py
```

## What the Script Does

1. **Loads customers** from `marketplace-customers.csv`
2. **Reads orders** from `marketplace-orders.csv`
3. **Joins them** by customer_id to get email/phone
4. **Converts each order** to an event:
   - `event_type`: "order_placed"
   - `source`: platform name (shopify, amazon, etc.)
   - `identifiers`: email and phone from customer
   - `payload`: full order details (product, price, status, etc.)
5. **Sends events** to Event Collector API in batches

## Event Format

Each order becomes an event like this:

```json
{
  "source": "shopify",
  "event_type": "order_placed",
  "event_ts": "2025-03-18T17:12:45Z",
  "identifiers": {
    "email": "customer@example.com",
    "phone": "+919876543210"
  },
  "payload": {
    "order_id": "SH123456",
    "product_name": "Smartphone",
    "product_sku": "ELE2040",
    "category": "Electronics",
    "quantity": 2,
    "unit_price": 25000,
    "subtotal": 50000,
    "discount": 5000,
    "tax": 8100,
    "shipping": 0,
    "total": 53100,
    "currency": "INR",
    "status": "completed",
    "payment_method": "credit_card"
  }
}
```

## Requirements

- ✅ Event Collector service running (`http://localhost:3001`)
- ✅ API Gateway running (`http://localhost:3000`)
- ✅ Customers already imported (for email/phone lookup)
- ✅ Python 3 with `requests` library

## Install Dependencies

```bash
pip3 install requests
```

## Configuration

Edit `scripts/import-orders-as-events.py` to change:

- `API_GATEWAY_URL`: Default `http://localhost:3000/v1/events`
- `API_KEY`: Default `test-api-key`
- `BATCH_SIZE`: Events per batch (default: 50)
- `DELAY_BETWEEN_BATCHES`: Seconds between batches (default: 0.5)

## Expected Output

```
🛍️  Importing Marketplace Orders as Events
============================================================
📖 Loading customers from marketplace-customers.csv...
   ✅ Loaded 5000 customers

📦 Processing orders from marketplace-orders.csv...
   📤 Sending batch of 50 events... (Total: 50)
      ✅ 50/50 successful in this batch
   📤 Sending batch of 50 events... (Total: 100)
      ✅ 50/50 successful in this batch
   ...

============================================================
📊 Import Summary:
   Total orders processed: 57562
   ✅ Successfully imported: 57562
   ❌ Failed: 0
   ⏭️  Skipped: 0
   Success rate: 100.0%

💡 Orders are now visible in customer activity timelines!
   Check customer profiles to see order history.
```

## After Import

1. **Go to any customer profile** in the dashboard
2. **Scroll to Activity Timeline**
3. **See all orders** as timeline events with:
   - Order date
   - Product name
   - Total amount
   - Status
   - Payment method

## Troubleshooting

### "Connection refused"
- Make sure Event Collector is running: `cd services/event-collector && pnpm dev`

### "Customer not found"
- Import customers first via dashboard
- Check that customer_id in orders CSV matches customers CSV

### "Validation failed"
- Check that orders CSV has required columns
- Verify date format is `YYYY-MM-DD HH:MM:SS`

### Slow import
- Increase `BATCH_SIZE` (e.g., 100)
- Decrease `DELAY_BETWEEN_BATCHES` (e.g., 0.1)

## Alternative: Direct Database Import

If you prefer to import directly to the database (faster for large datasets):

```sql
-- This would require a custom script that:
-- 1. Reads orders CSV
-- 2. Joins with customers
-- 3. Inserts into customer_raw_event table
-- 4. Triggers identity resolution
```

But the event API approach is recommended as it:
- ✅ Triggers identity resolution automatically
- ✅ Maintains event history
- ✅ Works with existing event processing pipeline

---

**Ready to import?** Run the script and watch orders appear in customer timelines! 🎉

