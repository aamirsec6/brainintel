/**
 * Configuration loader
 * Loads and validates environment variables
 */
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env file
loadEnv({ path: path.resolve(process.cwd(), '.env') });

/**
 * Get required environment variable or throw error
 */
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get environment variable as integer
 */
function getEnvInt(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value || '0', 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid integer value for ${key}: ${value}`);
  }
  return parsed;
}

/**
 * Get environment variable as float
 */
function getEnvFloat(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  const parsed = parseFloat(value || '0');
  if (isNaN(parsed)) {
    throw new Error(`Invalid float value for ${key}: ${value}`);
  }
  return parsed;
}

/**
 * Get environment variable as boolean
 */
function getEnvBool(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Database configuration
 */
export const dbConfig = {
  host: getEnvOrDefault('POSTGRES_HOST', 'localhost'),
  port: getEnvInt('POSTGRES_PORT', 5432),
  database: getEnvOrDefault('POSTGRES_DB', 'retail_brain'),
  user: getEnvOrDefault('POSTGRES_USER', 'retail_brain_user'),
  password: getEnvOrDefault('POSTGRES_PASSWORD', 'retail_brain_pass'),
};

/**
 * Redis configuration
 */
export const redisConfig = {
  host: getEnvOrDefault('REDIS_HOST', 'localhost'),
  port: getEnvInt('REDIS_PORT', 6379),
  password: getEnvOrDefault('REDIS_PASSWORD', ''),
};

/**
 * API Gateway configuration
 */
export const apiGatewayConfig = {
  port: getEnvInt('API_GATEWAY_PORT', 3000),
  apiKeys: getEnvOrDefault('API_GATEWAY_API_KEYS', '').split(',').filter(Boolean),
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
  maxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 100),
};

/**
 * Identity engine configuration
 */
export const identityConfig = {
  autoMergeThreshold: getEnvFloat('IDENTITY_AUTO_MERGE_THRESHOLD', 0.80),
  manualReviewThreshold: getEnvFloat('IDENTITY_MANUAL_REVIEW_THRESHOLD', 0.45),
};

/**
 * Logging configuration
 */
export const logConfig = {
  level: getEnvOrDefault('LOG_LEVEL', 'info'),
};

/**
 * Node environment
 */
export const nodeEnv = getEnvOrDefault('NODE_ENV', 'development');

/**
 * Service ports
 */
export const servicePorts = {
  eventCollector: getEnvInt('EVENT_COLLECTOR_PORT', 3001),
  identityEngine: getEnvInt('IDENTITY_ENGINE_PORT', 3002),
  profileService: getEnvInt('PROFILE_SERVICE_PORT', 3003),
  recommender: getEnvInt('RECOMMENDER_SERVICE_PORT', 3004),
  onboarding: getEnvInt('ONBOARDING_SERVICE_PORT', 3005),
  aiAssistant: getEnvInt('AI_ASSISTANT_SERVICE_PORT', 3006),
  webhook: getEnvInt('WEBHOOK_SERVICE_PORT', 3007),
  connector: getEnvInt('CONNECTOR_SERVICE_PORT', 3008),
  inventory: getEnvInt('INVENTORY_SERVICE_PORT', 3009),
  pricing: getEnvInt('PRICING_SERVICE_PORT', 3010),
  journey: getEnvInt('JOURNEY_SERVICE_PORT', 3011),
  attribution: getEnvInt('ATTRIBUTION_SERVICE_PORT', 3012),
  featureStore: getEnvInt('FEATURE_STORE_SERVICE_PORT', 3014),
  mlScorer: getEnvInt('ML_SCORER_SERVICE_PORT', 3015),
  embedding: getEnvInt('EMBEDDING_SERVICE_PORT', 3016),
  intent: getEnvInt('INTENT_SERVICE_PORT', 3017),
  nudge: getEnvInt('NUDGE_ENGINE_PORT', 3018),
  abTesting: getEnvInt('AB_TESTING_SERVICE_PORT', 3019),
  mlMonitoring: getEnvInt('ML_MONITORING_SERVICE_PORT', 3020),
};

/**
 * Get all configuration
 */
export function getConfig() {
  return {
    ...dbConfig,
    ...redisConfig,
    ...apiGatewayConfig,
    ...rateLimitConfig,
    ...identityConfig,
    ...logConfig,
    nodeEnv,
    ...servicePorts,
    EVENT_COLLECTOR_URL: getEnvOrDefault('EVENT_COLLECTOR_URL', 'http://localhost:3001'),
    PROFILE_SERVICE_URL: getEnvOrDefault('PROFILE_SERVICE_URL', 'http://localhost:3003'),
    WEBHOOK_SERVICE_URL: getEnvOrDefault('WEBHOOK_SERVICE_URL', 'http://localhost:3007'),
    CONNECTOR_SERVICE_URL: getEnvOrDefault('CONNECTOR_SERVICE_URL', 'http://localhost:3008'),
    INVENTORY_SERVICE_URL: getEnvOrDefault('INVENTORY_SERVICE_URL', 'http://localhost:3009'),
    PRICING_SERVICE_URL: getEnvOrDefault('PRICING_SERVICE_URL', 'http://localhost:3010'),
    JOURNEY_SERVICE_URL: getEnvOrDefault('JOURNEY_SERVICE_URL', 'http://localhost:3011'),
    ATTRIBUTION_SERVICE_URL: getEnvOrDefault('ATTRIBUTION_SERVICE_URL', 'http://localhost:3012'),
    ML_SCORER_SERVICE_URL: getEnvOrDefault('ML_SCORER_SERVICE_URL', `http://localhost:${servicePorts.mlScorer}`),
    EMBEDDING_SERVICE_URL: getEnvOrDefault('EMBEDDING_SERVICE_URL', `http://localhost:${servicePorts.embedding}`),
    INTENT_SERVICE_URL: getEnvOrDefault('INTENT_SERVICE_URL', `http://localhost:${servicePorts.intent}`),
    MLFLOW_TRACKING_URI: getEnvOrDefault('MLFLOW_TRACKING_URI', 'http://localhost:5001'),
    API_KEY: getEnvOrDefault('API_KEY', 'test_api_key'),
    WEBHOOK_SERVICE_PORT: servicePorts.webhook,
    CONNECTOR_SERVICE_PORT: servicePorts.connector,
    INVENTORY_SERVICE_PORT: servicePorts.inventory,
    PRICING_SERVICE_PORT: servicePorts.pricing,
    JOURNEY_SERVICE_PORT: servicePorts.journey,
    ATTRIBUTION_SERVICE_PORT: servicePorts.attribution,
    REDIS_HOST: redisConfig.host,
    REDIS_PORT: redisConfig.port,
  };
}

export { getEnv, getEnvOrDefault, getEnvInt, getEnvFloat, getEnvBool };

