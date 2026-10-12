/**
 * CGTIA Worker entry
 * - Enables Runtime variables & secrets (assets-only Workers cannot have env)
 * - Serves the static site from the ASSETS binding
 * - /api/* can be extended to call your function handlers later
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Optional: health check so you can confirm the Worker (not only assets) is live
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          hasPaystackKey: Boolean(env.PAYSTACK_SECRET_KEY),
          hasFirebase: Boolean(env.FIREBASE_SERVICE_ACCOUNT_B64),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Static site (SPA) via assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "CGTIA Worker is running but ASSETS binding is missing. Check wrangler.toml [assets] binding.",
      { status: 500 }
    );
  },
};
