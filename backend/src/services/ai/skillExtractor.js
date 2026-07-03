const compromise = require('compromise');
const natural    = require('natural');

const stemmer    = natural.PorterStemmer;
const tokenizer  = new natural.WordTokenizer();

/**
 * Master skill list — 300+ technology skills.
 * Stored lowercase for matching. The original-cased version is returned.
 */
const MASTER_SKILLS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Bash',
  'Shell', 'PowerShell', 'Dart', 'Lua', 'Haskell', 'Elixir', 'Clojure',

  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Redux',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'SCSS', 'jQuery',
  'Webpack', 'Vite', 'Babel', 'GraphQL', 'Apollo', 'REST APIs',

  // Backend
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
  'Laravel', 'Ruby on Rails', 'ASP.NET', 'NestJS', 'Hapi.js', 'Koa.js',
  'Socket.io', 'gRPC', 'Microservices',

  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
  'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'Elasticsearch',
  'Neo4j', 'InfluxDB', 'MariaDB', 'SQL',

  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'Jenkins', 'GitHub Actions', 'CI/CD', 'Linux', 'Nginx', 'Apache',
  'Heroku', 'Vercel', 'Render', 'Cloudflare', 'S3', 'EC2', 'Lambda',

  // Data & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'OpenCV',
  'NLP', 'Computer Vision', 'Data Analysis', 'Data Science', 'Jupyter',
  'Hadoop', 'Spark', 'Tableau', 'Power BI', 'NLTK', 'spaCy',

  // Tools & Practices
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
  'Postman', 'Swagger', 'VS Code', 'IntelliJ', 'Eclipse',
  'Agile', 'Scrum', 'Kanban', 'TDD', 'Unit Testing', 'Jest',
  'Mocha', 'Chai', 'Pytest', 'JUnit', 'Selenium', 'Cypress',

  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS', 'Expo',

  // Concepts & CS fundamentals
  'Data Structures', 'Algorithms', 'System Design', 'OOP', 'Design Patterns',
  'Networking', 'Operating Systems', 'Computer Networks', 'DBMS',
  'Distributed Systems', 'API Design', 'Web Security', 'OAuth', 'JWT',
  'Cryptography', 'Blockchain', 'Smart Contracts', 'Solidity',

  // Other popular
  'Excel', 'Figma', 'Adobe XD', 'Photoshop', 'WordPress', 'Shopify',
  'Salesforce', 'SAP', 'Cybersecurity', 'Ethical Hacking', 'Penetration Testing',
  'OWASP', 'Splunk', 'Wireshark', 'Arduino', 'Raspberry Pi', 'IoT',
  'Unity', 'Unreal Engine', 'OpenGL', 'WebGL', 'Three.js',
];

// Build lookup maps once at module load — O(1) matching at runtime
const skillLowerMap = new Map(); // lowercase → original case
const stemMap       = new Map(); // stem → original case

MASTER_SKILLS.forEach(skill => {
  skillLowerMap.set(skill.toLowerCase(), skill);
  // Also stem the last word of multi-word skills for fuzzy matching
  const lastWord = skill.split(' ').pop().toLowerCase();
  stemMap.set(stemmer.stem(lastWord), skill);
});

/**
 * Extracts skills from raw resume text.
 * Strategy:
 *  1. Exact match — check every n-gram (1–3 words) against master list
 *  2. Stem match  — fallback fuzzy match on stemmed single tokens
 *
 * @param {string} text - cleaned resume text from resumeParser
 * @returns {string[]} - array of matched skill names (original casing)
 */
const extractSkills = (text) => {
  if (!text) return [];

  const lower  = text.toLowerCase();
  const found  = new Set();

  // Pass 1: exact n-gram matching (handles "Node.js", "Machine Learning", etc.)
  // Split into lines and check sliding windows of 1, 2, 3 words
  const lines = lower.split('\n');
  lines.forEach(line => {
    const words = line.trim().split(/\s+/);
    for (let size = 3; size >= 1; size--) {
      for (let i = 0; i <= words.length - size; i++) {
        const ngram = words.slice(i, i + size).join(' ');
        if (skillLowerMap.has(ngram)) {
          found.add(skillLowerMap.get(ngram));
        }
      }
    }
  });

  // Pass 2: stem-based fuzzy match on individual tokens (catches "pythonic" → Python, etc.)
  const tokens = tokenizer.tokenize(lower) || [];
  tokens.forEach(token => {
    if (token.length < 2) return;
    const stem = stemmer.stem(token);
    if (stemMap.has(stem) && !found.has(stemMap.get(stem))) {
      // Only add if the original token is reasonably close to the skill name
      const candidate = stemMap.get(stem);
      if (candidate.toLowerCase().startsWith(token.slice(0, 3))) {
        found.add(candidate);
      }
    }
  });

  // Pass 3: use compromise NLP to find proper nouns / tech terms not yet caught
  const doc = compromise(text);
  const acronyms = doc.acronyms().out('array');
  acronyms.forEach(a => {
    const key = a.toLowerCase();
    if (skillLowerMap.has(key)) found.add(skillLowerMap.get(key));
  });

  return [...found];
};

module.exports = { extractSkills, MASTER_SKILLS };