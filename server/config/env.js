'use strict';

const path = require('path');

const { cleanEnv, port, str, url } = require('envalid');

require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'),
  quiet: true
});

const DEFAULT_TEAM_INBOX = 'visionarysparksofficial@gmail.com';
const PLACEHOLDER_VALUES = new Set([
  '',
  'placeholder@example.com',
  'app_password_here',
  'your_app_password_here',
  'your_school_controlled_inbox@example.org',
  'your_hcaptcha_site_key',
  'your_hcaptcha_secret',
  'change_me_with_64_hex_chars'
]);
const rawEnv = { ...process.env };

const cleanedEnv = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development'
  }),
  PORT: port({ default: 3000 }),
  APP_ORIGIN: url({ default: 'http://localhost:3000' }),
  EMAIL_USER: str({ default: 'placeholder@example.com' }),
  EMAIL_PASS: str({ default: 'app_password_here' }),
  EMAIL_TO: str({ default: DEFAULT_TEAM_INBOX }),
  HCAPTCHA_SITE_KEY: str({ default: 'your_hcaptcha_site_key' }),
  HCAPTCHA_SECRET: str({ default: 'your_hcaptcha_secret' }),
  HCAPTCHA_VERIFY_URL: url({ default: 'https://api.hcaptcha.com/siteverify' }),
  BACKUP_ENCRYPTION_KEY: str({ default: 'change_me_with_64_hex_chars' })
});

const env = Object.freeze({
  NODE_ENV: cleanedEnv.NODE_ENV,
  PORT: cleanedEnv.PORT,
  APP_ORIGIN: new URL(cleanedEnv.APP_ORIGIN).origin,
  EMAIL_USER: cleanedEnv.EMAIL_USER.trim(),
  EMAIL_PASS: cleanedEnv.EMAIL_PASS.trim(),
  EMAIL_TO: cleanedEnv.EMAIL_TO.trim() || DEFAULT_TEAM_INBOX,
  HCAPTCHA_SITE_KEY: cleanedEnv.HCAPTCHA_SITE_KEY.trim(),
  HCAPTCHA_SECRET: cleanedEnv.HCAPTCHA_SECRET.trim(),
  HCAPTCHA_VERIFY_URL: cleanedEnv.HCAPTCHA_VERIFY_URL.trim(),
  BACKUP_ENCRYPTION_KEY: cleanedEnv.BACKUP_ENCRYPTION_KEY.trim(),
  isProduction: cleanedEnv.NODE_ENV === 'production'
});

validateProductionEnv(env);

function validateProductionEnv(config) {
  if (!config.isProduction) {
    return;
  }

  const requiredKeys = [
    'PORT',
    'APP_ORIGIN',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_TO',
    'HCAPTCHA_SITE_KEY',
    'HCAPTCHA_SECRET',
    'BACKUP_ENCRYPTION_KEY'
  ];
  const missingKeys = requiredKeys.filter((name) => isMissingProductionValue(name));

  if (missingKeys.length) {
    throw new Error(
      `Missing or placeholder production environment variables: ${missingKeys.join(', ')}`
    );
  }

  if (!isHexEncryptionKey(config.BACKUP_ENCRYPTION_KEY)) {
    throw new Error(
      'BACKUP_ENCRYPTION_KEY must be a 64-character hexadecimal string in production.'
    );
  }
}

function isPlaceholderValue(value) {
  return PLACEHOLDER_VALUES.has(cleanEnvValue(value));
}

function isMissingProductionValue(name) {
  const value = cleanEnvValue(rawEnv[name]);
  return !value || isPlaceholderValue(value);
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isHexEncryptionKey(value) {
  return /^[a-fA-F0-9]{64}$/.test(cleanEnvValue(value));
}

module.exports = {
  DEFAULT_TEAM_INBOX,
  env,
  isHexEncryptionKey,
  isPlaceholderValue
};
