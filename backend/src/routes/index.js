const express = require('express');
const createAuthRouter = require('./authRoutes');
const createNoteRouter = require('./noteRoutes');

function createApiRouter({ authController, noteController }) {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ success: true, status: 'healthy' });
  });

  router.use('/auth', createAuthRouter(authController));
  router.use('/notes', createNoteRouter(noteController));

  return router;
}

module.exports = createApiRouter;
