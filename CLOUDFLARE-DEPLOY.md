# Cloudflare Pages — static site + API only (saves free-tier credits)

## Goal

| Path | How it is served | Uses Worker / Function credits? |
|------|------------------|----------------------------------|
| `/`, `/about`, `/tuition`, CSS, JS… | **Static** (CDN) | **No** |
| `/api/paystack-webhook`, `/api/confirm-paystack-client`, … | **Pages Function** | **Yes** (only when called) |

## Dashboard (Git or direct upload)

- Framework preset: **None**
- Build command: **empty**
- Build output directory: **.** (or `/`)
- Root: repo root

**Do not** deploy this project as a full-site Worker (`main = worker.js`). That makes every page view a Worker request.

## Config files that enforce this

- `wrangler.toml` → `pages_build_output_dir = "."` only (no `main = worker.js`)
- `_routes.json` → Functions **only** for `/api/*`
- `_redirects` → SPA fallback for client routes
- `functions/api/*.js` → Paystack, email, invites, fee links, etc.

## Environment variables (Pages → Settings → Environment variables)

- `FIREBASE_SERVICE_ACCOUNT_B64`
- `PAYSTACK_SECRET_KEY`
- `EMAIL_SENDER`
- `EMAIL_PASSWORD`
- `ADMIN_EMAIL`

Webhook: `https://YOUR_DOMAIN/api/paystack-webhook`

## After changing config

Redeploy the Pages project so `_routes.json` and `wrangler.toml` apply.
 