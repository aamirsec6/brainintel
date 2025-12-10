"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
exports.initDb = initDb;
exports.getDb = getDb;
/**
 * Database client module
 * Provides PostgreSQL connection pool with type-safe query interface
 */
const pg_1 = require("pg");
class Database {
    pool = null;
    config;
    constructor(config) {
        this.config = {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ...config,
        };
    }
    /**
     * Initialize the connection pool
     */
    async connect() {
        if (this.pool) {
            return;
        }
        this.pool = new pg_1.Pool(this.config);
        // Test connection
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
        }
        catch (error) {
            throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Execute a query
     */
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.pool.query(text, params);
    }
    /**
     * Get a client from the pool for transactions
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.pool.connect();
    }
    /**
     * Execute a function within a transaction
     */
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Close the connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
    /**
     * Get pool statistics
     */
    getStats() {
        if (!this.pool) {
            return null;
        }
        return {
            total: this.pool.totalCount,
            idle: this.pool.idleCount,
            waiting: this.pool.waitingCount,
        };
    }
}
exports.Database = Database;
// Singleton instance
let dbInstance = null;
/**
 * Initialize database connection
 */
function initDb(config) {
    if (!dbInstance) {
        dbInstance = new Database(config);
    }
    return dbInstance;
}
/**
 * Get database instance
 */
function getDb() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return dbInstance;
}
//# sourceMappingURL=index.js.map