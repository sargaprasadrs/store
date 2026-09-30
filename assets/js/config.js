/* ============================================================
   BazaarLite — Site Configuration
   ------------------------------------------------------------
   The storefront reads product/category/post data LIVE from your
   GitHub repo via CDN. On *.github.io this is auto-detected.
   For local development, fill in owner/repo below.
   ============================================================ */
window.BAZAAR_CONFIG = {
  // GitHub username / org that owns the repo
  owner: "",
  // Repository name (usually "bazaarlite")
  repo: "",
  // Branch the CMS publishes to
  branch: "main",
  // How long fetched content stays fresh in the browser (ms)
  ttl: 5 * 60 * 1000,
  // Site title used in header/title tags (CMS "settings" can override)
  siteName: "BazaarLite",
  tagline: "Smart picks. Honest reviews. Best prices on Meesho & Amazon."
};
