/* ═══════════════════════════════════════════════════════════
   BOOT — Connection Status + Service Worker
   v3.0 — تم إزالة theme sync (انتقل إلى theme.js)
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  /* ═══════════════════════════════════════════
     1. CONNECTION STATUS
     ═══════════════════════════════════════════ */
  const chip = document.querySelector('[data-conn-status]');
  const chipText = document.querySelector('[data-conn-text]');
  let idleTimer = null;
  let currentStatus = 'online';

  function setStatus(state, text) {
    if (!chip) return;

    currentStatus = state;
    chip.dataset.status = state;
    if (chipText) chipText.textContent = text;

    // إعادة ضبط مؤقّت الإخفاء
    if (idleTimer) clearTimeout(idleTimer);
    chip.classList.remove('is-idle');

    // أخفِ الرقاقة بعد 3 ثوان لو الاتصال جيد
    if (state === 'online') {
      idleTimer = setTimeout(() => {
        chip.classList.add('is-idle');
      }, 3000);
    }
  }

  function checkConnection() {
    // navigator.onLine غير موثوق على بعض المتصفحات/الشبكات
    // لكنه أفضل ما هو متاح بدون ping
    if (navigator.onLine) {
      setStatus('online', 'متصل');
    } else {
      setStatus('offline', 'لا يوجد اتصال');
    }
  }

  function onOffline() { setStatus('offline', 'لا يوجد اتصال'); }
  function onOnline()  { setStatus('online',  'متصل'); }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      checkConnection();
    }
  }

  function initConnection() {
    if (!chip) return;

    window.addEventListener('offline', onOffline, { passive: true });
    window.addEventListener('online',  onOnline,  { passive: true });

    // ✅ أعد التحقق عند رجوع المستخدم للتاب
    document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });

    // الحالة الأولية
    checkConnection();
  }

  /* ═══════════════════════════════════════════
     2. SERVICE WORKER — تحديث ذكي
     ═══════════════════════════════════════════ */
  let swRegistration = null;
  let swUpdateHandler = null;

  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          swRegistration = reg;

          // ✅ تحديث ذكي: عند عودة التركيز للتاب (بدل setInterval كل ساعة)
          swUpdateHandler = () => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
              reg.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', swUpdateHandler, { passive: true });
        })
        .catch(() => {
          // فشل صامت — لا يعطّل بقية الوظائف
        });
    }, { once: true });
  }

  /* ═══════════════════════════════════════════
     3. LIFECYCLE CLEANUP
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online',  onOnline);
    document.removeEventListener('visibilitychange', onVisibilityChange);

    if (swUpdateHandler) {
      document.removeEventListener('visibilitychange', swUpdateHandler);
      swUpdateHandler = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     4. DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_STATUS = {
    get online()  { return navigator.onLine; },
    get status()  { return currentStatus; },
    get swReady() { return !!swRegistration; },
    recheck: checkConnection
  };

  /* ═══════════════════════════════════════════
     5. INIT
     ═══════════════════════════════════════════ */
  function boot() {
    initConnection();
    initServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();