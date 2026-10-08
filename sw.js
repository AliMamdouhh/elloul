/* ═══════════════════════════════════════════════════════════
   ELLOUL — Service Worker v4.1
   استراتيجية: Cache-first للأصول + Network-first للـ HTML
   ═══════════════════════════════════════════════════════════ */

'use strict';

const SW_VERSION   = 'elloul-v4.1.0';
const STATIC_CACHE = `static-${SW_VERSION}`;
const HTML_CACHE   = `html-${SW_VERSION}`;
const IMG_CACHE    = `img-${SW_VERSION}`;
const OLD_CACHES   = ['elloul-v3', 'elloul-v2', 'elloul-v1'];

/* ─── أصول ثابتة (تُخزَّن عند التثبيت) ─── */
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './404.html',
  './500.html',
  './maintenance.html',
  './login.html',
  './order-success.html',
  './track-order.html',
  './sitemap.html',
  './about.html',
  './contact.html',
  './privacy.html',
  './terms.html',
  './returns.html',
  './manifest.json',

  './assets/css/fonts/tajawal.css',
  './assets/css/theme.css',
  './assets/css/main.css',
  './assets/css/fluid.css',
  './assets/css/cinematic.css',
  './assets/css/extras.css',
  './assets/css/phase2.css',
  './assets/css/phase3.css',
  './assets/css/phase4.css',

  './assets/js/theme.js',
  './assets/js/boot.js',
  './assets/js/icons.js',
  './assets/js/app.js',
  './assets/js/store.js',
  './assets/js/effects.js',

  './assets/images/logo.webp',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png'
];

/* ═══════════════════════════════════════════
   INSTALL — تخزين الأصول الأساسية
   ═══════════════════════════════════════════ */
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache){
        return cache.addAll(STATIC_ASSETS).catch(function(err){
          console.warn('[SW] Some static assets failed to cache:', err);
        });
      })
      .then(function(){ return self.skipWaiting(); })
  );
});

/* ═══════════════════════════════════════════
   ACTIVATE — تنظيف الكاش القديم
   ═══════════════════════════════════════════ */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key.includes(SW_VERSION)) return null;
          if(OLD_CACHES.some(function(old){ return key.includes(old); }) ||
             key.startsWith('static-') ||
             key.startsWith('html-') ||
             key.startsWith('img-')){
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* ═══════════════════════════════════════════
   FETCH — استراتيجيات متعددة
   ═══════════════════════════════════════════ */
self.addEventListener('fetch', function(event){
  const req = event.request;

  /* تجاهل غير GET */
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  /* تجاهل الطلبات الخارجية (Google Fonts, Firebase, WhatsApp...) */
  if(url.origin !== location.origin) return;

  /* تجاهل طلبات Chrome Extensions */
  if(url.protocol === 'chrome-extension:') return;

  /* ─── 1) الصور → Cache-first ─── */
  if(req.destination === 'image'){
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  /* ─── 2) CSS / JS / Fonts → Cache-first ─── */
  if(['style','script','font'].includes(req.destination)){
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  /* ─── 3) HTML → Network-first (تحديث دائم) ─── */
  if(req.destination === 'document' || req.mode === 'navigate'){
    event.respondWith(networkFirstHTML(req));
    return;
  }

  /* ─── 4) أي شيء آخر → Stale-while-revalidate ─── */
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});

/* ═══════════════════════════════════════════
   STRATEGIES
   ═══════════════════════════════════════════ */

/* Cache-first: المحفوظ أولاً، وإذا فشل → الشبكة */
async function cacheFirst(request, cacheName){
  const cached = await caches.match(request);
  if(cached) return cached;

  try{
    const response = await fetch(request);
    if(response && response.status === 200){
      const clone = response.clone();
      caches.open(cacheName).then(function(cache){ cache.put(request, clone); });
    }
    return response;
  }catch(err){
    /* fallback للصورة logo */
    if(request.destination === 'image'){
      return caches.match('./assets/images/logo.webp');
    }
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/* Network-first للـ HTML — يرجع cache في حال الفشل */
async function networkFirstHTML(request){
  try{
    const response = await fetch(request);
    if(response && response.status === 200){
      const clone = response.clone();
      caches.open(HTML_CACHE).then(function(cache){ cache.put(request, clone); });
    }
    return response;
  }catch(err){
    /* جرّب الكاش أولاً */
    const cached = await caches.match(request);
    if(cached) return cached;

    /* fallback: offline page */
    const offline = await caches.match('./offline.html');
    if(offline) return offline;

    return new Response(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;direction:rtl"><h1>لا يوجد اتصال</h1><p>افتح الصفحة الرئيسية مرة وأنت متصل.</p><a href="./">الرئيسية</a></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/* Stale-while-revalidate — قديم + تحديث في الخلفية */
async function staleWhileRevalidate(request, cacheName){
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(function(response){
    if(response && response.status === 200){
      const clone = response.clone();
      caches.open(cacheName).then(function(cache){ cache.put(request, clone); });
    }
    return response;
  }).catch(function(){ return cached; });

  return cached || fetchPromise;
}

/* ═══════════════════════════════════════════
   MESSAGE — التواصل مع الصفحات
   ═══════════════════════════════════════════ */
self.addEventListener('message', function(event){
  const data = event.data || {};

  if(data.type === 'SKIP_WAITING'){
    self.skipWaiting();
    return;
  }

  if(data.type === 'CLEAR_CACHE'){
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){
      if(event.ports && event.ports[0]){
        event.ports[0].postMessage({ ok: true });
      }
    });
    return;
  }

  if(data.type === 'GET_VERSION'){
    if(event.ports && event.ports[0]){
      event.ports[0].postMessage({ version: SW_VERSION });
    }
    return;
  }
});

/* ═══════════════════════════════════════════
   NOTIFICATION CLICK — فتح الموقع
   ═══════════════════════════════════════════ */
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(const client of list){
        if(client.url.includes(location.origin) && 'focus' in client){
          return client.focus();
        }
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ═══════════════════════════════════════════
   PUSH — إشعارات
   ═══════════════════════════════════════════ */
self.addEventListener('push', function(event){
  let data = { title: 'ELLOUL', body: 'لديك إشعار جديد' };
  try{
    if(event.data) data = event.data.json();
  }catch(e){}

  event.waitUntil(
    self.registration.showNotification(data.title || 'ELLOUL', {
      body: data.body || '',
      icon: './assets/icons/icon-192x192.png',
      badge: './assets/icons/icon-96x96.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [100, 50, 100],
      data: { url: data.url || './' }
    })
  );
});