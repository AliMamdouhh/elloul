/* ═══════════════════════════════════════════════════════════
   SHARE-MENU — مشاركة شاملة + QR Code
   v3.0 — QR محلي (بدون API خارجي) + offline support
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_SHARE_READY__) return;
  window.__ELLOUL_SHARE_READY__ = true;

  const SITE_URL = 'https://elloul.store';
  const SITE_TITLE = 'ELLOUL — متجر أدوات المائدة الفاخرة';
  const SITE_DESC = 'تشكيلة مختارة من الملاعق والشوك والسكاكين والأطقم الكاملة';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function showToast(msg, type) {
    const stack = document.querySelector('#toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : ' success');
    const icon = type === 'error' ? 'alert-circle-outline' : 'checkmark-circle';
    el.innerHTML = '<ion-icon name="' + icon + '"></ion-icon><span>' + msg + '</span>';
    stack.appendChild(el);
    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(el);
    }
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  function safeOpen(url) {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        showToast('❌ الرجاء السماح بالنوافذ المنبثقة', 'error');
        return false;
      }
      return true;
    } catch(e) {
      showToast('❌ تعذّر فتح الرابط', 'error');
      return false;
    }
  }

  async function share(title, text, url) {
    const data = {
      title: title || SITE_TITLE,
      text: text || SITE_DESC,
      url: url || SITE_URL
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        return 'shared';
      } catch(e) {
        if (e.name === 'AbortError') return 'cancelled';
        console.warn('[Share] Web Share failed:', e.message);
      }
    }

    const copied = await copyUrl(data.url);
    if (copied) {
      showToast('✅ تم نسخ الرابط');
      return 'copied';
    }
    return 'error';
  }

  async function copyUrl(url) {
    const finalUrl = url || location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(finalUrl);
        return true;
      } catch(e) {}
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = finalUrl;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, 99999);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (!ok) showToast('❌ تعذّر النسخ', 'error');
      return ok;
    } catch(e) {
      showToast('❌ تعذّر النسخ', 'error');
      return false;
    }
  }

  function openShareMenu(url, title) {
    const finalUrl = url || location.href;
    const finalTitle = title || SITE_TITLE;
    const encodedUrl = encodeURIComponent(finalUrl);
    const encodedTitle = encodeURIComponent(finalTitle);

    const options = [
      { id: 'native',   icon: '📤', label: 'مشاركة...',    action: () => share(finalTitle, SITE_DESC, finalUrl) },
      { id: 'whatsapp', icon: '💚', label: 'واتساب',       action: () => safeOpen('https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl) },
      { id: 'facebook', icon: '📘', label: 'فيسبوك',       action: () => safeOpen('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl) },
      { id: 'twitter',  icon: '🐦', label: 'تويتر / X',    action: () => safeOpen('https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl) },
      { id: 'telegram', icon: '✈️', label: 'تيليجرام',     action: () => safeOpen('https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedTitle) },
      { id: 'copy',     icon: '📋', label: 'نسخ الرابط',   action: async () => { const ok = await copyUrl(finalUrl); if (ok) showToast('📋 تم نسخ الرابط'); } },
      { id: 'qr',       icon: '🔳', label: 'رمز QR',       action: () => showQR(finalUrl) }
    ];

    const filtered = navigator.share ? options : options.filter(o => o.id !== 'native');

    if (typeof Swal === 'undefined') {
      console.log('%c🔗 خيارات المشاركة:', 'color:#60a5fa; font-weight:bold;');
      filtered.forEach((opt, i) => console.log((i + 1) + '. ' + opt.label));
      return;
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const html = `
      <div class="share-menu-list">
        ${filtered.map(o => `
          <button type="button" class="share-menu-item" data-share="${escapeHTML(o.id)}">
            <span class="share-menu-icon">${escapeHTML(o.icon)}</span>
            <span class="share-menu-label">${escapeHTML(o.label)}</span>
          </button>
        `).join('')}
      </div>
    `;

    let escHandler = null;

    Swal.fire({
      title: '🔗 مشاركة',
      html: html,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: 'swal-share-modal' },
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8',
      didOpen: (popup) => {
        popup.querySelectorAll('[data-share]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.share;
            const opt = filtered.find(o => o.id === id);
            if (!opt) return;
            Swal.close();
            setTimeout(() => {
              try { opt.action(); } catch(err) {
                console.warn('[Share] action failed:', err);
              }
            }, 150);
          });
        });

        escHandler = (e) => {
          if (e.key === 'Escape') Swal.close();
        };
        document.addEventListener('keydown', escHandler);
      },
      willClose: () => {
        if (escHandler) {
          document.removeEventListener('keydown', escHandler);
          escHandler = null;
        }
      }
    });
  }

  /* ═══════════════════════════════════════════
     ✅ QR — يستخدم المكتبة المحلية
     ═══════════════════════════════════════════ */
  function showQR(url) {
    const finalUrl = url || location.href;
    if (typeof Swal === 'undefined') return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const qrData = generateQR(finalUrl);

    if (!qrData) {
      Swal.fire({
        title: '🔳 رمز QR',
        html: `
          <div style="padding:20px 10px;">
            <div style="font-size:48px; margin-bottom:16px;">📡</div>
            <p style="line-height:1.8;font-size:14px;color:#f59e0b;">
              <strong>تعذّر توليد QR</strong><br>يمكنك نسخ الرابط يدوياً
            </p>
            <code style="background:rgba(59,130,246,0.15);color:#60a5fa;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;display:block;margin-top:8px;word-break:break-all;">
              ${escapeHTML(finalUrl)}
            </code>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'نسخ الرابط',
        confirmButtonColor: '#3b82f6',
        showCloseButton: true,
        background: isLight ? '#ffffff' : '#181c24',
        color: isLight ? '#0a0f1a' : '#f2f5f8'
      }).then((res) => {
        if (res.isConfirmed) {
          copyUrl(finalUrl).then(ok => { if (ok) showToast('📋 تم نسخ الرابط'); });
        }
      });
      return;
    }

    Swal.fire({
      title: '🔳 رمز QR',
      html: `
        <p style="font-size:12.5px;color:#94a3b8;margin-bottom:14px;line-height:1.7;">
          امسح الرمز بكاميرا جوالك<br>لفتح الرابط مباشرة
        </p>
        <div style="display:flex;justify-content:center;padding:16px;background:#fff;border-radius:14px;max-width:280px;margin:0 auto;">
          <img src="${qrData}" alt="QR Code" style="width:100%;height:auto;display:block;"
               onerror="this.parentElement.innerHTML='<p style=\\'color:#ef4444;text-align:center;\\'>تعذّر تحميل الرمز</p>'">
        </div>
        <p style="font-size:11px;color:#64748b;margin-top:12px;word-break:break-all;">
          ${escapeHTML(finalUrl)}
        </p>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      background: isLight ? '#ffffff' : '#181c24',
      color: isLight ? '#0a0f1a' : '#f2f5f8'
    });
  }

  /* ═══════════════════════════════════════════
     ✅ توليد QR — المكتبة المحلية أولاً
     ═══════════════════════════════════════════ */
  function generateQR(text) {
    if (!text || typeof text !== 'string') return null;

    /* المحاولة الأولى: المكتبة المحلية */
    if (typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createDataURL(6, 12); /* حجم أكبر للعرض */
      } catch(e) {
        console.warn('[Share] QR local generation failed:', e);
      }
    }

    /* Fallback: API خارجي */
    try {
      const size = 280;
      return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
    } catch(e) { return null; }
  }

  function boot() {
    if (window.elloul) {
      window.elloul.share = window.ELLOUL_SHARE;
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (window.elloul && !window.elloul.share) {
            window.elloul.share = window.ELLOUL_SHARE;
          }
        }, 300);
      }, { once: true });
    }
  }

  window.ELLOUL_SHARE = {
    open: openShareMenu,
    current: () => share(SITE_TITLE, SITE_DESC, location.href),
    copy: copyUrl,
    qr: showQR,
    url: SITE_URL,
    supported: {
      webShare: !!navigator.share,
      clipboard: !!(navigator.clipboard && navigator.clipboard.writeText)
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();