/* ═══════════════════════════════════════════════════════════
   QUICK-VIEW — معاينة سريعة عند hover على المنتج
   v2.0 — إصلاح mouseout + tooltip persistence + auto-hide
   ✅ Desktop: hover tooltip مصغّر
   ✅ Mobile: long-press (750ms) + auto-hide (5s)
   ✅ يعرض: الاسم + السعر + التقييم + زر "عرض كامل"
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_QUICKVIEW_READY__) return;
  window.__ELLOUL_QUICKVIEW_READY__ = true;

  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const LONG_PRESS_MS = 750;
  const HOVER_DELAY_MS = 450;
  const AUTO_HIDE_MS = 5000;       // إخفاء تلقائي على الجوال

  let tooltipEl = null;
  let currentCard = null;
  let showTimer = null;
  let hideTimer = null;            // مؤقّت الإخفاء التلقائي
  let longPressTimer = null;
  let longPressTriggered = false;

  /* ────────── قراءة بيانات المنتج من البطاقة ────────── */
  function getCardData(card) {
    return {
      id: card.dataset.productId,
      name: (card.querySelector('.product-name') || {}).textContent?.trim() || '',
      cat: (card.querySelector('.product-cat') || {}).textContent?.trim() || '',
      price: (card.querySelector('.price-now') || {}).textContent?.trim() || '',
      old: (card.querySelector('.product-old') || card.querySelector('.price-old') || {}).textContent?.trim() || '',
      rating: (card.querySelector('.product-rating') || {}).textContent?.trim() || '',
      icon: (card.querySelector('.product-ph ion-icon') || {}).getAttribute?.('name') || 'restaurant-outline'
    };
  }

  /* ────────── بناء التلميح ────────── */
  function buildTooltip(data) {
    const el = document.createElement('div');
    el.className = 'qv-tooltip';
    el.setAttribute('role', 'tooltip');
    el.innerHTML = `
      <div class="qv-icon"><ion-icon name="${data.icon}"></ion-icon></div>
      <div class="qv-body">
        <span class="qv-cat">${data.cat}</span>
        <h5 class="qv-name">${data.name}</h5>
        <div class="qv-price-row">
          <span class="qv-price">${data.price}</span>
          ${data.old ? `<span class="qv-old">${data.old}</span>` : ''}
        </div>
        <div class="qv-rating">${data.rating}</div>
        <div class="qv-actions">
          <button class="qv-full-btn" data-full="${data.id}">
            <ion-icon name="eye-outline"></ion-icon> عرض كامل
          </button>
        </div>
      </div>
    `;
    return el;
  }

  /* ────────── عرض التلميح ────────── */
  function showTooltip(card) {
    if (currentCard === card && tooltipEl) return;

    hideTooltip(true); // silent
    currentCard = card;

    const data = getCardData(card);
    if (!data.id) return;

    tooltipEl = buildTooltip(data);
    tooltipEl.dataset.productId = data.id;
    document.body.appendChild(tooltipEl);

    /* الأيقونة */
    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(tooltipEl);
    }

    /* الموقع */
    positionTooltip(tooltipEl, card);

    requestAnimationFrame(() => {
      tooltipEl && tooltipEl.classList.add('qv-tooltip-show');
    });

    /* زر "عرض كامل" */
    const fullBtn = tooltipEl.querySelector('[data-full]');
    if (fullBtn) {
      fullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const targetCard = document.querySelector(`.product-card[data-product-id="${data.id}"]`);
        if (targetCard) {
          const openEl = targetCard.querySelector('[data-open-product]');
          if (openEl) openEl.click();
        }
        hideTooltip();
      });
    }

    /* ✅ مؤقّت الإخفاء التلقائي (لجوال فقط) */
    if (isTouch) {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => hideTooltip(), AUTO_HIDE_MS);
    }
  }

  /* ────────── حساب الموقع ────────── */
  function positionTooltip(el, card) {
    const rect = card.getBoundingClientRect();
    const tooltipWidth = 260;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - 12;

    /* لو مش مساحة فوق، اعرض تحت */
    if (top < 20) {
      top = rect.bottom + 12;
      el.classList.add('qv-below');
    }

    /* لا تخرج عن الشاشة */
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));

    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.width = tooltipWidth + 'px';
  }

  /* ────────── إخفاء التلميح ────────── */
  function hideTooltip(silent) {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (!tooltipEl) return;

    const el = tooltipEl;
    tooltipEl = null;
    currentCard = null;

    if (silent) {
      el.remove();
      return;
    }

    el.classList.remove('qv-tooltip-show');
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 250);
  }

  /* ────────── مساعد: هل العنصر داخل التلميح أو البطاقة؟ ────────── */
  function isInsideTooltip(el) {
    return el && el.closest && el.closest('.qv-tooltip');
  }

  function isInsideCard(el) {
    return el && el.closest && el.closest('.product-card');
  }

  /* ────────── Desktop: hover ────────── */
  function attachHover() {
    if (isTouch) return;

    /* mouseover — بدء عرض التلميح */
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;

      /* تجاهل لو داخل زر أو التلميح نفسه */
      if (e.target.closest('button')) return;
      if (isInsideTooltip(e.target)) return;

      /* لا تكرر لو نفس البطاقة */
      if (currentCard === card && tooltipEl) return;

      if (showTimer) clearTimeout(showTimer);
      showTimer = setTimeout(() => showTooltip(card), HOVER_DELAY_MS);
    }, { passive: true });

    /* mouseout — مع مراعاة `relatedTarget` */
    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;

      /* ✅ المفتاح: أين يتجه الماوس؟ */
      const to = e.relatedTarget;

      /* لو يبقى داخل نفس البطاقة → لا تُخفِ */
      if (to && card.contains(to)) return;

      /* لو ينتقل للتلميح → لا تُخفِ */
      if (isInsideTooltip(to)) return;

      /* الآن فقط أخفِ */
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      if (card === currentCard) hideTooltip();
    }, { passive: true });

    /* mouseover على التلميح نفسه → لا تُخفِ */
    document.addEventListener('mouseover', (e) => {
      if (isInsideTooltip(e.target) && tooltipEl) {
        /* ابقَ ظاهراً */
        if (hideTimer) clearTimeout(hideTimer);
      }
    }, { passive: true });

    /* mouseout من التلميح → أخفِ */
    document.addEventListener('mouseout', (e) => {
      if (!isInsideTooltip(e.target)) return;
      const to = e.relatedTarget;
      /* لو يرجع للبطاقة → لا تُخفِ */
      if (to && isInsideCard(to)) return;
      /* لو يبقى داخل التلميح → لا تُخفِ */
      if (to && e.target.closest('.qv-tooltip')?.contains(to)) return;
      hideTooltip();
    }, { passive: true });
  }

  /* ────────── Mobile: long-press ────────── */
  function attachLongPress() {
    if (!isTouch) return;

    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      if (e.target.closest('button')) return;

      /* لو فيه تلميح مفتوح من بطاقة أخرى → أغلقه */
      if (tooltipEl && currentCard !== card) {
        hideTooltip();
      }

      longPressTriggered = false;

      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        showTooltip(card);
        if (navigator.vibrate) navigator.vibrate(20);
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      /* لو لم يُفعّل long-press، ولم يكن النقر على تلميح موجود،
         وكان هناك تلميح → أخفِه بعد لحظة */
      if (!longPressTriggered && tooltipEl) {
        /* تحقق لو النقر كان على التلميح نفسه */
        if (isInsideTooltip(e.target)) return;
        /* لا تُخفِ الآن — ننتظر 300ms لتمكين النقر على التلميح */
        setTimeout(() => {
          if (tooltipEl && !isInsideTooltip(document.activeElement)) {
            /* لو انتهت النقرة بدون تفاعل مع التلميح */
          }
        }, 300);
      }
    }, { passive: true });

    document.addEventListener('touchmove', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    /* ✅ إخفاء عند النقر خارج التلميح */
    document.addEventListener('touchstart', (e) => {
      if (tooltipEl && !isInsideTooltip(e.target)) {
        const card = e.target.closest('.product-card');
        /* لا تُخفِ لو نفس البطاقة التي فيها التلميح */
        if (card !== currentCard) {
          hideTooltip();
        }
      }
    }, { passive: true });
  }

  /* ────────── إخفاء عند scroll ────────── */
  function attachScrollHide() {
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
      if (!tooltipEl) return;
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        if (tooltipEl) hideTooltip();
      }, 150);
    }, { passive: true });
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
    if (longPressTimer) clearTimeout(longPressTimer);
    hideTooltip(true);
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    attachHover();
    attachLongPress();
    attachScrollHide();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_QV = {
    show: (id) => {
      const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
      if (card) showTooltip(card);
    },
    hide: () => hideTooltip(),
    isOpen: () => !!tooltipEl
  };

})();