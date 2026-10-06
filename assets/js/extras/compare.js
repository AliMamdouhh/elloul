/* ═══════════════════════════════════════════════════════════
   COMPARE — مقارنة حتى 3 منتجات
   v2.0 — إصلاح add-to-cart في الجدول + تنظيف الكود
   ✅ زر مقارنة في كل بطاقة
   ✅ شريط عائم أسفل الصفحة
   ✅ جدول مقارنة تفاعلي يعمل بكامل الوظائف
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_COMPARE_READY__) return;
  window.__ELLOUL_COMPARE_READY__ = true;

  const KEY = 'elloul-compare';
  const MAX = 3;

  /* ────────── Toast محلي ────────── */
  function showToast(msg, type) {
    const stack = document.querySelector('#toastStack');
    if (!stack) return;

    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : ' success');
    const icon = type === 'error' ? 'alert-circle-outline' : 'checkmark-circle';
    el.innerHTML = '<ion-icon name="' + icon + '"></ion-icon><span>' + msg + '</span>';
    stack.appendChild(el);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(el);
    }

    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  /* ────────── State ────────── */
  function getCompare() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e) { return []; }
  }

  function setCompare(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e) {}
    updateBar();
    updateCardStates();
  }

  function toggleCompare(id) {
    if (!id) return;
    const list = getCompare();
    const idx = list.indexOf(id);

    if (idx > -1) {
      list.splice(idx, 1);
      showToast('تمت الإزالة من المقارنة');
    } else {
      if (list.length >= MAX) {
        showMaxWarning();
        return;
      }
      list.push(id);
      showToast('تمت الإضافة للمقارنة (' + list.length + '/' + MAX + ')');
    }
    setCompare(list);
  }

  function showMaxWarning() {
    showToast('يمكنك مقارنة ' + MAX + ' منتجات فقط', 'error');
  }

  /* ────────── حقن زر المقارنة ────────── */
  function injectCompareButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
      const id = card.dataset.productId;
      if (!id) return;

      const media = card.querySelector('.product-media');
      if (!media) return;

      /* ✅ لو الزر موجود بنفس الـ ID → لا تعيد إضافته */
      const existing = media.querySelector('.compare-btn');
      if (existing) {
        if (existing.dataset.compare === id) return;
        existing.remove();
      }

      const btn = document.createElement('button');
      btn.className = 'compare-btn';
      btn.dataset.compare = id;
      btn.setAttribute('aria-label', 'إضافة للمقارنة');
      btn.setAttribute('title', 'أضف للمقارنة');
      btn.innerHTML = '<ion-icon name="git-compare-outline"></ion-icon>';

      media.appendChild(btn);

      if (typeof window.ELLOUL_renderIcons === 'function') {
        window.ELLOUL_renderIcons(btn);
      }
    });
    updateCardStates();
  }

  /* ────────── تحديث حالات الأزرار ────────── */
  function updateCardStates() {
    const list = getCompare();
    document.querySelectorAll('.compare-btn').forEach(btn => {
      const id = btn.dataset.compare;
      btn.classList.toggle('active', list.includes(id));
    });
  }

  /* ────────── الشريط العائم ────────── */
  let barEl = null;

  function updateBar() {
    const list = getCompare();

    if (!list.length) {
      hideBar();
      return;
    }

    if (!barEl) {
      barEl = buildBar();
      document.body.appendChild(barEl);
      requestAnimationFrame(() => barEl && barEl.classList.add('compare-bar-show'));
    }

    updateBarContent(list);
  }

  function buildBar() {
    const el = document.createElement('div');
    el.className = 'compare-bar';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'شريط المقارنة');
    el.innerHTML = `
      <div class="compare-bar-content">
        <div class="compare-count">المقارنة (<strong>0</strong>)</div>
        <div class="compare-thumbs"></div>
        <div class="compare-actions">
          <button class="compare-open-btn" type="button">قارن الآن</button>
          <button class="compare-clear-btn" type="button" aria-label="مسح المقارنة">✕</button>
        </div>
      </div>
    `;

    el.querySelector('.compare-open-btn').addEventListener('click', openCompareModal);
    el.querySelector('.compare-clear-btn').addEventListener('click', () => {
      setCompare([]);
      showToast('تم مسح المقارنة');
    });

    return el;
  }

  function updateBarContent(list) {
    if (!barEl) return;

    const countEl = barEl.querySelector('.compare-count strong');
    if (countEl) countEl.textContent = list.length;

    const thumbs = barEl.querySelector('.compare-thumbs');
    if (!thumbs) return;

    thumbs.innerHTML = list.map(id => {
      const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
      if (!card) return '';
      const iconEl = card.querySelector('.product-ph ion-icon');
      const icon = iconEl ? iconEl.getAttribute('name') : 'restaurant-outline';
      return `<span class="compare-thumb" data-remove="${id}" title="إزالة"><ion-icon name="${icon}"></ion-icon></span>`;
    }).join('');

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(thumbs);
    }

    thumbs.querySelectorAll('[data-remove]').forEach(el => {
      el.addEventListener('click', () => toggleCompare(el.dataset.remove));
    });
  }

  function hideBar() {
    if (!barEl) return;
    const el = barEl;
    barEl = null;
    el.classList.remove('compare-bar-show');
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 350);
  }

  /* ────────── جدول المقارنة ────────── */
  function openCompareModal() {
    const list = getCompare();
    if (list.length < 2) {
      showToast('اختر منتجين على الأقل للمقارنة', 'error');
      return;
    }

    const products = list.map(id => {
      const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
      if (!card) return null;

      const iconEl = card.querySelector('.product-ph ion-icon');
      return {
        id,
        name: (card.querySelector('.product-name') || {}).textContent || '',
        cat: (card.querySelector('.product-cat') || {}).textContent || '',
        price: (card.querySelector('.price-now') || {}).textContent || '',
        old: (card.querySelector('.price-old') || {}).textContent || '—',
        rating: (card.querySelector('.product-rating') || {}).textContent || '',
        icon: iconEl ? iconEl.getAttribute('name') : 'restaurant-outline'
      };
    }).filter(Boolean);

    if (products.length < 2) {
      showToast('لم نتمكن من قراءة بيانات المنتجات', 'error');
      return;
    }

    const rows = [
      { label: 'الصورة',    render: (p) => `<div class="compare-img"><ion-icon name="${p.icon}"></ion-icon></div>` },
      { label: 'الاسم',     render: (p) => `<strong>${p.name}</strong>` },
      { label: 'القسم',     render: (p) => `<span class="cat-badge">${p.cat}</span>` },
      { label: 'السعر',     render: (p) => `<span class="compare-price">${p.price}</span>` },
      { label: 'قبل الخصم', render: (p) => p.old !== '—' ? `<span class="price-old">${p.old}</span>` : '—' },
      { label: 'التقييم',   render: (p) => p.rating || '—' },
      { label: 'إجراء',     render: (p) => `<button type="button" class="compare-add-btn" data-compare-add="${p.id}">أضف للسلة</button>` }
    ];

    const tableHTML = `
      <div class="compare-modal-inner">
        <h3 class="compare-modal-title">⚖️ مقارنة المنتجات</h3>
        <div class="compare-table-wrap">
          <table class="compare-table">
            <tbody>
              ${rows.map(row => `
                <tr>
                  <th>${row.label}</th>
                  ${products.map(p => `<td>${row.render(p)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof Swal === 'undefined') return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    Swal.fire({
      html: tableHTML,
      width: '90%',
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: 'swal-compare-modal' },
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8',
      didOpen: (popup) => {
        /* الأيقونات */
        if (typeof window.ELLOUL_renderIcons === 'function') {
          window.ELLOUL_renderIcons(popup);
        }

        /* ✅ المفتاح: ربط مباشر لأزرار "أضف للسلة" */
        popup.querySelectorAll('[data-compare-add]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const id = btn.dataset.compareAdd;
            if (!id) return;

            /* ابحث عن بطاقة المنتج وأطلق حدث data-add الأصلي */
            const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
            if (!card) return;

            const addBtn = card.querySelector('[data-add]');
            if (addBtn) {
              addBtn.click();
            } else {
              /* fallback: اكتب الكود يدوياً */
              try {
                const cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]');
                const found = cart.find(i => i.id === id);
                if (found) found.qty += 1;
                else cart.push({ id, qty: 1 });
                localStorage.setItem('elloul-cart', JSON.stringify(cart));
                window.dispatchEvent(new CustomEvent('elloul:content-rendered'));
                showToast('✅ تمت الإضافة للسلة');
              } catch(err) {}
            }

            Swal.close();
          });
        });
      }
    });
  }

  /* ────────── معالج النقر على زر المقارنة ────────── */
  function attachHandlers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-compare]');
      if (!btn) return;
      /* تجاهل لو الزر خارج بطاقة المنتج */
      if (!btn.closest('.product-card')) return;
      e.preventDefault();
      e.stopPropagation();
      toggleCompare(btn.dataset.compare);
    }, true);
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    hideBar();
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    attachHandlers();
    updateBar();

    window.addEventListener('elloul:content-rendered', () => {
      setTimeout(() => {
        injectCompareButtons();
        updateBar();
      }, 100);
    });

    /* أول تفعيل */
    setTimeout(injectCompareButtons, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_COMPARE = {
    list: getCompare,
    toggle: toggleCompare,
    clear: () => setCompare([]),
    open: openCompareModal,
    isBarVisible: () => !!barEl
  };

})();