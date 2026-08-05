require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const http       = require('http');
const { Server } = require('socket.io');

const logger          = require('./utils/logger');
const requestLogger   = require('./middleware/requestLogger.middleware');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.debug('Socket client connected', { socketId: socket.id });

  socket.on('register', (userId) => {
    connectedUsers.set(String(userId), socket.id);
    logger.debug('Socket user registered', { userId, socketId: socket.id });
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of connectedUsers.entries()) {
      if (sid === socket.id) { connectedUsers.delete(uid); break; }
    }
  });
});

app.set('notifyUser', (userId, event, data) => {
  const socketId = connectedUsers.get(String(userId));
  if (socketId) {
    io.to(socketId).emit(event, data);
    logger.debug('Socket notification sent', { userId, event });
  }
});

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── Request logger (logs every request with timing) ───────────────────────
app.use(requestLogger);

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      50,
  message:  { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
  handler:  (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.originalUrl });
    res.status(429).json(options.message);
  },
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  message:  { success: false, message: 'Too many requests. Please slow down.' },
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    message:     'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/students',  require('./routes/student.routes'));
app.use('/api/drives',    require('./routes/drive.routes'));
app.use('/api/drives',    require('./routes/shortlist.routes'));
app.use('/api/admin',     require('./routes/admin.routes'));
app.use('/api/public',    require('./routes/public.routes'));
app.use('/api/interview', require('./routes/interview.routes'));

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.originalUrl });
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', {
    error:     err.message,
    stack:     err.stack,
    requestId: req.requestId,
    path:      req.originalUrl,
  });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 5000);

server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
});

server.on('error', (err) => {
  logger.error('Server failed to start', {
    error: err.message,
    stack: err.stack,
    port: PORT,
  });
});