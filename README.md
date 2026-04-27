# Visionary Sparks Website

Official website for Visionary Sparks, FRC Team 11353.

Created by **Zabdiel Dewar**

## Project Overview

This repository contains the production website for Visionary Sparks, a student-led FIRST Robotics Competition team based in Halifax County, North Carolina.

The site is built as a multi-page frontend served by an Express application. It includes a protected contact form with backend validation, hCaptcha verification, rate limiting, privacy-aware logging, and centralized JSON error handling.

This project is designed to:

- Introduce visitors to Visionary Sparks and FRC Team 11353
- Showcase the team, robot, and sponsor information
- Provide a secure way for students, mentors, sponsors, and community partners to contact the team
- Be deployable on Node.js hosts such as Render or Railway

## Features

- Multi-page responsive website
- Dedicated Home, About, Robots, Sponsors, and Contact pages
- Node.js + Express backend
- Secure contact form with server-side validation
- hCaptcha spam protection
- Request rate limiting
- Helmet security headers and CSP
- Compression for faster page delivery
- Static asset caching
- Centralized JSON error responses
- Privacy-aware contact logging with SHA-256 email hashing
- NDJSON backup storage for failed email deliveries
- SEO support with canonical tags, Open Graph tags, `robots.txt`, and `sitemap.xml`
- Accessibility improvements including visible focus states and reduced-motion support

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express
- Helmet
- CORS
- compression
- express-rate-limit
- express-validator
- Nodemailer
- hCaptcha
- dotenv
- envalid

## Folder Structure

```text
.
├── public/
│   ├── index.html
│   ├── about.html
│   ├── robots.html
│   ├── sponsors.html
│   ├── contact.html
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── assets/
│       ├── documents/
│       ├── images/
│       └── logos/
├── server/
│   ├── config/
│   │   ├── env.js
│   │   └── mailer.js
│   ├── routes/
│   │   └── contactRoutes.js
│   ├── utils/
│   │   ├── contactAbuseGuard.js
│   │   ├── contactLogger.js
│   │   ├── errors.js
│   │   ├── hcaptcha.js
│   │   ├── submissionBackup.js
│   │   └── validation.js
│   ├── data/
│   └── logs/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Important Files

- `server.js`
  Starts the application and exits safely on fatal process-level errors.

- `server/server.js`
  Creates the Express app, configures middleware, static serving, API routes, caching, HTTPS enforcement, CORS, and global error handling.

- `server/utils/errors.js`
  Defines the `AppError` class, `asyncHandler`, the 404 handler, and the final centralized error middleware.

- `server/routes/contactRoutes.js`
  Handles contact submissions, validation, captcha verification, duplicate protection, rate limiting, logging, and fallback persistence.

- `server/config/env.js`
  Loads and validates environment variables using `dotenv` and `envalid`.

- `server/config/mailer.js`
  Sends notification and confirmation emails using Nodemailer and Gmail SMTP.

- `public/contact.html`
  Contact page and progressive-enhancement form markup.

- `public/js/script.js`
  Frontend behavior including navigation, animation helpers, hCaptcha bootstrapping, and contact form submission.

## Requirements

Before running the project, install:

- Node.js 18 or newer
- npm

Recommended:

- A Gmail account dedicated to the team website
- A Gmail App Password for SMTP
- hCaptcha site credentials

## Local Setup

### 1. Install Node.js

Download Node.js from the official website, then verify the installation:

```powershell
node -v
npm -v
```

### 2. Open the Project Folder

```powershell
cd "C:\Users\YourName\Desktop\Visionary-Sparks-Website"
```

### 3. Fix PowerShell Execution Policy If Needed

If PowerShell blocks npm scripts, run one of these:

For the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

For the current session only:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

### 4. Install Dependencies

```powershell
npm install
```

### 5. Create the `.env` File

Copy `.env.example` to `.env` and replace the placeholder values.

Example:

```env
NODE_ENV=development
PORT=3000
APP_ORIGIN=http://localhost:3000

EMAIL_USER=your-team-email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_TO=visionarysparksofficial@gmail.com

HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET=your_hcaptcha_secret
HCAPTCHA_VERIFY_URL=https://hcaptcha.com/siteverify
```

### 6. Start the App

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

## Environment Variables

### Required in Production

- `PORT`
  Port used by the Express server

- `APP_ORIGIN`
  Exact allowed frontend origin, for example `https://visionarysparks.org`

- `EMAIL_USER`
  Gmail account used by Nodemailer

- `EMAIL_PASS`
  Gmail App Password for `EMAIL_USER`

- `HCAPTCHA_SITE_KEY`
  Public site key used by the browser

- `HCAPTCHA_SECRET`
  Secret key used by the backend to verify captcha responses

### Optional

- `EMAIL_TO`
  Inbox that receives team notification emails. If not set, the app falls back to the default team inbox.

- `HCAPTCHA_VERIFY_URL`
  Verification URL for hCaptcha. The default is already correct for standard hCaptcha usage.

## Contact Form Setup

The contact form depends on both Gmail SMTP and hCaptcha.

### Gmail SMTP Setup

1. Use a Gmail account controlled by the team
2. Turn on 2-Step Verification for that account
3. Generate a Gmail App Password
4. Put the Gmail address in `EMAIL_USER`
5. Put the App Password in `EMAIL_PASS`
6. Set `EMAIL_TO` to the inbox that should receive team notifications

### hCaptcha Setup

1. Create an hCaptcha account
2. Create a site key and secret
3. Add your development and production domains to the hCaptcha allowed hostnames
4. Set `HCAPTCHA_SITE_KEY`
5. Set `HCAPTCHA_SECRET`

### How the Form Works

Frontend:

- Loads the contact page
- Fetches `/api/contact-config`
- Renders the hCaptcha widget
- Validates core fields in the browser
- Sends the form to `/api/contact`

Backend:

- Normalizes the request payload
- Accepts either `hcaptchaToken` or the standard `h-captcha-response`
- Applies request rate limiting
- Validates and sanitizes fields
- Verifies the captcha server-side
- Rejects recent duplicate submissions
- Logs a privacy-safe entry with a hashed email
- Sends the email through Nodemailer
- Saves a fallback NDJSON record if email delivery fails

## API Documentation

### `GET /api/health`

Health check endpoint.

Example response:

```json
{
  "success": true,
  "status": "ok"
}
```

### `GET /api/contact-config`

Returns whether hCaptcha is available and, when configured, the public site key.

Example response:

```json
{
  "success": true,
  "hcaptchaConfigured": true,
  "hcaptchaSiteKey": "your-public-site-key"
}
```

### `POST /api/contact`

Primary contact form endpoint.

The legacy `/contact` POST route still works for backward compatibility, but `/api/contact` is the canonical API path.

Accepted fields:

- `fname`
- `lname`
- `email`
- `subject`
- `message`
- `website` (honeypot field, must stay empty)
- `hcaptchaToken`

The backend also accepts the standard hCaptcha field:

- `h-captcha-response`

Supported `subject` values:

- `join`
- `sponsor`
- `outreach`
- `media`
- `other`

Success response:

```json
{
  "success": true
}
```

Validation error response:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address."
    }
  ]
}
```

Other common error codes:

- `INVALID_CAPTCHA`
- `RATE_LIMITED`
- `PAYLOAD_TOO_LARGE`
- `SERVICE_MISCONFIGURED`
- `UPSTREAM_ERROR`
- `NOT_FOUND`
- `INTERNAL_ERROR`

## Error Handling Architecture

This project uses a centralized error handling system.

### `AppError`

Custom operational errors are represented by `AppError`.

Each `AppError` can include:

- `statusCode`
- `code`
- `message`
- `details`
- `expose`
- `resetCaptcha`
- `fallbackSaved`

### `asyncHandler`

Async routes are wrapped with `asyncHandler` so promise rejections always flow into the final Express error middleware.

### Final Error Middleware

The last middleware in the app:

- normalizes unexpected errors to `INTERNAL_ERROR`
- returns JSON only
- does not leak stack traces to users
- returns structured `errors` arrays for validation failures

### 404 Handling

Unknown routes return:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Route not found"
}
```

### Process-Level Safety

The root `server.js` file handles:

- `unhandledRejection`
- `uncaughtException`

If either happens, the process logs the failure and exits instead of continuing in a bad state.

## Security Features Implemented

