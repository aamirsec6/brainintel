# 🛍️ Marketplace Data Import Guide

## 📁 Generated Files

Two CSV files have been created with realistic marketplace/e-commerce data:

### 1. `marketplace-customers.csv`
- **5,000 customers** from 6 different platforms
- Includes: Shopify, WooCommerce, Magento, Amazon, Myntra, Flipkart
- Each customer has complete profile information

### 2. `marketplace-orders.csv`
- **~55,000 orders** (10-12 orders per customer on average)
- Complete order history with products, prices, taxes, shipping
- Platform-specific order IDs

---

## 📊 Data Structure

### Customers CSV Columns:
- `customer_id` - Platform-specific customer ID (e.g., SHOPIFY123456)
- `platform` - Source platform (shopify, woocommerce, magento, amazon, myntra, flipkart)
- `first_name`, `last_name` - Customer name
- `email` - Email address
- `phone` - Phone number (+91 format)
- `city`, `state`, `postal_code`, `country` - Address
- `total_orders` - Number of orders
- `total_spent` - Total lifetime value
- `first_order_date`, `last_order_date` - Order date range

### Orders CSV Columns:
- `order_id` - Platform-specific order ID
- `customer_id` - Links to customer
- `platform` - Source platform
- `order_date` - Order timestamp
- `product_name`, `product_sku`, `category` - Product details
- `quantity`, `unit_price`, `subtotal` - Pricing
- `discount`, `tax`, `shipping`, `total` - Order totals
- `currency` - INR
- `status` - Order status (completed, pending, shipped, etc.)
- `payment_method` - Payment type

---

## 🚀 How to Import

### Option 1: Import Customers First, Then Orders

#### Step 1: Import Customers
1. Go to: `http://localhost:3100/import`
2. Upload `marketplace-customers.csv`
3. Map columns:
   - `phone` → Phone
   - `email` → Email
   - `first_name` → First Name
   - `last_name` → Last Name
   - `city` → City
   - `state` → State
4. Click "Import"

#### Step 2: Import Orders as Events
The orders need to be imported as events. You can:
- Use the Event Collector API to send order events
- Or create a script to convert orders to events

### Option 2: Import Orders as Events (Recommended)

**Use the automated script** to convert all orders to events:

```bash
# 1. Make sure Event Collector is running
# 2. Run the import script:
python3 scripts/import-orders-as-events.py
```

This script will:
- ✅ Load customers to get email/phone identifiers
- ✅ Convert each order to an event
- ✅ Send events to Event Collector API in batches
- ✅ Make orders visible in customer activity timelines

**See `IMPORT_ORDERS_GUIDE.md` for detailed instructions.**

### Option 3: Manual API Import

Convert orders to events and send via API manually:

```bash
# Example: Convert order to event
curl -X POST http://localhost:3000/v1/events \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "shopify",
    "event_type": "order_placed",
    "event_ts": "2025-12-09T10:30:00Z",
    "identifiers": {
      "email": "customer@example.com",
      "phone": "+919876543210"
    },
    "payload": {
      "order_id": "SH123456",
      "product_name": "Smartphone",
      "total": 25000,
      "currency": "INR"
    }
  }'
```

---

## 📋 Platform Distribution

The data includes customers from:
- **Shopify** - E-commerce stores
- **WooCommerce** - WordPress stores
- **Magento** - Enterprise stores
- **Amazon** - Marketplace
- **Myntra** - Fashion marketplace
- **Flipkart** - General marketplace

Each platform has realistic:
- Order ID formats
- Product categories
- Price ranges
- Order patterns

---

## 🎯 Data Characteristics

### Realistic Features:
- ✅ **Indian addresses** (cities, states, postal codes)
- ✅ **Indian phone numbers** (+91 format)
- ✅ **Realistic product names** (Electronics, Fashion, Home, etc.)
- ✅ **Price ranges** matching Indian market
- ✅ **Order history** spread over 2 years
- ✅ **Platform-specific IDs** (SH, WC, MG, AMZ, MYN, FLP)
- ✅ **Order statuses** (completed, pending, shipped, etc.)
- ✅ **Payment methods** (UPI, Credit Card, COD, etc.)
- ✅ **Taxes** (18% GST)
- ✅ **Shipping charges** (free over ₹1000)

### Order Patterns:
- Average **10-12 orders** per customer
- More recent orders = higher frequency
- Mix of order statuses
- Realistic discounts (0-30%)
- Various product categories

---

## 💡 Usage Tips

1. **Import customers first** - This creates the profiles
2. **Orders will merge** - Same email/phone = same profile
3. **Check merge logs** - See how duplicates were resolved
4. **View analytics** - See platform distribution, top products, etc.

---

## 📊 Expected Results After Import

- **~5,000 customer profiles** (after merging duplicates)
- **~55,000 order events** in timeline
- **Platform insights** - Which platforms drive most revenue
- **Product analytics** - Top categories, best sellers
- **Customer segments** - High-value, frequent buyers, etc.

---

## 🔄 Converting Orders to Events

If you want to import orders as events, here's a sample script:

```python
import csv
import requests
import json
from datetime import datetime

API_URL = "http://localhost:3000/v1/events"
API_KEY = "test-api-key"

with open('marketplace-orders.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        event = {
            "source": row['platform'],
            "event_type": "order_placed",
            "event_ts": row['order_date'],
            "identifiers": {
                "email": row.get('email'),  # Need to join with customers
                "phone": row.get('phone'),  # Need to join with customers
            },
            "payload": {
                "order_id": row['order_id'],
                "product_name": row['product_name'],
                "product_sku": row['product_sku'],
                "category": row['category'],
                "quantity": int(row['quantity']),
                "unit_price": float(row['unit_price']),
                "total": float(row['total']),
                "currency": row['currency'],
                "status": row['status'],
                "payment_method": row['payment_method'],
            }
        }
        
        # Send event
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json=event
        )
```

---

## ✅ Files Ready

- ✅ `marketplace-customers.csv` - 5,000 customers
- ✅ `marketplace-orders.csv` - ~55,000 orders
- ✅ Realistic Indian marketplace data
- ✅ Multiple platforms represented
- ✅ Ready to import!

---

**Next Step**: Import `marketplace-customers.csv` via the dashboard!

