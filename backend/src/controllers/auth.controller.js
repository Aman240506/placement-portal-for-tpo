const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const { createUser, findUserByEmail, findUserById } = require('../models/user.model');
const { createStudent } = require('../models/student.model');
const { createRecruiter } = require('../models/recruiter.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// REGISTER
const register = async (req, res) => {
  try {
    const {
      email, password, role,
      // Student fields
      full_name, branch, year, cgpa, roll_number,
      // Recruiter fields
      company_name, designation, phone,
    } = req.body;

    if (!email || !password) return errorResponse(res, 'Email and password are required', 400);
    if (!['student', 'recruiter'].includes(role)) return errorResponse(res, 'Role must be student or recruiter', 400);

    const existingUser = await findUserByEmail(email);
    if (existingUser) return errorResponse(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash, role);

    if (role === 'student') {
      if (!full_name || !branch || !year || !cgpa) {
        return errorResponse(res, 'Full name, branch, year and CGPA are required', 400);
      }
      await createStudent(user.id, full_name, branch, year, cgpa, roll_number);
    }

    if (role === 'recruiter') {
      if (!company_name) return errorResponse(res, 'Company name is required', 400);

      // Create or find the company
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

      const companyId = company.rows[0].id;
      await createRecruiter(user.id, companyId, full_name || email.split('@')[0], phone || null, designation || 'Recruiter');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(res, {
      token,
      user: { id: user.id, email: user.email, role: user.role }
    }, 'Registration successful', 201);

  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Registration failed', 500);
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 'Email and password are required', 400);

    const user = await findUserByEmail(email);
    if (!user) return errorResponse(res, 'Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return errorResponse(res, 'Invalid email or password', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(res, {
      token,
      user: { id: user.id, email: user.email, role: user.role }
    }, 'Login successful');

  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Login failed', 500);
  }
};

// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user);
  } catch (err) {
    return errorResponse(res, 'Failed to get user', 500);
  }
};

module.exports = { register, login, getMe };