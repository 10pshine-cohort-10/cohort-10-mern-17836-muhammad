import { ValidationErrorDetail } from '../types/models';

export default class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ValidationErrorDetail[] | null;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details: ValidationErrorDetail[] | null = null
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
