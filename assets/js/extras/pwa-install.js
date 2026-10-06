/* ═══════════════════════════════════════════════════════════
   PWA-INSTALL — بانر "ثبّت التطبيق"
   v2.0 — cleanup + iPad detection + null prompt fix
   ✅ يظهر بعد زيارتين
   ✅ يدعم Android + iOS + iPadOS
   ✅ يخفي بعد الرفض 30 يوم
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_PWA_READY__) return;
  window.__ELLOUL_PWA_READY__ = true;

  const STORAGE_VISITS = 'elloul-visits';
  const STORAGE_DISMISSED = 'elloul-pwa-dismissed';
  const MIN_VISITS = 2;
  const DISMISS_DAYS = 30;
  const LATER_DISMISS_DAYS = 7;

  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  /* ✅ دعم iPad الجديد (يظهر كـ Mac) */
  const isIPad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  const isAppleMobile = isIOS || isIPad;

  if (isStandalone) return;

  /* ────────── State ────────── */
  let deferredPrompt = null;
  let bannerEl = null;
  let showTimer = null;
  let iosTimer = null;
  let beforeInstallHandler = null;
  let appInstalledHandler = null;

  /* ────────── الزيارات ────────── */
  function getVisits() {
    try { return parseInt(localStorage.getItem(STORAGE_VISITS), 10) || 0; }
    catch(e) { return 0; }
  }

  function bumpVisits() {
    try { localStorage.setItem(STORAGE_VISITS, String(getVisits() + 1)); }
    catch(e) {}
  }

  /* ────────── الرفض ────────── */
  function isDismissed() {
    try {
      const t = localStorage.getItem(STORAGE_DISMISSED);
      if (!t) return false;
      return Date.now() < parseInt(t, 10);
    } catch(e) { return false; }
  }

  function dismiss(days) {
    try {
      localStorage.setItem(STORAGE_DISMISSED, String(Date.now() + days * 86400000));
    } catch(e) {}
  }

  /* ────────── الأحداث ────────── */
  beforeInstallHandler = function(e) {
    e.preventDefault();
    deferredPrompt = e;
    maybeShowBanner();
  };

  appInstalledHandler = function() {
    deferredPrompt = null;
    hideBanner();
    try { localStorage.removeItem(STORAGE_VISITS); } catch(e) {}
    showThanks();
  };

  window.addEventListener('beforeinstallprompt', beforeInstallHandler);
  window.addEventListener('appinstalled', appInstalledHandler);

  /* ═══════════════════════════════════════════
     بناء البانر
     ═══════════════════════════════════════════ */
  function buildBanner() {
    const el = document.createElement('div');
    el.className = 'pwa-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'ثبّت تطبيق ELLOUL');
    el.innerHTML = `
      <button class="pwa-close" type="button" aria-label="إغلاق">✕</button>
      <div class="pwa-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div class="pwa-text">
        <h4>ثبّت تطبيق ELLOUL</h4>
        <p>وصول سريع + تجربة أفضل + خصم 5% على أول طلب 🎁</p>
      </div>
      <div class="pwa-actions">
        <button class="pwa-install-btn" type="button">تثبيت</button>
        <button class="pwa-later-btn" type="button">لاحقاً</button>
      </div>
    `;

    const closeBtn = el.querySelector('.pwa-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dismiss(DISMISS_DAYS);
        hideBanner();
      });
    }

    const laterBtn = el.querySelector('.pwa-later-btn');
    if (laterBtn) {
      laterBtn.addEventListener('click', () => {
        dismiss(LATER_DISMISS_DAYS);
        hideBanner();
      });
    }

    const installBtn = el.querySelector('.pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', handleInstall);
    }

    return el;
  }

  /* ═══════════════════════════════════════════
     عرض/إخفاء البانر
     ═══════════════════════════════════════════ */
  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    requestAnimationFrame(() => {
      if (bannerEl) bannerEl.classList.add('pwa-banner-show');
    });
  }

  function hideBanner() {
    if (!bannerEl) return;
    const el = bannerEl;
    bannerEl = null;
    el.classList.remove('pwa-banner-show');
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 350);
  }

  /* ═══════════════════════════════════════════
     منطق العرض
     ═══════════════════════════════════════════ */
  function maybeShowBanner() {
    if (isDismissed()) return;
    if (getVisits() < MIN_VISITS) return;
    if (!isTouch) return;
    if (bannerEl) return;

    if (isAppleMobile) {
      showBanner();
      return;
    }

    if (deferredPrompt) {
      showBanner();
    }
  }

  /* ═══════════════════════════════════════════
     معالجة التثبيت
     ═══════════════════════════════════════════ */
  async function handleInstall() {
    /* Android / Chrome */
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;

        /* ✅ صفّر الـ prompt دائماً بعد الاستخدام */
        deferredPrompt = null;

        if (choice.outcome === 'accepted') {
          hideBanner();
        } else {
          dismiss(DISMISS_DAYS);
          hideBanner();
        }
      } catch(e) {
        deferredPrompt = null;
        dismiss(DISMISS_DAYS);
        hideBanner();
      }
      return;
    }

    /* iOS / iPadOS */
    if (isAppleMobile) {
      showIOSInstructions();
    }
  }

  /* ═══════════════════════════════════════════
     تعليمات iOS
     ═══════════════════════════════════════════ */
  function showIOSInstructions() {
    hideBanner();

    const el = document.createElement('div');
    el.className = 'pwa-ios-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'تعليمات التثبيت');
    el.innerHTML = `
      <div class="pwa-ios-content">
        <button class="pwa-ios-close" type="button" aria-label="إغلاق">✕</button>
        <h3>📱 ثبّت ELLOUL على جوالك</h3>
        <ol>
          <li>اضغط على زر <strong>المشاركة</strong> <span class="ios-icon">⬆️</span> أسفل الشاشة</li>
          <li>اسحب للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></li>
          <li>اضغط <strong>"إضافة"</strong> أعلى اليمين</li>
        </ol>
        <p class="pwa-ios-note">🎁 ستحصل على خصم 5% عند أول طلب بعد التثبيت</p>
      </div>
    `;

    const closeBtn = el.querySelector('.pwa-ios-close');
    if (closeBtn) closeBtn.addEventListener('click', () => el.remove());

    el.addEventListener('click', (e) => {
      if (e.target === el) el.remove();
    });

    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('pwa-ios-show'));
  }

  /* ═══════════════════════════════════════════
     رسالة الشكر
     ═══════════════════════════════════════════ */
  function showThanks() {
    if (typeof Swal === 'undefined') return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      title: '🎉 مرحباً بك في تطبيق ELLOUL!',
      html:
        '<p style="line-height:1.8;">' +
          'استمتع بتجربة أسرع وأسهل.<br>' +
          '<strong style="color:#3b82f6;">كود خصم 5%:</strong>' +
          '<code style="background:#3b82f6;color:#fff;padding:4px 10px;border-radius:6px;font-weight:bold;display:inline-block;margin-top:8px;">ELLOUL5</code>' +
        '</p>',
      icon: 'success',
      confirmButtonText: 'شكراً!',
      confirmButtonColor: '#3b82f6',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    });
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (iosTimer) { clearTimeout(iosTimer); iosTimer = null; }

    if (beforeInstallHandler) {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      beforeInstallHandler = null;
    }
    if (appInstalledHandler) {
      window.removeEventListener('appinstalled', appInstalledHandler);
      appInstalledHandler = null;
    }

    /* أغلق البانر لو مفتوح */
    if (bannerEl) {
      const el = bannerEl;
      bannerEl = null;
      el.remove();
    }

    /* أغلق أي modal iOS */
    document.querySelectorAll('.pwa-ios-modal').forEach(m => m.remove());
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    bumpVisits();

    /* Android: عرض بعد 8 ثواني */
    showTimer = setTimeout(() => {
      showTimer = null;
      maybeShowBanner();
    }, 8000);

    /* iOS: عرض بعد 12 ثانية */
    if (isAppleMobile) {
      iosTimer = setTimeout(() => {
        iosTimer = null;
        maybeShowBanner();
      }, 12000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_PWA = {
    visits: getVisits,
    isStandalone: () => isStandalone,
    isAppleMobile: () => isAppleMobile,
    hasDeferredPrompt: () => !!deferredPrompt,
    show: showBanner,
    hide: hideBanner,
    reset: () => {
      try {
        localStorage.removeItem(STORAGE_VISITS);
        localStorage.removeItem(STORAGE_DISMISSED);
      } catch(e) {}
    }
  };

})();