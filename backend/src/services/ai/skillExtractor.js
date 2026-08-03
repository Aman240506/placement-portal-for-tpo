/**
 * skillExtractor.js
 * 
 * With Gemini integration, skills come directly from the AI.
 * This module normalizes and validates those skills against
 * our master list, and provides fallback extraction.
 */

const MASTER_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Bash', 'Shell',
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Redux',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'jQuery',
  'Webpack', 'Vite', 'GraphQL', 'REST APIs',
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
  'Laravel', 'Ruby on Rails', 'ASP.NET', 'NestJS',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
  'SQL Server', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase',
  'Elasticsearch', 'SQL',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'Ansible', 'Jenkins', 'GitHub Actions', 'CI/CD', 'Linux', 'Nginx',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'OpenCV',
  'NLP', 'Computer Vision', 'Data Science', 'Jupyter',
  'Hadoop', 'Spark', 'Tableau', 'Power BI',
  'Git', 'GitHub', 'GitLab', 'Jira', 'Postman',
  'Agile', 'Scrum', 'TDD', 'Jest', 'Pytest', 'Selenium', 'Cypress',
  'React Native', 'Flutter', 'Android', 'iOS',
  'Data Structures', 'Algorithms', 'System Design', 'OOP',
  'Design Patterns', 'Networking', 'DBMS', 'Distributed Systems',
  'Web Security', 'OAuth', 'JWT', 'Blockchain', 'Solidity',
  'Figma', 'Adobe XD', 'Unity', 'Three.js',
];

// Build lowercase lookup map
const skillLowerMap = new Map();
MASTER_SKILLS.forEach(skill => skillLowerMap.set(skill.toLowerCase(), skill));

// Common aliases/variations to normalize
const ALIASES = {
  'reactjs': 'React',
  'react.js': 'React',
  'react js': 'React',
  'nodejs': 'Node.js',
  'node js': 'Node.js',
  'expressjs': 'Express.js',
  'express js': 'Express.js',
  'nextjs': 'Next.js',
  'next js': 'Next.js',
  'vuejs': 'Vue',
  'vue.js': 'Vue',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'postgres': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mssql': 'SQL Server',
  'ml': 'Machine Learning',
  'dl': 'Deep Learning',
  'ai': null, // too generic, skip
  'ds': null, // too generic
  'tf': 'TensorFlow',
  'sklearn': 'Scikit-learn',
  'scikit learn': 'Scikit-learn',
  'pytorch': 'PyTorch',
  'keras': 'Keras',
  'gcp': 'GCP',
  'aws': 'AWS',
  'k8s': 'Kubernetes',
  'gh actions': 'GitHub Actions',
  'ci/cd': 'CI/CD',
  'dsa': 'Data Structures',
  'oop': 'OOP',
  'c plus plus': 'C++',
  'cplusplus': 'C++',
  'c sharp': 'C#',
  'csharp': 'C#',
};

/**
 * Normalizes and deduplicates skills from Gemini output.
 * Maps aliases, validates against master list.
 *
 * @param {string[]} rawSkills - skills array from Gemini
 * @returns {string[]} - normalized, deduplicated skill names
 */
const normalizeSkills = (rawSkills) => {
  if (!Array.isArray(rawSkills)) return [];

  const found = new Set();

  rawSkills.forEach(skill => {
    if (!skill || typeof skill !== 'string') return;

    const lower = skill.toLowerCase().trim();

    // Check alias map first
    if (ALIASES[lower] !== undefined) {
      if (ALIASES[lower]) found.add(ALIASES[lower]);
      return;
    }

    // Check master list
    if (skillLowerMap.has(lower)) {
      found.add(skillLowerMap.get(lower));
      return;
    }

    // Check partial match for compound skills
    for (const [key, value] of skillLowerMap) {
      if (lower.includes(key) || key.includes(lower)) {
        if (Math.abs(lower.length - key.length) <= 3) {
          found.add(value);
          return;
        }
      }
    }

    // If not in master list but looks like a real technology
    // (not a soft skill, not too long), keep it as-is
    if (
      skill.length >= 2 &&
      skill.length <= 30 &&
      !/\s{2,}/.test(skill) &&
      !['communication', 'teamwork', 'leadership', 'problem solving',
        'critical thinking', 'time management', 'creativity'].includes(lower)
    ) {
      // Capitalize properly and add
      found.add(skill.trim());
    }
  });

  return [...found];
};

module.exports = { normalizeSkills, MASTER_SKILLS };