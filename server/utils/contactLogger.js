'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'contact.log');

async function logContactSubmission({ fname, lname, email, subject }) {
  const entry = `[${formatTimestamp(new Date())}] ${formatName(fname, lname)} | ${hashEmail(
    email
  )} | ${subject}`;

  console.log(entry);
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

function formatName(fname, lname) {
  const fullName = `${fname} ${lname}`.trim();
  return fullName || 'Unknown Sender';
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

function hashEmail(email) {
  // Logs intentionally keep only a one-way hash so operators can correlate abuse
  // without retaining raw email addresses in plaintext log files.
  return crypto
    .createHash('sha256')
    .update(String(email).trim().toLowerCase())
    .digest('hex');
}

module.exports = {
  LOG_FILE,
  formatTimestamp,
  hashEmail,
  logContactSubmission
};
