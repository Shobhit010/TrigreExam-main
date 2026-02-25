import type { Response } from 'express';

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown
): void {
  const response: ApiResponse<null> & { details?: unknown } = {
    success: false,
    message,
  };

  if (process.env['NODE_ENV'] === 'development' && details !== undefined) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}
