/* Admin panel — local-only (for prototype). Ready to map to WordPress later.
   Access control: PIN prompt. This is NOT real security (static), but blocks casual users.
*/
const ST = window.__ST__;
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

function escapeHtml(s=""){
  return String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function fileToDataUrl(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = ()=>resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function adminView(){
  const st = ST.getState();
  return `
  <div class="form">
    <div class="notice" style="margin-bottom:12px">
      <div class="notice__title">⚠️ ملاحظة</div>
      <div class="notice__desc">هذه لوحة إدارة محلية (Prototype). عند التحويل إلى WordPress ستصبح آمنة ومتكاملة.</div>
    </div>

    <div class="form__row">
      <label>رمز الإدارة (PIN)</label>
      <div class="rowflex">
        <input id="adminPinInput" placeholder="مثال: 2484" value="${escapeHtml(st.settings.adminPin||"2484")}" />
        <button class="btn btn--ghost" id="savePinBtn">حفظ</button>
      </div>
      <div class="hint">هذا يمنع الدخول العشوائي فقط (ليس حماية حقيقية).</div>
    </div>

    <div class="form__row">
      <label>اسم المتجر</label>
      <input id="storeNameInput" value="${escapeHtml(st.settings.storeName||"")}" />
    </div>

    <div class="form__row">
      <label>تشغيل/إغلاق المتجر</label>
      <select id="storeOpenSelect">
        <option value="true" ${st.settings.isOpen ? "selected":""}>مفتوح</option>
        <option value="false" ${!st.settings.isOpen ? "selected":""}>مغلق</option>
      </select>
    </div>

    <div class="form__row">
      <label>رابط مشاركة تيليجرام</label>
      <input id="tgShareInput" value="${escapeHtml(st.settings.telegramShare||"")}" />
      <div class="hint">افتراضيًا يستخدم تليجرام مشاركة: https://t.me/share/url?url=&text=</div>
    </div>

    <div class="form__row">
      <label>Telegram Relay URL (اختياري)</label>
      <input id="tgRelayInput" value="${escapeHtml(st.settings.telegramRelayUrl||"")}" placeholder="https://example.com/telegram-relay" />
      <div class="hint">إذا وفرت سيرفر لاحقًا، ضع الرابط هنا ليتم الإرسال تلقائيًا بدون مشاركة.</div>
    </div>

    <div class="form__row">
      <label>الشعار (رفع صورة)</label>
      <input type="file" id="logoFile" accept="image/*" />
      <div class="hint">سيتحفظ محليًا (Base64) لأغراض المعاينة.</div>
    </div>

    <hr style="border-color:rgba(255,255,255,.08)">

    <div class="form__row">
      <label>البنرات (Landscape)</label>
      <input type="file" id="bannerFile" accept="image/*" />
      <button class="btn btn--primary" id="addBannerBtn">إضافة بنر</button>
      <div class="hint">يُفضّل صور 1600×600.</div>
    </div>

    <div id="bannersList"></div>

    <hr style="border-color:rgba(255,255,255,.08)">

    <div class="form__row">
      <label>إضافة منتج</label>
      <input id="pName" placeholder="اسم المنتج" />
      <input id="pPrice" inputmode="decimal" placeholder="السعر (ريال)" />
      <input id="pCat" placeholder="التصنيف (مثال: فحم)" />
      <input type="file" id="pImg" accept="image/*" />
      <div class="rowflex">
        <button class="btn btn--primary" id="addProductBtn">إضافة</button>
        <button class="btn btn--ghost" id="resetProductsBtn">إعادة ضبط (تجريبي)</button>
      </div>
    </div>

    <div id="productsList"></div>

    <hr style="border-color:rgba(255,255,255,.08)">

    <div class="form__row">
      <label>الأحياء وأسعار التوصيل</label>
      <div class="rowflex">
        <input id="dName" placeholder="اسم الحي" />
        <input id="dFee" inputmode="decimal" placeholder="سعر التوصيل" />
      </div>
      <button class="btn btn--primary" id="addDistrictBtn">إضافة حي</button>
    </div>
    <div id="districtsList"></div>

    <hr style="border-color:rgba(255,255,255,.08)">

    <div class="form__row">
      <label>الطلبات (محلي)</label>
      <div class="hint">تغيير الحالة إلى "مكتمل" يمنح العميل خصم 5% للطلب القادم عند فتح رابط التتبع.</div>
    </div>
    <div id="ordersList"></div>
  </div>
  `;
}

function requirePin(){
  const st = ST.getState();
  const entered = prompt("رمز الإدارة (PIN):");
  if(entered == null) return false;
  if(String(entered).trim() !== String(st.settings.adminPin||"2484")){
    ST.toast("رمز غير صحيح");
    return false;
  }
  return true;
}

function renderAdmin(){
  const body = document.getElementById("adminBody");
  body.innerHTML = adminView();

  const st = ST.getState();

  // Apply saved logo if exists
  if(st.settings.logoDataUrl){
    const img = document.getElementById("brandLogo");
    if(img) img.src = st.settings.logoDataUrl;
  }

  // Settings saves
  document.getElementById("savePinBtn").addEventListener("click", ()=>{
    const pin = document.getElementById("adminPinInput").value.trim() || "2484";
    st.settings.adminPin = pin;
    ST.setState({settings: st.settings});
    ST.toast("تم حفظ الرمز");
  });

  document.getElementById("storeNameInput").addEventListener("input", (e)=>{
    st.settings.storeName = e.target.value;
    ST.setState({settings: st.settings});
  });

  document.getElementById("storeOpenSelect").addEventListener("change", (e)=>{
    st.settings.isOpen = (e.target.value === "true");
    ST.setState({settings: st.settings});
    ST.toast(st.settings.isOpen ? "المتجر مفتوح" : "المتجر مغلق");
  });

  document.getElementById("tgShareInput").addEventListener("input", (e)=>{
    st.settings.telegramShare = e.target.value;
    ST.setState({settings: st.settings});
  });

  document.getElementById("tgRelayInput").addEventListener("input", (e)=>{
    st.settings.telegramRelayUrl = e.target.value;
    ST.setState({settings: st.settings});
  });

  document.getElementById("logoFile").addEventListener("change", async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    const data = await fileToDataUrl(f);
    st.settings.logoDataUrl = data;
    ST.setState({settings: st.settings});
    const img = document.getElementById("brandLogo");
    if(img) img.src = data;
    ST.toast("تم تحديث الشعار");
  });

  // Banners list
  function renderBannersList(){
    const list = document.getElementById("bannersList");
    list.innerHTML = "";
    st.banners.forEach((b, idx)=>{
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="item__img"><img src="${b.image}" alt=""></div>
        <div class="item__meta">
          <div class="item__name">${escapeHtml(b.title||"بنر")}</div>
          <div class="item__sub">${escapeHtml(b.subtitle||"")}</div>
          <div class="item__sub">مفعّل: ${b.enabled !== false ? "نعم":"لا"}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px">
          <button class="btn btn--ghost" data-togglebanner="${b.id}">${b.enabled !== false ? "إيقاف":"تفعيل"}</button>
          <button class="btn btn--ghost" data-up="${b.id}">↑</button>
          <button class="btn btn--ghost" data-down="${b.id}">↓</button>
          <button class="btn btn--danger" data-delbanner="${b.id}">حذف</button>
        </div>
      `;
      list.appendChild(row);
    });

    $$("[data-togglebanner]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-togglebanner");
        const b = st.banners.find(x=>x.id===id);
        if(!b) return;
        b.enabled = !(b.enabled !== false);
        ST.setState({banners: st.banners});
        renderBannersList();
      });
    });
    $$("[data-delbanner]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-delbanner");
        st.banners = st.banners.filter(x=>x.id!==id);
        ST.setState({banners: st.banners});
        renderBannersList();
      });
    });
    $$("[data-up]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-up");
        const i = st.banners.findIndex(x=>x.id===id);
        if(i>0){
          const tmp = st.banners[i-1]; st.banners[i-1]=st.banners[i]; st.banners[i]=tmp;
          ST.setState({banners: st.banners}); renderBannersList();
        }
      });
    });
    $$("[data-down]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-down");
        const i = st.banners.findIndex(x=>x.id===id);
        if(i>=0 && i<st.banners.length-1){
          const tmp = st.banners[i+1]; st.banners[i+1]=st.banners[i]; st.banners[i]=tmp;
          ST.setState({banners: st.banners}); renderBannersList();
        }
      });
    });
  }
  renderBannersList();

  document.getElementById("addBannerBtn").addEventListener("click", async ()=>{
    const f = document.getElementById("bannerFile").files?.[0];
    if(!f){ ST.toast("اختر صورة"); return; }
    const data = await fileToDataUrl(f);
    st.banners.unshift({
      id: "b" + Date.now(),
      title: "بنر جديد",
      subtitle: "وصف مختصر",
      image: data,
      enabled: true
    });
    ST.setState({banners: st.banners});
    document.getElementById("bannerFile").value = "";
    renderBannersList();
    ST.toast("تمت إضافة البنر");
  });

  // Products list
  function renderProductsList(){
    const list = document.getElementById("productsList");
    list.innerHTML = "";
    st.products.forEach(p=>{
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="item__img"><img src="${p.image||""}" alt=""></div>
        <div class="item__meta">
          <div class="item__name">${escapeHtml(p.name)}</div>
          <div class="item__sub">${escapeHtml(p.cat||"")} • ${p.best?"🔥 الأكثر":""} ${p.featured?"⭐ مميز":""}</div>
          <div class="item__sub">${p.stock===0?"نفد":"متوفر"} • ${escapeHtml(String(p.price))} ريال</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px">
          <button class="btn btn--ghost" data-togglebest="${p.id}">${p.best?"إلغاء الأكثر":"جعله الأكثر"}</button>
          <button class="btn btn--ghost" data-togglefeat="${p.id}">${p.featured?"إلغاء المميز":"جعله مميز"}</button>
          <button class="btn btn--ghost" data-togglestock="${p.id}">${p.stock===0?"إعادة توفر":"نفاد"}</button>
          <button class="btn btn--danger" data-delprod="${p.id}">حذف</button>
        </div>
      `;
      list.appendChild(row);
    });

    $$("[data-delprod]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-delprod");
        st.products = st.products.filter(x=>x.id!==id);
        ST.setState({products: st.products});
        renderProductsList();
      });
    });

    $$("[data-togglebest]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-togglebest");
        const p = st.products.find(x=>x.id===id);
        if(!p) return;
        p.best = !p.best;
        ST.setState({products: st.products});
        renderProductsList();
      });
    });

    $$("[data-togglefeat]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-togglefeat");
        const p = st.products.find(x=>x.id===id);
        if(!p) return;
        p.featured = !p.featured;
        ST.setState({products: st.products});
        renderProductsList();
      });
    });

    $$("[data-togglestock]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-togglestock");
        const p = st.products.find(x=>x.id===id);
        if(!p) return;
        p.stock = (p.stock===0) ? 99 : 0;
        ST.setState({products: st.products});
        renderProductsList();
      });
    });
  }
  renderProductsList();

  document.getElementById("addProductBtn").addEventListener("click", async ()=>{
    const name = document.getElementById("pName").value.trim();
    const price = Number(document.getElementById("pPrice").value);
    const cat = document.getElementById("pCat").value.trim() || "عام";
    const imgFile = document.getElementById("pImg").files?.[0];
    if(!name || !Number.isFinite(price)){
      ST.toast("أدخل الاسم والسعر");
      return;
    }
    const img = imgFile ? await fileToDataUrl(imgFile) : "./assets/images/banner1.svg";
    st.products.unshift({ id:"p"+Date.now(), name, price, cat, image: img, featured:false, best:false, stock: 99 });
    ST.setState({products: st.products});
    document.getElementById("pName").value="";
    document.getElementById("pPrice").value="";
    document.getElementById("pCat").value="";
    document.getElementById("pImg").value="";
    renderProductsList();
    ST.toast("تمت إضافة المنتج");
  });

  document.getElementById("resetProductsBtn").addEventListener("click", ()=>{
    st.products = ST.DEFAULTS.products;
    ST.setState({products: st.products});
    renderProductsList();
    ST.toast("تمت إعادة الضبط");
  });

  // Districts
  function renderDistricts(){
    const list = document.getElementById("districtsList");
    list.innerHTML = "";
    st.districts.forEach(d=>{
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="item__meta">
          <div class="item__name">${escapeHtml(d.name)}</div>
          <div class="item__sub">${escapeHtml(String(d.fee))} ريال</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px">
          <button class="btn btn--danger" data-deld="${d.id}">حذف</button>
        </div>
      `;
      list.appendChild(row);
    });
    $$("[data-deld]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-deld");
        st.districts = st.districts.filter(x=>x.id!==id);
        ST.setState({districts: st.districts});
        renderDistricts();
      });
    });
  }
  renderDistricts();

  document.getElementById("addDistrictBtn").addEventListener("click", ()=>{
    const name = document.getElementById("dName").value.trim();
    const fee = Number(document.getElementById("dFee").value);
    if(!name || !Number.isFinite(fee)){ ST.toast("أدخل الحي والسعر"); return; }
    st.districts.push({id:"d"+Date.now(), name, fee});
    ST.setState({districts: st.districts});
    document.getElementById("dName").value="";
    document.getElementById("dFee").value="";
    renderDistricts();
    ST.toast("تمت إضافة الحي");
  });

  // Orders
  function renderOrders(){
    const list = document.getElementById("ordersList");
    list.innerHTML = "";
    if(!st.orders.length){
      list.innerHTML = `<div class="empty">لا توجد طلبات بعد.</div>`;
      return;
    }
    st.orders.slice(0,30).forEach(o=>{
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="item__meta">
          <div class="item__name">${escapeHtml(o.id)} • ${escapeHtml(o.name)}</div>
          <div class="item__sub">${escapeHtml(o.status)} • ${escapeHtml(o.districtName||"")}</div>
          <div class="item__sub">الإجمالي: ${escapeHtml(String(o.grand))} ريال</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px">
          <button class="btn btn--ghost" data-st="${o.id}" data-to="قيد التجهيز">قيد التجهيز</button>
          <button class="btn btn--ghost" data-st="${o.id}" data-to="في الطريق">في الطريق</button>
          <button class="btn btn--primary" data-st="${o.id}" data-to="مكتمل">مكتمل</button>
          <button class="btn btn--danger" data-delorder="${o.id}">حذف</button>
        </div>
      `;
      list.appendChild(row);
    });

    $$("[data-st]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-st");
        const to = btn.getAttribute("data-to");
        const ord = st.orders.find(x=>x.id===id);
        if(!ord) return;
        ord.status = to;
        ST.setState({orders: st.orders});
        renderOrders();
        ST.toast("تم تحديث الحالة");
      });
    });

    $$("[data-delorder]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-delorder");
        st.orders = st.orders.filter(x=>x.id!==id);
        ST.setState({orders: st.orders});
        renderOrders();
        ST.toast("تم حذف الطلب");
      });
    });
  }
  renderOrders();
}

function onAdminOpen(){
  if(!requirePin()) return;
  renderAdmin();
}

// Hook into opening admin modal
document.addEventListener("click", (e)=>{
  const t = e.target;
  if(t && t.id === "bbAdmin"){
    setTimeout(onAdminOpen, 50);
  }
});
