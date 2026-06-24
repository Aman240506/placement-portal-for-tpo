const pool = require('../config/db');

const createStudent = async (userId, full_name, branch, year, cgpa, roll_number) => {
  const result = await pool.query(
    `INSERT INTO students (user_id, full_name, branch, year, cgpa, roll_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, full_name, branch, year, cgpa, roll_number]
  );
  return result.rows[0];
};

const findStudentByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM students WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

module.exports = { createStudent, findStudentByUserId };