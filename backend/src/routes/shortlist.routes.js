const express  = require('express');
const router   = express.Router();
const pool     = require('../config/db');
const { protect, authorize }             = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findRecruiterByUserId }          = require('../models/recruiter.model');
const { normalizeSkills }                = require('../services/ai/skillExtractor');
const { computeMatchScore }             = require('../services/ai/matcher');

// POST /api/drives/:id/shortlist — AI shortlisting
router.post('/:id/shortlist', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiter = await findRecruiterByUserId(req.user.id);
    if (!recruiter) return errorResponse(res, 'Recruiter not found', 404);

    const driveRes = await pool.query(
      `SELECT * FROM job_drives WHERE id = $1 AND recruiter_id = $2`,
      [req.params.id, recruiter.id]
    );
    if (!driveRes.rows[0]) return errorResponse(res, 'Drive not found', 404);

    const drive          = driveRes.rows[0];
    const requiredSkills = drive.required_skills || [];

    const applicantsRes = await pool.query(
      `SELECT s.*,
              u.id as user_id_ref,
              COALESCE(
                (SELECT jsonb_agg(sk.name)
                 FROM student_skills ss
                 JOIN skills sk ON ss.skill_id = sk.id
                 WHERE ss.student_id = s.id),
                '[]'::jsonb
              ) as stored_skills
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE a.drive_id = $1`,
      [req.params.id]
    );

    const applicants = applicantsRes.rows;
    if (applicants.length === 0) return errorResponse(res, 'No applicants', 400);

    const results = [];
    for (const student of applicants) {
      const studentSkills = normalizeSkills(student.stored_skills || []);
      const score         = computeMatchScore(student, studentSkills, requiredSkills);
      results.push({
        student_id:     student.id,
        user_id:        student.user_id,
        match_score:    score.finalScore,
        matched_skills: score.matchedSkills,
        missing_skills: score.missingSkills,
      });
    }

    results.sort((a, b) => b.match_score - a.match_score);

    // Save shortlists and notify students via WebSocket
    const notifyUser = req.app.get('notifyUser');

    for (let i = 0; i < results.length; i++) {
      const { student_id, user_id, match_score, matched_skills, missing_skills } = results[i];
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

      // 🔴 Real-time notification to student
      if (notifyUser) {
        notifyUser(user_id, 'shortlisted', {
          type:        'shortlisted',
          drive_id:    req.params.id,
          drive_title: drive.title,
          company:     drive.company_name || 'A company',
          match_score,
          rank:        i + 1,
          message:     `You've been shortlisted for ${drive.title}! Your AI match score is ${match_score}%`,
        });
      }
    }

    return successResponse(res, { shortlisted: results.length, results }, 'Shortlisting complete');
  } catch (err) {
    console.error('Shortlist error:', err);
    return errorResponse(res, 'Shortlisting failed', 500);
  }
});

// PUT /api/drives/:id/applicants/:studentId — update status + notify + sync shortlist
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

    // Sync shortlist status
    if (status === 'selected') {
      await pool.query(
        `UPDATE shortlists SET status = 'confirmed'
         WHERE drive_id = $1 AND student_id = $2`,
        [req.params.id, req.params.studentId]
      );
    } else if (status === 'rejected') {
      await pool.query(
        `UPDATE shortlists SET status = 'rejected'
         WHERE drive_id = $1 AND student_id = $2`,
        [req.params.id, req.params.studentId]
      );
    }

    // Get drive info + student user_id for notification
    const infoRes = await pool.query(
      `SELECT jd.title, jd.id as drive_id, s.user_id, c.name as company_name
       FROM job_drives jd
       JOIN companies c ON c.id = jd.company_id
       JOIN students s ON s.id = $2
       WHERE jd.id = $1`,
      [req.params.id, req.params.studentId]
    );

    // 🔴 Real-time notification to student
    const notifyUser = req.app.get('notifyUser');
    if (notifyUser && infoRes.rows[0]) {
      const info = infoRes.rows[0];
      const messages = {
        shortlisted: `🎉 You've been shortlisted for ${info.title} at ${info.company_name}!`,
        selected:    `🏆 Congratulations! You've been SELECTED for ${info.title} at ${info.company_name}!`,
        rejected:    `Your application for ${info.title} was not shortlisted this time.`,
        applied:     `Your application status was updated for ${info.title}.`,
      };
      notifyUser(info.user_id, 'application_update', {
        type:        status,
        drive_id:    req.params.id,
        drive_title: info.title,
        company:     info.company_name,
        message:     messages[status],
      });
    }

    return successResponse(res, result.rows[0], 'Status updated');
  } catch (err) {
    console.error('Update status error:', err);
    return errorResponse(res, 'Failed to update status', 500);
  }
});

module.exports = router;