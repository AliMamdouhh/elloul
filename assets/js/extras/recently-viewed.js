/* ═══════════════════════════════════════════════════════════
   RECENTLY-VIEWED — المنتجات التي شاهدها المستخدم
   v2.0 — cleanup + debounce + word-safe truncate
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_RECENT_READY__) return;
  window.__ELLOUL_RECENT_READY__ = true;

  const KEY = 'elloul-recently-viewed';
  const MAX = 6;
  const RENDER_DEBOUNCE = 200;

  /* ────────── State ────────── */
  let modalObserver = null;
  let renderTimer = null;

  /* ────────── قراءة/كتابة ────────── */
  function getRecent() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch(e) { return []; }
  }

  function addToRecent(id) {
    if (!id) return;
    let list = getRecent().filter(x => x !== id);
    list.unshift(id);
    if (list.length > MAX) list.length = MAX;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e) {}
  }

  /* ────────── قص النص بأمان ────────── */
  function truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    let cut = str.substring(0, maxLen);
    const space = cut.lastIndexOf(' ');
    if (space > maxLen * 0.6) cut = cut.substring(0, space);
    return cut + '…';
  }

  /* ────────── مراقبة فتح modal ────────── */
  function watchProductOpen() {
    const modal = document.querySelector('[data-product-modal-container]');
    if (!modal) return;

    modalObserver = new MutationObserver(() => {
      if (!modal.classList.contains('active')) return;

      const titleEl = modal.querySelector('[data-product-modal-title]');
      if (!titleEl) return;
      const name = titleEl.textContent.trim();

      /* ابحث عن الـ ID */
      let foundId = null;
      document.querySelectorAll('.product-card').forEach(card => {
        const n = card.querySelector('.product-name');
        if (n && n.textContent.trim() === name) {
          foundId = card.dataset.productId;
        }
      });

      if (foundId) {
        addToRecent(foundId);
        scheduleRender();
      }
    });
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  /* ────────── رسم القسم ────────── */
  function renderSection() {
    const homePage = document.querySelector('[data-page="home"]');
    if (!homePage) return;

    const recent = getRecent();
    const existingSection = document.querySelector('.recently-viewed-section');

    if (!recent.length) {
      if (existingSection) existingSection.remove();
      return;
    }

    /* ابنِ map من بطاقات المنتجات */
    const productMap = {};
    document.querySelectorAll('.product-card').forEach(card => {
      productMap[card.dataset.productId] = card;
    });

    const cardsHTML = recent.map(id => {
      const card = productMap[id];
      if (!card) return '';

      const nameEl = card.querySelector('.product-name');
      const catEl = card.querySelector('.product-cat');
      const priceEl = card.querySelector('.price-now');
      const iconEl = card.querySelector('.product-ph ion-icon');

      const name = nameEl ? nameEl.textContent.trim() : '';
      const cat = catEl ? catEl.textContent.trim() : '';
      const price = priceEl ? priceEl.textContent.trim() : '';
      const icon = iconEl ? iconEl.getAttribute('name') : 'restaurant-outline';

      return `
        <div class="recent-card" data-open-recent="${id}" role="button" tabindex="0">
          <div class="recent-icon"><ion-icon name="${icon}"></ion-icon></div>
          <div class="recent-info">
            <span class="recent-cat">${cat}</span>
            <span class="recent-name">${truncate(name, 35)}</span>
            <span class="recent-price">${price}</span>
          </div>
        </div>
      `;
    }).filter(Boolean).join('');

    if (!cardsHTML) {
      if (existingSection) existingSection.remove();
      return;
    }

    /* احذف القديم */
    if (existingSection) existingSection.remove();

    const section = document.createElement('section');
    section.className = 'recently-viewed-section';
    section.innerHTML = `
      <div class="sec-head">
        <h3>👁️ شاهدتها مؤخراً</h3>
        <button class="sec-link" type="button" data-clear-recent>
          مسح<ion-icon name="trash-outline"></ion-icon>
        </button>
      </div>
      <div class="recent-scroll">
        ${cardsHTML}
      </div>
    `;

    const service = homePage.querySelector('.service');
    if (service && service.parentNode) {
      service.parentNode.insertBefore(section, service);
    } else {
      homePage.appendChild(section);
    }

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(section);
    }

    /* معالجات النقر */
    section.querySelectorAll('[data-open-recent]').forEach(el => {
      const handler = (e) => {
        e.preventDefault();
        const id = el.dataset.openRecent;
        const targetCard = document.querySelector('.product-card[data-product-id="' + id + '"]');
        if (targetCard) {
          const openEl = targetCard.querySelector('[data-open-product]');
          if (openEl) openEl.click();
        }
      };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler(e);
        }
      });
    });

    const clearBtn = section.querySelector('[data-clear-recent]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        try { localStorage.removeItem(KEY); } catch(e) {}
        section.remove();
      });
    }
  }

  function scheduleRender() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderTimer = null;
      renderSection();
    }, RENDER_DEBOUNCE);
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (modalObserver) {
      modalObserver.disconnect();
      modalObserver = null;
    }
    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    watchProductOpen();
    window.addEventListener('elloul:content-rendered', scheduleRender);
    setTimeout(renderSection, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_RECENT = {
    list: getRecent,
    add: addToRecent,
    clear: () => {
      try { localStorage.removeItem(KEY); } catch(e) {}
      renderSection();
    },
    refresh: scheduleRender
  };

})();