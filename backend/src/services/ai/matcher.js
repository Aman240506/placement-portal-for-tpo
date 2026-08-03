const { skillsToVector, magnitude } = require('./vectorizer');

/**
 * Cosine similarity between two skill vectors.
 * Returns 0–1.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) dot += vecA[i] * vecB[i];
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

/**
 * Computes weighted match score for a student against a job drive.
 *
 * Formula (from docs):
 *   Final = (Skill Match × 0.70) + (CGPA Factor × 0.20) + (Completeness × 0.10)
 *
 * With Gemini integration, studentSkills are now high-quality normalized
 * skills extracted by AI — so skill match accuracy is much better.
 *
 * @param {object}   student       - student DB row
 * @param {string[]} studentSkills - Gemini-extracted + normalized skills
 * @param {string[]} requiredSkills - job_drives.required_skills array
 */
const computeMatchScore = (student, studentSkills, requiredSkills) => {
  // ── Skill match ────────────────────────────────────────────────────────
  let skillMatch = 0;

  if (requiredSkills.length === 0) {
    skillMatch = 50; // no requirements = neutral score
  } else if (studentSkills.length === 0) {
    skillMatch = 0;  // no skills extracted yet
  } else {
    // Cosine similarity via TF-IDF vectors
    const studentVec = skillsToVector(studentSkills);
    const jobVec     = skillsToVector(requiredSkills);
    const cosine     = cosineSimilarity(studentVec, jobVec);

    // Also do direct overlap as a secondary signal
    // (catches skills not in master list but matching directly)
    const studentLower  = studentSkills.map(s => s.toLowerCase());
    const requiredLower = requiredSkills.map(s => s.toLowerCase());
    const directMatches = requiredLower.filter(s => studentLower.includes(s)).length;
    const directScore   = (directMatches / requiredSkills.length) * 100;

    // Blend cosine + direct overlap (70/30)
    skillMatch = (cosine * 100 * 0.70) + (directScore * 0.30);
  }

  // ── CGPA factor ────────────────────────────────────────────────────────
  const cgpa       = parseFloat(student.cgpa) || 0;
  const cgpaFactor = (cgpa / 10) * 100;

  // ── Profile completeness ───────────────────────────────────────────────
  const fields = [
    student.full_name,
    student.phone,
    student.roll_number,
    student.cgpa,
    student.branch,
    student.linkedin_url,
    student.github_url,
  ];
  const completeness = (fields.filter(Boolean).length / fields.length) * 100;

  // ── Final weighted score ───────────────────────────────────────────────
  const finalScore =
    (skillMatch  * 0.70) +
    (cgpaFactor  * 0.20) +
    (completeness * 0.10);

  // ── Which skills matched / missing ────────────────────────────────────
  const studentLower  = studentSkills.map(s => s.toLowerCase());
  const matchedSkills = requiredSkills.filter(s => studentLower.includes(s.toLowerCase()));
  const missingSkills = requiredSkills.filter(s => !studentLower.includes(s.toLowerCase()));

  return {
    finalScore:    Math.round(finalScore    * 100) / 100,
    skillMatch:    Math.round(skillMatch    * 100) / 100,
    cgpaFactor:    Math.round(cgpaFactor    * 100) / 100,
    completeness:  Math.round(completeness  * 100) / 100,
    matchedSkills,
    missingSkills,
  };
};

module.exports = { computeMatchScore, cosineSimilarity };