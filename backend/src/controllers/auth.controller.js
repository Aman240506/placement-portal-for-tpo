const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const { createUser, findUserByEmail, findUserById } = require('../models/user.model');
const { createStudent }   = require('../models/student.model');
const { createRecruiter } = require('../models/recruiter.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// ── REGISTER ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, role, full_name, branch, year, cgpa,
          roll_number, company_name, designation, phone } = req.body;
  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      logger.warn('Registration attempt with existing email', { email });
      return errorResponse(res, 'Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user         = await createUser(email, passwordHash, role);

    if (role === 'student') {
      await createStudent(user.id, full_name, branch, year, cgpa, roll_number);
    }

    if (role === 'recruiter') {
      let company = await pool.query(
        `SELECT id FROM companies WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [company_name]
      );
      if (!company.rows[0]) {
        company = await pool.query(
          `INSERT INTO companies (name, is_approved) VALUES ($1, false) RETURNING id`,
          [company_name]
        );
      }
      await createRecruiter(
        user.id, company.rows[0].id,
        full_name || email.split('@')[0], phone || null, designation || 'Recruiter'
      );
    }

    const token = signToken(user);
    logger.info('User registered successfully', { userId: user.id, role, email });
    return successResponse(res, { token, user: { id: user.id, email: user.email, role: user.role } }, 'Registration successful', 201);

  } catch (err) {
    logger.error('Registration failed', { email, error: err.message, stack: err.stack });
    return errorResponse(res, 'Registration failed', 500);
  }
};

// ── LOGIN ──────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn('Login attempt with unknown email', { email });
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn('Login attempt with wrong password', { userId: user.id, email });
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = signToken(user);
    logger.info('User logged in', { userId: user.id, role: user.role });
    return successResponse(res, { token, user: { id: user.id, email: user.email, role: user.role } }, 'Login successful');

  } catch (err) {
    logger.error('Login failed', { email, error: err.message });
    return errorResponse(res, 'Login failed', 500);
  }
};

// ── GET ME ─────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user);
  } catch (err) {
    logger.error('getMe failed', { userId: req.user?.id, error: err.message });
    return errorResponse(res, 'Failed to get user', 500);
  }
};

module.exports = { register, login, getMe };