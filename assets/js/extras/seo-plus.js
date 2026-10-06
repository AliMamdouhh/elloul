/* ═══════════════════════════════════════════════════════════
   SEO-PLUS — Dynamic SEO enhancements
   v2.0 — SITE_URL ديناميكي + JSON-LD stable + cleanup
   ✅ JSON-LD لكل منتج عند فتح الـ modal
   ✅ Canonical + OG ديناميكي
   ✅ Breadcrumb structured data
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_SEO_READY__) return;
  window.__ELLOUL_SEO_READY__ = true;

  /* ✅ دومين ديناميكي — يعمل على localhost والنطاق الحقيقي */
  const SITE_URL = (function() {
    try {
      /* لو نطاق الإنتاج */
      if (location.hostname === 'elloul.store' ||
          location.hostname === 'www.elloul.store') {
        return 'https://elloul.store';
      }
      /* غير ذلك (localhost أو preview) */
      return location.origin;
    } catch(e) {
      return 'https://elloul.store';
    }
  })();

  const IS_PROD = location.hostname === 'elloul.store' ||
                  location.hostname === 'www.elloul.store';

  /* ═══════════════════════════════════════════
     State
     ═══════════════════════════════════════════ */
  let originalTitle = document.title;
  const observers = [];

  /* خريطة العناوين */
  const TITLE_MAP = {
    home:    'ELLOUL | متجر أدوات المائدة والاستانلس ستيل',
    shop:    'المتجر | ELLOUL',
    cart:    'سلة التسوق | ELLOUL',
    blog:    'الأخبار والعروض | ELLOUL',
    contact: 'اتصل بنا | ELLOUL'
  };

  /* خريطة أسماء الصفحات في breadcrumb */
  const BREADCRUMB_MAP = {
    shop:    'المتجر',
    cart:    'سلة التسوق',
    blog:    'الأخبار',
    contact: 'اتصل بنا'
  };

  /* ═══════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════ */

  /**
   * استخراج السعر من نص عربي
   * يدعم: "1,250 ج.م" → 1250
   * @returns {number}
   */
  function parsePrice(text) {
    if (!text) return 0;
    try {
      /* احذف كل شيء ما عدا الأرقام والفواصل والنقاط */
      const cleaned = String(text).replace(/[^\d.,]/g, '').trim();
      if (!cleaned) return 0;

      /* لو فيه فاصلة آلاف + نقطة عشرية (en-US) */
      if (cleaned.includes(',') && cleaned.includes('.')) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        if (lastComma > lastDot) {
          /* أوروبي: 1.234,56 */
          return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
          /* أمريكي: 1,234.56 */
          return parseFloat(cleaned.replace(/,/g, '')) || 0;
        }
      }

      /* فاصلة فقط — قد تكون عشرية أو آلاف */
      if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts[1] && parts[1].length === 2) {
          /* عشرية: 1234,56 */
          return parseFloat(cleaned.replace(',', '.')) || 0;
        }
        /* آلاف: 1,234 */
        return parseFloat(cleaned.replace(/,/g, '')) || 0;
      }

      return parseFloat(cleaned) || 0;
    } catch(e) {
      return 0;
    }
  }

  /**
   * إزالة script موجود بحذر
   */
  function removeScript(id) {
    const el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /* ═══════════════════════════════════════════
     Canonical URL
     ═══════════════════════════════════════════ */
  function setCanonical(path) {
    const url = SITE_URL + (path || '/');

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url;
  }

  /* ═══════════════════════════════════════════
     hreflang (alternate)
     ═══════════════════════════════════════════ */
  function setupHreflang() {
    if (document.querySelector('link[rel="alternate"][hreflang="ar-EG"]')) return;

    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = 'ar-EG';
    link.href = SITE_URL + '/';
    document.head.appendChild(link);
  }

  /* ═══════════════════════════════════════════
     JSON-LD Injection
     ═══════════════════════════════════════════ */
  function injectJSONLD(id, data) {
    removeScript(id);

    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    el.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(el);
  }

  /* ═══════════════════════════════════════════
     Breadcrumb
     ═══════════════════════════════════════════ */
  function updateBreadcrumb(page) {
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: SITE_URL + '/#home'
      }
    ];

    if (BREADCRUMB_MAP[page]) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: BREADCRUMB_MAP[page],
        item: SITE_URL + '/#' + page
      });
    }

    injectJSONLD('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    });
  }

  /* ═══════════════════════════════════════════
     Product JSON-LD
     ═══════════════════════════════════════════ */
  function injectProductLD(product) {
    if (!product || !product.name) return;

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.desc || product.name,
      sku: product.sku || product.id,
      brand: { '@type': 'Brand', name: 'ELLOUL' },
      category: product.cat || 'أدوات مائدة',
      offers: {
        '@type': 'Offer',
        url: SITE_URL + '/#product-' + (product.sku || product.id),
        priceCurrency: 'EGP',
        price: product.price,
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'ELLOUL' }
      }
    };

    if (product.rating > 0) {
      ld.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews || 1,
        bestRating: 5,
        worstRating: 1
      };
    }

    if (product.old && product.old > product.price) {
      const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      ld.offers.priceValidUntil = futureDate.toISOString().split('T')[0];
    }

    injectJSONLD('ld-product', ld);
  }

  function clearProductLD() {
    removeScript('ld-product');
  }

  /* ═══════════════════════════════════════════
     استخراج SKU ثابت من البطاقة
     ═══════════════════════════════════════════ */
  function getProductSku(name) {
    /* ابحث عن البطاقة بنفس الاسم */
    const cards = document.querySelectorAll('.product-card');
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const nameEl = card.querySelector('.product-name');
      if (nameEl && nameEl.textContent.trim() === name) {
        return card.dataset.productId || 'unknown';
      }
    }
    return 'modal-product';
  }

  /* ═══════════════════════════════════════════
     مراقبة التنقل بين الصفحات
     ═══════════════════════════════════════════ */
  function watchNavigation() {
    const pageObserver = new MutationObserver(() => {
      const activePage = document.querySelector('[data-page].active');
      if (!activePage) return;

      const page = activePage.dataset.page;
      updateBreadcrumb(page);
      setCanonical('/#' + page);

      /* ✅ استعد العنوان الأصلي إذا لم يكن modal مفتوحاً */
      const modal = document.querySelector('[data-product-modal-container]');
      const modalOpen = modal && modal.classList.contains('active');

      if (!modalOpen && TITLE_MAP[page]) {
        document.title = TITLE_MAP[page];
      }
    });

    observers.push(pageObserver);

    document.querySelectorAll('[data-page]').forEach(p => {
      pageObserver.observe(p, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* ═══════════════════════════════════════════
     مراقبة modal المنتج
     ═══════════════════════════════════════════ */
  function watchProductModal() {
    const modal = document.querySelector('[data-product-modal-container]');
    if (!modal) return;

    const obs = new MutationObserver(() => {
      const isOpen = modal.classList.contains('active');

      if (isOpen) {
        const titleEl = modal.querySelector('[data-product-modal-title]');
        const priceEl = modal.querySelector('[data-product-modal-price]');
        const catEl   = modal.querySelector('[data-product-modal-cat]');
        const descEl  = modal.querySelector('[data-product-modal-desc]');
        const ratingEl = modal.querySelector('[data-product-modal-rating]');
        const oldEl   = modal.querySelector('[data-product-modal-old]');

        if (!titleEl) return;

        const name = titleEl.textContent.trim();
        const priceText = priceEl ? priceEl.textContent : '0';
        const price = parsePrice(priceText);

        /* استخراج rating */
        let rating = 0;
        if (ratingEl) {
          const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
          if (ratingMatch) rating = parseFloat(ratingMatch[1]) || 0;
        }

        /* استخراج reviews */
        let reviews = 1;
        if (ratingEl) {
          const reviewsMatch = ratingEl.textContent.match(/(\d+)\s*تقييم/);
          if (reviewsMatch) reviews = parseInt(reviewsMatch[1], 10) || 1;
        }

        /* ✅ SKU ثابت */
        const sku = getProductSku(name);

        injectProductLD({
          id: sku,
          sku: sku,
          name,
          desc: descEl ? descEl.textContent.trim() : '',
          cat: catEl ? catEl.textContent.trim() : '',
          price,
          rating,
          reviews
        });

        document.title = name + ' | ELLOUL';
        setCanonical('/#shop');
      } else {
        clearProductLD();

        /* ✅ استعد العنوان حسب الصفحة الحالية */
        const activePage = document.querySelector('[data-page].active');
        const page = activePage ? activePage.dataset.page : 'home';
        document.title = TITLE_MAP[page] || originalTitle;
      }
    });

    observers.push(obs);
    obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    observers.forEach(obs => {
      try { obs.disconnect(); } catch(e) {}
    });
    observers.length = 0;

    /* استعد العنوان الأصلي */
    document.title = originalTitle;

    /* احذف JSON-LD الديناميكي */
    removeScript('ld-product');
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    /* احفظ العنوان الأصلي */
    originalTitle = document.title;

    /* ✅ على الإنتاج فقط نُطبّق canonical ديناميكي */
    if (IS_PROD) {
      updateBreadcrumb('home');
      setupHreflang();
    }

    watchNavigation();
    watchProductModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_SEO = {
    siteUrl: SITE_URL,
    isProd: IS_PROD,
    setCanonical: (path) => { if (IS_PROD) setCanonical(path); },
    injectProductLD,
    injectJSONLD,
    updateBreadcrumb: (page) => { if (IS_PROD) updateBreadcrumb(page); },
    parsePrice,
    resetTitle: () => { document.title = originalTitle; }
  };

  /* إضافة على elloul */
  if (window.elloul) {
    window.elloul.seo = window.ELLOUL_SEO;
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.elloul && !window.elloul.seo) {
          window.elloul.seo = window.ELLOUL_SEO;
        }
      }, 300);
    }, { once: true });
  }

})();