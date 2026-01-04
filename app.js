/* Shisha Time — Static prototype (ready for WordPress mapping later)
   Storage: localStorage only (products, banners, settings, cart, favorites, orders)
*/
const STORAGE = {
  settings: "st_settings_v1",
  products: "st_products_v1",
  banners: "st_banners_v1",
  districts: "st_districts_v1",
  cart: "st_cart_v1",
  fav: "st_fav_v1",
  wheel: "st_wheel_v1",
  orders: "st_orders_v1",
  coupon: "st_coupon_v1",
};

const DEFAULTS = {
  settings: {
    storeName: "Shisha Time",
    whatsapp: "00966566700298",
    mapBase: "https://maps.google.com/?q=",
    telegramShare: "https://t.me/share/url?url=&text=",
    telegramRelayUrl: "", // optional server relay endpoint (POST) for real Telegram send later
    isOpen: true,
    adminPin: "2484",
    theme: { purple: "#8b5cf6", gold: "#f4c06b" }
  },
  banners: [
    { id: "b1", title: "توصيل فاخر داخل الرياض", subtitle: "اطلب الآن — تجربة فخمة وسريعة", image: "./assets/images/banner1.svg", enabled: true },
    { id: "b2", title: "خصم 5% عند 100 ريال+", subtitle: "لف عجلة الحظ واستمتع بالعرض", image: "./assets/images/banner2.svg", enabled: true },
    { id: "b3", title: "الأكثر مبيعاً", subtitle: "منتجات مختارة بعناية", image: "./assets/images/banner3.svg", enabled: true },
  ],
  districts: [
    { id: "d1", name: "الملز", fee: 12 },
    { id: "d2", name: "العليا", fee: 18 },
    { id: "d3", name: "الروضة", fee: 15 },
    { id: "d4", name: "النسيم", fee: 14 },
  ],
  products: [
    { id: "p1", name: "فحم مكعبات", price: 35, cat: "فحم", image: "./assets/images/banner1.svg", featured: true, best: true, stock: 999 },
    { id: "p2", name: "رأس سيليكون", price: 25, cat: "إكسسوارات", image: "./assets/images/banner3.svg", featured: false, best: true, stock: 50 },
    { id: "p3", name: "نكهة تفاحتين", price: 45, cat: "نكهات", image: "./assets/images/banner2.svg", featured: true, best: false, stock: 30 },
    { id: "p4", name: "بكج فاخر", price: 120, cat: "بكجات", image: "./assets/images/banner2.svg", featured: true, best: true, stock: 10 },
    { id: "p5", name: "ملاقط فحم", price: 18, cat: "إكسسوارات", image: "./assets/images/banner1.svg", featured: false, best: false, stock: 999 },
    { id: "p6", name: "نكهة عنب نعناع", price: 45, cat: "نكهات", image: "./assets/images/banner3.svg", featured: false, best: true, stock: 40 },
  ],
};

// --------- Helpers ----------
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
const fmt = (n) => (Math.round((Number(n)||0)*100)/100).toLocaleString("ar-SA");
const nowId = () => {
  const d = new Date();
  const y = d.getFullYear();
  const seq = String(Math.floor(Math.random()*9000)+1000);
  return `ST-${y}-${seq}`;
};
const safeJson = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
const load = (k, fallback) => safeJson(localStorage.getItem(k), fallback);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function ensureDefaults(){
  if(!localStorage.getItem(STORAGE.settings)) save(STORAGE.settings, DEFAULTS.settings);
  if(!localStorage.getItem(STORAGE.products)) save(STORAGE.products, DEFAULTS.products);
  if(!localStorage.getItem(STORAGE.banners)) save(STORAGE.banners, DEFAULTS.banners);
  if(!localStorage.getItem(STORAGE.districts)) save(STORAGE.districts, DEFAULTS.districts);
  if(!localStorage.getItem(STORAGE.cart)) save(STORAGE.cart, []);
  if(!localStorage.getItem(STORAGE.fav)) save(STORAGE.fav, []);
  if(!localStorage.getItem(STORAGE.wheel)) save(STORAGE.wheel, { applied:false, discountPct:0 });
  if(!localStorage.getItem(STORAGE.orders)) save(STORAGE.orders, []);
  if(!localStorage.getItem(STORAGE.coupon)) save(STORAGE.coupon, { nextOrderPct: 0 });
}

