/**
 * Database client module
 * Provides PostgreSQL connection pool with type-safe query interface
 */
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
declare class Database {
    private pool;
    private config;
    constructor(config: DbConfig);
    /**
     * Initialize the connection pool
     */
    connect(): Promise<void>;
    /**
     * Execute a query
     */
    query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    /**
     * Get a client from the pool for transactions
     */
    getClient(): Promise<PoolClient>;
    /**
     * Execute a function within a transaction
     */
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    /**
     * Close the connection pool
     */
    close(): Promise<void>;
    /**
     * Get pool statistics
     */
    getStats(): {
        total: number;
        idle: number;
        waiting: number;
    } | null;
}
/**
 * Initialize database connection
 */
export declare function initDb(config: DbConfig): Database;
/**
 * Get database instance
 */
export declare function getDb(): Database;
export { Database, DbConfig, PoolClient };
//# sourceMappingURL=index.d.ts.map