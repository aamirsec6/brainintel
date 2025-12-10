/**
 * Global error handler middleware
 * Catches all errors and returns standardized error responses
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@retail-brain/logger';

export function errorHandler(logger: Logger) {
  return (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ) => {
    // Log error
    logger.error('Request error', err, {
      request_id: req.requestId,
      method: req.method,
      path: req.path,
    });

    // Determine status code
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    // Send error response
    res.status(statusCode).json({
      error: {
        message: err.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        request_id: req.requestId,
      },
    });
  };
}

