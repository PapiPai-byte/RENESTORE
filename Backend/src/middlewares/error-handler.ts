import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    stack: err.stack,
  });
};
