const pool = require('../config/db');

const createUser = async (email, passwordHash, role) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
    [email, passwordHash, role]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`,
    [email]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, role, is_active, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

module.exports = { createUser, findUserByEmail, findUserById };