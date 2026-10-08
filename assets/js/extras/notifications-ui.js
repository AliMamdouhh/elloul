/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS UI v1.0 — Settings Bottom Sheet
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function () {

  if (window.__ELLOUL_NOTIF_UI__) return;
  window.__ELLOUL_NOTIF_UI__ = true;

  var sheet = null;
  var opened = false;

  /* ═══ SVG Icons ═══ */
  var ICONS = {
    bell:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    tag:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 2-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
    cart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    down:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
    box:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    truck:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    moon:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    clock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    vibrate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="18" x="8" y="3" rx="2"/><path d="M4 7v10"/><path d="M20 7v10"/></svg>',
    check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    test:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m19 5-1.5 1.5"/><circle cx="12" cy="12" r="5"/><path d="M12 22v-2"/><path d="m5 19 1.5-1.5"/><path d="M2 12h2"/><path d="M22 12h-2"/><path d="m5 5 1.5 1.5"/></svg>',
    trash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  /* ═══ i18n fallback ═══ */
  function t(k, fb) {
    try {
      var d = window.I18N && window.I18N.current && window.I18N.current();
      return (d && d[k]) || fb || k;
    } catch (e) { return fb || k; }
  }

  /* ═══ Build UI ═══ */
  function buildSheet() {
    if (sheet) return sheet;

    var prefs = window.ELLOUL_NOTIF.prefs.get();
    var perm = window.ELLOUL_NOTIF.permission();

    sheet = document.createElement('div');
    sheet.className = 'notif-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'notifSheetTitle');

    sheet.innerHTML =
      '<div class="notif-sheet-backdrop" data-notif-close></div>' +
      '<div class="notif-sheet-body">' +

        '<div class="notif-sheet-handle" aria-hidden="true"></div>' +

        '<header class="notif-sheet-head">' +
          '<div class="notif-sheet-title">' +
            '<span class="notif-sheet-icon">' + ICONS.bell + '</span>' +
            '<div>' +
              '<h2 id="notifSheetTitle">' + t('notifTitle', 'الإشعارات') + '</h2>' +
              '<p class="notif-sheet-sub" id="notifPermStatus">' + permLabel(perm) + '</p>' +
            '</div>' +
          '</div>' +
          '<button class="notif-sheet-close" data-notif-close type="button" aria-label="' + t('close', 'إغلاق') + '">' + ICONS.close + '</button>' +
        '</header>' +

        '<div class="notif-sheet-scroll">' +

          /* ── Permission block ── */
          '<div class="notif-block" id="notifPermBlock" hidden>' +
            '<div class="notif-perm-ask">' +
              '<p>' + t('notifPermAsk', 'فعّل الإشعارات لتصلك العروض أول بأول') + '</p>' +
              '<button class="notif-btn primary" id="notifEnableBtn" type="button">' +
                ICONS.bell + '<span>' + t('notifEnable', 'تفعيل الآن') + '</span>' +
              '</button>' +
            '</div>' +
          '</div>' +

          /* ── Preview ── */
          '<div class="notif-block" id="notifPreviewBlock" hidden>' +
            '<h3 class="notif-block-title">' + t('notifPreviewTitle', 'معاينة الإشعار') + '</h3>' +
            '<div class="notif-preview" id="notifPreview">' +
              '<img class="notif-preview-icon" src="./assets/icons/icon-192x192.png" alt="">' +
              '<div class="notif-preview-content">' +
                '<div class="notif-preview-title">🎁 تك، تك! هدايا قد وصلت</div>' +
                '<div class="notif-preview-body">حظك جديد! 🍀 شوف العرض الجديد</div>' +
              '</div>' +
              '<img class="notif-preview-badge" src="./assets/icons/icon-96x96.png" alt="">' +
            '</div>' +
            '<button class="notif-btn ghost small" id="notifTestBtn" type="button">' +
              ICONS.test + '<span>' + t('notifTest', 'إرسال إشعار تجريبي') + '</span>' +
            '</button>' +
          '</div>' +

          /* ── Master toggle ── */
          '<div class="notif-block">' +
            '<label class="notif-toggle-row">' +
              '<div class="notif-toggle-info">' +
                '<div class="notif-toggle-label">' + t('notifEnabled', 'تفعيل الإشعارات') + '</div>' +
                '<div class="notif-toggle-hint">' + t('notifEnabledHint', 'التحكم الكامل في كل الإشعارات') + '</div>' +
              '</div>' +
              '<span class="notif-switch">' +
                '<input type="checkbox" id="notifMaster" ' + (prefs.enabled ? 'checked' : '') + '>' +
                '<span class="notif-switch-track"><span class="notif-switch-thumb">' + ICONS.check + '</span></span>' +
              '</span>' +
            '</label>' +
          '</div>' +

          /* ── Categories ── */
          '<div class="notif-block">' +
            '<h3 class="notif-block-title">' + t('notifCategories', 'أنواع الإشعارات') + '</h3>' +
            '<div class="notif-cats">' +
              catRow('offers',     ICONS.tag,     t('catOffers', 'العروض والخصومات'), t('catOffersHint', 'خصومات موسمية وعروض حصرية'), prefs) +
              catRow('newProducts',ICONS.sparkle, t('catNew',    'منتجات جديدة'),      t('catNewHint',    'أول من يعرف بالجديد'),       prefs) +
              catRow('cart',       ICONS.cart,    t('catCart',   'تذكير بالسلة'),      t('catCartHint',   'لا تفقد منتجاتك المحفوظة'),  prefs) +
              catRow('orderUpdate',ICONS.truck,   t('catOrder',  'تحديثات الطلب'),     t('catOrderHint',  'حالة طلبك لحظة بلحظة'),    prefs) +
              catRow('priceDrop',  ICONS.down,    t('catPrice',  'انخفاض السعر'),      t('catPriceHint',  'عند نزول سعر منتج شاهدته'),   prefs) +
              catRow('restock',    ICONS.box,     t('catRestock',t('Restock', 'عودة المخزون')), t('catRestockHint', 'عند عودة منتج نفد'), prefs) +
            '</div>' +
          '</div>' +

          /* ── Quiet hours ── */
          '<div class="notif-block">' +
            '<label class="notif-toggle-row">' +
              '<div class="notif-toggle-info">' +
                '<div class="notif-toggle-label">' + ICONS.moon + ' ' + t('notifQuiet', 'وضع الهدوء') + '</div>' +
                '<div class="notif-toggle-hint">' + t('notifQuietHint', 'لا إشعارات في وقت النوم') + '</div>' +
              '</div>' +
              '<span class="notif-switch">' +
                '<input type="checkbox" id="notifQuiet" ' + (prefs.quietHours.enabled ? 'checked' : '') + '>' +
                '<span class="notif-switch-track"><span class="notif-switch-thumb">' + ICONS.check + '</span></span>' +
              '</span>' +
            '</label>' +
            '<div class="notif-quiet-times" id="notifQuietTimes" ' + (prefs.quietHours.enabled ? '' : 'hidden') + '>' +
              '<div class="notif-time-field">' +
                '<label>' + t('notifFrom', 'من') + '</label>' +
                '<select id="notifQuietFrom">' + hoursOptions(prefs.quietHours.from) + '</select>' +
              '</div>' +
              '<div class="notif-time-field">' +
                '<label>' + t('notifTo', 'إلى') + '</label>' +
                '<select id="notifQuietTo">' + hoursOptions(prefs.quietHours.to) + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* ── Interval ── */
          '<div class="notif-block">' +
            '<h3 class="notif-block-title">' + ICONS.clock + ' ' + t('notifInterval', 'معدّل الإشعارات') + '</h3>' +
            '<div class="notif-interval-options">' +
              intervalBtn(1,  t('int1h', 'كل ساعة'),    prefs.minInterval) +
              intervalBtn(6,  t('int6h', 'كل 6 ساعات'), prefs.minInterval) +
              intervalBtn(24, t('int24h','يومياً'),     prefs.minInterval) +
              intervalBtn(72, t('int3d', 'كل 3 أيام'),  prefs.minInterval) +
            '</div>' +
          '</div>' +

          /* ── Sound + Vibration ── */
          '<div class="notif-block">' +
            '<label class="notif-toggle-row">' +
              '<div class="notif-toggle-info">' +
                '<div class="notif-toggle-label">' + ICONS.volume + ' ' + t('notifSound', 'الصوت') + '</div>' +
              '</div>' +
              '<span class="notif-switch">' +
                '<input type="checkbox" id="notifSound" ' + (prefs.sound !== false ? 'checked' : '') + '>' +
                '<span class="notif-switch-track"><span class="notif-switch-thumb">' + ICONS.check + '</span></span>' +
              '</span>' +
            '</label>' +
            '<label class="notif-toggle-row">' +
              '<div class="notif-toggle-info">' +
                '<div class="notif-toggle-label">' + ICONS.vibrate + ' ' + t('notifVibrate', 'الاهتزاز') + '</div>' +
              '</div>' +
              '<span class="notif-switch">' +
                '<input type="checkbox" id="notifVibrate" ' + (prefs.vibration !== false ? 'checked' : '') + '>' +
                '<span class="notif-switch-track"><span class="notif-switch-thumb">' + ICONS.check + '</span></span>' +
              '</span>' +
            '</label>' +
          '</div>' +

          /* ── History ── */
          '<div class="notif-block" id="notifHistoryBlock" hidden>' +
            '<div class="notif-block-head">' +
              '<h3 class="notif-block-title">' + t('notifHistory', 'آخر الإشعارات') + '</h3>' +
              '<button class="notif-link danger" id="notifClearHistory" type="button">' + t('notifClear', 'مسح الكل') + '</button>' +
            '</div>' +
            '<div class="notif-history" id="notifHistoryList"></div>' +
          '</div>' +

        '</div>' +

        '<footer class="notif-sheet-footer">' +
          '<p class="notif-hint-text">' + t('notifHint', 'يمكنك الرجوع لأي وقت من الإعدادات') + '</p>' +
        '</footer>' +

      '</div>';

    document.body.appendChild(sheet);
    wireEvents();
    updateUI();
    return sheet;
  }

  function catRow(key, icon, label, hint, prefs) {
    var checked = prefs.categories[key] ? 'checked' : '';
    return '<label class="notif-toggle-row compact">' +
      '<div class="notif-cat-icon">' + icon + '</div>' +
      '<div class="notif-toggle-info">' +
        '<div class="notif-toggle-label">' + label + '</div>' +
        '<div class="notif-toggle-hint">' + hint + '</div>' +
      '</div>' +
      '<span class="notif-switch">' +
        '<input type="checkbox" data-cat="' + key + '" ' + checked + '>' +
        '<span class="notif-switch-track"><span class="notif-switch-thumb">' + ICONS.check + '</span></span>' +
      '</span>' +
    '</label>';
  }

  function intervalBtn(hours, label, current) {
    var active = current === hours ? 'active' : '';
    return '<button type="button" class="notif-interval-btn ' + active + '" data-interval="' + hours + '">' + label + '</button>';
  }

  function hoursOptions(sel) {
    var out = '';
    for (var h = 0; h < 24; h++) {
      var label = (h < 10 ? '0' : '') + h + ':00';
      out += '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' + label + '</option>';
    }
    return out;
  }

  function permLabel(perm) {
    if (perm === 'granted')    return t('notifPermGranted', 'مفعّلة ✓');
    if (perm === 'denied')     return t('notifPermDenied', 'معطّلة');
    if (perm === 'unsupported')return t('notifPermUnsupported', 'غير مدعومة');
    return t('notifPermDefault', 'لم تُفعَّل بعد');
  }

  /* ═══ Events ═══ */
  function wireEvents() {
    sheet.addEventListener('click', function (e) {
      var target = e.target;
      if (target.closest('[data-notif-close]')) { close(); return; }
    });

    /* Master */
    var master = sheet.querySelector('#notifMaster');
    master && master.addEventListener('change', function () {
      var prefs = window.ELLOUL_NOTIF.prefs.set({ enabled: master.checked });
      updateUI(prefs);
      if (master.checked && window.ELLOUL_NOTIF.permission() === 'default') {
        window.ELLOUL_NOTIF.ask();
      }
    });

    /* Enable button */
    var enableBtn = sheet.querySelector('#notifEnableBtn');
    enableBtn && enableBtn.addEventListener('click', function () {
      window.ELLOUL_NOTIF.request();
    });

    /* Test button */
    var testBtn = sheet.querySelector('#notifTestBtn');
    testBtn && testBtn.addEventListener('click', function () {
      if (window.ELLOUL_NOTIF.permission() !== 'granted') {
        window.ELLOUL_NOTIF.ask();
        return;
      }
      window.ELLOUL_NOTIF.testRich();
    });

    /* Categories */
    sheet.querySelectorAll('input[data-cat]').forEach(function (input) {
      input.addEventListener('change', function () {
        var cat = input.getAttribute('data-cat');
        var patch = { categories: {} };
        patch.categories[cat] = input.checked;
        var prefs = window.ELLOUL_NOTIF.prefs.set(patch);
        updateUI(prefs);
      });
    });

    /* Quiet */
    var quiet = sheet.querySelector('#notifQuiet');
    quiet && quiet.addEventListener('change', function () {
      var prefs = window.ELLOUL_NOTIF.prefs.set({ quietHours: { enabled: quiet.checked } });
      updateUI(prefs);
    });

    /* Quiet selects */
    var qf = sheet.querySelector('#notifQuietFrom');
    var qt = sheet.querySelector('#notifQuietTo');
    qf && qf.addEventListener('change', function () {
      window.ELLOUL_NOTIF.prefs.set({ quietHours: { from: parseInt(qf.value, 10) } });
    });
    qt && qt.addEventListener('change', function () {
      window.ELLOUL_NOTIF.prefs.set({ quietHours: { to: parseInt(qt.value, 10) } });
    });

    /* Interval */
    sheet.querySelectorAll('.notif-interval-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var h = parseInt(btn.getAttribute('data-interval'), 10);
        var prefs = window.ELLOUL_NOTIF.prefs.set({ minInterval: h });
        updateUI(prefs);
      });
    });

    /* Sound */
    var sound = sheet.querySelector('#notifSound');
    sound && sound.addEventListener('change', function () {
      window.ELLOUL_NOTIF.prefs.set({ sound: sound.checked });
    });

    /* Vibrate */
    var vib = sheet.querySelector('#notifVibrate');
    vib && vib.addEventListener('change', function () {
      window.ELLOUL_NOTIF.prefs.set({ vibration: vib.checked });
    });

    /* Clear history */
    var clearHist = sheet.querySelector('#notifClearHistory');
    clearHist && clearHist.addEventListener('click', function () {
      window.ELLOUL_NOTIF.history.clear();
      renderHistory();
    });

    /* listen to pref changes */
    window.addEventListener('elloul:notif-prefs-changed', function (e) {
      if (opened) updateUI(e.detail);
    });
    window.addEventListener('elloul:notif-history-changed', function () {
      if (opened) renderHistory();
    });
    window.addEventListener('elloul:notif-permission', function () {
      if (opened) updateUI();
    });

    /* Esc key */
    document.addEventListener('keydown', function (e) {
      if (opened && e.key === 'Escape') close();
    });
  }

  /* ═══ UI Update ═══ */
  function updateUI(prefs) {
    if (!sheet) return;
    prefs = prefs || window.ELLOUL_NOTIF.prefs.get();
    var perm = window.ELLOUL_NOTIF.permission();

    /* master toggle */
    var master = sheet.querySelector('#notifMaster');
    if (master) master.checked = prefs.enabled;

    /* perm block visibility */
    var permBlock = sheet.querySelector('#notifPermBlock');
    var previewBlock = sheet.querySelector('#notifPreviewBlock');
    var histBlock = sheet.querySelector('#notifHistoryBlock');

    if (perm === 'granted') {
      permBlock.hidden = true;
      previewBlock.hidden = false;
      histBlock.hidden = false;
    } else if (perm === 'default') {
      permBlock.hidden = false;
      previewBlock.hidden = true;
      histBlock.hidden = true;
    } else {
      permBlock.hidden = true;
      previewBlock.hidden = true;
      histBlock.hidden = true;
    }

    /* status text */
    var statusEl = sheet.querySelector('#notifPermStatus');
    if (statusEl) statusEl.textContent = permLabel(perm);

    /* categories */
    sheet.querySelectorAll('input[data-cat]').forEach(function (input) {
      var cat = input.getAttribute('data-cat');
      input.checked = !!prefs.categories[cat];
    });

    /* quiet */
    var quiet = sheet.querySelector('#notifQuiet');
    if (quiet) quiet.checked = prefs.quietHours.enabled;
    var qtimes = sheet.querySelector('#notifQuietTimes');
    if (qtimes) qtimes.hidden = !prefs.quietHours.enabled;
    var qf = sheet.querySelector('#notifQuietFrom');
    var qt = sheet.querySelector('#notifQuietTo');
    if (qf) qf.value = prefs.quietHours.from;
    if (qt) qt.value = prefs.quietHours.to;

    /* interval */
    sheet.querySelectorAll('.notif-interval-btn').forEach(function (btn) {
      var h = parseInt(btn.getAttribute('data-interval'), 10);
      btn.classList.toggle('active', h === prefs.minInterval);
    });

    /* sound + vib */
    var sound = sheet.querySelector('#notifSound');
    if (sound) sound.checked = prefs.sound !== false;
    var vib = sheet.querySelector('#notifVibrate');
    if (vib) vib.checked = prefs.vibration !== false;

    renderHistory();
  }

  function renderHistory() {
    if (!sheet) return;
    var list = sheet.querySelector('#notifHistoryList');
    if (!list) return;
    var hist = window.ELLOUL_NOTIF.history.get();

    if (!hist.length) {
      list.innerHTML = '<div class="notif-empty">' + t('notifNoHistory', 'لا يوجد سجل بعد') + '</div>';
      return;
    }

    list.innerHTML = hist.slice(0, 10).map(function (item) {
      var d = new Date(item.ts);
      var time = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      return '<div class="notif-history-item">' +
        '<div class="notif-history-time">' + time + '</div>' +
        '<div class="notif-history-content">' +
          '<div class="notif-history-title">' + escapeHtml(item.title || '') + '</div>' +
          '<div class="notif-history-body">' + escapeHtml(item.body || '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ═══ Open / Close ═══ */
  function open() {
    buildSheet();
    opened = true;
    document.body.classList.add('notif-sheet-open');
    requestAnimationFrame(function () { sheet.classList.add('show'); });
    updateUI();
    renderHistory();
    /* if permission default, show quick ask */
    if (window.ELLOUL_NOTIF.permission() === 'default') {
      setTimeout(function () {
        var enableBtn = sheet.querySelector('#notifEnableBtn');
        if (enableBtn) enableBtn.focus();
      }, 400);
    }
  }

  function close() {
    if (!sheet) return;
    opened = false;
    sheet.classList.remove('show');
    document.body.classList.remove('notif-sheet-open');
    setTimeout(function () {
      if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
      sheet = null;
    }, 350);
  }

  function toggle() {
    if (opened) close(); else open();
  }

  /* ═══ Floating Trigger Button ═══ */
  function addTrigger() {
    /* only add if not already in DOM */
    if (document.querySelector('.notif-trigger')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'notif-trigger';
    btn.setAttribute('aria-label', t('notifTitle', 'الإشعارات'));
    btn.innerHTML = ICONS.bell + '<span class="notif-trigger-badge" hidden></span>';

    /* position: bottom-left (RTL is opposite) */
    btn.addEventListener('click', open);

    document.body.appendChild(btn);
  }

  function updateBadge() {
    var badge = document.querySelector('.notif-trigger-badge');
    if (!badge) return;
    var perm = window.ELLOUL_NOTIF.permission();
    if (perm === 'default') {
      badge.hidden = false;
      badge.classList.add('pulse');
    } else {
      badge.hidden = true;
    }
  }

  /* ═══ Boot ═══ */
  function boot() {
    if (!window.ELLOUL_NOTIF) return;
    addTrigger();
    updateBadge();
    /* update badge on permission change */
    window.addEventListener('elloul:notif-permission', updateBadge);
    window.addEventListener('elloul:notif-prefs-changed', updateBadge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    setTimeout(boot, 500);
  }

  /* ═══ Public ═══ */
  window.ELLOUL_NOTIF_UI = {
    open: open,
    close: close,
    toggle: toggle
  };

})();