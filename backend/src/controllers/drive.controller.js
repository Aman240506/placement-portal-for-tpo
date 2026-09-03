const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId }   = require('../models/student.model');
const { findRecruiterByUserId } = require('../models/recruiter.model');
const logger = require('../utils/logger');

// ── GET ELIGIBLE DRIVES ────────────────────────────────────────────────────
const getEligibleDrives = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student profile not found', 404);

    // 🔴 KEY CHECK: block unapproved students
    if (!student.is_approved) {
      return errorResponse(res, 'Your account is pending TPO approval. You will be able to view and apply to drives once approved.', 403);
    }

    const result = await pool.query(
      `SELECT jd.*, c.name as company_name,
              EXISTS(
                SELECT 1 FROM applications a
                WHERE a.student_id = $1 AND a.drive_id = jd.id
              ) as already_applied
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       WHERE jd.status = 'open'
         AND jd.application_deadline >= CURRENT_DATE
         AND c.is_approved = true
         AND jd.min_cgpa <= $2
         AND jd.max_backlogs >= $3
         AND (jd.allowed_branches = '[]'::jsonb OR jd.allowed_branches @> $4::jsonb)
       ORDER BY jd.created_at DESC`,
      [student.id, student.cgpa || 0, student.backlogs || 0, JSON.stringify([student.branch])]
    );

    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getEligibleDrives failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get drives', 500);
  }
};

// ── GET SINGLE DRIVE ───────────────────────────────────────────────────────
const getDrive = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT jd.*, c.name as company_name, c.website, c.description as company_description
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       WHERE jd.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Drive not found', 404);
    return successResponse(res, result.rows[0]);
  } catch (err) {
    logger.error('getDrive failed', { driveId: req.params.id, error: err.message });
    return errorResponse(res, 'Failed to get drive', 500);
  }
};

// ── APPLY TO DRIVE ─────────────────────────────────────────────────────────
const applyToDrive = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student profile not found', 404);

    // 🔴 Block unapproved students from applying
    if (!student.is_approved) {
      return errorResponse(res, 'Your account is pending TPO approval. You cannot apply to drives yet.', 403);
    }

    const drive = await pool.query(`SELECT * FROM job_drives WHERE id = $1`, [req.params.id]);
    if (!drive.rows[0])                     return errorResponse(res, 'Drive not found', 404);
    if (drive.rows[0].status !== 'open')    return errorResponse(res, 'Drive is closed', 400);
    if (new Date(drive.rows[0].application_deadline) < new Date())
      return errorResponse(res, 'Application deadline has passed', 400);

    const existing = await pool.query(
      `SELECT id FROM applications WHERE student_id = $1 AND drive_id = $2`,
      [student.id, req.params.id]
    );
    if (existing.rows[0]) return errorResponse(res, 'You have already applied to this drive', 409);

    const result = await pool.query(
      `INSERT INTO applications (student_id, drive_id) VALUES ($1, $2) RETURNING *`,
      [student.id, req.params.id]
    );

    logger.info('Student applied to drive', { studentId: student.id, driveId: req.params.id });
    return successResponse(res, result.rows[0], 'Application submitted successfully', 201);
  } catch (err) {
    logger.error('applyToDrive failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to apply', 500);
  }
};

// ── GET MY DRIVES (recruiter) ──────────────────────────────────────────────
const getMyDrives = async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter profile not found', 404);

    const result = await pool.query(
      `SELECT jd.*, c.name as company_name,
              COUNT(a.id) as applicant_count
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       LEFT JOIN applications a ON a.drive_id = jd.id
       WHERE jd.recruiter_id = $1
       GROUP BY jd.id, c.name
       ORDER BY jd.created_at DESC`,
      [recruiter.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getMyDrives failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get drives', 500);
  }
};

