/* ═══════════════════════════════════════════════════════════
   EFFECTS — Scroll Progress + Reveal + Counters + Cleanup
   v3.1 — Debounced + Cached + Lifecycle-safe + navigate hook
   ═══════════════════════════════════════════════════════════
   ✅ ما تغيّر عن v3.0:
      • إضافة listener جديد للحدث elloul:navigate
      • إعادة تفعيل الـ counters عند العودة للرئيسية
      • توضيح أن content-rendered للعناصر الجديدة فقط
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  const isTouch      = matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ────────── 1. SCROLL PROGRESS (rAF throttled) ────────── */
  let scrollProgressRaf = null;
  const progressBar = document.querySelector('[data-cin-progress]');

  function updateProgress() {
    if (!progressBar) return;
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (total > 0 ? (h.scrollTop / total) * 100 : 0).toFixed(2) + '%';
    scrollProgressRaf = null;
  }

  function onScrollProgress() {
    if (scrollProgressRaf) return;
    scrollProgressRaf = requestAnimationFrame(updateProgress);
  }

  function initScrollProgress() {
    if (!progressBar) return;
    window.addEventListener('scroll', onScrollProgress, { passive: true });
    updateProgress();
  }

  /* ────────── 2. REVEAL ON SCROLL (debounced + cached) ────────── */
  const REVEAL_SELECTOR = '.hero, .sec-head, .cat-scroll, .product-card, .service-item, .blog-post-item, .cart-summary, .contact-form, .mapbox';

  let revealIO = null;
  let revealRaf = null;

  function initReveal() {
    const els = document.querySelectorAll(REVEAL_SELECTOR + ':not(.cin-reveal)');
    if (!els.length) return;

    // Fallback: reduced motion أو متصفح قديم
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('cin-reveal', 'cin-in'));
      return;
    }

    // ✅ أنشئ observer مرة واحدة فقط
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cin-in');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    }

    els.forEach(el => {
      el.classList.add('cin-reveal');
      revealIO.observe(el);
    });
  }

  // ✅ debounce: لا تشغّل أكثر من مرة في نفس الإطار
  function scheduleReveal() {
    if (revealRaf) return;
    revealRaf = requestAnimationFrame(() => {
      revealRaf = null;
      initReveal();
    });
  }

  /* ────────── 3. PRODUCT GLOW FOLLOW (desktop only) ────────── */
  let glowRaf = null;
  let glowPending = null;

  function onMouseMoveGlow(e) {
    const card = e.target.closest && e.target.closest('.product-card, .service-item');
    if (!card) return;

    glowPending = { card, x: e.clientX, y: e.clientY };
    if (glowRaf) return;

    glowRaf = requestAnimationFrame(() => {
      glowRaf = null;
      if (!glowPending) return;

      const { card, x, y } = glowPending;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', (((x - r.left) / r.width) * 100) + '%');
      card.style.setProperty('--glow-y', (((y - r.top) / r.height) * 100) + '%');
      glowPending = null;
    });
  }

  function initGlow() {
    if (isTouch || reduceMotion) return;
    document.addEventListener('mousemove', onMouseMoveGlow, { passive: true });
  }

  /* ────────── 4. COUNTERS (cached IO) ────────── */
  let countersIO = null;

  function animateCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';

    const original = el.textContent.trim();
    const m = original.match(/^([+\-]?)(\d+(?:\.\d+)?)(%?)$/);
    if (!m) return;

    const [, prefix, num, suffix] = m;
    const target = parseFloat(num);
    const start = performance.now();
    const duration = 1200;

    (function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    })(start);
  }

  function initCounters() {
    const stats = document.querySelectorAll('.hero-stat strong:not([data-counted])');
    if (!stats.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      stats.forEach(animateCounter);
      return;
    }

    // ✅ أنشئ observer مرة واحدة فقط
    if (!countersIO) {
      countersIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            countersIO.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
    }

    stats.forEach(el => countersIO.observe(el));
  }

  /* ────────── 5. NAVIGATION (بديل موحّد لـ app.js) ────────── */
  function navigate(target, silent) {
    if (!target) return;

    // active على navbar links
    document.querySelectorAll('.navbar-link').forEach(n => {
      n.classList.toggle('active', n.dataset.navTarget === target);
    });

    // active على الصفحات
    document.querySelectorAll('[data-page]').forEach(p => {
      p.classList.toggle('active', p.dataset.page === target);
    });

    try { localStorage.setItem('elloul-page', target); } catch (e) {}

    if (!silent) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      scheduleReveal();   // إعادة تفعيل reveal بعد التنقل
    }
  }

  // ✅ كشف الدالة عالميًا (يستخدمها app.js + store.js)
  window.ELLOUL_navigateEnhanced = navigate;

  /* ═══════════════════════════════════════════════════════════
     6. STORE.JS INTEGRATION — الأحداث المخصصة
     ═══════════════════════════════════════════════════════════

     عندنا حدثين مختلفين:

     1️⃣  elloul:content-rendered
         • بيتنادى بعد أي re-render (إضافة منتج للسلة، حذف... إلخ)
         • يستخدم للعناصر الجديدة فقط

     2️⃣  elloul:navigate
         • بيتنادى بس عند التنقل بين الصفحات
         • يستخدم لإعادة تفعيل animations الصفحة الجديدة

     ═══════════════════════════════════════════════════════════ */

  /* ✅ 1. بعد أي re-render — اعرض العناصر الجديدة فقط */
  window.addEventListener('elloul:content-rendered', scheduleReveal);

  /* ✅ 2. عند التنقل بين الصفحات — أعد تفعيل animations */
  window.addEventListener('elloul:navigate', function(e) {
    /* أعد تفعيل reveal للصفحة الجديدة */
    scheduleReveal();

    /* لو رجعنا للصفحة الرئيسية — شغّل الـ counters من جديد */
    if (e.detail && e.detail.page === 'home') {
      initCounters();
    }
  });

  /* ────────── 7. LIFECYCLE CLEANUP ────────── */
  function cleanup() {
    if (scrollProgressRaf) {
      cancelAnimationFrame(scrollProgressRaf);
      scrollProgressRaf = null;
    }
    if (revealRaf) {
      cancelAnimationFrame(revealRaf);
      revealRaf = null;
    }
    if (glowRaf) {
      cancelAnimationFrame(glowRaf);
      glowRaf = null;
    }

    if (revealIO)   { revealIO.disconnect();   revealIO = null; }
    if (countersIO) { countersIO.disconnect(); countersIO = null; }

    window.removeEventListener('scroll', onScrollProgress);
    document.removeEventListener('mousemove', onMouseMoveGlow);
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── 8. FALLBACK LISTENER (لو app.js مش محمّل) ────────── */
  function installFallbackNav() {
    if (typeof window.ELLOUL_navigate === 'function') return;

    document.addEventListener('click', (e) => {
      const link = e.target.closest && e.target.closest('[data-nav-link]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      navigate(link.dataset.navTarget);
    }, true);
  }

  /* ────────── 9. DEBUG API ────────── */
  window.ELLOUL_EFFECTS = {
    reveal: scheduleReveal,
    navigate,
    counters: initCounters,
    get ready() {
      return { reveal: !!revealIO, counters: !!countersIO };
    }
  };

  /* ────────── 10. BOOT ────────── */
  function boot() {
    initScrollProgress();
    initReveal();
    initGlow();
    initCounters();
    installFallbackNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();