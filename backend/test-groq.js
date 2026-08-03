// test-groq.js — run from backend folder: node test-groq.js
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('❌ GROQ_API_KEY not found in .env');
  console.log('   Get your free key at: console.groq.com');
  process.exit(1);
}

console.log('✅ GROQ_API_KEY found:', apiKey.slice(0, 10) + '...');
console.log('Testing Groq API...\n');

const body = JSON.stringify({
  model:    'llama-3.3-70b-versatile',
  messages: [{
    role:    'user',
    content: 'Extract skills from this resume text and return JSON: {"skills": ["Python", "React", "SQL"]}. Text: "I know Python, React, SQL and Docker"',
  }],
  response_format: { type: 'json_object' },
  max_tokens: 200,
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
    const parsed = JSON.parse(data);
    if (res.statusCode === 200) {
      const content = parsed?.choices?.[0]?.message?.content;
      console.log('✅ Groq API working!');
      console.log('Response:', content);
      console.log('\n✅ Ready to use. Upload a resume to test full parsing.');
    } else {
      console.error('❌ Groq API error:', parsed?.error?.message);
      console.log('\nFix: Go to console.groq.com → API Keys → create new key');
    }
  });
});
req.on('error', e => console.error('❌ Network error:', e.message));
req.write(body);
req.end();