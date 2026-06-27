const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId } = require('../models/student.model');
const { findRecruiterByUserId } = require('../models/recruiter.model');

// GET eligible drives for student
const getEligibleDrives = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student profile not found', 404);

    const result = await pool.query(
      `SELECT jd.*, c.name as company_name
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       WHERE jd.status = 'open'
         AND jd.application_deadline >= CURRENT_DATE
         AND jd.min_cgpa <= $1
         AND jd.max_backlogs >= $2
         AND (jd.allowed_branches = '[]'::jsonb OR jd.allowed_branches @> $3::jsonb)
       ORDER BY jd.created_at DESC`,
      [student.cgpa, student.backlogs, JSON.stringify([student.branch])]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to get drives', 500);
  }
};

// GET single drive
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
    return errorResponse(res, 'Failed to get drive', 500);
  }
};

// POST apply to drive
const applyToDrive = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student profile not found', 404);

    const drive = await pool.query(`SELECT * FROM job_drives WHERE id = $1`, [req.params.id]);
    if (!drive.rows[0]) return errorResponse(res, 'Drive not found', 404);
    if (drive.rows[0].status !== 'open') return errorResponse(res, 'Drive is closed', 400);
    if (new Date(drive.rows[0].application_deadline) < new Date()) return errorResponse(res, 'Application deadline passed', 400);

    const existing = await pool.query(
      `SELECT id FROM applications WHERE student_id = $1 AND drive_id = $2`,
      [student.id, req.params.id]
    );
    if (existing.rows[0]) return errorResponse(res, 'Already applied', 409);

    const result = await pool.query(
      `INSERT INTO applications (student_id, drive_id) VALUES ($1, $2) RETURNING *`,
      [student.id, req.params.id]
    );
    return successResponse(res, result.rows[0], 'Applied successfully', 201);
  } catch (err) {
    return errorResponse(res, 'Failed to apply', 500);
  }
};

// GET recruiter's drives
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
    return errorResponse(res, 'Failed to get drives', 500);
  }
};

// POST create drive
const createDrive = async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter profile not found', 404);

    const { title, description, required_skills, min_cgpa, allowed_branches,
            max_backlogs, ctc_lpa, application_deadline, drive_date } = req.body;

    const result = await pool.query(
      `INSERT INTO job_drives
        (company_id, recruiter_id, title, description, required_skills,
         min_cgpa, allowed_branches, max_backlogs, ctc_lpa, application_deadline, drive_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [recruiter.company_id, recruiter.id, title, description,
       JSON.stringify(required_skills || []), min_cgpa || 0,
       JSON.stringify(allowed_branches || []), max_backlogs || 0,
       ctc_lpa, application_deadline, drive_date]
    );
    return successResponse(res, result.rows[0], 'Drive created', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to create drive', 500);
  }
};

// GET applicants for a drive
const getDriveApplicants = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.email,
              a.status as application_status, a.applied_at,
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
    return errorResponse(res, 'Failed to get applicants', 500);
  }
};
// ADD THIS FUNCTION to drive.controller.js, and add 'updateDrive' to the module.exports

const updateDrive = async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter not found', 404);

    const { title, description, required_skills, min_cgpa, allowed_branches,
            max_backlogs, ctc_lpa, application_deadline, drive_date, status } = req.body;

    const result = await pool.query(
      `UPDATE job_drives SET
        title                = COALESCE($1,  title),
        description          = COALESCE($2,  description),
        required_skills      = COALESCE($3,  required_skills),
        min_cgpa             = COALESCE($4,  min_cgpa),
        allowed_branches     = COALESCE($5,  allowed_branches),
        max_backlogs         = COALESCE($6,  max_backlogs),
        ctc_lpa              = COALESCE($7,  ctc_lpa),
        application_deadline = COALESCE($8,  application_deadline),
        drive_date           = COALESCE($9,  drive_date),
        status               = COALESCE($10, status)
       WHERE id = $11 AND recruiter_id = $12
       RETURNING *`,
      [
        title,
        description,
        required_skills ? JSON.stringify(required_skills) : null,
        min_cgpa,
        allowed_branches ? JSON.stringify(allowed_branches) : null,
        max_backlogs,
        ctc_lpa,
        application_deadline,
        drive_date,
        status,
        req.params.id,
        recruiter.id,
      ]
    );
    if (!result.rows[0]) return errorResponse(res, 'Drive not found', 404);
    return successResponse(res, result.rows[0], 'Drive updated');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update drive', 500);
  }
};
module.exports = { getEligibleDrives, getDrive, applyToDrive, getMyDrives, createDrive, getDriveApplicants, updateDrive };