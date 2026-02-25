import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { sendError } from '../utils/responseHandler';

// Must have exactly 4 parameters — Express identifies error middleware by arity
export function globalErrorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error('[GlobalError] Unhandled error:', err);

  const message =
    process.env['NODE_ENV'] === 'production'
      ? 'An internal server error occurred'
      : err.message;

  sendError(res, message, 500);
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  sendError(res, 'Route not found', 404);
}
