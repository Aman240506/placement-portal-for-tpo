const pool       = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId } = require('../models/student.model');
const { parseResumeWithGemini } = require('../services/ai/resumeParser');
const { normalizeSkills }       = require('../services/ai/skillExtractor');

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

    // 1. Upload to Cloudinary as PUBLIC so Gemini can fetch it
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',  // PDFs must be resource_type raw
          type: 'upload',        // 'upload' = public URL, not authenticated
          folder: 'resumes',
          access_mode: 'public', // explicitly public
        },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer);
    });

    console.log('[Upload] Cloudinary URL:', uploadResult.secure_url);

    // 2. Deactivate old resumes
    await pool.query(
      `UPDATE resumes SET is_active = false WHERE student_id = $1`,
      [student.id]
    );

    // 3. Save resume record
    const resume = await pool.query(
      `INSERT INTO resumes (student_id, file_url, file_name, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [student.id, uploadResult.secure_url, req.file.originalname]
    );

    // 4. Respond immediately
    res.status(201).json({
      success: true,
      message: 'Resume uploaded! AI is extracting your skills in the background...',
      data: resume.rows[0],
    });

    // 5. Gemini AI pipeline in background
    setImmediate(async () => {
      try {
        console.log(`[Gemini] Starting resume analysis for student ${student.id}...`);
        console.log(`[Gemini] Fetching PDF from: ${uploadResult.secure_url}`);

        const parsed = await parseResumeWithGemini(uploadResult.secure_url);

        if (parsed.error) {
          console.error('[Gemini] Parse error:', parsed.error);
          return;
        }

        console.log(`[Gemini] Raw skills from AI:`, parsed.skills);
        const normalizedSkills = normalizeSkills(parsed.skills || []);
        console.log(`[Gemini] Normalized skills (${normalizedSkills.length}):`, normalizedSkills);

        // Save parsed text
        if (parsed.raw_text) {
          await pool.query(
            `UPDATE resumes SET parsed_text = $1 WHERE id = $2`,
            [parsed.raw_text.slice(0, 10000), resume.rows[0].id]
          );
        }

        // Clear old skills
        await pool.query(
          `DELETE FROM student_skills WHERE student_id = $1`,
          [student.id]
        );

        // Save new skills
        for (const skillName of normalizedSkills) {
          const skillRes = await pool.query(
            `INSERT INTO skills (name)
             VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [skillName]
          );
          await pool.query(
            `INSERT INTO student_skills (student_id, skill_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, skill_id) DO NOTHING`,
            [student.id, skillRes.rows[0].id]
          );
        }

        // Auto-fill name if not set
        if (parsed.full_name && !student.full_name) {
          await pool.query(
            `UPDATE students SET full_name = $1 WHERE id = $2`,
            [parsed.full_name, student.id]
          );
        }

        console.log(`[Gemini] ✅ Done — saved ${normalizedSkills.length} skills for student ${student.id}`);
      } catch (aiErr) {
        console.error('[Gemini] Pipeline error:', aiErr.message);
      }
    });

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
      `SELECT * FROM resumes WHERE student_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
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
    return errorResponse(res, 'Failed to get applications', 500);
  }
};

const getSkills = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);
    const result = await pool.query(
      `SELECT sk.name FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       WHERE ss.student_id = $1
       ORDER BY sk.name`,
      [student.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get skills', 500);
  }
};

const getATSScore = async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const resumeRes = await pool.query(
      `SELECT * FROM resumes WHERE student_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    );
    if (!resumeRes.rows[0]) return errorResponse(res, 'No resume uploaded', 404);

    const resume = resumeRes.rows[0];
    let text = resume.parsed_text || '';

    if (!text && resume.file_url) {
      try {
        const parsed = await parseResumeWithGemini(resume.file_url);
        text = parsed.raw_text || '';
      } catch { text = ''; }
    }

    const lower = text.toLowerCase();

    const sections = {
      contact:    /email|phone|mobile|linkedin|github/.test(lower),
      education:  /education|university|college|degree|b\.tech|cgpa|gpa/.test(lower),
      experience: /experience|internship|worked|employment/.test(lower),
      skills:     /skills|technologies|tech stack/.test(lower),
      projects:   /project|built|developed|created/.test(lower),
      summary:    /summary|objective|about|profile/.test(lower),
    };

    const sectionScore = (Object.values(sections).filter(Boolean).length / 6) * 100;
    const skillsRes    = await pool.query(
      `SELECT COUNT(*) FROM student_skills WHERE student_id = $1`, [student.id]
    );
    const skillCount   = parseInt(skillsRes.rows[0].count);
    const keywordScore = Math.min(skillCount * 4, 100);
    const wordCount    = text.split(/\s+/).filter(Boolean).length;
    const lengthScore  = wordCount < 150 ? 30 : wordCount < 300 ? 55 : wordCount <= 900 ? 100 : 70;
    const profileFields = [student.full_name, student.phone, student.roll_number,
                           student.cgpa, student.branch, student.linkedin_url, student.github_url];
    const profileScore = (profileFields.filter(Boolean).length / 7) * 100;
    const atsScore     = Math.round(
      (sectionScore * 0.35) + (keywordScore * 0.30) +
      (lengthScore  * 0.20) + (profileScore * 0.15)
    );

    const tips = [];
    if (!sections.summary)     tips.push({ type: 'warning', text: 'Add a professional summary at the top.' });
    if (!sections.experience)  tips.push({ type: 'warning', text: 'Add internship or work experience.' });
    if (!sections.projects)    tips.push({ type: 'warning', text: 'Add a projects section with tech stack.' });
    if (!sections.skills)      tips.push({ type: 'warning', text: 'Add a dedicated Skills section.' });
    if (skillCount < 8)        tips.push({ type: 'tip', text: 'List more skills — aim for 10-15.' });
    if (wordCount < 300)       tips.push({ type: 'tip', text: 'Resume is too short. Expand descriptions.' });
    if (!student.linkedin_url) tips.push({ type: 'tip', text: 'Add your LinkedIn URL to your profile.' });
    if (!student.github_url)   tips.push({ type: 'tip', text: 'Add your GitHub URL to your profile.' });
    if (atsScore >= 80)        tips.push({ type: 'success', text: 'Strong resume! Keep applying.' });

    return successResponse(res, {
      ats_score: atsScore,
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
    console.error('ATS check error:', err);
    return errorResponse(res, 'ATS check failed', 500);
  }
};

module.exports = {
  getProfile, updateProfile, uploadResume,
  getResume, getApplications, getSkills, getATSScore,
};
