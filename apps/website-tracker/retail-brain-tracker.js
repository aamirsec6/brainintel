/**
 * Retail Brain Website Tracker
 * 
 * Simple JavaScript SDK for tracking customer events on your website
 * 
 * Usage:
 *   <script src="https://your-api-url.com/tracker.js"></script>
 *   <script>
 *     RetailBrain.init({
 *       apiUrl: 'https://your-api-url.com',
 *       apiKey: 'your-api-key' // Optional
 *     });
 *   </script>
 */

(function(window) {
  'use strict';

  // Configuration
  let config = {
    apiUrl: '',
    apiKey: null,
    userId: null,
    sessionId: null,
    enabled: true,
    debug: false,
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    autoTrack: {
      pageviews: true,
      clicks: false,
      forms: false
    }
  };

  // Event queue
  let eventQueue = [];
  let flushTimer = null;

  // Generate unique IDs
  function generateId() {
    return 'rb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get or create session ID
  function getSessionId() {
    if (!config.sessionId) {
      config.sessionId = sessionStorage.getItem('rb_session_id') || generateId();
      sessionStorage.setItem('rb_session_id', config.sessionId);
    }
    return config.sessionId;
  }

  // Get or create user ID
  function getUserId() {
    if (!config.userId) {
      config.userId = localStorage.getItem('rb_user_id') || generateId();
      localStorage.setItem('rb_user_id', config.userId);
    }
    return config.userId;
  }

  // Get user identifiers from page
  function getIdentifiers() {
    const identifiers = {};
    
    // Try to get email from common form fields or meta tags
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
      identifiers.email = emailInput.value;
    }
    
    // Try to get phone from common form fields
    const phoneInput = document.querySelector('input[type="tel"], input[name*="phone"]');
    if (phoneInput && phoneInput.value) {
      identifiers.phone = phoneInput.value;
    }
    
    // Try to get name from common form fields
    const nameInput = document.querySelector('input[name*="name"], input[placeholder*="name" i]');
    if (nameInput && nameInput.value) {
      identifiers.name = nameInput.value;
    }
    
    // Get device ID from localStorage
    let deviceId = localStorage.getItem('rb_device_id');
    if (!deviceId) {
      deviceId = generateId();
      localStorage.setItem('rb_device_id', deviceId);
    }
    identifiers.device = deviceId;
    
    return identifiers;
  }

  // Get page context
  function getPageContext() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    };
  }

  // Send event to API
  function sendEvent(event) {
    if (!config.enabled || !config.apiUrl) {
      if (config.debug) {
        console.warn('[RetailBrain] Tracker not initialized or disabled');
      }
      return;
    }

    // Add to queue
    eventQueue.push({
      ...event,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_id: getUserId(),
      identifiers: getIdentifiers(),
      context: getPageContext()
    });

    // Flush if queue is full
    if (eventQueue.length >= config.batchSize) {
      flushEvents();
    } else {
      // Schedule flush
      if (!flushTimer) {
        flushTimer = setTimeout(flushEvents, config.flushInterval);
      }
    }
  }

  // Flush events to API
  function flushEvents() {
    if (eventQueue.length === 0) return;
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    const events = eventQueue.splice(0, eventQueue.length);
    
    // Send events
    const url = config.apiUrl + '/events';
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (config.apiKey) {
      headers['Authorization'] = 'Bearer ' + config.apiKey;
    }

    // Send each event individually (or batch if API supports it)
    events.forEach(event => {
      const payload = {
        source: 'website',
        event_type: event.event_type,
        event_ts: event.timestamp,
        identifiers: event.identifiers,
        payload: {
          ...event.payload,
          session_id: event.session_id,
          user_id: event.user_id,
          context: event.context
        }
      };

      if (config.debug) {
        console.log('[RetailBrain] Sending event:', payload);
      }

      // Use sendBeacon for better reliability (especially on page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify(payload));
      } else {
        // Fallback to fetch
        fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(err => {
          if (config.debug) {
            console.error('[RetailBrain] Failed to send event:', err);
          }
        });
      }
    });
  }

  // Track pageview
  function trackPageview(customData = {}) {
    sendEvent({
      event_type: 'page_view',
      payload: {
        page: window.location.pathname,
        ...customData
      }
    });
  }

  // Track custom event
  function track(eventType, eventData = {}) {
    sendEvent({
      event_type: eventType,
      payload: eventData
    });
  }

  // Track purchase/order
  function trackPurchase(orderData) {
    sendEvent({
      event_type: 'order_placed',
      payload: {
        order_id: orderData.order_id,
        revenue: orderData.revenue || 0,
        currency: orderData.currency || 'INR',
        items: orderData.items || [],
        ...orderData
      }
    });
  }

  // Track add to cart
  function trackAddToCart(productData) {
    sendEvent({
      event_type: 'add_to_cart',
      payload: {
        product_id: productData.product_id,
        product_name: productData.product_name,
        price: productData.price || 0,
        quantity: productData.quantity || 1,
        ...productData
      }
    });
  }

  // Track button click
  function trackClick(element, customData = {}) {
    sendEvent({
      event_type: 'button_click',
      payload: {
        button_text: element.textContent?.trim() || element.value || '',
        button_id: element.id || '',
        button_class: element.className || '',
        ...customData
      }
    });
  }

  // Track form submission
  function trackFormSubmit(form, customData = {}) {
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.name && input.value) {
        formData[input.name] = input.value;
      }
    });

    sendEvent({
      event_type: 'form_submit',
      payload: {
        form_id: form.id || '',
        form_action: form.action || '',
        form_method: form.method || 'POST',
        form_data: formData,
        ...customData
      }
    });
  }

  // Identify user
  function identify(userData) {
    config.userId = userData.user_id || config.userId;
    if (config.userId) {
      localStorage.setItem('rb_user_id', config.userId);
    }

    // Send identify event
    sendEvent({
      event_type: 'identify',
      payload: {
        user_id: config.userId,
        ...userData
      }
    });
  }

  // Auto-track pageviews
  function setupAutoTracking() {
    if (config.autoTrack.pageviews) {
      // Track initial pageview
      trackPageview();
      
      // Track pageviews on navigation (for SPAs)
      if (window.history && window.history.pushState) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function() {
          originalPushState.apply(window.history, arguments);
          setTimeout(() => trackPageview(), 100);
        };

        window.addEventListener('popstate', () => {
          setTimeout(() => trackPageview(), 100);
        });
      }
    }

    if (config.autoTrack.clicks) {
      document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
          trackClick(e.target);
        }
      });
    }

    if (config.autoTrack.forms) {
      document.addEventListener('submit', (e) => {
        if (e.target.tagName === 'FORM') {
          trackFormSubmit(e.target);
        }
      });
    }
  }

  // Initialize tracker
  function init(options = {}) {
    config = { ...config, ...options };
    
    if (!config.apiUrl) {
      console.error('[RetailBrain] apiUrl is required');
      return;
    }

    // Remove trailing slash
    config.apiUrl = config.apiUrl.replace(/\/$/, '');

    if (config.debug) {
      console.log('[RetailBrain] Initialized with config:', config);
    }

    // Setup auto-tracking
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupAutoTracking);
    } else {
      setupAutoTracking();
    }

    // Flush events on page unload
    window.addEventListener('beforeunload', () => {
      flushEvents();
    });

    // Flush events on visibility change (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        flushEvents();
      }
    });
  }

  // Public API
  window.RetailBrain = {
    init,
    track,
    trackPageview,
    trackPurchase,
    trackAddToCart,
    trackClick,
    trackFormSubmit,
    identify,
    flush: flushEvents,
    config: () => config
  };

})(window);

