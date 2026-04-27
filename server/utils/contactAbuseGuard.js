'use strict';

const crypto = require('crypto');

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const duplicateSubmissionCache = new Map();

function hasRecentDuplicateSubmission({ ip, subject, message }) {
  pruneExpiredEntries();

  const cacheKey = buildDuplicateKey({ ip, subject, message });
  const lastSeen = duplicateSubmissionCache.get(cacheKey);

  return Boolean(lastSeen && Date.now() - lastSeen < DUPLICATE_WINDOW_MS);
}

function rememberSubmission({ ip, subject, message }) {
  pruneExpiredEntries();
  duplicateSubmissionCache.set(buildDuplicateKey({ ip, subject, message }), Date.now());
}

function buildDuplicateKey({ ip, subject, message }) {
  const normalizedIp = collapseWhitespace(ip || 'unknown-ip').toLowerCase();
  const normalizedSubject = collapseWhitespace(subject || '').toLowerCase();
  const normalizedMessage = collapseWhitespace(message || '').toLowerCase();

  return crypto
    .createHash('sha256')
    .update(`${normalizedIp}|${normalizedSubject}|${normalizedMessage}`)
    .digest('hex');
}

function pruneExpiredEntries() {
  const cutoff = Date.now() - DUPLICATE_WINDOW_MS;

  for (const [key, timestamp] of duplicateSubmissionCache.entries()) {
    if (timestamp < cutoff) {
      duplicateSubmissionCache.delete(key);
    }
  }
}

function collapseWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

module.exports = {
  hasRecentDuplicateSubmission,
  rememberSubmission
};
