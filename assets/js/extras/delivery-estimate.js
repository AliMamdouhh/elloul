/* ═══════════════════════════════════════════════════════════
   DELIVERY-ESTIMATE — توقّع موعد التوصيل
   v2.0 — إصلاح حلقة إعادة الرسم + cleanup + null checks
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_DELIVERY_READY__) return;
  window.__ELLOUL_DELIVERY_READY__ = true;

  const KEY = 'elloul-gov';

  /* ────────── محافظات مصر + مدة التوصيل ────────── */
  const GOVERNORATES = {
    'الإسكندرية':   1, 'البحيرة':      1,
    'القاهرة':      2, 'الجيزة':       2,
    'القليوبية':    2, 'الدقهلية':     2,
    'الغربية':      2, 'المنوفية':     2,
    'كفر الشيخ':    2, 'دمياط':        3,
    'بورسعيد':      3, 'الإسماعيلية':  3,
    'السويس':       3, 'الشرقية':      2,
    'شمال سيناء':   4, 'جنوب سيناء':   4,
    'الفيوم':       3, 'بني سويف':     3,
    'المنيا':       3, 'أسيوط':        4,
    'سوهاج':        4, 'قنا':          5,
    'الأقصر':       5, 'أسوان':        5,
    'البحر الأحمر': 5, 'الوادي الجديد':6, 'مطروح': 5
  };

  /* ────────── State ────────── */
  let cartObserver = null;
  let injectTimeout = null;

  /* ────────── قراءة/كتابة المحافظة ────────── */
  function getGov() {
    try { return localStorage.getItem(KEY) || ''; }
    catch(e) { return ''; }
  }

  function setGov(gov) {
    try { localStorage.setItem(KEY, gov); } catch(e) {}
    /* ✅ حدث مخصص — لا نُطلق content-rendered */
    window.dispatchEvent(new CustomEvent('elloul:gov-updated', {
      detail: { gov }
    }));
  }

  /* ────────── حساب التاريخ ────────── */
  function calculateDelivery(gov) {
    if (!gov || !GOVERNORATES[gov]) return null;
    const days = GOVERNORATES[gov];

    const target = new Date();
    target.setDate(target.getDate() + days);

    /* تخطي الجمعة (يوم 5) */
    if (target.getDay() === 5) {
      target.setDate(target.getDate() + 1);
    }

    try {
      return {
        days,
        date: target,
        formatted: target.toLocaleDateString('ar-EG', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
      };
    } catch(e) {
      return { days, date: target, formatted: '—' };
    }
  }

  /* ────────── بناء UI ────────── */
  function buildUI() {
    const gov = getGov();
    const estimated = calculateDelivery(gov);

    const govOptions = Object.keys(GOVERNORATES)
      .map(g => {
        const selected = gov === g ? ' selected' : '';
        return `<option value="${g}"${selected}>${g}</option>`;
      })
      .join('');

    return `
      <div class="delivery-box">
        <div class="delivery-head">
          <ion-icon name="car-outline"></ion-icon>
          <span class="delivery-title">موعد التوصيل المتوقع</span>
        </div>
        <select class="delivery-select" data-delivery-gov aria-label="اختر محافظتك">
          <option value="">-- اختر محافظتك --</option>
          ${govOptions}
        </select>
        ${estimated ? `
          <div class="delivery-result">
            <span class="delivery-icon">📅</span>
            <div>
              <strong>سيصلك يوم ${estimated.formatted}</strong>
              <span>خلال ${estimated.days} ${estimated.days === 1 ? 'يوم' : 'أيام'} عمل</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ────────── حقن UI ────────── */
  function injectUI() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage || !cartPage.classList.contains('active')) return;

    const cartSummary = cartPage.querySelector('.cart-summary');
    if (!cartSummary) return;

    /* احذف القديم */
    const old = cartSummary.querySelector('.delivery-box');
    if (old) old.remove();

    const checkoutBtn = cartSummary.querySelector('[data-checkout]');
    if (!checkoutBtn || !checkoutBtn.parentNode) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildUI();
    const box = wrapper.firstElementChild;
    if (!box) return;

    checkoutBtn.parentNode.insertBefore(box, checkoutBtn);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(box);
    }

    /* ربط الـ select */
    const select = box.querySelector('[data-delivery-gov]');
    if (select) {
      select.addEventListener('change', () => {
        setGov(select.value);
        /* ✅ حدّث UI فقط، بدون إعادة حقن كامل */
        updateResultOnly(box);
      });
    }
  }

  /* ────────── تحديث نتيجة التوصيل فقط (بدون إعادة حقن) ────────── */
  function updateResultOnly(box) {
    if (!box) return;
    const gov = getGov();
    const estimated = calculateDelivery(gov);

    const oldResult = box.querySelector('.delivery-result');
    if (oldResult) oldResult.remove();

    if (!estimated) return;

    const result = document.createElement('div');
    result.className = 'delivery-result';
    result.innerHTML = `
      <span class="delivery-icon">📅</span>
      <div>
        <strong>سيصلك يوم ${estimated.formatted}</strong>
        <span>خلال ${estimated.days} ${estimated.days === 1 ? 'يوم' : 'أيام'} عمل</span>
      </div>
    `;
    box.appendChild(result);
  }

  /* ────────── Schedule inject (debounced) ────────── */
  function scheduleInject() {
    if (injectTimeout) clearTimeout(injectTimeout);
    injectTimeout = setTimeout(() => {
      injectTimeout = null;
      injectUI();
    }, 300);
  }

  /* ────────── BOOT ────────── */
  function boot() {
    /* راقب فتح صفحة السلة */
    const cartPage = document.querySelector('[data-page="cart"]');
    if (cartPage) {
      cartObserver = new MutationObserver(() => {
        if (cartPage.classList.contains('active')) {
          scheduleInject();
        }
      });
      cartObserver.observe(cartPage, { attributes: true, attributeFilter: ['class'] });
    }

    /* عند إعادة رسم السلة (بدون فتحها) */
    window.addEventListener('elloul:content-rendered', () => {
      const cartPage2 = document.querySelector('[data-page="cart"]');
      if (cartPage2 && cartPage2.classList.contains('active')) {
        scheduleInject();
      }
    });

    /* ✅ استمع للتحديثات المخصصة */
    window.addEventListener('elloul:gov-updated', () => {
      const cartPage3 = document.querySelector('[data-page="cart"]');
      if (cartPage3 && cartPage3.classList.contains('active')) {
        /* لا نُعيد الحقن — فقط نُحدّث */
        const box = cartPage3.querySelector('.delivery-box');
        if (box) updateResultOnly(box);
      }
    });
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (cartObserver) {
      cartObserver.disconnect();
      cartObserver = null;
    }
    if (injectTimeout) {
      clearTimeout(injectTimeout);
      injectTimeout = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── Init ────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_DELIVERY = {
    gov: getGov,
    set: setGov,
    estimate: (g) => calculateDelivery(g || getGov()),
    list: Object.keys(GOVERNORATES),
    refresh: scheduleInject
  };

})();