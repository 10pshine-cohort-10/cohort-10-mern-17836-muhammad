const asyncHandler = require('../utils/asyncHandler');

class NoteController {
  constructor(noteService) {
    this.noteService = noteService;

    this.listNotes = asyncHandler(async (req, res) => {
      const { search = '', tag = '', dateFrom = '', dateTo = '' } = req.query;
      const notes = await this.noteService.listNotes(req.user.id, {
        search: String(search).trim(),
        tag: String(tag).trim(),
        dateFrom: String(dateFrom).trim(),
        dateTo: String(dateTo).trim(),
      });
      res.status(200).json({
        success: true,
        data: { notes },
      });
    });

    this.getNote = asyncHandler(async (req, res) => {
      const note = await this.noteService.getNoteById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: { note },
      });
    });

    this.createNote = asyncHandler(async (req, res) => {
      const note = await this.noteService.createNote(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: { note },
      });
    });

    this.updateNote = asyncHandler(async (req, res) => {
      const note = await this.noteService.updateNote(req.params.id, req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: { note },
      });
    });

    this.deleteNote = asyncHandler(async (req, res) => {
      const result = await this.noteService.deleteNote(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    });

    this.importNotes = asyncHandler(async (req, res) => {
      const notes = await this.noteService.importNotes(req.user.id, req.body.notes);
      res.status(201).json({
        success: true,
        data: { notes },
      });
    });
  }
}

module.exports = NoteController;
