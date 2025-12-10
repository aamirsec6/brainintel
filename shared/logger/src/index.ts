/**
 * Structured logging module using Pino
 * All logs are JSON-formatted for easy parsing and indexing
 */
import pino, { Logger as PinoLogger } from 'pino';

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

class Logger {
  private logger: PinoLogger;
  private service: string;

  constructor(config: LoggerConfig) {
    this.service = config.service;

    const pinoConfig: pino.LoggerOptions = {
      level: config.level || 'info',
      base: {
        service: this.service,
        env: process.env.NODE_ENV || 'development',
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    };

    // Pretty print for local development
    if (config.pretty && process.env.NODE_ENV === 'development') {
      this.logger = pino(
        pinoConfig,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        })
      );
    } else {
      this.logger = pino(pinoConfig);
    }
  }

  /**
   * Create child logger with persistent context
   */
  child(context: LogContext): Logger {
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
  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message);
  }

  /**
   * Debug level log
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(context || {}, message);
  }

  /**
   * Warn level log
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message);
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(
      {
        ...context,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      message
    );
  }

  /**
   * Fatal level log (will exit process)
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.logger.fatal(
      {
        ...context,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      message
    );
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

export { Logger, LoggerConfig, LogContext };

