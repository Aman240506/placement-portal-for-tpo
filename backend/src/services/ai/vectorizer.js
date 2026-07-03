/**
 * Vectorizer — converts skill arrays into TF-IDF weighted numeric vectors.
 *
 * For our use case (skill matching), TF is always 1 (skill present or not),
 * so this is effectively a TF-IDF weighted binary vector where rare skills
 * carry more weight than common ones.
 *
 * IDF is computed across the master skill list corpus size (constant),
 * so vectors from different calls are always comparable.
 */

const { MASTER_SKILLS } = require('./skillExtractor');

// Build a stable index: skill name → position in vector
const SKILL_INDEX = new Map();
MASTER_SKILLS.forEach((skill, i) => SKILL_INDEX.set(skill.toLowerCase(), i));

const VECTOR_SIZE = MASTER_SKILLS.length;

// Pre-computed IDF weights.
// Since we don't have a real corpus, we assign IDF based on skill commonality:
//   - Very common skills (React, Python, Git) → lower weight (IDF ~1.0)
//   - Niche skills (Solidity, Splunk, spaCy)  → higher weight (IDF ~2.5)
// In Phase 5 upgrade, these can be recomputed from actual job_drives data.
const COMMON_SKILLS = new Set([
  'python', 'java', 'javascript', 'c', 'c++', 'html', 'css', 'sql',
  'git', 'github', 'linux', 'react', 'node.js', 'rest apis', 'mysql',
  'data structures', 'algorithms', 'oop', 'agile',
]);

const getIDF = (skill) => COMMON_SKILLS.has(skill.toLowerCase()) ? 1.0 : 1.8;

/**
 * Converts an array of skill strings into a TF-IDF weighted vector.
 * @param {string[]} skills - e.g. ['React', 'Node.js', 'PostgreSQL']
 * @returns {number[]} - sparse vector of length VECTOR_SIZE
 */
const skillsToVector = (skills) => {
  const vector = new Array(VECTOR_SIZE).fill(0);

  skills.forEach(skill => {
    const key = skill.toLowerCase();
    const idx = SKILL_INDEX.get(key);
    if (idx !== undefined) {
      // TF = 1 (present), IDF = weight based on commonality
      vector[idx] = 1 * getIDF(skill);
    }
  });

  return vector;
};

/**
 * Returns the magnitude (L2 norm) of a vector.
 */
const magnitude = (vector) => {
  const sumOfSquares = vector.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumOfSquares);
};

module.exports = { skillsToVector, magnitude, VECTOR_SIZE };