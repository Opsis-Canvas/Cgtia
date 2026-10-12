# Deploy CGTIA on Cloudflare Pages

## Why deploy failed ("Asset too large" / 9000+ files)

Cloudflare was reading a huge tree (often `node_modules`, `.git`, or a full monorepo).
This package is ~2MB and ~130 files. Deploy **only this folder**.

## Steps

1. Create a **Cloudflare Pages** project (not a bare Workers site with every file as a Worker asset if you can avoid it).
2. Upload / connect **this folder only** as the project root.
3. Build settings:
   - **Build command:** (leave empty) or `echo ok`
   - **Build output directory:** `/` or `.`
4. Environment variables (Pages → Settings → Environment variables), same secrets you used on Netlify:
   - `PAYSTACK_SECRET_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_B64`
   - any email SMTP vars your functions use
5. Compatibility: `nodejs_compat` is set in `wrangler.toml`.
6. After deploy, function URLs are:
   - `https://YOUR_DOMAIN/api/validate-fee-link`
   - `https://YOUR_DOMAIN/api/confirm-paystack-client`
   - `https://YOUR_DOMAIN/api/paystack-webhook`
   - etc. (no more `/.netlify/functions/...`)

## Paystack webhook

Point Paystack webhook URL to:
`https://YOUR_DOMAIN/api/paystack-webhook`

## Do not include

- `node_modules/`
- `.git/`
- Large video/image dumps outside `assets/`
- Other projects in the same upload

## SPA routes

`_redirects` sends app routes to `index.html` while leaving `/api/*` alone.
