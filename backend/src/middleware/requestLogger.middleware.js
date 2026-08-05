const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique requestId to every request.
 * Logs method, path, status, and response time.
 * Interviewers love seeing this — shows production thinking.
 */
const requestLogger = (req, res, next) => {
  req.requestId = uuidv4();
  const start   = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level    = res.statusCode >= 500 ? 'error'
                   : res.statusCode >= 400 ? 'warn'
                   : 'info';

    logger[level](`${req.method} ${req.originalUrl}`, {
      requestId:  req.requestId,
      statusCode: res.statusCode,
      duration:   `${duration}ms`,
      ip:         req.ip,
      userAgent:  req.get('user-agent'),
      userId:     req.user?.id || null,
    });
  });

  next();
};

module.exports = requestLogger;