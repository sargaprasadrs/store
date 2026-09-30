/* ============================================================
   BazaarLite — cart.js ("Buy list")
   No payment on this site: the list collects products; checkout
   happens on Meesho/Amazon via affiliate click-outs.
   Requires: data.js, affiliate.js, ui.js
   ============================================================ */
(function () {
  "use strict";
  const KEY = "bl_buylist_v1";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (_) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
    if (window.BL && window.BL.ui) window.BL.ui.updateCartBadge();
    if (document.querySelector(".drawer.open")) window.BL.ui.renderDrawer();
  }

  function add(slug, qty) {
    return window.BL.data.load().then(({ products }) => {
      const p = products.find(x => x.slug === slug);
      if (!p) return;
      const list = read();
      const ex = list.find(i => i.slug === slug);
      if (ex) ex.qty += qty || 1;
      else list.push({
        slug: p.slug, title: p.title, price: p.price,
        image: (p.images && p.images[0]) || "", qty: qty || 1
      });
      write(list);
      window.BL.ui.toast("Added to buy list", "check");
    });
  }
  function remove(slug) { write(read().filter(i => i.slug !== slug)); }
  function setQty(slug, qty) {
    const list = read();
    const it = list.find(i => i.slug === slug);
    if (!it) return;
    if (qty <= 0) return remove(slug);
    it.qty = Math.min(qty, 20);
    write(list);
  }
  function clear() { write([]); }
  function list() { return read(); }
  function count() { return read().reduce((s, i) => s + i.qty, 0); }
  function has(slug) { return read().some(i => i.slug === slug); }

  // Open every item's tracked store link (tab throttling: sequential)
  function buyAll(store) {
    const items = read();
    if (!items.length) return;
    window.BL.data.load().then(({ products }) => {
      items.forEach((it, idx) => {
        const p = products.find(x => x.slug === it.slug);
        if (!p) return;
        const url = window.BL.affiliate.buildBuyUrl(p, store);
        if (!url) return;
        setTimeout(() => window.open(url, "_blank", "noopener"), idx * 350);
      });
      window.BL.ui.toast("Opening " + items.length + " product page" + (items.length > 1 ? "s" : "") + "…", "arrow");
    });
  }

  window.BL = window.BL || {};
  window.BL.cart = { add, remove, setQty, clear, list, count, has, buyAll };
})();
