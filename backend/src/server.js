const http = require('node:http');
const config = require('./config/env');
const logger = require('./config/logger');
const { verifyDatabaseConnection, closeDatabasePool } = require('./config/db');
const createApp = require('./app');
const { initializeSocketServer } = require('./sockets/socketManager');

async function bootstrap() {
  await verifyDatabaseConnection();

  const { app, noteService } = createApp();
  const httpServer = http.createServer(app);
  const { emitToUser } = initializeSocketServer(httpServer);

  noteService.setSocketEmitter(emitToUser);

  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'Noted backend server running');
  });

  const gracefulShutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received');
    httpServer.close(async () => {
      await closeDatabasePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
