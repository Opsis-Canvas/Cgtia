/**
 * Public image host (third Netlify site)
 */
export const IMAGE_BASE_URL = "https://cgtia-assets.netlify.app";

/** Join base + relative path (no double slashes) */
export function assetUrl(path) {
  if (!path) return "";
  const p = String(path).trim();
  if (/^https?:\/\//i.test(p)) return p;
  return IMAGE_BASE_URL.replace(/\/$/, "") + "/" + p.replace(/^\//, "");
}
