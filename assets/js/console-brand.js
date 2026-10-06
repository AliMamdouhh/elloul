/* ═══════════════════════════════════════════════════════════
   CONSOLE BRAND v3.0 — بانر + 24 أمر تفاعلي
   ✅ مفيد ونافع — بدون إزعاج
   ✅ لا يعترض console.clear() — احترام كامل للمطورين
   ✅ عرض مرة واحدة لكل جلسة (SessionStorage)
   ✅ إمكانية الإسكات الدائم عبر elloul.mute()
   ✅ 6 أوامر جديدة: performance, storage, network, memory, cookies, help
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_CONSOLE_READY__) return;
  window.__ELLOUL_CONSOLE_READY__ = true;

  /* ═══════════════════════════════════════════
     ⚙️  الإعدادات
     ═══════════════════════════════════════════ */
  const CONFIG = {
    /* اطبع البانر مرة واحدة فقط لكل جلسة (لا عند كل page reload) */
    oncePerSession: true,

    /* اسم مفتاح sessionStorage */
    sessionKey: 'elloul-console-banner-shown',

    /* اسم مفتاح الإسكات الدائم */
    muteKey: 'elloul-console-muted',

    /* لا تطبع البانر على localhost (لو تحب راحتك كمطوّر) */
    silentOnLocalhost: false
  };

  const IS_DEV =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '';

  /* ✅ احترام الإسكات الدائم */
  function isMuted() {
    try { return localStorage.getItem(CONFIG.muteKey) === '1'; }
    catch(e) { return false; }
  }

  /* ✅ التحقق: هل طُبع البانر في هذه الجلسة؟ */
  function wasShownThisSession() {
    if (!CONFIG.oncePerSession) return false;
    try { return sessionStorage.getItem(CONFIG.sessionKey) === '1'; }
    catch(e) { return false; }
  }

  function markShownThisSession() {
    try { sessionStorage.setItem(CONFIG.sessionKey, '1'); }
    catch(e) {}
  }

  /* ═══════════════════════════════════════════
     📋 البيانات
     ═══════════════════════════════════════════ */
  const BRAND = {
    name:       'ELLOUL',
    tagline:    'متجر أدوات المائدة الفاخرة من الاستانلس ستيل',
    tagline_en: 'Premium Stainless Steel Tableware',
    version:    '3.0.0',
    build:      '2026.10',
    dev:        'Ali Mamdouh',
    email:      'alimamdouhh369@gmail.com',
    phone:      '+20 120 679 6831',
    site:       'https://elloul.store',
    fb:         'https://www.facebook.com/share/1Bs5YmdcDj/',
    wa:         'https://wa.me/201206796831',
    address:    'أبيس الأولى، الإسكندرية — مصر',
    year:       new Date().getFullYear()
  };

  /* ═══════════════════════════════════════════
     🎨 الأنماط
     ═══════════════════════════════════════════ */
  const S = {
    art:        'color:#3b82f6; font-size:9.5px; line-height:1.05; font-family:Consolas,Monaco,monospace; font-weight:bold;',
    title:      'color:#60a5fa; font-size:26px; font-weight:900; letter-spacing:3px;',
    tagline:    'color:#94a3b8; font-size:13px; font-weight:500;',
    divider:    'color:#1e3a8a; font-size:11px; letter-spacing:-1px;',
    label:      'color:#64748b; font-size:12px; font-family:Consolas,monospace;',
    value:      'color:#f4f6fa; font-size:12px; font-family:Consolas,monospace; font-weight:600;',
    link:       'color:#60a5fa; font-size:12px; font-family:Consolas,monospace; text-decoration:underline;',
    badge:      'background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; font-size:11px; font-weight:bold; padding:3px 10px; border-radius:6px; letter-spacing:1px;',
    copyright:  'color:#94a3b8; font-size:12px;',
    brandGold:  'color:#f59e0b; font-size:12px; font-weight:900; letter-spacing:1px;',
    love:       'color:#10b981; font-size:12px; font-weight:600;',
    warnTitle:  'color:#ef4444; background:#450a0a; font-size:15px; font-weight:900; padding:8px 14px; border-radius:6px;',
    warnBody:   'color:#fca5a5; font-size:12px; line-height:1.7;',
    hint:       'color:#94a3b8; font-size:11px; font-style:italic;',
    cmd:        'background:#f59e0b; color:#0a0f1a; font-family:Consolas,monospace; font-size:11px; font-weight:900; padding:2px 8px; border-radius:4px;',
    success:    'color:#10b981; font-size:14px; font-weight:bold; padding:6px 0;',
    info:       'color:#3b82f6; font-size:13px; padding:4px 0;',
    error:      'color:#ef4444; font-size:13px; padding:4px 0;',
    matrix:     'color:#00ff41; font-family:Consolas,monospace; font-size:12px; text-shadow:0 0 6px #00ff41;',
    clock:      'color:#60a5fa; font-family:Consolas,monospace; font-size:24px; font-weight:900; padding:8px 16px; background:#0a1229; border-radius:8px; letter-spacing:3px;'
  };

  const divider = '━'.repeat(64);

  /* ═══════════════════════════════════════════
     🏆 نظام الإنجازات
     ═══════════════════════════════════════════ */
  const ACH_KEY = 'elloul-achievements';

  const ACHIEVEMENTS = {
    first_run:    { icon: '🎬', title: 'البداية',        desc: 'شغّلت أول أمر' },
    explorer:     { icon: '🔍', title: 'المستكشف',       desc: 'جرّبت 5 أوامر' },
    detective:    { icon: '🕵️', title: 'المحقّق',        desc: 'جرّبت 10 أوامر' },
    master:       { icon: '🎓', title: 'المعلّم',         desc: 'جرّبت 18 أمراً' },
    matrix_fan:   { icon: '🟢', title: 'عاشق المصفوفة', desc: 'شغّلت matrix' },
    time_master:  { icon: '⏰', title: 'سيّد الوقت',      desc: 'شغّلت clock أو timer' },
    artist:       { icon: '🎨', title: 'الفنان',          desc: 'غيّرت الثيم من Console' },
    comedian:     { icon: '😄', title: 'المرح',           desc: 'شغّلت joke' },
    lucky:        { icon: '🍀', title: 'محظوظ',           desc: 'جرّبت dice أو coin' },
    hacker:       { icon: '💻', title: 'الهاكر',          desc: 'شغّلت fireworks أو type' }
  };

  let unlocked = loadAchievements();
  let commandsUsed = new Set(loadUsedCommands());

  function loadAchievements() {
    try {
      const raw = localStorage.getItem(ACH_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveAchievements() {
    try { localStorage.setItem(ACH_KEY, JSON.stringify(unlocked)); } catch(e) {}
  }

  function loadUsedCommands() {
    try {
      const raw = localStorage.getItem(ACH_KEY + '-cmds');
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveUsedCommands() {
    try {
      localStorage.setItem(ACH_KEY + '-cmds', JSON.stringify([...commandsUsed]));
    } catch(e) {}
  }

  function trackCommand(name) {
    commandsUsed.add(name);
    saveUsedCommands();

    if (!unlocked.includes('first_run')) unlockAchievement('first_run');
    if (commandsUsed.size >= 5 && !unlocked.includes('explorer')) unlockAchievement('explorer');
    if (commandsUsed.size >= 10 && !unlocked.includes('detective')) unlockAchievement('detective');
    if (commandsUsed.size >= 18 && !unlocked.includes('master')) unlockAchievement('master');
  }

  function unlockAchievement(id) {
    if (unlocked.includes(id)) return;
    unlocked.push(id);
    saveAchievements();

    const a = ACHIEVEMENTS[id];
    if (!a) return;

    console.log(
      '%c🏆 إنجاز جديد!  ' + a.icon + '  ' + a.title + '  —  ' + a.desc,
      'color:#f59e0b; background:#3b2a05; padding:6px 12px; border-radius:6px; font-weight:bold; font-size:13px;'
    );
    console.log(
      '%c  التقدم: ' + unlocked.length + ' / ' + Object.keys(ACHIEVEMENTS).length + ' إنجاز',
      'color:#64748b; font-size:11px;'
    );
  }

  /* ═══════════════════════════════════════════
     🎨 البانر — يُطبع مرة واحدة
     ═══════════════════════════════════════════ */
  const art = [
    '  ███████╗██╗     ██╗      ██████╗ ██╗   ██╗██╗',
    '  ██╔════╝██║     ██║     ██╔═══██╗██║   ██║██║',
    '  █████╗  ██║     ██║     ██║   ██║██║   ██║██║',
    '  ██╔══╝  ██║     ██║     ██║   ██║██║   ██║██║',
    '  ███████╗███████╗███████╗╚██████╔╝╚██████╔╝███████╗',
    '  ╚══════╝╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝'
  ].join('\n');

  function printBanner() {
    /* احترام الإسكات */
    if (isMuted()) return;

    /* لا تطبع على localhost (اختياري) */
    if (IS_DEV && CONFIG.silentOnLocalhost) return;

    /* مرة واحدة لكل جلسة */
    if (wasShownThisSession()) return;
    markShownThisSession();

    console.log('%c' + art, S.art);
    console.log('%c' + divider, S.divider);

    console.log(
      '%cELLOUL%c  ·  %c' + BRAND.tagline_en,
      S.title,
      'color:#3b82f6; font-size:26px; font-weight:300;',
      S.tagline
    );

    console.log(
      '%c  الإصدار %c' + BRAND.version + '%c    ·    ' + BRAND.tagline,
      S.label, S.badge, S.tagline
    );

    console.log('%c' + divider, S.divider);

    console.log('%c  👨‍💻  المطوّر         %c' + BRAND.dev,     S.label, S.value);
    console.log('%c  ✉️   البريد           %c' + BRAND.email,   S.label, S.link);
    console.log('%c  📱  واتساب          %c' + BRAND.phone,   S.label, S.value);
    console.log('%c  🌐  الموقع           %c' + BRAND.site,    S.label, S.link);
    console.log('%c  📘  فيسبوك          %c' + BRAND.fb,      S.label, S.link);
    console.log('%c  📍  العنوان          %c' + BRAND.address, S.label, S.value);

    console.log('%c' + divider, S.divider);
    console.log(
      '%c  © ' + BRAND.year + '  %c' + BRAND.name + '%c  —  جميع الحقوق محفوظة.',
      S.copyright, S.brandGold, S.copyright
    );
    console.log('%c  تم التصميم والتطوير بحبّ ❤️  في مصر 🇪🇬', S.love);
    console.log('%c' + divider, S.divider);

    console.log('%c⚠️  تحذير أمني  ·  Security Warning', S.warnTitle);
    console.log(
      '%c  إذا طلب منك أحد لصق كود هنا، فهو غالباً محاولة احتيال.\n' +
      '  لا تلصق أي كود لا تفهمه — قد يسرق بياناتك أو يخترق حسابك.\n' +
      '  ' + BRAND.name + ' لن يطلب منك أبداً لصق أي شيء في الـ Console.',
      S.warnBody
    );

    console.log('%c' + divider, S.divider);
    console.log(
      '%c  💡 اكتب  %celloul.help()  %cلعرض كل الأوامر',
      S.hint, S.cmd, S.hint
    );
    console.log(
      '%c  🔇 للإسكات الدائم:  %celloul.mute()',
      S.hint, S.cmd
    );
    console.log('%c' + divider, S.divider);
  }

  /* ═══════════════════════════════════════════
     🎭 الأوامر
     ═══════════════════════════════════════════ */
  const API = {};

  /* ── 1. elloul() — ترحيب ── */
  API.welcome = function() {
    trackCommand('welcome');
    console.log('%c🎉 أهلاً بك يا صديق المطوّر!', 'color:#f59e0b; font-size:20px; font-weight:900; padding:10px 0;');
    console.log(
      '%c  يسعدنا جداً أنك اهتممت بالموقع لهذه الدرجة 💙\n' +
      '  للتواصل أو التعاون:\n\n' +
      '  📧  ' + BRAND.email + '\n' +
      '  📱  ' + BRAND.phone + '\n' +
      '  🌐  ' + BRAND.site,
      'color:#60a5fa; font-size:13px; line-height:1.9;'
    );
    return '✨ شكراً لاستكشافك — ELLOUL © ' + BRAND.year;
  };

  /* ── 2. elloul.info() — تشخيص فني ── */
  API.info = function() {
    trackCommand('info');
    console.log('%c🔬 التشخيص الفني', 'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;');
    console.table({
      'المتصفح':        navigator.userAgent,
      'اللغة':           navigator.language,
      'المنصّة':         navigator.platform || '—',
      'النواة':          navigator.hardwareConcurrency || '—',
      'النافذة':         window.innerWidth + ' × ' + window.innerHeight,
      'DPI':             window.devicePixelRatio || 1,
      'المنطقة الزمنية': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'الاتصال':         navigator.onLine ? '🟢 متصل' : '🔴 غير متصل',
      'الثيم':           document.documentElement.getAttribute('data-theme') || '—',
      'اللون':           document.documentElement.getAttribute('data-color') || '—'
    });
    return '🔍 تم عرض التشخيص';
  };

  /* ── 3. elloul.about() — عن المتجر ── */
  API.about = function() {
    trackCommand('about');
    console.log('%c🏪 عن ELLOUL', 'color:#f59e0b; font-size:18px; font-weight:900; padding:8px 0;');
    console.log(
      '%c  ' + BRAND.name + ' متجر إلكتروني متخصص في أدوات المائدة\n' +
      '  الفاخرة من الاستانلس ستيل 304.\n\n' +
      '     🥄  ملاعق بجميع الأنواع\n' +
      '     🍴  شوك طعام وحلويات\n' +
      '     🔪  سكاكين مائدة احترافية\n' +
      '     🎁  أطقم كاملة\n\n' +
      '  ✨  مميزاتنا:\n' +
      '     •  استانلس ستيل 304\n' +
      '     •  شحن لجميع محافظات مصر\n' +
      '     •  الدفع عند الاستلام\n' +
      '     •  استبدال مجاني خلال 14 يوم',
      'color:#94a3b8; font-size:12px; line-height:1.8;'
    );
    return '🏪 شكراً لاهتمامك بـ ELLOUL';
  };

  /* ── 4. elloul.help() — قائمة الأوامر ── */
  API.help = function() {
    trackCommand('help');
    console.log('%c📚 قائمة أوامر ELLOUL', 'color:#60a5fa; font-size:16px; font-weight:900; padding:8px 0;');

    console.log('%c🎨 أساسية:', S.info);
    console.table([
      { الأمر: 'elloul()',              الوصف: '🎉 رسالة ترحيب' },
      { الأمر: 'elloul.about()',        الوصف: '🏪 معلومات المتجر' },
      { الأمر: 'elloul.info()',         الوصف: '🔬 تشخيص فني' },
      { الأمر: 'elloul.help()',         الوصف: '📚 هذه القائمة' },
      { الأمر: 'elloul.credits()',      الوصف: '⚖️ حقوق النشر' }
    ]);

    console.log('%c🛍️ المتجر:', S.info);
    console.table([
      { الأمر: 'elloul.products()',     الوصف: '📦 كتالوج المنتجات' },
      { الأمر: 'elloul.cart()',         الوصف: '🛒 محتويات السلة' },
      { الأمر: 'elloul.stats()',        الوصف: '📊 إحصائيات' }
    ]);

    console.log('%c⚡ الأداء والموارد:', S.info);
    console.table([
      { الأمر: 'elloul.performance()',  الوصف: '⚡ مقاييس الأداء (FCP, LCP, CLS)' },
      { الأمر: 'elloul.storage()',      الوصف: '💾 حجم الـ localStorage' },
      { الأمر: 'elloul.memory()',       الوصف: '🧠 استهلاك الذاكرة' },
      { الأمر: 'elloul.network()',      الوصف: '🌐 حالة الشبكة والموارد' }
    ]);

    console.log('%c⏰ الوقت:', S.info);
    console.table([
      { الأمر: 'elloul.clock()',        الوصف: '⏰ ساعة حيّة' },
      { الأمر: 'elloul.timer(60)',      الوصف: '⏳ عدّاد تنازلي' }
    ]);

    console.log('%c🎮 حركات:', S.info);
    console.table([
      { الأمر: 'elloul.matrix()',       الوصف: '🟢 تأثير Matrix' },
      { الأمر: 'elloul.fireworks()',    الوصف: '🎆 ألعاب نارية' },
      { الأمر: 'elloul.type(text)',     الوصف: '⌨️ آلة كاتبة' },
      { الأمر: 'elloul.tip()',          الوصف: '💡 نصيحة عشوائية' },
      { الأمر: 'elloul.quote()',        الوصف: '💬 اقتباس' },
      { الأمر: 'elloul.joke()',         الوصف: '😄 نكتة برمجية' },
      { الأمر: 'elloul.dice()',         الوصف: '🎲 رمية زهر' },
      { الأمر: 'elloul.coin()',         الوصف: '🪙 قطعة نقود' }
    ]);

    console.log('%c🎛️ التحكم:', S.info);
    console.table([
      { الأمر: 'elloul.theme("light")', الوصف: '🌗 تغيير الثيم' },
      { الأمر: 'elloul.color("purple")',الوصف: '🎨 تغيير اللون' },
      { الأمر: 'elloul.achievements()', الوصف: '🏆 إنجازاتك' },
      { الأمر: 'elloul.thanks()',       الوصف: '💙 شكراً' },
      { الأمر: 'elloul.hire()',         الوصف: '💼 للتوظيف' },
      { الأمر: 'elloul.mute()',         الوصف: '🔇 إسكات البانر دائماً' },
      { الأمر: 'elloul.unmute()',       الوصف: '🔊 إعادة تفعيل البانر' },
      { الأمر: 'elloul.reset()',        الوصف: '🗑️ إعادة تعيين' }
    ]);

    return '✨ اكتب أي أمر واضغط Enter';
  };

  /* ── 5. elloul.credits() ── */
  API.credits = function() {
    trackCommand('credits');
    console.log('%c⚖️  حقوق النشر — Copyright', 'color:#f59e0b; font-size:16px; font-weight:900; padding:8px 0;');
    console.log(
      '%c  © ' + BRAND.year + '  %c' + BRAND.name + '\n\n' +
      '%c  جميع الحقوق محفوظة. يُمنع نسخ أو إعادة استخدام أو توزيع أي جزء\n' +
      '  من هذا الموقع (الكود، التصميم، الصور، النصوص) بدون إذن كتابي.\n\n' +
      '  📝  التصميم والتطوير: ' + BRAND.dev + '\n' +
      '  📅  الإصدار: ' + BRAND.version + '\n' +
      '  🏗️  البناء: ' + BRAND.build,
      S.copyright, S.brandGold, S.copyright
    );
    return '⚖️ ' + BRAND.name + ' © ' + BRAND.year + ' — All Rights Reserved';
  };

  /* ── 6. elloul.products() ── */
  API.products = function() {
    trackCommand('products');
    let products = [];
    try {
      const shopGrid = document.querySelector('[data-shop-grid]');
      if (shopGrid) {
        products = Array.from(shopGrid.querySelectorAll('.product-card')).map(card => ({
          'الاسم':   card.querySelector('.product-name')?.textContent?.trim() || '—',
          'القسم':   card.querySelector('.product-cat')?.textContent?.trim() || '—',
          'السعر':   card.querySelector('.price-now')?.textContent?.trim() || '—',
          'التقييم': card.querySelector('.product-rating')?.textContent?.trim() || '—'
        }));
      }
    } catch(e) {}

    if (!products.length) {
      console.log('%c📦 لا توجد منتجات معروضة حالياً — افتح صفحة المتجر أولاً', S.error);
      return '📦 جرب elloul.products() بعد فتح المتجر';
    }

    console.log('%c📦 كتالوج المنتجات (' + products.length + ' منتج)', S.info);
    console.table(products);
    return '📦 تم عرض ' + products.length + ' منتج';
  };

  /* ── 7. elloul.cart() ── */
  API.cart = function() {
    trackCommand('cart');
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]'); } catch(e) {}

    if (!cart.length) {
      console.log('%c🛒 سلتك فارغة', S.info);
      return '🛒 السلة فارغة';
    }

    const total = cart.reduce((s, i) => s + (i.qty || 0), 0);
    console.log('%c🛒 محتويات السلة — ' + total + ' قطعة', S.success);
    console.table(cart.map(i => ({ 'Product ID': i.id, 'الكمية': i.qty })));
    return '🛒 ' + cart.length + ' نوع — ' + total + ' قطعة';
  };

  /* ── 8. elloul.stats() ── */
  API.stats = function() {
    trackCommand('stats');
    let cart = [], favs = [];
    try {
      cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]');
      favs = JSON.parse(localStorage.getItem('elloul-fav') || '[]');
    } catch(e) {}

    const productCards = document.querySelectorAll('.product-card');
    console.log('%c📊 إحصائيات المتجر', S.info);
    console.table({
      'المنتجات المعروضة': productCards.length,
      'عناصر السلة':       cart.length,
      'إجمالي القطع':      cart.reduce((s, i) => s + (i.qty || 0), 0),
      'المفضلة':           favs.length,
      'الصفحة الحالية':    localStorage.getItem('elloul-page') || 'home',
      'الثيم':             document.documentElement.getAttribute('data-theme') || '—',
      'الإنجازات':         unlocked.length + ' / ' + Object.keys(ACHIEVEMENTS).length
    });
    return '📊 تم عرض الإحصائيات';
  };

  /* ═══════════════════════════════════════════
     ⚡ أوامر جديدة — الأداء والموارد
     ═══════════════════════════════════════════ */

  /* ── 9. elloul.performance() ── */
  API.performance = function() {
    trackCommand('performance');

    if (!window.performance) {
      console.log('%c❌ Performance API غير مدعومة في هذا المتصفح', S.error);
      return '❌ غير مدعوم';
    }

    let nav = null;
    try {
      nav = performance.getEntriesByType('navigation')[0];
    } catch(e) {}

    const fcp = (function() {
      try {
        const e = performance.getEntriesByName('first-contentful-paint');
        return e.length ? Math.round(e[0].startTime) + 'ms' : '—';
      } catch(err) { return '—'; }
    })();

    /* محاولة قراءة LCP من ELLOUL_PERF إن وُجد */
    let lcp = '—', cls = '—', tbt = '—';
    if (window.ELLOUL_PERF && typeof window.ELLOUL_PERF.metrics === 'function') {
      try {
        const m = window.ELLOUL_PERF.metrics();
        lcp = m.lcp ? Math.round(m.lcp) + 'ms' : '—';
        cls = m.cls !== undefined ? m.cls.toFixed(3) : '—';
        tbt = m.tbt ? Math.round(m.tbt) + 'ms' : '—';
      } catch(e) {}
    }

    console.log('%c⚡ مقاييس الأداء', 'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;');

    const data = {
      'FCP':         fcp,
      'LCP':         lcp,
      'CLS':         cls,
      'TBT':         tbt,
      'TTFB':        nav ? Math.round(nav.responseStart) + 'ms' : '—',
      'DOM Ready':   nav ? Math.round(nav.domContentLoadedEventEnd) + 'ms' : '—',
      'Load':        nav ? Math.round(nav.loadEventEnd) + 'ms' : '—',
      'DOM Nodes':   document.querySelectorAll('*').length,
      'Resources':   performance.getEntriesByType('resource').length
    };

    console.table(data);

    console.log(
      '%c  💡 لتقرير مفصّل:  %celloul.perf.report()',
      S.hint, S.cmd
    );

    return '⚡ تم عرض مقاييس الأداء';
  };

  /* ── 10. elloul.storage() ── */
  API.storage = function() {
    trackCommand('storage');
    console.log('%c💾 استخدام الـ Storage', 'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;');

    function bytes(str) {
      if (!str) return 0;
      return new Blob([str]).size;
    }

    function fmt(b) {
      if (b < 1024) return b + ' B';
      if (b < 1024 * 1024) return (b / 1024).toFixed(2) + ' KB';
      return (b / 1024 / 1024).toFixed(2) + ' MB';
    }

    /* localStorage */
    let lsTotal = 0;
    const lsRows = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || '';
        const size = bytes(k) + bytes(v);
        lsTotal += size;
        lsRows.push({
          'المفتاح': k,
          'الحجم':   fmt(size),
          'القيمة':  v.length > 40 ? v.substring(0, 40) + '…' : v
        });
      }
    } catch(e) {}

    console.log('%c📦 localStorage — إجمالي: ' + fmt(lsTotal) + '  (' + lsRows.length + ' مفتاح)', S.info);
    if (lsRows.length) {
      /* رتّب حسب الحجم تنازلياً */
      lsRows.sort((a, b) => {
        const sizeA = parseFloat(a['الحجم']);
        const sizeB = parseFloat(b['الحجم']);
        return sizeB - sizeA;
      });
      console.table(lsRows);
    }

    /* sessionStorage */
    let ssCount = 0;
    try { ssCount = sessionStorage.length; } catch(e) {}
    console.log('%c📋 sessionStorage: ' + ssCount + ' مفتاح', S.info);

    /* Cache Storage */
    if ('caches' in window) {
      caches.keys().then(keys => {
        console.log('%c🗃️ Cache Storage: ' + keys.length + ' cache', S.info);
        if (keys.length) {
          console.table(keys.map(k => ({ 'Cache': k })));
        }
      }).catch(() => {});
    }

    return '💾 localStorage: ' + fmt(lsTotal);
  };

  /* ── 11. elloul.memory() ── */
  API.memory = function() {
    trackCommand('memory');

    if (!performance.memory) {
      console.log('%c🧠 Memory API غير متاحة — تعمل فقط على Chrome/Edge', S.error);
      return '❌ غير مدعوم في هذا المتصفح';
    }

    const m = performance.memory;
    const used = (m.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const total = (m.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limit = (m.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    const pct = ((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100).toFixed(1);

    console.log('%c🧠 استهلاك الذاكرة', 'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;');
    console.table({
      'المستخدم حالياً':  used + ' MB',
      'المُخصَّص':        total + ' MB',
      'الحد الأقصى':      limit + ' MB',
      'نسبة الاستهلاك':   pct + '%'
    });

    const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
    console.log('%c  ' + pct + '% من الذاكرة المتاحة', 'color:' + color + '; font-weight:bold;');

    return '🧠 ' + used + ' MB / ' + limit + ' MB';
  };

  /* ── 12. elloul.network() ── */
  API.network = function() {
    trackCommand('network');

    console.log('%c🌐 حالة الشبكة', 'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;');

    /* حالة الاتصال */
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const rows = {
      'متصل':    navigator.onLine ? '🟢 نعم' : '🔴 لا',
      'النوع':   conn ? (conn.effectiveType || '—') : '—',
      'السرعة':  conn ? (conn.downlink ? conn.downlink + ' Mbps' : '—') : '—',
      'RTT':     conn ? (conn.rtt ? conn.rtt + 'ms' : '—') : '—',
      'توفير البيانات': conn ? (conn.saveData ? 'مفعّل' : 'معطّل') : '—'
    };
    console.table(rows);

    /* الموارد */
    const resources = performance.getEntriesByType('resource');
    const byType = {};
    resources.forEach(r => {
      const ext = r.name.split('.').pop().split('?')[0].toLowerCase().substring(0, 5);
      byType[ext] = (byType[ext] || 0) + 1;
    });

    console.log('%c📦 الموارد المحمّلة (' + resources.length + ')', S.info);

    const total = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
    console.log(
      '%c  الحجم الإجمالي: ' + (total / 1024).toFixed(1) + ' KB',
      'color:#10b981; font-weight:bold;'
    );

    console.table(Object.entries(byType).map(([type, count]) => ({
      'النوع': type,
      'العدد': count
    })));

    return '🌐 ' + resources.length + ' مورد — ' + (total / 1024).toFixed(1) + ' KB';
  };

  /* ── 13. elloul.clock() ── */
  let clockInterval = null;
  API.clock = function(stop) {
    trackCommand('clock');

    if (stop === false || clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
      console.log('%c⏰ تم إيقاف الساعة', S.info);
      unlockAchievement('time_master');
      return '⏰ الساعة متوقفة';
    }

    const tick = () => {
      const d = new Date();
      const time = d.toLocaleTimeString('ar-EG', { hour12: false });
      const date = d.toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      console.clear();
      console.log('%c⏰  ' + time, S.clock);
      console.log('%c📅  ' + date, 'color:#94a3b8; font-size:14px; padding:6px 0;');
      console.log(
        '%c  لإيقاف الساعة:  elloul.clock(false)',
        'color:#64748b; font-size:11px; font-style:italic;'
      );
    };

    tick();
    clockInterval = setInterval(tick, 1000);
    unlockAchievement('time_master');
    return '⏰ الساعة تشتغل — أوقفها بـ elloul.clock(false)';
  };

  /* ── 14. elloul.timer(N) ── */
  API.timer = function(seconds) {
    trackCommand('timer');
    const total = Math.max(1, Math.min(3600, parseInt(seconds, 10) || 10));
    let remaining = total;

    console.log('%c⏳ عدّاد تنازلي: ' + total + ' ثانية', S.info);

    const interval = setInterval(() => {
      const min = String(Math.floor(remaining / 60)).padStart(2, '0');
      const sec = String(remaining % 60).padStart(2, '0');
      const pct = Math.round((remaining / total) * 30);
      const bar = '█'.repeat(pct) + '░'.repeat(30 - pct);
      console.log(
        '%c⏳ ' + min + ':' + sec + '  ' + bar,
        'color:#60a5fa; font-family:Consolas,monospace; font-size:13px;'
      );
      remaining--;
      if (remaining < 0) {
        clearInterval(interval);
        console.log('%c🎉 الوقت انتهى!', S.success);
      }
    }, 1000);

    unlockAchievement('time_master');
    return '⏳ العدّاد بدأ';
  };

  /* ── 15. elloul.matrix() ── */
  API.matrix = function(duration) {
    trackCommand('matrix');
    const ms = Math.min(8000, Math.max(1000, duration || 4000));
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const columns = 60;
    const totalFrames = Math.floor(ms / 80);
    let frame = 0;

    console.log('%c🟢 INITIALIZING MATRIX...', 'color:#00ff41; font-size:16px; font-weight:bold; padding:6px 0;');

    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(interval);
        console.log('%c✅ MATRIX COMPLETE', S.success);
        return;
      }

      let line = '';
      for (let i = 0; i < columns; i++) {
        line += Math.random() > 0.5
          ? chars[Math.floor(Math.random() * chars.length)]
          : ' ';
      }
      console.log('%c' + line, S.matrix);
      frame++;
    }, 80);

    unlockAchievement('matrix_fan');
    return '🟢 شغّل Matrix لمدة ' + (ms / 1000) + ' ثانية';
  };

  /* ── 16. elloul.fireworks() ── */
  API.fireworks = function() {
    trackCommand('fireworks');
    const symbols = ['🎆', '✨', '🎇', '💥', '🌟', '⭐', '💫'];
    let count = 0;

    console.log('%c🎆 بدء العرض!', 'color:#f59e0b; font-size:18px; font-weight:900; padding:8px 0;');

    const interval = setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const padding = ' '.repeat(Math.floor(Math.random() * 30));
      const colors = ['#ff6b00', '#ffb700', '#ff3b30', '#3b82f6', '#10b981', '#a855f7'];
      const color = colors[Math.floor(Math.random() * 6)];
      console.log(
        '%c' + padding + sym + sym + sym + '  ' + sym + '  ' + sym + sym,
        'color:' + color + '; font-size:20px; text-shadow:0 0 12px ' + color + ';'
      );
      count++;
      if (count >= 15) {
        clearInterval(interval);
        console.log('%c🎆 انتهى العرض — أعد التشغيل بـ elloul.fireworks()', S.success);
      }
    }, 250);

    unlockAchievement('hacker');
    return '🎆 استمتع بالعرض!';
  };

  /* ── 17. elloul.type(text) ── */
  API.type = function(text) {
    trackCommand('type');
    const msg = String(text || 'ELLOUL — متجر أدوات المائدة الفاخرة 🥄').slice(0, 200);
    let i = 0;

    console.log('%c⌨️ ابدأ الكتابة...', S.info);

    const interval = setInterval(() => {
      if (i >= msg.length) {
        clearInterval(interval);
        console.log('%c\n✅ اكتملت الكتابة', S.success);
        return;
      }
      console.log(
        '%c' + msg.substring(0, i + 1),
        'color:#60a5fa; font-size:14px; font-family:monospace;'
      );
      i++;
    }, 60);

    unlockAchievement('hacker');
    return '⌨️ جاري الكتابة...';
  };

  /* ── 18. elloul.tip() ── */
  API.tip = function() {
    trackCommand('tip');
    const tips = [
      '💡 استخدم Ctrl+Shift+R لإعادة تحميل الصفحة مع تفريغ الذاكرة',
      '💡 DevTools → Network → Slow 3G لاختبار الموقع على شبكة بطيئة',
      '💡 DevTools → Application → Local Storage لرؤية بيانات ELLOUL',
      '💡 DevTools → Lighthouse لتقييم أداء الموقع',
      '💡 استخدم Console.log() بدل alert() للتشخيص السريع',
      '💡 في Firefox: Shift+F2 لفتح Command Line',
      '💡 Ctrl+Shift+P في Chrome لفتح Command Palette',
      '💡 DevTools → Rendering → Paint Flashing لرؤية عمليات الرسم',
      '💡 لتجربة الموقع كأنك على جوال: Ctrl+Shift+M',
      '💡 Network → Preserve log لحفظ السجلات عند الانتقال',
      '💡 جرّب  elloul.performance()  لمراقبة أداء الموقع',
      '💡 جرّب  elloul.storage()  لمعرفة حجم البيانات المحفوظة'
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    console.log('%c' + tip, 'color:#10b981; font-size:13px; padding:6px 0;');
    return '💡 ' + tip;
  };

  /* ── 19. elloul.quote() ── */
  API.quote = function() {
    trackCommand('quote');
    const quotes = [
      { text: '"الجودة لا تعني الغلاء، بل تعني الاستمرارية."',     author: 'ELLOUL' },
      { text: '"أدوات المائدة الجيدة تجعل كل وجبة تجربة مميزة."', author: 'ELLOUL' },
      { text: '"الاستانلس ستيل 304 هو الفرق بين الجيد والممتاز."', author: 'ELLOUL' },
      { text: '"الكود النظيف مثل الأدوات النظيفة — يعيش أطول."',  author: 'Anonymous Dev' },
      { text: '"البساطة هي الذروة النهائية للتطور."',             author: 'Leonardo da Vinci' },
      { text: '"اجعل الأمر بسيطاً قدر الإمكان، ولكن ليس أبسط."', author: 'Albert Einstein' },
      { text: '"الجودة ليست فعلاً، بل عادة."',                    author: 'Aristotle' },
      { text: '"من لا يتقدم، يتأخر."',                            author: 'Latin Proverb' },
      { text: '"التفاصيل الصغيرة تصنع الفرق الكبير."',            author: 'ELLOUL' },
      { text: '"الثقة تُبنى بالجودة، لا بالإعلانات."',            author: 'ELLOUL' }
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    console.log('%c' + q.text, 'color:#60a5fa; font-size:14px; font-style:italic; padding:6px 0;');
    console.log('%c  — ' + q.author, 'color:#64748b; font-size:12px;');
    return '💬 ' + q.text;
  };

  /* ── 20. elloul.joke() ── */
  API.joke = function() {
    trackCommand('joke');
    const jokes = [
      '😄 كود نضيف، حياة نظيفة — حتى لو الـ CSS مش متعاون.',
      '😄 ليه المبرمج بيحب القهوة؟ عشان الـ Java!',
      '😄 bugs كلمة صغيرة، بس معناها كبير.',
      '😄 واحد دخل يشتري ملاعق قال: عايز ملعقة تعيش للأبد. قاله البائع: خد استانلس 304!',
      '😄 CSS: أنا هظبط الدنيا. Reality: margin-top: -10px; position: absolute;',
      '😄 لو الكود بيشتغل تمام، متلمسهوش.',
      '😄 99 bugs in the code, fix one — 127 bugs in the code.',
      '😄 HTML في 1990، HTML في 2026: نفس المشكلة — divs كتير.',
      '😄 عمر المبرمج ما بيكره JavaScript، بس بيكره الـ framework الجديد كل شهر.',
      '😄 WFH: Working From Hammock، Working From Home، أو Working From Hell.'
    ];
    const j = jokes[Math.floor(Math.random() * jokes.length)];
    console.log('%c' + j, 'color:#f59e0b; font-size:14px; padding:6px 0;');
    unlockAchievement('comedian');
    return '😄 ' + j;
  };

  /* ── 21. elloul.dice() ── */
  API.dice = function(sides) {
    trackCommand('dice');
    const s = Math.max(2, Math.min(100, parseInt(sides, 10) || 6));
    const result = Math.floor(Math.random() * s) + 1;
    const face = ['⚀','⚁','⚂','⚃','⚄','⚅'][Math.min(5, result - 1)] || '🎲';
    console.log('%c🎲 رميت زهر بـ ' + s + ' أوجه', S.info);
    console.log(
      '%c   ' + face + '   →   ' + result,
      'color:#f59e0b; font-size:28px; font-weight:900; padding:8px 0;'
    );
    unlockAchievement('lucky');
    return '🎲 النتيجة: ' + result;
  };

  /* ── 22. elloul.coin() ── */
  API.coin = function() {
    trackCommand('coin');
    const result = Math.random() > 0.5;
    const icon = result ? '👑' : '🔢';
    const text = result ? 'صورة (ملك)' : 'كتابة (رقم)';
    console.log('%c🪙 نقلة العملة...', S.info);
    console.log(
      '%c   ' + icon + '   →   ' + text,
      'color:#f59e0b; font-size:22px; font-weight:900; padding:8px 0;'
    );
    unlockAchievement('lucky');
    return '🪙 ' + text;
  };

  /* ── 23. elloul.theme(t) ── */
  API.theme = function(t) {
    trackCommand('theme');
    const valid = ['dark', 'light'];
    if (valid.indexOf(t) === -1) {
      console.log('%c❌ الثيمات المتاحة: dark, light', S.error);
      console.log('%c   مثال: elloul.theme("light")', S.hint);
      return '❌ ثيم غير صالح';
    }
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('elloul-theme', t); } catch(e) {}
    console.log('%c✅ تم تغيير الثيم إلى: ' + t, S.success);
    unlockAchievement('artist');
    return '🎨 ' + t;
  };

  /* ── 24. elloul.color(c) ── */
  API.color = function(c) {
    trackCommand('color');
    const valid = ['blue','purple','pink','rose','red','orange','amber','lime','green','teal','cyan','indigo'];
    if (valid.indexOf(c) === -1) {
      console.log('%c❌ الألوان المتاحة:', S.error);
      console.log('%c   ' + valid.join(', '), S.hint);
      return '❌ لون غير صالح';
    }
    document.documentElement.setAttribute('data-color', c);
    try { localStorage.setItem('elloul-color', c); } catch(e) {}
    console.log('%c✅ تم تغيير اللون إلى: ' + c, S.success);
    unlockAchievement('artist');
    return '🎨 ' + c;
  };

  /* ── 25. elloul.achievements() ── */
  API.achievements = function() {
    trackCommand('achievements');
    console.log('%c🏆 إنجازاتك', 'color:#f59e0b; font-size:16px; font-weight:900; padding:8px 0;');
    console.log(
      '%c   ' + unlocked.length + ' / ' + Object.keys(ACHIEVEMENTS).length + ' إنجاز',
      'color:#60a5fa; font-size:13px; font-weight:bold;'
    );

    const rows = Object.entries(ACHIEVEMENTS).map(([id, a]) => ({
      '':       unlocked.includes(id) ? '✅' : '🔒',
      'الإنجاز': a.icon + '  ' + a.title,
      'الوصف':   a.desc
    }));
    console.table(rows);
    return '🏆 ' + unlocked.length + ' / ' + Object.keys(ACHIEVEMENTS).length;
  };

  /* ── 26. elloul.thanks() ── */
  API.thanks = function() {
    trackCommand('thanks');
    console.log('%c💙 شكراً لك!', 'color:#3b82f6; font-size:22px; font-weight:900; padding:12px 0;');
    console.log(
      '%c  شكراً لأنك استكشفت ELLOUL بعمق.\n' +
      '  كل سطر كود هنا كُتب بعناية لأجلك.\n\n' +
      '  نتمنى أن تجد ما يسرّك،\n' +
      '  وإن أعجبك عملنا — شاركنا مع من تحب 💙',
      'color:#94a3b8; font-size:13px; line-height:2;'
    );
    console.log('%c' + divider, S.divider);
    return '💙 شكراً لك من ELLOUL';
  };

  /* ── 27. elloul.hire() ── */
  API.hire = function() {
    trackCommand('hire');
    console.log('%c💼 هل تريد التعاون؟', 'color:#10b981; font-size:18px; font-weight:900; padding:8px 0;');
    console.log(
      '%c  ' + BRAND.dev + ' — مطوّر الويب\n\n' +
      '  ✅  واجهات أمامية تفاعلية\n' +
      '  ✅  متاجر إلكترونية\n' +
      '  ✅  PWA + أداء عالي\n' +
      '  ✅  Firebase + APIs\n' +
      '  ✅  تصميم عربي RTL\n\n' +
      '  📧  ' + BRAND.email + '\n' +
      '  📱  ' + BRAND.phone,
      'color:#94a3b8; font-size:12px; line-height:1.9;'
    );
    return '💼 للتواصل: ' + BRAND.email;
  };

  /* ═══════════════════════════════════════════
     🔇 أوامر الإسكات — جديد v3.0
     ═══════════════════════════════════════════ */

  /* ── elloul.mute() — إسكات البانر دائماً ── */
  API.mute = function() {
    try { localStorage.setItem(CONFIG.muteKey, '1'); } catch(e) {}
    console.log('%c🔇 تم إسكات البانر بشكل دائم', S.success);
    console.log('%c   لن يظهر مرة أخرى حتى تستخدم  elloul.unmute()', S.hint);
    return '🔇 البانر مُسكَت';
  };

  /* ── elloul.unmute() — إعادة تفعيل البانر ── */
  API.unmute = function() {
    try {
      localStorage.removeItem(CONFIG.muteKey);
      sessionStorage.removeItem(CONFIG.sessionKey);
    } catch(e) {}
    console.log('%c🔊 تم إعادة تفعيل البانر', S.success);
    console.log('%c   سيظهر في الجلسة القادمة', S.hint);
    return '🔊 البانر مُفعَّل';
  };

  /* ── elloul.reset() — إعادة تعيين كل البيانات ── */
  API.reset = function() {
    trackCommand('reset');
    try {
      localStorage.removeItem(ACH_KEY);
      localStorage.removeItem(ACH_KEY + '-cmds');
      localStorage.removeItem(CONFIG.muteKey);
      localStorage.removeItem('elloul-cart');
      localStorage.removeItem('elloul-fav');
      localStorage.removeItem('elloul-page');
      localStorage.removeItem('elloul-theme');
      localStorage.removeItem('elloul-color');
    } catch(e) {}
    console.log('%c🗑️ تم إعادة تعيين كل البيانات', S.success);
    console.log('%c   سيتم إعادة تحميل الصفحة الآن...', S.info);
    setTimeout(() => location.reload(), 1000);
    return '🗑️ Reloading...';
  };

  /* ═══════════════════════════════════════════
     🎯 الكشف النهائي — window.elloul
     ═══════════════════════════════════════════ */
  function elloul() { return API.welcome(); }

  Object.keys(API).forEach(k => {
    if (k === 'welcome') return;
    elloul[k] = API[k];
  });

  /* أدلة مختصرة */
  elloul.version = BRAND.version;
  elloul.brand   = BRAND.name;
  elloul.site    = BRAND.site;
  elloul.muted   = isMuted();

  window.elloul = elloul;

  /* ═══════════════════════════════════════════
     🎬 طباعة البانر — مرة واحدة فقط
     ═══════════════════════════════════════════ */
  printBanner();

  /* ═══════════════════════════════════════════
     🎁 إشعار مختصر بأهم الأوامر
     ═══════════════════════════════════════════ */
  console.log(
    '%c  🎁  ' + Object.keys(API).length + ' أمر متاح — اكتب:  %celloul.help()',
    S.hint, S.cmd
  );

  console.log(
    '%c  ⚡ جرّب:  %celloul.performance()  %c|  %celloul.storage()  %c|  %celloul.memory()',
    S.hint, S.cmd, S.hint, S.cmd, S.hint
  );

  console.log(
    '%cELLOUL · v' + BRAND.version + ' · © ' + BRAND.year + ' — جميع الحقوق محفوظة',
    'color:#3b82f6; font-size:10px; opacity:0.6;'
  );

})();