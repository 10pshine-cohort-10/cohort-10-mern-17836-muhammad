import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/env';
import logger from '../config/logger';
import { JwtUserClaims, SocketEmitter } from '../types/models';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export interface SocketServerHandle {
  io: Server;
  emitToUser: SocketEmitter;
}

export function initializeSocketServer(httpServer: HttpServer): SocketServerHandle {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const authPayload = socket.handshake.auth as { token?: unknown } | undefined;
    const token = typeof authPayload?.token === 'string' ? authPayload.token : null;

    if (!token) {
      next(new Error('Unauthorized socket connection'));
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & Partial<JwtUserClaims>;
      if (!decoded.sub) {
        next(new Error('Invalid socket token'));
        return;
      }
      socket.userId = decoded.sub;
      next();
    } catch {
      next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const room = `user:${socket.userId ?? ''}`;
    void socket.join(room);
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket client connected');

    socket.on('disconnect', (reason: string) => {
      logger.info(
        { userId: socket.userId, socketId: socket.id, reason },
        'Socket client disconnected'
      );
    });
  });

  const emitToUser: SocketEmitter = (userId: string, event: string, payload: unknown): void => {
    io.to(`user:${userId}`).emit(event, payload);
  };

  return { io, emitToUser };
}
