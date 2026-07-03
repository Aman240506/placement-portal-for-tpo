const pdfParse = require('pdf-parse');
const https    = require('https');
const http     = require('http');

/**
 * Fetches a PDF from a Cloudinary URL and returns clean extracted text.
 * @param {string} url - Cloudinary secure_url of the resume PDF
 * @returns {Promise<string>} - cleaned plain text
 */
const parseResumeFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to fetch PDF: HTTP ${response.statusCode}`));
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const data   = await pdfParse(buffer);
          resolve(cleanText(data.text));
        } catch (err) {
          reject(err);
        }
      });
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Strips noise from raw PDF text — page numbers, excess whitespace, non-ASCII.
 */
const cleanText = (raw) => {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
};

module.exports = { parseResumeFromUrl };