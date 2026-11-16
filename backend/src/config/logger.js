const pino = require('pino');
const config = require('./env');

const logger = pino({
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
});

module.exports = logger;
