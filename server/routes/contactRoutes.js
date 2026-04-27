'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { sendContactEmails } = require('../config/mailer');
const {
  hasRecentDuplicateSubmission,
  rememberSubmission
} = require('../utils/contactAbuseGuard');
const { logContactSubmission } = require('../utils/contactLogger');
const { AppError, asyncHandler } = require('../utils/errors');
const { verifyCaptchaToken } = require('../utils/hcaptcha');
const { saveFailedSubmission } = require('../utils/submissionBackup');
const {
  SUBJECT_LABELS,
  buildContactLogPreview,
  contactValidationRules,
  getValidatedContactPayload
} = require('../utils/validation');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next) {
    next(AppError.rateLimited());
  }
});

router.post(
  '/',
  normalizeContactPayload,
  contactLimiter,
  contactValidationRules,
  asyncHandler(async (req, res) => {
    const preview = buildContactLogPreview(req.body);

    if (preview.website) {
      return res.status(200).json({
        success: true
      });
    }

    const { errors, payload } = getValidatedContactPayload(req);

    if (errors.length) {
      const validationError = AppError.validation(errors);
      validationError.resetCaptcha = true;
      throw validationError;
    }

    const clientIp = getClientIp(req);
    const subjectLabel = SUBJECT_LABELS[payload.subject] || SUBJECT_LABELS.other;

    await verifyCaptchaToken({
      token: payload.hcaptchaToken,
      remoteIp: clientIp
    });

    if (
      await hasRecentDuplicateSubmission({
        ip: clientIp,
        subject: payload.subject,
        message: payload.message
      })
    ) {
      throw AppError.rateLimited('Please wait a few minutes before sending the same message again.');
    }

    let emailResult;

    try {
      emailResult = await sendContactEmails({
        fname: payload.fname,
        lname: payload.lname,
        email: payload.email,
        subject: subjectLabel,
        message: payload.message
      });
    } catch (error) {
      const fallbackSaved = await safeSaveFailedSubmission(payload, subjectLabel, clientIp, error);
      const requestError = error instanceof AppError ? error : AppError.upstream();

      if (fallbackSaved) {
        await rememberSubmission({
          ip: clientIp,
          subject: payload.subject,
          message: payload.message
        });
      }

      await safeLogContactSubmission({
        email: payload.email,
        ip: clientIp,
        subject: subjectLabel,
        termsAccepted: payload.termsAccepted,
        legalVersion: payload.legalVersion,
        outcome: fallbackSaved ? 'delivery-failed-fallback-saved' : 'delivery-failed'
      });

      requestError.fallbackSaved = fallbackSaved;
      requestError.resetCaptcha = true;
      throw requestError;
    }

    await rememberSubmission({
      ip: clientIp,
      subject: payload.subject,
      message: payload.message
    });

    await safeLogContactSubmission({
      email: payload.email,
      ip: clientIp,
      subject: subjectLabel,
      termsAccepted: payload.termsAccepted,
      legalVersion: payload.legalVersion,
      outcome: emailResult.confirmationSent ? 'accepted' : 'accepted-admin-only'
    });

    if (!emailResult.confirmationSent) {
      console.warn('Admin email sent, but the confirmation email could not be delivered.');
    }

    return res.status(200).json({
      success: true
    });
  })
);

function normalizeContactPayload(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const captchaToken =
      req.body.hcaptchaToken ||
      req.body['h-captcha-response'] ||
      req.body['g-recaptcha-response'] ||
      '';

    req.body.hcaptchaToken = captchaToken;
  }

  next();
}

async function safeLogContactSubmission(payload) {
  try {
    await logContactSubmission({
      email: payload.email,
      ip: payload.ip,
      subject: payload.subject,
      outcome: payload.outcome,
      termsAccepted: payload.termsAccepted,
      legalVersion: payload.legalVersion
    });
  } catch (error) {
    console.error('Failed to write contact log:', error);
  }
}

async function safeSaveFailedSubmission(payload, subjectLabel, clientIp, error) {
  try {
    await saveFailedSubmission({
      fname: payload.fname,
      lname: payload.lname,
      email: payload.email,
      subject: payload.subject,
      subjectLabel,
      message: payload.message,
      ip: clientIp,
      termsAccepted: payload.termsAccepted,
      legalVersion: payload.legalVersion,
      failureReason: error.code || error.message || 'Unknown email delivery failure'
    });

    console.warn('Encrypted fallback submission saved for manual recovery.');
    return true;
  } catch (backupError) {
    console.error('Failed to save fallback submission:', backupError);
    return false;
  }
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown-ip';
}

module.exports = router;
