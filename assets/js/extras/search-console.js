/* ═══════════════════════════════════════════════════════════
   SEARCH-CONSOLE — Analytics Events (GA4 + Internal Logger)
   v2.0 — cleanup + GA4 late-detection + navigation persistence
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_ANALYTICS_READY__) return;
  window.__ELLOUL_ANALYTICS_READY__ = true;

  const DEBUG = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1';

  const EVENTS = [];
  const MAX_EVENTS = 100;

  /* ────────── State ────────── */
  let modalObserver = null;
  let searchTimer = null;
  let navCheckInterval = null;

  /* ────────── GA4 detection (late) ────────── */
  function hasGA4() {
    return typeof window.gtag === 'function';
  }

  /* ────────── Logger ────────── */
  function logEvent(name, params) {
    if (!name) return;

    const event = {
      event: name,
      params: params || {},
      timestamp: Date.now(),
      page: (function() {
        try { return localStorage.getItem('elloul-page') || 'home'; }
        catch(e) { return 'home'; }
      })()
    };

    EVENTS.push(event);
    if (EVENTS.length > MAX_EVENTS) EVENTS.shift();

    if (hasGA4()) {
      try { window.gtag('event', name, params || {}); } catch(e) {}
    }

    if (DEBUG) {
      console.log(
        '%c📊 [Analytics] ' + name,
        'color:#10b981; font-size:11px; font-weight:bold; padding:2px 6px;',
        params || {}
      );
    }
  }

  /* ────────── getProductFromDOM ────────── */
  function getProductFromDOM(id) {
    if (!id) return null;
    const card = document.querySelector('.product-card[data-product-id="' + id + '"]');
    if (!card) return null;

    const nameEl = card.querySelector('.product-name');
    const catEl = card.querySelector('.product-cat');
    const priceEl = card.querySelector('.price-now');

    return {
      id,
      name: nameEl ? nameEl.textContent.trim() : '',
      category: catEl ? catEl.textContent.trim() : '',
      price: priceEl ? (parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0) : 0
    };
  }

  /* ────────── تتبع السلة ────────── */
  function trackCartEvents() {
    document.addEventListener('click', (e) => {
      const addEl = e.target.closest && e.target.closest('[data-add]');
      if (!addEl) return;

      const id = addEl.dataset.add;
      const product = getProductFromDOM(id);
      if (!product) return;

      logEvent('add_to_cart', {
        currency: 'EGP',
        value: product.price,
        items: [{
          item_id: id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: 1
        }]
      });
    }, true);

    /* view_item */
    const modal = document.querySelector('[data-product-modal-container]');
    if (modal) {
      modalObserver = new MutationObserver(() => {
        if (!modal.classList.contains('active')) return;

        const titleEl = modal.querySelector('[data-product-modal-title]');
        const priceEl = modal.querySelector('[data-product-modal-price]');
        const catEl = modal.querySelector('[data-product-modal-cat]');

        if (!titleEl || !priceEl) return;

        logEvent('view_item', {
          currency: 'EGP',
          value: parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0,
          items: [{
            item_name: titleEl.textContent.trim(),
            item_category: catEl ? catEl.textContent.trim() : ''
          }]
        });
      });
      modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    /* begin_checkout */
    document.addEventListener('click', (e) => {
      const checkoutEl = e.target.closest && e.target.closest('[data-checkout]');
      if (!checkoutEl) return;

      let cart = [];
      try { cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]'); } catch(e) {}
      if (!cart.length) return;

      const items = cart.map(item => {
        const p = getProductFromDOM(item.id);
        return p ? {
          item_id: item.id,
          item_name: p.name,
          item_category: p.category,
          price: p.price,
          quantity: item.qty
        } : null;
      }).filter(Boolean);

      const value = items.reduce((s, i) => s + (i.price * i.quantity), 0);

      logEvent('begin_checkout', { currency: 'EGP', value, items });
    }, true);
  }

  /* ────────── تتبع التنقل ────────── */
  function trackNavigation() {
    /* التف حول كل من ELLOUL_navigate و ELLOUL_navigateEnhanced */
    const names = ['ELLOUL_navigate', 'ELLOUL_navigateEnhanced'];

    function tryWrap() {
      let wrappedAny = false;

      names.forEach(name => {
        const orig = window[name];
        if (typeof orig !== 'function') return;
        if (orig.__tracked) return;

        const wrapped = function(target, silent) {
          const result = orig.apply(this, arguments);
          if (!silent) {
            logEvent('page_view', {
              page_title: target,
              page_location: location.href,
              page_path: '/#' + target
            });
          }
          return result;
        };
        wrapped.__tracked = true;
        window[name] = wrapped;
        wrappedAny = true;
      });

      return wrappedAny;
    }

    /* حاول الآن */
    tryWrap();

    /* ✅ حاول بشكل دوري (لو أُعيد التعريف لاحقاً) */
    navCheckInterval = setInterval(() => {
      const nav = window.ELLOUL_navigateEnhanced || window.ELLOUL_navigate;
      if (nav && !nav.__tracked) {
        tryWrap();
      }
    }, 2000);
  }

  /* ────────── تتبع البحث ────────── */
  function trackSearch() {
    document.addEventListener('input', (e) => {
      if (!e.target || !e.target.matches('[data-shop-search]')) return;
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTimer = null;
        const term = e.target.value.trim();
        if (term.length < 2) return;
        logEvent('search', { search_term: term });
      }, 800);
    });
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (modalObserver) {
      modalObserver.disconnect();
      modalObserver = null;
    }
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    if (navCheckInterval) {
      clearInterval(navCheckInterval);
      navCheckInterval = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    trackCartEvents();
    trackNavigation();
    trackSearch();

    logEvent('page_view', {
      page_title: 'home',
      page_location: location.href
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_ANALYTICS = {
    events: () => EVENTS.slice(),
    log: logEvent,
    hasGA4: hasGA4,
    clear: () => { EVENTS.length = 0; },
    last: (n) => EVENTS.slice(-(n || 10))
  };

})();