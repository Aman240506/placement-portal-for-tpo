const https = require('https');
const http = require('http');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const STANDARD_FONT_DATA_URL = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts'
) + path.sep;

const EMPTY_RESULT = {
  error: '',
  skills: [],
};

const SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Bash', 'Shell', 'Dart',
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Redux',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'jQuery', 'Vite', 'Webpack',
  'GraphQL', 'Apollo', 'REST APIs', 'Socket.io',
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
  'Laravel', 'NestJS', 'gRPC', 'Microservices',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
  'SQL Server', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'Elasticsearch', 'SQL',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'Jenkins', 'GitHub Actions', 'CI/CD', 'Linux', 'Nginx', 'Vercel', 'Render', 'Heroku',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'OpenCV', 'NLP',
  'Computer Vision', 'Data Science', 'Jupyter', 'Spark', 'Hadoop', 'Tableau', 'Power BI',
  'Git', 'GitHub', 'GitLab', 'Jira', 'Postman', 'Figma', 'VS Code',
  'Agile', 'Scrum', 'TDD', 'Jest', 'Pytest', 'Selenium', 'Cypress',
  'React Native', 'Flutter', 'Android', 'iOS', 'Expo',
  'Data Structures', 'Algorithms', 'System Design', 'OOP', 'Design Patterns',
  'Blockchain', 'Solidity', 'Web Security', 'OAuth', 'JWT',
  'Three.js', 'WebGL', 'Unity',
];

const fetchBuffer = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    client
      .get(url, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location) {
            res.resume();
            return reject(new Error('Redirect missing location header'));
          }

          const nextUrl = new URL(location, url).toString();
          res.resume();
          return fetchBuffer(nextUrl).then(resolve).catch(reject);
        }

        const contentType = String(res.headers['content-type'] || '').toLowerCase();

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} fetching PDF`));
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const isPdfHeader = buffer.slice(0, 5).toString('utf8') === '%PDF-';

          if (!contentType.includes('application/pdf') && !contentType.includes('application/octet-stream') && !isPdfHeader) {
            return reject(new Error(`Invalid content type: ${contentType || 'unknown'}`));
          }

          if (!isPdfHeader) {
            return reject(new Error(`Downloaded file is not a valid PDF: ${contentType || 'unknown'}`));
          }

          resolve(buffer);
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
};

const extractTextWithOCR = async () => null;

const extractTextFromPDF = async (buffer) => {
  const pdfData = Buffer.isBuffer(buffer)
    ? Uint8Array.from(buffer)
    : buffer instanceof Uint8Array
      ? buffer
      : new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdfDocument = await loadingTask.promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const pageText = content.items
      .map((item) => (item && typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean)
      .join(' ')
      .trim();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  const mergedText = pageTexts.join('\n');
  const cleanedText = cleanText(mergedText);

  await extractTextWithOCR();

  return cleanedText;
};

const cleanText = (text) => {
  if (!text) return '';

  const normalized = text
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0]/g, ' ');

  const lines = normalized
    .split(/\r?\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^page\s*\d+(\s*of\s*\d+)?$/i.test(line))
    .filter((line) => !/^\d+(\s*\/\s*\d+)?$/.test(line));

  return lines.join('\n').replace(/[ \t]{2,}/g, ' ').trim();
};

const extractRegexData = (text) => {
  if (!text) {
    return {
      email: null,
      phone: null,
      github_url: null,
      linkedin_url: null,
      portfolio_url: null,
      skills: [],
    };
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}(?:[\s-]?\d{0,4})/);
  const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+/i);
  const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[A-Za-z0-9_\-\/%.]+/i);
  const portfolioMatch = text.match(/https?:\/\/(?!.*(?:github\.com|linkedin\.com))[A-Za-z0-9.-]+(?:\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?/i);

  return {
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : null,
    github_url: githubMatch ? githubMatch[0] : null,
    linkedin_url: linkedinMatch ? linkedinMatch[0] : null,
    portfolio_url: portfolioMatch ? portfolioMatch[0] : null,
    skills: extractSkillsFromText(text),
  };
};

const extractSkillsFromText = (text) => {
  if (!text) return [];

  const found = new Set();

  SKILLS.forEach((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-zA-Z0-9])${escaped}($|[^a-zA-Z0-9])`, 'i');
    if (pattern.test(text)) {
      found.add(skill);
    }
  });

  return [...found];
};

