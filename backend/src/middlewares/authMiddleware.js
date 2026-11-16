const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

function authenticateToken(req, _res, next) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return next(new AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
    };
    return next();
  } catch (err) {
    logger.warn({ err: err.message }, 'Invalid or expired JWT presented');
    return next(new AppError('Invalid or expired session token', 401, 'INVALID_TOKEN'));
  }
}

module.exports = {
  authenticateToken,
  extractBearerToken,
};