ensureDefaults();

let state = {
  settings: load(STORAGE.settings, DEFAULTS.settings),
  products: load(STORAGE.products, DEFAULTS.products),
  banners: load(STORAGE.banners, DEFAULTS.banners),
  districts: load(STORAGE.districts, DEFAULTS.districts),
  cart: load(STORAGE.cart, []), // [{id, qty}]
  fav: load(STORAGE.fav, []), // [id]
  wheel: load(STORAGE.wheel, { applied:false, discountPct:0 }),
  orders: load(STORAGE.orders, []),
  coupon: load(STORAGE.coupon, { nextOrderPct: 0 }),
  filterCat: "الكل",
  search: "",
  bannerIndex: 0,
  bannerTimer: null,
};

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toast._tm);
  toast._tm = setTimeout(()=>t.classList.remove("is-on"), 1600);
}

function setRootTheme(){
  document.documentElement.style.setProperty("--purple", state.settings.theme.purple);
  document.documentElement.style.setProperty("--gold", state.settings.theme.gold);
  $("#storeName").textContent = state.settings.storeName || "Shisha Time";
  $("#storeNotice").style.opacity = state.settings.isOpen ? "1" : "0.9";
  if(!state.settings.isOpen){
    $("#storeNotice").innerHTML = `<div class="notice__title">⛔ المتجر مغلق</div><div class="notice__desc">الطلبات متوقفة مؤقتًا. تواصل معنا على الواتساب.</div>`;
  }
}

function cartCount(){ return state.cart.reduce((s,i)=>s+i.qty,0); }
function favCount(){ return state.fav.length; }
function cartLines(){
  const map = new Map(state.products.map(p=>[p.id,p]));
  return state.cart.map(ci => ({...ci, p: map.get(ci.id)})).filter(x=>x.p);
}
function cartSubtotal(){
  return cartLines().reduce((s,x)=>s + x.p.price*x.qty, 0);
}
function wheelDiscountAmount(subtotal){
  const pct = state.wheel.applied ? (state.wheel.discountPct||0) : 0;
  return subtotal * (pct/100);
}

function updateBadges(){
  $("#cartBadge").textContent = cartCount();
  $("#favBadge").textContent = favCount();
}

function openDrawer(which){
  const el = which==="cart" ? $("#cartDrawer") : $("#favDrawer");
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
}
function closeDrawer(which){
  const el = which==="cart" ? $("#cartDrawer") : $("#favDrawer");
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
}
function openModal(which){
  const el = {
    wheel: $("#wheelModal"),
    checkout: $("#checkoutModal"),
    track: $("#trackModal"),
    admin: $("#adminModal"),
  }[which];
  el.classList.add("is-open");
  el.setAttribute("aria-hidden","false");
}
function closeModal(which){
  const el = {
    wheel: $("#wheelModal"),
    checkout: $("#checkoutModal"),
    track: $("#trackModal"),
    admin: $("#adminModal"),
  }[which];
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden","true");
}

