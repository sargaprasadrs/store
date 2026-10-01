/* ============================================================
   UtilixVerse Store — ui.js (Shell, Header, Neo-Footer, Theme, Drawer)
   Matches UtilixVerse UI components & design system.
   ============================================================ */
(function () {
  "use strict";

  // --- Theme initialization (runs immediately) ---
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "dark"); // default dark for UtilixVerse
    document.documentElement.setAttribute("data-theme", theme);
  })();

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const btns = document.querySelectorAll(".theme-toggle-btn");
    btns.forEach(btn => {
      btn.innerHTML = cur === "dark" ? icon("sun", 18) : icon("moon", 18);
      btn.setAttribute("aria-label", `Switch to ${cur === "dark" ? "light" : "dark"} mode`);
    });
  }

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
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    twitter: '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'
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
      s += `<svg width="12" height="12" viewBox="0 0 24 24" fill="${i <= full ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" style="opacity:${i <= full ? 1 : 0.35}">${ICONS.star}</svg>`;
    return `<span class="stars" aria-label="${r || 0} out of 5 stars">${s}</span>`;
  };

  const fmtDate = d => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch (_) { return ""; }
  };

  // ---------- Toast Notification ----------
  function toast(msg, iconName) {
    let zone = document.querySelector(".toast-zone");
    if (!zone) { zone = el("div", { class: "toast-zone" }); document.body.appendChild(zone); }
    const t = el("div", { class: "toast", html: icon(iconName || "check", 16) + "<span></span>" });
    t.querySelector("span").textContent = msg;
    zone.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 200ms"; }, 2400);
    setTimeout(() => t.remove(), 2700);
  }

  // ---------- Header Component ----------
  function renderHeader(active) {
    const header = el("header", { class: "site-header" });
    const top = el("div", { class: "header-top" });
    
    top.innerHTML = `
      <div class="header-brand-wrap">
        <a class="logo" href="./index.html" aria-label="UV Store">
          <img src="assets/img/icon.svg" alt="" class="logo-icon" width="32" height="32"/>
          <span>UV <span class="text-cinnabar">STORE</span></span>
        </a>
      </div>

      <div class="search-wrapper" id="store-search-wrapper">
        <div class="search-box">
          <select class="search-category-select" id="search-cat-sel" aria-label="Search Category">
            <option value="all">All</option>
          </select>
          <input class="search-input" id="store-search-input" type="search" placeholder="Search products, deals, reviews…" aria-label="Search store" autocomplete="off"/>
          <button class="search-btn" id="store-search-btn" aria-label="Submit search">${icon("search", 16)}</button>
        </div>
        <div class="search-suggest" id="store-search-suggest" role="listbox"></div>
      </div>

      <div class="header-actions">
        <a class="hub-link-btn" href="https://utilixverse.com" target="_blank" rel="noopener" title="Open UtilixVerse Utilities">
          ${icon("external", 14)}<span>100+ Free Tools</span>
        </a>
        <button class="icon-btn theme-toggle-btn" id="theme-btn" title="Toggle theme" aria-label="Toggle theme">
          ${icon("sun", 18)}
        </button>
        <button class="icon-btn" id="cart-btn" title="Buy List" aria-label="Open buy list">
          ${icon("cart", 18)}
          <span class="badge-count hidden" id="cart-badge">0</span>
        </button>
      </div>`;
    header.appendChild(top);

    const strip = el("div", { class: "cat-strip" });
    const stripInner = el("div", { class: "cat-strip-inner" });
    stripInner.innerHTML = `
      <a href="./index.html" class="${active === "home" ? "active" : ""}">Home</a>
      <a href="./category.html" class="${active === "catalog" || active === "shop" ? "active" : ""}">All Products</a>
      <a href="./category.html?c=__deals" class="${active === "deals" ? "active" : ""}">🔥 Deals</a>
      <a href="./reviews.html" class="${active === "reviews" ? "active" : ""}">Reviews</a>
      <a href="./about.html" class="${active === "about" ? "active" : ""}">About</a>`;
    strip.appendChild(stripInner);
    header.appendChild(strip);

    // populate categories in strip & search dropdown
    if (window.BL && window.BL.data) {
      window.BL.data.load().then(({ categories }) => {
        const catSel = header.querySelector("#search-cat-sel");
        categories.forEach(c => {
          if (c.hide) return;
          const a = el("a", { href: `./category.html?c=${encodeURIComponent(c.slug)}` });
          a.textContent = (c.icon ? c.icon + " " : "") + c.name;
          a.className = active === "cat:" + c.slug ? "active" : "";
          stripInner.appendChild(a);

          if (catSel) {
            const opt = document.createElement("option");
            opt.value = c.slug;
            opt.textContent = c.name;
            catSel.appendChild(opt);
          }
        });
      });
    }

    document.body.prepend(header);

    // Mobile Bottom Nav
    const nav = el("nav", { class: "bottom-nav", "aria-label": "Mobile navigation" });
    nav.innerHTML = `
      <a href="./index.html" class="${active === "home" ? "active" : ""}">${icon("home", 20)}<span>Home</span></a>
      <a href="./category.html" class="${active && active.startsWith("cat") ? "active" : ""}">${icon("grid", 20)}<span>Catalog</span></a>
      <a href="./reviews.html" class="${active === "reviews" ? "active" : ""}">${icon("book", 20)}<span>Reviews</span></a>
      <a href="#" id="bn-cart">${icon("cart", 20)}<span>List</span></a>`;
    document.body.appendChild(nav);

    // Listeners
    document.getElementById("theme-btn").addEventListener("click", toggleTheme);
    document.getElementById("cart-btn").addEventListener("click", openDrawer);
    nav.querySelector("#bn-cart").addEventListener("click", e => { e.preventDefault(); openDrawer(); });
    updateThemeIcon();

    initSearch(
      header.querySelector("#store-search-input"),
      header.querySelector("#store-search-suggest"),
      header.querySelector("#search-cat-sel"),
      header.querySelector("#store-search-btn")
    );
  }

  // ---------- Search Logic ----------
  function initSearch(input, box, catSel, btn) {
    if (!input || !box) return;
    let items = [], activeIdx = -1;
    const close = () => { box.classList.remove("open"); activeIdx = -1; };

    const render = () => {
      if (!items.length) { close(); return; }
      box.innerHTML = "";
      items.forEach((p, i) => {
        const row = el("div", { class: "suggest-item" + (i === activeIdx ? " active" : ""), role: "option" });
        row.innerHTML = `<img src="${(p.images && p.images[0]) || "assets/img/icon.svg"}" alt="" loading="lazy"/>
          <div><div class="s-title">${p.title}</div><div class="s-price">${money(p.price)}</div></div>`;
        row.addEventListener("click", () => { location.href = "./product.html?p=" + encodeURIComponent(p.slug); });
        box.appendChild(row);
      });
      box.classList.add("open");
    };

    const doSearch = async () => {
      const q = input.value.trim().toLowerCase();
      const selectedCat = catSel ? catSel.value : "all";
      if (q.length < 2) { close(); return; }
      const { products } = await window.BL.data.load();
      items = products.filter(p => {
        const matchesCat = selectedCat === "all" || p.category === selectedCat;
        if (!matchesCat) return false;
        return (p.title || "").toLowerCase().includes(q) ||
          (p.tags || []).some(t => String(t).toLowerCase().includes(q)) ||
          (p.category || "").toLowerCase().includes(q);
      }).slice(0, 6);
      render();
    };

    input.addEventListener("input", doSearch);
    if (catSel) catSel.addEventListener("change", doSearch);

    const submitSearch = () => {
      const q = input.value.trim();
      const cat = catSel ? catSel.value : "all";
      let url = "./category.html?";
      if (q) url += "q=" + encodeURIComponent(q);
      if (cat && cat !== "all") url += (q ? "&" : "") + "c=" + encodeURIComponent(cat);
      location.href = url;
    };

    if (btn) btn.addEventListener("click", submitSearch);

    input.addEventListener("keydown", e => {
      if (!box.classList.contains("open")) {
        if (e.key === "Enter") submitSearch();
        return;
      }
      if (e.key === "ArrowDown") { activeIdx = (activeIdx + 1) % items.length; render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { activeIdx = (activeIdx - 1 + items.length) % items.length; render(); e.preventDefault(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0 && items[activeIdx]) location.href = "./product.html?p=" + encodeURIComponent(items[activeIdx].slug);
        else submitSearch();
      } else if (e.key === "Escape") close();
    });

    document.addEventListener("click", e => { if (!box.contains(e.target) && e.target !== input) close(); });
  }

  // ---------- Neo-Footer Component ----------
  function renderFooter() {
    const existing = document.querySelector("footer.site-footer, footer.neo-footer");
    if (existing) existing.remove();

    const footer = el("footer", { class: "neo-footer" });
    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-top-row">
          <div class="footer-brand">
            <img src="assets/img/icon.svg" alt="" width="26" height="26"/>
            <span>UV <span class="text-cinnabar">STORE</span></span>
          </div>

          <nav class="footer-links" aria-label="Footer navigation">
            <a href="./index.html">Home</a>
            <a href="./category.html">All Products</a>
            <a href="./category.html?c=__deals">Deals</a>
            <a href="./reviews.html">Reviews</a>
            <a href="./about.html">About</a>
            <a href="./about.html#disclosure">Affiliate Policy</a>
            <a href="https://utilixverse.com" target="_blank" rel="noopener">UtilixVerse Tools ↗</a>
            <a href="./admin/">Editor CMS</a>
          </nav>

          <div class="footer-socials">
            <a href="https://facebook.com/UtilixVerse" target="_blank" rel="noopener noreferrer" title="Facebook" class="social-icon">
              ${icon("facebook", 15)}
            </a>
            <a href="https://twitter.com/UtilixVerse" target="_blank" rel="noopener noreferrer" title="X (Twitter)" class="social-icon">
              ${icon("twitter", 15)}
            </a>
            <a href="https://instagram.com/UtilixVerse" target="_blank" rel="noopener noreferrer" title="Instagram" class="social-icon">
              ${icon("instagram", 15)}
            </a>
            <a href="https://linkedin.com/company/UtilixVerse" target="_blank" rel="noopener noreferrer" title="LinkedIn" class="social-icon">
              ${icon("linkedin", 15)}
            </a>
            <a href="https://youtube.com/@UtilixVerse" target="_blank" rel="noopener noreferrer" title="YouTube" class="social-icon">
              ${icon("youtube", 15)}
            </a>
            <a href="https://buymeacoffee.com/m0rb1us" target="_blank" rel="noopener noreferrer" title="Support UtilixVerse" class="footer-donate-btn" aria-label="Support UtilixVerse">
              ${icon("heart", 18)}
            </a>
          </div>
        </div>

        <div class="footer-bottom-row">
          <div>&copy; ${new Date().getFullYear()} UV Store. Curated products &amp; honest reviews.</div>
          <div class="footer-disclosure" id="footer-disclosure">
            ${(window.BL && window.BL.affiliate ? window.BL.affiliate.DISCLOSURE : "As an affiliate, we earn from qualifying purchases at no extra cost to you.")}
          </div>
        </div>
      </div>`;
    document.body.appendChild(footer);
  }

  // ---------- Drawer (Buy List) ----------
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
    head.innerHTML = `<h3>${icon("cart", 18)} Buy List (${list.length})</h3>`;
    const xb = el("button", { class: "icon-btn", "aria-label": "Close drawer", html: icon("x", 18) });
    xb.addEventListener("click", closeDrawer);
    head.appendChild(xb);
    drawer.appendChild(head);

    const body = el("div", { class: "drawer-body" });
    if (!list.length) {
      body.innerHTML = `
        <div class="empty-state" style="border:none;padding:2rem 1rem;background:transparent;">
          <div class="empty-state-icon">${icon("cart", 28)}</div>
          <h3>Your list is empty</h3>
          <p>Tap “Add to List” on any product to save items and compare prices.</p>
        </div>`;
    } else {
      list.forEach(it => {
        const row = el("div", { class: "drawer-item" });
        row.innerHTML = `
          <img src="${it.image || "assets/img/icon.svg"}" alt="" loading="lazy"/>
          <div class="di-info">
            <a class="di-title" href="./product.html?p=${encodeURIComponent(it.slug)}">${it.title}</a>
            <div class="di-price">${money(it.price)} × ${it.qty}</div>
            <div class="qty">
              <button aria-label="Decrease quantity" data-act="dec">${icon("minus", 12)}</button>
              <span class="q-num">${it.qty}</span>
              <button aria-label="Increase quantity" data-act="inc">${icon("plus", 12)}</button>
            </div>
          </div>
          <button class="icon-btn di-remove" aria-label="Remove item">${icon("trash", 16)}</button>`;
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
      const t = el("div", { class: "mono", html: `<span style="color:var(--text-2);font-size:.85rem">Estimated total: </span><b style="font-size:1.15rem;color:var(--cinnabar)">${money(total)}</b>` });
      foot.appendChild(t);
      const buyAll = el("button", { class: "btn btn-primary btn-block btn-lg", html: icon("arrow", 16) + "Buy on Store" });
      buyAll.addEventListener("click", () => cart.buyAll("meesho"));
      foot.appendChild(buyAll);
      const clear = el("button", { class: "btn btn-outline btn-block btn-sm", html: icon("trash", 14) + "Clear list" });
      clear.addEventListener("click", () => { cart.clear(); toast("Buy list cleared", "trash"); });
      foot.appendChild(clear);
    }
    foot.appendChild(el("p", { class: "footer-disclosure", style: "margin:0;text-align:center", html: "No payment collected here — you checkout on Meesho/Amazon." }));
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
  window.BL.ui = {
    ICONS, icon, el, money, stars, toast, fmtDate,
    renderHeader, renderFooter, updateCartBadge,
    openDrawer, closeDrawer, renderDrawer, toggleTheme
  };
})();
