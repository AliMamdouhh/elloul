/* ═══════════════════════════════════════════════════════════
   PRINT-RECEIPT — طباعة الفاتورة
   v3.0 — QR محلي (بدون API خارجي) + offline support
   ═══════════════════════════════════════════════════════════ */
'use strict';
(function() {

  if (window.__ELLOUL_PRINT_READY__) return;
  window.__ELLOUL_PRINT_READY__ = true;

  const STORE = {
    name: 'ELLOUL',
    tagline: 'متجر أدوات المائدة الفاخرة',
    phone: '+20 120 679 6831',
    email: 'orders@elloul.store',
    address: 'أبيس الأولى، الإسكندرية — مصر',
    website: 'https://elloul.store',
    footer: 'شكراً لتسوقك معنا 💙'
  };

  const PRICE_CACHE = 'elloul-price-cache';

  let cartObserver = null;
  let injectTimer = null;

  /* ────────── قراءة السلة ────────── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem('elloul-cart') || '[]'); }
    catch(e) { return []; }
  }

  function getPriceFromCache(id) {
    try {
      const cache = JSON.parse(localStorage.getItem(PRICE_CACHE) || '{}');
      return cache[id] || 0;
    } catch(e) { return 0; }
  }

  function getProductInfo(id) {
    const card = document.querySelector('.product-card[data-product-id="' + id + '"]');
    if (card) {
      return {
        id,
        name: (card.querySelector('.product-name') || {}).textContent?.trim() || 'منتج',
        price: parseFloat(((card.querySelector('.price-now') || {}).textContent || '0').replace(/[^\d.]/g, '')) || 0
      };
    }
    return {
      id,
      name: 'منتج #' + id,
      price: getPriceFromCache(id)
    };
  }

  /* ────────── Toast ────────── */
  function toast(msg, type) {
    const stack = document.querySelector('#toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : ' success');
    const icon = type === 'error' ? 'alert-circle-outline' : 'information-circle-outline';
    el.innerHTML = '<ion-icon name="' + icon + '"></ion-icon><span>' + msg + '</span>';
    stack.appendChild(el);
    if (typeof window.ELLOUL_renderIcons === 'function') window.ELLOUL_renderIcons(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  /* ═══════════════════════════════════════════
     ✅ QR URL — يستخدم المكتبة المحلية
     ═══════════════════════════════════════════ */
  function getQRUrl() {
    /* المحاولة الأولى: المكتبة المحلية */
    if (typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(STORE.website);
        qr.make();
        return qr.createDataURL(4, 8); /* cellSize=4, margin=8 */
      } catch(e) {
        console.warn('[Print] QR local generation failed:', e);
      }
    }

    /* Fallback: API خارجي */
    if (!navigator.onLine) return null;
    try {
      return 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' +
             encodeURIComponent(STORE.website);
    } catch(e) { return null; }
  }

  /* ────────── بناء الفاتورة ────────── */
  function buildReceipt() {
    const cart = getCart();
    if (!cart.length) {
      toast('سلتك فارغة — لا يمكن الطباعة', 'error');
      return null;
    }

    const items = cart.map((item, i) => {
      const p = getProductInfo(item.id);
      return {
        idx: i + 1,
        name: p.name,
        price: p.price,
        qty: item.qty,
        total: p.price * (item.qty || 0)
      };
    }).filter(it => it.qty > 0);

    if (!items.length) {
      toast('لا توجد منتجات صالحة للطباعة', 'error');
      return null;
    }

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const shipping = subtotal >= 500 ? 0 : 45;
    const total = subtotal + shipping;

    const now = new Date();
    const orderNo = 'ELL-' + now.getFullYear() +
                    String(now.getMonth() + 1).padStart(2, '0') +
                    String(now.getDate()).padStart(2, '0') +
                    '-' + Math.floor(Math.random() * 9000 + 1000);

    const qrUrl = getQRUrl();
    const qrHTML = qrUrl
      ? '<img src="' + qrUrl + '" alt="QR" onerror="this.style.display=\'none\'">'
      : '<div style="font-size:10px;color:#94a3b8;text-align:center;">QR غير متاح</div>';

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>فاتورة ${orderNo} — ELLOUL</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Tajawal','Segoe UI',Tahoma,sans-serif; color: #0a0f1a; background: #fff; padding: 24px; max-width: 780px; margin: 0 auto; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 3px solid #3b82f6; margin-bottom: 22px; gap: 20px; }
  .brand h1 { font-size: 28px; color: #3b82f6; letter-spacing: 3px; margin-bottom: 4px; }
  .brand p { font-size: 12px; color: #64748b; margin-bottom: 2px; }
  .brand .contact { margin-top: 10px; font-size: 11.5px; color: #334155; line-height: 1.8; }
  .meta { text-align: left; font-size: 12px; }
  .meta .order-no { font-size: 14px; font-weight: 900; color: #3b82f6; margin-bottom: 4px; }
  .meta p { color: #475569; margin-bottom: 2px; }
  .qr { margin-top: 8px; text-align: center; }
  .qr img { width: 100px; height: 100px; }
  h2 { font-size: 15px; color: #0a0f1a; margin: 22px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 10px 8px; text-align: right; border-bottom: 2px solid #cbd5e1; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:last-child td { border-bottom: none; }
  .col-idx { width: 40px; text-align: center; color: #64748b; }
  .col-price, .col-total { width: 110px; text-align: left; font-weight: 800; }
  .col-qty { width: 70px; text-align: center; }
  .summary { margin-top: 22px; display: flex; justify-content: flex-start; }
  .summary table { width: 320px; margin-inline-start: auto; }
  .summary td { padding: 8px 12px; font-size: 13px; border: none; }
  .summary td:first-child { color: #64748b; }
  .summary td:last-child { text-align: left; font-weight: 800; color: #0a0f1a; }
  .summary tr.total td { padding-top: 14px; border-top: 2px solid #3b82f6; font-size: 16px; color: #3b82f6 !important; font-weight: 900; }
  .summary tr.total td:first-child { color: #3b82f6 !important; }
  .footer { margin-top: 32px; padding-top: 18px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11.5px; color: #64748b; line-height: 1.9; }
  .footer strong { color: #3b82f6; }
  .thanks { font-size: 14px; font-weight: 800; color: #3b82f6; margin-bottom: 8px; }
  @media print { body { padding: 12px; } .no-print { display: none !important; } @page { margin: 1cm; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${STORE.name}</h1>
      <p>${STORE.tagline}</p>
      <div class="contact">📱 ${STORE.phone}<br>✉️ ${STORE.email}<br>📍 ${STORE.address}<br>🌐 ${STORE.website}</div>
    </div>
    <div class="meta">
      <div class="order-no">فاتورة #${orderNo}</div>
      <p><strong>التاريخ:</strong> ${now.toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' })}</p>
      <p><strong>الوقت:</strong> ${now.toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' })}</p>
      <div class="qr">${qrHTML}</div>
    </div>
  </div>
  <h2>🛍️ تفاصيل الطلب</h2>
  <table>
    <thead>
      <tr><th class="col-idx">#</th><th>المنتج</th><th class="col-qty">الكمية</th><th class="col-price">السعر</th><th class="col-total">الإجمالي</th></tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td class="col-idx">${it.idx}</td>
          <td>${it.name}</td>
          <td class="col-qty">${it.qty}</td>
          <td class="col-price">${it.price.toLocaleString('ar-EG')} ج.م</td>
          <td class="col-total">${it.total.toLocaleString('ar-EG')} ج.م</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="summary">
    <table>
      <tr><td>المجموع الفرعي</td><td>${subtotal.toLocaleString('ar-EG')} ج.م</td></tr>
      <tr><td>الشحن</td><td>${shipping === 0 ? 'مجاني' : shipping.toLocaleString('ar-EG') + ' ج.م'}</td></tr>
      <tr class="total"><td>الإجمالي</td><td>${total.toLocaleString('ar-EG')} ج.م</td></tr>
    </table>
  </div>
  <div class="footer">
    <div class="thanks">${STORE.footer}</div>
    <p><strong>${STORE.name}</strong> — جميع الحقوق محفوظة © ${now.getFullYear()}</p>
    <p>هذه الفاتورة صادرة إلكترونياً — لا تحتاج توقيع</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:24px;">
    <button onclick="window.print()" style="padding:12px 28px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;">🖨️ طباعة / حفظ PDF</button>
  </div>
</body>
</html>`;
  }

  function printReceipt() {
    const html = buildReceipt();
    if (!html) return;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      toast('❌ الرجاء السماح بالنوافذ المنبثقة', 'error');
      return;
    }

    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch(e) {
      toast('❌ تعذّر إنشاء الفاتورة', 'error');
      return;
    }

    setTimeout(() => {
      try { win.focus(); win.print(); } catch(e) {}
    }, 800);
  }

  function injectButton() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (!cartPage || !cartPage.classList.contains('active')) return;

    const cartSecondary = cartPage.querySelector('.cart-secondary');
    if (!cartSecondary) return;
    if (cartSecondary.querySelector('[data-print-receipt]')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.printReceipt = 'true';
    btn.innerHTML = '<ion-icon name="print-outline"></ion-icon>طباعة الفاتورة';

    cartSecondary.appendChild(btn);

    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(btn);
    }

    btn.addEventListener('click', printReceipt);
  }

  function scheduleInject() {
    if (injectTimer) clearTimeout(injectTimer);
    injectTimer = setTimeout(() => {
      injectTimer = null;
      injectButton();
    }, 200);
  }

  function cleanup() {
    if (cartObserver) {
      cartObserver.disconnect();
      cartObserver = null;
    }
    if (injectTimer) {
      clearTimeout(injectTimer);
      injectTimer = null;
    }
  }

  window.addEventListener('pagehide', cleanup, { once: true });

  function boot() {
    const cartPage = document.querySelector('[data-page="cart"]');
    if (cartPage) {
      cartObserver = new MutationObserver(() => {
        if (cartPage.classList.contains('active')) {
          scheduleInject();
        }
      });
      cartObserver.observe(cartPage, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('elloul:content-rendered', () => {
      const cp = document.querySelector('[data-page="cart"]');
      if (cp && cp.classList.contains('active')) scheduleInject();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.ELLOUL_PRINT = {
    open: printReceipt,
    preview: () => {
      const html = buildReceipt();
      if (!html) return;
      const w = window.open('', '_blank');
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
    }
  };

})();