function renderBanners(){
  const enabled = state.banners.filter(b=>b.enabled !== false);
  const track = $("#bannerTrack");
  const dots = $("#bannerDots");
  track.innerHTML = "";
  dots.innerHTML = "";
  enabled.forEach((b, idx)=>{
    const slide = document.createElement("div");
    slide.className = "banner";
    slide.innerHTML = `
      <img src="${b.image}" alt="${b.title}">
      <div class="banner__overlay"></div>
      <div class="banner__content">
        <div class="banner__title">${b.title||""}</div>
        <div class="banner__sub">${b.subtitle||""}</div>
      </div>`;
    track.appendChild(slide);

    const dot = document.createElement("div");
    dot.className = "dot" + (idx===state.bannerIndex ? " is-active" : "");
    dot.addEventListener("click", ()=>{ state.bannerIndex = idx; applyBannerTransform(); });
    dots.appendChild(dot);
  });
  applyBannerTransform();
  if(state.bannerTimer) clearInterval(state.bannerTimer);
  state.bannerTimer = setInterval(()=>{
    const count = enabled.length || 1;
    state.bannerIndex = (state.bannerIndex + 1) % count;
    applyBannerTransform();
  }, 4500);
}
function applyBannerTransform(){
  const enabled = state.banners.filter(b=>b.enabled !== false);
  const count = enabled.length || 1;
  const idx = Math.min(state.bannerIndex, count-1);
  $("#bannerTrack").style.transform = `translateX(${idx * 100}%)`;
  // Because RTL, translateX positive moves left; we want slide. We'll flip:
  $("#bannerTrack").style.transform = `translateX(${idx * 100}%)`;
  // better: use negative
  $("#bannerTrack").style.transform = `translateX(${idx * -100}%)`;
  $$("#bannerDots .dot").forEach((d,i)=>d.classList.toggle("is-active", i===idx));
}

function categories(){
  const cats = ["الكل", ...new Set(state.products.map(p=>p.cat).filter(Boolean))];
  return cats;
}
function renderChips(){
  const wrap = $("#categoryChips");
  wrap.innerHTML = "";
  categories().forEach(cat=>{
    const b = document.createElement("button");
    b.className = "chip" + (state.filterCat===cat ? " is-active" : "");
    b.textContent = cat;
    b.addEventListener("click", ()=>{
      state.filterCat = cat;
      renderChips();
      renderProducts();
    });
    wrap.appendChild(b);
  });
}

function isFav(id){ return state.fav.includes(id); }

