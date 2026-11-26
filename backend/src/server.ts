import http from 'node:http';
import config from './config/env';
import logger from './config/logger';
import { verifyDatabaseConnection, closeDatabasePool } from './config/db';
import createApp from './app';
import { initializeSocketServer } from './sockets/socketManager';

async function bootstrap(): Promise<void> {
  await verifyDatabaseConnection();

  const { app, noteService } = createApp();
  const httpServer = http.createServer(app);
  const { io, emitToUser } = initializeSocketServer(httpServer);

  noteService.setSocketEmitter(emitToUser);

  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'Noted backend server running');
  });

  let isShuttingDown = false;
  const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');
    io.close((err?: Error) => {
      if (err) {
        logger.error({ err }, 'Error while closing Socket.IO and HTTP server');
      }
      void closeDatabasePool()
        .then(() => {
          process.exit(err ? 1 : 0);
        })
        .catch((dbErr: unknown) => {
          logger.error({ err: dbErr }, 'Error while closing database pool');
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
