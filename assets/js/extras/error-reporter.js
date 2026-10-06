/* ═══════════════════════════════════════════════════════════
   ERROR-REPORTER — التقاط الأخطاء وإرسال تقرير
   v2.0 — إصلاح ReferenceError + deduplication + session reset
   ✅ يلتقط JS Errors + Promise rejections + Resource errors
   ✅ يحفظ آخر 30 خطأ محلياً
   ✅ صامت افتراضياً — لا يزعج المستخدم
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_ERRORS_READY__) return;
  window.__ELLOUL_ERRORS_READY__ = true;

  const KEY = 'elloul-errors';
  const SESSION_NOTIFIED = 'elloul-errors-notified';
  const WA_NUMBER = '201206796831';
  const MAX_ERRORS = 30;
  const MAX_STACK_LENGTH = 2000;
  const MAX_MESSAGE_LENGTH = 300;
  const DEDUP_WINDOW_MS = 5000;     // تجاهل نفس الخطأ خلال 5 ثوان
  const DEV_MODE =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '';

  /* ────────── State (محلي) ────────── */
  let lastErrorSignature = '';
  let lastErrorTime = 0;

  /* ────────── تحميل/حفظ ────────── */
  function getErrors() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveError(err) {
    const errors = getErrors();
    errors.unshift(err);
    if (errors.length > MAX_ERRORS) errors.length = MAX_ERRORS;
    try { localStorage.setItem(KEY, JSON.stringify(errors)); } catch(e) {}
  }

  /* ────────── توليد توقيع للخطأ (للتكرار) ────────── */
  function makeSignature(entry) {
    return [
      entry.message || '',
      entry.source || '',
      entry.line || 0
    ].join('|').substring(0, 200);
  }

  /* ────────── حفظ خطأ ────────── */
  function captureError(entry) {
    if (!entry || !entry.message) return;

    /* تجاهل الأخطاء التي تأتي من Extensions */
    const source = entry.source || '';
    if (source.startsWith('chrome-extension://') ||
        source.startsWith('moz-extension://') ||
        source.startsWith('safari-extension://')) {
      return;
    }

    /* Deduplication */
    const signature = makeSignature(entry);
    const now = Date.now();
    if (signature === lastErrorSignature && (now - lastErrorTime) < DEDUP_WINDOW_MS) {
      return;
    }
    lastErrorSignature = signature;
    lastErrorTime = now;

    /* بناء السجل */
    const err = {
      message: String(entry.message).substring(0, MAX_MESSAGE_LENGTH),
      source: String(entry.source || '').substring(0, 200),
      line: entry.line || 0,
      col: entry.col || 0,
      stack: String(entry.stack || '').substring(0, MAX_STACK_LENGTH),
      url: location.href.substring(0, 200),
      ua: navigator.userAgent.substring(0, 200),
      ts: now
    };

    saveError(err);

    /* Dev mode: أعرض التفاصيل */
    if (DEV_MODE) {
      try {
        console.group(
          '%c🐛 [ErrorReporter]',
          'color:#ef4444; font-weight:bold;'
        );
        console.log('Message:', err.message);
        console.log('Source:', err.source + ':' + err.line + ':' + err.col);
        if (err.stack) console.log('Stack:', err.stack);
        console.groupEnd();
      } catch(e) {
        /* تجاهل لو group فشل */
        console.log('[ErrorReporter]', err.message);
      }
    }

    /* رسالة Toast — مرة واحدة فقط في الجلسة */
    showNotifyOnce();
  }

  /* ────────── Toast مرة واحدة لكل جلسة ────────── */
  function showNotifyOnce() {
    try {
      if (sessionStorage.getItem(SESSION_NOTIFIED) === '1') return;
      sessionStorage.setItem(SESSION_NOTIFIED, '1');
    } catch(e) {
      /* لو sessionStorage معطّل → لا تعرض */
      return;
    }

    if (typeof Swal === 'undefined') return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      toast: true,
      position: 'top-start',
      icon: 'info',
      title: 'واجهنا مشكلة صغيرة',
      text: 'تم تسجيلها — يمكنك المتابعة',
      showConfirmButton: false,
      timer: 3000,
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    });
  }

  /* ═══════════════════════════════════════════
     1. JS Runtime Errors (listener واحد فقط)
     ═══════════════════════════════════════════ */
  function handleError(event) {
    const target = event.target;

    /* حالة 1: خطأ JS عادي — event.target = window */
    if (!target || target === window || !target.tagName) {
      captureError({
        message: event.message || 'Unknown runtime error',
        source: event.filename || '',
        line: event.lineno || 0,
        col: event.colno || 0,
        stack: (event.error && event.error.stack) || ''
      });
      return;
    }

    /* حالة 2: فشل تحميل مورد (img/link/script) */
    const tag = (target.tagName || '').toLowerCase();
    if (tag !== 'img' && tag !== 'link' && tag !== 'script') return;

    const resource = target.src || target.href || '(unknown)';
    captureError({
      message: 'Failed to load ' + tag + ': ' + resource,
      source: 'Resource',
      line: 0,
      col: 0,
      stack: ''
    });
  }

  /* ═══════════════════════════════════════════
     2. Unhandled Promise Rejections
     ═══════════════════════════════════════════ */
  function handleRejection(event) {
    const reason = event.reason;
    captureError({
      message: (reason && reason.message) ? reason.message : String(reason || 'Unhandled promise'),
      source: 'Promise Rejection',
      line: 0,
      col: 0,
      stack: (reason && reason.stack) || ''
    });
  }

  /* ═══════════════════════════════════════════
     إضافة المستمعين
     ═══════════════════════════════════════════ */
  window.addEventListener('error', handleError, true);
  window.addEventListener('unhandledrejection', handleRejection);

  /* ═══════════════════════════════════════════
     عرض تقرير
     ═══════════════════════════════════════════ */
  function showReport() {
    const errors = getErrors();
    if (!errors.length) {
      console.log('%c✅ لا توجد أخطاء مسجّلة', 'color:#10b981; font-weight:bold;');
      return;
    }

    console.log(
      '%c🐛 تقرير الأخطاء (' + errors.length + ')',
      'color:#ef4444; font-size:15px; font-weight:900; padding:6px 0;'
    );

    console.table(errors.map((e, i) => ({
      '#': i + 1,
      'الرسالة': e.message.slice(0, 60),
      'الوقت': new Date(e.ts).toLocaleTimeString('ar-EG')
    })));

    console.log(
      '%c  💡 للمشاركة:  %celloul.errors.send()',
      'color:#94a3b8; font-size:11px;',
      'background:#f59e0b; color:#0a0f1a; font-family:monospace; padding:2px 8px; border-radius:4px; font-weight:bold;'
    );
  }

  /* ═══════════════════════════════════════════
     إرسال التقرير على واتساب
     ═══════════════════════════════════════════ */
  function sendReport() {
    const errors = getErrors();
    if (!errors.length) {
      console.log('%c✅ لا توجد أخطاء للإرسال', 'color:#10b981;');
      return;
    }

    const lines = errors.slice(0, 5).map((e, i) =>
      (i + 1) + '. ' + e.message.substring(0, 100) +
      '\n   ' + (e.source || '') + (e.line ? ':' + e.line : '')
    ).join('\n\n');

    const msg =
      'مرحباً ELLOUL 👋\n\n' +
      '🐛 تقرير أخطاء تلقائي:\n\n' +
      lines + '\n\n' +
      '———————————————\n' +
      'الرابط: ' + location.href + '\n' +
      'المتصفح: ' + navigator.userAgent.substring(0, 80) + '\n' +
      'الوقت: ' + new Date().toLocaleString('ar-EG');

    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
  }

  /* ═══════════════════════════════════════════
     مسح الأخطاء
     ═══════════════════════════════════════════ */
  function clearErrors() {
    try { localStorage.removeItem(KEY); } catch(e) {}
    try { sessionStorage.removeItem(SESSION_NOTIFIED); } catch(e) {}
    console.log('%c🗑️ تم مسح سجل الأخطاء', 'color:#10b981;');
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    window.removeEventListener('error', handleError, true);
    window.removeEventListener('unhandledrejection', handleRejection);
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     DEBUG API (معرّف قبل الاستخدام)
     ═══════════════════════════════════════════ */
  window.ELLOUL_ERRORS = {
    count: () => getErrors().length,
    list: getErrors,
    show: showReport,
    send: sendReport,
    clear: clearErrors
  };

  /* إضافة على elloul */
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.elloul) {
        window.elloul.errors = {
          count: () => getErrors().length,
          list: getErrors,
          show: showReport,
          send: sendReport,
          clear: clearErrors
        };
      }
    }, 300);
  });

})();