function renderProducts(){
  const grid = $("#productsGrid");
  let items = [...state.products];

  // boost featured/best visually by ordering
  items.sort((a,b)=> (b.best?1:0) - (a.best?1:0) || (b.featured?1:0)-(a.featured?1:0));

  if(state.filterCat !== "الكل"){
    items = items.filter(p=>p.cat === state.filterCat);
  }
  if(state.search.trim()){
    const s = state.search.trim();
    items = items.filter(p => (p.name||"").includes(s) || (p.cat||"").includes(s));
  }

  grid.innerHTML = "";
  if(items.length===0){
    $("#emptyState").hidden = false;
    return;
  }
  $("#emptyState").hidden = true;

  items.forEach(p=>{
    const card = document.createElement("div");
    card.className = "card";
    const tag = p.best ? "🔥 الأكثر" : (p.featured ? "⭐ مميز" : (p.stock===0 ? "❌ نفد" : ""));
    const stockLine = p.stock===0 ? "نفد من المخزون" : (p.stock<10 ? `متبقي ${p.stock}` : "متوفر");
    card.innerHTML = `
      <button class="heart ${isFav(p.id) ? "is-on":""}" data-fav="${p.id}" title="مفضلة"><span>${isFav(p.id)?"❤":"♡"}</span></button>
      <div class="pimg">
        <img src="${p.image||"./assets/images/banner1.svg"}" alt="${p.name}">
        ${tag?`<div class="ptag">${tag}</div>`:""}
      </div>
      <div class="pbody">
        <p class="pname">${p.name}</p>
        <div class="pmeta">
          <div class="price">${fmt(p.price)} ريال</div>
          <div class="small">${stockLine}</div>
        </div>
        <div class="row">
          <button class="btn btn--primary" data-add="${p.id}" ${p.stock===0?"disabled":""}>إضافة</button>
          <button class="btn btn--ghost" data-share="${p.id}">مشاركة</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // bind actions
  $$("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addToCart(btn.getAttribute("data-add"));
    });
  });
  $$("[data-fav]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      toggleFav(btn.getAttribute("data-fav"));
    });
  });
  $$("[data-share]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-share");
      const p = state.products.find(x=>x.id===id);
      if(!p) return;
      const url = location.href.split("#")[0];
      const text = `Shisha Time — ${p.name} بسعر ${fmt(p.price)} ريال`;
      navigator.share ? navigator.share({title:"Shisha Time", text, url}) : (navigator.clipboard.writeText(`${text}\n${url}`), toast("تم نسخ رابط المشاركة"));
    });
  });
}

function addToCart(id){
  const p = state.products.find(x=>x.id===id);
  if(!p || p.stock===0) return toast("غير متوفر");
  const existing = state.cart.find(x=>x.id===id);
  if(existing) existing.qty += 1;
  else state.cart.push({id, qty:1});
  save(STORAGE.cart, state.cart);
  updateBadges();
  renderCart();
  toast("تمت الإضافة للسلة");
}

function changeQty(id, delta){
  const it = state.cart.find(x=>x.id===id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) state.cart = state.cart.filter(x=>x.id!==id);
  save(STORAGE.cart, state.cart);
  updateBadges();
  renderCart();
}

function toggleFav(id){
  if(state.fav.includes(id)) state.fav = state.fav.filter(x=>x!==id);
  else state.fav.push(id);
  save(STORAGE.fav, state.fav);
  updateBadges();
  renderProducts();
  renderFav();
  toast(state.fav.includes(id) ? "أضيف للمفضلة" : "أزيل من المفضلة");
}

function renderCart(){
  const wrap = $("#cartItems");
  const lines = cartLines();
  if(lines.length===0){
    wrap.innerHTML = `<div class="empty">السلة فارغة</div>`;
  } else {
    wrap.innerHTML = "";
    lines.forEach(x=>{
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="item__img"><img src="${x.p.image||"./assets/images/banner1.svg"}" alt=""></div>
        <div class="item__meta">
          <div class="item__name">${x.p.name}</div>
          <div class="item__sub">${fmt(x.p.price)} ريال</div>
        </div>
        <div class="qty">
          <button data-dec="${x.p.id}">−</button>
          <b>${x.qty}</b>
          <button data-inc="${x.p.id}">+</button>
        </div>
      `;
      wrap.appendChild(el);
    });
    $$("[data-dec]", wrap).forEach(b=>b.addEventListener("click", ()=>changeQty(b.getAttribute("data-dec"), -1)));
    $$("[data-inc]", wrap).forEach(b=>b.addEventListener("click", ()=>changeQty(b.getAttribute("data-inc"), +1)));
  }

  const subtotal = cartSubtotal();
  const disc = wheelDiscountAmount(subtotal);
  $("#cartTotal").textContent = `${fmt(subtotal)} ريال`;
  $("#cartDiscount").textContent = `${fmt(disc)} ريال`;
  $("#cartAfterDiscount").textContent = `${fmt(subtotal - disc)} ريال`;

  updateCheckoutSummary();
}

