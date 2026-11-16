const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const config = require('./config/env');
const logger = require('./config/logger');
const UserRepository = require('./repositories/userRepository');
const NoteRepository = require('./repositories/noteRepository');
const AuthService = require('./services/authService');
const NoteService = require('./services/noteService');
const AuthController = require('./controllers/authController');
const NoteController = require('./controllers/noteController');
const createApiRouter = require('./routes');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorMiddleware');

function createApp({ noteServiceOverride = null } = {}) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
    })
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later.',
      },
    },
  });

  app.use('/api/auth', authLimiter);
  app.use(express.json({ limit: '1mb' }));

  const userRepository = new UserRepository();
  const noteRepository = new NoteRepository();
  const authService = new AuthService(userRepository);
  const noteService = noteServiceOverride || new NoteService(noteRepository);

  const authController = new AuthController(authService);
  const noteController = new NoteController(noteService);

  app.use('/api', createApiRouter({ authController, noteController }));

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return { app, noteService };
}

module.exports = createApp;
