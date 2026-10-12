# CGTIA deploy checklist

## Firestore rules
Deploy `firestore.rules` from this project (includes `studentInvites` + `_counters`).

## Netlify environment variables (Site → Environment variables)

| Name | Purpose |
|------|---------|
| `FIREBASE_SERVICE_ACCOUNT_B64` | **Required** — one key for all Firebase functions |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` now; later `sk_live_...` |
| `ADMIN_EMAIL` | Inbox that **receives** staff alerts |
| `EMAIL_SENDER` | Gmail address that **sends** mail |
| `EMAIL_PASSWORD` | Gmail **App Password** (not your normal password) |

### Staff email alerts with Gmail (school Gmail)

1. Use the school Gmail (e.g. `admissions@cgtia.org` or the Gmail you use for the academy).
2. Turn on **2-Step Verification** for that Google account.
3. Open [Google App Passwords](https://myaccount.google.com/apppasswords) → create an app password (name it “CGTIA Netlify”).
4. Google shows a 16-character password — copy it.
5. On Netlify set:
   - `EMAIL_SENDER` = that full Gmail address  
   - `EMAIL_PASSWORD` = the 16-character app password (no spaces)  
   - `ADMIN_EMAIL` = same address, or a second inbox that should receive copies  
6. Redeploy the site.

If `EMAIL_SENDER` / `EMAIL_PASSWORD` are missing, functions skip sending mail (no crash).  
`ADMIN_EMAIL` alone is only the “To” address; sending still needs the Gmail sender pair.

### Paystack test mode
Set `PAYSTACK_SECRET_KEY` to your **test** secret (`sk_test_...`). When you go live, change only that value to `sk_live_...` and redeploy.

## Image paths
See `assets/images/README.md` — includes **misc** folder location and how to use Drive/CDN URLs instead of local files.

## Admin backup
Admin → **Backup / export** → download JSON of students, certificates, invites, applications, etc.

## Fee payment links (required)

After deploying this client build:

1. Deploy Firestore rules (includes `feeDefinitions` + `feePaymentLinks`):
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Netlify will pick up the new function `validate-fee-link`.
3. Public fee page is **hidden** — not in the main menu.
   URL shape: `https://YOUR_DOMAIN/pay-fee?token=TOKEN_FROM_ADMIN`
   Students only open links created under Admin → Fees & payment links.