function renderFav(){
  const wrap = $("#favItems");
  const items = state.products.filter(p=>state.fav.includes(p.id));
  if(items.length===0){
    wrap.innerHTML = `<div class="empty">لا توجد مفضلة بعد.</div>`;
    return;
  }
  wrap.innerHTML = "";
  items.forEach(p=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item__img"><img src="${p.image||"./assets/images/banner1.svg"}" alt=""></div>
      <div class="item__meta">
        <div class="item__name">${p.name}</div>
        <div class="item__sub">${fmt(p.price)} ريال</div>
      </div>
      <button class="btn btn--primary" data-addfav="${p.id}">إضافة</button>
    `;
    wrap.appendChild(el);
  });
  $$("[data-addfav]", wrap).forEach(b=>b.addEventListener("click", ()=>addToCart(b.getAttribute("data-addfav"))));
}

function eligibleForWheel(){
  return cartSubtotal() >= 100 && !state.wheel.applied;
}

function openWheel(){
  openModal("wheel");
  $("#wheelMsg").textContent = eligibleForWheel() ? "جاهز! لف العجلة." : "أضف للسلة حتى يصل المجموع 100 ريال+";
}

let spinning = false;
function spinWheel(){
  if(spinning) return;
  if(!eligibleForWheel()) return $("#wheelMsg").textContent = "غير مؤهل الآن. المجموع لازم 100 ريال+";
  spinning = true;
  // Always land on 5% slice visually
  const rot = 360*5 + 10; // deterministic-ish
  $("#wheel").style.transform = `rotate(${rot}deg)`;
  $("#wheelMsg").textContent = "جاري...";
  setTimeout(()=>{
    state.wheel = { applied:true, discountPct: 5 };
    save(STORAGE.wheel, state.wheel);
    $("#wheelMsg").textContent = "🎉 مبروك! خصم 5% تم تطبيقه.";
    renderCart();
    updateCheckoutSummary();
    toast("تم تطبيق خصم 5%");
    spinning = false;
  }, 2800);
}

function populateDistricts(){
  const sel = $("#cDistrict");
  sel.innerHTML = "";
  state.districts.forEach(d=>{
    const o = document.createElement("option");
    o.value = d.id;
    o.textContent = `${d.name} — ${fmt(d.fee)} ريال`;
    sel.appendChild(o);
  });
  sel.addEventListener("change", updateCheckoutSummary);
  if(state.districts[0]) sel.value = state.districts[0].id;
}

function currentDeliveryFee(){
  const id = $("#cDistrict").value;
  const d = state.districts.find(x=>x.id===id);
  return d ? Number(d.fee)||0 : 0;
}

function updateCheckoutSummary(){
  const subtotal = cartSubtotal();
  const disc = wheelDiscountAmount(subtotal) + (state.coupon.nextOrderPct ? subtotal*(state.coupon.nextOrderPct/100) : 0);
  const delivery = currentDeliveryFee();
  const grand = Math.max(0, subtotal - disc) + delivery;

  $("#sumTotal").textContent = `${fmt(subtotal)} ريال`;
  $("#sumDiscount").textContent = `${fmt(disc)} ريال`;
  $("#sumDelivery").textContent = `${fmt(delivery)} ريال`;
  $("#sumGrand").textContent = `${fmt(grand)} ريال`;

  const d = state.districts.find(x=>x.id===$("#cDistrict").value);
  $("#deliveryHint").textContent = d ? `سعر توصيل الحي: ${fmt(d.fee)} ريال` : "";
}

async function getLocation(){
  if(!navigator.geolocation){
    toast("جهازك لا يدعم تحديد الموقع");
    return;
  }
  $("#locBtn").disabled = true;
  $("#locBtn").textContent = "جاري تحديد الموقع...";
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const link = `https://maps.google.com/?q=${lat},${lng}`;
    $("#mapLink").href = link;
    // Reverse geocode via OSM Nominatim (no key)
    try{
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const r = await fetch(url, {headers: {"Accept":"application/json"}});
      const j = await r.json();
      const addr = j.display_name || `${lat},${lng}`;
      $("#cAddress").value = addr;
      toast("تم تحديد الموقع");
    } catch {
      $("#cAddress").value = `${lat},${lng}`;
      toast("تم تحديد الإحداثيات");
    } finally {
      $("#locBtn").disabled = false;
      $("#locBtn").textContent = "📍 تحديد موقعي";
    }
  }, ()=>{
    $("#locBtn").disabled = false;
    $("#locBtn").textContent = "📍 تحديد موقعي";
    toast("لم يتم السماح بالموقع");
  }, {enableHighAccuracy:true, timeout:8000});
}

function buildOrderMessage(order){
  const items = order.items.map(i=>`- ${i.name} × ${i.qty} = ${fmt(i.price*i.qty)} ريال`).join("\n");
  const msg =
`🛎 طلب جديد — ${state.settings.storeName}
رقم الطلب: ${order.id}

👤 الاسم: ${order.name}
📞 الجوال: ${order.phone}

📦 الطلب:
${items}

🏘 الحي: ${order.districtName}
📍 العنوان: ${order.addressText || "-"}
🗺 رابط الخريطة: ${order.addressLink || "-"}

🎁 الخصم: ${fmt(order.discount)} ريال
🚚 التوصيل: ${fmt(order.delivery)} ريال
💰 الإجمالي النهائي: ${fmt(order.grand)} ريال

الحالة: جديد`;
  return msg;
}

