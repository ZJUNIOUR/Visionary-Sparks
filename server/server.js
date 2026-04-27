'use strict';

const path = require('path');

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const { env } = require('./config/env');
const { getMailerConfig } = require('./config/mailer');
const { getCaptchaConfig } = require('./utils/hcaptcha');
const { AppError, errorHandler, notFoundHandler } = require('./utils/errors');
const contactRoutes = require('./routes/contactRoutes');

function createApp() {
  const app = express();
  const publicDir = path.join(__dirname, '..', 'public');
  const assetsDir = path.join(publicDir, 'assets');

  app.disable('x-powered-by');

  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(createCorsMiddleware());
  app.use(redirectHttpToHttps);
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          frameSrc: ["'self'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", 'https://js.hcaptcha.com', 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
        }
      },
      referrerPolicy: {
        policy: 'no-referrer'
      }
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.get('/index.html', (req, res) => {
    res.redirect(301, '/');
  });
  app.use('/assets', express.static(assetsDir, {
    maxAge: '30d',
    immutable: true
  }));
  app.use(express.static(publicDir, {
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  }));

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok'
    });
  });

  app.get('/api/contact-config', (req, res) => {
    const captchaConfig = getCaptchaConfig();

    res.status(200).json({
      success: true,
      hcaptchaConfigured: captchaConfig.isConfigured,
      hcaptchaSiteKey: captchaConfig.isConfigured ? captchaConfig.siteKey : ''
    });
  });

  app.use('/api/contact', contactRoutes);
  app.use('/contact', contactRoutes);

  app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
      return next(new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request payload is too large.'));
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return next(
        AppError.validation([
          {
            field: 'body',
            message: 'Request body must be valid JSON.'
          }
        ])
      );
    }

    return next(error);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function startServer(port = env.PORT) {
  const app = createApp();
  const mailerConfig = getMailerConfig();
  const captchaConfig = getCaptchaConfig();

  return app.listen(port, () => {
    console.log(
      `Visionary Sparks server listening on port ${port} (canonical origin: ${env.APP_ORIGIN})`
    );
    if (!mailerConfig.isConfigured) {
      console.warn(
        'Contact email is not fully configured. Set EMAIL_USER, EMAIL_PASS, and a school-controlled EMAIL_TO inbox before deploying.'
      );
    }
    if (!captchaConfig.isConfigured) {
      console.warn(
        'hCaptcha is not fully configured. Set HCAPTCHA_SITE_KEY and HCAPTCHA_SECRET in .env before using the contact form in production.'
      );
    }
  });
}

function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (!origin || origin === env.APP_ORIGIN) {
        return callback(null, true);
      }

      return callback(
        new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Origin not allowed.', {
          expose: true
        })
      );
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    optionsSuccessStatus: 204
  });
}

function redirectHttpToHttps(req, res, next) {
  if (!env.isProduction || req.secure || isLocalRequest(req)) {
    return next();
  }

  return res.redirect(301, new URL(req.originalUrl, env.APP_ORIGIN).toString());
}

function isLocalRequest(req) {
  const host = req.headers.host || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

module.exports = {
  createApp,
  startServer
};
