/* ============================================================
   BazaarLite — post.js (Markdown renderer + inline product cards)
   marked.js from CDN renders the review body; we inject affiliate
   product cards for every slug listed in the post frontmatter.
   Requires: data.js, ui.js, catalog.js, affiliate.js
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

  /* ---------- Reviews listing (reviews.html) ---------- */
  async function renderPostList(container, limit) {
    await window.BL.data.load();
    const { posts } = await window.BL.data.load();
    container.innerHTML = "";
    if (!posts.length) {
      container.innerHTML = `<div class="empty-state">${ui().icon("book", 36)}
        <h3>No reviews yet</h3><p>Publish your first review from the CMS — it appears here instantly.</p></div>`;
      return;
    }
    const grid = document.createElement("div");
    grid.className = "grid-posts";
    const shown = limit ? posts.slice(0, limit) : posts;
    if (!shown.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${ui().icon("book", 30)}<h3>No reviews yet</h3></div>`;
    }
    shown.forEach(post => {
      const card = document.createElement("article");
      card.className = "card post-card";
      const hero = post.hero || "assets/img/placeholder.svg";
      card.innerHTML = `
        <a class="po-media" href="./post.html?post=${encodeURIComponent(post.slug)}">
          <img src="${hero}" alt="" loading="lazy"/>
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

  /* ---------- Article page (post.html) ---------- */
  async function renderArticle() {
    const root = document.getElementById("article-root");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("post");
    await window.BL.data.load();
    const post = window.BL.data.getPost(slug);

    if (!post) {
      root.innerHTML = `<div class="empty-state">${ui().icon("info", 36)}
        <h3>Post not found</h3><p>It may have been unpublished in the CMS.</p>
        <p style="margin-top:1rem"><a class="btn btn-primary" href="./reviews.html">All reviews</a></p></div>`;
      return;
    }

    document.title = `${post.title} | BazaarLite Reviews`;

    // verdict widget + pros/cons
    const top = document.getElementById("article-top");
    if (top) {
      top.innerHTML = "";
      if (post.verdict_score) {
        top.insertAdjacentHTML("beforeend", `
          <div class="verdict">
            <span class="v-num">${post.verdict_score}</span>
            <span class="v-label">Our verdict score<br/>based on hands-on use</span>
          </div>`);
      }
      const pills = document.createElement("div");
      (post.pros || []).forEach(x => pills.insertAdjacentHTML("beforeend", `<span class="pill pro">${ui().icon("check", 11)} ${x}</span>`));
      (post.cons || []).forEach(x => pills.insertAdjacentHTML("beforeend", `<span class="pill con">${ui().icon("x", 11)} ${x}</span>`));
      if (pills.childNodes.length) {
        pills.classList.add("pill-list");
        top.appendChild(pills);
      }
    }

    // hero image
    const hero = document.getElementById("article-hero");
    if (hero && post.hero) {
      hero.src = post.hero; hero.alt = post.title; hero.style.display = "block";
    }

    // markdown body
    const bodyEl = document.getElementById("article-body");
    try {
      const marked = await loadMarked();
      bodyEl.innerHTML = marked.parse(post.body || "");
    } catch (_) {
      bodyEl.innerHTML = `<p>${(post.body || "").replace(/\n\n/g, "</p><p>")}</p>`;
    }

    // affiliate disclosure note
    bodyEl.insertAdjacentHTML("beforeend", `
      <div class="a-note">${ui().icon("info", 14)}
        <span>${post.affiliate_note || window.BL.affiliate.DISCLOSURE}</span>
      </div>`);

    // inline product cards with buy CTAs (the "ad" engine)
    const inline = document.getElementById("inline-products");
    if (inline) {
      const slugs = post.products || [];
      if (!slugs.length) { inline.remove(); return; }
      inline.innerHTML = "";
      slugs.forEach(s => {
        const p = window.BL.data.getProduct(s);
        if (!p) return;
        const card = document.createElement("article");
        card.className = "card";
        card.style.padding = "1rem";
        card.innerHTML = `
          <a href="./product.html?p=${encodeURIComponent(p.slug)}">
            <img src="${p.images[0] || "assets/img/placeholder.svg"}" alt="${p.title}"
                 style="aspect-ratio:1;object-fit:cover;border-radius:8px;margin-bottom:.6rem" loading="lazy"/>
          </a>
          <a href="./product.html?p=${encodeURIComponent(p.slug)}" style="color:var(--text);font-weight:600;font-size:.9rem">${p.title}</a>
          <div class="pc-rating" style="margin-top:.3rem">${ui().stars(p.rating)} <span>${p.rating || "—"}</span></div>
          <div style="display:flex;align-items:baseline;gap:.5rem;margin:.4rem 0 .7rem">
            <b style="font-size:1.05rem">${ui().money(p.price)}</b>
            ${p.mrp > p.price ? `<span class="pc-mrp">${ui().money(p.mrp)}</span>` : ""}
          </div>`;
        card.appendChild(window.BL.affiliate.ctaButtons(p));
        inline.appendChild(card);
      });
    }
  }

  window.BL = window.BL || {};
  window.BL.post = { renderPostList, renderArticle };
})();