async function placeOrder(){
  if(!state.settings.isOpen){
    toast("المتجر مغلق");
    return;
  }
  if(cartCount()===0){
    toast("السلة فارغة");
    openDrawer("cart");
    return;
  }
  const name = $("#cName").value.trim();
  const phone = $("#cPhone").value.trim();
  if(!name || !phone){
    toast("أدخل الاسم والجوال");
    return;
  }
  const dId = $("#cDistrict").value;
  const district = state.districts.find(x=>x.id===dId);
  const addressText = $("#cAddress").value.trim();
  const addressLink = ($("#mapLink").href && $("#mapLink").href !== "#") ? $("#mapLink").href : "";

  const subtotal = cartSubtotal();
  const wheelDisc = wheelDiscountAmount(subtotal);
  const couponDisc = state.coupon.nextOrderPct ? subtotal*(state.coupon.nextOrderPct/100) : 0;
  const discount = wheelDisc + couponDisc;
  const delivery = district ? Number(district.fee)||0 : 0;
  const grand = Math.max(0, subtotal - discount) + delivery;

  const map = new Map(state.products.map(p=>[p.id,p]));
  const items = state.cart.map(ci => ({...ci, ...map.get(ci.id)})).filter(x=>x.id).map(x=>({id:x.id,name:x.name,price:x.price,qty:x.qty}));

  const order = {
    id: nowId(),
    createdAt: new Date().toISOString(),
    status: "جديد",
    name, phone,
    districtId: dId,
    districtName: district ? district.name : "",
    addressText, addressLink,
    items,
    subtotal, discount, delivery, grand,
  };

  // store orders locally
  state.orders.unshift(order);
  save(STORAGE.orders, state.orders);

  // reset next-order coupon after use
  if(state.coupon.nextOrderPct){
    state.coupon.nextOrderPct = 0;
    save(STORAGE.coupon, state.coupon);
  }

  // clear cart but keep wheel discount tied to order only; reset for next cart
  state.cart = [];
  save(STORAGE.cart, state.cart);
  state.wheel = { applied:false, discountPct:0 };
  save(STORAGE.wheel, state.wheel);

  updateBadges();
  renderCart();
  renderProducts();

  const msg = buildOrderMessage(order);

  // Sending strategy:
  // 1) If relay URL set -> POST JSON (server will send Telegram)
  // 2) Else open Telegram share (works without CORS/API keys)
  $("#placeOrderBtn").disabled = true;
  $("#placeOrderHint").textContent = "جاري الإرسال...";
  try{
    if(state.settings.telegramRelayUrl){
      const r = await fetch(state.settings.telegramRelayUrl, {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({message: msg, order})
      });
      if(!r.ok) throw new Error("relay failed");
      toast("تم إرسال الطلب (Relay)");
    } else {
      const shareUrl = state.settings.telegramShare + encodeURIComponent(msg);
      window.open(shareUrl, "_blank");
      toast("تم فتح تيليجرام لإرسال الطلب");
    }
  } catch {
    // fallback: copy
    await navigator.clipboard?.writeText(msg);
    toast("تعذر الإرسال — تم نسخ الرسالة");
  } finally {
    $("#placeOrderBtn").disabled = false;
    $("#placeOrderHint").textContent = `تم إنشاء الطلب: ${order.id} — انسخ الرابط: ${location.href.split('#')[0]}#track=${order.id}`;
  }

  closeModal("checkout");
}

function openCheckout(){
  if(!state.settings.isOpen){ toast("المتجر مغلق"); return; }
  openModal("checkout");
  populateDistricts();
  updateCheckoutSummary();
  $("#placeOrderHint").textContent = "";
}

