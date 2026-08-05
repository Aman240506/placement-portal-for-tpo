const pool       = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId } = require('../models/student.model');
const { parseResumeWithGemini } = require('../services/ai/resumeParser');
const { normalizeSkills }       = require('../services/ai/skillExtractor');
const logger = require('../utils/logger');

// ── GET PROFILE ────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Profile not found', 404);
    return successResponse(res, student);
  } catch (err) {
    logger.error('getProfile failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get profile', 500);
  }
};

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const {
      full_name, phone, branch, year, cgpa,
      backlogs, linkedin_url, github_url, roll_number,
    } = req.body;

    const result = await pool.query(
      `UPDATE students SET
        full_name    = COALESCE($1, full_name),
        phone        = COALESCE($2, phone),
        branch       = COALESCE($3, branch),
        year         = COALESCE($4, year),
        cgpa         = COALESCE($5, cgpa),
        backlogs     = COALESCE($6, backlogs),
        linkedin_url = COALESCE($7, linkedin_url),
        github_url   = COALESCE($8, github_url),
        roll_number  = COALESCE($9, roll_number),
        updated_at   = NOW()
       WHERE user_id = $10 RETURNING *`,
      [full_name, phone, branch, year, cgpa,
       backlogs, linkedin_url, github_url, roll_number, req.user.id]
    );

    logger.info('Profile updated', { userId: req.user.id });
    return successResponse(res, result.rows[0], 'Profile updated');
  } catch (err) {
    logger.error('updateProfile failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

// ── UPLOAD RESUME ──────────────────────────────────────────────────────────
const RESUME_MAX_SIZE = 5 * 1024 * 1024; // 5MB constant

const uploadResume = async (req, res) => {
  try {
    if (!req.file)                        return errorResponse(res, 'No file uploaded', 400);
    if (req.file.size > RESUME_MAX_SIZE)  return errorResponse(res, 'File must be under 5MB', 400);
    if (req.file.mimetype !== 'application/pdf') return errorResponse(res, 'Only PDF files allowed', 400);

    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', type: 'upload', folder: 'resumes', access_mode: 'public' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer);
    });

    logger.info('Resume uploaded to Cloudinary', {
      studentId: student.id,
      url:       uploadResult.secure_url,
      size:      req.file.size,
    });

    // Deactivate old resumes
    await pool.query(`UPDATE resumes SET is_active = false WHERE student_id = $1`, [student.id]);

    // Save new resume
    const resume = await pool.query(
      `INSERT INTO resumes (student_id, file_url, file_name, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [student.id, uploadResult.secure_url, req.file.originalname]
    );

    // Respond immediately — AI runs in background
    res.status(201).json({
      success: true,
      message: 'Resume uploaded! Skills are being extracted in background...',
      data:    resume.rows[0],
    });

    // Background AI pipeline
    setImmediate(async () => {
      try {
        logger.info('Starting AI resume analysis', { studentId: student.id });
        const parsed          = await parseResumeWithGemini(uploadResult.secure_url);
        const normalizedSkills = normalizeSkills(parsed.skills || []);

        if (parsed.raw_text) {
          await pool.query(
            `UPDATE resumes SET parsed_text = $1 WHERE id = $2`,
            [parsed.raw_text.slice(0, 10000), resume.rows[0].id]
          );
        }

        // Clear old skills and save new ones
        await pool.query(`DELETE FROM student_skills WHERE student_id = $1`, [student.id]);

        for (const skillName of normalizedSkills) {
          const skillRes = await pool.query(
            `INSERT INTO skills (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [skillName]
          );
          await pool.query(
            `INSERT INTO student_skills (student_id, skill_id) VALUES ($1, $2)
             ON CONFLICT (student_id, skill_id) DO NOTHING`,
            [student.id, skillRes.rows[0].id]
          );
        }

        if (parsed.full_name && !student.full_name) {
          await pool.query(
            `UPDATE students SET full_name = $1 WHERE id = $2`,
            [parsed.full_name, student.id]
          );
        }

        logger.info('AI resume analysis complete', {
          studentId:   student.id,
          skillsFound: normalizedSkills.length,
          source:      parsed.source || 'unknown',
        });
      } catch (aiErr) {
        logger.error('AI resume analysis failed', {
          studentId: student.id,
          error:     aiErr.message,
        });
      }
    });

  } catch (err) {
    logger.error('Resume upload failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to upload resume', 500);
  }
};

