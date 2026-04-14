/* ================================================================
   VISIONARY SPARKS · FRC TEAM 11353
   script.js — Interactions & Animations
   ================================================================ */

'use strict';

// ----------------------------------------------------------------
// 1. DOM READY HELPER
// ----------------------------------------------------------------
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(function () {
  initNav();
  initHeroAnimations();
  initScrollReveal();
  initCounters();
  initParticles();
  initContactForm();
  initFooterYear();
  initActiveNavHighlight();
});


// ----------------------------------------------------------------
// 2. NAVIGATION: sticky, mobile toggle, active link
// ----------------------------------------------------------------
function initNav() {
  const header  = document.getElementById('site-header');
  const toggle  = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-links');

  // Sticky header class on scroll
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Mobile hamburger
  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a nav link is clicked
    navList.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navList.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        navList.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}


// ----------------------------------------------------------------
// 3. HERO SECTION: staggered entrance animation
// ----------------------------------------------------------------
function initHeroAnimations() {
  const items = document.querySelectorAll('.animate-in');
  // Stagger each item based on its data-delay attribute
  items.forEach(function (el) {
    const delay = parseFloat(el.getAttribute('data-delay') || '0') * 0.15;
    el.style.animationDelay = delay + 's';
    // Trigger after a very short timeout so CSS transition fires
    setTimeout(function () {
      el.classList.add('loaded');
    }, 50);
  });
}


// ----------------------------------------------------------------
// 4. SCROLL REVEAL: Intersection Observer for .reveal elements
// ----------------------------------------------------------------
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements if observer not supported
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after revealing to save memory
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });

  // Stagger child elements within team-grid, outreach-grid, robots-grid
  staggerChildren('.team-grid',     '.member-card',   0.08);
  staggerChildren('.outreach-grid', '.outreach-card', 0.09);
  staggerChildren('.about-values',  '.value-card',    0.1);
  staggerChildren('.robots-grid',   '.robot-card',    0.12);
}

/**
 * Adds a staggered transition-delay to children so they cascade in.
 */
function staggerChildren(parentSel, childSel, step) {
  document.querySelectorAll(parentSel).forEach(function (parent) {
    parent.querySelectorAll(childSel).forEach(function (child, i) {
      child.style.transitionDelay = (i * step) + 's';
    });
  });
}


// ----------------------------------------------------------------
// 5. ANIMATED COUNTERS for hero stats
// ----------------------------------------------------------------
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(function (el) {
    observer.observe(el);
  });
}

function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-target'), 10);
  const duration = 1800; // ms
  const start    = performance.now();

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }

  requestAnimationFrame(tick);
}


// ----------------------------------------------------------------
// 6. HERO PARTICLE FIELD
// ----------------------------------------------------------------
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  // Reduce count on mobile for performance
  const isMobile  = window.innerWidth < 768;
  const count     = isMobile ? 20 : 45;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const p  = document.createElement('div');
    const sz = Math.random() * 2.5 + 0.5;
    const x  = Math.random() * 100;
    const y  = Math.random() * 100;
    const dur  = Math.random() * 12 + 8;
    const delay = Math.random() * 10;

    p.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${sz}px;
      height: ${sz}px;
      border-radius: 50%;
      background: ${Math.random() > 0.6 ? '#00d4ff' : '#ff6b2b'};
      opacity: ${Math.random() * 0.5 + 0.1};
      animation: particle-drift ${dur}s ${delay}s ease-in-out infinite alternate;
      pointer-events: none;
      box-shadow: 0 0 ${sz * 3}px currentColor;
    `;

    container.appendChild(p);
    particles.push(p);
  }

  // Inject keyframes for particle drift if not already present
  if (!document.getElementById('particle-keyframes')) {
    const style  = document.createElement('style');
    style.id     = 'particle-keyframes';
    style.textContent = `
      @keyframes particle-drift {
        0%   { transform: translate(0, 0) scale(1); }
        33%  { transform: translate(${rnd(20)}px, ${rnd(30)}px) scale(${Math.random() * 0.5 + 0.8}); }
        66%  { transform: translate(${rnd(30)}px, ${rnd(20)}px) scale(${Math.random() * 0.5 + 1}); }
        100% { transform: translate(${rnd(25)}px, ${rnd(25)}px) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

function rnd(max) {
  return (Math.random() - 0.5) * max * 2;
}


// ----------------------------------------------------------------
// 7. CONTACT FORM: validation & Netlify Forms submit
// ----------------------------------------------------------------
function initContactForm() {
  const form   = document.getElementById('contact-form');
  const notice = document.getElementById('form-notice');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    notice.className = 'form-notice';
    notice.textContent = '';

    const fname   = form.fname.value.trim();
    const lname   = form.lname.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();

    // Simple validation
    if (!fname || !lname) {
      showNotice('error', '\u26A0 Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      showNotice('error', '\u26A0 Please enter a valid email address.');
      return;
    }
    if (message.length < 10) {
      showNotice('error', '\u26A0 Your message is too short. Please tell us more!');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026';

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(function (response) {
        if (response.ok) {
          showNotice('success', '\u2713 Message sent! We\'ll get back to you within 48 hours.');
          form.reset();
        } else {
          showNotice('error', '\u26A0 Something went wrong. Please try again.');
        }
      })
      .catch(function () {
        showNotice('error', '\u26A0 Network error. Please check your connection and try again.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });

  function showNotice(type, msg) {
    notice.className = 'form-notice ' + type;
    notice.textContent = msg;
    notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ----------------------------------------------------------------
// 8. FOOTER: dynamic year
// ----------------------------------------------------------------
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}


// ----------------------------------------------------------------
// 9. ACTIVE NAV HIGHLIGHT: highlight nav link for visible section
// ----------------------------------------------------------------
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            const href = link.getAttribute('href').slice(1);
            link.classList.toggle('active', href === id);
          });
        }
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    }
  );

  sections.forEach(function (s) { observer.observe(s); });
}


// ----------------------------------------------------------------
// 10. SMOOTH HOVER TILT for robot cards (subtle 3D effect)
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  const tiltCards = document.querySelectorAll('.robot-card');

  tiltCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      const rect    = card.getBoundingClientRect();
      const x       = e.clientX - rect.left;
      const y       = e.clientY - rect.top;
      const cx      = rect.width  / 2;
      const cy      = rect.height / 2;
      const maxTilt = 4; // degrees

      const rotX = ((y - cy) / cy) * -maxTilt;
      const rotY = ((x - cx) / cx) *  maxTilt;

      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
});
