const express = require('express');
const router  = express.Router();
const https   = require('https');
const pool    = require('../config/db');
const { protect, authorize }             = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { findStudentByUserId }            = require('../models/student.model');

// ── Call Groq ──────────────────────────────────────────────────────────────
const callGroq = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return reject(new Error('GROQ_API_KEY not set'));

    const body = JSON.stringify({
      model:       'qwen/qwen3.8-27b',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  2048,
      response_format: { type: 'json_object' },
    });

    const options = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            return reject(new Error(parsed?.error?.message || `HTTP ${res.statusCode}`));
          }
          const content = parsed?.choices?.[0]?.message?.content;
          if (!content) return reject(new Error('Empty response'));
          resolve(JSON.parse(content));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
};

// ── POST /api/interview/prep ───────────────────────────────────────────────
// Generate personalised interview prep for a student for a specific drive
router.post('/prep', protect, authorize('student'), async (req, res) => {
  try {
    const { drive_id } = req.body;
    if (!drive_id) return errorResponse(res, 'drive_id required', 400);

    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    // Get drive details
    const driveRes = await pool.query(
      `SELECT jd.*, c.name as company_name, c.domain as company_domain
       FROM job_drives jd
       JOIN companies c ON jd.company_id = c.id
       WHERE jd.id = $1`,
      [drive_id]
    );
    if (!driveRes.rows[0]) return errorResponse(res, 'Drive not found', 404);
    const drive = driveRes.rows[0];

    // Get student's skills
    const skillsRes = await pool.query(
      `SELECT sk.name FROM student_skills ss
       JOIN skills sk ON ss.skill_id = sk.id
       WHERE ss.student_id = $1`,
      [student.id]
    );
    const studentSkills  = skillsRes.rows.map(r => r.name);
    const requiredSkills = drive.required_skills || [];

    const matchedSkills = requiredSkills.filter(s =>
      studentSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
    );
    const missingSkills = requiredSkills.filter(s =>
      !studentSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
    );

    const prompt = `You are an expert technical interview coach for Indian software engineering placements.

A student is preparing for a campus placement interview. Generate a comprehensive interview preparation guide.

STUDENT PROFILE:
- Name: ${student.full_name || 'Student'}
- Branch: ${student.branch}
- CGPA: ${student.cgpa}
- Skills they have: ${studentSkills.join(', ') || 'Not specified'}

JOB DETAILS:
- Company: ${drive.company_name}
- Role: ${drive.title}
- Required skills: ${requiredSkills.join(', ')}
- CTC: ${drive.ctc_lpa ? drive.ctc_lpa + ' LPA' : 'Not specified'}
- Job description: ${drive.description ? drive.description.slice(0, 500) : 'Not provided'}

SKILL GAP ANALYSIS:
- Skills student HAS: ${matchedSkills.join(', ') || 'None matched'}
- Skills student is MISSING: ${missingSkills.join(', ') || 'None'}

Generate a JSON response with this exact structure:
{
  "overall_readiness": 75,
  "readiness_label": "Good",
  "company_overview": "2-3 sentences about the company and what they look for",
  "technical_questions": [
    {
      "question": "question text",
      "topic": "topic name",
      "difficulty": "Easy|Medium|Hard",
      "why_asked": "why this company asks this",
      "hint": "approach hint"
    }
  ],
  "missing_skills_plan": [
    {
      "skill": "skill name",
      "priority": "High|Medium|Low",
      "what_to_study": "specific topics to cover",
      "time_needed": "2 days",
      "resource": "specific resource recommendation"
    }
  ],
  "hr_questions": [
    {"question": "HR question", "how_to_answer": "guidance"}
  ],
  "day_wise_plan": [
    {"day": "Day 1", "focus": "topic", "tasks": ["task1", "task2"]}
  ],
  "pro_tips": ["tip1", "tip2", "tip3"],
  "confidence_boosters": ["thing they already know well"]
}

Rules:
- Generate exactly 8-10 technical questions specific to the role and company
- Focus heavily on the required skills
- day_wise_plan should be 5 days
- Make questions realistic for Indian campus placements at this company
- Be specific, not generic`;

    console.log(`[Interview] Generating prep for ${student.full_name} → ${drive.company_name}`);
    const result = await callGroq(prompt);

    // Cache result in DB to avoid repeated API calls
    await pool.query(
      `INSERT INTO interview_prep (student_id, drive_id, prep_data, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (student_id, drive_id)
       DO UPDATE SET prep_data = $3, created_at = NOW()`,
      [student.id, drive_id, JSON.stringify(result)]
    ).catch(() => {}); // ignore if table doesn't exist yet

    return successResponse(res, {
      ...result,
      meta: {
        student_name:   student.full_name,
        company:        drive.company_name,
        role:           drive.title,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        student_skills: studentSkills,
      },
    });

  } catch (err) {
    console.error('[Interview] Error:', err.message);
    return errorResponse(res, `Interview prep failed: ${err.message}`, 500);
  }
});

// ── GET /api/interview/prep/:driveId ──────────────────────────────────────
// Get cached prep if it exists
router.get('/prep/:driveId', protect, authorize('student'), async (req, res) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const result = await pool.query(
      `SELECT prep_data FROM interview_prep
       WHERE student_id = $1 AND drive_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [student.id, req.params.driveId]
    ).catch(() => ({ rows: [] }));

    if (!result.rows[0]) return successResponse(res, null);
    return successResponse(res, JSON.parse(result.rows[0].prep_data));
  } catch (err) {
    return errorResponse(res, 'Failed to get prep', 500);
  }
});

module.exports = router;