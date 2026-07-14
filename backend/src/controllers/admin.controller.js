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
      students:          parseInt(students.rows[0].count),
      companies:         parseInt(companies.rows[0].count),
      drives:            parseInt(drives.rows[0].count),
      placements:        parseInt(placements.rows[0].count),
      pending_companies: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    return errorResponse(res, 'Failed to get stats', 500);
  }
};

const getStudents = async (req, res) => {
  try {
    const limit  = req.query.limit || 50;
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

const rejectCompany = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE companies SET is_approved = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Company not found', 404);
    return successResponse(res, result.rows[0], 'Company rejected');
  } catch (err) {
    return errorResponse(res, 'Failed to reject company', 500);
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

const getAnalytics = async (req, res) => {
  try {
    const [placementsByBranch, topSkills, monthlyDrives, studentsByBranch] = await Promise.all([
      pool.query(`
        SELECT s.branch, COUNT(*) as placed_count
        FROM shortlists sh
        JOIN students s ON sh.student_id = s.id
        WHERE sh.status = 'confirmed'
        GROUP BY s.branch
        ORDER BY placed_count DESC
      `),
      pool.query(`
        SELECT skill_name as name, COUNT(*) as demand_count
        FROM job_drives,
             jsonb_array_elements_text(required_skills) AS skill_name
        GROUP BY skill_name
        ORDER BY demand_count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month,
               COUNT(*) as drives_count
        FROM job_drives
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 12
      `),
      pool.query(`
        SELECT branch, COUNT(*) as count
        FROM students
        WHERE branch IS NOT NULL
        GROUP BY branch
        ORDER BY count DESC
      `),
    ]);

    return successResponse(res, {
      placements_by_branch: placementsByBranch.rows,
      top_skills:           topSkills.rows,
      monthly_drives:       monthlyDrives.rows,
      students_by_branch:   studentsByBranch.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return errorResponse(res, 'Failed to get analytics', 500);
  }
};

module.exports = {
  getStats, getStudents, getCompanies,
  approveCompany, rejectCompany, getAllDrives, getAnalytics,
};