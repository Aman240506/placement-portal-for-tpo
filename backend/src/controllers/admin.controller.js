const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ── STATS ──────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [students, companies, drives, placements, pending] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM students`),
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_approved = true`),
      pool.query(`SELECT COUNT(*) FROM job_drives WHERE status = 'open'`),
      // FIX: count both confirmed shortlists AND selected applications
      pool.query(`
        SELECT COUNT(DISTINCT a.student_id) FROM applications a
        WHERE a.status = 'selected'
      `),
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
    console.error('Stats error:', err.message);
    return errorResponse(res, 'Failed to get stats', 500);
  }
};

// ── STUDENTS ───────────────────────────────────────────────────────────────
const getStudents = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 200;
    const search = req.query.search || '';
    const result = await pool.query(
      `SELECT s.*, u.email,
              (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id) as application_count,
              (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id AND a.status = 'selected') as selected_count
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.full_name ILIKE $1 OR s.branch ILIKE $1 OR u.email ILIKE $1
       ORDER BY s.created_at DESC LIMIT $2`,
      [`%${search}%`, limit]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    console.error('Get students error:', err.message);
    return errorResponse(res, 'Failed to get students', 500);
  }
};

// ── APPROVE / REJECT STUDENT ───────────────────────────────────────────────
const approveStudent = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE students SET is_approved = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Student not found', 404);
    return successResponse(res, result.rows[0], 'Student approved');
  } catch (err) {
    return errorResponse(res, 'Failed to approve student', 500);
  }
};

const rejectStudent = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE students SET is_approved = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Student not found', 404);
    return successResponse(res, result.rows[0], 'Student rejected');
  } catch (err) {
    return errorResponse(res, 'Failed to reject student', 500);
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

// FIX: Admin can now close/update any drive (not restricted to recruiter)
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
    console.error('Admin update drive error:', err.message);
    return errorResponse(res, 'Failed to update drive', 500);
  }
};

// ── TPO INSTRUCTIONS ON DRIVE ──────────────────────────────────────────────
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
              jd.title as drive_title,
              c.name as company_name,
              jd.ctc_lpa,
              a.applied_at as selected_at,
              sh.match_score
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
    console.error('Get placed students error:', err.message);
    return errorResponse(res, 'Failed to get placed students', 500);
  }
};

// ── SEND EMAIL TO SELECTED STUDENT ─────────────────────────────────────────
const sendSelectionEmail = async (req, res) => {
  try {
    const { student_id, drive_id, custom_message } = req.body;
    if (!student_id || !drive_id) return errorResponse(res, 'student_id and drive_id required', 400);

    // Get student + drive details
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

    // Use nodemailer if configured, otherwise just return the email content
    const nodemailer = require('nodemailer');

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      // Return email preview if SMTP not configured
      return successResponse(res, {
        preview: true,
        to: info.email,
        subject: `🎉 Congratulations! You are selected for ${info.drive_title} at ${info.company_name}`,
        body: buildEmailBody(info, custom_message),
      }, 'SMTP not configured — email preview only');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"PlacePortal TPO" <${process.env.SMTP_EMAIL}>`,
      to: info.email,
      subject: `🎉 Congratulations! Selected for ${info.drive_title} at ${info.company_name}`,
      html: buildEmailBody(info, custom_message),
    });

    // Log email sent
    await pool.query(
      `UPDATE applications SET status = 'selected' 
       WHERE student_id = $1 AND drive_id = $2`,
      [student_id, drive_id]
    );

    return successResponse(res, { sent: true, to: info.email }, 'Selection email sent');
  } catch (err) {
    console.error('Send email error:', err.message);
    return errorResponse(res, 'Failed to send email', 500);
  }
};

const buildEmailBody = (info, customMessage) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 32px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🎓 PlacePortal</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Training & Placement Cell</p>
    </div>

    <div style="padding: 32px;">
      <h2 style="color: #10b981; font-size: 22px; margin: 0 0 8px;">Congratulations, ${info.full_name}! 🎉</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        We are thrilled to inform you that you have been <strong>selected</strong> for the following placement opportunity.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 40%;">Company</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${info.company_name}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Role</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${info.drive_title}</td></tr>
          ${info.ctc_lpa ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Package</td><td style="padding: 6px 0; font-weight: 600; color: #10b981;">${info.ctc_lpa} LPA</td></tr>` : ''}
          ${info.drive_date ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Drive Date</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${new Date(info.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
        </table>
      </div>

      ${info.tpo_instructions ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px;">📋 TPO Instructions</h3>
        <p style="color: #78350f; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${info.tpo_instructions}</p>
      </div>` : ''}

      ${customMessage ? `
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #0c4a6e; font-size: 14px; margin: 0 0 8px;">💬 Message from TPO</h3>
        <p style="color: #075985; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${customMessage}</p>
      </div>` : ''}

      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Please report to the placement cell for further formalities. Carry all required documents on the drive date.
      </p>
    </div>

    <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        This is an automated email from PlacePortal · Training & Placement Cell
      </p>
    </div>
  </div>
</body>
</html>
`;

// ── ANALYTICS ──────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const safeFetch = async (query) => {
      try { return (await pool.query(query)).rows; }
      catch (err) { console.error('Analytics sub-query error:', err.message); return []; }
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
        FROM students
        WHERE branch IS NOT NULL AND branch != ''
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
    console.error('Analytics error:', err.message);
    return errorResponse(res, 'Failed to get analytics', 500);
  }
};

module.exports = {
  getStats, getStudents, approveStudent, rejectStudent,
  getCompanies, approveCompany, rejectCompany,
  getAllDrives, adminUpdateDrive, setDriveInstructions,
  getPlacedStudents, sendSelectionEmail, getAnalytics,
};