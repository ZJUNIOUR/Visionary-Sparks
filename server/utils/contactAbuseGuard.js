'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const DUPLICATE_CACHE_FILE = path.join(__dirname, '..', 'data', 'contact-abuse.ndjson');
const duplicateSubmissionCache = new Map();
let hydrationPromise;
let persistenceQueue = Promise.resolve();

async function hasRecentDuplicateSubmission({ ip, subject, message }) {
  await hydrateCache();
  await pruneExpiredEntries();

  const cacheKey = buildDuplicateKey({ ip, subject, message });
  const lastSeen = duplicateSubmissionCache.get(cacheKey);

  return Boolean(lastSeen && Date.now() - lastSeen < DUPLICATE_WINDOW_MS);
}

async function rememberSubmission({ ip, subject, message }) {
  await hydrateCache();
  await pruneExpiredEntries();
  duplicateSubmissionCache.set(buildDuplicateKey({ ip, subject, message }), Date.now());
  await persistCache();
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

async function hydrateCache() {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      await fs.mkdir(path.dirname(DUPLICATE_CACHE_FILE), { recursive: true });

      try {
        const contents = await fs.readFile(DUPLICATE_CACHE_FILE, 'utf8');
        contents
          .split(/\r?\n/)
          .filter(Boolean)
          .forEach((line) => {
            try {
              const entry = JSON.parse(line);
              if (entry.key && Number.isFinite(entry.timestamp)) {
                duplicateSubmissionCache.set(entry.key, entry.timestamp);
              }
            } catch (error) {
              console.warn('Ignoring malformed duplicate-submission cache entry.');
            }
          });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      await pruneExpiredEntries();
    })();
  }

  return hydrationPromise;
}

async function pruneExpiredEntries() {
  const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
  let changed = false;

  for (const [key, timestamp] of duplicateSubmissionCache.entries()) {
    if (timestamp < cutoff) {
      duplicateSubmissionCache.delete(key);
      changed = true;
    }
  }

  if (changed) {
    await persistCache();
  }
}

function persistCache() {
  persistenceQueue = persistenceQueue.then(async () => {
    const lines = Array.from(duplicateSubmissionCache.entries(), ([key, timestamp]) =>
      JSON.stringify({ key, timestamp })
    );

    await fs.writeFile(
      DUPLICATE_CACHE_FILE,
      lines.length ? `${lines.join('\n')}\n` : '',
      {
        encoding: 'utf8',
        mode: 0o600
      }
    );
  }, async () => {
    const lines = Array.from(duplicateSubmissionCache.entries(), ([key, timestamp]) =>
      JSON.stringify({ key, timestamp })
    );

    await fs.writeFile(
      DUPLICATE_CACHE_FILE,
      lines.length ? `${lines.join('\n')}\n` : '',
      {
        encoding: 'utf8',
        mode: 0o600
      }
    );
  });

  return persistenceQueue;
}

function collapseWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

module.exports = {
  hasRecentDuplicateSubmission,
  rememberSubmission
};
