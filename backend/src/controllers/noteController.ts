import { Request, Response, RequestHandler } from 'express';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import {
  CreateNoteInput,
  NoteFilters,
  NoteResponse,
  UpdateNoteInput,
} from '../types/models';

export interface NoteServiceContract {
  listNotes(userId: string, filters?: NoteFilters): Promise<NoteResponse[]>;
  getNoteById(noteId: string, userId: string): Promise<NoteResponse>;
  createNote(userId: string, payload: CreateNoteInput): Promise<NoteResponse>;
  updateNote(noteId: string, userId: string, payload: UpdateNoteInput): Promise<NoteResponse>;
  deleteNote(noteId: string, userId: string): Promise<{ id: string }>;
  importNotes(userId: string, rawNotes: CreateNoteInput[]): Promise<NoteResponse[]>;
}

export default class NoteController {
  private readonly noteService: NoteServiceContract;

  public readonly listNotes: RequestHandler;
  public readonly getNote: RequestHandler;
  public readonly createNote: RequestHandler;
  public readonly updateNote: RequestHandler;
  public readonly deleteNote: RequestHandler;
  public readonly importNotes: RequestHandler;

  constructor(noteService: NoteServiceContract) {
    this.noteService = noteService;

    this.listNotes = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
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

    this.getNote = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const note = await this.noteService.getNoteById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: { note },
      });
    });

    this.createNote = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const note = await this.noteService.createNote(req.user.id, req.body as CreateNoteInput);
      res.status(201).json({
        success: true,
        data: { note },
      });
    });

    this.updateNote = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const note = await this.noteService.updateNote(
        req.params.id,
        req.user.id,
        req.body as UpdateNoteInput
      );
      res.status(200).json({
        success: true,
        data: { note },
      });
    });

    this.deleteNote = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const result = await this.noteService.deleteNote(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    });

    this.importNotes = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const body = req.body as { notes: CreateNoteInput[] };
      const notes = await this.noteService.importNotes(req.user.id, body.notes);
      res.status(201).json({
        success: true,
        data: { notes },
      });
    });
  }
}
