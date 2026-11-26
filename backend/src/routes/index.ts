import express, { Request, Response, Router } from 'express';
import createAuthRouter from './authRoutes';
import createNoteRouter from './noteRoutes';
import AuthController from '../controllers/authController';
import NoteController from '../controllers/noteController';

export interface ApiRouterDependencies {
  authController: AuthController;
  noteController: NoteController;
}

export default function createApiRouter({
  authController,
  noteController,
}: ApiRouterDependencies): Router {
  const router = express.Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, status: 'healthy' });
  });

  router.use('/auth', createAuthRouter(authController));
  router.use('/notes', createNoteRouter(noteController));

  return router;
}
