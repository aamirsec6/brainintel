# Shopify Integration Setup Guide

## Quick Start

### 1. Start Required Services

```bash
# Start all services
pnpm -r dev

# Or start specific services:
# - API Gateway (port 3000)
# - Webhook Service (port 3007)
# - Event Collector (port 3001)
# - Identity Engine (port 3002)
# - Profile Service (port 3003)
```

### 2. Configure Shopify Webhook

1. **Go to Shopify Admin** → Settings → Notifications → Webhooks

2. **Create Webhook** with these settings:
   - **Event**: Select events you want to track:
     - `Order creation`
     - `Order payment`
     - `Order update`
     - `Customer creation`
     - `Customer update`
     - `Checkout creation`
     - `Cart update` (if available)
   
   - **Format**: JSON
   
   - **URL**: `http://your-domain.com:3000/webhooks/shopify`
     - For local testing: Use ngrok or similar tunnel
     - Example: `https://abc123.ngrok.io/webhooks/shopify`
   
   - **API version**: 2024-01 or later

3. **Get Webhook Secret**:
   - After creating webhook, Shopify will show a secret
   - Add to your `.env` file:
     ```
     SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
     ```

### 3. Environment Variables

Add to `.env`:

```bash
# Shopify Webhook
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here

# Service URLs (if running locally)
WEBHOOK_SERVICE_URL=http://localhost:3007
EVENT_COLLECTOR_URL=http://localhost:3001
API_GATEWAY_URL=http://localhost:3000
```

### 4. Test Webhook (Local Development)

For local testing, use ngrok:

```bash
# Install ngrok
brew install ngrok  # Mac
# or download from https://ngrok.com

# Start tunnel
ngrok http 3000

# Use the HTTPS URL in Shopify webhook settings
# Example: https://abc123.ngrok.io/webhooks/shopify
```

## What Gets Tracked

### Events Captured:
- ✅ **Orders**: Order creation, payment, updates
- ✅ **Customers**: Customer creation, updates
- ✅ **Checkouts**: Abandoned cart tracking
- ✅ **Carts**: Add to cart events

### Data Stored:
- Customer profiles (unified by email/phone)
- Order history
- Revenue tracking
- Customer lifetime value (LTV)
- Order frequency

## Verify Integration

1. **Check Webhook Service**:
   ```bash
   curl http://localhost:3007/health
   ```

2. **Test with Sample Webhook**:
   ```bash
   # Use the test script
   pnpm test:shopify-webhook
   ```

3. **Check Dashboard**:
   - Go to `http://localhost:3100/customers`
   - You should see Shopify customers appearing

## Troubleshooting

### Webhook Not Receiving Data?
- Check webhook service is running: `curl http://localhost:3007/health`
- Verify webhook URL is accessible (use ngrok for local)
- Check webhook secret matches in `.env`
- Check logs: `tail -f logs/webhook-service.log`

### Events Not Appearing?
- Check Event Collector is running
- Check Identity Engine is running
- Check database: `SELECT COUNT(*) FROM customer_raw_event;`
- Check logs for errors

### Customers Not Merging?
- Verify Identity Engine is processing events
- Check merge logs: `SELECT * FROM identity_merge_log;`

## Next Steps

1. **Set up Connector Service** for historical data sync
2. **Configure Journey Tracking** for attribution
3. **Set up Product Catalog Sync** for inventory
4. **Build Custom Dashboards** for Shopify-specific metrics

