/* ═══════════════════════════════════════════════════════════
   WHATSAPP-STATUS — حالة المتجر (مفتوح/مغلق)
   v2.0 — توقيت مصر + cleanup + smart updates
   ✅ يعرض في السايدبار
   ✅ يحسب حسب مواعيد العمل (توقيت القاهرة)
   ✅ يُحدّث تلقائياً عند التحولات
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_STATUS_READY__) return;
  window.__ELLOUL_STATUS_READY__ = true;

  const WA_NUMBER = '201206796831';

  /* ✅ مواعيد العمل بتوقيت القاهرة (الساعة المحلية للعميل قد تختلف) */
  const HOURS = {
    /* 0=الأحد ... 6=السبت */
    schedule: {
      6: { open: 9, close: 21 },   // السبت
      0: { open: 9, close: 21 },   // الأحد
      1: { open: 9, close: 21 },   // الاثنين
      2: { open: 9, close: 21 },   // الثلاثاء
      3: { open: 9, close: 21 },   // الأربعاء
      4: { open: 9, close: 21 },   // الخميس
      5: null                      // الجمعة — مغلق
    }
  };

  /* ═══════════════════════════════════════════
     State
     ═══════════════════════════════════════════ */
  let refreshTimer = null;
  let sidebarObserver = null;
  let injectedItem = null;

  /* ═══════════════════════════════════════════
     توقيت القاهرة
     ═══════════════════════════════════════════ */
  function getCairoTime() {
    try {
      /* استخدام Intl للحصول على ساعة القاهرة */
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false
      }).formatToParts(new Date());

      const map = {};
      parts.forEach(p => { map[p.type] = p.value; });

      /* تحويل اسم اليوم إلى رقم (0=الأحد) */
      const dayMap = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3,
        'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      const day = dayMap[map.weekday] ?? new Date().getDay();

      /* hour قد يكون "24" في بعض البيئات → "0" */
      let hour = parseInt(map.hour, 10);
      if (hour === 24) hour = 0;

      const minute = parseInt(map.minute, 10);

      return {
        day,
        hour,
        minute,
        totalMinutes: hour * 60 + minute
      };
    } catch(e) {
      /* fallback: الوقت المحلي */
      const now = new Date();
      return {
        day: now.getDay(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        totalMinutes: now.getHours() * 60 + now.getMinutes()
      };
    }
  }

  /* ═══════════════════════════════════════════
     تحديد الحالة
     ═══════════════════════════════════════════ */
  function getStatus() {
    const t = getCairoTime();
    const today = HOURS.schedule[t.day];

    /* يوم مغلق (الجمعة) */
    if (!today) {
      return {
        open: false,
        state: 'closed-day',
        text: 'مغلق اليوم',
        hint: 'نفتح غداً السبت الساعة 9 صباحاً',
        emoji: '🔴'
      };
    }

    const openMinutes = today.open * 60;
    const closeMinutes = today.close * 60;

    /* قبل الافتتاح */
    if (t.totalMinutes < openMinutes) {
      const remaining = openMinutes - t.totalMinutes;
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;

      let hint = 'نفتح ';
      if (h > 0) hint += 'بعد ' + h + ' س ';
      if (m > 0) hint += (h > 0 ? 'و ' : 'بعد ') + m + ' د';
      if (h === 0 && m === 0) hint = 'نفتح الآن';

      return {
        open: false,
        state: 'before-open',
        text: 'مغلق حالياً',
        hint,
        emoji: '🟡'
      };
    }

    /* بعد الإغلاق */
    if (t.totalMinutes >= closeMinutes) {
      return {
        open: false,
        state: 'after-close',
        text: 'انتهى دوامنا اليوم',
        hint: 'نفتح غداً الساعة 9 صباحاً',
        emoji: '🔴'
      };
    }

    /* مفتوح */
    const remaining = closeMinutes - t.totalMinutes;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;

    let hint = 'يغلق ';
    if (h > 0) hint += 'بعد ' + h + ' س ';
    if (m > 0) hint += (h > 0 ? 'و ' : 'بعد ') + m + ' د';
    if (h === 0 && m === 0) hint = 'يغلق الآن';

    return {
      open: true,
      state: 'open',
      text: 'مفتوح الآن',
      hint,
      emoji: '🟢'
    };
  }

  /* ═══════════════════════════════════════════
     الحقن في السايدبار
     ═══════════════════════════════════════════ */
  function buildStatusItem() {
    const status = getStatus();

    const li = document.createElement('li');
    li.className = 'contact-item wa-status-item';
    li.dataset.statusState = status.state;
    li.innerHTML = `
      <div class="icon-box"><ion-icon name="time-outline"></ion-icon></div>
      <div class="contact-info">
        <p class="contact-title">حالة المتجر</p>
        <span class="contact-link wa-status-text">
          ${status.emoji} ${status.text}
          <small style="display:block;opacity:0.7;font-size:10px;margin-top:2px;">${status.hint}</small>
        </span>
      </div>
    `;

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(li);
    }

    return li;
  }

  function removeExisting() {
    /* احذف كل النسخ القديمة */
    document.querySelectorAll('.wa-status-item').forEach(el => el.remove());
    injectedItem = null;
  }

  function injectStatus() {
    const sidebar = document.querySelector('.sidebar-info_more .contacts-list');
    if (!sidebar) return false;

    /* ✅ حماية: احذف القديم دائماً ثم أضف الجديد */
    removeExisting();

    injectedItem = buildStatusItem();
    sidebar.appendChild(injectedItem);
    return true;
  }

  /* ═══════════════════════════════════════════
     تعديل سلوك أزرار الواتساب
     ═══════════════════════════════════════════ */
  function adjustWhatsAppLinks() {
    const status = getStatus();

    document.querySelectorAll('[data-checkout], .live-chat-open-wa').forEach(el => {
      if (!el) return;

      if (status.open) {
        /* إزالة مؤشرات الإغلاق */
        el.classList.remove('store-closed-indicator');
        el.removeAttribute('title');
        delete el.dataset.statusAdjusted;
        return;
      }

      /* إضافة مؤشر مغلق */
      el.classList.add('store-closed-indicator');
      el.title = status.text + ' — ' + status.hint;
      el.dataset.statusAdjusted = '1';
    });
  }

  /* ═══════════════════════════════════════════
     مؤقّت ذكي — يُحدّث عند التحولات
     ═══════════════════════════════════════════ */
  function scheduleNextRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);

    const t = getCairoTime();
    const today = HOURS.schedule[t.day];

    let nextChangeMinutes = null;

    if (today) {
      const openMinutes = today.open * 60;
      const closeMinutes = today.close * 60;

      if (t.totalMinutes < openMinutes) {
        /* يقترب من الافتتاح */
        nextChangeMinutes = openMinutes;
      } else if (t.totalMinutes < closeMinutes) {
        /* يقترب من الإغلاق */
        nextChangeMinutes = closeMinutes;
      } else {
        /* غداً صباحاً */
        const remainingToMidnight = 24 * 60 - t.totalMinutes;
        nextChangeMinutes = remainingToMidnight + 9 * 60;
      }
    } else {
      /* غداً صباحاً */
      const remainingToMidnight = 24 * 60 - t.totalMinutes;
      nextChangeMinutes = remainingToMidnight + 9 * 60;
    }

    /* +1 دقيقة للتأكد من تجاوز الحد */
    const waitMinutes = Math.max(1, nextChangeMinutes - t.totalMinutes + 1);
    const waitMs = waitMinutes * 60 * 1000;

    /* حد أقصى: 1 ساعة (فحص دوري احتياطي) */
    const safeWait = Math.min(waitMs, 60 * 60 * 1000);

    refreshTimer = setTimeout(() => {
      refresh();
      scheduleNextRefresh();
    }, safeWait);
  }

  /* ═══════════════════════════════════════════
     Refresh كامل
     ═══════════════════════════════════════════ */
  function refresh() {
    const ok = injectStatus();
    adjustWhatsAppLinks();
    return ok;
  }

  /* ═══════════════════════════════════════════
     مراقبة السايدبار (لو أُعيد بناؤه)
     ═══════════════════════════════════════════ */
  function watchSidebar() {
    const sidebar = document.querySelector('.sidebar-info_more');
    if (!sidebar) return;

    if (sidebarObserver) sidebarObserver.disconnect();

    sidebarObserver = new MutationObserver(() => {
      /* لو العنصر مفقود، أضفه */
      const existing = sidebar.querySelector('.wa-status-item');
      if (!existing) {
        injectStatus();
      }
    });

    sidebarObserver.observe(sidebar, { childList: true, subtree: true });
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (sidebarObserver) {
      sidebarObserver.disconnect();
      sidebarObserver = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    /* محاولة أولى */
    refresh();
    scheduleNextRefresh();
    watchSidebar();

    /* محاولات إضافية — السايدبار قد يُبنى متأخراً */
    [500, 1200, 2500].forEach(delay => {
      setTimeout(() => {
        if (!document.querySelector('.wa-status-item')) {
          refresh();
        }
      }, delay);
    });

    /* عند تحديث المحتوى (SPA) */
    window.addEventListener('elloul:content-rendered', () => {
      setTimeout(() => {
        if (!document.querySelector('.wa-status-item')) {
          refresh();
        } else {
          adjustWhatsAppLinks();
        }
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_STATUS_STORE = {
    now: getStatus,
    refresh: () => {
      refresh();
      scheduleNextRefresh();
    },
    cairoTime: getCairoTime,
    /* كشف الـ schedule (معلومات عامة) */
    hours: Object.keys(HOURS.schedule).reduce((acc, day) => {
      acc[day] = HOURS.schedule[day] ? {
        open: HOURS.schedule[day].open,
        close: HOURS.schedule[day].close
      } : null;
      return acc;
    }, {}),
    isOpen: () => getStatus().open
  };

  /* إضافة على elloul */
  if (window.elloul) {
    window.elloul.storeStatus = window.ELLOUL_STATUS_STORE;
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.elloul && !window.elloul.storeStatus) {
          window.elloul.storeStatus = window.ELLOUL_STATUS_STORE;
        }
      }, 300);
    }, { once: true });
  }

})();