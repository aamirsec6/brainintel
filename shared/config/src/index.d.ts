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
};
export { getEnv, getEnvOrDefault, getEnvInt, getEnvFloat, getEnvBool };
//# sourceMappingURL=index.d.ts.map