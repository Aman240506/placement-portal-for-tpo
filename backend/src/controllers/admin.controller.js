const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

let logger;
try { logger = require('../utils/logger'); }
catch { logger = { info: console.log, warn: console.warn, error: console.error, debug: console.log }; }

// ── STATS ──────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [students, companies, drives, placements, pending] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM students`),
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_approved = true`),
      pool.query(`SELECT COUNT(*) FROM job_drives WHERE status = 'open'`),
      pool.query(`SELECT COUNT(DISTINCT student_id) FROM applications WHERE status = 'selected'`),
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
    logger.error('getStats failed', { error: err.message });
    return errorResponse(res, 'Failed to get stats', 500);
  }
};

// ── STUDENTS ───────────────────────────────────────────────────────────────
const getStudents = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 200;
    const search = req.query.search || '';
    const result = await pool.query(
      `SELECT s.*, u.email FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.full_name ILIKE $1 OR s.branch ILIKE $1 OR u.email ILIKE $1
       ORDER BY s.created_at DESC LIMIT $2`,
      [`%${search}%`, limit]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getStudents failed', { error: err.message });
    return errorResponse(res, 'Failed to get students', 500);
  }
};

// ── APPROVE STUDENT ────────────────────────────────────────────────────────
const approveStudent = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE students
       SET is_approved = true, rejection_reason = NULL, approved_at = NOW()
       WHERE id = $1 RETURNING id, full_name, branch, cgpa, is_approved`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Student not found', 404);

    // Real-time notification via Socket.io
    const notifyUser = req.app?.get('notifyUser');
    if (notifyUser) {
      const userRes = await pool.query(
        `SELECT user_id FROM students WHERE id = $1`, [req.params.id]
      );
      if (userRes.rows[0]) {
        notifyUser(userRes.rows[0].user_id, 'approval_update', {
          type:    'approved',
          message: '🎉 Your account has been approved by TPO! You can now apply for drives.',
        });
      }
    }

    logger.info('Student approved', { studentId: req.params.id });
    return successResponse(res, result.rows[0], 'Student approved successfully');
  } catch (err) {
    logger.error('approveStudent failed', { error: err.message });
    return errorResponse(res, 'Failed to approve student', 500);
  }
};

// ── REJECT STUDENT ─────────────────────────────────────────────────────────
const rejectStudent = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(
      `UPDATE students
       SET is_approved = false,
           rejection_reason = $1,
           approved_at = NULL
       WHERE id = $2 RETURNING id, full_name, is_approved, rejection_reason`,
      [reason || 'Your registration could not be verified.', req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Student not found', 404);

    // Real-time notification
    const notifyUser = req.app?.get('notifyUser');
    if (notifyUser) {
      const userRes = await pool.query(
        `SELECT user_id FROM students WHERE id = $1`, [req.params.id]
      );
      if (userRes.rows[0]) {
        notifyUser(userRes.rows[0].user_id, 'approval_update', {
          type:    'rejected',
          message: `Your registration was not approved. Reason: ${reason || 'Could not be verified.'}`,
        });
      }
    }

    logger.info('Student rejected', { studentId: req.params.id, reason });
    return successResponse(res, result.rows[0], 'Student rejected');
  } catch (err) {
    logger.error('rejectStudent failed', { error: err.message });
    return errorResponse(res, 'Failed to reject student', 500);
  }
};

// ── BULK APPROVE STUDENTS ──────────────────────────────────────────────────
const bulkApproveStudents = async (req, res) => {
  try {
    const { student_ids } = req.body;
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return errorResponse(res, 'student_ids array is required', 400);
    }
    const result = await pool.query(
      `UPDATE students
       SET is_approved = true, rejection_reason = NULL, approved_at = NOW()
       WHERE id = ANY($1::int[])
       RETURNING id, full_name`,
      [student_ids]
    );
    logger.info('Bulk students approved', { count: result.rows.length });
    return successResponse(res, result.rows, `${result.rows.length} students approved`);
  } catch (err) {
    logger.error('bulkApproveStudents failed', { error: err.message });
    return errorResponse(res, 'Bulk approval failed', 500);
  }
};

// ── COMPANIES ──────────────────────────────────────────────────────────────
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

// ── DRIVES ─────────────────────────────────────────────────────────────────
const getAllDrives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jd.*, c.name as company_name,
              COUNT(a.id) as applicant_count,
              COUNT(CASE WHEN a.status = 'selected' THEN 1 END) as selected_count
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

