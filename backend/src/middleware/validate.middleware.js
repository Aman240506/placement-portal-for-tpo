// REPLACE the existing uploadResume function in student.controller.js with this.
// Also add these two requires at the TOP of student.controller.js:
//
//   const { parseResumeFromUrl } = require('../services/ai/resumeParser');
//   const { extractSkills }      = require('../services/ai/skillExtractor');

const uploadResume = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    // ── 1. Upload PDF to Cloudinary ────────────────────────────────────────
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'resumes', format: 'pdf' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer);
    });

    // ── 2. Deactivate old resumes ──────────────────────────────────────────
    await pool.query(
      `UPDATE resumes SET is_active = false WHERE student_id = $1`,
      [student.id]
    );

    // ── 3. Save new resume record ──────────────────────────────────────────
    const resume = await pool.query(
      `INSERT INTO resumes (student_id, file_url, file_name, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [student.id, uploadResult.secure_url, req.file.originalname]
    );

    // ── 4. AI Pipeline: parse → extract → store skills ────────────────────
    // Run async — don't block the response. Student sees upload success immediately.
    setImmediate(async () => {
      try {
        // Parse PDF text from Cloudinary URL
        const rawText = await parseResumeFromUrl(uploadResult.secure_url);

        // Extract skills using NLP
        const extractedSkills = extractSkills(rawText);

        if (extractedSkills.length > 0) {
          // Upsert each skill into the skills master table, then student_skills
          for (const skillName of extractedSkills) {
            // Ensure skill exists in master skills table
            const skillRes = await pool.query(
              `INSERT INTO skills (name)
               VALUES ($1)
               ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [skillName]
            );
            const skillId = skillRes.rows[0].id;

            // Link skill to student (ignore if already exists)
            await pool.query(
              `INSERT INTO student_skills (student_id, skill_id)
               VALUES ($1, $2)
               ON CONFLICT (student_id, skill_id) DO NOTHING`,
              [student.id, skillId]
            );
          }

          // Update resume with parsed text snapshot
          await pool.query(
            `UPDATE resumes SET parsed_text = $1 WHERE id = $2`,
            [rawText.slice(0, 10000), resume.rows[0].id] // store first 10k chars
          );

          console.log(`[AI] Extracted ${extractedSkills.length} skills for student ${student.id}`);
        }
      } catch (aiErr) {
        // AI failure must never break the upload success response
        console.error('[AI] Skill extraction failed:', aiErr.message);
      }
    });

    // ── 5. Return success immediately (AI runs in background) ─────────────
    return successResponse(res, resume.rows[0], 'Resume uploaded successfully', 201);

  } catch (err) {
    console.error('Resume upload error:', err);
    return errorResponse(res, 'Failed to upload resume', 500);
  }
};