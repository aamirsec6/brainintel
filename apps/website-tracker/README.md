# Retail Brain Website Tracker

JavaScript SDK for tracking customer events and capturing customer data from your website.

## Quick Start

### 1. Include the Tracker Script

Add this to your website's `<head>` or before the closing `</body>` tag:

```html
<script src="https://your-api-url.com/tracker.js"></script>
<script>
  RetailBrain.init({
    apiUrl: 'https://your-api-url.com',  // Your API Gateway URL
    apiKey: 'your-api-key',              // Optional, for authenticated requests
    debug: false                         // Set to true for development
  });
</script>
```

### 2. For Local Development

If running locally, use:

```html
<script src="http://localhost:3000/tracker.js"></script>
<script>
  RetailBrain.init({
    apiUrl: 'http://localhost:3000',
    debug: true
  });
</script>
```

## Features

### ✅ Automatic Tracking

The tracker automatically captures:

- **Page Views**: Every page visit
- **Session Tracking**: Unique session IDs
- **User Identification**: Persistent user IDs
- **Device Tracking**: Unique device identifiers
- **Context Data**: URL, referrer, screen size, user agent, etc.

### ✅ Manual Event Tracking

Track custom events:

```javascript
// Track a custom event
RetailBrain.track('product_view', {
  product_id: '123',
  product_name: 'iPhone 15',
  category: 'Electronics',
  price: 99999
});

// Track a purchase
RetailBrain.trackPurchase({
  order_id: 'ORD-12345',
  revenue: 99999,
  currency: 'INR',
  items: [
    { product_id: '123', name: 'iPhone 15', price: 99999, quantity: 1 }
  ]
});

// Track add to cart
RetailBrain.trackAddToCart({
  product_id: '123',
  product_name: 'iPhone 15',
  price: 99999,
  quantity: 1
});

// Track button click
RetailBrain.trackClick(buttonElement, {
  button_name: 'Buy Now',
  product_id: '123'
});

// Track form submission
RetailBrain.trackFormSubmit(formElement, {
  form_type: 'newsletter_signup'
});
```

### ✅ User Identification

Identify users when they log in or provide information:

```javascript
// Identify a user
RetailBrain.identify({
  user_id: 'user_123',
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+919876543210'
});
```

## Configuration Options

```javascript
RetailBrain.init({
  // Required
  apiUrl: 'https://your-api-url.com',
  
  // Optional
  apiKey: 'your-api-key',              // For authenticated requests
  userId: 'user_123',                  // Pre-set user ID
  enabled: true,                       // Enable/disable tracking
  debug: false,                        // Enable debug logs
  
  // Auto-tracking options
  autoTrack: {
    pageviews: true,                   // Auto-track page views
    clicks: false,                     // Auto-track button clicks
    forms: false                       // Auto-track form submissions
  },
  
  // Batching options
  batchSize: 10,                       // Flush after N events
  flushInterval: 5000                 // Flush every N milliseconds
});
```

## Common Use Cases

### E-commerce Website

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
```

### Lead Generation Form

```javascript
// Form submission
document.getElementById('contact-form').addEventListener('submit', (e) => {
  const formData = new FormData(e.target);
  
  RetailBrain.trackFormSubmit(e.target, {
    form_type: 'contact',
    lead_source: 'website'
  });
  
  // Identify the lead
  RetailBrain.identify({
    email: formData.get('email'),
    name: formData.get('name'),
    phone: formData.get('phone')
  });
});
```

### Single Page Application (SPA)

The tracker automatically handles SPA navigation, but you can also manually track:

```javascript
// React Router example
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    RetailBrain.trackPageview({
      route: location.pathname
    });
  }, [location]);
  
  // ... rest of your app
}
```

## Event Types

The tracker supports these standard event types:

- `page_view` - Page visits
- `order_placed` - Purchase/checkout
- `add_to_cart` - Add to cart actions
- `button_click` - Button clicks
- `form_submit` - Form submissions
- `identify` - User identification
- Custom events (any string)

## Data Captured

For each event, the tracker automatically captures:

- **Identifiers**: Email, phone, name, device ID
- **Session**: Session ID, user ID
- **Context**: URL, referrer, page title, user agent
- **Device**: Screen size, viewport, language
- **Custom Data**: Any additional data you provide

## API Endpoint

Events are sent to: `POST {apiUrl}/events`

The API Gateway will forward them to the Event Collector service, which will:
1. Validate the event
2. Store it in the database
3. Process it through the Identity Engine
4. Update customer profiles

## Privacy & GDPR

The tracker respects user privacy:

- **No cookies by default** (uses localStorage/sessionStorage)
- **User can opt-out** by setting `RetailBrain.config().enabled = false`
- **Data is hashed** on the server side for privacy
- **Compliant with GDPR** - you control what data is sent

## Troubleshooting

### Enable Debug Mode

```javascript
RetailBrain.init({
  apiUrl: 'http://localhost:3000',
  debug: true  // See all events in console
});
```

### Check if Tracker is Working

```javascript
// Check configuration
console.log(RetailBrain.config());

// Manually flush events
RetailBrain.flush();
```

### Common Issues

1. **Events not sending**: Check browser console for errors, verify `apiUrl` is correct
2. **CORS errors**: Make sure your API Gateway has CORS enabled
3. **Events delayed**: Events are batched - use `RetailBrain.flush()` to send immediately

## Next Steps

1. **Deploy the tracker script** to your website
2. **Add tracking code** to key pages (product pages, checkout, etc.)
3. **Identify users** when they log in or provide information
4. **View events** in the Retail Brain dashboard at `/analytics`
5. **See customer profiles** automatically created from events

## Support

For more information, see:
- [Event Collector Documentation](../services/event-collector/README.md)
- [API Gateway Documentation](../services/api-gateway/README.md)
- [Dashboard Documentation](../dashboard/README.md)

