/* ═══════════════════════════════════════════════════════════
   PERF-MONITOR — مراقبة الأداء في Console
   v2.0 — إصلاح boot مزدوج + cleanup + FPS دقيق
   ✅ يقيس FCP, LCP, CLS, TBT, TTFB (Core Web Vitals)
   ✅ يلخّص في Console بعد التحميل
   ✅ FPS Counter عند الطلب
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_PERF_READY__) return;
  window.__ELLOUL_PERF_READY__ = true;

  const IS_DEV =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '';

  /* ═══════════════════════════════════════════
     Metrics Storage
     ═══════════════════════════════════════════ */
  const metrics = {
    fcp: null,
    lcp: null,
    cls: 0,
    tbt: 0,
    ttfb: null,
    domReady: null,
    loadTime: null,
    domNodes: 0
  };

  /* ═══════════════════════════════════════════
     State
     ═══════════════════════════════════════════ */
  let booted = false;
  let reportShown = false;

  /* PerformanceObserver references (للتنظيف) */
  const observers = [];

  /* FPS state */
  let fpsLoopId = null;
  let fpsFrames = 0;
  let fpsLastTime = 0;
  let fpsMin = 60;
  let fpsMax = 0;
  let fpsSum = 0;
  let fpsCount = 0;
  let fpsEndTime = 0;

  /* ═══════════════════════════════════════════
     Metric collection
     ═══════════════════════════════════════════ */
  function collectFCP() {
    try {
      const entries = performance.getEntriesByName('first-contentful-paint');
      if (entries.length) metrics.fcp = entries[0].startTime;
    } catch(e) {}
  }

  function collectNavigation() {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav) return;
      metrics.ttfb = nav.responseStart;
      metrics.domReady = nav.domContentLoadedEventEnd - nav.startTime;
      metrics.loadTime = nav.loadEventEnd - nav.startTime;
    } catch(e) {}
  }

  function countNodes() {
    try {
      metrics.domNodes = document.querySelectorAll('*').length;
    } catch(e) {
      metrics.domNodes = 0;
    }
  }

  /* ═══════════════════════════════════════════
     Observers
     ═══════════════════════════════════════════ */
  function createObserver(type, callback) {
    if (!('PerformanceObserver' in window)) return null;
    try {
      const obs = new PerformanceObserver(callback);
      obs.observe({ type, buffered: true });
      observers.push(obs);
      return obs;
    } catch(e) {
      return null;
    }
  }

  function initObservers() {
    /* LCP */
    createObserver('largest-contentful-paint', (list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) metrics.lcp = last.startTime;
    });

    /* CLS */
    createObserver('layout-shift', (list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          metrics.cls += entry.value;
        }
      });
    });

    /* TBT (تقريبي من longtasks) */
    createObserver('longtask', (list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          metrics.tbt += entry.duration - 50;
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     Rating
     ═══════════════════════════════════════════ */
  function rate(metric, value) {
    const limits = {
      fcp:  [1800, 3000],
      lcp:  [2500, 4000],
      cls:  [0.1, 0.25],
      tbt:  [200, 600],
      ttfb: [800, 1800]
    };
    if (!limits[metric] || value == null) return '—';
    if (value <= limits[metric][0]) return '🟢 ممتاز';
    if (value <= limits[metric][1]) return '🟡 جيد';
    return '🔴 يحتاج تحسين';
  }

  /* ═══════════════════════════════════════════
     FPS Counter
     ═══════════════════════════════════════════ */
  function startFPS(duration) {
    if (fpsLoopId) {
      console.log('%c⚠️ FPS Counter يعمل بالفعل', 'color:#f59e0b; font-weight:bold;');
      return;
    }

    const ms = Math.max(2000, Math.min(60000, parseInt(duration, 10) || 5000));
    fpsEndTime = performance.now() + ms;

    /* إعادة تعيين */
    fpsFrames = 0;
    fpsLastTime = performance.now();
    fpsMin = 60;
    fpsMax = 0;
    fpsSum = 0;
    fpsCount = 0;

    console.log(
      '%c📊 FPS Counter بدأ لـ ' + (ms / 1000) + ' ثانية...',
      'color:#3b82f6; font-weight:bold; padding:6px 0;'
    );

    function loop(now) {
      /* تجاهل عندما يكون التاب مخفياً */
      if (document.hidden) {
        fpsLastTime = now;
        fpsFrames = 0;
        if (now < fpsEndTime) fpsLoopId = requestAnimationFrame(loop);
        else finishFPS();
        return;
      }

      fpsFrames++;
      const delta = now - fpsLastTime;

      if (delta >= 1000) {
        const fps = Math.round((fpsFrames * 1000) / delta);
        fpsSum += fps;
        fpsCount++;
        if (fps < fpsMin) fpsMin = fps;
        if (fps > fpsMax) fpsMax = fps;

        const color = fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444';
        console.log(
          '%c  FPS: ' + fps,
          'color:' + color + '; font-family:monospace; font-size:13px; font-weight:bold;'
        );

        fpsFrames = 0;
        fpsLastTime = now;
      }

      if (now < fpsEndTime) {
        fpsLoopId = requestAnimationFrame(loop);
      } else {
        finishFPS();
      }
    }

    fpsLoopId = requestAnimationFrame(loop);
  }

  function finishFPS() {
    if (fpsLoopId) {
      cancelAnimationFrame(fpsLoopId);
      fpsLoopId = null;
    }

    const avg = fpsCount > 0 ? Math.round(fpsSum / fpsCount) : 0;

    console.log(
      '%c✅ ملخص FPS: متوسط ' + avg + ' — أدنى ' + fpsMin + ' — أعلى ' + fpsMax,
      'color:#3b82f6; font-weight:bold; background:#0a1229; padding:6px 12px; border-radius:6px;'
    );
  }

  function stopFPS() {
    if (fpsLoopId) {
      cancelAnimationFrame(fpsLoopId);
      fpsLoopId = null;
      console.log('%c⏹️ تم إيقاف FPS', 'color:#94a3b8;');
    }
  }

  /* ═══════════════════════════════════════════
     Report
     ═══════════════════════════════════════════ */
  function report() {
    /* ✅ حدّث كل القيم */
    collectFCP();
    collectNavigation();
    countNodes();

    console.log('');
    console.log(
      '%c⚡ ELLOUL — تقرير الأداء',
      'color:#60a5fa; font-size:16px; font-weight:900; padding:6px 0;'
    );
    console.log('%c' + '━'.repeat(60), 'color:#1e3a8a;');

    const data = {
      'FCP': {
        value: metrics.fcp ? Math.round(metrics.fcp) + 'ms' : '—',
        rate: rate('fcp', metrics.fcp)
      },
      'LCP': {
        value: metrics.lcp ? Math.round(metrics.lcp) + 'ms' : '—',
        rate: rate('lcp', metrics.lcp)
      },
      'CLS': {
        value: metrics.cls.toFixed(3),
        rate: rate('cls', metrics.cls)
      },
      'TBT (تقريبي)': {
        value: Math.round(metrics.tbt) + 'ms',
        rate: rate('tbt', metrics.tbt)
      },
      'TTFB': {
        value: metrics.ttfb ? Math.round(metrics.ttfb) + 'ms' : '—',
        rate: rate('ttfb', metrics.ttfb)
      },
      'DOM Ready': {
        value: metrics.domReady ? Math.round(metrics.domReady) + 'ms' : '—',
        rate: '—'
      },
      'Load': {
        value: metrics.loadTime ? Math.round(metrics.loadTime) + 'ms' : '—',
        rate: '—'
      },
      'DOM Nodes': {
        value: metrics.domNodes,
        rate: metrics.domNodes < 1500 ? '🟢 ممتاز'
             : metrics.domNodes < 3000 ? '🟡 جيد'
             : '🔴 كثير'
      }
    };

    /* console.table بـ fallback */
    try {
      console.table(data);
    } catch(e) {
      /* fallback للحيوانات القديمة */
      Object.keys(data).forEach(key => {
        console.log('%c  ' + key + ':', 'color:#94a3b8;', data[key].value, data[key].rate);
      });
    }

    console.log(
      '%c  💡 اكتب  %celloul.perf.fps()  %cلقياس FPS',
      'color:#94a3b8; font-size:11px;',
      'background:#f59e0b; color:#0a0f1a; font-family:monospace; padding:2px 8px; border-radius:4px; font-weight:bold;',
      'color:#94a3b8; font-size:11px;'
    );
    console.log('%c' + '━'.repeat(60), 'color:#1e3a8a;');
  }

  /* ═══════════════════════════════════════════
     Cleanup
     ═══════════════════════════════════════════ */
  function cleanup() {
    /* أوقف FPS */
    if (fpsLoopId) {
      cancelAnimationFrame(fpsLoopId);
      fpsLoopId = null;
    }

    /* افصل observers */
    observers.forEach(obs => {
      try { obs.disconnect(); } catch(e) {}
    });
    observers.length = 0;
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  /* ═══════════════════════════════════════════
     Boot (مع حماية من التكرار)
     ═══════════════════════════════════════════ */
  function boot() {
    if (booted) return;
    booted = true;

    initObservers();

    /* أظهر التقرير بعد load بـ 1.5s */
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!reportShown) {
          reportShown = true;
          report();
        }
      }, 1500);
    }, { once: true });
  }

  if (document.readyState === 'complete') {
    boot();
  } else if (document.readyState === 'interactive') {
    /* DOM ready لكن load لم يكتمل */
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  }

  /* ═══════════════════════════════════════════
     DEBUG API
     ═══════════════════════════════════════════ */
  window.ELLOUL_PERF = {
    report,
    fps: startFPS,
    stopFps: stopFPS,
    metrics: () => ({ ...metrics }),
    reset: () => {
      metrics.fcp = null;
      metrics.lcp = null;
      metrics.cls = 0;
      metrics.tbt = 0;
      metrics.ttfb = null;
      metrics.domReady = null;
      metrics.loadTime = null;
      metrics.domNodes = 0;
      reportShown = false;
      console.log('%c🔄 تم إعادة تعيين القياسات', 'color:#10b981;');
    },
    isRunning: () => ({
      observers: observers.length,
      fps: !!fpsLoopId
    })
  };

  /* إضافة على elloul */
  if (window.elloul) {
    window.elloul.perf = window.ELLOUL_PERF;
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.elloul && !window.elloul.perf) {
          window.elloul.perf = window.ELLOUL_PERF;
        }
      }, 300);
    }, { once: true });
  }

})();