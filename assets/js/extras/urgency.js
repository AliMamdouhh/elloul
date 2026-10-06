/* ═══════════════════════════════════════════════════════════
   URGENCY — إشارات الاستعجال
   v2.0 — cleanup + null-safe + timer lifecycle
   ✅ مخزون محدود (hash بناءً على الـ ID — ثابت)
   ✅ عدّاد مشاهدين
   ✅ مؤقّت انتهاء العرض
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_URGENCY_READY__) return;
  window.__ELLOUL_URGENCY_READY__ = true;

  /* ────────── State ────────── */
  let modalObserver = null;
  let timerInterval = null;
  let injectTimer = null;
  const injectedCards = new WeakSet();

  /* ═══════════════════════════════════════════
     Hash ثابت من الـ ID
     ═══════════════════════════════════════════ */
  function hashCode(str) {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /* ────────── أرقام ثابتة لكل منتج ────────── */
  function getStock(id) {
    if (!id) return 10;
    const h = hashCode(id);
    return (h % 7) + 2; /* 2 إلى 8 */
  }

  function getViewers(id) {
    if (!id) return 5;
    const h = hashCode(id + 'v');
    return (h % 13) + 3; /* 3 إلى 15 */
  }

  /* ────────── نهاية اليوم ────────── */
  function getSaleEndTime() {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.getTime();
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  /* ═══════════════════════════════════════════
     حقن الشارات في بطاقات المنتجات
     ═══════════════════════════════════════════ */
  function injectUrgency() {
    document.querySelectorAll('.product-card').forEach(card => {
      /* تجاهل البطاقات المُعالَجة */
      if (injectedCards.has(card)) return;

      const id = card.dataset.productId;
      if (!id) return;

      const stock = getStock(id);
      if (stock > 5) {
        injectedCards.add(card);
        return;
      }

      const body = card.querySelector('.product-body');
      if (!body) return;

      /* حماية إضافية */
      if (body.querySelector('.urgency-badge')) {
        injectedCards.add(card);
        return;
      }

      const urgency = document.createElement('div');
      urgency.className = 'urgency-badge urgency-low-stock';
      urgency.innerHTML =
        '<span class="urgency-dot"></span>' +
        '<span>آخر ' + stock + ' قطع فقط</span>';

      body.appendChild(urgency);
      injectedCards.add(card);
    });
  }

  /* ═══════════════════════════════════════════
     لوحة الاستعجال في modal
     ═══════════════════════════════════════════ */
  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function enhanceProductModal() {
    const modal = document.querySelector('[data-product-modal-container]');
    if (!modal) return;

    modalObserver = new MutationObserver(() => {
      const isOpen = modal.classList.contains('active');

      if (!isOpen) {
        clearTimer();
        return;
      }

      /* احذف القديم */
      const oldPanel = modal.querySelector('.urgency-panel');
      if (oldPanel) oldPanel.remove();

      /* ابحث عن المنتج */
      const titleEl = modal.querySelector('[data-product-modal-title]');
      if (!titleEl) return;

      const name = titleEl.textContent.trim();
      if (!name) return;

      let currentId = null;
      document.querySelectorAll('.product-card').forEach(card => {
        const n = card.querySelector('.product-name');
        if (n && n.textContent.trim() === name) {
          currentId = card.dataset.productId;
        }
      });

      if (!currentId) return;

      const stock = getStock(currentId);
      const viewers = getViewers(currentId);
      const endTime = getSaleEndTime();

      const panel = document.createElement('div');
      panel.className = 'urgency-panel';
      panel.innerHTML =
        '<div class="urgency-row">' +
          '<span class="urgency-icon">👥</span>' +
          '<span><strong>' + viewers + '</strong> شخص يشاهد هذا الآن</span>' +
        '</div>' +
        (stock <= 5 ?
        '<div class="urgency-row urgency-row-danger">' +
          '<span class="urgency-icon">🔥</span>' +
          '<span>باقي <strong>' + stock + '</strong> قطع فقط في المخزون</span>' +
        '</div>' : '') +
        '<div class="urgency-row urgency-row-timer">' +
          '<span class="urgency-icon">⏰</span>' +
          '<span>ينتهي العرض في</span>' +
          '<span class="urgency-timer">--:--:--</span>' +
        '</div>';

      /* أضف قبل pm-actions */
      const pmBody = modal.querySelector('.pm-body');
      const actions = pmBody ? pmBody.querySelector('.pm-actions') : null;

      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(panel, actions);
      } else if (pmBody) {
        pmBody.appendChild(panel);
      }

      /* ابدأ العدّاد */
      const timerEl = panel.querySelector('.urgency-timer');
      if (timerEl) {
        const tick = () => {
          /* تحقق أن الـ modal لا يزال مفتوحاً */
          if (!modal.classList.contains('active')) {
            clearTimer();
            return;
          }
          if (!timerEl.isConnected) {
            clearTimer();
            return;
          }
          const remaining = endTime - Date.now();
          timerEl.textContent = formatTime(remaining);
        };
        tick();
        clearTimer();
        timerInterval = setInterval(tick, 1000);
      }
    });

    modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (modalObserver) {
      modalObserver.disconnect();
      modalObserver = null;
    }
    if (injectTimer) {
      clearTimeout(injectTimer);
      injectTimer = null;
    }
    clearTimer();
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    enhanceProductModal();

    window.addEventListener('elloul:content-rendered', () => {
      setTimeout(injectUrgency, 100);
    });

    injectTimer = setTimeout(() => {
      injectTimer = null;
      injectUrgency();
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_URGENCY = {
    stock: getStock,
    viewers: getViewers,
    saleEnd: getSaleEndTime,
    refresh: injectUrgency,
    hasTimer: () => !!timerInterval
  };

})();