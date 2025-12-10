# 🚀 EASIER Shopify Setup - No Webhooks Needed!

## ✨ The Simple Way (Recommended)

**Instead of webhooks + ngrok**, use the **API Connector** - it's much easier!

### One-Click Setup:

1. **Open Dashboard**: http://localhost:3100/connectors/shopify

2. **Enter Your Shopify Credentials**:
   - Store URL: `your-store.myshopify.com`
   - API Key: Get from Shopify Admin (see below)
   - API Secret: Optional

3. **Click "Connect & Sync"** - That's it! 🎉

### How to Get Shopify API Key:

1. Go to **Shopify Admin** → **Apps** → **Develop apps**
2. Click **"Create an app"**
3. Name it: **"Retail Brain"**
4. Go to **"Admin API access scopes"**
5. Enable these permissions:
   - ✅ `read_orders`
   - ✅ `read_customers`
   - ✅ `read_products` (optional)
6. Click **"Install app"**
7. Copy the **Admin API access token** (starts with `shpat_`)

### What Happens:

- ✅ Automatically syncs last 7 days of orders
- ✅ Creates customer profiles
- ✅ Updates every 6 hours automatically
- ✅ No webhooks needed!
- ✅ No ngrok needed!
- ✅ Works from localhost!

## 📊 What You Get:

- **Customer Profiles**: All your Shopify customers
- **Order History**: Complete order data
- **Revenue Analytics**: Total revenue, LTV, trends
- **Customer 360**: Unified view of each customer

## 🔄 Manual Sync:

You can also trigger sync manually:

```bash
# Via API
curl -X POST http://localhost:3000/connectors/{connector_id}/sync \
  -H "Authorization: Bearer test_api_key"

# Or use the dashboard
```

## 🆚 Webhooks vs API Connector

| Feature | Webhooks | API Connector (Easier) |
|---------|----------|------------------------|
| Setup Complexity | ⚠️ Medium (needs ngrok) | ✅ Easy (just API key) |
| Real-time | ✅ Instant | ⚠️ Every 6 hours |
| Historical Data | ❌ Only new orders | ✅ Syncs past orders |
| Local Testing | ⚠️ Needs tunnel | ✅ Works locally |
| **Recommendation** | Production | **Development/Testing** |

## 💡 Best Approach:

1. **Start with API Connector** (easier, works immediately)
2. **Switch to Webhooks later** (for real-time in production)

## 🎯 Quick Start:

```bash
# 1. Start services
pnpm -r dev

# 2. Open dashboard
open http://localhost:3100/connectors/shopify

# 3. Enter credentials and connect!

# 4. View results
open http://localhost:3100/customers
```

That's it! Much simpler than webhooks! 🎉

