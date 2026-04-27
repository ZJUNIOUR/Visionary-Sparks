'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const { env, isHexEncryptionKey } = require('../config/env');
const { AppError } = require('./errors');
const { formatTimestamp, hashIdentifier } = require('./contactLogger');

const SUBMISSIONS_FILE = path.join(__dirname, '..', 'data', 'submissions.ndjson');
const BACKUP_ALGORITHM = 'aes-256-gcm';

async function saveFailedSubmission(submission) {
  await fs.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true });
  const encryptedContact = encryptSubmissionContact(submission);

  const record = {
    timestamp: formatTimestamp(new Date()),
    emailHash: hashIdentifier(submission.email),
    ipHash: hashIdentifier(submission.ip),
    subject: submission.subject,
    subjectLabel: submission.subjectLabel,
    termsAccepted: Boolean(submission.termsAccepted),
    legalVersion: submission.legalVersion || '',
    failureReason: submission.failureReason,
    source: 'contact-form-backup',
    contactPayload: encryptedContact
  };

  await fs.appendFile(SUBMISSIONS_FILE, `${JSON.stringify(record)}\n`, {
    encoding: 'utf8',
    mode: 0o600
  });

  return record;
}

module.exports = {
  SUBMISSIONS_FILE,
  saveFailedSubmission
};

function encryptSubmissionContact(submission) {
  const key = getBackupCipherKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(BACKUP_ALGORITHM, key, iv);
  const plaintext = JSON.stringify({
    fname: submission.fname,
    lname: submission.lname,
    email: submission.email,
    message: submission.message
  });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    algorithm: BACKUP_ALGORITHM,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    payload: ciphertext.toString('base64')
  };
}

function getBackupCipherKey() {
  const rawKey = cleanEnvValue(env.BACKUP_ENCRYPTION_KEY);

  if (!isHexEncryptionKey(rawKey)) {
    throw AppError.misconfigured('Submission recovery is temporarily unavailable.');
  }

  return Buffer.from(rawKey, 'hex');
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
