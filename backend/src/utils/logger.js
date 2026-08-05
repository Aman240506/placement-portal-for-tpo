const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = format;

// ── Dev format — readable colored output ──────────────────────────────────
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

// ── Production format — structured JSON ───────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isDev = process.env.NODE_ENV !== 'production';

const baseLogger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev
    ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat)
    : prodFormat,
  transports: [
    new transports.Console(),
    // In production also write to files
    ...(!isDev ? [
      new transports.File({
        filename: path.join('logs', 'error.log'),
        level:    'error',
        maxsize:  5 * 1024 * 1024, // 5MB
        maxFiles: 3,
      }),
      new transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize:  10 * 1024 * 1024,
        maxFiles: 5,
      }),
    ] : []),
  ],
  // Don't crash on unhandled exceptions
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

const logger = {
  error: baseLogger.error.bind(baseLogger),
  warn: baseLogger.warn.bind(baseLogger),
  info: baseLogger.info.bind(baseLogger),
  http: baseLogger.http.bind(baseLogger),
  verbose: baseLogger.verbose.bind(baseLogger),
  debug: baseLogger.debug.bind(baseLogger),
  silly: baseLogger.silly.bind(baseLogger),
  log: baseLogger.log.bind(baseLogger),
  child: baseLogger.child.bind(baseLogger),
};

module.exports = logger;