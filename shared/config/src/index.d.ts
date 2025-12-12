/**
 * Get required environment variable or throw error
 */
declare function getEnv(key: string): string;
/**
 * Get optional environment variable with default
 */
declare function getEnvOrDefault(key: string, defaultValue: string): string;
/**
 * Get environment variable as integer
 */
declare function getEnvInt(key: string, defaultValue?: number): number;
/**
 * Get environment variable as float
 */
declare function getEnvFloat(key: string, defaultValue?: number): number;
/**
 * Get environment variable as boolean
 */
declare function getEnvBool(key: string, defaultValue?: boolean): boolean;
/**
 * Database configuration
 */
export declare const dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
};
/**
 * Redis configuration
 */
export declare const redisConfig: {
    host: string;
    port: number;
    password: string;
};
/**
 * API Gateway configuration
 */
export declare const apiGatewayConfig: {
    port: number;
    apiKeys: string[];
};
/**
 * Rate limiting configuration
 */
export declare const rateLimitConfig: {
    windowMs: number;
    maxRequests: number;
};
/**
 * Identity engine configuration
 */
export declare const identityConfig: {
    autoMergeThreshold: number;
    manualReviewThreshold: number;
};
/**
 * Logging configuration
 */
export declare const logConfig: {
    level: string;
};
/**
 * Node environment
 */
export declare const nodeEnv: string;
/**
 * Service ports
 */
export declare const servicePorts: {
    eventCollector: number;
    identityEngine: number;
    profileService: number;
    recommender: number;
    onboarding: number;
    aiAssistant: number;
    webhook: number;
    connector: number;
    inventory: number;
    pricing: number;
    journey: number;
    attribution: number;
    featureStore: number;
    mlScorer: number;
    embedding: number;
    intent: number;
    nudge: number;
    abTesting: number;
    mlMonitoring: number;
};
/**
 * Get all configuration
 */
export declare function getConfig(): {
    EVENT_COLLECTOR_URL: string;
    PROFILE_SERVICE_URL: string;
    WEBHOOK_SERVICE_URL: string;
    CONNECTOR_SERVICE_URL: string;
    INVENTORY_SERVICE_URL: string;
    PRICING_SERVICE_URL: string;
    JOURNEY_SERVICE_URL: string;
    ATTRIBUTION_SERVICE_URL: string;
    ML_SCORER_SERVICE_URL: string;
    EMBEDDING_SERVICE_URL: string;
    INTENT_SERVICE_URL: string;
    MLFLOW_TRACKING_URI: string;
    API_KEY: string;
    WEBHOOK_SERVICE_PORT: number;
    CONNECTOR_SERVICE_PORT: number;
    INVENTORY_SERVICE_PORT: number;
    PRICING_SERVICE_PORT: number;
    JOURNEY_SERVICE_PORT: number;
    ATTRIBUTION_SERVICE_PORT: number;
    REDIS_HOST: string;
    REDIS_PORT: number;
    eventCollector: number;
    identityEngine: number;
    profileService: number;
    recommender: number;
    onboarding: number;
    aiAssistant: number;
    webhook: number;
    connector: number;
    inventory: number;
    pricing: number;
    journey: number;
    attribution: number;
    featureStore: number;
    mlScorer: number;
    embedding: number;
    intent: number;
    nudge: number;
    abTesting: number;
    mlMonitoring: number;
    nodeEnv: string;
    level: string;
    autoMergeThreshold: number;
    manualReviewThreshold: number;
    windowMs: number;
    maxRequests: number;
    port: number;
    apiKeys: string[];
    host: string;
    password: string;
    database: string;
    user: string;
};
export { getEnv, getEnvOrDefault, getEnvInt, getEnvFloat, getEnvBool };
//# sourceMappingURL=index.d.ts.map