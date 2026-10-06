/* ═══════════════════════════════════════════════════════════
   ICON RENDERER — v3.0
   ✅ Zero-overhead DOM (createElementNS + replaceChildren)
   ✅ Template cloning (أسرع من innerHTML بنسبة ~70%)
   ✅ Auto re-render on `name` attribute change
   ✅ Debug API + Dev warnings
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ────────── ICON MAP ────────── */
  const ICON_MAP = {
    /* Navbar */
    'home-outline':'ic-home','home':'ic-home',
    'storefront-outline':'ic-store','storefront':'ic-store',
    'bag-handle-outline':'ic-bag','bag-handle':'ic-bag',
    'newspaper-outline':'ic-news','newspaper':'ic-news',
    'chatbubble-ellipses-outline':'ic-chat','chatbubble-ellipses':'ic-chat',

    /* UI Actions */
    'search-outline':'ic-search','search':'ic-search',
    'heart-outline':'ic-heart','heart':'ic-heart-fill',
    'star':'ic-star','star-outline':'ic-star',
    'arrow-back-outline':'ic-arrow-back','arrow-back':'ic-arrow-back',
    'arrow-forward-outline':'ic-arrow-forward','arrow-forward':'ic-arrow-forward',
    'chevron-down':'ic-chevron-down','chevron-up':'ic-chevron-up',
    'sunny-outline':'ic-sun','sunny':'ic-sun',
    'moon-outline':'ic-moon','moon':'ic-moon',
    'color-palette-outline':'ic-palette',

    /* Contact */
    'mail-outline':'ic-mail','phone-portrait-outline':'ic-phone',
    'logo-whatsapp':'ic-whatsapp','logo-facebook':'ic-facebook',
    'location-outline':'ic-location','time-outline':'ic-clock',

    /* System */
    'close-outline':'ic-close','close':'ic-close',
    'trash-outline':'ic-trash','trash':'ic-trash',
    'checkmark-circle':'ic-check-circle','checkmark-circle-outline':'ic-check-circle',
    'checkmark-done-circle':'ic-check-done',
    'alert-circle-outline':'ic-alert',
    'information-circle-outline':'ic-info',
    'paper-plane':'ic-send','paper-plane-outline':'ic-send',
    'share-social-outline':'ic-share',

    /* Shop / Product */
    'shield-checkmark-outline':'ic-shield',
    'car-outline':'ic-car',
    'repeat-outline':'ic-repeat',
    'pricetags-outline':'ic-tag',
    'sparkles-outline':'ic-sparkle',
    'ribbon-outline':'ic-ribbon',
    'cube-outline':'ic-cube',
    'cog-outline':'ic-cog',
    'restaurant-outline':'ic-restaurant','restaurant':'ic-restaurant',
    'flash-outline':'ic-flash','flash':'ic-flash',
    'cut-outline':'ic-cut',
    'albums-outline':'ic-albums',
    'grid-outline':'ic-grid',
    'briefcase-outline':'ic-briefcase',
    'business-outline':'ic-business',
    'add-outline':'ic-plus',
    'remove-outline':'ic-minus',

    /* Cart */
    'cart-outline':'ic-cart','cart':'ic-cart',
    'bag-outline':'ic-bag','bag':'ic-bag',

    /* Admin */
    'eye-outline':'ic-search',
    'create-outline':'ic-cog',
    'log-out-outline':'ic-close',
    'person-outline':'ic-info',
    'lock-closed-outline':'ic-shield',
    'git-compare-outline':'ic-git-compare',
    'rocket-outline':'ic-rocket',
    'refresh-outline':'ic-refresh',
    'mic-outline':'ic-mic',
    'print-outline':'ic-print'
  };

  /* ────────── DEV MODE ────────── */
  const DEV_MODE =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '';

  const warnedIcons = new Set();

  /* ═══════════════════════════════════════════
     ✅ TEMPLATE (يُبنى مرة واحدة فقط)
     cloneNode(true) أسرع من createElementNS×2 لكل أيقونة
     ═══════════════════════════════════════════ */
  let _iconTemplate = null;

  function getIconTemplate() {
    if (_iconTemplate) return _iconTemplate;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 24 24');

    const use = document.createElementNS(SVG_NS, 'use');
    svg.appendChild(use);

    _iconTemplate = svg;
    return svg;
  }

  /* ═══════════════════════════════════════════
     RENDER — أيقونة واحدة
     ═══════════════════════════════════════════ */
  function renderIcon(el, force) {
    if (!el || el.tagName !== 'ION-ICON') return false;

    const name = el.getAttribute('name') || '';
    const renderedName = el.getAttribute('data-rendered-name');

    // تجاوز لو نفس الاسم اترسم قبل كده
    if (!force && el.hasAttribute('data-rendered') && renderedName === name) {
      return false;
    }

    const symbolId = ICON_MAP[name] || 'ic-info';

    // ⚠️ تحذير لأيقونات غير معروفة (مرة واحدة لكل اسم)
    if (DEV_MODE && name && !ICON_MAP[name] && !warnedIcons.has(name)) {
      warnedIcons.add(name);
      console.warn('[Icons] Unknown icon name:', name, '→ fallback:', symbolId);
    }

    /* ✅ clone + replaceChildren — الأسرع */
    const svg = getIconTemplate().cloneNode(true);
    svg.firstChild.setAttribute('href', '#' + symbolId);

    el.replaceChildren(svg);
    el.setAttribute('data-rendered', '1');
    el.setAttribute('data-rendered-name', name);

    return true;
  }

  /* ═══════════════════════════════════════════
     RENDER — كل الأيقونات في scope
     ═══════════════════════════════════════════ */
  function renderIconsIn(scope) {
    if (!scope) return 0;

    // عنصر ion-icon واحد
    if (scope.tagName === 'ION-ICON') {
      return renderIcon(scope) ? 1 : 0;
    }

    const icons = scope.querySelectorAll
      ? scope.querySelectorAll('ion-icon')
      : [];

    let count = 0;
    for (let i = 0; i < icons.length; i++) {
      if (renderIcon(icons[i])) count++;
    }
    return count;
  }

  /* ────────── PUBLIC API ────────── */
  window.ELLOUL_renderIcons = function(root) {
    return renderIconsIn(root || document);
  };

  window.ELLOUL_refreshIcon = function(el) {
    return renderIcon(el, true);
  };

  /* ═══════════════════════════════════════════
     ATTRIBUTE OBSERVER (بديل ذكي)
     يراقب فقط تغيّر attribute `name` على <ion-icon>
     ═══════════════════════════════════════════ */
  let attrObserver = null;

  function initAttributeObserver() {
    if (attrObserver) return;
    if (!document.body) return;

    attrObserver = new MutationObserver(function(mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'attributes' && m.target.tagName === 'ION-ICON') {
          renderIcon(m.target, true);
        }
      }
    });

    attrObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['name'],
      subtree: true
    });
  }

  /* ────────── CLEANUP ────────── */
  function cleanup() {
    if (attrObserver) {
      attrObserver.disconnect();
      attrObserver = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── INIT ────────── */
  function init() {
    renderIconsIn(document);
    initAttributeObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_ICONS = {
    render: renderIconsIn,
    refresh: function(el) { return renderIcon(el, true); },
    map: ICON_MAP,
    pending: function() {
      return document.querySelectorAll('ion-icon:not([data-rendered])').length;
    },
    unknown: function() {
      return Array.from(document.querySelectorAll('ion-icon'))
        .filter(function(el) {
          const n = el.getAttribute('name');
          return n && !ICON_MAP[n];
        })
        .map(function(el) { return el.getAttribute('name'); });
    }
  };

})();