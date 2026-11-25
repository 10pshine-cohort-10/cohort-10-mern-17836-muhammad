import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import AppError from '../utils/AppError';
import { ValidationErrorDetail } from '../types/models';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', formattedErrors));
      return;
    }
    req.body = result.data;
    next();
  };
}
