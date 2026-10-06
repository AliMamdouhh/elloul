/* ═══════════════════════════════════════════════════════════
   LOYALTY — نظام نقاط الولاء
   v2.0 — cleanup + null-safe + DOM persistence
   ✅ 1 ج.م = 1 نقطة
   ✅ كل 100 نقطة = خصم 10 ج.م
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_LOYALTY_READY__) return;
  window.__ELLOUL_LOYALTY_READY__ = true;

  const POINTS_KEY    = 'elloul-points';
  const HISTORY_KEY   = 'elloul-points-history';
  const RATE          = 1;       // 1 EGP = 1 point
  const REDEEM_RATE   = 10;      // كل 100 نقطة = 10 EGP
  const REDEEM_STEP   = 100;     // الحد الأدنى للاستبدال
  const PRICE_CACHE   = 'elloul-price-cache';

  /* ────────── State ────────── */
  let cartObserver = null;

  /* ────────── Helpers ────────── */
  function getPoints() {
    try { return parseInt(localStorage.getItem(POINTS_KEY), 10) || 0; }
    catch(e) { return 0; }
  }

  function setPoints(n) {
    try { localStorage.setItem(POINTS_KEY, String(Math.max(0, n))); } catch(e) {}
    dispatchUpdate();
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function addHistory(type, amount, note) {
    const h = getHistory();
    h.unshift({ type, amount, note, date: Date.now() });
    if (h.length > 50) h.length = 50;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
  }

  function dispatchUpdate() {
    window.dispatchEvent(new CustomEvent('elloul:points-updated', {
      detail: { points: getPoints() }
    }));
  }

  /* ────────── كاش أسعار المنتجات (للـ checkout خارج الـ DOM) ────────── */
  function cacheProductPrices() {
    const products = {};
    document.querySelectorAll('.product-card').forEach(card => {
      const id = card.dataset.productId;
      if (!id) return;
      const priceEl = card.querySelector('.price-now');
      if (!priceEl) return;
      const price = parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0;
      if (price > 0) products[id] = price;
    });

    if (Object.keys(products).length) {
      try {
        const existing = JSON.parse(localStorage.getItem(PRICE_CACHE) || '{}');
        Object.assign(existing, products);
        localStorage.setItem(PRICE_CACHE, JSON.stringify(existing));
      } catch(e) {}
    }
  }

  function getPrice(id) {
    /* جرّب DOM أولاً */
    const card = document.querySelector('.product-card[data-product-id="' + id + '"]');
    if (card) {
      const priceEl = card.querySelector('.price-now');
      if (priceEl) {
        return parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0;
      }
    }

    /* fallback: من الكاش */
    try {
      const cache = JSON.parse(localStorage.getItem(PRICE_CACHE) || '{}');
      return cache[id] || 0;
    } catch(e) { return 0; }
  }

  /* ────────── كسب نقاط ────────── */
  function awardCheckoutPoints() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]'); } catch(e) {}
    if (!cart.length) return 0;

    let total = 0;
    cart.forEach(item => {
      total += getPrice(item.id) * (item.qty || 0);
    });

    const earned = Math.round(total * RATE);
    if (earned > 0) {
      setPoints(getPoints() + earned);
      addHistory('earn', earned, 'طلب بقيمة ' + total.toLocaleString('ar-EG') + ' ج.م');
    }
    return earned;
  }

  /* ────────── استبدال نقاط ────────── */
  function redeemPoints(amount) {
    const points = getPoints();
    if (points < amount || amount < REDEEM_STEP) return 0;

    setPoints(points - amount);
    const discount = Math.floor(amount / REDEEM_STEP) * REDEEM_RATE;
    addHistory('redeem', -amount, 'خصم ' + discount + ' ج.م');
    return discount;
  }

  /* ────────── شريط النقاط ────────── */
  function renderProgress() {
    const summary = document.querySelector('.cart-summary');
    if (!summary) return;

    const existing = summary.querySelector('.loyalty-box');
    const points = getPoints();
    const remainder = points % REDEEM_STEP;
    const nextReward = remainder === 0 && points > 0 ? REDEEM_STEP : REDEEM_STEP - remainder;
    const progress = Math.min(100, (remainder / REDEEM_STEP) * 100);
    const canRedeem = points >= REDEEM_STEP;

    const html = `
      <div class="loyalty-box">
        <div class="loyalty-head">
          <span class="loyalty-icon">🏆</span>
          <span class="loyalty-title">نقاط الولاء</span>
          <span class="loyalty-points">${points.toLocaleString('ar-EG')}</span>
        </div>
        <div class="loyalty-bar">
          <div class="loyalty-bar-fill" style="width:${progress}%"></div>
        </div>
        <p class="loyalty-hint">
          ${canRedeem
            ? `🎉 يمكنك استبدال <strong>${REDEEM_STEP}</strong> نقطة للحصول على خصم 10 ج.م`
            : `أضف <strong>${nextReward}</strong> نقطة للحصول على خصم 10 ج.م`}
        </p>
      </div>
    `;

    if (existing) {
      existing.outerHTML = html;
    } else {
      const checkoutBtn = summary.querySelector('[data-checkout]');
      if (checkoutBtn && checkoutBtn.parentNode) {
        checkoutBtn.insertAdjacentHTML('beforebegin', html);
      }
    }
  }

  /* ────────── مراقبة ────────── */
  function watchCart() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage) return;

    cartObserver = new MutationObserver(() => {
      if (cartPage.classList.contains('active')) {
        setTimeout(renderProgress, 100);
      }
    });
    cartObserver.observe(cartPage, { attributes: true, attributeFilter: ['class'] });
  }

  /* ────────── Hook checkout ────────── */
  function hookCheckout() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-checkout]');
      if (!btn) return;

      setTimeout(() => {
        const earned = awardCheckoutPoints();
        if (earned > 0 && typeof Swal !== 'undefined') {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          Swal.fire({
            toast: true,
            position: 'top-start',
            icon: 'success',
            title: '🎉 +' + earned + ' نقطة ولاء!',
            text: 'شكراً لتسوقك مع ELLOUL',
            showConfirmButton: false,
            timer: 4000,
            background: isLight ? '#ffffff' : '#181c24',
            color: isLight ? '#0a0f1a' : '#f2f5f8'
          });
        }
      }, 500);
    }, true);
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (cartObserver) {
      cartObserver.disconnect();
      cartObserver = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    cacheProductPrices();
    watchCart();
    hookCheckout();

    window.addEventListener('elloul:content-rendered', () => {
      cacheProductPrices();
      renderProgress();
    });

    window.addEventListener('elloul:points-updated', renderProgress);

    setTimeout(renderProgress, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_LOYALTY = {
    points: getPoints,
    add: (n) => setPoints(getPoints() + n),
    reset: () => { setPoints(0); addHistory('reset', 0, 'إعادة تعيين'); },
    redeem: redeemPoints,
    history: getHistory,
    cache: () => {
      try { return JSON.parse(localStorage.getItem(PRICE_CACHE) || '{}'); }
      catch(e) { return {}; }
    }
  };

  function attachToElloul() {
    if (window.elloul && !window.elloul.loyalty) {
      window.elloul.loyalty = {
        points: getPoints,
        add: (n) => setPoints(getPoints() + n),
        redeem: redeemPoints,
        history: getHistory
      };
    }
  }

  if (window.elloul) attachToElloul();
  else document.addEventListener('DOMContentLoaded', () => setTimeout(attachToElloul, 300), { once: true });

})();