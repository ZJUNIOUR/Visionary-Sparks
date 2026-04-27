'use strict';

const CONTACT_API_ENDPOINT = '/api/contact';

function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
    return;
  }

  callback();
}

ready(() => {
  initNav();
  initReveal();
  initHeroAnimations();
  initCounters();
  initParticles();
  initActivePage();
  initFooterYear();
  initContactForm();
});

function initNav() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!header || !toggle || !navLinks) {
    return;
  }

  const setScrolledState = () => {
    header.classList.toggle('scrolled', window.scrollY > 18);
  };

  const closeMenu = () => {
    navLinks.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });

  window.addEventListener('scroll', setScrolledState, { passive: true });
  setScrolledState();
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');

  if (!items.length) {
    return;
  }

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  items.forEach((item) => observer.observe(item));
}

function initHeroAnimations() {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.animate-in').forEach((element) => {
      element.classList.add('loaded');
    });
    return;
  }

  document.querySelectorAll('.animate-in').forEach((element) => {
    const delayIndex = Number(element.dataset.delay || 0);
    element.style.animationDelay = `${delayIndex * 0.12}s`;

    window.setTimeout(() => {
      element.classList.add('loaded');
    }, 40);
  });
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');

  if (!counters.length) {
    return;
  }

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    counters.forEach((counter) => {
      counter.textContent = Number(counter.dataset.target || 0);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(element) {
  const target = Number(element.dataset.target || 0);
  const start = performance.now();
  const duration = 1600;

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);

    if (progress < 1) {
      window.requestAnimationFrame(update);
    }
  }

  window.requestAnimationFrame(update);
}

