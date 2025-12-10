/**
 * Authentication middleware
 * Validates API key from Authorization header
 */
import { Request, Response, NextFunction } from 'express';
import { apiGatewayConfig } from '@retail-brain/config';

const PUBLIC_ROUTES = [
  '/health',
  '/v1/health',
  '/v1/analytics',
  '/analytics',
  '/v1/ab-testing/experiments',
  '/v1/nudges',
  '/v1/nudges/recent',
  '/v1/nudges/stats',
  '/v1/nudges/evaluate',
  '/v1/nudges/evaluate/bulk',
  '/v1/intent/detect',
  '/v1/intent/whatsapp',
  '/v1/intent/email',
  '/v1/intent/chat',
  '/v1/intent/stats',
  '/v1/ml-models/metrics',
  '/v1/ml-models/alerts',
];
const WEBHOOK_ROUTES = ['/webhooks/shopify', '/webhooks/woocommerce', '/webhooks/generic'];

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip auth for public routes (supports prefix matches for dynamic params)
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => req.path === route || req.path.startsWith(`${route}/`)
  );
  if (isPublicRoute) {
    return next();
  }

  // Skip auth for webhook routes (they use signature validation instead)
  if (WEBHOOK_ROUTES.some(route => req.path.includes(route) || req.path.startsWith('/webhooks'))) {
    return next();
  }

  // Extract API key from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        message: 'Missing Authorization header',
        code: 'UNAUTHORIZED',
      },
    });
  }

  // Expected format: "Bearer <api_key>" or just "<api_key>"
  const apiKey = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  // Validate API key
  if (!apiGatewayConfig.apiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: {
        message: 'Invalid API key',
        code: 'UNAUTHORIZED',
      },
    });
  }

  // API key is valid, proceed
  next();
}

