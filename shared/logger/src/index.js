"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.createLogger = createLogger;
/**
 * Structured logging module using Pino
 * All logs are JSON-formatted for easy parsing and indexing
 */
const pino_1 = __importDefault(require("pino"));
class Logger {
    logger;
    service;
    constructor(config) {
        this.service = config.service;
        const pinoConfig = {
            level: config.level || 'info',
            base: {
                service: this.service,
                env: process.env.NODE_ENV || 'development',
            },
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        };
        // Pretty print for local development
        if (config.pretty && process.env.NODE_ENV === 'development') {
            this.logger = (0, pino_1.default)(pinoConfig, pino_1.default.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            }));
        }
        else {
            this.logger = (0, pino_1.default)(pinoConfig);
        }
    }
    /**
     * Create child logger with persistent context
     */
    child(context) {
        const childLogger = new Logger({
            service: this.service,
            level: this.logger.level,
        });
        childLogger.logger = this.logger.child(context);
        return childLogger;
    }
    /**
     * Info level log
     */
    info(message, context) {
        this.logger.info(context || {}, message);
    }
    /**
     * Debug level log
     */
    debug(message, context) {
        this.logger.debug(context || {}, message);
    }
    /**
     * Warn level log
     */
    warn(message, context) {
        this.logger.warn(context || {}, message);
    }
    /**
     * Error level log
     */
    error(message, error, context) {
        this.logger.error({
            ...context,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                }
                : undefined,
        }, message);
    }
    /**
     * Fatal level log (will exit process)
     */
    fatal(message, error, context) {
        this.logger.fatal({
            ...context,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                }
                : undefined,
        }, message);
    }
}
exports.Logger = Logger;
/**
 * Create a logger instance
 */
function createLogger(config) {
    return new Logger(config);
}
//# sourceMappingURL=index.js.map