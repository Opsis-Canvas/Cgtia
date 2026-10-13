/**
 * Adapt Netlify-style handler(event) → Cloudflare Pages onRequest
 */
export function netlifyToCf(handler) {
  return async function onRequest(context) {
    const { request, env } = context;
    try {
      if (env && typeof process !== "undefined" && process.env) {
        for (const k of Object.keys(env)) {
          if (env[k] != null && process.env[k] == null) {
            process.env[k] = String(env[k]);
          }
        }
      }
    } catch (e) {}

    const url = new URL(request.url);
    const headers = {};
    request.headers.forEach((v, k) => {
      headers[k] = v;
      headers[k.toLowerCase()] = v;
    });

    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try { body = await request.text(); } catch (e) { body = null; }
    }

    const event = {
      httpMethod: request.method,
      headers,
      rawUrl: request.url,
      path: url.pathname,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      body,
      isBase64Encoded: false
    };

    try {
      const result = await handler(event, context);
      const status = (result && result.statusCode) || 200;
      const resHeaders = Object.assign(
        { "Content-Type": "application/json" },
        (result && result.headers) || {}
      );
      return new Response(result && result.body != null ? result.body : "", {
        status,
        headers: resHeaders
      });
    } catch (err) {
      console.error("cf function error", err);
      return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  };
}
