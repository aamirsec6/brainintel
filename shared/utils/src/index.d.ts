/**
 * Generate SHA256 hash of a string
 * Used for hashing identifiers (phone, email, etc.)
 */
export declare function generateHash(value: string): string;
/**
 * Normalize phone number
 * Removes all non-digit characters
 */
export declare function normalizePhone(phone: string): string;
/**
 * Normalize email
 * Lowercase and trim
 */
export declare function normalizeEmail(email: string): string;
/**
 * Generate request ID
 */
export declare function generateRequestId(): string;
/**
 * Generate correlation ID
 */
export declare function generateCorrelationId(): string;
/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
export declare function levenshteinDistance(str1: string, str2: string): number;
/**
 * Calculate string similarity (0.0 to 1.0)
 * Using normalized Levenshtein distance
 */
export declare function stringSimilarity(str1: string, str2: string): number;
/**
 * Sleep utility for async delays
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Format currency
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Truncate string
 */
export declare function truncate(str: string, maxLength: number): string;
/**
 * Deep clone object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if object is empty
 */
export declare function isEmpty(obj: Record<string, unknown>): boolean;
//# sourceMappingURL=index.d.ts.map