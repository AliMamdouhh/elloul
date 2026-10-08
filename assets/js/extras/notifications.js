/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS v3.0 — Rich + Full Control
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function () {

  if (window.__ELLOUL_NOTIF_READY__) return;
  window.__ELLOUL_NOTIF_READY__ = true;

  /* ═══ Keys ═══ */
  var PERM_KEY   = 'elloul-notif-permission';
  var PREFS_KEY  = 'elloul-notif-prefs';
  var HIST_KEY   = 'elloul-notif-history';
  var LAST_KEY   = 'elloul-notif-last';

  var ASK_DELAY_MS   = 45 * 1000;
  var CHECK_INTERVAL = 15 * 60 * 1000;
  var MAX_HISTORY    = 20;

  /* ═══ Default Preferences ═══ */
  var DEFAULT_PREFS = {
    enabled: true,
    categories: {
      offers:      true,   /* عروض وخصومات */
      newProducts: true,   /* منتجات جديدة */
      cart:        true,   /* تذكير بالسلة */
      priceDrop:   false,  /* انخفاض السعر */
      restock:     false,  /* عودة المخزون */
      orderUpdate: true    /* تحديثات الطلب */
    },
    quietHours: { enabled: true, from: 22, to: 9 },
    minInterval: 24,          /* ساعات بين إشعارين */
    sound: true,
    vibration: true
  };

  /* ═══ Notification Content Bank ═══ */
  var CONTENT = {
    offers: [
      { title: '🎁 تك، تك! هدايا قد وصلت', body: 'حظك جديد! 🍀 شوف العرض الجديد' },
      { title: '🎉 خصم اليوم فقط', body: 'استفد قبل نهاية العرض ⏰' },
      { title: '🔥 عرض حصري', body: 'أطقم مائدة بأسعار لا تُفوَّت' },
      { title: '💎 خصم 15% عليك', body: 'افتح التطبيق واستفد الآن 🎁' }
    ],
    newProducts: [
      { title: '✨ وصل حديثاً!', body: 'تشكيلة جديدة من ELLOUL 🎨' },
      { title: '🆕 جديدنا الليلة', body: 'تصفح أحدث المنتجات الآن' },
      { title: '⭐ منتجات جديدة', body: 'أضفنا منتجات رائعة اليوم' }
    ],
    cart: [
      { title: '🛒 سلتك بانتظارك', body: 'منتجاتك المفضلة على وشك النفاد' },
      { title: '💙 نسيت حاجة؟', body: 'سلتك لسه فيها منتجات' },
      { title: '⏰ أكمِل طلبك', body: 'منتجاتك محفوظة — لا تفقدها' }
    ],
    priceDrop: [
      { title: '📉 السعر انخفض!', body: 'المنتج اللي شاهدته صار أرخص' },
      { title: '💰 وفّر أكثر', body: 'عرض خاص على منتجاتك المفضلة' }
    ],
    restock: [
      { title: '✅ رجع المخزون!', body: 'منتجك المفضل متوفر الآن' },
      { title: '🎯 صار متوفر', body: 'اطلب الآن قبل ينفد تاني' }
    ],
    orderUpdate: [
      { title: '📦 طلبك في الطريق', body: 'شحن الطلب — هيوصل قريب 🚚' },
      { title: '✅ تم التأكيد', body: 'طلبك قيد التحضير الآن' }
    ]
  };

  /* ═══ State ═══ */
  var askTimer = null;
  var checkTimer = null;
  var swMessageHandler = null;

  /* ═══ Utils ═══ */
  function isSupported() {
    try {
      return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
    } catch (e) { return false; }
  }

  function getPermission() {
    if (!isSupported()) return 'unsupported';
    try { return Notification.permission || 'default'; }
    catch (e) { return 'unsupported'; }
  }

  function lsGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }
  function lsDel(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  /* ═══ Preferences ═══ */
  function getPrefs() {
    try {
      var raw = lsGet(PREFS_KEY, null);
      if (!raw) return deepClone(DEFAULT_PREFS);
      var saved = JSON.parse(raw);
      var merged = deepClone(DEFAULT_PREFS);
      Object.keys(saved).forEach(function (k) {
        if (k === 'categories' && typeof saved[k] === 'object') {
          Object.keys(saved[k]).forEach(function (ck) {
            if (typeof saved[k][ck] === 'boolean') merged.categories[ck] = saved[k][ck];
          });
        } else if (k === 'quietHours' && typeof saved[k] === 'object') {
          Object.keys(saved[k]).forEach(function (ck) {
            merged.quietHours[ck] = saved[k][ck];
          });
        } else {
          merged[k] = saved[k];
        }
      });
      return merged;
    } catch (e) {
      return deepClone(DEFAULT_PREFS);
    }
  }

  function setPrefs(patch) {
    var cur = getPrefs();
    var next = deepMerge(cur, patch);
    lsSet(PREFS_KEY, JSON.stringify(next));
    /* notify UI */
    try { window.dispatchEvent(new CustomEvent('elloul:notif-prefs-changed', { detail: next })); } catch (e) {}
    return next;
  }

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function deepMerge(a, b) {
    var out = deepClone(a);
    if (!b) return out;
    Object.keys(b).forEach(function (k) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
        out[k] = deepMerge(out[k] || {}, b[k]);
      } else {
        out[k] = b[k];
      }
    });
    return out;
  }

  /* ═══ Quiet Hours ═══ */
  function isQuietHour() {
    var prefs = getPrefs();
    if (!prefs.quietHours || !prefs.quietHours.enabled) return false;
    var h = new Date().getHours();
    var from = prefs.quietHours.from;
    var to = prefs.quietHours.to;
    if (from === to) return false;
    if (from < to) return h >= from && h < to;
    /* crosses midnight, e.g. 22 → 09 */
    return h >= from || h < to;
  }

  /* ═══ History ═══ */
  function getHistory() {
    try { return JSON.parse(lsGet(HIST_KEY, '[]')); }
    catch (e) { return []; }
  }
  function pushHistory(item) {
    var hist = getHistory();
    hist.unshift(Object.assign({ ts: Date.now() }, item));
    if (hist.length > MAX_HISTORY) hist = hist.slice(0, MAX_HISTORY);
    lsSet(HIST_KEY, JSON.stringify(hist));
    try { window.dispatchEvent(new CustomEvent('elloul:notif-history-changed')); } catch (e) {}
  }

  /* ═══ Cooldown check ═══ */
  function canSend(category) {
    var prefs = getPrefs();
    if (!prefs.enabled) return false;
    if (category && !prefs.categories[category]) return false;
    if (isQuietHour()) return false;

    var last = parseInt(lsGet(LAST_KEY, '0'), 10) || 0;
    var minMs = (prefs.minInterval || 24) * 60 * 60 * 1000;
    if (Date.now() - last < minMs) return false;

    return true;
  }

  /* ═══ Rich Notification ═══ */
  async function show(title, body, opts) {
    if (!isSupported()) return false;
    if (getPermission() !== 'granted') return false;

    var prefs = getPrefs();
    var options = Object.assign({
      body: body,
      icon: './assets/icons/icon-192x192.png',
      badge: './assets/icons/icon-96x96.png',
      tag: 'elloul-' + (opts && opts.category ? opts.category : 'general'),
      renotify: false,
      requireInteraction: false,
      silent: prefs.sound === false,
      data: {
        url: (opts && opts.url) || './#shop',
        category: (opts && opts.category) || 'general',
        ts: Date.now()
      }
    }, opts || {});

    /* vibration */
    if (prefs.vibration !== false) options.vibrate = [200, 100, 200];
    else options.vibrate = [];

    /* remove data from options spread, we already built it */
    if (opts && opts.data) Object.assign(options.data, opts.data);

    try {
      var reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
      lsSet(LAST_KEY, String(Date.now()));
      pushHistory({
        title: title,
        body: body,
        category: options.data.category
      });
      return true;
    } catch (e) { return false; }
  }

  /* ═══ Send by Category ═══ */
  function sendByCategory(category) {
    if (!canSend(category)) return false;
    var bank = CONTENT[category];
    if (!bank || !bank.length) return false;
    var item = bank[Math.floor(Math.random() * bank.length)];
    return show(item.title, item.body, { category: category });
  }

  /* ═══ Auto Check ═══ */
  function checkAndSend() {
    if (!isSupported()) return;
    if (getPermission() !== 'granted') return;

    var prefs = getPrefs();
    if (!prefs.enabled) return;

    /* pick categories in order of priority */
    var order = ['offers', 'newProducts', 'cart', 'restock', 'priceDrop'];
    for (var i = 0; i < order.length; i++) {
      if (canSend(order[i])) {
        var sent = sendByCategory(order[i]);
        if (sent) break;
      }
    }
  }

  /* ═══ Ask Permission ═══ */
  function ask() {
    if (!isSupported()) return;
    if (getPermission() !== 'default') return;
    if (lsGet(PERM_KEY, null) === 'denied') return;
    if (typeof Swal === 'undefined') return;

    var isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      title: '🔔 فعّل الإشعارات؟',
      html: '<p style="line-height:1.8;font-size:13.5px;margin:0">' +
            'هنبلغك بالعروض والمنتجات الجديدة.<br>' +
            '<strong style="color:var(--c, #3b82f6)">بدون إزعاج — وعدنا 💙</strong></p>',
      showCancelButton: true,
      confirmButtonText: 'فعّل',
      cancelButtonText: 'لاحقاً',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    }).then(function (res) {
      if (res.isConfirmed) requestPermission();
      else lsSet(PERM_KEY, 'denied');
    });
  }

  async function requestPermission() {
    try {
      var permission = await Notification.requestPermission();
      lsSet(PERM_KEY, permission);

      if (permission === 'granted') {
        try {
          await show(
            '🎉 تم تفعيل الإشعارات!',
            'هنبلغك بكل جديد مميز من ELLOUL 💙',
            { category: 'general', url: './' }
          );
        } catch (e) {}
        startLoop();
        try { window.dispatchEvent(new CustomEvent('elloul:notif-permission', { detail: 'granted' })); } catch (e) {}
      }
    } catch (e) {}
  }

  /* ═══ Loop ═══ */
  function startLoop() {
    if (checkTimer) clearInterval(checkTimer);
    setTimeout(checkAndSend, 5 * 1000);
    checkTimer = setInterval(checkAndSend, CHECK_INTERVAL);
  }
  function stopLoop() {
    if (checkTimer) { clearInterval(checkTimer); checkTimer = null; }
  }

  /* ═══ SW Messages ═══ */
  function hookSWMessages() {
    if (!('serviceWorker' in navigator)) return;
    swMessageHandler = function (event) {
      if (event.data && event.data.type === 'OPEN_URL') {
        if (window.ELLOUL_navigateEnhanced) window.ELLOUL_navigateEnhanced(event.data.url);
        else if (window.ELLOUL_navigate) window.ELLOUL_navigate(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', swMessageHandler);
  }

  /* ═══ Boot ═══ */
  function boot() {
    hookSWMessages();
    if (!isSupported()) return;

    var perm = getPermission();
    if (perm === 'default' && lsGet(PERM_KEY, null) !== 'denied') {
      askTimer = setTimeout(ask, ASK_DELAY_MS);
    }
    if (perm === 'granted') startLoop();
  }

  function cleanup() {
    if (askTimer) { clearTimeout(askTimer); askTimer = null; }
    stopLoop();
    if (swMessageHandler && 'serviceWorker' in navigator) {
      try { navigator.serviceWorker.removeEventListener('message', swMessageHandler); } catch (e) {}
      swMessageHandler = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══ Public API ═══ */
  window.ELLOUL_NOTIF = {
    supported: isSupported,
    permission: getPermission,
    ask: ask,
    request: requestPermission,
    show: show,
    sendByCategory: sendByCategory,
    test: function () {
      return show('🧪 إشعار تجريبي', 'الإشعارات تعمل بنجاح 🎉', { category: 'general' });
    },
    testRich: function () {
      return show(
        '🎁 تك، تك! هدايا قد وصلت',
        'حظك جديد! 🍀 شوف العرض الجديد',
        { category: 'offers', url: './#shop' }
      );
    },
    forceCheck: checkAndSend,
    prefs: { get: getPrefs, set: setPrefs },
    history: { get: getHistory, clear: function () { lsDel(HIST_KEY); try { window.dispatchEvent(new CustomEvent('elloul:notif-history-changed')); } catch (e) {} } },
    isQuietHour: isQuietHour,
    reset: function () { lsDel(PERM_KEY); lsDel(PREFS_KEY); lsDel(HIST_KEY); lsDel(LAST_KEY); },
    start: startLoop,
    stop: stopLoop
  };

  /* attach to elloul console namespace */
  function attach() {
    if (window.elloul && !window.elloul.notif) {
      window.elloul.notif = window.ELLOUL_NOTIF;
    }
  }
  if (window.elloul) attach();
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(attach, 300); }, { once: true });

})();