require('dotenv').config(); // MUST be the very first line

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const app = express();

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
}));

// ── Rate limiting (BEFORE routes) ─────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth.routes');
const studentRoutes   = require('./routes/student.routes');
const driveRoutes     = require('./routes/drive.routes');
const adminRoutes     = require('./routes/admin.routes');
const shortlistRoutes = require('./routes/shortlist.routes');

app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/drives',   driveRoutes);
app.use('/api/drives',   shortlistRoutes);
app.use('/api/admin',    adminRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
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
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});