function findOrder(id){
  return state.orders.find(o=>o.id===id);
}
function renderTrack(id){
  const box = $("#trackBox");
  const o = findOrder(id);
  if(!o){
    box.hidden = false;
    box.innerHTML = `<b>غير موجود</b><div class="muted">تأكد من رقم الطلب.</div>`;
    return;
  }
  box.hidden = false;
  box.innerHTML = `
    <div><b>رقم الطلب:</b> ${o.id}</div>
    <div><b>الحالة:</b> ${o.status}</div>
    <div class="muted">آخر تحديث: ${new Date(o.createdAt).toLocaleString("ar-SA")}</div>
    <hr style="border-color:rgba(255,255,255,.08)">
    <div><b>الإجمالي:</b> ${fmt(o.grand)} ريال</div>
    <div class="muted">العنوان: ${o.addressText || "-"}</div>
    <div class="muted"><a href="${o.addressLink||"#"}" target="_blank" rel="noreferrer" style="color:var(--gold)">فتح الخريطة</a></div>
  `;

  // If status is "مكتمل", award next order coupon 5%
  if(o.status === "مكتمل"){
    state.coupon.nextOrderPct = 5;
    save(STORAGE.coupon, state.coupon);
  }
}

function handleHash(){
  const h = location.hash || "";
  const m = h.match(/track=([^&]+)/);
  if(m){
    const id = decodeURIComponent(m[1]);
    $("#trackId").value = id;
    openModal("track");
    renderTrack(id);
  }
}

function bindUI(){
  $("#btnCart").addEventListener("click", ()=>{ renderCart(); openDrawer("cart"); });
  $("#btnFavorites").addEventListener("click", ()=>{ renderFav(); openDrawer("fav"); });

  document.addEventListener("click", (e)=>{
    const t = e.target;
    if(t?.dataset?.close){
      const which = t.dataset.close;
      if(which==="cart") closeDrawer("cart");
      if(which==="fav") closeDrawer("fav");
      if(which==="wheel") closeModal("wheel");
      if(which==="checkout") closeModal("checkout");
      if(which==="track") closeModal("track");
      if(which==="admin") closeModal("admin");
    }
  });

  $("#bbHome").addEventListener("click", ()=>window.scrollTo({top:0,behavior:"smooth"}));
  $("#bbWheel").addEventListener("click", openWheel);
  $("#bbCheckout").addEventListener("click", openCheckout);
  $("#bbTrack").addEventListener("click", ()=>openModal("track"));
  $("#bbAdmin").addEventListener("click", ()=>openModal("admin"));

  $("#cartGoCheckout").addEventListener("click", ()=>{ closeDrawer("cart"); openCheckout(); });

  $("#spinBtn").addEventListener("click", spinWheel);

  $("#locBtn").addEventListener("click", getLocation);
  $("#placeOrderBtn").addEventListener("click", placeOrder);

  $("#trackBtn").addEventListener("click", ()=>{
    const id = $("#trackId").value.trim();
    renderTrack(id);
  });

  $("#searchInput").addEventListener("input", (e)=>{
    state.search = e.target.value;
    renderProducts();
  });
  $("#searchClear").addEventListener("click", ()=>{
    state.search = "";
    $("#searchInput").value = "";
    renderProducts();
  });

  window.addEventListener("hashchange", handleHash);
}

function init(){
  setRootTheme();
  renderBanners();
  renderChips();
  renderProducts();
  renderCart();
  renderFav();
  updateBadges();
  populateDistricts();
  bindUI();
  handleHash();
}

init();

// Expose to admin.js
window.__ST__ = {
  STORAGE, DEFAULTS,
  getState: ()=>state,
  setState: (patch)=>{
    state = {...state, ...patch};
    // persist known pieces when set
    save(STORAGE.settings, state.settings);
    save(STORAGE.products, state.products);
    save(STORAGE.banners, state.banners);
    save(STORAGE.districts, state.districts);
    save(STORAGE.fav, state.fav);
    save(STORAGE.cart, state.cart);
    save(STORAGE.orders, state.orders);
    save(STORAGE.wheel, state.wheel);
    save(STORAGE.coupon, state.coupon);
    setRootTheme();
    renderBanners();
    renderChips();
    renderProducts();
    renderCart();
    renderFav();
    updateBadges();
    populateDistricts();
  },
  toast,
  fmt
};
