const logger = require('../config/logger');
const config = require('../config/env');
const AppError = require('../utils/AppError');

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, _next) {
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

  const responsePayload = {
    success: false,
    error: {
      code,
      message,
      ...(isOperational && err.details ? { details: err.details } : {}),
    },
  };

  return res.status(statusCode).json(responsePayload);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
