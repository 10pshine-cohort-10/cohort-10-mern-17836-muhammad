import express, { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middlewares/validateMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';
import AuthController from '../controllers/authController';
import { MIN_FULL_NAME_LENGTH } from '../services/authService';

const BCRYPT_MAX_PASSWORD_BYTES = 72;

function truncateToMaxUtf8Bytes(value: string, maxBytes: number): string {
  if (Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value;
  }

  let result = '';
  let byteCount = 0;
  for (const char of value) {
    const charBytes = Buffer.byteLength(char, 'utf8');
    if (byteCount + charBytes > maxBytes) {
      break;
    }
    result += char;
    byteCount += charBytes;
  }
  return result;
}

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      MIN_FULL_NAME_LENGTH,
      `Full name must be at least ${MIN_FULL_NAME_LENGTH} characters`
    )
    .max(100),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES,
      `Password must not exceed ${BCRYPT_MAX_PASSWORD_BYTES} bytes`
    ),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .transform((password) => truncateToMaxUtf8Bytes(password, BCRYPT_MAX_PASSWORD_BYTES))
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES,
      `Password must not exceed ${BCRYPT_MAX_PASSWORD_BYTES} bytes`
    ),
});

export default function createAuthRouter(authController: AuthController): Router {
  const router = express.Router();

  router.post('/register', validateBody(registerSchema), authController.register);
  router.post('/login', validateBody(loginSchema), authController.login);
  router.get('/me', authenticateToken, authController.getProfile);
  router.post('/logout', authenticateToken, authController.logout);

  return router;
}
