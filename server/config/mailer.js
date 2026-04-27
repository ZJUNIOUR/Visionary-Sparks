'use strict';

const nodemailer = require('nodemailer');

const { DEFAULT_TEAM_INBOX, env, isPlaceholderValue } = require('./env');
const { AppError } = require('../utils/errors');

let transporter;

function getMailerConfig() {
  // Never commit .env. If the Gmail App Password is ever exposed, rotate it immediately.
  const user = cleanEnvValue(env.EMAIL_USER);
  const pass = cleanEnvValue(env.EMAIL_PASS);
  const to = cleanEnvValue(env.EMAIL_TO) || DEFAULT_TEAM_INBOX;

  return {
    user,
    pass,
    to,
    isConfigured: !isPlaceholderValue(user) && !isPlaceholderValue(pass)
  };
}

function getTransporter() {
  const config = getMailerConfig();

  if (!config.isConfigured) {
    console.error('Email delivery requested before EMAIL_USER/EMAIL_PASS were configured.');
    throw AppError.misconfigured('Email service is temporarily unavailable.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  return transporter;
}

async function sendContactEmails({ fname, lname, email, subject, message }) {
  const mailTransporter = getTransporter();
  const senderName = formatSenderName(fname, lname);
  const adminMail = buildAdminMail({ senderName, email, subject, message });
  const confirmationMail = buildConfirmationMail({ senderName, email, subject, message });

  const [adminResult, confirmationResult] = await Promise.allSettled([
    mailTransporter.sendMail(adminMail),
    mailTransporter.sendMail(confirmationMail)
  ]);

  if (adminResult.status === 'rejected') {
    throw AppError.upstream('Unable to send your message right now. Please try again later.');
  }

  if (confirmationResult.status === 'rejected') {
    console.warn('Failed to send contact confirmation email:', confirmationResult.reason);
  }

  return {
    adminInfo: adminResult.value,
    confirmationSent: confirmationResult.status === 'fulfilled'
  };
}

function buildAdminMail({ senderName, email, subject, message }) {
  const config = getMailerConfig();

  return {
    from: `"Visionary Sparks Website" <${config.user}>`,
    to: config.to,
    replyTo: email,
    subject: `Website Contact: ${subject}`,
    text: [
      'New contact form submission',
      '',
      `Name: ${senderName}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      '',
      'Message:',
      message
    ].join('\n'),
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(senderName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
    `
  };
}

function buildConfirmationMail({ senderName, email, subject, message }) {
  const config = getMailerConfig();
  const safeName = escapeHtml(senderName);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return {
    from: `"Visionary Sparks" <${config.user}>`,
    to: email,
    replyTo: config.to,
    subject: 'We received your message | Visionary Sparks',
    text: [
      `Hi ${senderName},`,
      '',
      'Thank you for contacting Visionary Sparks.',
      'We received your message and a team member will follow up as soon as possible.',
      '',
      'Submission summary',
      `Name: ${senderName}`,
      `Subject: ${subject}`,
      'Message:',
      message,
      '',
      'We appreciate your interest in Visionary Sparks.',
      '',
      'Visionary Sparks | FRC Team 11353'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102033;">
        <h2 style="margin-bottom: 0.5rem;">Thank you for contacting Visionary Sparks</h2>
        <p>Hi ${safeName},</p>
        <p>We received your message and a team member will follow up as soon as possible.</p>
        <div style="margin: 1.5rem 0; padding: 1rem 1.25rem; border: 1px solid #d8e3f2; border-radius: 12px; background: #f7fbff;">
          <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
          <p style="margin: 0 0 0.5rem;"><strong>Subject:</strong> ${safeSubject}</p>
          <p style="margin: 0 0 0.5rem;"><strong>Message:</strong></p>
          <p style="margin: 0;">${safeMessage}</p>
        </div>
        <p>We appreciate your interest in Visionary Sparks.</p>
        <p style="margin-bottom: 0;">Visionary Sparks | FRC Team 11353</p>
      </div>
    `
  };
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSenderName(fname, lname) {
  return `${fname} ${lname}`.trim();
}

module.exports = {
  getMailerConfig,
  sendContactEmails
};
