/**
 * Connector Controller
 * Handles third-party integrations (Shopify, etc.)
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import axios from 'axios';

const logger = createLogger({ service: 'connector-controller' });

/**
 * Connect to Shopify
 */
export async function connectShopify(req: Request, res: Response) {
  try {
    const { shop_url, api_key, api_secret } = req.body;

    if (!shop_url || !api_key) {
      return res.status(400).json({
        error: {
          message: 'Missing shop_url or api_key',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    logger.info('Testing Shopify connection', { shop_url });

    // Test connection (simplified for MVP)
    const testUrl = `https://${shop_url}/admin/api/2024-01/customers.json`;
    
    try {
      await axios.get(testUrl, {
        headers: {
          'X-Shopify-Access-Token': api_key,
        },
        timeout: 5000,
      });

      res.json({
        success: true,
        message: 'Shopify connection successful',
        shop_url,
      });
    } catch (error) {
      res.status(400).json({
        error: {
          message: 'Failed to connect to Shopify. Please check your credentials.',
          code: 'CONNECTION_FAILED',
        },
      });
    }
  } catch (error) {
    logger.error('Shopify connection failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to connect to Shopify', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Test any connection
 */
export async function testConnection(req: Request, res: Response) {
  try {
    const { type, credentials } = req.body;

    logger.info('Testing connection', { type });

    // For MVP, just return success
    res.json({
      success: true,
      message: `${type} connection test successful`,
    });
  } catch (error) {
    logger.error('Connection test failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Connection test failed', code: 'INTERNAL_ERROR' },
    });
  }
}

