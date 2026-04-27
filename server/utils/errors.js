'use strict';

const path = require('path');

class AppError extends Error {
  constructor(statusCode, code, message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.expose = options.expose ?? statusCode < 500;
    this.details = options.details;
    this.resetCaptcha = options.resetCaptcha;
    this.fallbackSaved = options.fallbackSaved;
  }

  static validation(details = [], message = 'Validation failed.') {
    return new AppError(400, 'VALIDATION_ERROR', message, {
      details,
      expose: true
    });
  }

  static invalidCaptcha() {
    return new AppError(400, 'INVALID_CAPTCHA', 'CAPTCHA verification failed. Please try again.', {
      details: [
        {
          field: 'hcaptchaToken',
          message: 'CAPTCHA verification failed. Please try again.'
        }
      ],
      expose: true,
      resetCaptcha: true
    });
  }

  static rateLimited(message = 'Too many requests. Please try again later.') {
    return new AppError(429, 'RATE_LIMITED', message, {
      expose: true,
      resetCaptcha: true
    });
  }

  static upstream(message = 'Unable to complete the request right now. Please try again later.') {
    return new AppError(502, 'UPSTREAM_ERROR', message, {
      expose: true
    });
  }

  static misconfigured(message = 'This service is temporarily unavailable.') {
    return new AppError(503, 'SERVICE_MISCONFIGURED', message, {
      expose: true
    });
  }
}

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res) {
  if (shouldServeHtml404(req)) {
    res.status(404);
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(__dirname, '..', '..', 'public', '404.html'));
  }

  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  const error = normalizeError(err);
  const response = {
    success: false,
    code: error.code
  };

  if (error.code === 'VALIDATION_ERROR') {
    response.errors = error.details || [];
  } else {
    response.message = error.expose ? error.message : 'Internal server error';
    if (error.details) {
      response.errors = error.details;
    }
  }

  if (typeof error.fallbackSaved === 'boolean') {
    response.fallbackSaved = error.fallbackSaved;
  }

  if (error.resetCaptcha) {
    response.resetCaptcha = true;
  }

  if (error.statusCode >= 500) {
    console.error(`[${error.code}]`, err);
  } else {
    console.warn(`[${error.code}]`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    });
  }

  res.status(error.statusCode).json(response);
}

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Internal server error', {
    expose: false
  });
}

function shouldServeHtml404(req) {
  return (
    req.method === 'GET' &&
    !req.path.startsWith('/api/') &&
    req.accepts('html')
  );
}

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler
};
