/* ═══════════════════════════════════════════════════════════
   LIVE-CHAT — زر واتساب عائم مع رسائل جاهزة
   v2.0 — توقيت القاهرة + cleanup + null checks
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_CHAT_READY__) return;
  window.__ELLOUL_CHAT_READY__ = true;

  const WA_NUMBER = '201206796831';
  const STORE_NAME = 'ELLOUL';
  const PULSE_DELAY_MS = 8000;
  const PULSE_DURATION_MS = 4000;

  /* ────────── مواعيد العمل (توقيت القاهرة) ────────── */
  const HOURS = {
    schedule: {
      6: { open: 9, close: 21 },   // السبت
      0: { open: 9, close: 21 },   // الأحد
      1: { open: 9, close: 21 },   // الاثنين
      2: { open: 9, close: 21 },   // الثلاثاء
      3: { open: 9, close: 21 },   // الأربعاء
      4: { open: 9, close: 21 },   // الخميس
      5: null                      // الجمعة — مغلق
    }
  };

  const QUICK_MESSAGES = [
    { id: 'order',  icon: '🛒', text: 'أريد تأكيد طلب جديد' },
    { id: 'price',  icon: '💰', text: 'أريد استفسار عن الأسعار' },
    { id: 'stock',  icon: '📦', text: 'هل هذا المنتج متوفر؟' },
    { id: 'ship',   icon: '🚚', text: 'أريد معرفة تفاصيل الشحن' },
    { id: 'custom', icon: '✍️', text: 'استفسار آخر...' }
  ];

  /* ────────── State ────────── */
  let chatBtn = null;
  let chatPanel = null;
  let isOpen = false;
  let hasPulse = false;
  let pulseTimer = null;
  let pulseRemoveTimer = null;
  let showBtnTimer = null;

  /* ═══════════════════════════════════════════
     توقيت القاهرة
     ═══════════════════════════════════════════ */
  function getCairoTime() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false
      }).formatToParts(new Date());

      const map = {};
      parts.forEach(p => { map[p.type] = p.value; });

      const dayMap = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3,
        'Thu': 4, 'Fri': 5, 'Sat': 6
      };
      const day = dayMap[map.weekday] != null ? dayMap[map.weekday] : new Date().getDay();

      let hour = parseInt(map.hour, 10);
      if (hour === 24) hour = 0;

      const minute = parseInt(map.minute, 10) || 0;

      return { day, hour, minute, totalMinutes: hour * 60 + minute };
    } catch(e) {
      const now = new Date();
      return {
        day: now.getDay(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        totalMinutes: now.getHours() * 60 + now.getMinutes()
      };
    }
  }

  function isStoreOpen() {
    const t = getCairoTime();
    const today = HOURS.schedule[t.day];
    if (!today) return false;

    const openMin = today.open * 60;
    const closeMin = today.close * 60;
    return t.totalMinutes >= openMin && t.totalMinutes < closeMin;
  }

  /* ═══════════════════════════════════════════
     بناء الزر
     ═══════════════════════════════════════════ */
  function buildButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'live-chat-btn';
    btn.setAttribute('aria-label', 'محادثة مباشرة');
    btn.setAttribute('title', 'تواصل معنا عبر واتساب');
    btn.innerHTML = `
      <ion-icon name="logo-whatsapp"></ion-icon>
      <span class="live-chat-pulse" aria-hidden="true"></span>
    `;

    btn.addEventListener('click', togglePanel);
    return btn;
  }

  /* ═══════════════════════════════════════════
     بناء اللوحة
     ═══════════════════════════════════════════ */
  function buildPanel() {
    const isOpenNow = isStoreOpen();
    const statusText = isOpenNow ? '🟢 متصل الآن' : '🔴 مغلق حالياً';
    const statusHint = isOpenNow ? 'سنجيبك في ثوانٍ' : 'سنجيبك صباحاً بإذن الله';

    const panel = document.createElement('div');
    panel.className = 'live-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'محادثة ELLOUL');
    panel.innerHTML = `
      <div class="live-chat-header">
        <div class="live-chat-avatar">
          <span>E</span>
          <i class="live-chat-status ${isOpenNow ? 'online' : 'offline'}"></i>
        </div>
        <div class="live-chat-info">
          <h4>${STORE_NAME}</h4>
          <p>${statusText} · ${statusHint}</p>
        </div>
        <button class="live-chat-close" type="button" aria-label="إغلاق">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="live-chat-body">
        <p class="live-chat-greeting">
          👋 مرحباً! كيف يمكننا مساعدتك؟
        </p>
        <div class="live-chat-quick">
          ${QUICK_MESSAGES.map(q => `
            <button class="quick-msg-btn" type="button" data-msg="${q.id}">
              <span class="quick-icon">${q.icon}</span>
              <span class="quick-text">${q.text}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="live-chat-footer">
        <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" class="live-chat-open-wa">
          <ion-icon name="logo-whatsapp"></ion-icon>
          فتح المحادثة الكاملة
        </a>
      </div>
    `;

    /* إغلاق */
    const closeBtn = panel.querySelector('.live-chat-close');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    /* رسائل سريعة */
    panel.querySelectorAll('[data-msg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.msg;
        const msg = QUICK_MESSAGES.find(m => m.id === id);
        if (!msg) return;

        if (id === 'custom') {
          sendMessage('مرحباً، لدي استفسار:');
        } else {
          sendMessage(msg.text);
        }
        closePanel();
      });
    });

    return panel;
  }

  /* ═══════════════════════════════════════════
     إرسال رسالة واتساب
     ═══════════════════════════════════════════ */
  function sendMessage(text) {
    const page = localStorage.getItem('elloul-page') || 'home';
    const cart = getCartCount();
    const context = [];

    if (cart > 0) context.push('🛒 لدي ' + cart + ' قطعة في السلة');
    if (page === 'shop') context.push('📄 (أنا في صفحة المتجر)');
    if (page === 'cart') context.push('🛒 (أنا في صفحة السلة)');

    const fullMsg = text + (context.length ? '\n\n' + context.join('\n') : '');
    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(fullMsg);

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch(e) {}
  }

  function getCartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem('elloul-cart') || '[]');
      return cart.reduce((s, i) => s + (i.qty || 0), 0);
    } catch(e) { return 0; }
  }

  /* ═══════════════════════════════════════════
     فتح/إغلاق
     ═══════════════════════════════════════════ */
  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

      function openPanel() {
    /* ✅ لا تُعِد بناء اللوحة — حدّثها إن كانت موجودة */
    if (!chatPanel) {
      chatPanel = buildPanel();
      document.body.appendChild(chatPanel);

      if (typeof window.ELLOUL_renderIcons === 'function') {
        window.ELLOUL_renderIcons(chatPanel);
      }
    } else {
      /* حدّث الحالة داخل اللوحة الموجودة */
      const isOpenNow = isStoreOpen();
      const header = chatPanel.querySelector('.live-chat-info p');
      const statusDot = chatPanel.querySelector('.live-chat-status');
      if (header) {
        header.textContent = (isOpenNow ? '🟢 متصل الآن' : '🔴 مغلق حالياً') +
                             ' · ' + (isOpenNow ? 'سنجيبك في ثوانٍ' : 'سنجيبك صباحاً بإذن الله');
      }
      if (statusDot) {
        statusDot.classList.toggle('online', isOpenNow);
        statusDot.classList.toggle('offline', !isOpenNow);
      }
    }

    requestAnimationFrame(() => {
      if (chatPanel) chatPanel.classList.add('live-chat-panel-show');
    });

    isOpen = true;
    if (chatBtn) chatBtn.classList.add('live-chat-btn-active');
  }

  function closePanel() {
    if (!chatPanel) return;
    chatPanel.classList.remove('live-chat-panel-show');
    isOpen = false;
    if (chatBtn) chatBtn.classList.remove('live-chat-btn-active');
  }

  /* ═══════════════════════════════════════════
     ESC + Click outside
     ═══════════════════════════════════════════ */
  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) closePanel();
  }

  function onDocClick(e) {
    if (!isOpen) return;
    if (chatPanel && chatPanel.contains(e.target)) return;
    if (chatBtn && chatBtn.contains(e.target)) return;
    closePanel();
  }

  /* ═══════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════ */
  function boot() {
    chatBtn = buildButton();
    document.body.appendChild(chatBtn);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(chatBtn);
    }

    /* أنيميشن أول ظهور */
    showBtnTimer = setTimeout(() => {
      showBtnTimer = null;
      if (chatBtn) chatBtn.classList.add('live-chat-btn-show');
    }, 1200);

    /* نبضة بعد 8 ثواني */
    pulseTimer = setTimeout(() => {
      pulseTimer = null;
      if (!hasPulse && !isOpen && chatBtn) {
        hasPulse = true;
        chatBtn.classList.add('live-chat-btn-pulse');
        pulseRemoveTimer = setTimeout(() => {
          pulseRemoveTimer = null;
          if (chatBtn) chatBtn.classList.remove('live-chat-btn-pulse');
        }, PULSE_DURATION_MS);
      }
    }, PULSE_DELAY_MS);

    /* ربط الأحداث */
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocClick);
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    if (showBtnTimer) { clearTimeout(showBtnTimer); showBtnTimer = null; }
    if (pulseTimer) { clearTimeout(pulseTimer); pulseTimer = null; }
    if (pulseRemoveTimer) { clearTimeout(pulseRemoveTimer); pulseRemoveTimer = null; }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('click', onDocClick);

    if (chatPanel && chatPanel.parentNode) {
      chatPanel.parentNode.removeChild(chatPanel);
      chatPanel = null;
    }
    if (chatBtn && chatBtn.parentNode) {
      chatBtn.parentNode.removeChild(chatBtn);
      chatBtn = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     Init
     ═══════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_CHAT = {
    open: openPanel,
    close: closePanel,
    isOpen: () => isOpen,
    send: sendMessage,
    storeOpen: isStoreOpen,
    cairoTime: getCairoTime
  };

  function attachToElloul() {
    if (window.elloul && !window.elloul.chat) {
      window.elloul.chat = {
        open: openPanel,
        close: closePanel,
        send: sendMessage
      };
    }
  }

  if (window.elloul) {
    attachToElloul();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(attachToElloul, 300);
    }, { once: true });
  }

})();