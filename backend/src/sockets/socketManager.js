const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../config/logger');

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Unauthorized socket connection'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.sub;
      return next();
    } catch (_err) {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
   void socket.join(room);
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket client connected');

    socket.on('disconnect', (reason) => {
      logger.info(
        { userId: socket.userId, socketId: socket.id, reason },
        'Socket client disconnected'
      );
    });
  });

  function emitToUser(userId, event, payload) {
    io.to(`user:${userId}`).emit(event, payload);
  }

  return { io, emitToUser };
}

module.exports = {
  initializeSocketServer,
};
