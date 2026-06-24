const pool = require('../config/db');

const createRecruiter = async (userId, companyId, full_name, phone, designation) => {
  const result = await pool.query(
    `INSERT INTO recruiters (user_id, company_id, full_name, phone, designation)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, companyId, full_name, phone, designation]
  );
  return result.rows[0];
};

const findRecruiterByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT r.*, c.name as company_name FROM recruiters r
     LEFT JOIN companies c ON r.company_id = c.id
     WHERE r.user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

module.exports = { createRecruiter, findRecruiterByUserId };