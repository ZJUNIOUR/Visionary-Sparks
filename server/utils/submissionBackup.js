'use strict';

const fs = require('fs/promises');
const path = require('path');

const { formatTimestamp } = require('./contactLogger');

const SUBMISSIONS_FILE = path.join(__dirname, '..', 'data', 'submissions.ndjson');

async function saveFailedSubmission(submission) {
  await fs.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true });

  const record = {
    timestamp: formatTimestamp(new Date()),
    fname: submission.fname,
    lname: submission.lname,
    email: submission.email,
    subject: submission.subject,
    subjectLabel: submission.subjectLabel,
    // This backup keeps the full message because it becomes the only recoverable
    // copy when SMTP delivery fails. Restrictive file permissions reduce exposure.
    message: submission.message,
    failureReason: submission.failureReason,
    source: 'contact-form-backup'
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
