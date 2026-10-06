'use strict';

/* ═══════════════════════════════════════════
   PWA Manager — ELLOUL
   ═══════════════════════════════════════════ */

let deferredPrompt = null;
let newWorker = null;


/* ─────────── تسجيل Service Worker ─────────── */
export function registerServiceWorker() {
  /* تجاهل SW في بيئة التطوير */
/* ⚠️ الحل: نُلغي SW فقط في file:// 
   على localhost نُفعّله عادي */
if (location.protocol === 'file:') {
  console.log('[PWA] 🔧 file:// protocol - SW disabled');
  return;
}  

  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] SW not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const existing = await navigator.serviceWorker.getRegistrations();
      if (existing.length > 0) {
        console.log('[PWA] 🧹 Unregistering', existing.length, 'old SWs');
        await Promise.all(existing.map(r => r.unregister()));
      }

      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('[PWA] ✅ SW registered:', registration.scope);

      registration.addEventListener('updatefound', () => {
        newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(registration);
          }
        });
      });

      setInterval(() => {
        registration.update().catch(() => {});
      }, 60000);

    } catch (error) {
      console.error('[PWA] ❌ SW failed:', error);
    }
  });
}


/* ─────────── إشعار التحديث ─────────── */
function showUpdateToast(registration) {
  if (typeof Swal === 'undefined') return;

  Swal.fire({
    title: '🎉 تحديث جديد متاح!',
    text: 'يوجد إصدار أحدث من الموقع. هل تريد التحديث الآن؟',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'تحديث الآن',
    cancelButtonText: 'لاحقاً',
    background: '#181c24',
    color: '#f2f5f8',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      if (newWorker) newWorker.postMessage('SKIP_WAITING');
      window.location.reload();
    }
  });
}


/* ─────────── قبل التثبيت ─────────── */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] 📱 جاهز للتثبيت');
  showInstallButton();
});


/* ─────────── زر التثبيت العائم ─────────── */
function showInstallButton() {
  if (document.getElementById('pwaInstallBtn')) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;

  const dismissedAt = localStorage.getItem('pwa-install-dismissed');
  if (dismissedAt) {
    const diff = Date.now() - parseInt(dismissedAt, 10);
    /* لا تعرض الزر قبل 3 أيام من الإغلاق */
    if (diff < 3 * 24 * 60 * 60 * 1000) return;
  }

  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>ثبّت التطبيق</span>
    <span class="pwa-close" aria-label="إغلاق">×</span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #pwaInstallBtn {
      position: fixed; bottom: 90px; left: 50%;
      transform: translateX(-50%) translateY(120px);
      background: linear-gradient(135deg, hsl(204, 85%, 55%), hsl(204, 85%, 45%));
      color: #fff; border: none;
      padding: 12px 20px 12px 24px; border-radius: 50px;
      display: flex; align-items: center; gap: 10px;
      font-family: 'Tajawal', sans-serif; font-size: 14px; font-weight: 600;
      cursor: pointer; z-index: 9998;
      box-shadow: 0 12px 32px hsla(204, 85%, 52%, 0.45);
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      opacity: 0; direction: rtl;
    }
    #pwaInstallBtn.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    #pwaInstallBtn:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 16px 40px hsla(204, 85%, 52%, 0.6); }
    #pwaInstallBtn svg { flex-shrink: 0; }
    #pwaInstallBtn .pwa-close {
      background: rgba(255, 255, 255, 0.15); border: none; color: #fff;
      width: 24px; height: 24px; border-radius: 50%;
      font-size: 16px; line-height: 1; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      margin-right: 4px; padding: 0; transition: background 0.2s ease;
    }
    #pwaInstallBtn .pwa-close:hover { background: rgba(255, 255, 255, 0.3); }
    @media (max-width: 640px) {
      #pwaInstallBtn { bottom: 110px; font-size: 13px; padding: 11px 16px 11px 20px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(btn);

  setTimeout(() => btn.classList.add('visible'), 300);

  /* زر الإغلاق */
  btn.querySelector('.pwa-close').addEventListener('click', (e) => {
    e.stopPropagation();
    hideInstallButton();
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  });

  /* زر التثبيت */
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] ✅ تم قبول التثبيت');
      hideInstallButton();
    } else {
      console.log('[PWA] ❌ تم رفض التثبيت');
    }
    deferredPrompt = null;
  });
}

function hideInstallButton() {
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) {
    btn.classList.remove('visible');
    setTimeout(() => btn.remove(), 400);
  }
}


/* ─────────── بعد التثبيت ─────────── */
window.addEventListener('appinstalled', () => {
  console.log('[PWA] 🎉 تم تثبيت التطبيق بنجاح');
  deferredPrompt = null;
  hideInstallButton();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: '🎉 تم التثبيت!',
      text: 'يمكنك الآن فتح الموقع من الشاشة الرئيسية',
      timer: 3000,
      showConfirmButton: false,
      background: '#181c24',
      color: '#f2f5f8'
    });
  }
});


/* ─────────── اكتشاف iOS ─────────── */
export function showIOSInstallHint() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;
  const isDismissed = localStorage.getItem('ios-hint-dismissed');

  if (!isIOS || isStandalone || isDismissed) return;

  setTimeout(() => {
    if (typeof Swal === 'undefined') return;
    Swal.fire({
      title: '📱 ثبّت التطبيق',
      html: `
        <div style="text-align: center; direction: rtl;">
          <p style="margin-bottom: 20px; line-height: 1.7;">لتثبيت الموقع كتطبيق على جهاز iPhone/iPad:</p>
          <div style="text-align: right; background: rgba(59,130,246,0.1); padding: 16px; border-radius: 14px; border: 1px solid rgba(59,130,246,0.25);">
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #3b82f6;">1.</strong> اضغط على زر <strong>المشاركة</strong></p>
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #3b82f6;">2.</strong> اختر <strong>إضافة إلى الشاشة الرئيسية</strong></p>
            <p style="margin: 8px 0; font-size: 14px;"><strong style="color: #3b82f6;">3.</strong> اضغط <strong>إضافة</strong></p>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'فهمت',
      cancelButtonText: 'لاحقاً',
      background: '#181c24',
      color: '#f2f5f8',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280'
    }).then(() => {
      localStorage.setItem('ios-hint-dismissed', 'true');
    });
  }, 3000);
}


/* ─────────── مراقب الاتصال — بدون إعادة توجيه! ─────────── */
export function setupConnectionWatcher() {
  let wasOffline = false;

  window.addEventListener('online', () => {
    console.log('[PWA] ✅ عاد الاتصال');
    if (wasOffline) {
      wasOffline = false;
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          toast: true,
          position: 'top-start',
          icon: 'success',
          title: 'عاد الاتصال بالإنترنت',
          showConfirmButton: false,
          timer: 2000,
          background: '#181c24',
          color: '#f2f5f8'
        });
      }
    }
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] ❌ فقد الاتصال');
    wasOffline = true;
    /* فقط إشعار — لا توجيه! */
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-start',
        icon: 'warning',
        title: 'انقطع الاتصال — يمكنك التصفح من الكاش',
        showConfirmButton: false,
        timer: 3500,
        background: '#181c24',
        color: '#f2f5f8'
      });
    }
  });
}