/* ═══════════════════════════════════════════════════════════
   ABANDONED-CART — استعادة السلة المتروكة
   v2.0 — إصلاح العداد + debounce + cleanup
   ✅ يحفظ snapshot عند آخر نشاط
   ✅ يُذكّر بعد 15 دقيقة خمول
   ✅ يعرض استعادة عند العودة
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_ABANDONED_READY__) return;
  window.__ELLOUL_ABANDONED_READY__ = true;

  const SNAPSHOT_KEY = 'elloul-cart-snapshot';
  const REMINDED_KEY = 'elloul-cart-reminded';
  const CART_KEY     = 'elloul-cart';
  const IDLE_MS      = 15 * 60 * 1000;      // 15 دقيقة
  const REMIND_COOLDOWN = 24 * 60 * 60 * 1000; // 24 ساعة
  const MAX_SNAPSHOT_AGE = 7 * 24 * 60 * 60 * 1000; // 7 أيام
  const ACTIVITY_DEBOUNCE = 5000;           // 5 ثوان بين مرات إعادة الضبط

  let idleTimer = null;
  let lastResetAt = 0;
  let reminderShown = false;

  /* ────────── قراءة السلة ────────── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e) { return []; }
  }

  /* ────────── حفظ snapshot ────────── */
  function saveSnapshot() {
    const cart = getCart();
    if (!cart.length) {
      /* لو السلة فاضية → امسح الـ snapshot */
      try { localStorage.removeItem(SNAPSHOT_KEY); } catch(e) {}
      return;
    }

    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        cart,
        timestamp: Date.now(),
        page: localStorage.getItem('elloul-page') || 'home'
      }));
    } catch(e) {}
  }

  /* ────────── عرض تذكير ────────── */
  function showReminder() {
    if (reminderShown) return;
    if (typeof Swal === 'undefined') return;

    /* تحقق من آخر تذكير (24 ساعة) */
    try {
      const lastRemind = parseInt(localStorage.getItem(REMINDED_KEY), 10) || 0;
      if (Date.now() - lastRemind < REMIND_COOLDOWN) return;
    } catch(e) {}

    const cart = getCart();
    if (!cart.length) return;

    reminderShown = true;
    try { localStorage.setItem(REMINDED_KEY, String(Date.now())); } catch(e) {}

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const totalItems = cart.reduce((s, i) => s + (i.qty || 0), 0);

    Swal.fire({
      title: '🛒 سلتك تنتظرك!',
      html: `
        <p style="line-height:1.8;font-size:14px;">
          لديك <strong style="color:#3b82f6;">${totalItems}</strong> قطعة في سلتك.<br>
          هل تريد استكمال الطلب؟
        </p>
        <p style="font-size:11.5px;color:#94a3b8;margin-top:12px;">
          ⚡ اطلب الآن قبل نفاد الكمية
        </p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '🛒 استكمل الآن',
      cancelButtonText: 'لاحقاً',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    }).then(res => {
      if (res.isConfirmed) {
        const cartPage = document.querySelector('[data-page="cart"]');
        if (cartPage && !cartPage.classList.contains('active')) {
          const nav = window.ELLOUL_navigateEnhanced || window.ELLOUL_navigate;
          if (typeof nav === 'function') nav('cart');
        }
      }
    });
  }

  /* ────────── إعادة ضبط المؤقّت ────────── */
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    saveSnapshot();
    idleTimer = setTimeout(showReminder, IDLE_MS);
  }

  /* ────────── مراقبة النشاط — debounced ────────── */
  function attachActivityWatchers() {
    const events = ['click', 'scroll', 'keydown', 'touchstart', 'mousemove'];

    events.forEach(ev => {
      document.addEventListener(ev, () => {
        const now = Date.now();
        /* debounce: لا نُصفِّر أكثر من مرة كل 5 ثوان */
        if (now - lastResetAt < ACTIVITY_DEBOUNCE) return;
        lastResetAt = now;
        resetIdleTimer();
      }, { passive: true, capture: true });
    });
  }

  /* ────────── استعادة عند العودة ────────── */
  function checkReturning() {
    try {
      const snap = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
      if (!snap || !snap.cart || !snap.cart.length) return;

      const elapsed = Date.now() - snap.timestamp;

      /* تجاهل الـ snapshots القديمة (أكثر من 7 أيام) */
      if (elapsed > MAX_SNAPSHOT_AGE) {
        localStorage.removeItem(SNAPSHOT_KEY);
        return;
      }

      const currentCart = getCart();

      /* اعرض الاستعادة فقط لو:
         - مرّ 30 دقيقة
         - السلة الحالية فارغة
      */
      if (elapsed > 30 * 60 * 1000 && currentCart.length === 0) {
        setTimeout(() => {
          if (typeof Swal === 'undefined') return;
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          const totalItems = snap.cart.reduce((s, i) => s + (i.qty || 0), 0);

          Swal.fire({
            title: '💾 استعد سلتك السابقة؟',
            text: `لدينا ${totalItems} قطعة كنت تركتها`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'استعد',
            cancelButtonText: 'لا شكراً',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            background: isLight ? '#ffffff' : '#181c24',
            color: isLight ? '#0a0f1a' : '#f2f5f8'
          }).then(res => {
            if (res.isConfirmed) {
              try {
                localStorage.setItem(CART_KEY, JSON.stringify(snap.cart));
                localStorage.removeItem(SNAPSHOT_KEY);
                window.dispatchEvent(new CustomEvent('elloul:content-rendered'));
              } catch(e) {}
            } else {
              try { localStorage.removeItem(SNAPSHOT_KEY); } catch(e) {}
            }
          });
        }, 2000);
      }
    } catch(e) {}
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    saveSnapshot();
  }

  /* ────────── BOOT ────────── */
  function boot() {
    resetIdleTimer();
    attachActivityWatchers();
    checkReturning();

    /* احفظ عند مغادرة الصفحة */
    window.addEventListener('pagehide', cleanup, { once: true });

    /* احفظ عند تغيير السلة */
    window.addEventListener('elloul:content-rendered', saveSnapshot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_ABANDONED = {
    snapshot: () => {
      try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); }
      catch(e) { return null; }
    },
    clear: () => {
      try {
        localStorage.removeItem(SNAPSHOT_KEY);
        localStorage.removeItem(REMINDED_KEY);
      } catch(e) {}
    },
    remind: showReminder,
    timeLeft: () => {
      if (!idleTimer) return 0;
      /* تقدير فقط — لا يمكن قراءة وقت الـ setTimeout */
      return IDLE_MS;
    }
  };

})();