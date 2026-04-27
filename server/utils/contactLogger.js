'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'contact.log');

async function logContactSubmission({ email, ip, subject, outcome, termsAccepted, legalVersion }) {
  const entry = [
    `[${formatTimestamp(new Date())}]`,
    `outcome:${cleanField(outcome) || 'accepted'}`,
    `email:${hashIdentifier(email)}`,
    `ip:${hashIdentifier(ip)}`,
    `subject:${cleanField(subject) || 'other'}`,
    `assent:${termsAccepted ? 'yes' : 'no'}${legalVersion ? `:${cleanField(legalVersion)}` : ''}`
  ].join(' | ');

  console.info(entry);
  await ensureFile(LOG_FILE, '');
  await fs.appendFile(LOG_FILE, `${entry}\n`, {
    encoding: 'utf8',
    mode: 0o600
  });

  return entry;
}

async function ensureFile(filePath, defaultContents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await fs.writeFile(filePath, defaultContents, {
      encoding: 'utf8',
      mode: 0o600
    });
  }
}

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function hashIdentifier(value) {
  // Operational logs intentionally keep only one-way hashes so operators can
  // correlate abuse and delivery events without retaining plaintext identifiers.
  return crypto
    .createHash('sha256')
    .update(String(value || '').trim().toLowerCase())
    .digest('hex');
}

function cleanField(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

module.exports = {
  LOG_FILE,
  formatTimestamp,
  hashIdentifier,
  logContactSubmission
};
