/* ═══════════════════════════════════════════════════════════
   UPSELL — اقتراحات ذكية لزيادة قيمة السلة
   v2.1 — Observer references + full cleanup
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_UPSELL_READY__) return;
  window.__ELLOUL_UPSELL_READY__ = true;

  const FREE_SHIP = 500;
  const MAX_SUGGESTIONS = 3;

  /* ────────── State ────────── */
  let modalObserver = null;
  let cartObserver = null;

  /* ────────── قراءة المنتجات من DOM ────────── */
  function getAllProducts() {
    const cards = document.querySelectorAll('.product-card');
    return Array.from(cards).map(card => {
      const nameEl = card.querySelector('.product-name');
      const catEl = card.querySelector('.product-cat');
      const priceEl = card.querySelector('.price-now');
      const iconEl = card.querySelector('.product-ph ion-icon');

      return {
        id: card.dataset.productId,
        name: nameEl ? nameEl.textContent.trim() : '',
        cat: catEl ? catEl.textContent.trim() : '',
        price: parseFloat((priceEl ? priceEl.textContent : '0').replace(/[^\d.]/g, '')) || 0,
        icon: iconEl ? iconEl.getAttribute('name') : 'restaurant-outline'
      };
    }).filter(p => p.id);
  }

  /* ────────── قطع النص عند حدود الكلمات ────────── */
  function truncateName(name, maxLength) {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    let truncated = name.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) truncated = truncated.substring(0, lastSpace);
    return truncated + '…';
  }

  /* ────────── البحث عن منتجات مشابهة ────────── */
  function findSimilar(currentId, currentCat, limit) {
    const all = getAllProducts();
    const sameCat = all.filter(p => p.id !== currentId && p.cat === currentCat);
    if (sameCat.length >= limit) return sameCat.slice(0, limit);
    const others = all.filter(p =>
      p.id !== currentId && p.cat !== currentCat && !sameCat.find(s => s.id === p.id)
    );
    return sameCat.concat(others).slice(0, limit);
  }

  /* ────────── HTML لبطاقة مصغرة ────────── */
  function miniCardHTML(p) {
    return `
      <div class="upsell-mini" data-upsell-open="${p.id}" role="button" tabindex="0">
        <div class="upsell-mini-icon"><ion-icon name="${p.icon}"></ion-icon></div>
        <div class="upsell-mini-info">
          <span class="upsell-mini-name">${truncateName(p.name, 40)}</span>
          <span class="upsell-mini-price">${p.price.toLocaleString('ar-EG')} ج.م</span>
        </div>
      </div>
    `;
  }

  /* ────────── فتح منتج من اقتراح ────────── */
  function openSuggestedProduct(id, fromModal) {
    if (!id) return;
    if (fromModal) {
      const closeBtn = document.querySelector('[data-product-modal-close]');
      if (closeBtn) closeBtn.click();
      setTimeout(() => triggerOpenProduct(id), 250);
    } else {
      triggerOpenProduct(id);
    }
  }

  function triggerOpenProduct(id) {
    const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
    if (!card) return;
    const openEl = card.querySelector('[data-open-product]');
    if (openEl) openEl.click();
  }

  /* ────────── ربط الأزرار ────────── */
  function bindSuggestionButtons(root, fromModal) {
    if (!root) return;
    root.querySelectorAll('[data-upsell-open]').forEach(el => {
      if (el.dataset.upsellBound === '1') return;
      el.dataset.upsellBound = '1';

      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSuggestedProduct(el.dataset.upsellOpen, fromModal);
      };

      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler(e);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     1. منتجات مشابهة في modal
     ═══════════════════════════════════════════ */
  function enhanceProductModal() {
    const modal = document.querySelector('[data-product-modal-container]');
    if (!modal) return;

    modalObserver = new MutationObserver(() => {
      if (!modal.classList.contains('active')) return;

      const catEl = modal.querySelector('[data-product-modal-cat]');
      const titleEl = modal.querySelector('[data-product-modal-title]');
      const pmBody = modal.querySelector('.pm-body');
      if (!catEl || !titleEl || !pmBody) return;

      const currentCat = catEl.textContent.trim();
      const currentName = titleEl.textContent.trim();

      const allProducts = getAllProducts();
      const currentProduct = allProducts.find(p => p.name === currentName);
      const excludeId = currentProduct ? currentProduct.id : null;

      const similar = allProducts
        .filter(p => p.id !== excludeId && p.cat === currentCat)
        .slice(0, MAX_SUGGESTIONS);

      if (!similar.length) {
        const old = pmBody.querySelector('.upsell-section');
        if (old) old.remove();
        return;
      }

      const old = pmBody.querySelector('.upsell-section');
      if (old) old.remove();

      const section = document.createElement('div');
      section.className = 'upsell-section';
      section.innerHTML = `
        <h4 class="upsell-title">🔥 منتجات مشابهة</h4>
        <div class="upsell-list">${similar.map(miniCardHTML).join('')}</div>
      `;

      const actions = pmBody.querySelector('.pm-actions');
      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(section, actions);
      } else {
        pmBody.appendChild(section);
      }

      if (typeof window.ELLOUL_renderIcons === 'function') {
        window.ELLOUL_renderIcons(section);
      }
      bindSuggestionButtons(section, true);
    });
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  /* ═══════════════════════════════════════════
     2. "أكمل الطقم" في السلة
     ═══════════════════════════════════════════ */
  function renderCartSuggestions() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage || !cartPage.classList.contains('active')) return;

    const cartList = document.querySelector('[data-cart-list]');
    if (!cartList) return;

    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]'); } catch(e) {}
    if (!cart.length) {
      const old = cartPage.querySelector('.upsell-cart-section');
      if (old) old.remove();
      return;
    }

    const inCartIds = new Set(cart.map(i => i.id));
    const allProducts = getAllProducts();
    if (!allProducts.length) return;

    const inCartCats = new Set(
      cart.map(item => {
        const p = allProducts.find(x => x.id === item.id);
        return p ? p.cat : null;
      }).filter(Boolean)
    );

    const suggestions = allProducts
      .filter(p => !inCartIds.has(p.id) && inCartCats.has(p.cat))
      .slice(0, 2);

    const old = cartPage.querySelector('.upsell-cart-section');
    if (old) old.remove();
    if (!suggestions.length) return;

    const section = document.createElement('div');
    section.className = 'upsell-cart-section';
    section.innerHTML = `
      <h4 class="upsell-title">📦 أكمل الطقم</h4>
      <div class="upsell-list">${suggestions.map(miniCardHTML).join('')}</div>
    `;

    const summary = cartPage.querySelector('.cart-summary');
    if (summary && summary.parentNode) {
      summary.parentNode.insertBefore(section, summary);
    } else {
      cartPage.appendChild(section);
    }

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(section);
    }
    bindSuggestionButtons(section, false);
  }

  /* ═══════════════════════════════════════════
     3. "أضف X للشحن المجاني"
     ═══════════════════════════════════════════ */
  function updateShippingHint() {
    const hint = document.querySelector('[data-ship-hint]');
    if (!hint) return;

    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]'); } catch(e) {}

    const allProducts = getAllProducts();
    let subtotal = 0;
    cart.forEach(item => {
      const p = allProducts.find(x => x.id === item.id);
      if (p) subtotal += p.price * item.qty;
    });

    if (!cart.length) {
      const oldBtn = hint.querySelector('.upsell-hint-btn');
      if (oldBtn) oldBtn.remove();
      hint.classList.remove('upsell-hint-active');
      return;
    }

    const remaining = FREE_SHIP - subtotal;

    if (remaining > 0 && remaining < 200) {
      const candidate = allProducts.find(p =>
        !cart.find(c => c.id === p.id) && p.price >= remaining && p.price < remaining + 100
      );

      if (candidate) {
        hint.classList.add('upsell-hint-active');
        hint.innerHTML = `
          <ion-icon name="rocket-outline"></ion-icon>
          <span>أضف <strong>${truncateName(candidate.name, 30)}</strong> بـ ${candidate.price.toLocaleString('ar-EG')} ج.م واحصل على شحن مجاني!</span>
          <button type="button" class="upsell-hint-btn" data-upsell-add="${candidate.id}">أضف</button>
        `;

        if (typeof window.ELLOUL_renderIcons === 'function') {
          window.ELLOUL_renderIcons(hint);
        }

        const btn = hint.querySelector('[data-upsell-add]');
        if (btn && btn.dataset.upsellHintBound !== '1') {
          btn.dataset.upsellHintBound = '1';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = document.querySelector(`.product-card[data-product-id="${candidate.id}"]`);
            if (card) {
              const addEl = card.querySelector('[data-add]');
              if (addEl) addEl.click();
            }
            setTimeout(updateShippingHint, 500);
          });
        }
        return;
      }
    }
    hint.classList.remove('upsell-hint-active');
  }

  /* ────────── مراقبة السلة ────────── */
  function watchCart() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage) return;

    cartObserver = new MutationObserver(() => {
      if (cartPage.classList.contains('active')) {
        setTimeout(() => {
          renderCartSuggestions();
          updateShippingHint();
        }, 200);
      }
    });
    cartObserver.observe(cartPage, { attributes: true, attributeFilter: ['class'] });
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (modalObserver) { modalObserver.disconnect(); modalObserver = null; }
    if (cartObserver)  { cartObserver.disconnect();  cartObserver = null; }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    enhanceProductModal();
    watchCart();

    window.addEventListener('elloul:content-rendered', () => {
      setTimeout(() => {
        const cartPage = document.querySelector('[data-page="cart"]');
        if (cartPage && cartPage.classList.contains('active')) renderCartSuggestions();
        updateShippingHint();
      }, 200);
    });

    setTimeout(() => {
      const cartPage = document.querySelector('[data-page="cart"]');
      if (cartPage && cartPage.classList.contains('active')) renderCartSuggestions();
      updateShippingHint();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_UPSELL = {
    products: getAllProducts,
    similar: findSimilar,
    refresh: () => { renderCartSuggestions(); updateShippingHint(); }
  };

})();