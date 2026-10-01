/* ============================================================
   UtilixVerse Store — post.js (Markdown renderer + review cards)
   Matches UtilixVerse styling & components.
   ============================================================ */
(function () {
  "use strict";
  const ui = () => window.BL.ui;

  function loadMarked() {
    if (window.marked) return Promise.resolve(window.marked);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js";
      s.onload = () => resolve(window.marked);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* ---------- Reviews Listing (reviews.html) ---------- */
  async function renderPostList(container, limit) {
    if (!container) return;
    const { posts } = await window.BL.data.load();
    container.innerHTML = "";
    
    if (!posts.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">${ui().icon("book", 28)}</div>
          <h3>No Reviews Published Yet</h3>
          <p>Our editors are writing detailed hands-on reviews and comparisons. Check back soon or explore our utilities.</p>
          <div class="empty-actions">
            <a href="https://utilixverse.com" class="btn btn-primary" target="_blank" rel="noopener">Explore UtilixVerse Utilities</a>
            <a href="./category.html" class="btn btn-outline">Browse Catalog</a>
          </div>
        </div>`;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "grid-posts";
    const shown = limit ? posts.slice(0, limit) : posts;

    shown.forEach(post => {
      const card = document.createElement("article");
      card.className = "card post-card";
      const hero = post.hero || "assets/img/icon.svg";
      card.innerHTML = `
        <a class="po-media" href="./post.html?post=${encodeURIComponent(post.slug)}">
          <img src="${hero}" alt="${post.title}" loading="lazy"/>
        </a>
        <div class="po-body">
          <span class="po-type">${post.type}</span>
          <a class="po-title" href="./post.html?post=${encodeURIComponent(post.slug)}">${post.title}</a>
          <div class="po-meta">
            <span>${ui().fmtDate(post.added)}</span>
            ${(post.products || []).length ? `<span>· ${post.products.length} product${post.products.length > 1 ? "s" : ""}</span>` : ""}
            ${post.verdict_score ? `<span class="po-score">${ui().icon("star", 11)} ${post.verdict_score}</span>` : ""}
          </div>
        </div>`;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  /* ---------- Single Article Page (post.html) ---------- */
  async function renderArticle() {
    const root = document.getElementById("article-root");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("post");
    await window.BL.data.load();
    const post = window.BL.data.getPost(slug);

    if (!post) {
      root.innerHTML = `
        <div class="empty-state" style="margin: 3rem auto;">
          <div class="empty-state-icon">${ui().icon("info", 28)}</div>
          <h3>Article Not Found</h3>
          <p>This review may have been moved or unpublished. Browse all published reviews below.</p>
          <div class="empty-actions">
            <a class="btn btn-primary" href="./reviews.html">View All Reviews</a>
            <a class="btn btn-outline" href="https://utilixverse.com" target="_blank" rel="noopener">UtilixVerse Tools</a>
          </div>
        </div>`;
      return;
    }

    document.title = `${post.title} | UtilixVerse Store Reviews`;

    // Render breadcrumbs
    const crumbs = document.getElementById("article-crumbs");
    if (crumbs) {
      crumbs.innerHTML = `
        <a href="./index.html">Home</a><span class="sep">/</span>
        <a href="./reviews.html">Reviews</a><span class="sep">/</span>
        <span>${post.title}</span>`;
    }

    // Title & Meta
    const titleEl = document.getElementById("article-title");
    if (titleEl) titleEl.textContent = post.title;

    const metaEl = document.getElementById("article-meta");
    if (metaEl) {
      metaEl.innerHTML = `
        <span class="po-type">${post.type}</span>
        <span>${ui().fmtDate(post.added)}</span>
        ${post.verdict_score ? `<span class="po-score">${ui().icon("star", 11)} ${post.verdict_score} / 5</span>` : ""}`;
    }

    // Verdict box & Pros/Cons
    const top = document.getElementById("article-top");
    if (top) {
      top.innerHTML = "";
      if (post.verdict_score) {
        top.insertAdjacentHTML("beforeend", `
          <div class="verdict">
            <span class="v-num">${post.verdict_score}</span>
            <div class="v-label"><b>Verdict Score</b><br/><span style="color:var(--text-2);font-size:0.8rem">Based on testing & build analysis</span></div>
          </div>`);
      }
      const pills = document.createElement("div");
      (post.pros || []).forEach(x => pills.insertAdjacentHTML("beforeend", `<span class="pill pro">${ui().icon("check", 12)} ${x}</span>`));
      (post.cons || []).forEach(x => pills.insertAdjacentHTML("beforeend", `<span class="pill con">${ui().icon("x", 12)} ${x}</span>`));
      if (pills.childNodes.length) {
        pills.classList.add("pill-list");
        top.appendChild(pills);
      }
    }

    // Hero image
    const hero = document.getElementById("article-hero");
    if (hero && post.hero) {
      hero.src = post.hero;
      hero.alt = post.title;
      hero.style.display = "block";
    }

    // Markdown content body
    const bodyEl = document.getElementById("article-body");
    if (bodyEl) {
      try {
        const marked = await loadMarked();
        bodyEl.innerHTML = marked.parse(post.body || "");
      } catch (_) {
        bodyEl.textContent = post.body || "";
      }
    }

    // Inline product cards featured in this post
    const prodBox = document.getElementById("article-products");
    if (prodBox && (post.products || []).length) {
      prodBox.innerHTML = `
        <div class="section-head" style="margin-top:2.5rem;margin-bottom:1rem">
          <h2 class="section-title">Products Featured in this Review</h2>
        </div>
        <div class="grid-products" id="post-prod-grid"></div>`;
      const grid = document.getElementById("post-prod-grid");
      for (const pSlug of post.products) {
        const p = window.BL.data.getProduct(pSlug);
        if (p) grid.appendChild(window.BL.catalog.productCard(p));
      }
    }
  }

  window.BL = window.BL || {};
  window.BL.post = { renderPostList, renderArticle };
})();
