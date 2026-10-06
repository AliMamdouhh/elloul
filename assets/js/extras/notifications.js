/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS — إشعارات المتصفح
   v2.1 — Fix await in requestPermission
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_NOTIF_READY__) return;
  window.__ELLOUL_NOTIF_READY__ = true;

  const PERM_KEY = 'elloul-notif-permission';
  const LAST_NOTIF_KEY = 'elloul-last-notification';
  const ASK_DELAY_MS = 45 * 1000;
  const NOTIF_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
  const CHECK_INTERVAL = 30 * 60 * 1000;

  const OFFERS = [
    { title: '🎁 خصم 15% على أطقم المائدة', body: 'استفد الآن قبل انتهاء العرض' },
    { title: '🔥 وصل حديثاً!', body: 'تصفح أحدث تشكيلة من ELLOUL' },
    { title: '🚚 شحن مجاني', body: 'على الطلبات فوق 500 ج.م — لفترة محدودة' },
    { title: '💎 استانلس 304 أصلي', body: 'جودة عالية بأسعار تنافسية' }
  ];

  let askTimer = null;
  let checkTimer = null;
  let swMessageHandler = null;

  function isSupported() {
    try {
      return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
    } catch(e) { return false; }
  }

  function getPermission() {
    if (!isSupported()) return 'unsupported';
    try {
      return Notification.permission || 'default';
    } catch(e) { return 'unsupported'; }
  }

  function getSavedPermission() {
    try { return localStorage.getItem(PERM_KEY) || null; }
    catch(e) { return null; }
  }

  function askPermission() {
    if (!isSupported()) return;
    const perm = getPermission();
    if (perm !== 'default') return;
    if (getSavedPermission() === 'denied') return;
    if (typeof Swal === 'undefined') return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      title: '🔔 هل تريد تفعيل الإشعارات؟',
      html: `
        <p style="line-height:1.8;font-size:13.5px;">
          سنُخبرك فقط بالعروض المهمة والمنتجات الجديدة.<br>
          <strong style="color:#3b82f6;">لا رسائل مزعجة — وعدنا 💙</strong>
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: 'نعم، فعّل',
      cancelButtonText: 'لا شكراً',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    }).then((res) => {
      if (res.isConfirmed) {
        requestPermission();
      } else {
        try { localStorage.setItem(PERM_KEY, 'denied'); } catch(e) {}
      }
    });
  }

  async function requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      try { localStorage.setItem(PERM_KEY, permission); } catch(e) {}

      if (permission === 'granted') {
        /* ✅ await + try/catch */
        try {
          await showLocalNotification(
            '🎉 تم تفعيل الإشعارات!',
            'سنُخبرك بكل جديد مميز من ELLOUL'
          );
        } catch(e) {}
        startScheduleLoop();
      }
    } catch(e) {}
  }

  async function showLocalNotification(title, body, opts) {
    if (!isSupported()) return false;
    if (getPermission() !== 'granted') return false;

    const options = Object.assign({
      body: body,
      icon: './assets/icons/icon-192.png',
      badge: './assets/icons/icon-96.png',
      vibrate: [200, 100, 200],
      tag: 'elloul-notif',
      renotify: false,
      data: { url: './#shop' }
    }, opts || {});

    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
      try { localStorage.setItem(LAST_NOTIF_KEY, String(Date.now())); } catch(e) {}
      return true;
    } catch(e) { return false; }
  }

  function startScheduleLoop() {
    if (checkTimer) clearInterval(checkTimer);
    checkAndSendOffer();
    checkTimer = setInterval(checkAndSendOffer, CHECK_INTERVAL);
  }

  function checkAndSendOffer() {
    if (!isSupported()) return;
    if (getPermission() !== 'granted') return;

    const last = parseInt(localStorage.getItem(LAST_NOTIF_KEY), 10) || 0;
    if (Date.now() - last < NOTIF_COOLDOWN_MS) return;
    if (document.hidden) return;

    const offer = OFFERS[Math.floor(Math.random() * OFFERS.length)];
    showLocalNotification(offer.title, offer.body);
  }

  function hookSWMessages() {
    if (!('serviceWorker' in navigator)) return;
    swMessageHandler = (event) => {
      if (event.data && event.data.type === 'OPEN_URL') {
        if (window.ELLOUL_navigateEnhanced) {
          window.ELLOUL_navigateEnhanced(event.data.url);
        } else if (window.ELLOUL_navigate) {
          window.ELLOUL_navigate(event.data.url);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', swMessageHandler);
  }

  function boot() {
    hookSWMessages();
    if (!isSupported()) return;

    const perm = getPermission();
    if (perm === 'default' && getSavedPermission() !== 'denied') {
      askTimer = setTimeout(askPermission, ASK_DELAY_MS);
    }
    if (perm === 'granted') startScheduleLoop();
  }

  function cleanup() {
    if (askTimer) { clearTimeout(askTimer); askTimer = null; }
    if (checkTimer) { clearInterval(checkTimer); checkTimer = null; }
    if (swMessageHandler && 'serviceWorker' in navigator) {
      try { navigator.serviceWorker.removeEventListener('message', swMessageHandler); } catch(e) {}
      swMessageHandler = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.ELLOUL_NOTIF = {
    supported: isSupported,
    permission: getPermission,
    ask: askPermission,
    show: showLocalNotification,
    test: () => showLocalNotification('🧪 إشعار تجريبي', 'هذا اختبار للإشعارات'),
    forceCheck: checkAndSendOffer,
    reset: () => {
      try {
        localStorage.removeItem(PERM_KEY);
        localStorage.removeItem(LAST_NOTIF_KEY);
      } catch(e) {}
    }
  };

  function attachToElloul() {
    if (window.elloul && !window.elloul.notif) {
      window.elloul.notif = {
        ask: askPermission,
        show: showLocalNotification,
        test: () => showLocalNotification('🧪 اختبار', 'الإشعارات تعمل بنجاح!')
      };
    }
  }

  if (window.elloul) attachToElloul();
  else document.addEventListener('DOMContentLoaded', () => setTimeout(attachToElloul, 300), { once: true });

})();