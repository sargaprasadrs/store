/* ============================================================
   UtilixVerse Store — Site Configuration
   ------------------------------------------------------------
   The storefront reads product/category/post data LIVE from your
   GitHub repo via CDN. On *.github.io / store.utilixverse.com this is auto-detected.
   ============================================================ */
window.BAZAAR_CONFIG = {
  // GitHub username / org that owns the repo
  owner: "sargaprasadrs",
  // Repository name
  repo: "store",
  // Branch the CMS publishes to
  branch: "main",
  // How long fetched content stays fresh in the browser (ms)
  ttl: 5 * 60 * 1000,
  // Site title used in header/title tags (CMS "settings" can override)
  siteName: "UV Store",
  tagline: "Smart picks. Honest reviews. Best utility gear & deals."
};
