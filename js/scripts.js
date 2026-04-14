(() => {
  'use strict';

  const prefersReducedMotion = (() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  })();

  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      nav .nav-links a.is-active { color: var(--accent) !important; }
      nav .nav-links a.is-active::after { width: 100%; }
      .ux-float-top {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 1002;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid var(--border-accent);
        background: rgba(17, 17, 20, 0.72);
        backdrop-filter: blur(14px);
        color: var(--text-primary);
        display: grid;
        place-items: center;
        cursor: pointer;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 240ms ease, transform 240ms ease, border-color 240ms ease;
        user-select: none;
      }
      .ux-float-top:hover { border-color: rgba(196,120,90,0.55); }
      .ux-float-top.is-visible { opacity: 1; transform: translateY(0); }
      .ux-kbd-hint {
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 1002;
        font-family: var(--mono);
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        color: rgba(255,255,255,0.55);
        background: rgba(17, 17, 20, 0.62);
        border: 1px solid var(--border);
        backdrop-filter: blur(14px);
        padding: 10px 12px;
        max-width: min(360px, calc(100vw - 36px));
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 240ms ease, transform 240ms ease;
        pointer-events: none;
      }
      .ux-kbd-hint.is-visible { opacity: 1; transform: translateY(0); }
      @media (max-width: 900px) {
        .ux-kbd-hint { display: none; }
      }
    `;
    document.head.appendChild(style);
  };

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  const initReveal = () => {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!revealEls.length) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('visible'));
      return;
    }

    const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, observerOptions);

    revealEls.forEach(el => observer.observe(el));
  };

  const progressBar = document.getElementById('progressBar');
  const imageStrips = document.querySelectorAll('.image-strip .img-block img');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navLinks = Array.from(document.querySelectorAll('nav .nav-links a'));
  const hero = document.getElementById('hero');

  const createBackToTop = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ux-float-top';
    btn.setAttribute('aria-label', 'Top');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5l-7 7m7-7l7 7M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `.trim();
    btn.addEventListener('click', () => {
      const topEl = document.getElementById('hero') || document.body;
      topEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    document.body.appendChild(btn);
    return btn;
  };

  const createKeyboardHint = () => {
    const hint = document.createElement('div');
    hint.className = 'ux-kbd-hint';
    hint.textContent = 'Navigation: ↑ ↓ ← → (and space)';
    document.body.appendChild(hint);
    return hint;
  };

  const setActiveNav = (sectionId) => {
    if (!navLinks.length) return;
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('is-active', isActive);
    });
  };

  const getCurrentSectionId = () => {
    if (!sections.length) return '';
    const scrollY = window.scrollY;
    let current = sections[0].id;
    for (const section of sections) {
      const sectionTop = section.offsetTop - 200;
      if (scrollY >= sectionTop) current = section.id;
    }
    return current;
  };

  const initHeroGlow = () => {
    if (!hero || prefersReducedMotion) return;
    let mouseGlow = null;
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;

    const ensureGlow = () => {
      if (mouseGlow) return mouseGlow;
      mouseGlow = document.createElement('div');
      mouseGlow.style.cssText = `
        position: absolute;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(196,120,90,0.04) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        transition: transform 0.15s ease-out;
      `;
      hero.appendChild(mouseGlow);
      return mouseGlow;
    };

    const commit = () => {
      rafId = 0;
      const glow = ensureGlow();
      glow.style.transform = `translate(${pendingX}px, ${pendingY}px)`;
    };

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      pendingX = e.clientX - rect.left - 250;
      pendingY = e.clientY - rect.top - 250;
      if (!rafId) rafId = window.requestAnimationFrame(commit);
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (mouseGlow) {
        mouseGlow.remove();
        mouseGlow = null;
      }
    });
  };

  let scrollRaf = 0;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;

      if (progressBar) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? clamp01(scrollTop / docHeight) : 0;
        progressBar.style.transform = `scaleX(${progress})`;
      }

      const currentId = getCurrentSectionId();
      if (currentId) setActiveNav(currentId);


      if (backToTopBtn) {
        backToTopBtn.classList.toggle('is-visible', window.scrollY > 420);
      }
      if (kbdHintEl) {
        kbdHintEl.classList.toggle('is-visible', window.scrollY < 120);
      }
    });
  };

  const isEditableTarget = (target) => {
    if (!target || !(target instanceof Element)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A';
  };

  const initKeyboardNav = () => {
    const sectionIds = ['hero', 'context', 'research', 'theory', 'methodology', 'findings', 'conclusion'];
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const feedbackModal = document.getElementById('feedbackModal');
      if (
        feedbackModal?.classList.contains('is-open') &&
        document.activeElement &&
        feedbackModal.contains(document.activeElement)
      ) {
        return;
      }

      if (isEditableTarget(e.target)) return;

      const isNext = e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ';
      const isPrev = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
      if (!isNext && !isPrev) return;

      const scrollPos = window.scrollY + window.innerHeight / 3;
      let currentIdx = 0;
      sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop) currentIdx = i;
      });

      e.preventDefault();
      const targetIdx = isNext
        ? Math.min(currentIdx + 1, sectionIds.length - 1)
        : Math.max(currentIdx - 1, 0);

      const targetEl = document.getElementById(sectionIds[targetIdx]);
      if (targetEl) targetEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  };

  injectStyles();
  initReveal();
  initHeroGlow();
  initKeyboardNav();

  const initBurgerMenu = () => {
    const burger = document.getElementById('navBurger');
    const navLinks = document.getElementById('navLinks');
    if (!burger || !navLinks) return;

    const close = () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
    };

    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!isOpen));
      navLinks.classList.toggle('is-open');
    });

    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) close();
    });
  };

  initBurgerMenu();

  const initImageMarquee = () => {
    const strips = Array.from(document.querySelectorAll('.image-strip'));
    if (!strips.length) return;
    if (prefersReducedMotion) return;

    if (!document.getElementById('uxMarqueeKeyframes')) {
      const style = document.createElement('style');
      style.id = 'uxMarqueeKeyframes';
      style.textContent = `
        @keyframes uxMarqueeScroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(var(--ux-marquee-distance, -50%), 0, 0); }
        }
        .ux-marquee {
          display: block !important;
          overflow: hidden !important;
          position: relative;
          height: var(--ux-marquee-height, 300px);
        }
        @media (max-width: 900px) {
          .ux-marquee { height: var(--ux-marquee-height-mobile, 200px); }
        }
        .ux-marquee-track {
          display: flex;
          flex-wrap: nowrap;
          gap: 0.5rem;
          height: 100%;
          will-change: transform;
          animation: uxMarqueeScroll var(--ux-marquee-duration, 40s) linear infinite;
        }
        .ux-marquee .img-block { flex: 0 0 auto; height: 100%; }
        .ux-marquee .img-block img { height: 100%; width: auto; min-width: 240px; }
        .ux-marquee:hover .ux-marquee-track { animation-play-state: paused; }
      `;
      document.head.appendChild(style);
    }

    const build = (strip) => {
      strip.classList.add('ux-marquee');

      const existingTrack = strip.querySelector(':scope > .ux-marquee-track');
      const track = existingTrack || document.createElement('div');
      track.className = 'ux-marquee-track';

      if (!existingTrack) {
        const blocks = Array.from(strip.querySelectorAll(':scope > .img-block'));
        blocks.forEach(b => track.appendChild(b));
        strip.appendChild(track);
      }

      Array.from(track.querySelectorAll('[data-ux-clone="1"]')).forEach(n => n.remove());

      const baseBlocks = Array.from(track.children)
        .filter(el => el instanceof HTMLElement && el.dataset.uxClone !== '1');
      if (!baseBlocks.length) return;

      let baseWidth = 0;
      baseBlocks.forEach(el => { baseWidth += el.getBoundingClientRect().width; });
      baseWidth = Math.max(1, baseWidth);

      const containerWidth = strip.getBoundingClientRect().width || 1;
      const minTrackWidth = containerWidth * 2 + baseWidth;

      let safety = 0;
      while (track.getBoundingClientRect().width < minTrackWidth && safety < 30) {
        baseBlocks.forEach(el => {
          const clone = el.cloneNode(true);
          if (clone instanceof HTMLElement) clone.dataset.uxClone = '1';
          track.appendChild(clone);
        });
        safety += 1;
      }

      const pxPerSecond = 55;
      const duration = Math.max(10, Math.round(baseWidth / pxPerSecond));

      track.style.setProperty('--ux-marquee-distance', `${-baseWidth}px`);
      track.style.setProperty('--ux-marquee-duration', `${duration}s`);
    };

    const waitForImages = () => {
      const imgs = strips.flatMap(s => Array.from(s.querySelectorAll('img')));
      const pending = imgs.filter(img => !img.complete);
      if (!pending.length) return Promise.resolve();
      return new Promise(resolve => {
        let done = 0;
        const finish = () => {
          done += 1;
          if (done >= pending.length) resolve();
        };
        pending.forEach(img => {
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        });
        window.setTimeout(resolve, 1500);
      });
    };

    const rebuildAll = () => strips.forEach(build);

    waitForImages().then(() => {
      rebuildAll();

      let t = 0;
      window.addEventListener('resize', () => {
        window.clearTimeout(t);
        t = window.setTimeout(rebuildAll, 140);
      }, { passive: true });
    });
  };

  initImageMarquee();

  const initFeedbackModal = () => {
    const modal = document.getElementById('feedbackModal');
    const openBtn = document.getElementById('feedbackOpen');
    const form = document.getElementById('feedbackForm');
    const errEl = document.getElementById('feedbackError');
    const okEl = document.getElementById('feedbackSuccess');
    const submitBtn = document.getElementById('feedbackSubmit');
    const panel = modal?.querySelector('.feedback-modal__panel');
    if (!modal || !openBtn || !form || !panel || !errEl || !okEl || !submitBtn) return;

    const endpoint = 'https://formsubmit.co/ajax/durnevmichael18@gmail.com';
    let lastFocus = null;

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.classList.contains('feedback-modal__hp')) return false;
        return el.getClientRects().length > 0;
      });

    const openModal = () => {
      lastFocus = document.activeElement;
      modal.removeAttribute('hidden');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('feedback-modal-open');
      errEl.hidden = true;
      okEl.hidden = true;
      form.hidden = false;
      submitBtn.disabled = false;
      const focusables = getFocusable();
      const first = focusables.find((el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') || focusables[0];
      window.setTimeout(() => first?.focus(), prefersReducedMotion ? 0 : 40);
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('hidden', '');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('feedback-modal-open');
      form.reset();
      errEl.hidden = true;
      okEl.hidden = true;
      form.hidden = false;
      submitBtn.disabled = false;
      if (lastFocus instanceof HTMLElement) lastFocus.focus();
    };

    openBtn.addEventListener('click', openModal);

    modal.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.classList.contains('feedback-modal__backdrop') || t.closest('[data-feedback-close]')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !modal.classList.contains('is-open')) return;
      closeModal();
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
      const list = getFocusable();
      if (list.length < 2) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.hidden = true;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      submitBtn.disabled = true;

      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const message = (fd.get('message') || '').toString().trim();
      const gotcha = (fd.get('_gotcha') || '').toString();

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: name || '—',
            email,
            _replyto: email,
            message,
            _subject: 'Feedback: Thesis presentation — Russian Opposition in Exile (2026)',
            _gotcha: gotcha,
          }),
        });

        let errMsg = '';
        try {
          const data = await res.json();
          if (!res.ok) errMsg = typeof data.error === 'string' ? data.error : data.message || '';
        } catch {
          if (!res.ok) errMsg = `HTTP ${res.status}`;
        }

        if (!res.ok) {
          throw new Error(errMsg || 'Submission failed. If this is your first time using FormSubmit, check the inbox for a confirmation link.');
        }

        okEl.textContent = 'Thank you. Your message has been sent.';
        okEl.hidden = false;
        form.hidden = true;
        form.reset();
      } catch (err) {
        errEl.textContent =
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again from a live website (not a local file) or later.';
        errEl.hidden = false;
        submitBtn.disabled = false;
      }
    });
  };

  initFeedbackModal();

  const backToTopBtn = createBackToTop();
  const kbdHintEl = createKeyboardHint();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  onScroll();
})();
