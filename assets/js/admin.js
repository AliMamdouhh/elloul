'use strict';

/* ═══════════════════════════════════════════════════════════
   ADMIN PANEL — v2.0
   Null-safe + Event delegation + Smart caching + Validation
   ═══════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, updateDoc, doc,
  getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ═══════════════════════════════════════════
   Firebase Config
   ═══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAl_8HD6r4reDPRIjq9pvCGrcp5Zi1zwGw",
  authDomain: "alhoda-products.firebaseapp.com",
  projectId: "alhoda-products",
  storageBucket: "alhoda-products.firebasestorage.app",
  messagingSenderId: "776643566448",
  appId: "1:776643566448:web:6fea82f32e400559430db5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ═══════════════════════════════════════════
   ⚠️ قائمة الأدمن
   ═══════════════════════════════════════════ */
const ALLOWED_ADMINS = [
  "alimamdouhh369@gmail.com",
  "elloul369@gmail.com"
];

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const CATEGORIES = ['ملاعق', 'شوك', 'سكاكين ومجموعات', 'أطقم'];
const SWAL_DARK  = { background: '#181c24', color: '#f2f5f8' };

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[c]));
};

/* ✅ Validate image URL — يقبل مسار محلي أو http(s) */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 3 || trimmed.length > 500) return false;
  return /^(\.\/|\.\.\/|https?:\/\/|\/)/.test(trimmed);
}

const showToast = (message, icon = 'success') => {
  if (typeof Swal === 'undefined') return;
  Swal.fire({
    toast: true,
    position: 'top-start',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    ...SWAL_DARK,
    customClass: { popup: 'swal2-toast-custom' }
  });
};

/* ═══════════════════════════════════════════
   iOS CUSTOM SELECT — Event delegation
   ✅ listener واحد على document بدل N listeners
   ═══════════════════════════════════════════ */
let iosSelectBound = false;

function bindIOSSelectGlobal() {
  if (iosSelectBound) return;
  iosSelectBound = true;

  // فتح/إغلاق + إغلاق خارجي — listener واحد
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ios-select-btn]');

    // فتح/إغلاق عند النقر على الزر
    if (btn) {
      e.stopPropagation();
      const container = btn.closest('[data-ios-select]');
      if (container) container.classList.toggle('active');
      return;
    }

    // اختيار عنصر
    const li = e.target.closest('[data-ios-select-menu] li');
    if (li) {
      e.stopPropagation();
      const container = li.closest('[data-ios-select]');
      if (!container) return;

      const valueSpan = $('[data-ios-select-value]', container);
      const hiddenInput = $('input[type="hidden"]', container);
      const menu = $('[data-ios-select-menu]', container);

      if (valueSpan) {
        valueSpan.textContent = li.textContent.trim();
        valueSpan.classList.remove('placeholder');
      }
      if (hiddenInput) hiddenInput.value = li.dataset.value || '';

      if (menu) {
        menu.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
      }
      li.classList.add('selected');
      container.classList.remove('active');
      return;
    }

    // إغلاق أي select مفتوح عند النقر خارجاً
    document.querySelectorAll('[data-ios-select].active').forEach(sel => {
      if (!sel.contains(e.target)) sel.classList.remove('active');
    });
  });
}

function resetIOSSelect() {
  const container = $('[data-ios-select]');
  if (!container) return;

  const valueSpan = $('[data-ios-select-value]', container);
  const hiddenInput = $('input[type="hidden"]', container);
  const menu = $('[data-ios-select-menu]', container);

  if (valueSpan) {
    valueSpan.textContent = '-- اختر القسم --';
    valueSpan.classList.add('placeholder');
  }
  if (hiddenInput) hiddenInput.value = '';
  if (menu) menu.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
}

/* ═══════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════ */
let adminProducts = [];
let currentUser = null;

/* ═══════════════════════════════════════════
   AUTH GUARD
   ═══════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  const loadingScreen = $('#loadingScreen');
  const adminContent = $('#adminContent');

  if (!user) {
    window.location.replace('login.html');
    return;
  }

  if (!ALLOWED_ADMINS.includes(user.email)) {
    await Swal.fire({
      icon: 'error',
      title: 'غير مصرح',
      text: 'هذا الحساب لا يملك صلاحيات الأدمن',
      ...SWAL_DARK,
      confirmButtonColor: '#3b82f6'
    });
    await signOut(auth);
    window.location.replace('login.html');
    return;
  }

  currentUser = user;
  const emailEl = $('#userEmail');
  if (emailEl) emailEl.textContent = user.email;
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (adminContent) adminContent.style.display = 'block';

  /* ✅ جلب واحد فقط — ثم توزيع النتائج على UI */
  await fetchProducts();
});

/* ═══════════════════════════════════════════
   LOGOUT
   ═══════════════════════════════════════════ */
