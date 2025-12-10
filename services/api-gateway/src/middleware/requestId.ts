/**
 * Request ID middleware
 * Generates unique request ID for tracing
 */
import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '@retail-brain/utils';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Use existing request ID from header or generate new one
  const requestId =
    (req.headers['x-request-id'] as string) || generateRequestId();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId?: string;
    }
  }
}

