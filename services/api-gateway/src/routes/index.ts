/**
 * API Routes
 * Main router that delegates to specific route handlers
 */
import { Router, type IRouter } from 'express';
import { getDb } from '@retail-brain/db';
import { randomUUID } from 'crypto';
import trackerRoutes from './tracker';

const router: IRouter = Router();

// Tracker script route (must be before auth middleware)
router.use('/', trackerRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Event ingestion - proxy to Event Collector service
router.post('/events', async (req, res) => {
  try {
    const eventCollectorUrl =
      process.env.EVENT_COLLECTOR_URL || 'http://localhost:3001';

    // Forward request to Event Collector
    const response = await fetch(`${eventCollectorUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.headers['x-request-id'] as string,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Event Collector service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Customer search - proxy to Profile Service (place before :id route to avoid capture)
router.get('/customer/search', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';
    
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${profileServiceUrl}/profiles/search?${queryString}`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Customer profile - proxy to Profile Service
router.get('/customer/:id', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';

    const response = await fetch(`${profileServiceUrl}/profiles/${req.params.id}`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Analytics - proxy to Profile Service
router.get('/analytics', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';
    
    const response = await fetch(`${profileServiceUrl}/profiles/analytics`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Customer stats - proxy to Profile Service
router.get('/v1/customer/stats', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';
    
    const response = await fetch(`${profileServiceUrl}/profiles/stats`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Recent activity - proxy to Profile Service
router.get('/v1/customer/activity', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';
    
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${profileServiceUrl}/profiles/activity?${queryString}`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// Activity chart - proxy to Profile Service
router.get('/v1/customer/activity/chart', async (req, res) => {
  try {
    const profileServiceUrl =
      process.env.PROFILE_SERVICE_URL || 'http://localhost:3003';
    
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${profileServiceUrl}/profiles/activity/chart?${queryString}`);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'Profile Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

// A/B Testing - proxy to A/B Testing Service
router.get('/ab-testing/experiments', async (req, res) => {
  try {
    const abTestingUrl = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${abTestingUrl}/v1/experiments${queryString ? `?${queryString}` : ''}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'A/B Testing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/ab-testing/experiments', async (req, res) => {
  try {
    const abTestingUrl = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
    const response = await fetch(`${abTestingUrl}/v1/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'A/B Testing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/ab-testing/experiments/:id/results', async (req, res) => {
  try {
    const abTestingUrl = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
    const response = await fetch(`${abTestingUrl}/v1/experiments/${req.params.id}/results`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'A/B Testing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/ab-testing/experiments/:id/assign', async (req, res) => {
  try {
    const abTestingUrl = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
    const response = await fetch(`${abTestingUrl}/v1/experiments/${req.params.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'A/B Testing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/ab-testing/experiments/:id/conversion', async (req, res) => {
  try {
    const abTestingUrl = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
    const response = await fetch(`${abTestingUrl}/v1/experiments/${req.params.id}/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'A/B Testing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Nudge Engine - proxy to Nudge Engine Service
router.post('/nudges/evaluate', async (req, res) => {
  try {
    const nudgeUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:3018';
    const response = await fetch(`${nudgeUrl}/v1/nudges/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Nudge Engine unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/nudges/history/:profile_id', async (req, res) => {
  try {
    const nudgeUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:3018';
    const response = await fetch(`${nudgeUrl}/v1/nudges/history/${req.params.profile_id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Nudge Engine unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/nudges/recent', async (req, res) => {
  try {
    const nudgeUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:3018';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${nudgeUrl}/v1/nudges/recent${queryString ? `?${queryString}` : ''}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Nudge Engine unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/nudges/evaluate/bulk', async (req, res) => {
  try {
    const nudgeUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:3018';
    const response = await fetch(`${nudgeUrl}/v1/nudges/evaluate/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Nudge Engine unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/nudges/stats', async (req, res) => {
  try {
    const nudgeUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:3018';
    const response = await fetch(`${nudgeUrl}/v1/nudges/stats`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Nudge Engine unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Intent Detection - proxy to Intent Service
router.post('/intent/detect', async (req, res) => {
  try {
    const intentUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
    const response = await fetch(`${intentUrl}/v1/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Intent Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/intent/whatsapp', async (req, res) => {
  try {
    const intentUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
    const response = await fetch(`${intentUrl}/v1/intent/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Intent Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/intent/email', async (req, res) => {
  try {
    const intentUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
    const response = await fetch(`${intentUrl}/v1/intent/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Intent Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/intent/chat', async (req, res) => {
  try {
    const intentUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
    const response = await fetch(`${intentUrl}/v1/intent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Intent Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/intent/stats', async (req, res) => {
  try {
    const intentUrl = process.env.INTENT_SERVICE_URL || 'http://localhost:3017';
    const response = await fetch(`${intentUrl}/v1/intent/stats`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Intent Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// ML Monitoring - proxy to ML Monitoring Service
router.get('/ml-models/metrics/:model_name', async (req, res) => {
  try {
    const mlMonitoringUrl = process.env.ML_MONITORING_SERVICE_URL || 'http://localhost:3020';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${mlMonitoringUrl}/v1/metrics/${req.params.model_name}${queryString ? `?${queryString}` : ''}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'ML Monitoring Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/ml-models/alerts', async (req, res) => {
  try {
    const mlMonitoringUrl = process.env.ML_MONITORING_SERVICE_URL || 'http://localhost:3020';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${mlMonitoringUrl}/v1/alerts${queryString ? `?${queryString}` : ''}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'ML Monitoring Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// AI Assistant - proxy to AI Assistant Service
router.post('/v1/assistant/query', async (req, res) => {
  try {
    const aiAssistantUrl = process.env.AI_ASSISTANT_SERVICE_URL || 'http://localhost:3006';
    
    const response = await fetch(`${aiAssistantUrl}/assistant/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      error: {
        message: 'AI Assistant Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  }
});

router.get('/recommendations/:profile_id', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Recommendations not yet implemented',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

router.get('/merge-logs', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Merge logs not yet implemented',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

router.post('/merge/manual', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Manual merge not yet implemented',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

router.post('/merge/rollback', (req, res) => {
  res.status(501).json({
    error: {
      message: 'Merge rollback not yet implemented',
      code: 'NOT_IMPLEMENTED',
    },
  });
});

// Webhook endpoints - proxy to Webhook Service
router.post('/webhooks/shopify', async (req, res) => {
  try {
    const webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3007';
    const response = await fetch(`${webhookServiceUrl}/webhooks/shopify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Webhook Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/webhooks/woocommerce', async (req, res) => {
  try {
    const webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3007';
    const response = await fetch(`${webhookServiceUrl}/webhooks/woocommerce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Webhook Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/webhooks/generic', async (req, res) => {
  try {
    const webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3007';
    const response = await fetch(`${webhookServiceUrl}/webhooks/generic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Webhook Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Inventory endpoints - proxy to Inventory Service
router.get('/inventory/sku/:sku', async (req, res) => {
  try {
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3009';
    const response = await fetch(`${inventoryServiceUrl}/v1/inventory/sku/${req.params.sku}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Inventory Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/inventory/channel/:channel', async (req, res) => {
  try {
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3009';
    const response = await fetch(`${inventoryServiceUrl}/v1/inventory/channel/${req.params.channel}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Inventory Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/inventory/low-stock', async (req, res) => {
  try {
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3009';
    const response = await fetch(`${inventoryServiceUrl}/v1/inventory/low-stock`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Inventory Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Pricing endpoints - proxy to Pricing Service
router.get('/pricing/sku/:sku', async (req, res) => {
  try {
    const pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:3010';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${pricingServiceUrl}/v1/pricing/sku/${req.params.sku}?${queryString}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Pricing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/pricing/rules', async (req, res) => {
  try {
    const pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:3010';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${pricingServiceUrl}/v1/pricing/rules?${queryString}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Pricing Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Journey endpoints - proxy to Journey Service
router.get('/journey/profile/:profileId', async (req, res) => {
  try {
    const journeyServiceUrl = process.env.JOURNEY_SERVICE_URL || 'http://localhost:3011';
    const response = await fetch(`${journeyServiceUrl}/v1/journey/profile/${req.params.profileId}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Journey Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/journey/:journeyId', async (req, res) => {
  try {
    const journeyServiceUrl = process.env.JOURNEY_SERVICE_URL || 'http://localhost:3011';
    const response = await fetch(`${journeyServiceUrl}/v1/journey/${req.params.journeyId}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Journey Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/journey/analytics/summary', async (req, res) => {
  try {
    const journeyServiceUrl = process.env.JOURNEY_SERVICE_URL || 'http://localhost:3011';
    const response = await fetch(`${journeyServiceUrl}/v1/journey/analytics/summary`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Journey Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Attribution endpoints - proxy to Attribution Service
router.get('/attribution/report', async (req, res) => {
  try {
    const attributionServiceUrl = process.env.ATTRIBUTION_SERVICE_URL || 'http://localhost:3012';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${attributionServiceUrl}/v1/attribution/report?${queryString}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Attribution Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.get('/attribution/channels', async (req, res) => {
  try {
    const attributionServiceUrl = process.env.ATTRIBUTION_SERVICE_URL || 'http://localhost:3012';
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const response = await fetch(`${attributionServiceUrl}/v1/attribution/channels?${queryString}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Attribution Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Connector endpoints - proxy to Connector Service
router.get('/connectors', async (req, res) => {
  try {
    const connectorServiceUrl = process.env.CONNECTOR_SERVICE_URL || 'http://localhost:3008';
    const response = await fetch(`${connectorServiceUrl}/connectors`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Connector Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/connectors/:id/sync', async (req, res) => {
  try {
    const connectorServiceUrl = process.env.CONNECTOR_SERVICE_URL || 'http://localhost:3008';
    const response = await fetch(`${connectorServiceUrl}/connectors/${req.params.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Connector Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Onboarding endpoints - proxy to Onboarding Service
// Note: CSV upload requires multipart/form-data, so we need to handle it specially
router.post('/onboarding/csv/upload', async (req, res) => {
  try {
    const onboardingServiceUrl = process.env.ONBOARDING_SERVICE_URL || 'http://localhost:3005';
    
    // For file uploads, we need to forward the multipart request
    // Since we're using fetch, we'll need to handle this differently
    // For now, we'll proxy the request with proper headers
    const formData = new FormData();
    
    // Forward the file if it exists
    // Note: File upload handling removed - this endpoint should use direct file upload
    // Railway doesn't support multipart file forwarding via fetch API

    const response = await fetch(`${onboardingServiceUrl}/csv/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Onboarding Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/onboarding/csv/preview', async (req, res) => {
  try {
    const onboardingServiceUrl = process.env.ONBOARDING_SERVICE_URL || 'http://localhost:3005';
    const response = await fetch(`${onboardingServiceUrl}/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Onboarding Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

router.post('/onboarding/csv/import', async (req, res) => {
  try {
    const onboardingServiceUrl = process.env.ONBOARDING_SERVICE_URL || 'http://localhost:3005';
    const response = await fetch(`${onboardingServiceUrl}/csv/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: { message: 'Onboarding Service unavailable', code: 'SERVICE_UNAVAILABLE' } });
  }
});

// Intent webhook: receive channel payloads, call intent service, log result
router.post('/webhooks/intent', async (req, res) => {
  try {
    const intentServiceUrl =
      process.env.INTENT_SERVICE_URL || 'http://localhost:3017';

    const body = req.body || {};
    // Normalize text (support Twilio fields)
    const text =
      body.text ||
      body.message ||
      body.content ||
      body.Body || // Twilio SMS/WhatsApp
      body.subject || // Email subjects as text fallback
      (body.payload && body.payload.text);

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: { message: 'Text is required', code: 'VALIDATION_ERROR' },
      });
    }

    const channel =
      body.channel ||
      body.type ||
      body.provider ||
      (body.source && body.source.channel) ||
      'unknown';

    const sender =
      body.sender ||
      body.from ||
      body.phone ||
      body.From || // Twilio SMS/WhatsApp
      body.email || // Email sender if provided
      (body.contact && body.contact.phone) ||
      (body.payload && body.payload.from) ||
      null;

    const intentResponse = await fetch(`${intentServiceUrl}/v1/intent/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const intentResult = (await intentResponse.json()) as { intent?: string; confidence?: number };

    // Best-effort log
    try {
      const db = getDb();
      await db.query(
        `
          INSERT INTO intent_message_log
            (id, channel, sender, text, intent, confidence, raw_payload, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `,
        [
          randomUUID(),
          channel,
          sender,
          text,
          intentResult?.intent || null,
          intentResult?.confidence ?? null,
          body,
        ]
      );
    } catch (logErr) {
      console.error('Failed to log intent message', logErr);
    }

    return res.status(intentResponse.status).json(intentResult);
  } catch (error) {
    return res.status(500).json({
      error: { message: 'Intent webhook failed', code: 'INTERNAL_ERROR' },
    });
  }
});

// Recent intent logs
router.get('/intent/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const db = getDb();
    const result = await db.query(
      `
        SELECT
          id,
          channel,
          sender,
          text,
          intent,
          confidence,
          raw_payload,
          created_at
        FROM intent_message_log
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit]
    );
    res.json({ results: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Failed to fetch intent logs', code: 'INTERNAL_ERROR' },
    });
  }
});

export default router;

