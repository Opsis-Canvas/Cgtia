Patch: Cloudflare static pages + API-only functions

Copy these files into the ROOT of your Cloudflare client repo (overwrite):

  wrangler.toml
  _routes.json
  _redirects
  _headers
  worker.js
  CLOUDFLARE-DEPLOY.md

Then push / redeploy Pages.

Result:
  - Home, About, Tuition, Gallery… = static (no Worker credits)
  - /api/* only = Functions (Paystack, webhooks, email, invites)
 