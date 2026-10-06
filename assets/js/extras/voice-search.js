/* ═══════════════════════════════════════════════════════════
   VOICE-SEARCH — البحث الصوتي
   v2.0 — cleanup + null checks + safe stop
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_VOICE_READY__) return;
  window.__ELLOUL_VOICE_READY__ = true;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  /* ────────── State ────────── */
  let recognition = null;
  let isListening = false;
  let pageObserver = null;
  let injectTimer = null;
  let hintTimer = null;

  /* ────────── Helpers ────────── */
  function getSearchInput() {
    return document.querySelector('[data-shop-search]');
  }

  function injectMicButton() {
    if (!SR) return;

    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    if (searchBox.querySelector('.voice-btn')) return;

    const input = getSearchInput();
    if (!input) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voice-btn';
    btn.setAttribute('aria-label', 'البحث الصوتي');
    btn.setAttribute('title', 'اضغط وتحدّث');
    btn.innerHTML = '<ion-icon name="mic-outline"></ion-icon>';
    searchBox.appendChild(btn);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(btn);
    }

    btn.addEventListener('click', toggleListening);
  }

  /* ────────── بناء Recognition ────────── */
  function buildRecognition() {
    const rec = new SR();
    rec.lang = 'ar-EG';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListening = true;
      setBtnState('listening');
      showHint('🎤 جاري الاستماع...');
    };

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const input = getSearchInput();
      if (input) {
        input.value = transcript;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (event.results[0].isFinal) {
        showHint('✅ ' + transcript);
        hideHintAfter(1200);
      }
    };

    rec.onerror = (e) => {
      isListening = false;
      setBtnState('idle');

      let msg = '❌ تعذّر البحث الصوتي';
      if (e.error === 'not-allowed') {
        msg = '❌ يرجى السماح بالوصول للميكروفون';
      } else if (e.error === 'no-speech') {
        msg = '⚠️ لم يُسمع صوت — حاول مرة أخرى';
      } else if (e.error === 'aborted') {
        return; // لا نُظهر رسالة عند الإيقاف اليدوي
      }

      showHint(msg);
      hideHintAfter(2500);
    };

    rec.onend = () => {
      isListening = false;
      setBtnState('idle');
    };

    return rec;
  }

  /* ────────── Toggle ────────── */
  function toggleListening() {
    const btn = document.querySelector('.voice-btn');
    if (!btn) return;

    if (isListening) {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
      return;
    }

    if (!recognition) {
      try {
        recognition = buildRecognition();
      } catch(e) {
        showHint('❌ متصفحك لا يدعم البحث الصوتي');
        return;
      }
    }

    try {
      recognition.start();
    } catch(e) {
      showHint('❌ تعذّر بدء البحث الصوتي');
    }
  }

  /* ────────── UI helpers ────────── */
  function setBtnState(state) {
    const btn = document.querySelector('.voice-btn');
    if (!btn) return;
    btn.classList.toggle('voice-btn-listening', state === 'listening');
  }

  function showHint(text) {
    let hint = document.querySelector('.voice-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'voice-hint';
      hint.setAttribute('role', 'status');
      hint.setAttribute('aria-live', 'polite');
      document.body.appendChild(hint);
    }
    hint.textContent = text;
    hint.classList.add('voice-hint-show');
  }

  function hideHint() {
    const hint = document.querySelector('.voice-hint');
    if (hint) hint.classList.remove('voice-hint-show');
  }

  function hideHintAfter(ms) {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hintTimer = null;
      hideHint();
    }, ms);
  }

  /* ────────── Cleanup ────────── */
  function cleanup() {
    if (pageObserver) {
      pageObserver.disconnect();
      pageObserver = null;
    }
    if (injectTimer) {
      clearTimeout(injectTimer);
      injectTimer = null;
    }
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = null;
    }

    /* أوقف الاستماع */
    if (recognition && isListening) {
      try { recognition.stop(); } catch(e) {}
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ────────── BOOT ────────── */
  function boot() {
    /* راقب فتح صفحة المتجر */
    const shopPage = document.querySelector('[data-page="shop"]');
    if (shopPage) {
      pageObserver = new MutationObserver(() => {
        if (shopPage.classList.contains('active')) {
          injectMicButton();
        }
      });
      pageObserver.observe(shopPage, { attributes: true, attributeFilter: ['class'] });
    }

    /* حاول مباشرة */
    injectTimer = setTimeout(() => {
      injectTimer = null;
      const shopPage2 = document.querySelector('[data-page="shop"]');
      if (shopPage2 && shopPage2.classList.contains('active')) {
        injectMicButton();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ────────── DEBUG API ────────── */
  window.ELLOUL_VOICE = {
    start: toggleListening,
    stop: () => { if (recognition) try { recognition.stop(); } catch(e) {} },
    isSupported: () => !!SR,
    isListening: () => isListening
  };

})();