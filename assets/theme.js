/* ============================================
   DeskPaws — Theme JS
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     PAGE LOADER
  ------------------------------------------ */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) loader.classList.add('hidden');
      document.body.classList.remove('page-loading');
      initRevealObserver();
      initCounterObserver();
    }, 1800);
  });

  /* ------------------------------------------
     HEADER SCROLL BEHAVIOUR
  ------------------------------------------ */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ------------------------------------------
     CAT CURSOR TRACKING
  ------------------------------------------ */
  const catScene = document.getElementById('cat-scene');
  const headGroup = document.getElementById('cat-head-group');
  const leftPupil = document.getElementById('left-pupil');
  const rightPupil = document.getElementById('right-pupil');
  const leftShine1 = document.getElementById('left-shine-1');
  const leftShine2 = document.getElementById('left-shine-2');
  const rightShine1 = document.getElementById('right-shine-1');
  const rightShine2 = document.getElementById('right-shine-2');
  const blinkOverlay = document.getElementById('blink-overlay');

  const HEAD_ORIGIN = { x: 236, y: 206 };
  const LEFT_EYE_CENTER  = { x: 218, y: 188 };
  const RIGHT_EYE_CENTER = { x: 254, y: 188 };
  const MAX_PUPIL = 4;
  const MAX_HEAD_ROT = 6;

  let targetHeadRot = 0;
  let currentHeadRot = 0;
  let targetLeftPupil  = { x: 0, y: 0 };
  let targetRightPupil = { x: 0, y: 0 };
  let currentLeftPupil  = { x: 0, y: 0 };
  let currentRightPupil = { x: 0, y: 0 };
  let blinkTimeout;
  let isBlinking = false;

  function svgPoint(evt) {
    if (!catScene) return null;
    const rect = catScene.getBoundingClientRect();
    const vb = catScene.viewBox.baseVal;
    const scaleX = vb.width  / rect.width;
    const scaleY = vb.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX + vb.x,
      y: (evt.clientY - rect.top)  * scaleY + vb.y,
    };
  }

  function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function pupilOffset(eyeCenter, svgMouse, maxOffset) {
    const dx = svgMouse.x - eyeCenter.x;
    const dy = svgMouse.y - eyeCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return { x: 0, y: 0 };
    const ratio = Math.min(dist, 80) / 80;
    return {
      x: clamp((dx / dist) * maxOffset * ratio, -maxOffset, maxOffset),
      y: clamp((dy / dist) * maxOffset * ratio, -maxOffset, maxOffset),
    };
  }

  window.addEventListener('mousemove', (e) => {
    if (!catScene) return;
    const pt = svgPoint(e);
    if (!pt) return;

    const dx = pt.x - HEAD_ORIGIN.x;
    const dy = pt.y - HEAD_ORIGIN.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const headTilt = clamp((dx / Math.max(dist, 1)) * MAX_HEAD_ROT, -MAX_HEAD_ROT, MAX_HEAD_ROT);
    targetHeadRot = headTilt;

    targetLeftPupil  = pupilOffset(LEFT_EYE_CENTER,  pt, MAX_PUPIL);
    targetRightPupil = pupilOffset(RIGHT_EYE_CENTER, pt, MAX_PUPIL);
  }, { passive: true });

  function animateCat() {
    const ease = 0.08;

    currentHeadRot = lerp(currentHeadRot, targetHeadRot, ease);
    currentLeftPupil.x  = lerp(currentLeftPupil.x,  targetLeftPupil.x,  ease);
    currentLeftPupil.y  = lerp(currentLeftPupil.y,  targetLeftPupil.y,  ease);
    currentRightPupil.x = lerp(currentRightPupil.x, targetRightPupil.x, ease);
    currentRightPupil.y = lerp(currentRightPupil.y, targetRightPupil.y, ease);

    if (headGroup) {
      headGroup.style.transform = `rotate(${currentHeadRot}deg)`;
    }

    if (leftPupil) {
      leftPupil.setAttribute('cx', 218 + currentLeftPupil.x);
      leftPupil.setAttribute('cy', 188 + currentLeftPupil.y);
      leftShine1.setAttribute('cx', 220 + currentLeftPupil.x * 0.5);
      leftShine1.setAttribute('cy', 184 + currentLeftPupil.y * 0.5);
      leftShine2.setAttribute('cx', 215 + currentLeftPupil.x * 0.5);
      leftShine2.setAttribute('cy', 191 + currentLeftPupil.y * 0.5);
    }
    if (rightPupil) {
      rightPupil.setAttribute('cx', 254 + currentRightPupil.x);
      rightPupil.setAttribute('cy', 188 + currentRightPupil.y);
      rightShine1.setAttribute('cx', 256 + currentRightPupil.x * 0.5);
      rightShine1.setAttribute('cy', 184 + currentRightPupil.y * 0.5);
      rightShine2.setAttribute('cx', 251 + currentRightPupil.x * 0.5);
      rightShine2.setAttribute('cy', 191 + currentRightPupil.y * 0.5);
    }

    requestAnimationFrame(animateCat);
  }

  requestAnimationFrame(animateCat);

  /* Random blink */
  function scheduleBlink() {
    blinkTimeout = setTimeout(() => {
      if (!isBlinking && blinkOverlay) {
        isBlinking = true;
        blinkOverlay.style.transition = 'opacity 0.06s ease';
        blinkOverlay.style.opacity = '1';
        setTimeout(() => {
          blinkOverlay.style.opacity = '0';
          isBlinking = false;
        }, 120);
      }
      scheduleBlink();
    }, 2000 + Math.random() * 4000);
  }
  scheduleBlink();

  /* ------------------------------------------
     TOUCH: move pupils on touch
  ------------------------------------------ */
  window.addEventListener('touchmove', (e) => {
    if (!catScene || !e.touches[0]) return;
    const t = e.touches[0];
    const fakeEvt = { clientX: t.clientX, clientY: t.clientY };
    const pt = svgPoint(fakeEvt);
    if (!pt) return;
    const dx = pt.x - HEAD_ORIGIN.x;
    const dy = pt.y - HEAD_ORIGIN.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    targetHeadRot = clamp((dx / Math.max(dist, 1)) * MAX_HEAD_ROT, -MAX_HEAD_ROT, MAX_HEAD_ROT);
    targetLeftPupil  = pupilOffset(LEFT_EYE_CENTER,  pt, MAX_PUPIL);
    targetRightPupil = pupilOffset(RIGHT_EYE_CENTER, pt, MAX_PUPIL);
  }, { passive: true });

  /* ------------------------------------------
     PRODUCT 3D CARD TILT
  ------------------------------------------ */
  const product3d = document.getElementById('product3d');
  if (product3d) {
    product3d.addEventListener('mousemove', (e) => {
      const rect = product3d.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * -14;
      const ry = ((e.clientX - cx) / rect.width)  *  14;
      product3d.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });
    product3d.addEventListener('mouseleave', () => {
      product3d.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
      product3d.style.transition = 'transform 0.5s ease';
    });
    product3d.addEventListener('mouseenter', () => {
      product3d.style.transition = 'transform 0.1s ease';
    });
  }

  /* ------------------------------------------
     COLOR SWATCHES (showcase)
  ------------------------------------------ */
  const swatches = document.querySelectorAll('.swatch');
  const colorName = document.getElementById('color-name');
  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      if (colorName) colorName.textContent = sw.dataset.color;
    });
  });

  /* ------------------------------------------
     COLOR SWATCHES (buy section)
  ------------------------------------------ */
  const vswatches = document.querySelectorAll('.vswatch');
  const selectedColorBuy = document.getElementById('selected-color-buy');
  vswatches.forEach(sw => {
    sw.addEventListener('click', () => {
      vswatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      if (selectedColorBuy) selectedColorBuy.textContent = sw.dataset.color;
    });
  });

  /* ------------------------------------------
     QUANTITY CONTROL
  ------------------------------------------ */
  const qtyMinus   = document.getElementById('qty-minus');
  const qtyPlus    = document.getElementById('qty-plus');
  const qtyDisplay = document.getElementById('qty-display');
  const addToCart  = document.getElementById('add-to-cart-btn');

  let qty = 1;

  function updateQty(n) {
    qty = Math.max(1, Math.min(10, n));
    if (qtyDisplay) qtyDisplay.textContent = qty;
    if (addToCart) {
      addToCart.querySelector('span') && (addToCart.querySelector('span') || addToCart).childNodes;
      const price = 89 * qty;
      addToCart.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 2L3 6v14a2 2 0 002 2h10a2 2 0 002-2V6l-3-4zM3 6h14M13 10a3 3 0 01-6 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Add to Cart — $${price}`;
    }
  }

  if (qtyMinus) qtyMinus.addEventListener('click', () => updateQty(qty - 1));
  if (qtyPlus)  qtyPlus.addEventListener('click',  () => updateQty(qty + 1));

  if (addToCart) {
    addToCart.addEventListener('click', () => {
      addToCart.style.transform = 'scale(0.96)';
      addToCart.textContent = '✓ Added to cart!';
      addToCart.style.background = '#2D6B2F';
      setTimeout(() => {
        updateQty(qty);
        addToCart.style.transform = '';
        addToCart.style.background = '';
      }, 2000);
    });
  }

  /* ------------------------------------------
     SCROLL REVEAL (Intersection Observer)
  ------------------------------------------ */
  function initRevealObserver() {
    const targets = document.querySelectorAll(
      '.reveal-up, .reveal-scale, .reveal-card, .reveal-step'
    );

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));

    /* Rating bars */
    const ratingSection = document.querySelector('.reviews-summary');
    if (ratingSection) {
      const ratingIO = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          document.querySelectorAll('.bar-fill').forEach(bar => {
            bar.style.width = bar.style.width || bar.parentElement.dataset.w + '%';
          });
          ratingIO.disconnect();
        }
      }, { threshold: 0.5 });
      ratingIO.observe(ratingSection);
    }

    /* Steps progress line */
    const stepsLine = document.getElementById('steps-line-fill');
    const stepsContainer = document.querySelector('.steps-container');
    if (stepsLine && stepsContainer) {
      const stepsIO = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          stepsLine.style.height = '100%';
        }
      }, { threshold: 0.1 });
      stepsIO.observe(stepsContainer);
    }
  }

  /* ------------------------------------------
     COUNTER ANIMATION
  ------------------------------------------ */
  function initCounterObserver() {
    const counters = document.querySelectorAll('[data-count-to]');

    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(el => counterIO.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ------------------------------------------
     NEWSLETTER FORM
  ------------------------------------------ */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterSuccess = document.getElementById('newsletter-success');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newsletterForm.style.display = 'none';
      if (newsletterSuccess) newsletterSuccess.classList.add('show');
    });
  }

  /* ------------------------------------------
     SMOOTH SCROLL for anchor links
  ------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ------------------------------------------
     PARTICLES - randomise on init
  ------------------------------------------ */
  document.querySelectorAll('.particle').forEach(p => {
    const tx = (Math.random() - 0.5) * 80;
    p.style.setProperty('--tx', `${tx}px`);
    p.style.left = `${Math.random() * 100}%`;
    p.style.top  = `${20 + Math.random() * 60}%`;
    const size = 3 + Math.random() * 6;
    p.style.width  = `${size}px`;
    p.style.height = `${size}px`;
    const hue = 20 + Math.random() * 30;
    p.style.background = `hsl(${hue}, 75%, 65%)`;
  });

  /* ------------------------------------------
     MOBILE MENU
  ------------------------------------------ */
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.header-nav');
  let menuOpen = false;

  if (mobileBtn && nav) {
    mobileBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      nav.style.display = menuOpen ? 'flex' : '';
      nav.style.flexDirection = menuOpen ? 'column' : '';
      nav.style.position = menuOpen ? 'fixed' : '';
      nav.style.top = menuOpen ? '68px' : '';
      nav.style.left = menuOpen ? '0' : '';
      nav.style.right = menuOpen ? '0' : '';
      nav.style.background = menuOpen ? 'var(--cream)' : '';
      nav.style.padding = menuOpen ? '24px' : '';
      nav.style.boxShadow = menuOpen ? 'var(--shadow-md)' : '';
      nav.style.zIndex = menuOpen ? '99' : '';
      const spans = mobileBtn.querySelectorAll('span');
      if (menuOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (menuOpen) mobileBtn.click();
      });
    });
  }

  /* ------------------------------------------
     PARALLAX on hero orbs
  ------------------------------------------ */
  const orbs = document.querySelectorAll('.hero-orb');
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = 0.2 + i * 0.1;
      orb.style.transform = `translate(0, ${sy * speed}px)`;
    });
  }, { passive: true });

  /* ------------------------------------------
     SCROLL PROGRESS BAR
  ------------------------------------------ */
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = `${Math.min((window.scrollY / max) * 100, 100)}%`;
    }, { passive: true });
  }

  /* ------------------------------------------
     HERO MOUSE PARALLAX
  ------------------------------------------ */
  const heroSection  = document.querySelector('.hero');
  const heroTextEl   = document.querySelector('.hero-text');
  let heroParallaxX  = 0, heroParallaxY  = 0;
  let heroCurrentX   = 0, heroCurrentY   = 0;
  let heroRafRunning = false;

  function lerpHeroParallax() {
    heroCurrentX += (heroParallaxX - heroCurrentX) * 0.07;
    heroCurrentY += (heroParallaxY - heroCurrentY) * 0.07;
    if (heroTextEl) {
      heroTextEl.style.transform = `translate(${heroCurrentX}px, ${heroCurrentY}px)`;
    }
    requestAnimationFrame(lerpHeroParallax);
  }

  if (heroSection && heroTextEl) {
    requestAnimationFrame(lerpHeroParallax);
    heroSection.addEventListener('mousemove', (e) => {
      const r = heroSection.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      heroParallaxX = x * -14;
      heroParallaxY = y * -8;
    }, { passive: true });
    heroSection.addEventListener('mouseleave', () => {
      heroParallaxX = 0;
      heroParallaxY = 0;
    });
  }

  /* ------------------------------------------
     MAGNETIC BUTTONS
  ------------------------------------------ */
  document.querySelectorAll('.btn--primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.willChange  = 'transform';
      btn.style.transition  = 'box-shadow 0.2s ease'; // no transform transition while tracking
    });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition  = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease';
      btn.style.transform   = '';
      btn.style.willChange  = '';
      setTimeout(() => { btn.style.transition = ''; }, 560);
    });
  });

  /* ------------------------------------------
     WHY-CARD 3-D TILT
  ------------------------------------------ */
  document.querySelectorAll('.why-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.12s ease, box-shadow 0.3s ease';
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) / r.width;
      const y = (e.clientY - r.top  - r.height / 2) / r.height;
      card.style.transform =
        `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-5px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.55s var(--ease-spring), box-shadow 0.3s ease';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 560);
    });
  });

  /* ------------------------------------------
     AMBIENT PAGE PARTICLES
     Fixed viewport layer — glow dots + hearts
     visible throughout the whole scroll journey
  ------------------------------------------ */
  (function () {
    const layer = document.createElement('div');
    layer.className = 'gp-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    for (let i = 0; i < 85; i++) {
      const isHeart = i % 3 === 0;
      const el      = document.createElement('span');
      el.className  = isHeart ? 'gp gp--heart' : 'gp gp--dot';
      if (isHeart) el.textContent = '♥';

      el.style.left = (2  + Math.random() * 96).toFixed(1) + '%';
      el.style.top  = (0.5 + Math.random() * 99).toFixed(1) + '%';

      const dur = (5  + Math.random() * 9).toFixed(1);
      const del = (-(Math.random() * 14)).toFixed(1);
      el.style.animationDuration = dur + 's';
      el.style.animationDelay   = del + 's';

      if (!isHeart) {
        const sz = (3 + Math.random() * 5).toFixed(1);
        el.style.width  = sz + 'px';
        el.style.height = sz + 'px';
      } else {
        el.style.fontSize = (0.35 + Math.random() * 0.28).toFixed(2) + 'rem';
      }

      layer.appendChild(el);
    }
  })();

})();