function initParticles() {
  const container = document.getElementById('hero-particles');

  if (!container || prefersReducedMotion()) {
    return;
  }

  const count = window.innerWidth < 820 ? 18 : 36;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    const size = Math.random() * 2.4 + 1;
    const duration = Math.random() * 12 + 10;
    const delay = Math.random() * 8;

    particle.style.cssText = [
      'position:absolute',
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `width:${size}px`,
      `height:${size}px`,
      'border-radius:999px',
      `background:${Math.random() > 0.5 ? '#00d4ff' : '#ff6b2b'}`,
      `opacity:${Math.random() * 0.45 + 0.12}`,
      `animation:particle-drift ${duration}s ${delay}s ease-in-out infinite alternate`
    ].join(';');

    container.appendChild(particle);
  }

  if (!document.getElementById('particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes particle-drift {
        0% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(${randomOffset(30)}px, ${randomOffset(36)}px, 0) scale(1.2); }
        100% { transform: translate3d(${randomOffset(40)}px, ${randomOffset(24)}px, 0) scale(0.85); }
      }
    `;
    document.head.appendChild(style);
  }
}

function randomOffset(max) {
  return (Math.random() - 0.5) * max * 2;
}

function initActivePage() {
  const page = document.body.dataset.page;

  if (!page) {
    return;
  }

  document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
    const isActive = link.dataset.page === page;
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function initFooterYear() {
  const year = document.getElementById('footer-year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const notice = document.getElementById('form-notice');

  if (!form || !notice) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const captchaContainer = document.getElementById('hcaptcha-container');
  const captchaHelp = document.getElementById('captcha-help');
  const captchaTokenInput = document.getElementById('hcaptcha-token');
  const defaultLabel = submitButton ? submitButton.textContent : 'Send Message';
  const endpoint = form.getAttribute('action') || CONTACT_API_ENDPOINT;
  const captchaState = {
    configured: false,
    widgetId: null
  };

  if (submitButton) {
    submitButton.disabled = true;
  }

  initCaptchaProtection(captchaState, captchaContainer, captchaHelp, submitButton, captchaTokenInput).catch((error) => {
    if (captchaHelp) {
      captchaHelp.textContent = error.message || 'Unable to load the security verification right now.';
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!captchaState.configured) {
      showNotice(
        notice,
        'error',
        'Security protection is not ready yet. Please complete the hCaptcha setup and try again.'
      );
      return;
    }

    const hcaptchaToken = getCaptchaResponse(captchaState.widgetId);

    if (!hcaptchaToken) {
      showNotice(notice, 'error', 'Please complete the hCaptcha challenge before sending your message.');
      return;
    }

    if (captchaTokenInput) {
      captchaTokenInput.value = hcaptchaToken;
    }

    const payload = {
      fname: form.fname.value.trim(),
      lname: form.lname.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value.trim(),
      hcaptchaToken
    };

    const validationError = validateContactPayload(payload);

    if (validationError) {
      showNotice(notice, 'error', validationError);
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    showNotice(notice, 'info', 'Sending...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (data.resetCaptcha) {
          resetCaptcha(captchaState.widgetId, captchaTokenInput);
        }

        if (data.fallbackSaved) {
          throw new Error(
            'We received your message, but email delivery had a temporary issue. Your submission was saved and the team will follow up manually.'
          );
        }

        throw new Error(getApiErrorMessage(data));
      }

      showNotice(notice, 'success', 'Message sent! We will get back to you soon.');
      form.reset();
      resetCaptcha(captchaState.widgetId, captchaTokenInput);
    } catch (error) {
      showNotice(notice, 'error', error.message || 'Something went wrong. Please try again.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    }
  });
}

function validateContactPayload({ fname, lname, email, subject, message }) {
  if (!fname || !lname) {
    return 'Please enter your first and last name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }

  if (!subject) {
    return 'Please choose a subject.';
  }

  if (message.length < 10) {
    return 'Please tell us a little more in your message.';
  }

  if (message.length > 1000) {
    return 'Please keep your message under 1000 characters.';
  }

  return '';
}

function showNotice(notice, type, message) {
  notice.className = `form-notice ${type}`;
  notice.textContent = message;
}

async function initCaptchaProtection(state, container, helpText, submitButton, hiddenInput) {
  if (!container || !helpText || !submitButton) {
    return;
  }

  helpText.textContent = 'Loading hCaptcha protection...';

  const config = await fetchContactConfig();

  if (!config.hcaptchaConfigured || !config.hcaptchaSiteKey) {
    helpText.textContent =
      'Security verification is temporarily unavailable. Please try again later.';
    submitButton.disabled = true;
    return;
  }

  const hcaptcha = await waitForHCaptcha();

  state.widgetId = hcaptcha.render(container, {
    sitekey: config.hcaptchaSiteKey,
    theme: 'dark',
    callback() {
      if (hiddenInput) {
        hiddenInput.value = getCaptchaResponse(state.widgetId);
      }
      helpText.textContent = 'Security check complete. You can send your message.';
    },
    'expired-callback'() {
      if (hiddenInput) {
        hiddenInput.value = '';
      }
      helpText.textContent = 'The hCaptcha challenge expired. Please complete it again.';
    },
    'error-callback'() {
      if (hiddenInput) {
        hiddenInput.value = '';
      }
      helpText.textContent = 'The hCaptcha challenge could not load. Refresh the page and try again.';
    }
  });

  state.configured = true;
  helpText.textContent = 'Please complete the hCaptcha challenge before sending your message.';
  submitButton.disabled = false;
}

async function fetchContactConfig() {
  const response = await fetch('/api/contact-config', {
    headers: {
      Accept: 'application/json'
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error('Unable to load the contact form security settings.');
  }

  return data;
}

function waitForHCaptcha(timeoutMs = 10000) {
  if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
    return Promise.resolve(window.hcaptcha);
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timer = window.setInterval(() => {
      if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
        window.clearInterval(timer);
        resolve(window.hcaptcha);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error('hCaptcha did not finish loading.'));
      }
    }, 100);
  });
}

function getCaptchaResponse(widgetId) {
  if (widgetId === null || !window.hcaptcha || typeof window.hcaptcha.getResponse !== 'function') {
    return '';
  }

  return window.hcaptcha.getResponse(widgetId);
}

function resetCaptcha(widgetId, hiddenInput) {
  if (widgetId === null || !window.hcaptcha || typeof window.hcaptcha.reset !== 'function') {
    if (hiddenInput) {
      hiddenInput.value = '';
    }
    return;
  }

  window.hcaptcha.reset(widgetId);

  if (hiddenInput) {
    hiddenInput.value = '';
  }
}

function getApiErrorMessage(data) {
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((error) => error.message).join(' ');
  }

  return data.message || 'Unable to send your message right now.';
}

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
