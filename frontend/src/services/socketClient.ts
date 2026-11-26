import { io, Socket } from 'socket.io-client';
import { Note } from '../types/models';

const SOCKET_URL: string = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export interface ServerToClientEvents {
  'note:created': (note: Note) => void;
  'note:updated': (note: Note) => void;
  'note:deleted': (payload: { id: string }) => void;
  'notes:imported': (payload: { count: number }) => void;
}

export type NoteSocket = Socket<ServerToClientEvents>;

export function createNoteSocket(token: string): NoteSocket {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}
