'use strict';

const { body, matchedData, validationResult } = require('express-validator');

const LEGAL_NOTICE_VERSION = '2026-04-27';
const SUBJECT_LABELS = {
  join: 'Join the Team',
  sponsor: 'Sponsorship Inquiry',
  outreach: 'Outreach / Partnership',
  media: 'Media / Press',
  other: 'Other'
};

const contactValidationRules = [
  body('fname')
    .exists({ checkFalsy: true })
    .withMessage('First name is required.')
    .bail()
    .isString()
    .withMessage('First name must be plain text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('First name must be between 1 and 80 characters.'),
  body('lname')
    .exists({ checkFalsy: true })
    .withMessage('Last name is required.')
    .bail()
    .isString()
    .withMessage('Last name must be plain text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Last name must be between 1 and 80 characters.'),
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required.')
    .bail()
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email must be 254 characters or fewer.')
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .bail()
    .normalizeEmail({
      gmail_remove_dots: false
    }),
  body('subject')
    .exists({ checkFalsy: true })
    .withMessage('Subject is required.')
    .bail()
    .isString()
    .withMessage('Subject must be plain text.')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must be 100 characters or fewer.')
    .bail()
    .custom((value) => value in SUBJECT_LABELS)
    .withMessage('Please choose a valid subject.'),
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('Message is required.')
    .bail()
    .isString()
    .withMessage('Message must be plain text.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters.'),
  body('termsAccepted')
    .custom((value) => isAcceptedValue(value))
    .withMessage('You must agree to the Terms of Use and Privacy Policy before submitting the form.'),
  body('legalVersion')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => value === LEGAL_NOTICE_VERSION)
    .withMessage('Please refresh the page and review the latest legal notice before submitting.'),
  body('hcaptchaToken')
    .exists({ checkFalsy: true })
    .withMessage('Please complete the hCaptcha challenge.')
    .bail()
    .isString()
    .withMessage('Invalid hCaptcha response.')
    .bail()
    .trim()
    .isLength({ max: 4096 })
    .withMessage('Invalid hCaptcha response.'),
  body('website')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 0 })
    .withMessage('Spam submission detected.')
];

function getValidatedContactPayload(req) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return {
      errors: result.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    };
  }

  const data = matchedData(req, {
    includeOptionals: true,
    locations: ['body']
  });

  const payload = {
    fname: cleanString(data.fname),
    lname: cleanString(data.lname),
    email: cleanString(data.email),
    subject: normalizeSubjectKey(data.subject),
    message: cleanString(data.message),
    termsAccepted: isAcceptedValue(data.termsAccepted),
    legalVersion: LEGAL_NOTICE_VERSION,
    hcaptchaToken: cleanString(data.hcaptchaToken),
    website: cleanString(data.website)
  };

  return {
    payload,
    sanitizedPayload: sanitizeContactPayload(payload),
    errors: []
  };
}

function buildContactLogPreview(body = {}) {
  return sanitizeContactPayload({
    fname: cleanString(body.fname),
    lname: cleanString(body.lname),
    email: cleanString(body.email).toLowerCase(),
    subject: normalizeSubjectKey(body.subject),
    message: cleanString(body.message),
    termsAccepted: isAcceptedValue(body.termsAccepted),
    legalVersion: LEGAL_NOTICE_VERSION,
    website: cleanString(body.website)
  });
}

function sanitizeContactPayload(payload) {
  return {
    fname: escapeHtml(cleanString(payload.fname)),
    lname: escapeHtml(cleanString(payload.lname)),
    email: escapeHtml(cleanString(payload.email)),
    subject: normalizeSubjectKey(payload.subject),
    message: escapeHtml(cleanString(payload.message)),
    termsAccepted: Boolean(payload.termsAccepted),
    legalVersion: escapeHtml(cleanString(payload.legalVersion || '')),
    website: escapeHtml(cleanString(payload.website || ''))
  };
}

function normalizeSubjectKey(value) {
  const normalized = cleanString(value).toLowerCase();
  return normalized;
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isAcceptedValue(value) {
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  LEGAL_NOTICE_VERSION,
  SUBJECT_LABELS,
  buildContactLogPreview,
  contactValidationRules,
  getValidatedContactPayload
};
