const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId } = require('../models/student.model');

const getProfile = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Profile not found', 404);
    return successResponse(res, student);
  } catch (err) {
    return errorResponse(res, 'Failed to get profile', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, branch, year, cgpa, backlogs, linkedin_url, github_url, roll_number } = req.body;
    const result = await pool.query(
      `UPDATE students SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        branch = COALESCE($3, branch),
        year = COALESCE($4, year),
        cgpa = COALESCE($5, cgpa),
        backlogs = COALESCE($6, backlogs),
        linkedin_url = COALESCE($7, linkedin_url),
        github_url = COALESCE($8, github_url),
        roll_number = COALESCE($9, roll_number),
        updated_at = NOW()
       WHERE user_id = $10 RETURNING *`,
      [full_name, phone, branch, year, cgpa, backlogs, linkedin_url, github_url, roll_number, req.user.id]
    );
    return successResponse(res, result.rows[0], 'Profile updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'resumes', format: 'pdf' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer);
    });

    // Deactivate old resumes
    await pool.query(`UPDATE resumes SET is_active = false WHERE student_id = $1`, [student.id]);

    // Save new resume
    const resume = await pool.query(
      `INSERT INTO resumes (student_id, file_url, file_name, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [student.id, uploadResult.secure_url, req.file.originalname]
    );

    return successResponse(res, resume.rows[0], 'Resume uploaded successfully', 201);
  } catch (err) {
    console.error('Resume upload error:', err);
    return errorResponse(res, 'Failed to upload resume', 500);
  }
};

const getResume = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);
    const result = await pool.query(
      `SELECT * FROM resumes WHERE student_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    );
    return successResponse(res, result.rows[0] || null);
  } catch (err) {
    return errorResponse(res, 'Failed to get resume', 500);
  }
};

const getApplications = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);
    const result = await pool.query(
      `SELECT a.*, jd.title as drive_title, c.name as company_name,
              s.match_score
       FROM applications a
       JOIN job_drives jd ON a.drive_id = jd.id
       JOIN companies c ON jd.company_id = c.id
       LEFT JOIN shortlists s ON s.student_id = a.student_id AND s.drive_id = a.drive_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get applications', 500);
  }
};

module.exports = { getProfile, updateProfile, uploadResume, getResume, getApplications };