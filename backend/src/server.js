require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const http         = require('http');
const { Server }   = require('socket.io');

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance so controllers can use it
app.set('io', io);

// Track connected users: userId → socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Student/recruiter registers with their userId after login
  socket.on('register', (userId) => {
    connectedUsers.set(String(userId), socket.id);
    console.log(`[Socket] User ${userId} registered → socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    // Remove from map
    for (const [userId, sid] of connectedUsers.entries()) {
      if (sid === socket.id) {
        connectedUsers.delete(userId);
        console.log(`[Socket] User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Helper: send notification to a specific user
app.set('notifyUser', (userId, event, data) => {
  const socketId = connectedUsers.get(String(userId));
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`[Socket] Notified user ${userId}: ${event}`);
  }
});

// ── CORS ───────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 50,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth.routes');
const studentRoutes   = require('./routes/student.routes');
const driveRoutes     = require('./routes/drive.routes');
const adminRoutes     = require('./routes/admin.routes');
const shortlistRoutes = require('./routes/shortlist.routes');
const publicRoutes    = require('./routes/public.routes');

app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/drives',   driveRoutes);
app.use('/api/drives',   shortlistRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/public',   publicRoutes); // no auth required

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket server ready`);
});