/* ============================================================
   Utility Store — build.mjs (GitHub Actions only)
   1. Reads products/, categories/, posts/, settings/
   2. Writes data/index.json (runtime snapshot for data.js fallback
      and fast first paint)
   3. Generates SEO extras: /p/<slug>/ static PDPs, /review/<slug>/
      static post pages, sitemap.xml, robots.txt, feed.xml
   4. Stages the deployable site into dist/
   The storefront works WITHOUT this script (live CDN data layer);
   these outputs are pure SEO/perf bonuses and the snapshot fallback.
   ============================================================ */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SITE = process.env.SITE_URL || "";

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rupee = n => "₹" + Number(n || 0).toLocaleString("en-IN");

async function readCollection(dir) {
  const out = [];
  try {
    const files = (await fs.readdir(path.join(ROOT, dir))).filter(f => f.endsWith(".md"));
    for (const f of files) {
      const raw = await fs.readFile(path.join(ROOT, dir, f), "utf8");
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      const data = {};
      if (m) {
        // server-side YAML subset (flat keys + block lists)
        let key = null;
        for (const line of m[1].split(/\r?\n/)) {
          if (!line.trim()) continue;
          const list = line.match(/^\s+-\s+(.*)$/);
          if (list && key) { (data[key] = data[key] || []).push(list[1].replace(/^["']|["']$/g, "")); continue; }
          const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
          if (kv) { key = kv[1]; data[key] = kv[2].replace(/^["']|["']$/g, ""); }
        }
      }
      const slug = (data.slug || f.replace(/\.md$/, "")).trim();
      out.push({ ...data, slug, body: (m ? m[2] : raw).trim() });
    }
  } catch (_) { /* dir missing */ }
  return out;
}

const siteMd = (await readCollection("settings")).find(s => s.slug === "site") || {};
const products = (await readCollection("products")).map(p => ({
  ...p, price: Number(p.price) || 0, mrp: Number(p.mrp) || 0,
  rating: Number(p.rating) || 0, reviews: Number(p.reviews) || 0,
  featured: p.featured === "true", deal: p.deal === "true"
}));
const categories = await readCollection("categories");
const posts = await readCollection("posts");

const bySlugCat = Object.fromEntries(categories.map(c => [c.slug, c]));
const productsIn = slug => products.filter(p => p.category === slug);
const visibleCats = categories.filter(c => c.hide !== "true" && productsIn(c.slug).length);

// ---------- 1. data/index.json snapshot ----------
const snapshot = {
  generatedAt: new Date().toISOString(),
  settings: { site_name: siteMd.site_name || "UV Store", tagline: siteMd.tagline || "" },
  categories,
  products,
  posts
};
await fs.mkdir(path.join(ROOT, "data"), { recursive: true });
await fs.writeFile(path.join(ROOT, "data", "index.json"), JSON.stringify(snapshot));

// ---------- 2. dist staging ----------
await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(DIST, { recursive: true });
for (const entry of ["index.html", "category.html", "product.html", "reviews.html", "post.html", "about.html",
                     "admin", "assets", "data", "media", "plan.md", "README.md", "CNAME",
                     "favicon.ico", "favicon.svg", "icon.svg", "icon-light.svg", "icon-192.png", "icon-512.png"]) {
  try { await fs.cp(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true }); }
  catch (_) { console.warn("skip:", entry); }
}

// ---------- 3. static SEO pages ----------
const pageShell = (title, desc, canonical, body, jsonld) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"/>
${SITE ? `<link rel="canonical" href="${SITE}${canonical}"/>` : ""}
<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(desc)}"/>
<script type="application/ld+json">${jsonld}</script>
<link rel="stylesheet" href="${"/".repeat(0)}assets/css/main.css"/>
</head><body><main class="container">${body}
<p style="padding:1rem 0"><a class="btn btn-primary" href="../index.html">← Back to UV Store</a></p>
</main></body></html>`;

// Static PDPs: full product content for crawlers
for (const p of products) {
  const cat = bySlugCat[p.category];
  const dir = path.join(DIST, "p", p.slug);
  await fs.mkdir(dir, { recursive: true });
  const jsonld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product",
    name: p.title, description: p.body, image: (p.images || []).map(i => String(i).replace(/^\//, "")),
    aggregateRating: p.rating ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews || 1 } : undefined,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "INR", availability: p.stock_status === "unavailable" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" }
  });
  const body = `
  <nav class="crumbs"><a href="../index.html">Home</a><span class="sep">/</span>
    <a href="../category.html?c=${encodeURIComponent(p.category)}">${esc(cat?.name || "Catalog")}</a>
    <span class="sep">/</span><span>${esc(p.title)}</span></nav>
  <h1 class="page-title">${esc(p.title)}</h1>
  <p class="page-sub">${p.rating ? `${p.rating}★ (${p.reviews || 0}) · ` : ""}${esc(cat?.name || "")}</p>
  <div class="pdp-price-block"><span class="pdp-price">${rupee(p.price)}</span>
    ${p.mrp > p.price ? `<span class="pdp-mrp">${rupee(p.mrp)}</span><span class="pdp-off">${Math.round((1 - p.price / p.mrp) * 100)}% off</span>` : ""}</div>
  <p>${esc(p.body)}</p>
  <p><a class="btn btn-success" href="${esc(p.buy_meesho || "#")}" rel="nofollow sponsored">Buy on Meesho →</a>
     ${p.buy_amazon ? `<a class="btn btn-secondary" href="${esc(p.buy_amazon)}" rel="nofollow sponsored">See on Amazon.in →</a>` : ""}</p>
  <p style="color:var(--text-3);font-size:.85rem">Full interactive experience: <a href="../product.html?p=${encodeURIComponent(p.slug)}">open live product page</a></p>`;
  await fs.writeFile(path.join(dir, "index.html"), pageShell(`${p.title} — ${rupee(p.price)} | UV Store`, p.body, `/p/${p.slug}/`, body, jsonld));
}

// Static post pages
for (const post of posts) {
  const dir = path.join(DIST, "review", post.slug);
  await fs.mkdir(dir, { recursive: true });
  const paras = post.body.split(/\n{2,}/).map(t => t.startsWith("## ") ? `<h2>${esc(t.slice(3))}</h2>` : `<p>${esc(t)}</p>`).join("\n");
  const jsonld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article",
    headline: post.title, datePublished: post.added,
    review: post.verdict_score ? { "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: post.verdict_score } } : undefined
  });
  const body = `
  <h1 class="page-title">${esc(post.title)}</h1>
  <p class="page-sub">${esc(post.type)} · ${esc(post.added)}${post.verdict_score ? ` · verdict ${post.verdict_score}/5` : ""}</p>
  ${paras}
  ${(post.products || []).length ? `<h2>Products in this review</h2><ul>${post.products.map(s => {
    const p = products.find(x => x.slug === s);
    return p ? `<li><a href="../p/${encodeURIComponent(s)}/">${esc(p.title)}</a> — ${rupee(p.price)}</li>` : "";
  }).join("")}</ul>` : ""}
  <p style="color:var(--text-3);font-size:.85rem">Full article: <a href="../post.html?post=${encodeURIComponent(post.slug)}">open live review</a></p>`;
  await fs.writeFile(path.join(dir, "index.html"), pageShell(`${post.title} | UV Store Reviews`, post.body.slice(0, 150), `/review/${post.slug}/`, body, jsonld));
}

// ---------- 4. sitemap + robots + rss ----------
const urls = ["", "category.html", "reviews.html", "about.html",
  ...products.map(p => `p/${p.slug}/`), ...posts.map(p => `review/${p.slug}/`)];
if (SITE) {
  const today = new Date().toISOString().slice(0, 10);
  await fs.writeFile(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
  await fs.writeFile(path.join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE}/sitemap.xml\n`);
  await fs.writeFile(path.join(DIST, "feed.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>UV Store Reviews</title><link>${SITE}</link><description>Product reviews &amp; deal alerts</description>\n` +
    posts.map(p => `  <item><title>${esc(p.title)}</title><link>${SITE}/review/${encodeURIComponent(p.slug)}/</link><pubDate>${new Date(p.added || Date.now()).toUTCString()}</pubDate><description>${esc(p.body.slice(0, 300))}</description></item>`).join("\n") +
    `\n</channel></rss>\n`);
}

console.log(`✔ build: ${products.length} products, ${categories.length} categories (${visibleCats.length} visible), ${posts.length} posts`);
console.log(`✔ snapshot: data/index.json · static pages: /p/*, /review/* · sitemap ${SITE ? "on" : "off (set SITE_URL)"}`);
