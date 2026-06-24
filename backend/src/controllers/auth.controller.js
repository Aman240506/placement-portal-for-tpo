const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById } = require('../models/user.model');
const { createStudent } = require('../models/student.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// REGISTER
const register = async (req, res) => {
  try {
    const { email, password, role, full_name, branch, year, cgpa, roll_number } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash, role || 'student');

    if (role === 'student' || !role) {
      await createStudent(user.id, full_name, branch, year, cgpa, roll_number);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(res, { token, user }, 'Registration successful', 201);
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Registration failed', 500);
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

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