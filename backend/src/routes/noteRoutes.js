const express = require('express');
const { z } = require('zod');
const { validateBody } = require('../middlewares/validateMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

const notePayloadSchema = z.object({
  title: z.string().trim().min(1, 'Note title is required').max(255),
  content: z.string().max(100000).default(''),
  tag: z.enum(['Work', 'Personal', 'Ideas']).default('Personal'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
    .default('#FFFFFF'),
});

const noteUpdateSchema = notePayloadSchema.partial();

const importNotesSchema = z.object({
  notes: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(255),
        content: z.string().max(100000).default(''),
        tag: z.string().optional().default('Personal'),
        color: z.string().optional().default('#FFFFFF'),
      })
    )
    .min(1, 'At least one note is required for import')
    .max(100, 'Cannot import more than 100 notes at once'),
});

function createNoteRouter(noteController) {
  const router = express.Router();

  router.use(authenticateToken);

  router.get('/', noteController.listNotes);
  router.post('/', validateBody(notePayloadSchema), noteController.createNote);
  router.post('/import', validateBody(importNotesSchema), noteController.importNotes);
  router.get('/:id', noteController.getNote);
  router.put('/:id', validateBody(noteUpdateSchema), noteController.updateNote);
  router.delete('/:id', noteController.deleteNote);

  return router;
}

module.exports = createNoteRouter;
