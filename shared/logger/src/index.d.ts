interface LoggerConfig {
    level?: string;
    service: string;
    pretty?: boolean;
}
interface LogContext {
    request_id?: string;
    correlation_id?: string;
    profile_id?: string;
    event_id?: string;
    [key: string]: unknown;
}
declare class Logger {
    private logger;
    private service;
    constructor(config: LoggerConfig);
    /**
     * Create child logger with persistent context
     */
    child(context: LogContext): Logger;
    /**
     * Info level log
     */
    info(message: string, context?: LogContext): void;
    /**
     * Debug level log
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Warn level log
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Error level log
     */
    error(message: string, error?: Error, context?: LogContext): void;
    /**
     * Fatal level log (will exit process)
     */
    fatal(message: string, error?: Error, context?: LogContext): void;
}
/**
 * Create a logger instance
 */
export declare function createLogger(config: LoggerConfig): Logger;
export { Logger, LoggerConfig, LogContext };
//# sourceMappingURL=index.d.ts.map