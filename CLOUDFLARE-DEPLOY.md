# Cloudflare Pages deploy (Git)

## Dashboard settings (must match)

- Framework preset: **None**
- Build command: **leave EMPTY** (do not use `wrangler deploy`)
- Build output directory: **/** or **.**
- Root directory: **/** (repo root)

## wrangler.toml

Uses `pages_build_output_dir = "."` so Cloudflare does not look for a Worker entry file.

## After deploy

Set Environment variables:
- PAYSTACK_SECRET_KEY
- FIREBASE_SERVICE_ACCOUNT_B64
- (email vars if needed)

Webhook: https://YOUR_DOMAIN/api/paystack-webhook
