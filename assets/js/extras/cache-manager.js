/* ═══════════════════════════════════════════════════════════
   CACHE-MANAGER — إدارة الكاش الذكية
   v2.0 — إصلاح تسجيل مزدوج + cleanup + حماية إضافية
   ✅ يعرض "آخر تحديث"
   ✅ زر "تفريغ الكاش"
   ✅ يكشف نسخة جديدة من الـ Service Worker
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_CACHE_READY__) return;
  window.__ELLOUL_CACHE_READY__ = true;

  const VERSION_KEY = 'elloul-version';
  const LAST_UPDATE_KEY = 'elloul-last-update';
  const CURRENT_VERSION = '3.0.0';

  /* ────────── State ────────── */
  let isClearing = false;
  let swUpdateListener = null;
  let swRegistrationRef = null;

  /* ═══════════════════════════════════════════
     آخر تحديث
     ═══════════════════════════════════════════ */
  function getLastUpdate() {
    try {
      return parseInt(localStorage.getItem(LAST_UPDATE_KEY), 10) || 0;
    } catch(e) { return 0; }
  }

  function setLastUpdate() {
    try { localStorage.setItem(LAST_UPDATE_KEY, String(Date.now())); } catch(e) {}
  }

  function formatDate(ts) {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch(e) { return '—'; }
  }

  /* ═══════════════════════════════════════════
     كشف نسخة جديدة
     ═══════════════════════════════════════════ */
  function checkVersion() {
    try {
      const saved = localStorage.getItem(VERSION_KEY);

      /* ✅ أول زيارة → فقط احفظ الإصدار بدون إشعار */
      if (!saved) {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return;
      }

      /* نفس الإصدار → لا شيء */
      if (saved === CURRENT_VERSION) return;

      /* إصدار مختلف → إشعار */
      showUpdateNotification();
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch(e) {}
  }

  function showUpdateNotification() {
    if (typeof Swal === 'undefined') return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      title: '🎉 نسخة جديدة متاحة!',
      html: `
        <p style="line-height:1.8;font-size:14px;">
          قمنا بتحسينات جديدة.<br>
          هل تريد تحديث الصفحة؟
        </p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '🔄 تحديث الآن',
      cancelButtonText: 'لاحقاً',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    }).then((res) => {
      if (res.isConfirmed) {
        clearAllCaches().then(() => location.reload());
      }
    });
  }

  /* ═══════════════════════════════════════════
     تفريغ الكاش
     ═══════════════════════════════════════════ */
  async function clearAllCaches() {
    /* حماية من الاستدعاءات المتزامنة */
    if (isClearing) return false;
    isClearing = true;

    try {
      /* 1. Service Worker caches */
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      /* 2. Service Worker registrations */
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      /* 3. sessionStorage */
      try { sessionStorage.clear(); } catch(e) {}

      return true;
    } catch(e) {
      console.warn('[CacheManager] clear failed:', e);
      return false;
    } finally {
      isClearing = false;
    }
  }

  /* ═══════════════════════════════════════════
     معلومات الكاش
     ═══════════════════════════════════════════ */
  async function getCacheInfo() {
    const info = {
      version: CURRENT_VERSION,
      lastUpdate: formatDate(getLastUpdate()),
      hasSW: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller,
      cacheCount: 0,
      cacheSize: 0
    };

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        info.cacheCount = keys.length;

        for (const k of keys) {
          try {
            const cache = await caches.open(k);
            const reqs = await cache.keys();
            info.cacheSize += reqs.length;
          } catch(e) {}
        }
      }
    } catch(e) {}

    return info;
  }

  /* ═══════════════════════════════════════════
     عرض التقرير
     ═══════════════════════════════════════════ */
  async function showReport() {
    const info = await getCacheInfo();

    console.log(
      '%c💾 ELLOUL — معلومات الكاش',
      'color:#60a5fa; font-size:15px; font-weight:900; padding:6px 0;'
    );

    try {
      console.table({
        'الإصدار': info.version,
        'آخر تحديث': info.lastUpdate,
        'Service Worker': info.hasSW ? '🟢 نشط' : '⚪ غير مسجّل',
        'عدد الـ Caches': info.cacheCount,
        'عدد الملفات': info.cacheSize
      });
    } catch(e) {
      /* fallback للحيوانات القديمة */
      console.log('الإصدار:', info.version);
      console.log('آخر تحديث:', info.lastUpdate);
      console.log('Service Worker:', info.hasSW ? 'نشط' : 'غير مسجّل');
      console.log('عدد الملفات:', info.cacheSize);
    }

    console.log(
      '%c  💡 للتفريغ:  %celloul.cache.clear()',
      'color:#94a3b8; font-size:11px;',
      'background:#f59e0b; color:#0a0f1a; font-family:monospace; padding:2px 8px; border-radius:4px; font-weight:bold;'
    );
  }

  /* ═══════════════════════════════════════════
     Clear with confirmation
     ═══════════════════════════════════════════ */
  async function clearWithConfirm() {
    if (isClearing) {
      console.log('%c⏳ العملية قيد التنفيذ...', 'color:#f59e0b;');
      return;
    }

    if (typeof Swal === 'undefined') {
      await clearAllCaches();
      location.reload();
      return;
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const res = await Swal.fire({
      title: 'تفريغ الكاش؟',
      text: 'سيتم حذف جميع الملفات المخزّنة محلياً وإعادة تحميل الصفحة.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، فرّغ',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    });

    if (res.isConfirmed) {
      await clearAllCaches();
      setTimeout(() => location.reload(), 400);
    }
  }

  /* ═══════════════════════════════════════════
     زر "تحديث البيانات" في admin
     ═══════════════════════════════════════════ */
  function injectRefreshButton() {
    /* البحث في admin page */
    const adminBar = document.querySelector('.admin-header-bar');
    if (!adminBar) return;
    if (adminBar.querySelector('[data-cache-refresh]')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-icon';
    btn.dataset.cacheRefresh = 'true';
    btn.title = 'تفريغ الكاش وتحديث';
    btn.setAttribute('aria-label', 'تفريغ الكاش');
    btn.innerHTML = '<ion-icon name="refresh-outline"></ion-icon>';

    const actions = adminBar.querySelector('.admin-actions');
    if (!actions) return;

    actions.appendChild(btn);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(btn);
    }

    btn.addEventListener('click', async () => {
      if (isClearing) return;
      btn.classList.add('loading');
      btn.disabled = true;

      await clearWithConfirm();

      /* لن نصل إلى هنا في معظم الحالات (الصفحة تُعاد) */
      btn.classList.remove('loading');
      btn.disabled = false;
    });
  }

  /* ═══════════════════════════════════════════
     مراقبة تحديث SW
     ═══════════════════════════════════════════ */
  function watchSWUpdate() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      swRegistrationRef = reg;

      swUpdateListener = () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      };

      reg.addEventListener('updatefound', swUpdateListener);
    }).catch(() => {});
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (swRegistrationRef && swUpdateListener) {
      try {
        swRegistrationRef.removeEventListener('updatefound', swUpdateListener);
      } catch(e) {}
      swUpdateListener = null;
      swRegistrationRef = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    setLastUpdate();
    checkVersion();
    watchSWUpdate();

    /* ✅ زر admin — مرة واحدة فقط */
    setTimeout(injectRefreshButton, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API (مباشر — بدون setTimeout)
     ═══════════════════════════════════════════ */
  window.ELLOUL_CACHE = {
    show: showReport,
    clear: clearWithConfirm,
    clearSilent: clearAllCaches,
    info: getCacheInfo,
    version: CURRENT_VERSION
  };

  /* إضافة على elloul مباشرة */
  if (window.elloul) {
    window.elloul.cache = window.ELLOUL_CACHE;
  } else {
    /* في حال لم يُحمَّل console-brand بعد */
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.elloul && !window.elloul.cache) {
          window.elloul.cache = window.ELLOUL_CACHE;
        }
      }, 300);
    }, { once: true });
  }

})();