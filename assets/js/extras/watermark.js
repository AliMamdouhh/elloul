/* ═══════════════════════════════════════════════════════════
   WATERMARK — علامة مائية على المنتجات والـ hero
   v2.0 — إصلاح تعارض hero::after + تحسينات أداء
   ✅ يستخدم CSS Watermark (أسرع من Canvas)
   ✅ لا يعدّل الصور الأصلية
   ✅ لا يتعارض مع cinematic.css
   ✅ يمكن تعطيله من CONFIG
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_WM_READY__) return;
  window.__ELLOUL_WM_READY__ = true;

  const CONFIG = {
    enabled: true,
    text: 'ELLOUL',
    heroText: 'ELLOUL · متجر أدوات مائدة',
    opacity: 0.18,
    canvas: false  // معطّل افتراضياً للأداء (يمكن تفعيله يدوياً)
  };

  let injectedStyleEl = null;
  let injectedHeroEl = null;

  /* ═══════════════════════════════════════════
     1. CSS Watermark للبطاقات
     ═══════════════════════════════════════════ */
  function applyCSSWatermark() {
    if (!CONFIG.enabled) return;
    if (injectedStyleEl) return;

    injectedStyleEl = document.createElement('style');
    injectedStyleEl.id = 'elloul-watermark-style';
    injectedStyleEl.textContent = `
      /* العلامة المائية على بطاقات المنتجات */
      .product-card .product-media::after {
        content: "${CONFIG.text}";
        position: absolute;
        bottom: 8px;
        left: 8px;
        z-index: 4;
        font-family: 'Tajawal', sans-serif;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 2px;
        color: rgba(255,255,255,${CONFIG.opacity});
        text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        transition: opacity 0.3s ease;
      }

      .product-card:hover .product-media::after {
        color: rgba(255,255,255,${CONFIG.opacity * 1.6});
      }

      /* عنصر الـ hero watermark (منفصل عن cinematic vignette) */
      .elloul-hero-wm {
        position: absolute;
        bottom: 14px;
        right: 14px;
        z-index: 5;
        font-family: 'Tajawal', sans-serif;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: rgba(255,255,255,${CONFIG.opacity * 0.8});
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }

      /* الوضع الفاتح */
      [data-theme="light"] .product-card .product-media::after {
        color: rgba(10,20,40,${CONFIG.opacity * 0.9});
        text-shadow: 0 1px 3px rgba(255,255,255,0.5);
      }

      [data-theme="light"] .elloul-hero-wm {
        color: rgba(10,20,40,${CONFIG.opacity * 0.7});
        text-shadow: 0 1px 3px rgba(255,255,255,0.4);
      }

      /* الطباعة */
      @media print {
        .product-card .product-media::after {
          color: rgba(59,130,246,0.7) !important;
          font-size: 12px !important;
        }
        .elloul-hero-wm {
          color: rgba(59,130,246,0.9) !important;
          font-size: 14px !important;
        }
      }

      /* احترام prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        .product-card .product-media::after,
        .elloul-hero-wm {
          transition: none !important;
          opacity: 0.6;
        }
      }
    `;
    document.head.appendChild(injectedStyleEl);
  }

  /* ═══════════════════════════════════════════
     2. عنصر HTML للـ hero (بدل pseudo-element)
     ═══════════════════════════════════════════ */
  function injectHeroWatermark() {
    if (!CONFIG.enabled) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (hero.querySelector('.elloul-hero-wm')) return;

    injectedHeroEl = document.createElement('span');
    injectedHeroEl.className = 'elloul-hero-wm';
    injectedHeroEl.setAttribute('aria-hidden', 'true');
    injectedHeroEl.textContent = CONFIG.heroText;

    hero.appendChild(injectedHeroEl);
  }

  /* ═══════════════════════════════════════════
     3. Canvas Watermark (اختياري - للصور الحقيقية)
     ═══════════════════════════════════════════ */
  function watermarkImages() {
    if (!CONFIG.canvas || !CONFIG.enabled) return;

    document.querySelectorAll('.product-media img').forEach((img) => {
      if (img.dataset.watermarked) return;
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', () => watermarkSingleImage(img), { once: true });
        return;
      }
      watermarkSingleImage(img);
    });
  }

  function watermarkSingleImage(img) {
    if (img.dataset.watermarked) return;
    if (img.crossOrigin !== 'anonymous') return; // CORS

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const text = CONFIG.text;
      ctx.font = 'bold 14px Tajawal, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,' + CONFIG.opacity + ')';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const stepX = 216;
      const stepY = 120;

      for (let x = 0; x < canvas.width; x += stepX) {
        for (let y = 0; y < canvas.height; y += stepY) {
          ctx.save();
          ctx.translate(x + stepX / 2, y + stepY / 2);
          ctx.rotate(-30 * Math.PI / 180);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }

      img.src = canvas.toDataURL('image/png');
      img.dataset.watermarked = '1';
    } catch(e) {
      /* تجاهل الأخطاء */
    }
  }

  /* ═══════════════════════════════════════════
     4. Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (injectedHeroEl && injectedHeroEl.parentNode) {
      injectedHeroEl.parentNode.removeChild(injectedHeroEl);
      injectedHeroEl = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     5. BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    applyCSSWatermark();
    injectHeroWatermark();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     6. DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_WM = {
    config: CONFIG,

    enable: () => {
      CONFIG.enabled = true;
      applyCSSWatermark();
      injectHeroWatermark();
    },

    disable: () => {
      CONFIG.enabled = false;
      if (injectedStyleEl && injectedStyleEl.parentNode) {
        injectedStyleEl.parentNode.removeChild(injectedStyleEl);
        injectedStyleEl = null;
      }
      cleanup();
    },

    enableCanvas: () => {
      CONFIG.canvas = true;
      watermarkImages();
    },

    disableCanvas: () => {
      CONFIG.canvas = false;
    },

    isActive: () => CONFIG.enabled
  };

})();