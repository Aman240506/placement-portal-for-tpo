const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorize } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findRecruiterByUserId } = require('../models/recruiter.model');

// POST /api/drives/:id/shortlist  — trigger AI shortlisting for a drive
// (AI engine in Phase 5 will replace the placeholder scoring below)
router.post('/:id/shortlist', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter not found', 404);

    // Verify drive belongs to this recruiter
    const driveRes = await pool.query(
      `SELECT * FROM job_drives WHERE id = $1 AND recruiter_id = $2`,
      [req.params.id, recruiter.id]
    );
    if (!driveRes.rows[0]) return errorResponse(res, 'Drive not found', 404);
    const drive = driveRes.rows[0];

    // Get all applicants with their resumes and skills
    const applicantsRes = await pool.query(
      `SELECT s.*, u.email,
              r.file_url as resume_url,
              COALESCE(
                (SELECT jsonb_agg(sk.name)
                 FROM student_skills ss
                 JOIN skills sk ON ss.skill_id = sk.id
                 WHERE ss.student_id = s.id),
                '[]'::jsonb
              ) as skills
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN resumes r ON r.student_id = s.id AND r.is_active = true
       WHERE a.drive_id = $1`,
      [req.params.id]
    );

    const applicants   = applicantsRes.rows;
    if (applicants.length === 0) return errorResponse(res, 'No applicants to shortlist', 400);

    const requiredSkills = drive.required_skills || [];

    // Score each applicant
    const scored = applicants.map(student => {
      const studentSkills = (student.skills || []).map(s => s.toLowerCase());
      const reqSkills     = requiredSkills.map(s => s.toLowerCase());

      const matched = reqSkills.filter(s => studentSkills.includes(s));
      const missing = reqSkills.filter(s => !studentSkills.includes(s));

      const skillMatch    = reqSkills.length > 0 ? (matched.length / reqSkills.length) * 100 : 50;
      const cgpaFactor    = student.cgpa ? (parseFloat(student.cgpa) / 10) * 100 : 0;
      const completeness  = [student.full_name, student.phone, student.roll_number,
                             student.cgpa, student.branch, student.linkedin_url, student.resume_url]
                              .filter(Boolean).length / 7 * 100;

      const finalScore = (skillMatch * 0.70) + (cgpaFactor * 0.20) + (completeness * 0.10);

      return {
        student_id:     student.id,
        match_score:    Math.round(finalScore * 100) / 100,
        matched_skills: requiredSkills.filter(s => studentSkills.includes(s.toLowerCase())),
        missing_skills: requiredSkills.filter(s => !studentSkills.includes(s.toLowerCase())),
      };
    });

    // Sort by score descending and assign ranks
    scored.sort((a, b) => b.match_score - a.match_score);

    // Upsert shortlist rows
    for (let i = 0; i < scored.length; i++) {
      const { student_id, match_score, matched_skills, missing_skills } = scored[i];
      await pool.query(
        `INSERT INTO shortlists (drive_id, student_id, match_score, matched_skills, missing_skills, rank)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (drive_id, student_id)
         DO UPDATE SET
           match_score    = EXCLUDED.match_score,
           matched_skills = EXCLUDED.matched_skills,
           missing_skills = EXCLUDED.missing_skills,
           rank           = EXCLUDED.rank,
           created_at     = NOW()`,
        [req.params.id, student_id, match_score,
         JSON.stringify(matched_skills), JSON.stringify(missing_skills), i + 1]
      );
    }

    return successResponse(res, { shortlisted: scored.length, results: scored }, 'Shortlisting complete');
  } catch (err) {
    console.error('Shortlist error:', err);
    return errorResponse(res, 'Shortlisting failed', 500);
  }
});

// PUT /api/drives/:id/applicants/:studentId  — update application status
router.put('/:id/applicants/:studentId', protect, authorize('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['applied', 'shortlisted', 'selected', 'rejected'];
    if (!allowed.includes(status)) return errorResponse(res, 'Invalid status', 400);

    // Get student id from the studentId param (this is student.id not user.id)
    const result = await pool.query(
      `UPDATE applications SET status = $1
       WHERE drive_id = $2 AND student_id = $3
       RETURNING *`,
      [status, req.params.id, req.params.studentId]
    );
    if (!result.rows[0]) return errorResponse(res, 'Application not found', 404);
    return successResponse(res, result.rows[0], 'Status updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update status', 500);
  }
});

module.exports = router;