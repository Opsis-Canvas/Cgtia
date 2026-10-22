# Firestore rules — DO NOT replace blindly

Your project may already have longer rules for certificates, licensing, contact, etc.

**Do not wipe existing rules.** Only **add** these blocks if the collection is missing.

## Add if missing (Promotions / Programs / site content)

```
match /promotions/{id} {
  allow read: if true;
  allow write: if request.auth != null;
}

match /programs/{id} {
  allow read: if true;
  allow write: if request.auth != null;
}

match /siteContent/{id} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Keep your existing matches for
- applications
- wallOfFame / graduates
- certificates / verify
- users (mustChangePassword flow)
- contactMessages
- payments

## Post-payment portal accounts
Handled by Netlify functions (Paystack webhook → `provisionStudentAccount`):
1. Creates Firebase Auth user with temporary password
2. Emails login code to student
3. Sets `users/{uid}.mustChangePassword = true`
4. First Portal login → force password change UI

Requires Netlify env: `EMAIL_SENDER`, `EMAIL_PASSWORD`, Firebase Admin credentials for functions.
