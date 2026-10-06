/* ═══════════════════════════════════════════════════════════
   GIFT-WRAP — تغليف هدية + رسالة مخصصة
   v2.1 — Observer reference + full cleanup
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_GIFT_READY__) return;
  window.__ELLOUL_GIFT_READY__ = true;

  const KEY = 'elloul-gift';
  const GIFT_PRICE = 30;

  const MESSAGE_PRESETS = [
    'كل عام وأنت بخير 🎉',
    'مبروك! 🎊',
    'بالتوفيق دائماً 💙',
    'مع أطيب التحيات 💝'
  ];

  /* ────────── State ────────── */
  let cartObserver = null;

  /* ────────── قراءة/كتابة ────────── */
  function getGift() {
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (g && g.active) ? g : null;
    } catch(e) { return null; }
  }

  function setGift(data, silent) {
    try {
      if (data && data.active) {
        localStorage.setItem(KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(KEY);
      }
    } catch(e) {}

    if (!silent) {
      window.dispatchEvent(new CustomEvent('elloul:gift-updated', {
        detail: { gift: getGift() }
      }));
    }
  }

  /* ────────── واجهة الاستخدام ────────── */
  function buildUI() {
    const gift = getGift();
    const isActive = !!gift;
    const message = gift ? (gift.message || '') : '';

    return `
      <div class="gift-wrap-box ${isActive ? 'gift-wrap-active' : ''}">
        <div class="gift-wrap-head">
          <div class="gift-wrap-icon">🎁</div>
          <div class="gift-wrap-info">
            <strong>تغليف هدية</strong>
            <span>+${GIFT_PRICE} ج.م</span>
          </div>
          <label class="gift-wrap-toggle">
            <input type="checkbox" ${isActive ? 'checked' : ''} data-gift-toggle>
            <span class="gift-wrap-slider"></span>
          </label>
        </div>
        <div class="gift-wrap-body" style="${isActive ? '' : 'display:none;'}">
          <div class="gift-message-presets">
            ${MESSAGE_PRESETS.map(p => `
              <button class="gift-preset" type="button" data-preset="${p.replace(/"/g, '&quot;')}">${p}</button>
            `).join('')}
          </div>
          <textarea class="gift-message-input" placeholder="اكتب رسالتك مع الهدية..." maxlength="200" data-gift-message>${message}</textarea>
          <div class="gift-message-count"><span data-gift-count>${message.length}</span> / 200</div>
        </div>
      </div>
    `;
  }

  function injectUI() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage || !cartPage.classList.contains('active')) return;

    const cartSummary = cartPage.querySelector('.cart-summary');
    if (!cartSummary) return;

    const old = cartSummary.querySelector('.gift-wrap-box');
    if (old) old.remove();

    const checkoutBtn = cartSummary.querySelector('[data-checkout]');
    if (!checkoutBtn) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildUI();
    const box = wrapper.firstElementChild;
    checkoutBtn.parentNode.insertBefore(box, checkoutBtn);

    const toggle = box.querySelector('[data-gift-toggle]');
    const body = box.querySelector('.gift-wrap-body');
    const messageInput = box.querySelector('[data-gift-message]');
    const counter = box.querySelector('[data-gift-count]');
    if (!toggle || !body || !messageInput) return;

    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        box.classList.add('gift-wrap-active');
        body.style.display = '';
        setGift({ active: true, message: messageInput.value.trim() });
      } else {
        box.classList.remove('gift-wrap-active');
        body.style.display = 'none';
        setGift(null);
      }
    });

    let messageTimer = null;
    messageInput.addEventListener('input', () => {
      counter.textContent = messageInput.value.length;
      if (messageTimer) clearTimeout(messageTimer);
      messageTimer = setTimeout(() => {
        if (toggle.checked) {
          setGift({ active: true, message: messageInput.value.trim() });
        }
      }, 400);
    });

    box.querySelectorAll('.gift-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        messageInput.value = btn.dataset.preset || '';
        counter.textContent = messageInput.value.length;
        if (!toggle.checked) {
          toggle.checked = true;
          box.classList.add('gift-wrap-active');
          body.style.display = '';
        }
        setGift({ active: true, message: messageInput.value.trim() });
      });
    });
  }

  /* ────────── تحديث الإجمالي ────────── */
  function applyGiftPrice() {
    const gift = getGift();
    const cartSummary = document.querySelector('.cart-summary');
    if (!cartSummary) return;

    const oldRow = cartSummary.querySelector('.gift-price-row');
    if (oldRow) oldRow.remove();

    if (!gift) return;

    const totalRow = cartSummary.querySelector('.summary-total');
    if (!totalRow) return;

    const totalValue = totalRow.querySelector('.val');
    const currentTotalText = totalValue ? totalValue.textContent : '0';
    const currentTotal = parseFloat(currentTotalText.replace(/[^\d.]/g, '')) || 0;
    const newTotal = currentTotal + GIFT_PRICE;

    const divider = cartSummary.querySelector('.summary-divider');
    const row = document.createElement('div');
    row.className = 'summary-row gift-price-row';
    row.innerHTML = `
      <span class="lbl">🎁 تغليف هدية</span>
      <span class="val">${GIFT_PRICE.toLocaleString('ar-EG')} ج.م</span>
    `;

    if (divider) {
      divider.parentNode.insertBefore(row, divider);
    } else {
      totalRow.parentNode.insertBefore(row, totalRow);
    }

    if (totalValue) {
      totalValue.innerHTML = newTotal.toLocaleString('ar-EG') + ' <small>ج.م</small>';
    }

    try {
      localStorage.setItem('elloul-gift-total', String(newTotal));
    } catch(e) {}
  }

  /* ────────── Hook checkout ────────── */
  function hookCheckout() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-checkout]');
      if (!btn) return;

      const gift = getGift();
      if (!gift) return;

      if (typeof Swal !== 'undefined') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        Swal.fire({
          toast: true,
          position: 'top-start',
          icon: 'success',
          title: '🎁 تم إضافة تغليف الهدية',
          text: gift.message ? 'الرسالة: ' + gift.message.substring(0, 30) : '',
          showConfirmButton: false,
          timer: 3000,
          background: isLight ? '#ffffff' : '#181c24',
          color: isLight ? '#0a0f1a' : '#f2f5f8'
        });
      }

      setTimeout(() => {
        setGift(null, true);
        try { localStorage.removeItem('elloul-gift-total'); } catch(e) {}
      }, 3000);
    }, true);
  }

  /* ────────── مراقبة السلة ────────── */
  function watchCart() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (cartPage) {
      cartObserver = new MutationObserver(() => {
        if (cartPage.classList.contains('active')) {
          setTimeout(() => {
            injectUI();
            applyGiftPrice();
          }, 250);
        }
      });
      cartObserver.observe(cartPage, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('elloul:content-rendered', () => {
      setTimeout(applyGiftPrice, 250);
    });

    window.addEventListener('elloul:gift-updated', applyGiftPrice);
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (cartObserver) { cartObserver.disconnect(); cartObserver = null; }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    watchCart();
    hookCheckout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_GIFT = {
    get: getGift,
    set: (data) => setGift(data),
    price: GIFT_PRICE,
    clear: () => setGift(null)
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.elloul) {
        window.elloul.gift = {
          get: getGift,
          set: (data) => setGift(data),
          clear: () => setGift(null),
          price: GIFT_PRICE
        };
      }
    }, 300);
  });

})();