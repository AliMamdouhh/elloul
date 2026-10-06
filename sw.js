/* ═══════════════════════════════════════════════════════════
   ELLOUL — Service Worker
   ✅ Cache-first for static assets
   ✅ Network-first for Firebase
   ✅ Offline fallback
   ═══════════════════════════════════════════════════════════ */
'use strict';

const CACHE_VERSION = 'elloul-v3.0.0';
const CACHE_STATIC  = CACHE_VERSION + '-static';
const CACHE_DYNAMIC = CACHE_VERSION + '-dynamic';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/fonts/tajawal.css',
  './assets/css/theme.css',
  './assets/css/main.css',
  './assets/css/fluid.css',
  './assets/css/cinematic.css',
  './assets/css/extras.css',
  './assets/js/theme.js',
  './assets/js/console-brand.js',
  './assets/js/boot.js',
  './assets/js/icons.js',
  './assets/js/app.js',
  './assets/js/store.js',
  './assets/js/effects.js',
  './assets/js/extras/seo-plus.js',
  './assets/js/extras/search-console.js',
  './assets/js/extras/pwa-install.js',
  './assets/images/logo.png',
  './assets/css/phase2.css',
  './assets/css/phase3.css',
  './assets/js/extras/loyalty.js',
  './assets/js/extras/upsell.js',
  './assets/js/extras/urgency.js',
  './assets/js/extras/abandoned-cart.js',
  './assets/js/extras/recently-viewed.js',
  './assets/js/extras/compare.js',
  './assets/js/extras/quick-view.js',
  './assets/js/extras/perf-monitor.js',
  './assets/js/extras/error-reporter.js',
  './assets/js/extras/cache-manager.js',
  './assets/js/extras/anti-copy.js',
  './assets/js/extras/watermark.js',
  // في STATIC_ASSETS
'./assets/css/phase4.css',
'./assets/js/extras/voice-search.js',
'./assets/js/extras/share-menu.js',
'./assets/js/extras/live-chat.js',
'./assets/js/extras/notifications.js',
'./assets/js/extras/print-receipt.js',
'./assets/js/extras/gift-wrap.js',
'./assets/js/extras/delivery-estimate.js',
'./assets/js/extras/whatsapp-status.js'
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>لا يوجد اتصال — ELLOUL</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#08080d;color:#f4f6fa;font-family:system-ui,Tahoma,sans-serif;text-align:center;padding:24px}
    h1{font-size:48px;margin:0 0 16px}
    p{color:#94a3b8;line-height:1.7;max-width:400px}
    a{display:inline-block;margin-top:24px;padding:12px 28px;background:#3b82f6;color:#fff;
    text-decoration:none;border-radius:12px;font-weight:bold}
  </style>
</head>
<body>
  <div>
    <h1>📡</h1>
    <h2>لا يوجد اتصال بالإنترنت</h2>
    <p>يمكنك تصفح الصفحات المحفوظة، أو حاول مرة أخرى بعد استعادة الاتصال.</p>
    <a href="./" onclick="location.reload()">🔄 إعادة المحاولة</a>
  </div>
</body>
</html>`;

/* ────────── Install ────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Install failed:', err))
  );
});

/* ────────── Activate ────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('elloul-') && k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ────────── Fetch ────────── */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  /* تجاهل غير GET */
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* تجاهل Firebase / Google / Analytics / WhatsApp */
  if (/firestore|googleapis|gstatic|google-analytics|googletagmanager|wa\.me|facebook/.test(url.hostname + url.pathname)) {
    return;
  }

  /* تجاهل طلبات خارج نفس النطاق */
  if (url.origin !== self.location.origin) return;

  /* طلبات التنقل → Network-first مع fallback */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
        .catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
    );
    return;
  }

  /* باقي الطلبات → Cache-first مع update في الخلفية */
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_DYNAMIC).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

/* ────────── Skip Waiting message ────────── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});