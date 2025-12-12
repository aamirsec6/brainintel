# 🌐 Website Integration Guide

Connect your website to Retail Brain to automatically track customer events and capture customer data.

## Quick Start

### 1. Add the Tracker Script

Add this to your website's HTML (in `<head>` or before `</body>`):

```html
<script src="http://localhost:3000/tracker.js"></script>
<script>
  RetailBrain.init({
    apiUrl: 'http://localhost:3000',  // Your API Gateway URL
    debug: true                       // Set to false in production
  });
</script>
```

### 2. For Production

Replace `http://localhost:3000` with your production API URL:

```html
<script src="https://api.yourdomain.com/tracker.js"></script>
<script>
  RetailBrain.init({
    apiUrl: 'https://api.yourdomain.com'
  });
</script>
```

## What Gets Tracked Automatically

✅ **Page Views** - Every page visit  
✅ **Sessions** - Unique session IDs  
✅ **User IDs** - Persistent user identification  
✅ **Device IDs** - Unique device tracking  
✅ **Context** - URL, referrer, screen size, user agent, etc.

## Manual Event Tracking

### Track Product Views

```javascript
RetailBrain.track('product_view', {
  product_id: '123',
  product_name: 'iPhone 15 Pro',
  category: 'Electronics',
  price: 99999,
  currency: 'INR'
});
```

### Track Purchases

```javascript
RetailBrain.trackPurchase({
  order_id: 'ORD-12345',
  revenue: 99999,
  currency: 'INR',
  items: [
    {
      product_id: '123',
      name: 'iPhone 15 Pro',
      price: 99999,
      quantity: 1
    }
  ]
});
```

### Track Add to Cart

```javascript
RetailBrain.trackAddToCart({
  product_id: '123',
  product_name: 'iPhone 15 Pro',
  price: 99999,
  quantity: 1
});
```

### Track Button Clicks

```javascript
document.getElementById('buy-button').addEventListener('click', () => {
  RetailBrain.trackClick(this, {
    button_name: 'Buy Now',
    product_id: '123'
  });
});
```

### Track Form Submissions

```javascript
document.getElementById('contact-form').addEventListener('submit', (e) => {
  RetailBrain.trackFormSubmit(e.target, {
    form_type: 'contact',
    lead_source: 'website'
  });
});
```

## User Identification

Identify users when they log in or provide information:

```javascript
// When user logs in
RetailBrain.identify({
  user_id: 'user_123',
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+919876543210'
});
```

## E-commerce Integration Example

```javascript
// Product page
RetailBrain.track('product_view', {
  product_id: product.id,
  product_name: product.name,
  category: product.category,
  price: product.price
});

// Add to cart button
document.getElementById('add-to-cart').addEventListener('click', () => {
  RetailBrain.trackAddToCart({
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    quantity: 1
  });
});

// Checkout completion
function onCheckoutComplete(order) {
  RetailBrain.trackPurchase({
    order_id: order.id,
    revenue: order.total,
    currency: 'INR',
    items: order.items.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
  
  // Identify the customer
  RetailBrain.identify({
    email: order.customer.email,
    name: order.customer.name,
    phone: order.customer.phone
  });
}
```

## React/Next.js Integration

### React Component

```jsx
import { useEffect } from 'react';

function ProductPage({ product }) {
  useEffect(() => {
    // Track product view
    if (window.RetailBrain) {
      window.RetailBrain.track('product_view', {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        price: product.price
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (window.RetailBrain) {
      window.RetailBrain.trackAddToCart({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1
      });
    }
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### Next.js App Router

Add to `app/layout.tsx`:

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script src="http://localhost:3000/tracker.js" async></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              RetailBrain.init({
                apiUrl: 'http://localhost:3000',
                debug: false
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Configuration Options

```javascript
RetailBrain.init({
  // Required
  apiUrl: 'https://api.yourdomain.com',
  
  // Optional
  apiKey: 'your-api-key',              // For authenticated requests
  userId: 'user_123',                  // Pre-set user ID
  enabled: true,                       // Enable/disable tracking
  debug: false,                        // Enable debug logs
  
  // Auto-tracking
  autoTrack: {
    pageviews: true,                   // Auto-track page views
    clicks: false,                     // Auto-track button clicks
    forms: false                       // Auto-track form submissions
  },
  
  // Batching
  batchSize: 10,                       // Flush after N events
  flushInterval: 5000                 // Flush every N milliseconds
});
```

## Testing

1. **Open the example page**: `apps/website-tracker/example.html` in your browser
2. **Open browser console** to see debug logs
3. **Click buttons** to trigger events
4. **Check the dashboard** at `http://localhost:3100/analytics` to see events

## What Happens to the Data?

1. **Events are sent** to `POST {apiUrl}/events`
2. **Event Collector** validates and stores events
3. **Identity Engine** processes events and creates/updates customer profiles
4. **Profile Service** aggregates data into Customer 360 views
5. **Dashboard** displays analytics and customer insights

## Privacy & GDPR

- ✅ **No cookies by default** (uses localStorage/sessionStorage)
- ✅ **User can opt-out**: `RetailBrain.config().enabled = false`
- ✅ **Data is hashed** on the server for privacy
- ✅ **GDPR compliant** - you control what data is sent

## Troubleshooting

### Events Not Sending

1. Check browser console for errors
2. Verify `apiUrl` is correct
3. Check CORS settings on API Gateway
4. Enable debug mode: `debug: true`

### CORS Errors

Make sure your API Gateway has CORS enabled (it should by default).

### Events Delayed

Events are batched for performance. To send immediately:

```javascript
RetailBrain.flush();
```

## Next Steps

1. ✅ Add tracker script to your website
2. ✅ Track key events (purchases, signups, etc.)
3. ✅ Identify users when they log in
4. ✅ View events in dashboard: `http://localhost:3100/analytics`
5. ✅ See customer profiles automatically created

## Support

- 📖 [Tracker Documentation](apps/website-tracker/README.md)
- 📖 [Event Collector Documentation](services/event-collector/README.md)
- 📖 [API Gateway Documentation](services/api-gateway/README.md)