$('#logoutBtn')?.addEventListener('click', async () => {
  const res = await Swal.fire({
    title: 'تسجيل الخروج؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'نعم',
    cancelButtonText: 'إلغاء',
    ...SWAL_DARK,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280'
  });

  if (res.isConfirmed) {
    await signOut(auth);
    window.location.replace('login.html');
  }
});

/* ═══════════════════════════════════════════
   DATA FETCH — مرة واحدة
   ═══════════════════════════════════════════ */
async function fetchProducts() {
  const container = $('#adminProductsList');
  if (container) {
    container.innerHTML =
      '<div class="skeleton-row"></div>'.repeat(3);
  }

  try {
    const snap = await getDocs(collection(db, 'products'));
    adminProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    /* ✅ احسب الإحصائيات من نفس البيانات — بدون طلب ثانٍ */
    updateStats();
    renderAdminList(adminProducts);
  } catch (err) {
    console.error('[Admin] fetchProducts:', err);
    if (container) {
      container.innerHTML = `
        <p style="color:#ef4444;text-align:center;padding:20px;">
          فشل تحميل المنتجات: ${escapeHTML(err.message)}
        </p>`;
    }
  }
}

/* ═══════════════════════════════════════════
   STATS — يعمل من الذاكرة (بدون شبكة)
   ═══════════════════════════════════════════ */
function updateStats() {
  const totalEl = $('#totalProducts');
  const catsEl  = $('#totalCategories');
  const latestEl = $('#latestProduct');

  if (totalEl) totalEl.textContent = adminProducts.length;

  const cats = [...new Set(adminProducts.map(p => p.category).filter(Boolean))];
  if (catsEl) catsEl.textContent = cats.length;

  if (latestEl) {
    if (adminProducts.length > 0) {
      const sorted = adminProducts.slice().sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      const latest = sorted[0].title || '—';
      latestEl.textContent = latest.length > 15 ? latest.slice(0, 15) + '…' : latest;
    } else {
      latestEl.textContent = '—';
    }
  }
}

/* ═══════════════════════════════════════════
   ADD PRODUCT
   ═══════════════════════════════════════════ */
$('#adminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = $('#submitBtn');
  const btnSpan = btn ? btn.querySelector('span') : null;
  const categoryInput = $('#category');

  if (!categoryInput || !categoryInput.value) {
    showToast('الرجاء اختيار القسم أولاً', 'warning');
    return;
  }

  const title = $('#title')?.value.trim() || '';
  const image = $('#image')?.value.trim() || '';
  const description = $('#description')?.value.trim() || '';

  /* ✅ Validation أقوى */
  if (title.length < 3) {
    showToast('اسم المنتج قصير جداً (3 أحرف على الأقل)', 'warning');
    return;
  }
  if (!isValidImageUrl(image)) {
    showToast('رابط الصورة غير صالح (ابدأ بـ ./ أو https://)', 'warning');
    return;
  }
  if (description.length < 10) {
    showToast('الوصف قصير جداً (10 أحرف على الأقل)', 'warning');
    return;
  }

  if (btn) btn.disabled = true;
  if (btnSpan) btnSpan.innerText = 'جاري الحفظ...';

  try {
    await addDoc(collection(db, 'products'), {
      title,
      category: categoryInput.value,
      image,
      description,
      createdAt: serverTimestamp()
    });

    showToast('✅ تم إضافة المنتج بنجاح');
    e.target.reset();
    resetIOSSelect();

    /* ✅ تحديث ذكي — بدون طلب شبكة */
    await fetchProducts();
  } catch (error) {
    showToast('خطأ: ' + error.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnSpan) btnSpan.innerText = 'حفظ المنتج';
  }
});

/* ═══════════════════════════════════════════
   RENDER ADMIN LIST — Event delegation
   ═══════════════════════════════════════════ */
function renderAdminList(items) {
  const container = $('#adminProductsList');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <ion-icon name="cube-outline"></ion-icon>
        <p>لا توجد منتجات بعد</p>
      </div>`;
    /* ✅ عرض الأيقونة فوراً لو icons.js محمّل */
    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(container);
    }
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="admin-product-row" data-id="${escapeHTML(p.id)}">
      <img src="${escapeHTML(p.image)}"
           alt="${escapeHTML(p.title)}"
           loading="lazy"
           onerror="this.src='./assets/images/logo.ico'">
      <div class="admin-product-info">
        <h4>${escapeHTML(p.title)}</h4>
        <span class="cat-badge">${escapeHTML(p.category)}</span>
      </div>
      <div class="admin-product-actions">
        <button class="btn-icon-sm btn-edit"
                data-action="edit"
                data-id="${escapeHTML(p.id)}"
                title="تعديل"
                aria-label="تعديل ${escapeHTML(p.title)}">
          <ion-icon name="create-outline"></ion-icon>
        </button>
        <button class="btn-icon-sm btn-delete"
                data-action="delete"
                data-id="${escapeHTML(p.id)}"
                title="حذف"
                aria-label="حذف ${escapeHTML(p.title)}">
          <ion-icon name="trash-outline"></ion-icon>
        </button>
      </div>
    </div>
  `).join('');

  /* ✅ عرض الأيقونات فوراً */
  if (typeof window.ELLOUL_renderIcons === 'function') {
    window.ELLOUL_renderIcons(container);
  }
}

