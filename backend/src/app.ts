import express, { Express, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';

import config from './config/env';
import logger from './config/logger';
import UserRepository from './repositories/userRepository';
import NoteRepository from './repositories/noteRepository';
import AuthService from './services/authService';
import NoteService from './services/noteService';
import AuthController from './controllers/authController';
import NoteController from './controllers/noteController';
import createApiRouter from './routes';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware';

export interface CreateAppOptions {
  noteServiceOverride?: NoteService | null;
}

export interface CreateAppResult {
  app: Express;
  noteService: NoteService;
}

export default function createApp({
  noteServiceOverride = null,
}: CreateAppOptions = {}): CreateAppResult {
  const app: Express = express();

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
      genReqId: (req: Request) => {
        const headerId = req.headers['x-request-id'];
        return typeof headerId === 'string' && headerId ? headerId : uuidv4();
      },
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
