/* ═══════════════════════════════════════════════════════════
   ELLOUL STORE — Products, Cart, Modals
   v4.1 — Lazy render + Debounced notify + Hooked navigation (FIXED)
   ═══════════════════════════════════════════════════════════
   ✅ ما تغيّر عن v4.0:
      • إصلاح ترتيب hookNavigation:
        - renderPageIfNeeded() الأول (لتجهيز العناصر)
        - ثم dispatch للحدث elloul:navigate
      • بهذا الترتيب: effects.js يلاقي العناصر جاهزة
        ويشتغل عليها الـ animations بشكل صحيح
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ─────────────── DATA ─────────────── */
  const WA_NUMBER = '201206796831';
  const FREE_SHIP = 500;
  const SHIP_COST = 45;
  const CART_KEY = 'elloul-cart';
  const FAV_KEY  = 'elloul-fav';

  const CAT_META = {
    'ملاعق':  { icon: 'restaurant-outline' },
    'شوك':    { icon: 'flash-outline' },
    'سكاكين': { icon: 'cut-outline' },
    'أطقم':   { icon: 'albums-outline' }
  };

  const PRODUCTS = [
    { id:'p1',  name:'طقم ملاعق ستانلس فاخر – 6 قطع', cat:'ملاعق',  price:350,  old:420,  rating:4.9, reviews:184, badge:'hot',
      desc:'طقم ملاعق طعام فاخر من الاستانلس ستيل 304 بتشطيب لامع ومقاوم للخدش. مثالي للاستخدام اليومي وللمناسبات، ويأتي بعلبة هدية أنيقة.' },
    { id:'p2',  name:'ملعقة طعام كلاسيكية', cat:'ملاعق',  price:45,   old:0,    rating:4.7, reviews:96,  badge:'',
      desc:'ملعقة طعام بتصميم كلاسيكي انسيابي وحواف ناعمة. خفيفة ومتوازنة في اليد، مناسبة لكل الاستخدامات اليومية.' },
    { id:'p3',  name:'ملعقة شاي مذهبة', cat:'ملاعق',  price:55,   old:0,    rating:4.8, reviews:73,  badge:'new',
      desc:'ملعقة شاي بتشطيب ذهبي أنيق فوق استانلس ستيل عالي الجودة. إضافة راقية لطقم الشاي أو القهوة.' },
    { id:'p4',  name:'ملعقة حلى انسيابية – 4 قطع', cat:'ملاعق',  price:120,  old:150,  rating:4.6, reviews:58,  badge:'sale',
      desc:'مجموعة من 4 ملاعق حلى بتصميم انسيابي عصري. مثالية للتقديم مع الآيس كريم والحلويات الشرقية والغربية.' },
    { id:'p5',  name:'شوكة طعام عصرية', cat:'شوك',    price:50,   old:0,    rating:4.7, reviews:88,  badge:'',
      desc:'شوكة طعام بأسنان مدببة بدقة وسطح مصقول. تصميم عصري بخطوط نظيفة يضيف لمسة أنيقة لمائدتك.' },
    { id:'p6',  name:'طقم شوك ستانلس – 6 قطع', cat:'شوك',    price:290,  old:340,  rating:4.9, reviews:142, badge:'hot',
      desc:'طقم من 6 شوك طعام من الاستانلس ستيل المقاوم للصدأ. متين وخفيف ولا يتأثر بالاستخدام المتكرر.' },
    { id:'p7',  name:'شوكة حلويات صغيرة – 6 قطع', cat:'شوك',    price:145,  old:0,    rating:4.5, reviews:41,  badge:'',
      desc:'شوك صغيرة مخصصة لتقديم الحلويات والفواكه. تصميم رقيق وأنيق يناسب الضيافة الراقية.' },
    { id:'p8',  name:'سكين مائدة حاد – استانلس', cat:'سكاكين', price:75,   old:0,    rating:4.8, reviews:67,  badge:'',
      desc:'سكين مائدة بحافة حادة وآمنة مع مقبض مريح مانع للانزلاق. مثالي للاستخدام المنزلي والفندقي.' },
    { id:'p9',  name:'طقم سكاكين فندقي – 6 قطع', cat:'سكاكين', price:480,  old:560,  rating:4.9, reviews:112, badge:'sale',
      desc:'طقم سكاكين بجودة فندقية عالية، مصمم للاستخدام الاحترافي في المطاعم والفنادق. تشطيب لامع ومقاوم للتآكل.' },
    { id:'p10', name:'طقم مائدة كامل – 24 قطعة', cat:'أطقم',   price:1250, old:1500, rating:5.0, reviews:203, badge:'hot',
      desc:'طقم مائدة متكامل يضم 6 ملاعق طعام + 6 شوك + 6 ملاعق شاي + 6 سكاكين. تصميم عصري موحد بلمسة فاخرة، مثالي للعائلات وللهدايا.' },
    { id:'p11', name:'طقم مائدة – 16 قطعة', cat:'أطقم',   price:890,  old:1050, rating:4.8, reviews:156, badge:'',
      desc:'طقم مائدة 16 قطعة بتصميم أنيق يناسب المطابخ العصرية. جودة عالية بسعر اقتصادي.' },
    { id:'p12', name:'طقم تقديم فاخر – 4 قطع', cat:'أطقم',   price:420,  old:0,    rating:4.7, reviews:74,  badge:'new',
      desc:'طقم تقديم راقٍ من 4 قطع بتشطيب لامع. مثالي لتقديم الأطباق الجانبية والحلويات على المائدة.' },
    { id:'p13', name:'ملعقة تقديم كبيرة', cat:'ملاعق',  price:65,   old:0,    rating:4.6, reviews:39,  badge:'',
      desc:'ملعقة تقديم بحجم كبير مناسبة للأرز والخضروات والسلطات. مقبض طويل مريح للاستخدام.' },
    { id:'p14', name:'شوكة تقديم ثنائية', cat:'شوك',    price:58,   old:0,    rating:4.5, reviews:33,  badge:'',
      desc:'شوكة تقديم مخصصة للحوم والدواجن المشوية. أسنان قوية وحادة تثبت الطعام بسهولة.' },
    { id:'p15', name:'سكين تقطيع احترافي', cat:'سكاكين', price:135,  old:170,  rating:4.8, reviews:52,  badge:'sale',
      desc:'سكين تقطيع بحافة دقيقة ونصل من الاستانلس عالي الجودة. مقبض مريح يمنحك تحكماً كاملاً أثناء التقطيع.' },
    { id:'p16', name:'طقم مائدة للأطفال – 4 قطع', cat:'أطقم',   price:260,  old:0,    rating:4.9, reviews:88,  badge:'new',
      desc:'طقم آمن للأطفال من الاستانلس ستيل بحواف ناعمة مستديرة. تصميم ملوّن وخفيف مناسب للأيدي الصغيرة.' }
  ];

  const CATEGORIES = ['الكل','ملاعق','شوك','سكاكين','أطقم'];

  /* ─────────────── STATE ─────────────── */
  let cart = [];
  let favs = [];
  let shopFilter = 'الكل';
  let shopQuery = '';

  /* ✅ حالة الصفحات المُصيَّرة (lazy render) */
  let homeRendered = false;
  let shopRendered = false;

  /* ✅ debounce للحدث elloul:content-rendered */
  let notifyTimer = null;

  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e) { cart = []; }
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY)  || '[]'); } catch(e) { favs = []; }
  if (!Array.isArray(cart)) cart = [];
  if (!Array.isArray(favs)) favs = [];

  /* ─────────────── HELPERS ─────────────── */
  const $  = function(s, c) { return (c || document).querySelector(s); };
  const $$ = function(s, c) { return Array.from((c || document).querySelectorAll(s)); };
  const money = function(n) { return Number(n).toLocaleString('ar-EG'); };

  function setText(selector, value, ctx) {
    const el = $(selector, ctx);
    if (el) el.textContent = value;
  }
  function setHTML(selector, value, ctx) {
    const el = $(selector, ctx);
    if (el) el.innerHTML = value;
  }
  function setHidden(selector, hidden, ctx) {
    const el = $(selector, ctx);
    if (el) el.hidden = hidden;
  }

  function getProduct(id) { return PRODUCTS.find(function(p) { return p.id === id; }) || null; }
  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch(e) {} }
  function saveFavs() { try { localStorage.setItem(FAV_KEY,  JSON.stringify(favs));  } catch(e) {} }
  function cartCount() { return cart.reduce(function(s, i) { return s + i.qty; }, 0); }
  function cartSubtotal() {
    return cart.reduce(function(s, i) {
      const p = getProduct(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }
  function shippingCost() {
    const sub = cartSubtotal();
    if (sub === 0) return 0;
    return sub >= FREE_SHIP ? 0 : SHIP_COST;
  }

  /* ─────────────── ICON RENDER ─────────────── */
  function paintIcons(root) {
    if (typeof window.ELLOUL_renderIcons === 'function') {
      window.ELLOUL_renderIcons(root || document);
    }
  }

  /* ═══════════════════════════════════════════
     ✅ notifyRendered — Debounced
     كل الاستدعاءات في نافذة 150ms تتحول إلى حدث واحد
     ═══════════════════════════════════════════ */
  function notifyRendered() {
    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = setTimeout(function() {
      notifyTimer = null;
      window.dispatchEvent(new CustomEvent('elloul:content-rendered'));
    }, 150);
  }

  /* ─────────────── TOAST ─────────────── */
  function toast(msg, type) {
    const stack = $('#toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : ' success');
    const icon = type === 'error' ? 'alert-circle-outline' : 'checkmark-circle';
    el.innerHTML = '<ion-icon name="' + icon + '"></ion-icon><span>' + msg + '</span>';
    stack.appendChild(el);
    paintIcons(el);
    requestAnimationFrame(function() { el.classList.add('show'); });
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { el.remove(); }, 320);
    }, 2200);
  }

  /* ─────────────── RENDER HELPERS ─────────────── */
  function badgeHTML(badge, price, old) {
    const out = [];
    if (badge === 'sale' && old && old > price) {
      const pct = Math.round((1 - price / old) * 100);
      out.push('<span class="p-badge sale">خصم ' + pct + '%</span>');
    }
    if (badge === 'new') out.push('<span class="p-badge new">جديد</span>');
    if (badge === 'hot') out.push('<span class="p-badge hot">الأكثر مبيعاً</span>');
    return out.join('');
  }

  function productCardHTML(p) {
    const icon = (CAT_META[p.cat] && CAT_META[p.cat].icon) || 'restaurant-outline';
    const isFav = favs.indexOf(p.id) > -1;
    const oldPrice = p.old && p.old > p.price
      ? '<span class="price-old">' + money(p.old) + '</span>' : '';

    return '' +
    '<li class="product-card" data-product-id="' + p.id + '">' +
      '<figure class="product-media" data-open-product="' + p.id + '">' +
        '<div class="product-ph"><ion-icon name="' + icon + '"></ion-icon></div>' +
        '<div class="product-badges">' + badgeHTML(p.badge, p.price, p.old) + '</div>' +
        '<button class="product-fav' + (isFav ? ' active' : '') + '" data-fav="' + p.id + '" aria-label="المفضلة">' +
          '<ion-icon name="' + (isFav ? 'heart' : 'heart-outline') + '"></ion-icon>' +
        '</button>' +
        '<button class="product-quick" data-add="' + p.id + '">' +
          '<ion-icon name="cart-outline"></ion-icon> أضف للسلة' +
        '</button>' +
      '</figure>' +
      '<div class="product-body">' +
        '<span class="product-cat">' + p.cat + '</span>' +
        '<h3 class="product-name" data-open-product="' + p.id + '">' + p.name + '</h3>' +
        '<div class="product-meta">' +
          '<span class="product-rating">' +
            '<ion-icon name="star"></ion-icon>' + p.rating.toFixed(1) +
            '<span>(' + p.reviews + ')</span>' +
          '</span>' +
        '</div>' +
        '<div class="price-row">' +
          '<span class="price-now">' + money(p.price) + ' <small>ج.م</small></span>' +
          oldPrice +
        '</div>' +
      '</div>' +
    '</li>';
  }

  /* ═══════════════════════════════════════════
     RENDER: SHOP — بدون notify مباشر
     ═══════════════════════════════════════════ */
  function renderShop() {
    const grid = $('[data-shop-grid]');
    const countEl = $('[data-shop-count]');
    if (!grid) return;

    const q = shopQuery.trim().toLowerCase();
    const list = PRODUCTS.filter(function(p) {
      const catOk = shopFilter === 'الكل' || p.cat === shopFilter;
      const qOk = !q || p.name.toLowerCase().indexOf(q) > -1 || p.cat.toLowerCase().indexOf(q) > -1;
      return catOk && qOk;
    });

    if (!list.length) {
      grid.innerHTML =
        '<li class="empty-state">' +
          '<div class="empty-ico"><ion-icon name="search-outline"></ion-icon></div>' +
          '<h4>لا توجد نتائج</h4>' +
          '<p>جرّب كلمة بحث أخرى أو اختر تصنيفاً مختلفاً.</p>' +
        '</li>';
    } else {
      grid.innerHTML = list.map(productCardHTML).join('');
    }

    paintIcons(grid);

    if (countEl) {
      countEl.innerHTML = 'عرض <b>' + list.length + '</b> منتج' +
        (shopFilter !== 'الكل' ? ' في تصنيف <b>' + shopFilter + '</b>' : '');
    }
  }

  /* ═══════════════════════════════════════════
     RENDER: HOME — بدون notify مباشر
     ═══════════════════════════════════════════ */
  function renderHome() {
    const featGrid = $('[data-featured-grid]');
    const newGrid  = $('[data-new-grid]');
    const catsBox  = $('[data-home-cats]');

    if (catsBox) {
      catsBox.innerHTML = CATEGORIES.slice(1).map(function(c) {
        const ic = (CAT_META[c] && CAT_META[c].icon) || 'restaurant-outline';
        return '<button class="cat-chip" data-home-cat="' + c + '">' +
                 '<ion-icon name="' + ic + '"></ion-icon>' + c +
               '</button>';
      }).join('');
      paintIcons(catsBox);
    }

    if (featGrid) {
      const featured = PRODUCTS.filter(function(p) {
        return p.badge === 'hot' || p.badge === 'sale';
      }).slice(0, 4);
      featGrid.innerHTML = featured.map(productCardHTML).join('');
      paintIcons(featGrid);
    }

    if (newGrid) {
      const fresh = PRODUCTS.filter(function(p) { return p.badge === 'new'; }).slice(0, 4);
      newGrid.innerHTML = fresh.length
        ? fresh.map(productCardHTML).join('')
        : PRODUCTS.slice(-4).map(productCardHTML).join('');
      paintIcons(newGrid);
    }
  }

  function renderShopCats() {
    const box = $('[data-shop-cats]');
    if (!box) return;
    box.innerHTML = CATEGORIES.map(function(c) {
      const ic = c === 'الكل' ? 'grid-outline' : ((CAT_META[c] && CAT_META[c].icon) || 'restaurant-outline');
      return '<button class="cat-chip' + (c === shopFilter ? ' active' : '') + '" data-shop-cat="' + c + '">' +
               '<ion-icon name="' + ic + '"></ion-icon>' + c +
             '</button>';
    }).join('');
    paintIcons(box);
  }

  /* ═══════════════════════════════════════════
     RENDER: CART
     ═══════════════════════════════════════════ */
  function renderCart() {
    const listEl   = $('[data-cart-list]');
    const fullEl   = $('[data-cart-full]');
    const emptyEl  = $('[data-cart-empty]');

    updateBadges();

    const hasItems = cart.length > 0;
    if (fullEl)  fullEl.hidden  = !hasItems;
    if (emptyEl) emptyEl.hidden = hasItems;

    if (!hasItems) {
      if (listEl) listEl.innerHTML = '';
      return;
    }

    if (listEl) {
      listEl.innerHTML = cart.map(function(item) {
        const p = getProduct(item.id);
        if (!p) return '';
        const icon = (CAT_META[p.cat] && CAT_META[p.cat].icon) || 'restaurant-outline';
        return '' +
        '<li class="cart-item" data-cart-row="' + p.id + '">' +
          '<div class="cart-thumb"><ion-icon name="' + icon + '"></ion-icon></div>' +
          '<div class="cart-info">' +
            '<h4>' + p.name + '</h4>' +
            '<span class="cart-cat">' + p.cat + '</span>' +
            '<span class="cart-unit">' + money(p.price) + ' ج.م للقطعة</span>' +
          '</div>' +
          '<button class="cart-remove" data-cart-remove="' + p.id + '" aria-label="حذف">' +
            '<ion-icon name="trash-outline"></ion-icon>' +
          '</button>' +
          '<div class="cart-controls">' +
            '<div class="qty-stepper">' +
              '<button data-cart-minus="' + p.id + '" aria-label="تقليل">−</button>' +
              '<span class="qty-val">' + item.qty + '</span>' +
              '<button data-cart-plus="' + p.id + '" aria-label="زيادة">+</button>' +
            '</div>' +
            '<span class="cart-line-total">' + money(p.price * item.qty) + ' <small>ج.م</small></span>' +
          '</div>' +
        '</li>';
      }).join('');
      paintIcons(listEl);
    }

    const sub  = cartSubtotal();
    const ship = shippingCost();
    const total = sub + ship;

    setText('[data-sum-qty]',   money(cartCount()) + ' قطعة');
    setText('[data-sum-sub]',   money(sub) + ' ج.م');
    setHTML('[data-sum-total]', money(total) + ' <small>ج.م</small>');

    const sumShip = $('[data-sum-ship]');
    if (sumShip) {
      sumShip.textContent = ship === 0 ? 'مجاني' : money(ship) + ' ج.م';
      sumShip.className = 'val' + (ship === 0 ? ' free' : '');
    }

    const shipHint = $('[data-ship-hint]');
    if (shipHint) {
      if (sub >= FREE_SHIP) {
        shipHint.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon>' +
          '<span>مبروك! حصلت على شحن مجاني 🎉</span>';
      } else {
        shipHint.innerHTML = '<ion-icon name="information-circle-outline"></ion-icon>' +
          '<span>أضف منتجات بقيمة ' + money(FREE_SHIP - sub) + ' ج.م للحصول على شحن مجاني.</span>';
      }
      paintIcons(shipHint);
    }
  }

  function updateBadges() {
    const n = cartCount();
    const badges = $$('[data-cart-badge], [data-float-badge]');
    badges.forEach(function(b) {
      b.textContent = n > 99 ? '99+' : n;
      b.hidden = n === 0;
    });
    const fc = $('[data-float-cart]');
    if (fc) {
      const cartPage = $('[data-page="cart"]');
      const onCartPage = cartPage && cartPage.classList.contains('active');
      fc.classList.toggle('show', n > 0 && !onCartPage);
    }
  }

  /* ─────────────── CART ACTIONS ─────────────── */
  function addToCart(id, qty) {
    qty = qty || 1;
    const p = getProduct(id);
    if (!p) return;
    const found = cart.find(function(i) { return i.id === id; });
    if (found) found.qty += qty;
    else cart.push({ id: id, qty: qty });
    saveCart();
    renderCart();
    toast('تمت إضافة "' + p.name + '" إلى السلة');
  }

  function removeFromCart(id) {
    const row = $('[data-cart-row="' + id + '"]');
    cart = cart.filter(function(i) { return i.id !== id; });
    saveCart();
    if (row) {
      row.classList.add('removing');
      setTimeout(renderCart, 260);
    } else {
      renderCart();
    }
  }

  function changeQty(id, delta) {
    const item = cart.find(function(i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(id); return; }
    saveCart();
    renderCart();
  }

  /* ═══════════════════════════════════════════
     FAVORITES — invalidates hidden grids
     ═══════════════════════════════════════════ */
  function toggleFav(id) {
    const i = favs.indexOf(id);
    if (i > -1) { favs.splice(i, 1); toast('تم الحذف من المفضلة'); }
    else { favs.push(id); toast('تمت الإضافة إلى المفضلة ❤'); }
    saveFavs();

    /* أعد رسم الصفحة الظاهرة فقط، وأبطِل حالة المخفية */
    const homePage = $('[data-page="home"]');
    const shopPage = $('[data-page="shop"]');
    const homeActive = homePage && homePage.classList.contains('active');
    const shopActive = shopPage && shopPage.classList.contains('active');

    if (homeActive) { renderHome(); homeRendered = true; }
    if (shopActive) { renderShop(); shopRendered = true; }

    /* الصفحة المخفية ستُعاد عند زيارتها القادمة */
    if (!homeActive) homeRendered = false;
    if (!shopActive) shopRendered = false;
  }

  /* ─────────────── PRODUCT MODAL ─────────────── */
  let pmCurrent = null;
  let pmQty = 1;

  function openProductModal(id) {
    const p = getProduct(id);
    if (!p) return;
    pmCurrent = p;
    pmQty = 1;

    const modal = $('[data-product-modal-container]');
    const overlay = $('[data-product-overlay]');
    const img = $('[data-product-modal-img]');
    const ph = $('[data-product-modal-ph]');
    const icon = (CAT_META[p.cat] && CAT_META[p.cat].icon) || 'restaurant-outline';

    if (img) { img.hidden = true; img.src = ''; }
    if (ph) {
      ph.hidden = false;
      ph.innerHTML = '<ion-icon name="' + icon + '"></ion-icon>';
      paintIcons(ph);
    }

    setHTML('[data-product-modal-badges]', badgeHTML(p.badge, p.price, p.old));
    setText('[data-product-modal-cat]',    p.cat);
    setText('[data-product-modal-title]',  p.name);
    setText('[data-product-modal-desc]',   p.desc);
    setText('[data-product-modal-rating]', p.rating.toFixed(1) + ' · ' + p.reviews + ' تقييم');
    setHTML('[data-product-modal-price]',  money(p.price) + ' <small>ج.م</small>');
    setText('[data-pm-qty]', '1');

    const oldEl = $('[data-product-modal-old]');
    if (oldEl) {
      if (p.old && p.old > p.price) {
        oldEl.hidden = false;
        oldEl.textContent = money(p.old) + ' ج.م';
      } else {
        oldEl.hidden = true;
      }
    }

    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    const modal = $('[data-product-modal-container]');
    const overlay = $('[data-product-overlay]');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    pmCurrent = null;
  }

  /* ─────────────── BLOG MODAL ─────────────── */
  (function initBlog() {
    const blogItems = $$('[data-blog-item]');
    const blogModal = $('[data-blog-modal-container]');
    const blogOverlay = $('[data-blog-overlay]');
    const blogClose = $('[data-blog-modal-close]');
    const blogImg = $('[data-blog-modal-img]');
    const blogCat = $('[data-blog-modal-category]');
    const blogDate = $('[data-blog-modal-date]');
    const blogTitle = $('[data-blog-modal-title]');
    const blogBody = $('[data-blog-modal-body]');
    const blogShare = $('[data-blog-modal-share]');

    if (!blogModal) return;

    function openBlogModal(item) {
      const data = {
        category: item.dataset.blogCategory || '',
        date: item.dataset.blogDate || '',
        image: item.dataset.blogImage || '',
        title: item.dataset.blogTitle || '',
        content: item.dataset.blogContent || ''
      };

      if (blogImg) {
        if (data.image) {
          blogImg.style.display = '';
          blogImg.src = data.image;
          blogImg.alt = data.title;
          blogImg.onerror = function() { this.style.display = 'none'; };
        } else {
          blogImg.style.display = 'none';
          blogImg.removeAttribute('src');
        }
      }
      if (blogCat) blogCat.textContent = data.category;
      if (blogDate) blogDate.textContent = data.date;
      if (blogTitle) blogTitle.textContent = data.title;
      if (blogBody) blogBody.textContent = data.content;

      blogModal.classList.add('active');
      if (blogOverlay) blogOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeBlogModal() {
      blogModal.classList.remove('active');
      if (blogOverlay) blogOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    blogItems.forEach(function(item) {
      const link = item.querySelector('a');
      if (link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          openBlogModal(item);
        });
      }
    });

    if (blogClose) blogClose.addEventListener('click', closeBlogModal);
    if (blogOverlay) blogOverlay.addEventListener('click', closeBlogModal);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && blogModal.classList.contains('active')) closeBlogModal();
    });

    if (blogShare) {
      blogShare.addEventListener('click', async function() {
        const title = blogTitle ? blogTitle.textContent : '';
        const text = blogBody ? blogBody.textContent.slice(0, 100) : '';
        const shareData = { title: title, text: text, url: window.location.href };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(title + '\n\n' + window.location.href);
            toast('تم نسخ رابط الخبر');
          }
        } catch (err) {}
      });
    }
  })();

  /* ─────────────── CHECKOUT ─────────────── */
  function checkout() {
    if (!cart.length) { toast('سلتك فارغة', 'error'); return; }

    const lines = cart.map(function(item, idx) {
      const p = getProduct(item.id);
      if (!p) return '';
      return (idx + 1) + '. ' + p.name +
             '\n   الكمية: ' + item.qty +
             ' × ' + money(p.price) + ' ج.م = ' + money(p.price * item.qty) + ' ج.م';
    }).filter(Boolean).join('\n');

    const sub = cartSubtotal();
    const ship = shippingCost();

    let gift = null;
    try {
      const raw = localStorage.getItem('elloul-gift');
      if (raw) {
        const g = JSON.parse(raw);
        if (g && g.active) gift = g;
      }
    } catch(e) {}

    const GIFT_PRICE = 30;
    const giftPrice = gift ? GIFT_PRICE : 0;
    const giftMessage = (gift && gift.message) ? String(gift.message).trim() : '';

    const total = sub + ship + giftPrice;

    const msg =
      'مرحباً ELLOUL 👋\n' +
      'أريد تأكيد الطلب التالي:\n\n' +
      lines + '\n\n' +
      '———————————————\n' +
      'المجموع الفرعي: ' + money(sub) + ' ج.م\n' +
      'الشحن: ' + (ship === 0 ? 'مجاني' : money(ship) + ' ج.م') + '\n' +
      (giftPrice > 0 ? '🎁 تغليف هدية: ' + money(giftPrice) + ' ج.م\n' : '') +
      (giftMessage ? '📝 رسالة الهدية: "' + giftMessage + '"\n' : '') +
      'الإجمالي: ' + money(total) + ' ج.م\n' +
      '———————————————\n\n' +
      'الاسم:\n' +
      'العنوان بالتفصيل:\n' +
      'رقم الهاتف:\n';

    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
  }

  /* ─────────────── NAVIGATION ─────────────── */
  function goTo(page) {
    const fn = window.ELLOUL_navigateEnhanced || window.ELLOUL_navigate;
    if (typeof fn === 'function') fn(page);
  }

  /* ═══════════════════════════════════════════
     ✅ LAZY RENDER — حسب الصفحة المطلوبة
     ═══════════════════════════════════════════ */
  function getCurrentPage() {
    const active = $('[data-page].active');
    return active ? active.dataset.page : 'home';
  }

  function renderPageIfNeeded(page) {
    if (page === 'home' && !homeRendered) {
      renderHome();
      homeRendered = true;
    } else if (page === 'shop' && !shopRendered) {
      renderShop();
      shopRendered = true;
    } else if (page === 'cart') {
      renderCart(); // دائماً نُحدّث السلة عند زيارتها
    }
  }

  /* ═══════════════════════════════════════════
     ✅ HOOK NAVIGATION — v4.1 (FIXED)
     ⚠️ الترتيب مهم جداً:
       1. renderPageIfNeeded() الأول ← لتجهيز العناصر
       2. ثم dispatch للحدث elloul:navigate
     بهذا الترتيب، effects.js يلاقي العناصر جاهزة
     ويشتغل عليها الـ animations بشكل صحيح.
     ═══════════════════════════════════════════ */
  function hookNavigation() {
    const names = ['ELLOUL_navigate', 'ELLOUL_navigateEnhanced'];

    names.forEach(function(name) {
      const original = window[name];
      if (typeof original !== 'function' || original.__hooked) return;

      const wrapped = function(target, silent) {
        const result = original.apply(this, arguments);

        /* 1️⃣ اعرض الصفحة الأول — عشان العناصر تكون جاهزة */
        renderPageIfNeeded(target);

        /* 2️⃣ بعدين أطلق الحدث — effects.js هيلاقي العناصر */
        try {
          window.dispatchEvent(new CustomEvent('elloul:navigate', {
            detail: { page: target, silent: !!silent }
          }));
        } catch(e) {}

        /* 3️⃣ حدّث الـ badges */
        requestAnimationFrame(updateBadges);

        return result;
      };
      wrapped.__hooked = true;
      window[name] = wrapped;
    });
  }

  /* ─────────────── EVENT DELEGATION ─────────────── */
  document.addEventListener('click', function(e) {
    const t = e.target;
    if (!t || !t.closest) return;

    /* 1️⃣ ADD TO CART */
    const addEl = t.closest('[data-add]');
    if (addEl) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(addEl.dataset.add, 1);
      return;
    }

    /* 2️⃣ FAVORITE */
    const favEl = t.closest('[data-fav]');
    if (favEl) {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(favEl.dataset.fav);
      return;
    }

    /* 3️⃣ OPEN PRODUCT MODAL */
    const openEl = t.closest('[data-open-product]');
    if (openEl) {
      e.preventDefault();
      openProductModal(openEl.dataset.openProduct);
      return;
    }

    /* Category: shop */
    const shopCat = t.closest('[data-shop-cat]');
    if (shopCat) {
      e.preventDefault();
      shopFilter = shopCat.dataset.shopCat;
      renderShopCats();
      renderShop();
      return;
    }

    /* Category: home → go to shop */
    const homeCat = t.closest('[data-home-cat]');
    if (homeCat) {
      e.preventDefault();
      shopFilter = homeCat.dataset.homeCat;
      shopQuery = '';
      const si = $('[data-shop-search]');
      if (si) si.value = '';
      const sc = $('[data-shop-clear]');
      if (sc) sc.classList.remove('show');
      renderShopCats();
      /* ✅ أعد تعيين shopRendered=false ليعاد رسم الشبكة عند الوصول */
      shopRendered = false;
      goTo('shop');
      return;
    }

    /* Cart +/- / remove */
    const minusEl = t.closest('[data-cart-minus]');
    if (minusEl) { e.preventDefault(); changeQty(minusEl.dataset.cartMinus, -1); return; }

    const plusEl = t.closest('[data-cart-plus]');
    if (plusEl) { e.preventDefault(); changeQty(plusEl.dataset.cartPlus, 1); return; }

    const remEl = t.closest('[data-cart-remove]');
    if (remEl) { e.preventDefault(); removeFromCart(remEl.dataset.cartRemove); return; }

    /* Clear cart */
    if (t.closest('[data-clear-cart]')) {
      e.preventDefault();
      if (!cart.length) return;
      const doClear = function() {
        cart = []; saveCart(); renderCart(); toast('تم تفريغ السلة');
      };
      if (typeof Swal !== 'undefined') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        Swal.fire({
          title: 'تفريغ السلة؟',
          text: 'سيتم حذف جميع المنتجات من سلتك.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'نعم، فرّغ',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#ef4444',
          background: isLight ? '#ffffff' : '#181c24',
          color: isLight ? '#0a0f1a' : '#f2f5f8'
        }).then(function(r) { if (r.isConfirmed) doClear(); });
      } else {
        doClear();
      }
      return;
    }

    /* Checkout */
    if (t.closest('[data-checkout]')) {
      e.preventDefault();
      checkout();
      return;
    }

    /* Search clear */
    const clearBtn = t.closest('[data-shop-clear]');
    if (clearBtn) {
      e.preventDefault();
      shopQuery = '';
      const si = $('[data-shop-search]');
      if (si) si.value = '';
      clearBtn.classList.remove('show');
      renderShop();
      return;
    }

    /* Float cart */
    if (t.closest('[data-float-cart]')) {
      e.preventDefault();
      goTo('cart');
      return;
    }

    /* Product modal close */
    if (t.closest('[data-product-modal-close]')) {
      e.preventDefault();
      closeProductModal();
      return;
    }
    if (t.closest('[data-product-overlay]')) {
      closeProductModal();
      return;
    }

    /* Product modal qty */
    if (t.closest('[data-pm-minus]')) {
      e.preventDefault();
      pmQty = Math.max(1, pmQty - 1);
      setText('[data-pm-qty]', pmQty);
      return;
    }
    if (t.closest('[data-pm-plus]')) {
      e.preventDefault();
      pmQty = Math.min(99, pmQty + 1);
      setText('[data-pm-qty]', pmQty);
      return;
    }
    if (t.closest('[data-pm-add]')) {
      e.preventDefault();
      if (pmCurrent) {
        addToCart(pmCurrent.id, pmQty);
        closeProductModal();
      }
      return;
    }
  });

  /* Search input */
  document.addEventListener('input', function(e) {
    if (e.target && e.target.matches('[data-shop-search]')) {
      shopQuery = e.target.value;
      const clearBtn = $('[data-shop-clear]');
      if (clearBtn) clearBtn.classList.toggle('show', shopQuery.length > 0);
      renderShop();
    }
  });

  /* Escape closes product modal */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const pm = $('[data-product-modal-container]');
      if (pm && pm.classList.contains('active')) closeProductModal();
    }
  });

  /* ─────────────── CONTACT FORM ─────────────── */
  function initContactForm() {
    const form = $('[data-form]');
    if (!form) return;
    const inputs = $$('[data-form-input]', form);
    const btn = $('[data-form-btn]', form);

    function check() {
      const ok = inputs.every(function(i) { return i.value.trim() !== ''; });
      if (btn) btn.disabled = !ok;
    }
    inputs.forEach(function(i) { i.addEventListener('input', check); });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = form.fullname ? form.fullname.value.trim() : '';
      const phone = form.phone ? form.phone.value.trim() : '';
      const msg = form.message ? form.message.value.trim() : '';

      const text =
        'مرحباً ELLOUL 👋\n\n' +
        'الاسم: ' + name + '\n' +
        'الهاتف: ' + phone + '\n\n' +
        'الرسالة:\n' + msg;

      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
      form.reset();
      check();
      toast('تم تجهيز رسالتك على واتساب');
    });
  }

  /* ═══════════════════════════════════════════
     BOOT — يشغّل الحد الأدنى فقط
     ═══════════════════════════════════════════ */
  function boot() {
    /* 1️⃣ شيئ خفيف دائماً */
    renderShopCats();     // 6 chips — رخيص
    updateBadges();       // العدد فقط

    /* 2️⃣ اربط التنقل قبل أي شيء آخر */
    hookNavigation();

    /* 3️⃣ اعرض الصفحة الحالية فقط */
    const page = getCurrentPage();
    renderPageIfNeeded(page);

    /* 4️⃣ نموذج الاتصال جاهز دائماً */
    initContactForm();

    /* 5️⃣ أطلق الحدث مرة واحدة بعد كل هذا */
    notifyRendered();
  }

  /* ─────────────── START ─────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ✅ أعد الربط بعد ما effects.js يعرّف ELLOUL_navigateEnhanced */
  document.addEventListener('DOMContentLoaded', hookNavigation);
  window.addEventListener('load', hookNavigation, { once: true });

  /* ─────────────── DEBUG API ─────────────── */
  window.ELLOUL_STORE = {
    products: function() { return PRODUCTS.slice(); },
    cart: function() { return cart.slice(); },
    favs: function() { return favs.slice(); },
    render: {
      home: renderHome,
      shop: renderShop,
      cart: renderCart,
      chips: renderShopCats
    },
    state: function() {
      return {
        homeRendered: homeRendered,
        shopRendered: shopRendered,
        filter: shopFilter,
        query: shopQuery
      };
    },
    invalidate: function() {
      homeRendered = false;
      shopRendered = false;
      console.log('%c🔄 تم إبطال حالة الصفحات — ستُعاد عند الزيارة القادمة', 'color:#10b981;');
    }
  };

})();