// ── CREATE DRIVE ───────────────────────────────────────────────────────────
const createDrive = async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter profile not found', 404);

    const {
      title, description, required_skills, min_cgpa,
      allowed_branches, max_backlogs, ctc_lpa,
      application_deadline, drive_date,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO job_drives
        (company_id, recruiter_id, title, description, required_skills,
         min_cgpa, allowed_branches, max_backlogs, ctc_lpa, application_deadline, drive_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        recruiter.company_id, recruiter.id, title, description,
        JSON.stringify(required_skills || []),
        min_cgpa || 0,
        JSON.stringify(allowed_branches || []),
        max_backlogs || 0,
        ctc_lpa, application_deadline, drive_date,
      ]
    );

    logger.info('Drive created', { recruiterId: recruiter.id, driveId: result.rows[0].id, title });
    return successResponse(res, result.rows[0], 'Drive created successfully', 201);
  } catch (err) {
    logger.error('createDrive failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to create drive', 500);
  }
};

// ── GET DRIVE APPLICANTS ───────────────────────────────────────────────────
const getDriveApplicants = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.email,
              a.id as application_id,
              a.status as application_status,
              a.applied_at,
              sh.match_score, sh.matched_skills, sh.missing_skills, sh.rank
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN shortlists sh ON sh.student_id = s.id AND sh.drive_id = a.drive_id
       WHERE a.drive_id = $1
       ORDER BY a.applied_at DESC`,
      [req.params.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getDriveApplicants failed', { driveId: req.params.id, error: err.message });
    return errorResponse(res, 'Failed to get applicants', 500);
  }
};

// ── UPDATE DRIVE ───────────────────────────────────────────────────────────
const updateDrive = async (req, res) => {
  try {
    const {
      title, description, required_skills, min_cgpa,
      allowed_branches, max_backlogs, ctc_lpa,
      application_deadline, drive_date, status,
    } = req.body;

    // Admin can update any drive, recruiter only their own
    const isAdmin   = req.user.role === 'admin';
    const whereClause = isAdmin ? `WHERE id = $11` : `WHERE id = $11 AND recruiter_id = $12`;

    let query, params;
    if (isAdmin) {
      query = `UPDATE job_drives SET
        title                = COALESCE($1, title),
        description          = COALESCE($2, description),
        required_skills      = COALESCE($3, required_skills),
        min_cgpa             = COALESCE($4, min_cgpa),
        allowed_branches     = COALESCE($5, allowed_branches),
        max_backlogs         = COALESCE($6, max_backlogs),
        ctc_lpa              = COALESCE($7, ctc_lpa),
        application_deadline = COALESCE($8, application_deadline),
        drive_date           = COALESCE($9, drive_date),
        status               = COALESCE($10, status)
       WHERE id = $11 RETURNING *`;
      params = [title, description,
        required_skills  ? JSON.stringify(required_skills)  : null,
        min_cgpa,
        allowed_branches ? JSON.stringify(allowed_branches) : null,
        max_backlogs, ctc_lpa, application_deadline, drive_date, status,
        req.params.id];
    } else {
      const recruiter = await findRecruiterByUserId(req.user.id);
      if (!recruiter) return errorResponse(res, 'Recruiter not found', 404);
      query = `UPDATE job_drives SET
        title                = COALESCE($1, title),
        description          = COALESCE($2, description),
        required_skills      = COALESCE($3, required_skills),
        min_cgpa             = COALESCE($4, min_cgpa),
        allowed_branches     = COALESCE($5, allowed_branches),
        max_backlogs         = COALESCE($6, max_backlogs),
        ctc_lpa              = COALESCE($7, ctc_lpa),
        application_deadline = COALESCE($8, application_deadline),
        drive_date           = COALESCE($9, drive_date),
        status               = COALESCE($10, status)
       WHERE id = $11 AND recruiter_id = $12 RETURNING *`;
      params = [title, description,
        required_skills  ? JSON.stringify(required_skills)  : null,
        min_cgpa,
        allowed_branches ? JSON.stringify(allowed_branches) : null,
        max_backlogs, ctc_lpa, application_deadline, drive_date, status,
        req.params.id, recruiter.id];
    }

    const result = await pool.query(query, params);
    if (!result.rows[0]) return errorResponse(res, 'Drive not found', 404);
    return successResponse(res, result.rows[0], 'Drive updated');
  } catch (err) {
    logger.error('updateDrive failed', { driveId: req.params.id, error: err.message });
    return errorResponse(res, 'Failed to update drive', 500);
  }
};

module.exports = {
  getEligibleDrives, getDrive, applyToDrive,
  getMyDrives, createDrive, getDriveApplicants, updateDrive,
};

