"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHash = generateHash;
exports.normalizePhone = normalizePhone;
exports.normalizeEmail = normalizeEmail;
exports.generateRequestId = generateRequestId;
exports.generateCorrelationId = generateCorrelationId;
exports.levenshteinDistance = levenshteinDistance;
exports.stringSimilarity = stringSimilarity;
exports.sleep = sleep;
exports.formatCurrency = formatCurrency;
exports.truncate = truncate;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
/**
 * Shared utility functions
 */
const crypto_1 = require("crypto");
const crypto_2 = require("crypto");
/**
 * Generate SHA256 hash of a string
 * Used for hashing identifiers (phone, email, etc.)
 */
function generateHash(value) {
    const normalized = value.toLowerCase().trim();
    return (0, crypto_1.createHash)('sha256').update(normalized).digest('hex');
}
/**
 * Normalize phone number
 * Removes all non-digit characters
 */
function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
}
/**
 * Normalize email
 * Lowercase and trim
 */
function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
/**
 * Generate request ID
 */
function generateRequestId() {
    return `req_${(0, crypto_2.randomUUID)()}`;
}
/**
 * Generate correlation ID
 */
function generateCorrelationId() {
    return `cor_${(0, crypto_2.randomUUID)()}`;
}
/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    if (len1 === 0)
        return len2;
    if (len2 === 0)
        return len1;
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[len1][len2];
}
/**
 * Calculate string similarity (0.0 to 1.0)
 * Using normalized Levenshtein distance
 */
function stringSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0)
        return 1.0;
    return 1.0 - distance / maxLen;
}
/**
 * Sleep utility for async delays
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
/**
 * Truncate string
 */
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Check if object is empty
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
//# sourceMappingURL=index.js.map