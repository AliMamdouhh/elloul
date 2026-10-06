/* ═══════════════════════════════════════════════════════════
   ANTI-COPY — حماية المحتوى
   v2.0 — دعم Mac + cleanup + debounce + تنبيهات ذكية
   ✅ منع Ctrl/Cmd+U/S/P (بشكل انتقائي)
   ✅ منع السحب للصور
   ✅ إضافة مصدر عند النسخ
   ✅ كشف DevTools (تنبيه مرة واحدة لكل جلسة)
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_ANTICOPY_READY__) return;
  window.__ELLOUL_ANTICOPY_READY__ = true;

  /* ═══════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════ */
  const CONFIG = {
  blockCtrlU:        false,  // ← لا فايدة أمنية
  blockCtrlS:        false,  // ← بيضايق
  blockCtrlP:        false,
  blockCtrlShiftI:   false,
  blockF12:          false,
  blockImageDrag:    true,   // ← خليه (بيمنع السحب العشوائي)
  addSourceOnCopy:   true,   // ← خليه (مفيد للـ SEO)
  warnDevTools:      false,  // ← أوقف الـ polling
  warnDebounceMs:    2000
};

  const BRAND = {
    name: 'ELLOUL',
    url: 'https://elloul.store'
  };

  const isDev =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '';

  /* ═══════════════════════════════════════════
     State
     ═══════════════════════════════════════════ */
  let devtoolsWatchTimer = null;
  let lastWarnAt = 0;

  /* ═══════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════ */

  /* ✅ دعم Mac + Windows + Linux */
  function isModifier(e) {
    return e.ctrlKey || e.metaKey;
  }

  /* ✅ اسمح داخل حقول الإدخال دائماً */
  function isEditableTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  /* ✅ Toast مع debounce — لا يتكرر بسرعة */
  function showWarning(msg) {
    const now = Date.now();
    if (now - lastWarnAt < CONFIG.warnDebounceMs) return;
    lastWarnAt = now;

    if (typeof Swal === 'undefined') return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      toast: true,
      position: 'top-start',
      icon: 'warning',
      title: msg,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    });
  }

  /* ═══════════════════════════════════════════
     1. منع اختصارات لوحة المفاتيح
     ═══════════════════════════════════════════ */
  function blockShortcuts() {
    document.addEventListener('keydown', (e) => {
      /* تجاهل الحقول */
      if (isEditableTarget(e.target)) return;

      /* تجاهل لو لا يوجد Ctrl/Cmd */
      if (!isModifier(e)) return;

      /* اسمح بـ Ctrl+Shift+... مع ترك المفاتيح */
      const key = (e.key || '').toLowerCase();

      /* ── Ctrl/Cmd+U ── */
      if (CONFIG.blockCtrlU && key === 'u' && !e.shiftKey) {
        e.preventDefault();
        showWarning('⚠️ عرض الكود غير مسموح');
        return false;
      }

      /* ── Ctrl/Cmd+S ── */
      if (CONFIG.blockCtrlS && key === 's' && !e.shiftKey) {
        e.preventDefault();
        showWarning('⚠️ حفظ الصفحة غير مسموح');
        return false;
      }

      /* ── Ctrl/Cmd+P ── */
      if (CONFIG.blockCtrlP && key === 'p' && !e.shiftKey) {
        e.preventDefault();
        showWarning('⚠️ الطباعة غير مسموحة');
        return false;
      }

      /* ── Ctrl/Cmd+Shift+I ── */
      if (CONFIG.blockCtrlShiftI && key === 'i' && e.shiftKey) {
        e.preventDefault();
        return false;
      }

      /* ── Ctrl/Cmd+Shift+J (Console) ── */
      if (CONFIG.blockCtrlShiftI && key === 'j' && e.shiftKey) {
        e.preventDefault();
        return false;
      }

      /* ── Ctrl/Cmd+Shift+C (Inspect) ── */
      if (CONFIG.blockCtrlShiftI && key === 'c' && e.shiftKey) {
        e.preventDefault();
        return false;
      }
    }, true);

    /* ── F12 ── */
    if (CONFIG.blockF12) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
      }, true);
    }
  }

  /* ═══════════════════════════════════════════
     2. منع سحب الصور
     ═══════════════════════════════════════════ */
  function blockImageDrag() {
    if (!CONFIG.blockImageDrag) return;

    document.addEventListener('dragstart', (e) => {
      const target = e.target;
      if (!target || !target.tagName) return;

      const tag = target.tagName.toLowerCase();
      if (tag === 'img' || tag === 'picture' || tag === 'svg') {
        e.preventDefault();
        return false;
      }
    }, true);
  }

  /* ═══════════════════════════════════════════
     3. إضافة مصدر عند النسخ
     ═══════════════════════════════════════════ */
  function addSourceOnCopy() {
    if (!CONFIG.addSourceOnCopy) return;

    document.addEventListener('copy', (e) => {
      /* تجاهل الحقول */
      if (isEditableTarget(e.target)) return;

      let sel = '';
      try {
        sel = window.getSelection().toString();
      } catch(err) { return; }

      /* تجاهل النصوص القصيرة */
      if (!sel || sel.trim().length < 20) return;

      const year = new Date().getFullYear();
      const attribution = '\n\n——\n' + BRAND.name + ' · ' + BRAND.url + '\n© ' + year;

      try {
        e.clipboardData.setData('text/plain', sel + attribution);
        e.preventDefault();
      } catch(err) {}
    }, true);
  }

  /* ═══════════════════════════════════════════
     4. كشف DevTools — تنبيه مرة واحدة لكل جلسة
     ═══════════════════════════════════════════ */
  const SESSION_KEY = 'elloul-devtools-notified';

  function wasNotified() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
    catch(e) { return false; }
  }

  function markNotified() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(e) {}
  }

  function isDevToolsOpen() {
    /* مقارنة الأبعاد الخارجية والداخلية */
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const threshold = 160;

    return widthDiff > threshold || heightDiff > threshold;
  }

  function notifyDevToolsOnce() {
    if (wasNotified()) return;
    markNotified();

    console.log(
      '%c👨‍💻 مرحباً بك في Console ELLOUL!',
      'color:#60a5fa; font-size:16px; font-weight:900; padding:8px 12px; background:#0a1229; border-radius:8px;'
    );
    console.log(
      '%c  إذا أعجبك عملنا وتريد التعاون أو الاستفسار، نحن هنا 💙\n' +
      '  اكتب:  elloul()',
      'color:#94a3b8; font-size:12px; padding:4px 0; line-height:1.7;'
    );
  }

  function checkDevTools() {
    if (isDevToolsOpen()) {
      notifyDevToolsOnce();
    }
  }

  function startDevToolsWatch() {
    if (!CONFIG.warnDevTools) return;
    if (isDev) return;  // لا تُزعج المطوّر في dev

    /* فحص أولي */
    checkDevTools();

    /* فحص دوري كل 2 ثوان */
    devtoolsWatchTimer = setInterval(checkDevTools, 2000);
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (devtoolsWatchTimer) {
      clearInterval(devtoolsWatchTimer);
      devtoolsWatchTimer = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    blockShortcuts();
    blockImageDrag();
    addSourceOnCopy();
    startDevToolsWatch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_ANTICOPY = {
    config: CONFIG,
    isDevtoolsOpen: isDevToolsOpen,
    isMac: () => /Mac|iPad|iPhone|iPod/.test(navigator.platform || ''),
    enable: (key) => { if (key in CONFIG) CONFIG[key] = true; },
    disable: (key) => { if (key in CONFIG) CONFIG[key] = false; },
    resetNotify: () => {
      try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
      lastWarnAt = 0;
    }
  };

})();