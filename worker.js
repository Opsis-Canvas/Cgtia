/**
 * NOT USED for normal Cloudflare Pages deploys of CGTIA.
 *
 * Pages serves HTML/CSS/JS as static assets (no Worker per page view).
 * API routes live in functions/api/* and only run for /api/...
 *
 * Do not set main = "worker.js" in wrangler.toml or every page hit
 * will consume Worker request credits.
 *
 * Optional local health check only if you intentionally deploy a Worker:
 */
export default {
  async fetch() {
    return new Response(
      "CGTIA: use Cloudflare Pages + functions/api. This Worker entry is intentionally unused for static pages.",
      { status: 200, headers: { "Content-Type": "text/plain" } }
    );
  },
};
 