const adminUpdateDrive = async (req, res) => {
  try {
    const { status, tpo_instructions } = req.body;
    const allowed = ['open', 'closed', 'completed'];
    if (status && !allowed.includes(status)) return errorResponse(res, 'Invalid status', 400);

    const result = await pool.query(
      `UPDATE job_drives SET
        status           = COALESCE($1, status),
        tpo_instructions = COALESCE($2, tpo_instructions)
       WHERE id = $3 RETURNING *`,
      [status, tpo_instructions, req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Drive not found', 404);
    return successResponse(res, result.rows[0], 'Drive updated');
  } catch (err) {
    logger.error('adminUpdateDrive failed', { error: err.message });
    return errorResponse(res, 'Failed to update drive', 500);
  }
};

const setDriveInstructions = async (req, res) => {
  try {
    const { tpo_instructions } = req.body;
    if (!tpo_instructions?.trim()) return errorResponse(res, 'Instructions cannot be empty', 400);
    const result = await pool.query(
      `UPDATE job_drives SET tpo_instructions = $1 WHERE id = $2 RETURNING *`,
      [tpo_instructions.trim(), req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Drive not found', 404);
    return successResponse(res, result.rows[0], 'Instructions updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update instructions', 500);
  }
};

// ── PLACED STUDENTS ────────────────────────────────────────────────────────
const getPlacedStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT s.*, u.email,
              jd.title as drive_title, jd.id as drive_id,
              c.name as company_name, jd.ctc_lpa,
              a.applied_at as selected_at, sh.match_score
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN job_drives jd ON a.drive_id = jd.id
       JOIN companies c ON jd.company_id = c.id
       LEFT JOIN shortlists sh ON sh.student_id = s.id AND sh.drive_id = jd.id
       WHERE a.status = 'selected'
       ORDER BY a.applied_at DESC`
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getPlacedStudents failed', { error: err.message });
    return errorResponse(res, 'Failed to get placed students', 500);
  }
};

// ── SEND SELECTION EMAIL ───────────────────────────────────────────────────
const sendSelectionEmail = async (req, res) => {
  try {
    const { student_id, drive_id, custom_message } = req.body;
    if (!student_id || !drive_id) return errorResponse(res, 'student_id and drive_id required', 400);

    const infoRes = await pool.query(
      `SELECT u.email, s.full_name, jd.title as drive_title,
              c.name as company_name, jd.ctc_lpa, jd.drive_date,
              jd.tpo_instructions
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN applications a ON a.student_id = s.id AND a.drive_id = $2
       JOIN job_drives jd ON jd.id = $2
       JOIN companies c ON c.id = jd.company_id
       WHERE s.id = $1`,
      [student_id, drive_id]
    );
    if (!infoRes.rows[0]) return errorResponse(res, 'Student or drive not found', 404);
    const info = infoRes.rows[0];

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return successResponse(res, {
        preview: true,
        to:      info.email,
        subject: `Congratulations! Selected for ${info.drive_title}`,
      }, 'SMTP not configured — email preview only');
    }

    const nodemailer   = require('nodemailer');
    const transporter  = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from:    `"PlacePortal TPO" <${process.env.SMTP_EMAIL}>`,
      to:      info.email,
      subject: `🎉 Congratulations! Selected for ${info.drive_title} at ${info.company_name}`,
      html:    `<p>Dear ${info.full_name}, you have been selected for ${info.drive_title} at ${info.company_name}. ${custom_message || ''}</p>`,
    });

    return successResponse(res, { sent: true, to: info.email }, 'Email sent');
  } catch (err) {
    logger.error('sendSelectionEmail failed', { error: err.message });
    return errorResponse(res, 'Failed to send email', 500);
  }
};

// ── ANALYTICS ──────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const safeFetch = async (query) => {
      try { return (await pool.query(query)).rows; }
      catch (err) { logger.error('Analytics sub-query error', { error: err.message }); return []; }
    };

    const [placementsByBranch, topSkills, monthlyDrives, studentsByBranch] = await Promise.all([
      safeFetch(`
        SELECT s.branch, COUNT(DISTINCT a.student_id) as placed_count
        FROM applications a
        JOIN students s ON a.student_id = s.id
        WHERE a.status = 'selected' AND s.branch IS NOT NULL
        GROUP BY s.branch ORDER BY placed_count DESC
      `),
      safeFetch(`
        SELECT skill_name as name, COUNT(*) as demand_count
        FROM (
          SELECT jsonb_array_elements_text(required_skills) AS skill_name
          FROM job_drives
          WHERE required_skills IS NOT NULL
            AND required_skills != '[]'::jsonb
            AND jsonb_array_length(required_skills) > 0
        ) AS skills
        WHERE skill_name IS NOT NULL AND skill_name != ''
        GROUP BY skill_name ORDER BY demand_count DESC LIMIT 10
      `),
      safeFetch(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month,
               COUNT(*) as drives_count
        FROM job_drives
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) LIMIT 12
      `),
      safeFetch(`
        SELECT branch, COUNT(*) as count
        FROM students WHERE branch IS NOT NULL AND branch != ''
        GROUP BY branch ORDER BY count DESC
      `),
    ]);

    return successResponse(res, {
      placements_by_branch: placementsByBranch,
      top_skills:           topSkills,
      monthly_drives:       monthlyDrives,
      students_by_branch:   studentsByBranch,
    });
  } catch (err) {
    logger.error('getAnalytics failed', { error: err.message });
    return errorResponse(res, 'Failed to get analytics', 500);
  }
};

// ── EXPORTS ────────────────────────────────────────────────────────────────
module.exports = {
  getStats,
  getStudents,
  approveStudent,
  rejectStudent,
  bulkApproveStudents,
  getCompanies,
  approveCompany,
  rejectCompany,
  getAllDrives,
  adminUpdateDrive,
  setDriveInstructions,
  getPlacedStudents,
  sendSelectionEmail,
  getAnalytics,
};