// ── GET RESUME ─────────────────────────────────────────────────────────────
const getResume = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const result = await pool.query(
      `SELECT * FROM resumes WHERE student_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    );
    return successResponse(res, result.rows[0] || null);
  } catch (err) {
    logger.error('getResume failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get resume', 500);
  }
};

// ── GET APPLICATIONS ───────────────────────────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const result = await pool.query(
      `SELECT a.*, jd.title as drive_title, jd.id as drive_id,
              c.name as company_name,
              sh.match_score, sh.matched_skills, sh.missing_skills
       FROM applications a
       JOIN job_drives jd ON a.drive_id = jd.id
       JOIN companies c ON jd.company_id = c.id
       LEFT JOIN shortlists sh ON sh.student_id = a.student_id
                               AND sh.drive_id = a.drive_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getApplications failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get applications', 500);
  }
};

// ── GET SKILLS ─────────────────────────────────────────────────────────────
const getSkills = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const result = await pool.query(
      `SELECT sk.name FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       WHERE ss.student_id = $1 ORDER BY sk.name`,
      [student.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    logger.error('getSkills failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'Failed to get skills', 500);
  }
};

// ── ATS SCORE ──────────────────────────────────────────────────────────────
const getATSScore = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const resumeRes = await pool.query(
      `SELECT * FROM resumes WHERE student_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    );
    if (!resumeRes.rows[0]) return errorResponse(res, 'No resume uploaded yet', 404);

    const resume = resumeRes.rows[0];
    let text     = resume.parsed_text || '';

    if (!text && resume.file_url) {
      const parsed = await parseResumeWithGemini(resume.file_url).catch(() => ({ raw_text: '' }));
      text = parsed.raw_text || '';
    }

    const lower   = text.toLowerCase();
    const sections = {
      contact:    /email|phone|mobile|linkedin|github/.test(lower),
      education:  /education|university|college|degree|b\.tech|cgpa|gpa/.test(lower),
      experience: /experience|internship|worked|employment/.test(lower),
      skills:     /skills|technologies|tech stack/.test(lower),
      projects:   /project|built|developed|created/.test(lower),
      summary:    /summary|objective|about|profile/.test(lower),
    };

    const sectionScore = (Object.values(sections).filter(Boolean).length / 6) * 100;

    const skillsCountRes = await pool.query(
      `SELECT COUNT(*) FROM student_skills WHERE student_id = $1`, [student.id]
    );
    const skillCount   = parseInt(skillsCountRes.rows[0].count);
    const keywordScore = Math.min(skillCount * 4, 100);
    const wordCount    = text.split(/\s+/).filter(Boolean).length;
    const lengthScore  = wordCount < 150 ? 30 : wordCount < 300 ? 55 : wordCount <= 900 ? 100 : 70;

    const profileFields = [
      student.full_name, student.phone, student.roll_number,
      student.cgpa, student.branch, student.linkedin_url, student.github_url,
    ];
    const profileScore = (profileFields.filter(Boolean).length / profileFields.length) * 100;
    const atsScore     = Math.round(
      (sectionScore * 0.35) + (keywordScore * 0.30) +
      (lengthScore  * 0.20) + (profileScore * 0.15)
    );

    const tips = [];
    if (!sections.summary)     tips.push({ type: 'warning', text: 'Add a professional summary at the top of your resume.' });
    if (!sections.experience)  tips.push({ type: 'warning', text: 'Add internship or work experience section.' });
    if (!sections.projects)    tips.push({ type: 'warning', text: 'Add a projects section with tech stack used.' });
    if (!sections.skills)      tips.push({ type: 'warning', text: 'Add a dedicated Skills section.' });
    if (skillCount < 8)        tips.push({ type: 'tip',     text: 'List more technical skills — aim for 10–15.' });
    if (wordCount < 300)       tips.push({ type: 'tip',     text: 'Resume is too short. Expand project descriptions.' });
    if (!student.linkedin_url) tips.push({ type: 'tip',     text: 'Add your LinkedIn URL to your profile.' });
    if (!student.github_url)   tips.push({ type: 'tip',     text: 'Add your GitHub URL to your profile.' });
    if (atsScore >= 80)        tips.push({ type: 'success', text: 'Strong resume! Keep applying.' });

    logger.info('ATS score computed', { studentId: student.id, atsScore, skillCount });

    return successResponse(res, {
      ats_score:      atsScore,
      section_score:  Math.round(sectionScore),
      keyword_score:  Math.round(keywordScore),
      length_score:   Math.round(lengthScore),
      profile_score:  Math.round(profileScore),
      sections_found: sections,
      skill_count:    skillCount,
      word_count:     wordCount,
      tips,
    });
  } catch (err) {
    logger.error('getATSScore failed', { userId: req.user.id, error: err.message });
    return errorResponse(res, 'ATS check failed', 500);
  }
};

module.exports = {
  getProfile, updateProfile, uploadResume,
  getResume, getApplications, getSkills, getATSScore,
};