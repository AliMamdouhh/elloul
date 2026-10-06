/* ═══════════════════════════════════════════════════════════
   THEME — Manager + Meta Sync + Color Picker
   v3.0 — Self-contained + Cleanup + Debug API
   ═══════════════════════════════════════════════════════════
   ⚠️ ملاحظة: هذا الملف يتولّى الآن كل ما يخص الثيم
   بما في ذلك مزامنة meta[name=theme-color]
   → احذف نفس المنطق من boot.js (تفصيل في نهاية الشرح)
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  const THEME_KEY = 'elloul-theme';
  const COLOR_KEY = 'elloul-color';
  const html = document.documentElement;

  const VALID_THEMES = ['dark', 'light'];
  const VALID_COLORS = ['blue','purple','pink','rose','red','orange','amber','lime','green','teal','cyan','indigo'];

  const BAR_COLORS = {
    blue:{dark:'#0a1229',light:'#3b82f6'},   purple:{dark:'#1e0a3d',light:'#a855f7'},
    pink:{dark:'#33061f',light:'#ec4899'},   rose:{dark:'#33061a',light:'#f43f5e'},
    red:{dark:'#2c0a0a',light:'#ef4444'},    orange:{dark:'#2c1405',light:'#f97316'},
    amber:{dark:'#2c1f05',light:'#f59e0b'},  lime:{dark:'#1a2c05',light:'#84cc16'},
    green:{dark:'#052c20',light:'#10b981'},  teal:{dark:'#052925',light:'#14b8a6'},
    cyan:{dark:'#05252e',light:'#06b6d4'},   indigo:{dark:'#141640',light:'#6366f1'}
  };

  /* ────────── Storage helpers ────────── */
  function getSaved(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function setSaved(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function removeSaved(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  /* ────────── Apply initial theme (BEFORE DOM) ────────── */
  const prefersLight = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;
  const initialTheme = getSaved(THEME_KEY, prefersLight ? 'light' : 'dark');
  const initialColor = getSaved(COLOR_KEY, 'blue');

  html.setAttribute('data-theme', VALID_THEMES.indexOf(initialTheme) > -1 ? initialTheme : 'dark');
  html.setAttribute('data-color', VALID_COLORS.indexOf(initialColor) > -1 ? initialColor : 'blue');

  /* ────────── Meta sync ────────── */
  function syncMeta() {
    const t = html.getAttribute('data-theme') || 'dark';
    const c = html.getAttribute('data-color') || 'blue';
    const barColor = BAR_COLORS[c] ? BAR_COLORS[c][t] : null;
    if (!barColor) return;

    const meta = document.getElementById('themeColorMeta') ||
                 document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', barColor);

    const apple = document.getElementById('appleStatusBar');
    if (apple) apple.setAttribute('content', t === 'dark' ? 'black-translucent' : 'default');
  }

  // طبق المزامنة الأولية
  if (document.readyState === 'loading') {
    // meta tags قد لا تكون موجودة بعد — ننتظر DOMContentLoaded
    document.addEventListener('DOMContentLoaded', syncMeta, { once: true });
  } else {
    syncMeta();
  }

  /* ────────── Attribute observer ────────── */
  let attrObserver = null;

  function initAttrObserver() {
    if (attrObserver) return;
    attrObserver = new MutationObserver(syncMeta);
    attrObserver.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color']
    });
  }

  /* ────────── Listener tracker ────────── */
  const listeners = [];

  function addListener(target, type, fn, options) {
    if (!target) return;
    target.addEventListener(type, fn, options);
    listeners.push({ target, type, fn, options });
  }

  /* ────────── UI init ────────── */
  function initUI() {
    /* Theme toggle */
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      addListener(themeToggle, 'click', () => {
        const cur = html.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        setSaved(THEME_KEY, next);
        // MutationObserver يستدعي syncMeta تلقائيًا
      });
    }

    /* Color picker */
    const colorBtn = document.getElementById('colorBtn');
    const colorMenu = document.getElementById('colorMenu');
    const swatches = document.querySelectorAll('.color-swatch');

    if (!colorBtn || !colorMenu) return;

    /* مزامنة الحالة الابتدائية */
    const activeColor = html.getAttribute('data-color') || 'blue';
    swatches.forEach(s => s.classList.toggle('active', s.dataset.color === activeColor));

    /* فتح/إغلاق */
    addListener(colorBtn, 'click', (e) => {
      e.stopPropagation();
      colorMenu.classList.toggle('open');
    });

    /* اختيار لون */
    swatches.forEach(swatch => {
      addListener(swatch, 'click', (e) => {
        e.stopPropagation();
        const color = swatch.dataset.color;
        if (VALID_COLORS.indexOf(color) === -1) return;

        html.setAttribute('data-color', color);
        setSaved(COLOR_KEY, color);

        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        colorMenu.classList.remove('open');  // ✅ بدون setTimeout
      });
    });

    /* إغلاق عند النقر خارجًا */
    addListener(document, 'click', (e) => {
      if (colorMenu.classList.contains('open') &&
          !colorMenu.contains(e.target) &&
          !colorBtn.contains(e.target)) {
        colorMenu.classList.remove('open');
      }
    });

    /* إغلاق عند Escape */
    addListener(document, 'keydown', (e) => {
      if (e.key === 'Escape') colorMenu.classList.remove('open');
    });
  }

  /* ────────── OS theme watcher ────────── */
  let mq = null;
  let mqListener = null;

  function initOSWatcher() {
    if (!window.matchMedia) return;
    mq = window.matchMedia('(prefers-color-scheme: light)');
    mqListener = (e) => {
      // لو المستخدم اختار ثيم يدويًا، احترم اختياره
      if (getSaved(THEME_KEY, null) !== null) return;
      html.setAttribute('data-theme', e.matches ? 'light' : 'dark');
      // MutationObserver يتولى syncMeta
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', mqListener);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(mqListener);  // Safari < 14
    }
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    // أزل كل listeners
    for (let i = 0; i < listeners.length; i++) {
      const { target, type, fn, options } = listeners[i];
      try { target.removeEventListener(type, fn, options); } catch (e) {}
    }
    listeners.length = 0;

    // افصل observer
    if (attrObserver) {
      attrObserver.disconnect();
      attrObserver = null;
    }

    // أزل mq listener
    if (mq && mqListener) {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', mqListener);
      } else if (typeof mq.removeListener === 'function') {
        mq.removeListener(mqListener);
      }
      mqListener = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── Boot ────────── */
  function boot() {
    syncMeta();          // تأكيد أولي
    initAttrObserver();  // ✅ يبدأ المراقبة مبكرًا
    initUI();
    initOSWatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── Debug API ────────── */
  window.ELLOUL_THEME = {
    get theme() { return html.getAttribute('data-theme'); },
    get color() { return html.getAttribute('data-color'); },
    set(theme) {
      if (VALID_THEMES.indexOf(theme) > -1) {
        html.setAttribute('data-theme', theme);
        setSaved(THEME_KEY, theme);
      }
    },
    setColor(color) {
      if (VALID_COLORS.indexOf(color) > -1) {
        html.setAttribute('data-color', color);
        setSaved(COLOR_KEY, color);
      }
    },
    toggle() {
      const cur = html.getAttribute('data-theme') || 'dark';
      this.set(cur === 'dark' ? 'light' : 'dark');
    },
    reset() {
      removeSaved(THEME_KEY);
      removeSaved(COLOR_KEY);
      const prefers = matchMedia('(prefers-color-scheme: light)').matches;
      html.setAttribute('data-theme', prefers ? 'light' : 'dark');
      html.setAttribute('data-color', 'blue');
    },
    sync: syncMeta,
    colors: VALID_COLORS.slice(),
    themes: VALID_THEMES.slice()
  };

})();