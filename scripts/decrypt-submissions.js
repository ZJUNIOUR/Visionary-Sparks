'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server', 'data', 'submissions.ndjson');
const rawKey = cleanEnvValue(process.env.BACKUP_ENCRYPTION_KEY);

if (!/^[a-fA-F0-9]{64}$/.test(rawKey)) {
  console.error('Set BACKUP_ENCRYPTION_KEY to the 64-character hex value used in production.');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`No backup file found at ${filePath}`);
  process.exit(1);
}

const key = Buffer.from(rawKey, 'hex');
const lines = fs
  .readFileSync(filePath, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean);

for (const line of lines) {
  const record = JSON.parse(line);
  const decryptedContact = decryptContactPayload(record.contactPayload, key);

  process.stdout.write(
    `${JSON.stringify(
      {
        ...record,
        contactPayload: undefined,
        decryptedContact
      },
      null,
      2
    )}\n`
  );
}

function decryptContactPayload(payload, keyBuffer) {
  if (!payload || !payload.iv || !payload.tag || !payload.payload) {
    return null;
  }

  const decipher = crypto.createDecipheriv(
    payload.algorithm || 'aes-256-gcm',
    keyBuffer,
    Buffer.from(payload.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.payload, 'base64')),
    decipher.final()
  ]);

  return JSON.parse(plaintext.toString('utf8'));
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