const mergeSkills = (aiSkills, regexSkills) => {
  const merged = [];
  const seen = new Set();

  [...(Array.isArray(aiSkills) ? aiSkills : []), ...(Array.isArray(regexSkills) ? regexSkills : [])].forEach((skill) => {
    if (typeof skill !== 'string') {
      return;
    }

    const normalized = skill.trim();
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalized);
  });

  return merged;
};

const buildGroqPrompt = (resumeText) => {
  return `You are an exact resume parser.

Return ONLY a valid JSON object.
Return no markdown.
Return no explanation.
Never hallucinate.
If a field does not exist, use null or an empty array.

Schema:
{
  "full_name": null,
  "email": null,
  "phone": null,
  "summary": null,
  "skills": [],
  "experience_years": null,
  "experiences": [],
  "education": [],
  "projects": [],
  "certifications": []
}

Rules:
- Extract only facts present in the resume.
- Do not invent job titles, companies, dates, degrees, skills, or certifications.
- Keep skills as technical skills only.
- Use null for missing scalar values.
- Use [] for missing arrays.
- Keep summary concise and factual if present.

Resume text:
${resumeText.slice(0, 6000)}`;
};

const callGroq = (resumeText) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return reject(new Error('GROQ_API_KEY not set'));
    }

    const prompt = buildGroqPrompt(resumeText);
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode !== 200) {
            return reject(new Error(parsed?.error?.message || `HTTP ${res.statusCode}`));
          }

          const content = parsed?.choices?.[0]?.message?.content;
          if (!content) {
            return reject(new Error('Empty Groq response'));
          }

          console.log('[Groq] Response received');
          resolve(content);
        } catch (error) {
          reject(new Error(`Response parse error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Groq timeout'));
    });
    req.write(body);
    req.end();
  });
};

const normalizeResult = (result, regexData, rawText, source) => {
  const aiSkills = Array.isArray(result.skills) ? result.skills : [];
  const mergedSkills = mergeSkills(aiSkills, regexData.skills);

  return {
    full_name: result.full_name ?? null,
    email: result.email ?? regexData.email ?? null,
    phone: result.phone ?? regexData.phone ?? null,
    github_url: result.github_url ?? regexData.github_url ?? null,
    linkedin_url: result.linkedin_url ?? regexData.linkedin_url ?? null,
    portfolio_url: result.portfolio_url ?? regexData.portfolio_url ?? null,
    summary: result.summary ?? null,
    skills: mergedSkills,
    experience_years: result.experience_years ?? null,
    experiences: Array.isArray(result.experiences) ? result.experiences : [],
    education: Array.isArray(result.education) ? result.education : [],
    projects: Array.isArray(result.projects) ? result.projects : [],
    certifications: Array.isArray(result.certifications) ? result.certifications : [],
    raw_text: rawText.slice(0, 3000),
    source,
  };
};

const parseResumeWithGemini = async (pdfUrl) => {
  console.log('[Parser] Downloading PDF');

  let pdfBuffer;
  try {
    pdfBuffer = await fetchBuffer(pdfUrl);
    console.log('[Parser] PDF downloaded');
  } catch (error) {
    console.error(`[Parser] PDF download failed: ${error.message}`);
    return { ...EMPTY_RESULT, error: error.message };
  }

  console.log('[Parser] Extracting text');

  let rawText = '';
  try {
    rawText = await extractTextFromPDF(pdfBuffer);
  } catch (error) {
    console.error(`[Parser] Text extraction failed: ${error.message}`);
    return { ...EMPTY_RESULT, error: 'Could not extract text from PDF' };
  }

  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  console.log(`[Parser] ${wordCount} words extracted`);

  if (!rawText || rawText.trim().length < 50) {
    console.error('[Parser] Extracted text too short');
    return { ...EMPTY_RESULT, error: 'Could not extract text from PDF' };
  }

  const regexData = extractRegexData(rawText);

  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[Groq] Sending request');
      const responseText = await callGroq(rawText);
      const result = JSON.parse(responseText);
      const normalized = normalizeResult(result, regexData, rawText, 'groq');
      console.log(`[Groq] Parsed ${normalized.skills.length} merged skills`);
      return normalized;
    } catch (error) {
      console.error(`[Groq] Failed: ${error.message}`);
    }
  }

  const fallback = normalizeResult(
    {
      full_name: null,
      email: null,
      phone: null,
      summary: null,
      skills: [],
      experience_years: null,
      experiences: [],
      education: [],
      projects: [],
      certifications: [],
    },
    regexData,
    rawText,
    'regex'
  );

  console.log(`[Parser] Regex fallback extracted ${fallback.skills.length} skills`);
  return fallback;
};

module.exports = { parseResumeWithGemini };
