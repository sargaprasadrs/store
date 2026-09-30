/* ============================================================
   Utility Store — data.js (Live Data Layer)
   ------------------------------------------------------------
   No-redeploy architecture: content is read at RUNTIME from the
   GitHub repo through free CDNs:
     1. jsDelivr data API  → lists files in products/ categories/ posts/
     2. raw.githubusercontent.com → fetches each .md (primary)
     3. cdn.jsdelivr.net  → per-file fallback mirror
     4. data/index.json   → bundled snapshot (shipped with the shell)
   Cache: localStorage, stale-while-revalidate, 5-min TTL.

   Public API:
     BL.data.load()                    → Promise<{products, categories, posts, settings}>
     BL.data.getProduct(slug)          → product | null
     BL.data.getCategory(slug)         → category | null
     BL.data.getPost(slug)             → post | null
     BL.data.productsIn(categorySlug)  → [products]
     BL.data.visibleCategories()       → [categories with ≥1 product]   (req ②)
   ============================================================ */
(function () {
  "use strict";

  const base = Object.assign(
    { owner: "", repo: "", branch: "main", ttl: 5 * 60 * 1000 },
    window.BAZAAR_CONFIG || {}
  );

  // --- Auto-detect repo coordinates on GitHub Pages -------------
  (function detect() {
    const segs = location.pathname.split("/").filter(Boolean);
    if (location.hostname.endsWith(".github.io")) {
      base.owner = base.owner || location.hostname.split(".")[0];
      base.repo = base.repo || (segs[0] ? segs[0] : location.hostname.split(".")[0]);
      // project pages live at /<repo>/ — media needs that prefix
      base.basePath = segs[0] && segs[0] !== base.repo ? "" : "/" + base.repo;
    } else {
      base.basePath = "";
    }
  })();

  // Media saved with a leading slash must be re-rooted under basePath
  const fixPath = v =>
    typeof v === "string" && v.startsWith("/") && !v.startsWith("//")
      ? base.basePath + v : v;

  const hasRepo = () => !!(base.owner && base.repo);

  const CACHE_KEY = "bl_cache_v1";

  // ---------------- YAML (subset) + frontmatter ----------------
  function coerce(v) {
    if (v == null) return "";
    v = String(v).trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
        (v.startsWith("'") && v.endsWith("'") && v.length > 1)) return v.slice(1, -1);
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      if (!inner) return [];
      return splitTop(inner).map(coerce);
    }
    if (v === "true") return true;
    if (v === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }
  // split "a, b, [c, d]" on top-level commas
  function splitTop(s) {
    const out = []; let depth = 0, cur = "", q = null;
    for (const ch of s) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === "[") { depth++; cur += ch; continue; }
      if (ch === "]") { depth--; cur += ch; continue; }
      if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function parseYAML(str) {
    const lines = str.split(/\r?\n/);
    let i = 0;
    const KEY = /^([A-Za-z0-9_-]+):\s*(.*)$/;
    // Indentation-based subset parser: maps, block lists,
    // lists of objects (Sveltia image/alt style), nested blocks.
    function parseBlock(indent) {
      const obj = {}, list = [];
      let kind = null;
      while (i < lines.length) {
        const raw = lines[i];
        if (!raw.trim() || raw.trim().startsWith("#")) { i++; continue; }
        const cur = raw.match(/^\s*/)[0].length;
        if (cur < indent) break;
        if (cur > indent) { i++; continue; }
        const t = raw.trim();
        if (t.startsWith("- ") || t === "-") {
          kind = kind || "list";
          const itemText = t.replace(/^^-\s+/, "").trim();
          i++;
          if (itemText && /^[A-Za-z0-9_-]+\s*:/.test(itemText) && !/^https?:/.test(itemText)) {
            // object item: first pair inline after the dash, rest on deeper lines
            const sub = {};
            const m = itemText.match(KEY);
            if (m) sub[m[1]] = coerce(m[2]);
            while (i < lines.length) {
              const l2 = lines[i];
              if (!l2.trim()) { i++; continue; }
              const ind2 = l2.match(/^\s*/)[0].length;
              if (ind2 <= cur) break;
              const m2 = l2.trim().match(KEY);
              if (m2) sub[m2[1]] = coerce(m2[2]);
              i++;
            }
            list.push(sub);
          } else {
            list.push(coerce(itemText));
          }
          continue;
        }
        const kv = t.match(KEY);
        if (!kv) { i++; continue; }
        kind = kind || "map";
        if (kv[2] === "") {
          i++;
          // block value (list or nested map) on deeper lines?
          let j = i, next = null;
          while (j < lines.length) {
            const lt = lines[j].trim();
            if (lt && !lt.startsWith("#")) { next = lines[j]; break; }
            j++;
          }
          if (next && next.match(/^\s*/)[0].length > indent) {
            obj[kv[1]] = parseBlock(next.match(/^\s*/)[0].length);
            continue;
          }
          obj[kv[1]] = "";
          continue;
        }
        obj[kv[1]] = coerce(kv[2]);
        i++;
      }
      return kind === "list" ? list : obj;
    }
    const out = parseBlock(0);
    return out && typeof out === "object" && !Array.isArray(out) ? out : {};
  }
  function parseFrontmatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: (text || "").trim() };
    return { data: parseYAML(m[1]), body: m[2].trim() };
  }

  // ---------------- Fetch helpers -------------------------------
  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status + " " + url);
    return res.text();
  }
  async function fetchRepoFile(path) {
    if (!hasRepo()) throw new Error("repo-not-configured");
    const raw = `https://raw.githubusercontent.com/${base.owner}/${base.repo}/${base.branch}/${path}`;
    try { return await fetchText(raw); }
    catch (_) {
      const cdn = `https://cdn.jsdelivr.net/gh/${base.owner}/${base.repo}@${base.branch}/${path}`;
      return await fetchText(cdn);
    }
  }
  // List *.md files in a directory via jsDelivr's free data API
  async function listDir(dir) {
    if (!hasRepo()) throw new Error("repo-not-configured");
    const urls = [
      `https://data.jsdelivr.com/v1/packages/gh/${base.owner}/${base.repo}@${base.branch}/flat`,
      `https://data.jsdelivr.com/v1/package/gh/${base.owner}/${base.repo}@${base.branch}/flat`
    ];
    let files = null;
    for (const u of urls) {
      try {
        const res = await fetch(u, { cache: "no-cache" });
        if (!res.ok) continue;
        const json = await res.json();
        files = (json.files || []).map(f => f.name || f);
        break;
      } catch (_) { /* try next */ }
    }
    if (!files) throw new Error("listing-failed");
    const prefix = "/" + dir + "/";
    return files
      .filter(n => typeof n === "string" && n.startsWith(prefix) && n.endsWith(".md"))
      .map(n => n.slice(prefix.length));
  }

  async function loadDir(dir, mapFn) {
    let names = [];
    try { names = await listDir(dir); }
    catch (_) { return []; }
    const out = [];
    const CONC = 8;
    for (let i = 0; i < names.length; i += CONC) {
      const batch = names.slice(i, i + CONC);
      const results = await Promise.all(batch.map(async name => {
        try {
          const text = await fetchRepoFile(`${dir}/${name}`);
          const slug = name.replace(/\.md$/, "");
          return mapFn(slug, parseFrontmatter(text));
        } catch (_) { return null; }
      }));
      for (const r of results) if (r) out.push(r);
    }
    return out;
  }

  // ---------------- Mappers ------------------------------------
  const mapProduct = (slug, fm) => Object.assign({}, fm, {
    slug: fm.slug || slug,
    category: fm.category || "uncategorised",
    price: Number(fm.price) || 0,
    mrp: Number(fm.mrp) || 0,
    rating: Number(fm.rating) || 0,
    reviews: Number(fm.reviews) || 0,
    // images may be strings or {image, alt} objects (Sveltia sub-fields) — normalize
    images: (Array.isArray(fm.images) ? fm.images : [])
      .map(im => fixPath(typeof im === "object" && im ? (im.image || im.url || im.path || "") : im))
      .filter(Boolean),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    featured: !!fm.featured,
    deal: !!fm.deal,
    added: fm.added || ""
  });
  const mapCategory = (slug, fm) => Object.assign({}, fm, {
    slug: fm.slug || slug,
    hide: !!fm.hide,
    name: fm.name || fm.title || slug
  });
  const mapPost = (slug, fm) => Object.assign({}, fm, {
    slug: fm.slug || slug,
    type: fm.type || "review",
    hero: fixPath(fm.hero || ""),
    products: Array.isArray(fm.products) ? fm.products : [],
    pros: Array.isArray(fm.pros) ? fm.pros : [],
    cons: Array.isArray(fm.cons) ? fm.cons : [],
    verdict_score: Number(fm.verdict_score) || 0
  });

  // ---------------- Fresh fetch --------------------------------
  async function fetchAll() {
    const [products, categories, posts, settings] = await Promise.all([
      loadDir("products", mapProduct),
      loadDir("categories", mapCategory),
      loadDir("posts", mapPost),
      loadDir("settings", (slug, fm) => Object.assign({}, fm, { slug }))
    ]);
    products.sort((a, b) => String(b.added).localeCompare(String(a.added)));
    posts.sort((a, b) => String(b.added).localeCompare(String(a.added)));
    return { products, categories, posts, settings: settings[0] || {}, fetchedAt: Date.now() };
  }

  async function loadSnapshot() {
    try {
      const res = await fetch("data/index.json", { cache: "no-cache" });
      if (!res.ok) return null;
      const json = await res.json();
      return {
        products: (json.products || []).map(p => mapProduct(p.slug, p)),
        categories: (json.categories || []).map(c => mapCategory(c.slug, c)),
        posts: (json.posts || []).map(p => mapPost(p.slug, p)),
        settings: json.settings || {},
        fetchedAt: Date.now(),
        snapshot: true
      };
    } catch (_) { return null; }
  }

  // ---------------- Cache (stale-while-revalidate) --------------
  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); }
    catch (_) { return null; }
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  let memory = null;
  let inflight = null;

  async function refresh(force) {
    const cached = readCache();
    if (!force && cached && Date.now() - cached.fetchedAt < base.ttl) return cached;
    try {
      const fresh = await fetchAll();
      if (fresh.products.length || fresh.categories.length || fresh.posts.length) {
        writeCache(fresh);
        return fresh;
      }
      throw new Error("empty");
    } catch (err) {
      if (cached) return cached;                 // stale cache beats nothing
      const snap = await loadSnapshot();         // bundled snapshot fallback
      if (snap) return snap;
      return { products: [], categories: [], posts: [], settings: {}, fetchedAt: Date.now(), offline: true };
    }
  }

  // ---------------- Public API ---------------------------------
  async function load() {
    if (memory && Date.now() - memory.fetchedAt < base.ttl) return memory;
    if (inflight) return inflight;
    const cached = readCache();
    if (cached) memory = cached;                 // instant stale paint
    inflight = (async () => {
      const data = await refresh(false);
      memory = data;
      inflight = null;
      // background revalidate if we served stale
      if (Date.now() - data.fetchedAt > base.ttl) {
        refresh(true).then(fresh => { memory = fresh; });
      }
      return memory;
    })();
    return inflight;
  }

  const getProduct   = slug => (memory?.products || []).find(p => p.slug === slug) || null;
  const getCategory  = slug => (memory?.categories || []).find(c => c.slug === slug) || null;
  const getPost      = slug => (memory?.posts || []).find(p => p.slug === slug) || null;
  const productsIn   = slug => (memory?.products || []).filter(p => p.category === slug);
  // Requirement ②: a category is visible on home only when it has ≥1 product
  const visibleCategories = () => {
    const cats = memory?.categories || [];
    const used = new Set((memory?.products || []).map(p => p.category));
    return cats.filter(c => !c.hide && used.has(c.slug));
  };

  window.BL = window.BL || {};
  window.BL.data = { load, getProduct, getCategory, getPost, productsIn, visibleCategories, parseFrontmatter, config: base };
})();
