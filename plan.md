# Project "Utility Store" — Free Review Blog + Affiliate Catalog (Amazon-style)

> **Goal:** A product-review blog + curated catalog that *looks like Amazon*, costs **₹0/month**,
> and boosts affiliate earnings on **Meesho / Amazon.in**. Reviews and "ad-style" deal posts drive
> click-outs. No payments, no inventory, no checkout of our own.

## Core UX requirements (locked in)

1. **Homepage = Amazon-style category grid.** Each category card shows a 4-thumbnail collage
   (like Amazon department cards), name, and item count.
2. **No empty categories on the homepage.** A category appears automatically the moment its first
   product exists — computed live from data, never hardcoded.
3. **Content updates without redeploying.** Add/edit products, affiliate links, reviews, banners
   from the CMS → changes appear on the live site on the next page load (~minutes). The Pages
   deploy happens once for the site shell; content flows around it.

---

## 1. Architecture — "Deploy the shell once, stream the content"

The trick that removes redeploys: **the storefront reads product data directly from the GitHub
repo at runtime** (via CDN, not the API), instead of from files baked in at build time.

```
┌───────────────────────────┐        ┌──────────────────────────────────┐
│  Sveltia CMS  (/admin)    │        │  GitHub Repository               │
│  browser dashboard:       │──────▶ │  /products/*.md  (catalog)       │
│  products, reviews,       │ commit │  /posts/*.md     (reviews blog)  │
│  banners, links           │        │  /media/*        (images)        │
└───────────────────────────┘        └───────────┬────────────┬───────┘
                                                 │            │
                     runtime CDN fetch           │            │  push trigger
                     (raw.githubusercontent,     ▼            ▼
                      5-min freshness;     ┌──────────────────────────┐
                      jsDelivr fallback)   │ GitHub Actions (auto,    │
                            │              │ zero-touch: SEO extras)  │
                            ▼              │ • /p/<slug>/ static PDPs │
┌───────────────────────────────────────┐  │ • sitemap, RSS, JSON-LD  │
│  GitHub Pages — SITE SHELL            │  └──────────────────────────┘
│  (HTML/CSS/JS deployed ONCE,          │
│   only changes when *code* changes)   │
│  Home · Category pages · Reviews blog │
│  Search · PDP overlay · Cart-list     │
└──────────────────────┬────────────────┘
                       │ click-out (affiliate links live in the data files)
                       ▼
        Meesho (EarnKaro ~15%) · Amazon.in (Associates India)
```

**Why this satisfies "no redeploy":**
- Content (products, links, reviews, banners) lives in repo data files → fetched fresh by the
  browser each visit (localStorage cache with 5-min TTL).
- `raw.githubusercontent.com` serves the latest `main` within minutes of a commit; jsDelivr
  (`cdn.jsdelivr.net/gh/USER/REPO@main/...`) is the fallback mirror with auto-purge on commit.
- No GitHub API calls from visitors → no rate-limit problems, no tokens in the client.
- The automatic Actions build still runs on every push (invisible, needs no action from you) to
  generate SEO bonus files (static PDP pages, sitemap, RSS). **The site works even if you disable
  Actions entirely** — SEO extras are an enhancement, not a dependency.
- You only ever touch code (new features/redesign) → that's the rare "redeploy", and pushing to
  `main` republishes Pages automatically anyway.

## 2. Component Choices & Why

| Layer | Choice | Why |
|---|---|---|
| CMS dashboard | **Sveltia CMS** (fallback: Decap CMS) | Modern UI, media library, drag-drop uploads, GitHub backend, Decap-compatible `config.yml`. Actively maintained. |
| CMS auth | GitHub device flow (fine-grained PAT, zero infra). Optional: `sveltia-cms-auth` Cloudflare Worker for multi-editor OAuth | Paste token once; done. |
| Hosting | **GitHub Pages** (site shell) | Free, HTTPS, custom domain, auto-publish on push to `main`. |
| Live data layer | **raw.githubusercontent.com + jsDelivr fallback**, localStorage 5-min TTL | Content updates without any redeploy; no rate limits for visitors; no secrets. |
| Site build | Vanilla HTML/CSS/JS + `marked.js` (CDN) for rendering Markdown posts/PDP bodies client-side | Zero build framework; all catalog/review rendering is runtime. |
| SEO extras (auto) | GitHub Actions + tiny Node script → static PDP pages, sitemap.xml, RSS, JSON-LD | Free for public repos; zero-touch; optional. |
| Monetization | **EarnKaro** (Meesho ~15%, free, no KYC) · **Amazon Associates India** (₹2,500 NEFT threshold, monthly; 3 sales/180 days rule) | EarnKaro on day 1; Amazon once site has content. |

## 3. Repository Structure

