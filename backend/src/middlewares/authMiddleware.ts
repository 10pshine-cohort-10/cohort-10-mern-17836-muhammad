import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/env';
import AppError from '../utils/AppError';
import logger from '../config/logger';
import { JwtUserClaims } from '../types/models';

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next(new AppError('Authentication token is required', 401, 'UNAUTHORIZED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & Partial<JwtUserClaims>;
    if (!decoded.sub || !decoded.email || !decoded.fullName) {
      next(new AppError('Invalid or expired session token', 401, 'INVALID_TOKEN'));
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
    };
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown JWT verification error';
    logger.warn({ err: message }, 'Invalid or expired JWT presented');
    next(new AppError('Invalid or expired session token', 401, 'INVALID_TOKEN'));
  }
}
