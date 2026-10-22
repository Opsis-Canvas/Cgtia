# What changed vs your previous rules

Kept 100% of your structure, helpers, and portal collections.

## Added collections (section 4)
- `promotions` — public read, admin write (100k offer)
- `wallOfFame` — public read, admin write
- `graduates` — public read, admin write
- `siteContent` — public read, admin write (partners list etc.)
- `payments` — admin only

## applications create — one extra field
Allowed keys now include `resumeToken` (needed for payment recovery links).

## Admin login requirement
`isAdmin()` needs either:
1. Custom claim: `role: admin` on the Auth user, OR
2. Document `users/{uid}` with `role: "admin"` or `"super-admin"` and `active != false`

After creating Auth user in Console, also create Firestore doc:
`users/{thatUid}` → `{ role: "admin", active: true, email: "..." }`
