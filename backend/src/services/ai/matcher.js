const { skillsToVector, magnitude } = require('./vectorizer');

/**
 * Computes cosine similarity between two skill vectors.
 * Returns a value between 0 and 1.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  const magA = magnitude(vecA);
  const magB = magnitude(vecB);

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};

/**
 * Computes the final weighted match score for a student against a job drive.
 *
 * Formula (from documentation):
 *   Final Score = (Skill Match × 0.70) + (CGPA Factor × 0.20) + (Completeness × 0.10)
 *
 * @param {object} student - student row from DB (cgpa, branch, phone, etc.)
 * @param {string[]} studentSkills - skills extracted from resume
 * @param {string[]} requiredSkills - skills from job_drives.required_skills
 * @returns {object} - { finalScore, skillMatch, matchedSkills, missingSkills }
 */
const computeMatchScore = (student, studentSkills, requiredSkills) => {
  // ── Skill match via cosine similarity ─────────────────────────────────────
  const studentVec = skillsToVector(studentSkills);
  const jobVec     = skillsToVector(requiredSkills);
  const similarity = cosineSimilarity(studentVec, jobVec);
  const skillMatch = similarity * 100; // 0–100

  // ── CGPA factor ────────────────────────────────────────────────────────────
  const maxCGPA   = 10;
  const cgpa      = parseFloat(student.cgpa) || 0;
  const cgpaFactor = (cgpa / maxCGPA) * 100; // 0–100

  // ── Profile completeness ───────────────────────────────────────────────────
  const fields = [
    student.full_name,
    student.phone,
    student.roll_number,
    student.cgpa,
    student.branch,
    student.linkedin_url,
    student.github_url,
  ];
  const filledFields  = fields.filter(Boolean).length;
  const completeness  = (filledFields / fields.length) * 100; // 0–100

  // ── Weighted final score ───────────────────────────────────────────────────
  const finalScore = (skillMatch * 0.70) + (cgpaFactor * 0.20) + (completeness * 0.10);

  // ── Which skills matched / are missing ────────────────────────────────────
  const studentSkillsLower  = studentSkills.map(s => s.toLowerCase());
  const matchedSkills = requiredSkills.filter(s => studentSkillsLower.includes(s.toLowerCase()));
  const missingSkills = requiredSkills.filter(s => !studentSkillsLower.includes(s.toLowerCase()));

  return {
    finalScore:    Math.round(finalScore * 100) / 100, // 2 decimal places
    skillMatch:    Math.round(skillMatch * 100) / 100,
    cgpaFactor:    Math.round(cgpaFactor * 100) / 100,
    completeness:  Math.round(completeness * 100) / 100,
    matchedSkills,
    missingSkills,
  };
};

module.exports = { computeMatchScore, cosineSimilarity };