const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getStats = async (req, res) => {
  try {
    const [students, companies, drives, placements, pending] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM students`),
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_approved = true`),
      pool.query(`SELECT COUNT(*) FROM job_drives WHERE status = 'open'`),
      pool.query(`SELECT COUNT(*) FROM shortlists WHERE status = 'confirmed'`),
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_approved = false`),
    ]);
    return successResponse(res, {
      students: parseInt(students.rows[0].count),
      companies: parseInt(companies.rows[0].count),
      drives: parseInt(drives.rows[0].count),
      placements: parseInt(placements.rows[0].count),
      pending_companies: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    return errorResponse(res, 'Failed to get stats', 500);
  }
};

const getStudents = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const search = req.query.search || '';
    const result = await pool.query(
      `SELECT s.*, u.email FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.full_name ILIKE $1 OR s.branch ILIKE $1
       ORDER BY s.created_at DESC LIMIT $2`,
      [`%${search}%`, limit]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get students', 500);
  }
};

const getCompanies = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM companies ORDER BY created_at DESC`);
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get companies', 500);
  }
};

const approveCompany = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE companies SET is_approved = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Company not found', 404);
    return successResponse(res, result.rows[0], 'Company approved');
  } catch (err) {
    return errorResponse(res, 'Failed to approve company', 500);
  }
};

const getAllDrives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jd.*, c.name as company_name,
              COUNT(a.id) as applicant_count
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       LEFT JOIN applications a ON a.drive_id = jd.id
       GROUP BY jd.id, c.name
       ORDER BY jd.created_at DESC`
    );
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get drives', 500);
  }
};

module.exports = { getStats, getStudents, getCompanies, approveCompany, getAllDrives };