import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import config from '../config/env';
import AppError from '../utils/AppError';
import { ErrorResponsePayload } from '../types/models';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
}

export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response<ErrorResponsePayload> {
  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = isOperational ? err.statusCode : 500;
  const code = isOperational ? err.code : 'INTERNAL_SERVER_ERROR';
  const message =
    isOperational || config.nodeEnv !== 'production'
      ? err.message || 'An unexpected error occurred'
      : 'An internal server error occurred';

  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        code,
        statusCode,
        stack: config.nodeEnv === 'production' ? undefined : err.stack,
      },
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      userId: req.user ? req.user.id : null,
    },
    'Request failed with error'
  );

  const responsePayload: ErrorResponsePayload = {
    success: false,
    error: {
      code,
      message,
      ...(isOperational && err.details ? { details: err.details } : {}),
    },
  };

  return res.status(statusCode).json(responsePayload);
}
