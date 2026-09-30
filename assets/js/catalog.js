/* ============================================================
   Utility Store — catalog.js (rendering engine)
   • Amazon-style homepage category grid — ONLY non-empty categories
     (derived from product data; add first product → card appears)
   • Product cards, deals/new rows, PLP with filters+sort, PDP
   Requires: config.js, data.js, ui.js, affiliate.js, cart.js
   ============================================================ */
(function () {
  "use strict";
  const ui = () => window.BL.ui;
  const PLACEHOLDER = "assets/img/placeholder.svg";

  function offPct(p) {
    if (p.mrp > p.price && p.mrp > 0) return Math.round(((p.mrp - p.price) / p.mrp) * 100);
    return 0;
  }
  function imgUrl(src) {
    if (!src) return PLACEHOLDER;
    return String(src).startsWith("http") ? src : src;
  }

  /* ---------- Product card ---------- */
  function productCard(p) {
    const a = document.createElement("article");
    a.className = "card product-card";
    const off = offPct(p);
    a.innerHTML = `
      <div class="pc-media">
        <a href="./product.html?p=${encodeURIComponent(p.slug)}" aria-label="${p.title}">
          <img src="${imgUrl(p.images[0])}" alt="${p.title}" loading="lazy"/>
        </a>
        ${off ? `<span class="pc-off">-${off}%</span>` : ""}
        ${p.deal ? `<span class="pc-deal">${ui().icon("flame", 10)}DEAL</span>` : ""}
      </div>
      <div class="pc-body">
        <a class="pc-title-link" href="./product.html?p=${encodeURIComponent(p.slug)}">
          <span class="pc-title">${p.title}</span>
        </a>
        <div class="pc-rating">${ui().stars(p.rating)}<span>${p.rating || "—"}${p.reviews ? ` (${p.reviews})` : ""}</span></div>
        <div class="pc-pricing">
          <span class="pc-price">${ui().money(p.price)}</span>
          ${p.mrp > p.price ? `<span class="pc-mrp">${ui().money(p.mrp)}</span>` : ""}
        </div>
        <div class="pc-actions"></div>
      </div>`;
    const actions = a.querySelector(".pc-actions");
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.innerHTML = ui().icon("plus", 13) + " List";
    addBtn.addEventListener("click", () => window.BL.cart.add(p.slug));
    actions.appendChild(addBtn);
    if (p.buy_meesho) {
      const buy = document.createElement("a");
      buy.className = "btn btn-success";
      buy.href = window.BL.affiliate.buildBuyUrl(p, "meesho");
      buy.target = "_blank"; buy.rel = "nofollow sponsored noopener";
      buy.innerHTML = ui().icon("arrow", 13) + " Meesho";
      actions.appendChild(buy);
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

  /* ---------- Homepage category grid (req ① + ②) ---------- */
  async function renderCategoryGrid(container) {
    const { products, categories } = await window.BL.data.load();
    container.innerHTML = "";
    // Requirement ②: only categories that have ≥1 product, derived live
    const visible = window.BL.data.visibleCategories();
    if (!visible.length) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        ${ui().icon("grid", 36)}<h3>No categories yet</h3>
        <p>Add a product in the CMS and its category appears here automatically.</p></div>`;
      return;
    }
    visible.forEach(c => {
      const items = window.BL.data.productsIn(c.slug);
      const card = document.createElement("a");
      card.className = "card cat-card";
      card.href = "./category.html?c=" + encodeURIComponent(c.slug);
      const thumbs = items.slice(0, 4).map(p =>
        `<img src="${imgUrl(p.images[0])}" alt="" loading="lazy"/>`).join("");
      const pad = 4 - Math.min(items.length, 4);
      card.innerHTML = `
        <div class="collage">${thumbs}${"<div></div>".repeat(pad)}</div>
        <div>
          <div class="cc-name">${c.icon ? `<span class="cc-icon">${c.icon}</span>` : ""} ${c.name}</div>
          <div class="cc-count">${items.length} item${items.length > 1 ? "s" : ""}</div>
        </div>
        <span class="cc-link">Shop now ${ui().icon("arrow", 13)}</span>`;
      container.appendChild(card);
    });
  }

  /* ---------- Scrollable rows ---------- */
  async function renderRow(container, filterFn, count) {
    const { products } = await window.BL.data.load();
    container.innerHTML = "";
    const items = products.filter(filterFn).slice(0, count || 12);
    if (!items.length) {
      container.closest(".section")?.classList.add("hidden");
      return;
    }
    items.forEach(p => container.appendChild(productCard(p)));
  }

  /* ---------- PLP (category.html) ---------- */
  async function renderPLP(opts) {
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
      (p.tags || []).some(t => String(t).toLowerCase().includes(q)));

    // title/breadcrumb
    const cat = catSlug && !isDeals ? window.BL.data.getCategory(catSlug) : null;
    const titleEl = document.getElementById("page-title");
    const subEl = document.getElementById("page-sub");
    const crumbCat = document.getElementById("crumb-cat");
    if (titleEl) titleEl.textContent = isDeals ? "Deals of the Day" : q ? `Results for “${q}”` : (cat ? cat.name : "All products");
    if (subEl) subEl.textContent = isDeals ? "Hand-picked discounts, updated live" : (cat && cat.blurb ? cat.blurb : "");
    if (crumbCat) crumbCat.textContent = isDeals ? "Deals" : (cat ? cat.name : (q ? "Search" : "All"));

    // category filter chips
    const chipRow = document.getElementById("cat-chips");
    if (chipRow && !catSlug) {
      categories.filter(c => !c.hide).forEach(c => {
        const b = document.createElement("button");
        b.className = "chip";
        b.textContent = c.name;
        b.addEventListener("click", () => location.href = "./category.html?c=" + encodeURIComponent(c.slug));
        chipRow.appendChild(b);
      });
    }

    // sort
    const sortSel = document.getElementById("sort-select");
    const applySort = () => {
      const v = sortSel ? sortSel.value : "new";
      if (v === "price-asc") items.sort((a, b) => a.price - b.price);
      else if (v === "price-desc") items.sort((a, b) => b.price - a.price);
      else if (v === "rating") items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else if (v === "discount") items.sort((a, b) => offPct(b) - offPct(a));
      else items.sort((a, b) => String(b.added).localeCompare(String(a.added)));
      paint();
    };
    if (sortSel) sortSel.addEventListener("change", applySort);

    // min rating filter
    const rateSel = document.getElementById("rating-select");
    if (rateSel) rateSel.addEventListener("change", applyFilters);

    function applyFilters() {
      const r = rateSel ? Number(rateSel.value) : 0;
      let list = items.slice();
      if (r) list = list.filter(p => (p.rating || 0) >= r);
      paintList(list);
    }

    function paintList(list) {
      if (countEl) countEl.textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          ${ui().icon("search", 36)}<h3>Nothing found</h3>
          <p>Try a different filter, or browse another category.</p></div>`;
        return;
      }
      list.forEach(p => grid.appendChild(productCard(p)));
    }
    function paint() { paintList(items); }

    applySort();
  }

  /* ---------- PDP (product.html) ---------- */
  async function renderPDP() {
    const root = document.getElementById("pdp-root");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get("p");
    await window.BL.data.load();
    const p = window.BL.data.getProduct(slug);

    if (!p) {
      root.innerHTML = `<div class="empty-state">${ui().icon("info", 36)}
        <h3>Product not found</h3><p>It may have been renamed or removed in the CMS.</p>
        <p style="margin-top:1rem"><a class="btn btn-primary" href="./index.html">Back to home</a></p></div>`;
      return;
    }

    document.title = `${p.title} — ${ui().money(p.price)} | Utility Store`;
    const off = offPct(p);

    // gallery
    const mainImg = document.getElementById("pdp-main-img");
    const thumbs = document.getElementById("pdp-thumbs");
    const imgs = p.images.length ? p.images : [PLACEHOLDER];
    const setMain = src => { mainImg.innerHTML = `<img src="${imgUrl(src)}" alt="${p.title}"/>`; };
    setMain(imgs[0]);
    imgs.forEach((src, i) => {
      const t = document.createElement("img");
      t.src = imgUrl(src); t.alt = ""; t.loading = "lazy";
      if (i === 0) t.className = "active";
      t.addEventListener("click", () => {
        setMain(src);
        thumbs.querySelectorAll("img").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
      });
      thumbs.appendChild(t);
    });

    // info column
    document.getElementById("pdp-title").textContent = p.title;
    document.getElementById("pdp-rating").innerHTML =
      `${ui().stars(p.rating)} <span>${p.rating || "—"} · ${p.reviews || 0} ratings</span>`;
    const priceBlock = document.getElementById("pdp-price-block");
    priceBlock.innerHTML = `
      <span class="pdp-price">${ui().money(p.price)}</span>
      ${p.mrp > p.price ? `<span class="pdp-mrp">${ui().money(p.mrp)}</span>` : ""}
      ${off ? `<span class="pdp-off">${off}% off</span>` : ""}
      <div class="pdp-note">Price as listed on the store. You checkout on Meesho/Amazon.</div>`;

    // options (visual only)
    const optsRoot = document.getElementById("pdp-options");
    if ((p.colors && p.colors.length) || (p.sizes && p.sizes.length)) {
      optsRoot.innerHTML = "";
      const mkGroup = (label, values) => {
        if (!values || !values.length) return;
        const g = document.createElement("div");
        g.className = "opt-group";
        g.innerHTML = `<div class="opt-label">${label}: <b>—</b></div><div class="swatches"></div>`;
        const sw = g.querySelector(".swatches");
        values.forEach(v => {
          const b = document.createElement("button");
          b.className = "swatch"; b.textContent = v;
          b.addEventListener("click", () => {
            sw.querySelectorAll(".swatch").forEach(x => x.classList.remove("active"));
            b.classList.add("active");
            g.querySelector("b").textContent = v;
          });
          sw.appendChild(b);
        });
        optsRoot.appendChild(g);
      };
      mkGroup("Colour", p.colors);
      mkGroup("Size", p.sizes);
    }

    // description
    document.getElementById("pdp-desc").textContent = p.body || p.description || "";

    // compare block + CTAs
    const actions = document.getElementById("pdp-actions");
    const cmp = window.BL.affiliate.compareBlock(p);
    if (cmp) actions.before(cmp);
    actions.appendChild(window.BL.affiliate.ctaButtons(p, "btn-lg"));
    const listBtn = document.createElement("button");
    listBtn.className = "btn btn-outline btn-lg";
    listBtn.innerHTML = ui().icon("plus", 15) + " Add to list";
    listBtn.addEventListener("click", () => window.BL.cart.add(p.slug));
    actions.appendChild(listBtn);

    // breadcrumb category link
    const crumb = document.getElementById("crumb-cat");
    if (crumb) {
      const c = window.BL.data.getCategory(p.category);
      crumb.textContent = c ? c.name : "Catalog";
      if (c) crumb.href = "./category.html?c=" + encodeURIComponent(c.slug);
    }

    // related products
    const related = document.getElementById("related-grid");
    if (related) {
      const rel = window.BL.data.productsIn(p.category).filter(x => x.slug !== p.slug).slice(0, 4);
      if (rel.length) rel.forEach(r => related.appendChild(productCard(r)));
      else related.closest(".section")?.classList.add("hidden");
    }

    // linked review posts
    const linkedRoot = document.getElementById("linked-posts");
    if (linkedRoot) {
      const { posts } = await window.BL.data.load();
      const linked = posts.filter(post => (post.products || []).includes(p.slug));
      if (linked.length) {
        linkedRoot.innerHTML = `<h2 class="section-title" style="margin-bottom:.75rem">${ui().icon("book", 18)} Read our review</h2>`;
        linked.forEach(post => {
          const a = document.createElement("a");
          a.href = "./post.html?post=" + encodeURIComponent(post.slug);
          a.style.cssText = "display:block;padding:.6rem 0;color:var(--accent);font-size:.9rem";
          a.textContent = "→ " + post.title;
          linkedRoot.appendChild(a);
        });
      }
    }
  }

  window.BL = window.BL || {};
  window.BL.catalog = { productCard, renderCategoryGrid, renderRow, renderPLP, renderPDP, offPct };
})();
