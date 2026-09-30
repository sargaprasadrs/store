/* ============================================================
   Utility Store — ui.js (shell components, search, drawer, toasts)
   Inline SVG icons per UtilixVerse DESIGN.md (no emoji in controls).
   Requires: config.js, data.js, cart.js
   ============================================================ */
(function () {
  "use strict";

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    cart: '<circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    flame: '<path d="M12 22c4.4 0 7-2.8 7-6.7 0-3.3-2.2-5.6-3.8-7.3-.9-.9-1.7-2-2.2-3.5-2.2 1.8-3 4-2.6 6C9 9.6 8.2 8.6 8 7c-2 1.8-3 4.6-3 7 0 4.4 2.6 8 7 8z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    shield: '<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/><path d="m9 11.5 2 2 4-4.5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
  };
  const el = (tag, attrs, html) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (html != null) n.innerHTML = html;
    return n;
  };
  const icon = (name, size) =>
    `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const stars = r => {
    const full = Math.round(Number(r) || 0);
    let s = "";
    for (let i = 1; i <= 5; i++)
      s += `<svg width="12" height="12" viewBox="0 0 24 24" fill="${i <= full ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" style="opacity:${i <= full ? 1 : .4}">${ICONS.star}</svg>`;
    return `<span class="stars" aria-label="${r || 0} out of 5 stars">${s}</span>`;
  };
  const fmtDate = d => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch (_) { return ""; }
  };

  // ---------- Toast ----------
  function toast(msg, iconName) {
    let zone = document.querySelector(".toast-zone");
    if (!zone) { zone = el("div", { class: "toast-zone" }); document.body.appendChild(zone); }
    const t = el("div", { class: "toast", html: icon(iconName || "check", 16) + "<span></span>" });
    t.querySelector("span").textContent = msg;
    zone.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 200ms"; }, 2400);
    setTimeout(() => t.remove(), 2700);
  }

  // ---------- Header ----------
  function renderHeader(active) {
    const cfg = (window.BL && window.BL.data ? window.BL.data.config : {}) || {};
    const header = el("header", { class: "site-header" });
    const inner = el("div", { class: "header-inner" });
    inner.innerHTML = `
      <a class="logo" href="./index.html">
        <span class="logo-mark">${icon("tag", 20)}</span>
        <span>${cfg.siteName || "Utility Store"}</span>
      </a>
      <div class="search-wrap">
        <span class="search-icon">${icon("search", 15)}</span>
        <input class="search-input" type="search" placeholder="Search products, deals…" aria-label="Search products"/>
        <div class="search-suggest" role="listbox"></div>
      </div>
      <div class="header-actions">
        <a class="icon-btn" href="./reviews.html" title="Reviews" aria-label="Reviews">${icon("book")}</a>
        <button class="icon-btn" id="cart-btn" title="Buy list" aria-label="Open buy list">
          ${icon("cart")}<span class="badge-count hidden" id="cart-badge">0</span>
        </button>
      </div>`;
    header.appendChild(inner);

    const strip = el("div", { class: "cat-strip" });
    const stripInner = el("div", { class: "cat-strip-inner" });
    stripInner.innerHTML = `<a href="./index.html" class="${active === "home" ? "active" : ""}">Home</a>
      <a href="./reviews.html" class="${active === "reviews" ? "active" : ""}">Reviews</a>
      <a href="./category.html?c=__deals" class="${active === "deals" ? "active" : ""}">🔥 Deals</a>
      <a href="./about.html" class="${active === "about" ? "active" : ""}">About</a>`;
    strip.appendChild(stripInner);
    header.appendChild(strip);

    // fill live categories into the strip (only non-empty ones — req ②)
    if (window.BL && window.BL.data) {
      window.BL.data.load().then(({ categories }) => {
        categories.forEach(c => {
          if (c.hide) return;
          const a = el("a", { href: `./category.html?c=${encodeURIComponent(c.slug)}` });
          a.textContent = c.name;
          a.className = active === "cat:" + c.slug ? "active" : "";
          stripInner.appendChild(a);
        });
      });
    }

    document.body.prepend(header);

    // bottom mobile nav
    const nav = el("nav", { class: "bottom-nav", "aria-label": "Mobile navigation" });
    nav.innerHTML = `
      <a href="./index.html" class="${active === "home" ? "active" : ""}">${icon("home", 20)}<span>Home</span></a>
      <a href="./category.html" class="${active && active.startsWith("cat") ? "active" : ""}">${icon("grid", 20)}<span>Shop</span></a>
      <a href="./reviews.html" class="${active === "reviews" ? "active" : ""}">${icon("book", 20)}<span>Reviews</span></a>
      <a href="#" id="bn-cart">${icon("cart", 20)}<span>List</span></a>`;
    document.body.appendChild(nav);

    document.getElementById("cart-btn").addEventListener("click", openDrawer);
    nav.querySelector("#bn-cart").addEventListener("click", e => { e.preventDefault(); openDrawer(); });

    initSearch(header.querySelector(".search-input"), header.querySelector(".search-suggest"));
  }

  // ---------- Search ----------
  function initSearch(input, box) {
    let items = [], activeIdx = -1;
    const close = () => { box.classList.remove("open"); activeIdx = -1; };
    const render = () => {
      if (!items.length) { close(); return; }
      box.innerHTML = "";
      items.forEach((p, i) => {
        const row = el("div", { class: "suggest-item" + (i === activeIdx ? " active" : ""), role: "option" });
        row.innerHTML = `<img src="${p.images[0] || "assets/img/placeholder.svg"}" alt="" loading="lazy"/>
          <div><div class="s-title">${p.title}</div><div class="s-price">${money(p.price)}</div></div>`;
        row.addEventListener("click", () => { location.href = "./product.html?p=" + encodeURIComponent(p.slug); });
        box.appendChild(row);
      });
      box.classList.add("open");
    };
    input.addEventListener("input", async () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { close(); return; }
      const { products } = await window.BL.data.load();
      items = products.filter(p =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.tags || []).some(t => String(t).toLowerCase().includes(q)) ||
        (p.category || "").toLowerCase().includes(q)
      ).slice(0, 7);
      render();
    });
    input.addEventListener("keydown", e => {
      if (!box.classList.contains("open")) {
        if (e.key === "Enter") location.href = "./category.html?q=" + encodeURIComponent(input.value.trim());
        return;
      }
      if (e.key === "ArrowDown") { activeIdx = (activeIdx + 1) % items.length; render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { activeIdx = (activeIdx - 1 + items.length) % items.length; render(); e.preventDefault(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0) location.href = "./product.html?p=" + encodeURIComponent(items[activeIdx].slug);
        else location.href = "./category.html?q=" + encodeURIComponent(input.value.trim());
      } else if (e.key === "Escape") close();
    });
    document.addEventListener("click", e => { if (!box.contains(e.target) && e.target !== input) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
  }

  // ---------- Drawer (buy list) ----------
  let overlay, drawer;
  function mountDrawer() {
    overlay = el("div", { class: "drawer-overlay" });
    drawer = el("aside", { class: "drawer", "aria-label": "Buy list" });
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  }
  function openDrawer() { if (!overlay) mountDrawer(); renderDrawer(); overlay.classList.add("open"); drawer.classList.add("open"); }
  function closeDrawer() { if (!overlay) return; overlay.classList.remove("open"); drawer.classList.remove("open"); }

  function renderDrawer() {
    const cart = window.BL.cart;
    const list = cart.list();
    drawer.innerHTML = "";
    const head = el("div", { class: "drawer-head" });
    head.innerHTML = `<h3>${icon("cart", 18)} Buy list (${list.length})</h3>`;
    const xb = el("button", { class: "icon-btn", "aria-label": "Close", html: icon("x", 18) });
    xb.addEventListener("click", closeDrawer);
    head.appendChild(xb);
    drawer.appendChild(head);

    const body = el("div", { class: "drawer-body" });
    if (!list.length) {
      body.innerHTML = `<div class="empty-state">${icon("cart", 36)}
        <h3>Your buy list is empty</h3><p>Tap “Add to list” on any product. Checkout happens on Meesho/Amazon.</p></div>`;
    } else {
      list.forEach(it => {
        const row = el("div", { class: "drawer-item" });
        row.innerHTML = `
          <img src="${it.image || "assets/img/placeholder.svg"}" alt="" loading="lazy"/>
          <div class="di-info">
            <a class="di-title" href="./product.html?p=${encodeURIComponent(it.slug)}">${it.title}</a>
            <div class="di-price">${money(it.price)} × ${it.qty}</div>
            <div class="qty">
              <button aria-label="Decrease" data-act="dec">${icon("minus", 12)}</button>
              <span class="q-num">${it.qty}</span>
              <button aria-label="Increase" data-act="inc">${icon("plus", 12)}</button>
            </div>
          </div>
          <button class="icon-btn di-remove" aria-label="Remove">${icon("trash", 16)}</button>`;
        row.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
          cart.setQty(it.slug, it.qty + (b.dataset.act === "inc" ? 1 : -1));
        }));
        row.querySelector(".di-remove").addEventListener("click", () => cart.remove(it.slug));
        body.appendChild(row);
      });
    }
    drawer.appendChild(body);

    const foot = el("div", { class: "drawer-foot" });
    const total = list.reduce((s, i) => s + i.price * i.qty, 0);
    if (list.length) {
      const t = el("div", { class: "mono", html: `<span style="color:var(--text-2);font-size:.85rem">Estimated total (on store) </span><b style="font-size:1.05rem">${money(total)}</b>` });
      foot.appendChild(t);
      const buyAll = el("button", { class: "btn btn-success btn-block btn-lg", html: icon("arrow", 16) + "Buy all on store" });
      buyAll.addEventListener("click", () => cart.buyAll("meesho"));
      foot.appendChild(buyAll);
      const clear = el("button", { class: "btn btn-outline btn-block btn-sm", html: icon("trash", 14) + "Clear list" });
      clear.addEventListener("click", () => { cart.clear(); toast("Buy list cleared", "trash"); });
      foot.appendChild(clear);
    }
    foot.appendChild(el("p", { class: "footer-updated", style: "margin:0;text-align:center", text: "" }));
    foot.lastChild.textContent = "No payment here — you checkout on Meesho/Amazon.";
    drawer.appendChild(foot);
  }

  function updateCartBadge() {
    const b = document.getElementById("cart-badge");
    if (!b) return;
    const n = window.BL.cart.count();
    b.textContent = n > 99 ? "99+" : String(n);
    b.classList.toggle("hidden", n === 0);
  }

  window.BL = window.BL || {};
  window.BL.ui = { ICONS, icon, el, money, stars, toast, fmtDate, renderHeader, updateCartBadge, openDrawer, closeDrawer, renderDrawer };
})();
