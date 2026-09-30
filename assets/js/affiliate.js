/* ============================================================
   BazaarLite — affiliate.js
   Builds tracked outbound links ( EarnKaro / Cuelinks / raw ),
   logs click-outs locally (privacy-friendly), and renders the
   "Buy" CTA buttons + price-comparison block.
   ============================================================ */
(function () {
  "use strict";
  const CLICKS = "bl_clickouts_v1";

  const STORES = {
    meesho: { name: "Meesho", color: "#f43397" },
    amazon: { name: "Amazon.in", color: "#ff9900" }
  };

  // Wrap a raw store URL with an affiliate network prefix, if configured.
  function wrap(url, network) {
    if (!url) return url;
    try {
      if (network === "cuelinks") {
        return "https://www.cuelinks.com/redirect?campaign=BL&url=" + encodeURIComponent(url);
      }
      if (network === "earnkaro") {
        return url; // EarnKaro links are already tracked when generated
      }
      return url;
    } catch (_) { return url; }
  }

  function buildBuyUrl(product, store) {
    const raw = store === "amazon" ? product.buy_amazon : product.buy_meesho;
    const net = (window.BAZAAR_CONFIG || {}).affiliate_network || "earnkaro";
    const url = wrap(raw, net);
    if (!url) return null;
    logClick(product.slug, store);
    return url;
  }

  function logClick(slug, store) {
    try {
      const arr = JSON.parse(localStorage.getItem(CLICKS) || "[]");
      arr.push({ slug, store, at: new Date().toISOString() });
      localStorage.setItem(CLICKS, JSON.stringify(arr.slice(-500)));
    } catch (_) {}
  }
  function clicks() {
    try { return JSON.parse(localStorage.getItem(CLICKS) || "[]"); }
    catch (_) { return []; }
  }

  // "Buy" CTA buttons for a product
  function ctaButtons(product, size) {
    const s = size || "";
    const wrap_ = document.createElement("div");
    wrap_.style.cssText = "display:flex;gap:.5rem;flex-wrap:wrap";
    if (product.buy_meesho) {
      const a = document.createElement("a");
      a.className = "btn btn-success " + s;
      a.href = buildBuyUrl(product, "meesho");
      a.target = "_blank"; a.rel = "nofollow sponsored noopener";
      a.innerHTML = window.BL.ui.icon("arrow", 15) + " Buy on Meesho";
      wrap_.appendChild(a);
    }
    if (product.buy_amazon) {
      const a = document.createElement("a");
      a.className = "btn btn-secondary " + s;
      a.href = buildBuyUrl(product, "amazon");
      a.target = "_blank"; a.rel = "nofollow sponsored noopener";
      a.innerHTML = window.BL.ui.icon("arrow", 15) + " See on Amazon";
      wrap_.appendChild(a);
    }
    return wrap_;
  }

  // Price-comparison block (only when both links exist)
  function compareBlock(product) {
    if (!product.buy_meesho || !product.buy_amazon) return null;
    const box = document.createElement("div");
    box.className = "compare-box";
    const meeshoPrice = product.price || 0;
    const amazonPrice = product.buy_amazon_price ? Number(product.buy_amazon_price) : 0;
    const bestIsMeesho = !amazonPrice || meeshoPrice <= amazonPrice;
    box.innerHTML = `
      <div class="compare-row">
        <span class="cr-store"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg> Meesho</span>
        <span style="display:flex;align-items:center;gap:.5rem">
          ${bestIsMeesho ? '<span class="cr-tag">BEST</span>' : ""}
          <span class="cr-price">${window.BL.ui.money(meeshoPrice)}</span>
        </span>
      </div>
      ${amazonPrice ? `
      <div class="compare-row">
        <span class="cr-store"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg> Amazon.in</span>
        <span style="display:flex;align-items:center;gap:.5rem">
          ${!bestIsMeesho ? '<span class="cr-tag">BEST</span>' : ""}
          <span class="cr-price">${window.BL.ui.money(amazonPrice)}</span>
        </span>
      </div>` : ""}
      <div class="compare-row" style="font-size:.75rem;color:var(--text-3)">
        Live prices on the store pages — we may earn a commission.
      </div>`;
    return box;
  }

  const DISCLOSURE = "As an Amazon Associate and affiliate partner, we earn from qualifying purchases made through links on this site — at no extra cost to you.";

  window.BL = window.BL || {};
  window.BL.affiliate = { STORES, buildBuyUrl, ctaButtons, compareBlock, clicks, DISCLOSURE, logClick };
})();
