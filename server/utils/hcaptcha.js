'use strict';

const axios = require('axios');

const { env, isPlaceholderValue } = require('../config/env');
const { AppError } = require('./errors');

function getCaptchaConfig() {
  const siteKey = cleanEnvValue(env.HCAPTCHA_SITE_KEY);
  const secret = cleanEnvValue(env.HCAPTCHA_SECRET);
  const verifyUrl = cleanEnvValue(env.HCAPTCHA_VERIFY_URL) || 'https://hcaptcha.com/siteverify';

  return {
    siteKey,
    secret,
    verifyUrl,
    isConfigured: !isPlaceholderValue(siteKey) && !isPlaceholderValue(secret)
  };
}

async function verifyCaptchaToken({ token, remoteIp }) {
  const config = getCaptchaConfig();

  if (!config.isConfigured) {
    console.error('hCaptcha verification requested before HCAPTCHA_SITE_KEY/HCAPTCHA_SECRET were configured.');
    throw AppError.misconfigured('Security verification is temporarily unavailable.');
  }

  const payload = new URLSearchParams({
    response: token,
    secret: config.secret
  });

  if (remoteIp) {
    payload.set('remoteip', remoteIp);
  }

  let response;

  try {
    response = await axios.post(config.verifyUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000
    });
  } catch (error) {
    throw AppError.upstream('Unable to verify the security challenge right now. Please try again.');
  }

  if (!response.data || !response.data.success) {
    throw AppError.invalidCaptcha();
  }

  return {
    success: true,
    errorCodes: Array.isArray(response.data['error-codes']) ? response.data['error-codes'] : []
  };
}

function cleanEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = {
  getCaptchaConfig,
  verifyCaptchaToken
};
