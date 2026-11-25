import pino, { Logger, LoggerOptions } from 'pino';
import config from './env';

const loggerOptions: LoggerOptions = {
  level: config.nodeEnv === 'test' ? 'silent' : config.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.password_hash',
      'password',
      'password_hash',
    ],
    censor: '[REDACTED]',
  },
  base: {
    service: 'noted-api',
    env: config.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

const logger: Logger = pino(loggerOptions);

export default logger;
