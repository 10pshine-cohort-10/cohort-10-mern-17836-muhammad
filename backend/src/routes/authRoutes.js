const express = require('express');
const { z } = require('zod');
const { validateBody } = require('../middlewares/validateMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function createAuthRouter(authController) {
  const router = express.Router();

  router.post('/register', validateBody(registerSchema), authController.register);
  router.post('/login', validateBody(loginSchema), authController.login);
  router.get('/me', authenticateToken, authController.getProfile);
  router.post('/logout', authenticateToken, authController.logout);

  return router;
}

module.exports = createAuthRouter;
