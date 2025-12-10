# Shopify Integration - Quick Start

## ✅ What's Ready

Your Retail Brain platform is **fully configured** for Shopify integration:

- ✅ Webhook endpoint: `http://localhost:3000/webhooks/shopify`
- ✅ Signature validation (with dev mode bypass for testing)
- ✅ Event transformation (orders, customers, carts, checkouts)
- ✅ Identity resolution (merges duplicate customers)
- ✅ Customer 360 profiles
- ✅ Analytics dashboard

## 🚀 Start Services

```bash
# Start all services
pnpm -r dev

# Or start individually:
cd services/webhook-service && pnpm dev &
cd services/event-collector && pnpm dev &
cd services/identity-engine && pnpm dev &
cd services/profile-service && pnpm dev &
```

## 🧪 Test Locally

```bash
# Run test script
pnpm test:shopify

# Or manually test:
curl -X POST http://localhost:3000/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Hmac-Sha256: test" \
  -d '{
    "id": 123,
    "email": "customer@example.com",
    "total_price": "100.00",
    "line_items": []
  }'
```

## 🔗 Connect Real Shopify Store

### Option 1: Local Testing with ngrok

1. **Install ngrok:**
   ```bash
   brew install ngrok  # Mac
   # or download from https://ngrok.com
   ```

2. **Start tunnel:**
   ```bash
   ngrok http 3000
   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   ```

3. **Configure Shopify Webhook:**
   - Go to Shopify Admin → Settings → Notifications → Webhooks
   - Create webhook:
     - **Event**: Order creation
     - **URL**: `https://your-ngrok-url.ngrok.io/webhooks/shopify`
     - **Format**: JSON
   - Copy the webhook secret

4. **Add to `.env`:**
   ```bash
   SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### Option 2: Production Deployment

1. Deploy your API Gateway to a public URL
2. Configure Shopify webhook to point to: `https://your-domain.com/webhooks/shopify`
3. Set `SHOPIFY_WEBHOOK_SECRET` in production environment

## 📊 View Results

After connecting Shopify:

- **Dashboard**: http://localhost:3100
- **Customers**: http://localhost:3100/customers
- **Analytics**: http://localhost:3100/analytics
- **Individual Customer**: http://localhost:3100/customers/{id}

## 🎯 Insights You'll Get

### Immediate (Works Now):
- ✅ Customer profiles with order history
- ✅ Total revenue per customer
- ✅ Order frequency and recency
- ✅ Customer segmentation (VIP, frequent, etc.)
- ✅ Revenue trends

### After Setup:
- ⚙️ Journey tracking (needs automation)
- ⚙️ Attribution models (needs UTM data)
- ⚙️ Product performance (needs catalog sync)

## 🐛 Troubleshooting

**Webhook not receiving?**
- Check webhook service: `curl http://localhost:3007/health`
- Check API Gateway: `curl http://localhost:3000/health`
- Verify ngrok is running and URL is correct
- Check logs for errors

**Events not appearing?**
- Check Event Collector is running
- Check database: `SELECT COUNT(*) FROM customer_raw_event WHERE source = 'shopify';`
- Check Identity Engine processed events

**Customers not showing?**
- Check Profile Service is running
- Verify events were processed: `SELECT COUNT(*) FROM events;`
- Check customer profiles: `SELECT COUNT(*) FROM customer_profile;`

## 📖 Full Documentation

See `SHOPIFY_SETUP.md` for complete setup guide.

