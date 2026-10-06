/* ═══════════════════════════════════════════════════════════
   APP — Navigation + Sidebar
   v3.0 — Null-safe + Single DOMContentLoaded + Clean mq API
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ═══════════════════════════════════════════
     1. NAVIGATION — الدالة الأساسية
     ═══════════════════════════════════════════ */
  window.ELLOUL_navigate = function(targetPage, silent) {
    if (!targetPage) return;

    // navbar active
    document.querySelectorAll('.navbar-link').forEach(nav => {
      nav.classList.toggle('active', nav.dataset.navTarget === targetPage);
    });

    // page active
    document.querySelectorAll('[data-page]').forEach(page => {
      page.classList.toggle('active', page.dataset.page === targetPage);
    });

    // حفظ آخر صفحة
    try { localStorage.setItem('elloul-page', targetPage); } catch (e) {}

    // scroll للأعلى
    if (!silent) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ✅ helper موحّد — يفضّل النسخة المحسّنة لو موجودة */
  function navigateTo(target, silent) {
    const fn = window.ELLOUL_navigateEnhanced || window.ELLOUL_navigate;
    if (typeof fn === 'function') fn(target, silent);
  }

  /* ═══════════════════════════════════════════
     2. CLICK LISTENER — واحد فقط (capture)
     ═══════════════════════════════════════════ */
  document.addEventListener('click', function(e) {
    const link = e.target.closest && e.target.closest('[data-nav-link]');
    if (!link) return;

    e.preventDefault();
    e.stopPropagation();
    navigateTo(link.dataset.navTarget);
  }, true);

  /* ═══════════════════════════════════════════
     3. SIDEBAR — toggle + responsive sync
     ═══════════════════════════════════════════ */
  function initSidebar() {
    const sidebar = document.querySelector('[data-sidebar]');
    const sidebarBtn = document.querySelector('[data-sidebar-btn]');
    if (!sidebar || !sidebarBtn) return;

    /* زر "عرض/إخفاء البيانات" */
    sidebarBtn.addEventListener('click', () => {
      if (!sidebar) return;

      sidebar.classList.toggle('active');
      const isActive = sidebar.classList.contains('active');

      const span = sidebarBtn.querySelector('span');
      const ico = sidebarBtn.querySelector('ion-icon');

      if (span) span.textContent = isActive ? 'إخفاء البيانات' : 'عرض البيانات';
      if (ico) ico.setAttribute('name', isActive ? 'chevron-up' : 'chevron-down');
    });

    /* ✅ مزامنة مع العرض عبر matchMedia — أداء أفضل من resize */
    const mq = window.matchMedia('(min-width: 1250px)');

    function applySidebarState(matches) {
      if (!sidebar) return;
      sidebar.classList.toggle('active', matches);
    }

    // اربط الـ listener — الطريقة الحديثة أولاً
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', (e) => applySidebarState(e.matches));
    } else if (typeof mq.addListener === 'function') {
      // fallback للمتصفحات القديمة (Safari < 14)
      mq.addListener((e) => applySidebarState(e.matches));
    }

    // طبّق الحالة الأولية
    applySidebarState(mq.matches);
  }

  /* ═══════════════════════════════════════════
     4. BOOT — DOMContentLoaded واحد فقط
     ═══════════════════════════════════════════ */
  function boot() {
    // استعادة آخر صفحة
    try {
      const saved = localStorage.getItem('elloul-page');
      if (saved) {
        const exists = Array.from(document.querySelectorAll('[data-page]'))
          .some(p => p.dataset.page === saved);
        if (exists) navigateTo(saved, true); // silent = true
      }
    } catch (e) {}

    // السايدبار
    initSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();