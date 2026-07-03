const express  = require('express');
const router   = express.Router();
const pool     = require('../config/db');
const { protect, authorize }      = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findRecruiterByUserId }   = require('../models/recruiter.model');
const { extractSkills }           = require('../services/ai/skillExtractor');
const { computeMatchScore }       = require('../services/ai/matcher');
const { parseResumeFromUrl }      = require('../services/ai/resumeParser');

// POST /api/drives/:id/shortlist  — run full AI shortlisting for a drive
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
    const requiredSkills = drive.required_skills || [];

    // Get all applicants with their active resume URLs and pre-extracted skills
    const applicantsRes = await pool.query(
      `SELECT s.*,
              r.file_url  as resume_url,
              r.parsed_text,
              COALESCE(
                (SELECT jsonb_agg(sk.name)
                 FROM student_skills ss
                 JOIN skills sk ON ss.skill_id = sk.id
                 WHERE ss.student_id = s.id),
                '[]'::jsonb
              ) as stored_skills
       FROM applications a
       JOIN students s ON a.student_id = s.id
       LEFT JOIN resumes r ON r.student_id = s.id AND r.is_active = true
       WHERE a.drive_id = $1`,
      [req.params.id]
    );

    const applicants = applicantsRes.rows;
    if (applicants.length === 0) return errorResponse(res, 'No applicants to shortlist', 400);

    const results = [];

    for (const student of applicants) {
      // Use stored skills if available, else try parsing resume on-demand
      let studentSkills = student.stored_skills || [];

      if (studentSkills.length === 0 && student.resume_url) {
        try {
          const text    = student.parsed_text || await parseResumeFromUrl(student.resume_url);
          studentSkills = extractSkills(text);
        } catch {
          studentSkills = [];
        }
      }

      const score = computeMatchScore(student, studentSkills, requiredSkills);

      results.push({
        student_id:     student.id,
        match_score:    score.finalScore,
        matched_skills: score.matchedSkills,
        missing_skills: score.missingSkills,
      });
    }

    // Sort descending by score, assign rank
    results.sort((a, b) => b.match_score - a.match_score);

    // Upsert shortlist rows
    for (let i = 0; i < results.length; i++) {
      const { student_id, match_score, matched_skills, missing_skills } = results[i];
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

    return successResponse(res, { shortlisted: results.length, results }, 'Shortlisting complete');
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