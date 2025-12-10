"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicePorts = exports.nodeEnv = exports.logConfig = exports.identityConfig = exports.rateLimitConfig = exports.apiGatewayConfig = exports.redisConfig = exports.dbConfig = void 0;
exports.getEnv = getEnv;
exports.getEnvOrDefault = getEnvOrDefault;
exports.getEnvInt = getEnvInt;
exports.getEnvFloat = getEnvFloat;
exports.getEnvBool = getEnvBool;
/**
 * Configuration loader
 * Loads and validates environment variables
 */
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load .env file
(0, dotenv_1.config)({ path: path_1.default.resolve(process.cwd(), '.env') });
/**
 * Get required environment variable or throw error
 */
function getEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
/**
 * Get optional environment variable with default
 */
function getEnvOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}
/**
 * Get environment variable as integer
 */
function getEnvInt(key, defaultValue) {
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
function getEnvFloat(key, defaultValue) {
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
function getEnvBool(key, defaultValue = false) {
    const value = process.env[key];
    if (!value) {
        return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
}
/**
 * Database configuration
 */
exports.dbConfig = {
    host: getEnvOrDefault('POSTGRES_HOST', 'localhost'),
    port: getEnvInt('POSTGRES_PORT', 5432),
    database: getEnvOrDefault('POSTGRES_DB', 'retail_brain'),
    user: getEnvOrDefault('POSTGRES_USER', 'retail_brain_user'),
    password: getEnvOrDefault('POSTGRES_PASSWORD', 'retail_brain_pass'),
};
/**
 * Redis configuration
 */
exports.redisConfig = {
    host: getEnvOrDefault('REDIS_HOST', 'localhost'),
    port: getEnvInt('REDIS_PORT', 6379),
    password: getEnvOrDefault('REDIS_PASSWORD', ''),
};
/**
 * API Gateway configuration
 */
exports.apiGatewayConfig = {
    port: getEnvInt('API_GATEWAY_PORT', 3000),
    apiKeys: getEnvOrDefault('API_GATEWAY_API_KEYS', '').split(',').filter(Boolean),
};
/**
 * Rate limiting configuration
 */
exports.rateLimitConfig = {
    windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 100),
};
/**
 * Identity engine configuration
 */
exports.identityConfig = {
    autoMergeThreshold: getEnvFloat('IDENTITY_AUTO_MERGE_THRESHOLD', 0.80),
    manualReviewThreshold: getEnvFloat('IDENTITY_MANUAL_REVIEW_THRESHOLD', 0.45),
};
/**
 * Logging configuration
 */
exports.logConfig = {
    level: getEnvOrDefault('LOG_LEVEL', 'info'),
};
/**
 * Node environment
 */
exports.nodeEnv = getEnvOrDefault('NODE_ENV', 'development');
/**
 * Service ports
 */
exports.servicePorts = {
    eventCollector: getEnvInt('EVENT_COLLECTOR_PORT', 3001),
    identityEngine: getEnvInt('IDENTITY_ENGINE_PORT', 3002),
    profileService: getEnvInt('PROFILE_SERVICE_PORT', 3003),
    recommender: getEnvInt('RECOMMENDER_SERVICE_PORT', 3004),
    onboarding: getEnvInt('ONBOARDING_SERVICE_PORT', 3005),
    aiAssistant: getEnvInt('AI_ASSISTANT_SERVICE_PORT', 3006),
};
//# sourceMappingURL=index.js.map