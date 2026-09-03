const jwt  = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Verify JWT token ───────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid token', { error: err.message });
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

// ── Check role ─────────────────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    logger.warn('Unauthorized role access', {
      userId:       req.user?.id,
      role:         req.user?.role,
      requiredRole: roles,
      path:         req.originalUrl,
    });
    return errorResponse(res, 'You do not have permission to access this resource', 403);
  }
  next();
};

// ── Check student is approved by TPO ──────────────────────────────────────
// Apply this middleware AFTER protect + authorize('student')
// on routes that should only be accessible to approved students
const requireApproved = async (req, res, next) => {
  try {
    if (req.user?.role !== 'student') return next(); // only applies to students

    const result = await pool.query(
      `SELECT is_approved, rejection_reason FROM students WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    if (!result.rows[0].is_approved) {
      return res.status(403).json({
        success:          false,
        pending_approval: true,
        message:          'Your account is pending approval by the TPO.',
        rejection_reason: result.rows[0].rejection_reason || null,
      });
    }

    next();
  } catch (err) {
    logger.error('requireApproved check failed', { userId: req.user?.id, error: err.message });
    return errorResponse(res, 'Authorization check failed', 500);
  }
};

module.exports = { protect, authorize, requireApproved };