/* ✅ Event delegation — listener واحد لكل الأزرار */
$('#adminProductsList')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'delete') deleteProduct(id);
  if (action === 'edit')   editProduct(id);
});

/* ═══════════════════════════════════════════
   DELETE PRODUCT
   ═══════════════════════════════════════════ */
async function deleteProduct(id) {
  const product = adminProducts.find(p => p.id === id);

  const res = await Swal.fire({
    title: 'حذف المنتج؟',
    text: `سيتم حذف "${product?.title || 'المنتج'}" نهائياً`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    ...SWAL_DARK,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  });

  if (!res.isConfirmed) return;

  try {
    /* ✅ حالة loading بصرية */
    const row = document.querySelector(`.admin-product-row[data-id="${id}"]`);
    if (row) row.style.opacity = '0.4';

    await deleteDoc(doc(db, 'products', id));
    showToast('🗑️ تم حذف المنتج');

    /* ✅ حذف من الذاكرة محلياً — بدون إعادة طلب */
    adminProducts = adminProducts.filter(p => p.id !== id);
    updateStats();
    renderAdminList(adminProducts);
  } catch (err) {
    showToast('خطأ: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   EDIT PRODUCT
   ═══════════════════════════════════════════ */
async function editProduct(id) {
  const product = adminProducts.find(p => p.id === id);
  if (!product) return;

  /* ✅ بناء خيارات التصنيف بطريقة آمنة */
  const categoryOptions = CATEGORIES.map(cat =>
    `<option value="${escapeHTML(cat)}" ${product.category === cat ? 'selected' : ''}>${escapeHTML(cat)}</option>`
  ).join('');

  const { value: formValues } = await Swal.fire({
    title: 'تعديل المنتج',
    customClass: { popup: 'swal-edit-modal' },
    html: `
      <div style="text-align:right;direction:rtl;">
        <label style="display:block;color:#ccc;font-size:13px;margin-bottom:6px;font-weight:500;">اسم المنتج</label>
        <input id="swal-title" class="swal2-input" placeholder="اسم المنتج" value="${escapeHTML(product.title || '')}">

        <label style="display:block;color:#ccc;font-size:13px;margin:14px 0 6px;font-weight:500;">القسم</label>
        <select id="swal-category" class="swal2-select">
          ${categoryOptions}
        </select>

        <label style="display:block;color:#ccc;font-size:13px;margin:14px 0 6px;font-weight:500;">مسار الصورة</label>
        <input id="swal-image" class="swal2-input" placeholder="./assets/images/project-1.jpg" value="${escapeHTML(product.image || '')}">

        <label style="display:block;color:#ccc;font-size:13px;margin:14px 0 6px;font-weight:500;">الوصف</label>
        <textarea id="swal-description" class="swal2-textarea" placeholder="وصف المنتج">${escapeHTML(product.description || '')}</textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'حفظ',
    cancelButtonText: 'إلغاء',
    background: 'transparent',
    color: '#f2f5f8',
    didOpen: () => {
      const popup = Swal.getPopup();
      if (popup) {
        popup.querySelectorAll('.swal2-input, .swal2-select, .swal2-textarea').forEach(el => {
          el.style.marginTop = '0';
        });
      }
    },
    preConfirm: () => {
      const title = $('#swal-title')?.value.trim() || '';
      const category = $('#swal-category')?.value || '';
      const image = $('#swal-image')?.value.trim() || '';
      const description = $('#swal-description')?.value.trim() || '';

      if (!title || !category || !image || !description) {
        Swal.showValidationMessage('الرجاء ملء جميع الحقول');
        return false;
      }
      if (!isValidImageUrl(image)) {
        Swal.showValidationMessage('رابط الصورة غير صالح');
        return false;
      }

      return { title, category, image, description };
    }
  });

  if (!formValues) return;

  try {
    await updateDoc(doc(db, 'products', id), formValues);
    showToast('✏️ تم تحديث المنتج');

    /* ✅ تحديث الذاكرة محلياً — بدون إعادة طلب */
    const idx = adminProducts.findIndex(p => p.id === id);
    if (idx > -1) {
      adminProducts[idx] = { ...adminProducts[idx], ...formValues };
    }
    updateStats();
    renderAdminList(adminProducts);
  } catch (err) {
    showToast('خطأ: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   SEARCH — Debounced
   ═══════════════════════════════════════════ */
let searchTimer = null;

$('#searchProducts')?.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderAdminList(adminProducts);
      return;
    }
    const filtered = adminProducts.filter(p =>
      (p.title || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
    renderAdminList(filtered);
  }, 150);
});

/* ═══════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════ */
bindIOSSelectGlobal();