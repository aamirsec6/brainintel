/**
 * Request/response logging middleware
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@retail-brain/logger';

export function logMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log request
    logger.info('Incoming request', {
      request_id: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data): Response {
      const duration = Date.now() - start;

      // Log response
      logger.info('Request completed', {
        request_id: req.requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: duration,
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