- `helmet()` with Content Security Policy
- `app.disable('x-powered-by')`
- Strict CORS allowlist based on `APP_ORIGIN`
- Allows no-origin requests for curl and server-to-server tooling
- `trust proxy` enabled in production
- HTTP to HTTPS redirect in production
- `express.json()` and `express.urlencoded()` request size limits
- hCaptcha verification
- Rate limiting on contact submissions
- Duplicate submission protection
- Centralized error handling
- No stack trace leakage in responses
- `.env` and `.env.*` ignored by Git
- Contact email hashing with SHA-256 in logs
- Restrictive `0o600` file permissions for sensitive runtime files

## Static Asset Caching

The server is configured to:

- Cache `/assets` for 30 days with `immutable`
- Cache other static files for about 1 hour
- Disable caching for HTML entry pages

## Deployment Guide

This project is best suited for platforms that run a persistent Node.js web service.

Recommended options:

- Render
- Railway
- Fly.io

### Production Checklist

1. Push the repository to GitHub
2. Create a Node.js web service
3. Set the build command:

```text
npm install
```

4. Set the start command:

```text
npm start
```

5. Add production environment variables:

- `NODE_ENV=production`
- `PORT`
- `APP_ORIGIN=https://visionarysparks.org`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_TO`
- `HCAPTCHA_SITE_KEY`
- `HCAPTCHA_SECRET`

6. Deploy the app
7. Verify:
   - page load
   - HTTPS redirect
   - contact form
   - hCaptcha
   - email delivery

## Custom Domain Notes

If the production domain is `visionarysparks.org`:

- Point DNS to the hosting provider
- Enable HTTPS
- Keep `APP_ORIGIN` set to the final canonical HTTPS origin

If you deploy under a different domain, update:

- `APP_ORIGIN`
- canonical tags
- Open Graph URLs
- `public/robots.txt`
- `public/sitemap.xml`

## Accessibility Notes

Current accessibility-focused improvements include:

- keyboard-visible focus styling
- form labels
- live regions for form status updates
- reduced-motion support
- semantic headings improved on the hero sections

Recommended ongoing checks:

- test keyboard navigation on every page
- test with a screen reader
- verify contrast after future design changes

## Performance Recommendations

The backend is already using compression and static caching, but the largest performance gains will come from asset optimization.

High-impact recommendations:

- convert large team photos to WebP or AVIF
- export a much smaller navbar/footer logo
- resize oversized images before upload
- keep the sponsorship packet optimized for download size

Assets that should be reviewed first:

- `public/assets/images/anukampa-sharma.png`
- `public/assets/images/terleah-wright.jpeg`
- `public/assets/images/tarvaris-arrington.jpeg`
- `public/assets/images/christopher-williams.jpeg`
- `public/assets/images/mr-l-malonzo.jpeg`
- `public/assets/logos/visionary-sparks-logo.png`

## Maintainability Notes

The current static frontend works well for a small site, but there is repeated navigation and footer markup across multiple HTML pages.

If the site grows, a good next step would be to move repeated page chrome into partials or templates using a light server-side or build-time tool such as:

- EJS
- Nunjucks
- Eleventy
- a small static site build step

This is only a recommendation. The current version intentionally keeps the frontend structure simple.

## Troubleshooting

### `Cannot GET /`

Make sure the Node server is running:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

### npm / PowerShell Script Errors

Use:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

or:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

### Contact Form Does Not Submit

Check:

- `APP_ORIGIN` matches the URL you are using
- hCaptcha is configured
- Gmail App Password is correct
- the server is running
- browser console and server logs for errors

### hCaptcha Loads but Submissions Fail

Check:

- domain allowlist in hCaptcha
- `HCAPTCHA_SECRET`
- the server can reach `https://hcaptcha.com/siteverify`

### Email Delivery Fails

Check:

- Gmail credentials
- App Password validity
- host environment variable configuration
- SMTP/network restrictions on the hosting provider

## Future Improvements

- move contact rate limiting to a shared external store for horizontally scaled deployments
- move fallback submission backups to durable hosted storage
- add automated tests for the contact flow
- add CI checks for HTML, accessibility, and security regressions
- optimize image assets and sponsor media

## License

This project currently uses the ISC license defined in `package.json`.