```
utility-store/
├── index.html                 # Home: hero carousel, Amazon-style category grid, deals row, latest reviews
├── category.html              # ?c=<slug> → PLP: grid, filters, sort (reads live data)
├── product.html               # ?p=<slug> → PDP rendered client-side
├── reviews.html               # Blog listing (review posts)
├── post.html                  # ?post=<slug> → review article page
├── admin/
│   ├── index.html             # Sveltia CMS loader
│   └── config.yml             # Collections: products, categories, posts, banners, settings
├── products/<slug>.md         # Catalog items (frontmatter below)
├── categories/<slug>.md       # name, icon emoji, blurb, SEO description
├── posts/<slug>.md            # Review/ad-style articles (blog)
├── media/{products,posts}/    # CMS-uploaded images
├── data/                      # (generated, committed by you or Actions) — ALSO readable raw
│   └── index.json             # built catalog snapshot for fast first paint
├── assets/
│   ├── css/main.css           # Amazon-inspired design system
│   └── js/
│       ├── data.js            # ★ live data layer: fetch repo files, TTL cache, fallbacks
│       ├── catalog.js         # cards, category grid (non-empty only), filters, sort
│       ├── post.js            # markdown rendering for reviews (marked.js)
│       ├── cart.js            # buy-list (localStorage)
│       ├── affiliate.js       # tracked link builder + disclosures
│       └── ui.js              # header, search, drawer, toasts
├── scripts/build.mjs          # (Actions-only) static PDPs, sitemap, RSS, JSON-LD
├── .github/workflows/deploy.yml
└── plan.md
```

### Product frontmatter (CMS form fields)

```markdown
---
title: "Cotton Printed Kurta Set"
slug: cotton-printed-kurta-set
category: fashion-women          # select of existing categories
price: 549
mrp: 1499
currency: INR
rating: 4.3
reviews: 126
images: [/media/products/kurta-set-1.jpg, …]
colors: [Maroon, Teal]
sizes: [S, M, L, XL]
stock_status: in_stock
buy_meesho: "https://…earnkaro-tracked…"
buy_amazon: "https://…amzn.to/…"
featured: true
deal: true
tags: [kurta, ethnic, festive]
added: 2026-09-30
---
Short product description used on cards and PDP.
```

### Review-post frontmatter (the blog that powers affiliate clicks)

```markdown
---
title: "Top 7 Budget Kurta Sets on Meesho Under ₹600 (Tested)"
slug: best-budget-kurta-sets-meesho
type: review            # review | listicle | deal-alert | comparison
hero: /media/posts/kurta-review-hero.jpg
verdict_score: 4.4      # overall score widget
products:               # links posts ↔ catalog (auto-renders product cards inline)
  - cotton-printed-kurta-set
  - rayon-anarkali-set
pros: [cotton fabric, true-to-size, under ₹600]
cons: [limited colors]
affiliate_note: "We earn a commission from links — at no cost to you."
added: 2026-09-30
---
Full review body in Markdown. Inline "Buy on Meesho/Amazon" buttons are auto-injected
next to each referenced product card.
```

## 4. How the three UX requirements are met

