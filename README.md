# Utility Store — Free Review Blog + Affiliate Catalog

A dark, Vercel-inspired storefront (per UtilixVerse design tokens) that looks like a modern
shopping site, runs **100% free** on GitHub Pages, and monetizes via **Meesho / Amazon.in
affiliate links**. No servers, no databases, no payment handling.

## ⚡ 15-minute setup

1. **Create a public GitHub repo** named `utility-store` and push this folder to it.
2. **GitHub Pages:** repo → Settings → Pages → Source: **GitHub Actions**. (The included
   workflow builds and deploys on every push.)
3. **Point the config at your repo** (2 small edits):
   - `admin/config.yml` → replace both `CHANGE-ME` occurrences with your GitHub username.
   - `assets/js/config.js` → set `owner` and `repo` (leave empty to auto-detect on `*.github.io`).
   - Optional: repo → Settings → Secrets and variables → Actions → variable `SITE_URL`
     (e.g. `https://you.github.io/utility-store`) to enable sitemap/canonical URLs.
4. **CMS login:** visit `https://you.github.io/utility-store/admin/` → sign in with GitHub →
   authorize → paste a **fine-grained Personal Access Token** (Contents: Read & write on this
   repo only) when the device-flow prompt appears.
5. **Monetization:** sign up at [EarnKaro](https://earnkaro.com) (free, no KYC) → create tracked
   Meesho links → paste them into each product's *Buy link — Meesho* field in the CMS. Apply to
   [Amazon Associates India](https://affiliate-program.amazon.in/) too (₹2,500 payout threshold;
   3 sales within 180 days required — start early).

## 🧩 How "no redeploy" works

- The **site shell** (HTML/CSS/JS) deploys once via Actions.
- All content (products, prices, affiliate links, reviews, banners) is read **live at runtime**
  from your repo: `raw.githubusercontent.com` → jsDelivr fallback → bundled `data/index.json`
  snapshot. Cached 5 minutes in localStorage.
- CMS publish → files committed → live on the site within minutes. **No build, no terminal.**
- GitHub Actions also generates SEO extras on every push (static `/p/<slug>/` pages, sitemap,
  RSS, JSON-LD) — automatic and zero-touch.

## 🏷️ Homepage categories (your rule)

Categories on the homepage are **derived from the product data**: a category card (with
4-thumbnail collage, like Amazon department cards) appears only when it has at least one product.
Add the first product to a new category in the CMS → the card appears automatically. Delete the
last product → it disappears. (Set `hide: true` on a category to force it off home.)

## 📁 Where things live

```
products/*.md     catalog items (CMS "Products")
categories/*.md   category cards (CMS "Categories")
posts/*.md        review blog (CMS "Reviews & Posts")
banners/*.md      hero banner copy (CMS "Hero Banners")
settings/site.md  site name/tagline/contact (CMS "Site Settings")
media/            images uploaded via CMS
admin/            Sveltia CMS dashboard
assets/js/data.js the live data layer — no-redeploy magic
scripts/build.mjs snapshot + SEO extras (runs in CI)
```

## 🧪 Local preview

```bash
npx serve .            # or: python -m http.server 8000
# open http://localhost:8000  (site)  and  /admin/  (CMS)
node scripts/build.mjs # regenerate data/index.json + dist/
```

> For the CMS to save to GitHub, it must be reachable at a public URL (or use its local
> development mode with a local repo path). Local preview is for the storefront UI.

## ⚖️ Compliance

Affiliate disclosure is rendered in the footer of every page and on every review. Keep it —
both Amazon and affiliate networks require it.
