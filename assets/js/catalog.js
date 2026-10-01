/* ============================================================
   UtilixVerse Store — catalog.js (Rendering Engine)
   Matches UtilixVerse styling and components.
   ============================================================ */
(function () {
  "use strict";
  const ui = () => window.BL.ui;
  const PLACEHOLDER = "assets/img/icon.svg";

  function offPct(p) {
    if (p.mrp > p.price && p.mrp > 0) return Math.round(((p.mrp - p.price) / p.mrp) * 100);
    return 0;
  }
  function imgUrl(src) {
    if (!src) return PLACEHOLDER;
    return String(src).startsWith("http") ? src : src;
  }

  /* ---------- Product Card Component ---------- */
  function productCard(p) {
    const a = document.createElement("article");
    a.className = "card product-card";
    const off = offPct(p);
    a.innerHTML = `
      <div class="pc-media">
        <a href="./product.html?p=${encodeURIComponent(p.slug)}" aria-label="${p.title}">
          <img src="${imgUrl(p.images && p.images[0])}" alt="${p.title}" loading="lazy"/>
        </a>
        ${off ? `<span class="pc-off">-${off}%</span>` : ""}
        ${p.deal ? `<span class="pc-deal">${ui().icon("flame", 11)} DEAL</span>` : ""}
      </div>
      <div class="pc-body">
        <a class="pc-title-link" href="./product.html?p=${encodeURIComponent(p.slug)}">
          <span class="pc-title">${p.title}</span>
        </a>
        <div class="pc-rating">
          ${ui().stars(p.rating)}
          <span>${p.rating ? p.rating : "New"}${p.reviews ? ` (${p.reviews})` : ""}</span>
        </div>
        <div class="pc-pricing">
          <span class="pc-price">${ui().money(p.price)}</span>
          ${p.mrp > p.price ? `<span class="pc-mrp">${ui().money(p.mrp)}</span>` : ""}
        </div>
        <div class="pc-actions"></div>
      </div>`;

    const actions = a.querySelector(".pc-actions");
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-outline btn-sm";
    addBtn.innerHTML = ui().icon("plus", 13) + " List";
    addBtn.title = "Add to buy list";
    addBtn.addEventListener("click", () => window.BL.cart.add(p.slug));
    actions.appendChild(addBtn);

    if (p.buy_meesho) {
      const buy = document.createElement("a");
      buy.className = "btn btn-primary btn-sm";
      buy.href = window.BL.affiliate.buildBuyUrl(p, "meesho");
      buy.target = "_blank";
      buy.rel = "nofollow sponsored noopener";
      buy.innerHTML = ui().icon("arrow", 13) + " Meesho";
      actions.appendChild(buy);
    } else if (p.buy_amazon) {
      const buy = document.createElement("a");
      buy.className = "btn btn-amazon btn-sm";
      buy.href = window.BL.affiliate.buildBuyUrl(p, "amazon");
      buy.target = "_blank";
      buy.rel = "nofollow sponsored noopener";
      buy.innerHTML = ui().icon("arrow", 13) + " Amazon";
      actions.appendChild(buy);
    } else {
      const view = document.createElement("a");
      view.className = "btn btn-secondary btn-sm";
      view.href = "./product.html?p=" + encodeURIComponent(p.slug);
      view.innerHTML = "Details →";
      actions.appendChild(view);
    }
    return a;
  }

  function skeletonGrid(n, cls) {
    const g = document.createElement("div");
    g.className = cls || "grid-products";
    for (let i = 0; i < (n || 8); i++) {
      const s = document.createElement("div");
      s.className = "skeleton sk-card";
      g.appendChild(s);
    }
    return g;
  }

  /* ---------- Category Grid (Homepage) ---------- */
  async function renderCategoryGrid(container) {
    if (!container) return;
    const { products, categories } = await window.BL.data.load();
    container.innerHTML = "";
    
    // Only display categories with >= 1 product, or if no products exist show friendly starter empty state
    const visible = window.BL.data.visibleCategories();
    if (!visible.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">${ui().icon("grid", 28)}</div>
          <h3>Curating New Gear</h3>
          <p>Our editors are hand-testing and cataloging top utility picks. New products will appear here automatically.</p>
          <div class="empty-actions">
            <a href="https://utilixverse.com" class="btn btn-primary" target="_blank" rel="noopener">Explore 100+ Free Utilities</a>
            <a href="./admin/" class="btn btn-outline">Open CMS Admin</a>
          </div>
        </div>`;
      return;
    }

    visible.forEach(c => {
      const items = window.BL.data.productsIn(c.slug);
      const card = document.createElement("a");
      card.className = "card cat-card";
      card.href = "./category.html?c=" + encodeURIComponent(c.slug);
      const thumbs = items.slice(0, 4).map(p =>
        `<img src="${imgUrl(p.images && p.images[0])}" alt="" loading="lazy"/>`).join("");
      const pad = 4 - Math.min(items.length, 4);
      card.innerHTML = `
        <div class="collage">${thumbs}${"<div></div>".repeat(pad)}</div>
        <div>
          <div class="cc-name">${c.icon ? `<span class="cc-icon">${c.icon}</span>` : ""} ${c.name}</div>
          <div class="cc-count">${items.length} product${items.length > 1 ? "s" : ""}</div>
        </div>
        <span class="cc-link">Shop category ${ui().icon("arrow", 13)}</span>`;
      container.appendChild(card);
    });
  }

  /* ---------- Scrollable Rows (Deals, New) ---------- */
  async function renderRow(container, filterFn, count) {
    if (!container) return;
    const { products } = await window.BL.data.load();
    container.innerHTML = "";
    const items = products.filter(filterFn).slice(0, count || 12);
    if (!items.length) {
      container.closest(".section")?.classList.add("hidden");
      return;
    }
    container.closest(".section")?.classList.remove("hidden");
    items.forEach(p => container.appendChild(productCard(p)));
  }

  /* ---------- PLP (category.html) ---------- */
  async function renderPLP() {
    const grid = document.getElementById("plp-grid");
    const countEl = document.getElementById("result-count");
    if (!grid) return;
    grid.innerHTML = "";
    grid.appendChild(skeletonGrid(8));

    const { products, categories } = await window.BL.data.load();
    const params = new URLSearchParams(location.search);
    const catSlug = params.get("c") || "";
    const q = (params.get("q") || "").toLowerCase();
    const isDeals = catSlug === "__deals";

    let items = products.slice();
    if (isDeals) items = items.filter(p => p.deal);
    else if (catSlug) items = items.filter(p => p.category === catSlug);
    if (q) items = items.filter(p =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.tags || []).some(t => String(t).toLowerCase().includes(q)) ||
      (p.category || "").toLowerCase().includes(q));

    // Title / Breadcrumb
    const cat = catSlug && !isDeals ? window.BL.data.getCategory(catSlug) : null;
    const titleEl = document.getElementById("page-title");
    const subEl = document.getElementById("page-sub");
    const crumbCat = document.getElementById("crumb-cat");
    if (titleEl) titleEl.textContent = isDeals ? "🔥 Deals of the Day" : q ? `Results for “${q}”` : (cat ? cat.name : "All Products");
    if (subEl) subEl.textContent = isDeals ? "Hand-picked discounts and limited time drops" : (cat && cat.blurb ? cat.blurb : "Explore curated tools and utility gear.");
    if (crumbCat) crumbCat.textContent = isDeals ? "Deals" : (cat ? cat.name : (q ? "Search" : "All"));

    // Category filter chips
    const chipRow = document.getElementById("cat-chips");
    if (chipRow && !catSlug) {
      chipRow.innerHTML = `<a href="./category.html" class="chip active">All</a>`;
      categories.filter(c => !c.hide).forEach(c => {
        const b = document.createElement("a");
        b.className = "chip";
        b.href = "./category.html?c=" + encodeURIComponent(c.slug);
        b.textContent = (c.icon ? c.icon + " " : "") + c.name;
        chipRow.appendChild(b);
      });
    }

    // Sort & Rating filters
    const sortSel = document.getElementById("sort-select");
    const rateSel = document.getElementById("rating-select");

    function applyFilters() {
      const r = rateSel ? Number(rateSel.value) : 0;
      const v = sortSel ? sortSel.value : "new";
      let list = items.slice();
      if (r) list = list.filter(p => (p.rating || 0) >= r);

      if (v === "price-asc") list.sort((a, b) => a.price - b.price);
      else if (v === "price-desc") list.sort((a, b) => b.price - a.price);
      else if (v === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else if (v === "discount") list.sort((a, b) => offPct(b) - offPct(a));
      else list.sort((a, b) => String(b.added || "").localeCompare(String(a.added || "")));

      paintList(list);
    }

    if (sortSel) sortSel.addEventListener("change", applyFilters);
    if (rateSel) rateSel.addEventListener("change", applyFilters);

    function paintList(list) {
      if (countEl) countEl.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">${ui().icon("search", 28)}</div>
            <h3>No products found</h3>
            <p>${q ? `No items matched "${q}". Try another keyword or browse categories.` : `No products currently available in this section.`}</p>
            <div class="empty-actions">
              <a href="./category.html" class="btn btn-outline">View All Products</a>
              <a href="https://utilixverse.com" class="btn btn-primary" target="_blank" rel="noopener">Explore UtilixVerse Utilities</a>
            </div>
          </div>`;
        return;
      }
      list.forEach(p => grid.appendChild(productCard(p)));
    }

    applyFilters();
  }

  /* ---------- PDP (product.html) ---------- */
  async function renderPDP() {
    const root = document.getElementById("pdp-root");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("p");
    await window.BL.data.load();
    const product = window.BL.data.getProduct(slug);

    if (!product) {
      root.innerHTML = `
        <div class="empty-state" style="margin: 3rem auto;">
          <div class="empty-state-icon">${ui().icon("info", 28)}</div>
          <h3>Product Not Found</h3>
          <p>This item may have moved or been updated. Browse our catalog for related gear.</p>
          <div class="empty-actions">
            <a href="./category.html" class="btn btn-primary">Back to Catalog</a>
            <a href="https://utilixverse.com" class="btn btn-outline" target="_blank" rel="noopener">UtilixVerse Tools</a>
          </div>
        </div>`;
      return;
    }

    document.title = `${product.title} — ${ui().money(product.price)} | UV Store`;
    const cat = window.BL.data.getCategory(product.category);
    const off = offPct(product);
    const images = (product.images && product.images.length) ? product.images : [PLACEHOLDER];

    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumbs">
        <a href="./index.html">Home</a><span class="sep">/</span>
        <a href="./category.html?c=${encodeURIComponent(product.category)}">${cat ? cat.name : "Catalog"}</a><span class="sep">/</span>
        <span>${product.title}</span>
      </nav>

      <div class="pdp-grid">
        <div class="pdp-gallery">
          <div class="pdp-main-img">
            <img id="pdp-big-img" src="${imgUrl(images[0])}" alt="${product.title}"/>
          </div>
          ${images.length > 1 ? `
            <div class="pdp-thumbs">
              ${images.map((im, i) => `
                <img class="pdp-thumb ${i === 0 ? "active" : ""}" src="${imgUrl(im)}" data-idx="${i}" alt="" />
              `).join("")}
            </div>` : ""}
        </div>

        <div class="pdp-details">
          <div>
            ${product.deal ? `<span class="hero-pill" style="margin-bottom:0.75rem">${ui().icon("flame", 12)} Deal of the Day</span>` : ""}
            <h1 class="pdp-title">${product.title}</h1>
            <div class="pc-rating" style="margin-top:0.5rem;font-size:0.9rem">
              ${ui().stars(product.rating)}
              <span>${product.rating ? `${product.rating}★` : "Unrated"} (${product.reviews || 0} reviews)</span>
            </div>
          </div>

          <div class="pdp-price-row">
            <span class="pdp-price">${ui().money(product.price)}</span>
            ${product.mrp > product.price ? `
              <span class="pdp-mrp">${ui().money(product.mrp)}</span>
              <span class="pdp-off">${off}% OFF</span>
            ` : ""}
          </div>

          <div style="color:var(--text-2);font-size:1rem;line-height:1.7;">
            ${product.body || ""}
          </div>

          <div class="pdp-cta-box">
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
              <button class="btn btn-outline btn-lg" id="pdp-add-list" style="flex:1">
                ${ui().icon("plus", 16)} Add to Buy List
              </button>
              ${product.buy_meesho ? `
                <a class="btn btn-primary btn-lg" href="${window.BL.affiliate.buildBuyUrl(product, "meesho")}" target="_blank" rel="nofollow sponsored noopener" style="flex:1.2">
                  Buy on Meesho ${ui().icon("arrow", 16)}
                </a>
              ` : ""}
              ${product.buy_amazon ? `
                <a class="btn btn-amazon btn-lg" href="${window.BL.affiliate.buildBuyUrl(product, "amazon")}" target="_blank" rel="nofollow sponsored noopener" style="flex:1.2">
                  Buy on Amazon ${ui().icon("arrow", 16)}
                </a>
              ` : ""}
            </div>
          </div>

          <div class="pdp-trust">
            <div class="pdp-trust-item">
              ${ui().icon("shield", 18)} <span>Verified seller & product testing</span>
            </div>
            <div class="pdp-trust-item">
              ${ui().icon("refresh", 18)} <span>Easy store returns & refunds</span>
            </div>
          </div>
        </div>
      </div>`;

    // Thumb click switcher
    root.querySelectorAll(".pdp-thumb").forEach(th => {
      th.addEventListener("click", () => {
        root.querySelectorAll(".pdp-thumb").forEach(t => t.classList.remove("active"));
        th.classList.add("active");
        const idx = Number(th.dataset.idx);
        const big = document.getElementById("pdp-big-img");
        if (big && images[idx]) big.src = imgUrl(images[idx]);
      });
    });

    // Add to list
    document.getElementById("pdp-add-list")?.addEventListener("click", () => {
      window.BL.cart.add(product.slug);
      ui().toast(`Added "${product.title}" to buy list`, "cart");
    });
  }

  window.BL = window.BL || {};
  window.BL.catalog = {
    productCard,
    renderCategoryGrid,
    renderRow,
    renderPLP,
    renderPDP
  };
})();