### ① Amazon-style homepage categories
`catalog.js` renders a department grid: each card = category name + **4-thumbnail collage** +
item count. Data comes live from the repo (categories/*.md + products/*.md → in-memory join).

### ② Categories appear only when non-empty
Categories are **derived from the product data, never hardcoded**: the homepage renders
`categories.filter(c => products.some(p => p.category === c.slug))`. Add product #1 to a new
category in the CMS → that category card appears on home within minutes. Delete the last product
→ the card disappears. (Optionally `hide: true` frontmatter on a category forces it off home.)

### ③ Updates without redeploy
Everything content-ish (products, prices, affiliate links, reviews, banners, category blurbs)
is repo data read at runtime by `data.js`:
- fetch `raw.githubusercontent.com/USER/REPO/main/products/<slug>.md` (or a combined
  `data/index.json` refreshed via TTL), cache 5 min in localStorage,
- parse YAML frontmatter client-side (tiny parser, no framework),
- fallback chain: localStorage cache → jsDelivr mirror → `data/index.json` shipped with the shell.
Updating an affiliate link in the CMS = live on the site in minutes. No deploy, no build, no terminal.

## 5. Phased Build Plan

### Phase 0 — Accounts & Prerequisites (≈45 min)
- [ ] GitHub account + **public** repo `utility-store` (public ⇒ free Actions).
- [ ] Fine-grained PAT (Contents read/write on this repo only) for CMS login.
- [ ] **EarnKaro** signup (free) → generate tracked Meesho links; note link format.
- [ ] **Amazon Associates India** application (start the 180-day clock early).
- [ ] Optional: Cloudflare account (only if multi-editor OAuth wanted later).

### Phase 1 — Shell + Design System (Day 1)
- [ ] Repo scaffold; `deploy.yml` publishing Pages from `main` (one-time shell deploy).
- [ ] `main.css`: Amazon look — navy `#131921` header, orange CTAs (`#febd69`, `#f0c14b`),
      card shadows, star ratings, deal badges, skeleton loaders, mobile bottom nav, dark mode.
- [ ] Header: logo, category mega-strip, search, buy-list badge; footer with affiliate disclosure.
- [ ] `data.js` live data layer + frontmatter parser; smoke-test with 3 sample products.

### Phase 2 — Homepage + Catalog Engine (Day 2)
- [ ] Hero banner carousel (banners from CMS `settings/banners` collection — editable without redeploy).
- [ ] **Amazon-style category grid** with 4-thumb collages + counts, **non-empty only** (req ②).
- [ ] "Deals of the Day" row (products with `deal: true`), "New Arrivals" row.
- [ ] `category.html` PLP: filters (price, rating, discount), sort, breadcrumbs, result count.
- [ ] Client-side search (title/tags/category) with suggestions dropdown; `/` shortcut.

### Phase 3 — Sveltia CMS Admin (Day 3)
- [ ] `admin/config.yml`: **Products**, **Categories**, **Posts (reviews)**, **Banners**,
      **Site settings** collections; media library → `/media/`.
- [ ] Device-flow login test; editorial workflow ON (drafts → PR → publish = safe).
- [ ] Verify full loop from phone: add product in new category → appears on homepage (~minutes, no deploy).

### Phase 4 — PDP, Buy-list Cart, Reviews Blog (Day 4–5)
- [ ] `product.html` PDP: gallery, rating stars, price block, color/size selectors (visual),
      **price-comparison block** ("Meesho ₹549 · Amazon ₹629 → best price on Meesho"),
      sticky mobile buy-bar, related products, "Read our full review" link if referenced by a post.
- [ ] `cart.js`: "Add to list" + drawer + "Buy all on Meesho" click-out flow.
- [ ] `affiliate.js`: normalize/build tracked URLs, click-out event log (localStorage → analytics later),
      footer + PDP disclosures ("As an Amazon Associate we earn from qualifying purchases").
- [ ] `reviews.html` + `post.html`: blog listing with score badges; article page renders Markdown
      (marked.js) with auto-injected affiliate product cards and CTA buttons; verdict widget;
      ad-style slots ("Deal alert", "Editor's pick") that are just CMS-managed content.

### Phase 5 — SEO & Trust (Day 6)
- [ ] Actions-generated static PDP/post pages + sitemap.xml + RSS + JSON-LD Product/Article schema
      (zero-touch; site runs fine without them).
- [ ] Meta/OG tags per page (client-injected); canonical URLs; Search Console submission.
- [ ] Images lazy-loaded, sized, client-resized in CMS (~1200px/q80).
- [ ] Pages: About, Contact, Privacy, **Affiliate Disclosure**, Disclaimer.

### Phase 6 — Content & Growth (Week 2+)
- [ ] Seed 30–50 products across 5–8 categories; write 4–6 review posts (listicles convert best).
- [ ] Internal linking: every PDP ↔ related review post; homepage "Latest Reviews" row.
- [ ] Analytics (GoatCounter/Umami free) for click-out tracking; iterate on what converts.
- [ ] WhatsApp/Telegram deal-broadcast channel seeded from review posts.

### Phase 7 — Backlog (all free)
- [ ] Multi-editor OAuth worker; Hindi/English i18n (Sveltia has first-class i18n);
      PWA/offline shell; compare drawer; price-drop highlighting; newsletter via MailerSend free tier.

## 6. Costs

| Item | Cost |
|---|---|
| GitHub repo, Pages, Actions (public) | ₹0 |
| Sveltia CMS, jsDelivr, raw.githubusercontent data layer | ₹0 |
| EarnKaro / Cuelinks / Amazon Associates | ₹0 |
| Optional custom domain | ~₹700–900/yr |
| **Total to launch** | **₹0** |

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Runtime data fetch fails / repo file renamed | `data.js` fallback chain: localStorage → jsDelivr mirror → bundled `data/index.json` snapshot. Site never shows blank. |
| raw.githubusercontent staleness (up to ~5 min) | Acceptable for a review blog; TTL + jsDelivr auto-purge keeps it fresh. |
| Client-rendered lists weaker for SEO | Actions auto-generates static PDP/post pages + JSON-LD + sitemap on every push (zero-touch). Reviews (the SEO asset) are content-stable, not link-mutable. |
| Amazon Associates approval (3 sales/180 days) | Lead with EarnKaro/Meesho; apply for Amazon with a content-rich site. |
| No Meesho API ⇒ manual curation | That IS the model; CMS makes it 1–2 min/product. |
| Affiliate disclosure compliance | Permanent footer disclosure, per-post note field, PDP price shown as "on Meesho/Amazon". |
| Repo/media bloat | Client-side image resize at upload; periodic media audit. |

## 8. Launch Checklist

- [ ] 30+ products, 4+ review posts, every category on homepage has ≥1 product
- [ ] CMS round-trip from phone: new product in new category → homepage card appears, no deploy touched
- [ ] Affiliate link update via CMS reflects on live site within minutes (verified)
- [ ] Lighthouse ≥90 perf / ≥95 a11y; JSON-LD valid; sitemap submitted
- [ ] Disclosures live; first tracked click-out visible in EarnKaro dashboard

---

**Next concrete step:** Phase 1 — scaffold the shell, `data.js` live data layer, and the Amazon-style
design system.
