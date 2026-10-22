# CGTIA client: audit notes (code-read pass)

Verified by reading the code. A live browser pass is still needed for the items marked NEEDS BROWSER CHECK.

## Fixed in this pass
- **Public site sign-in (eye icon).** `handleAuthSubmit` read the password with `querySelector('input[type="password"]')`. Clicking the eye switches the field to `type="text"`, so the query found nothing and an empty password was sent. The field now carries `data-auth-password` and is read by that hook.
- **Partners section.** Rebuilt as three rows of rounded partner tiles that move in alternating directions (left, right, left), with edge fade and pause-on-hover. Marquee speed reduced.
- **Test result screen.** Now matches the approved "Answers sent" design: green check, title, score line, dark pill button.
- **Error state.** Shared `status-card is-error` and `status-banner` styles. Used for "Test not available" and the dashboard sign-in error.
- **Desktop portal sections.** Schedule, Attendance, Certificates & ID, Messages, Transcript, and Settings previously fell through to Profile on desktop. Each now has its own desktop view. Messages and Settings reuse the same components as mobile.
- **Desktop Tests list.** Rows were not clickable on desktop. They now open the test.
- **Unknown section IDs** show "Page not found" instead of silently rendering Profile.

## Still to check in a live browser
- **Desktop buttons that work on mobile.** Read-only analysis found no single cause. Run this in desktop DevTools console on the page where a button fails. It reports the element actually receiving the click at that button's center:
  `const b=document.querySelector('button:not([disabled])');const r=b.getBoundingClientRect();console.log(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))`
  If it returns a full-screen overlay (for example `#authScreen`, `#applyScreen`, or `#statusScreen`), that overlay is stuck with pointer-events enabled.
- **Partner tile look on phone and desktop.** The third row reuses the existing partner names. Replace with real logos when available.

## Known dead code
- `src/services/original-module.snippet.js` and `original-classic.raw.js` contain the old password selector but are not imported by the app. Safe to delete.

## Round 2 (this pass)
- **App icon:** icon-192, icon-512, apple-touch-icon and favicons regenerated from the crest logo (crest centred, white background, safe area for maskable icons).
- **Result screen:** restored the ring design and made it animate: slow start, rising shake, lands on the real percentage, then a settle pop. Success (70+) uses royal blue, retry uses plum, unmarked answers use navy.
- **Attendance:** branded month calendar (royal = present, plum = absent, gold ring = today) with month navigation, plus the list below it.
- **Transcript:** one table for CA, test, exam, attendance, score, grade and remark, with the student photo, a summary strip and a print / save-as-PDF button. Shared by mobile and desktop. Reads `ca`, `test`, `exam`, `attendance` from grade records (names taken from the admin app).
- **Notices and offers:** linked notices get an explicit "Open link" button; plain notices keep the chevron; offers show their full text and a clear action, and plain offers render as light cards.
- **Loading:** the splash is now a three-slide carousel with no text until it loads, which removes the text flash.
- **Palette and layout:** four logo colours on the stat tiles, quick links as white cards, consistent gaps, and a header that fades into the page with no white panel.
- **Small phones:** buttons, tiles, the result ring and the transcript are scaled down at widths of 400px and below. Please check on the Galaxy A51 and check whether the stretched button you mean is one I haven't covered.

## Not yet done
- **Admin photo upload:** the student record already has `photoUrl` and the portal shows it. Admin still needs an upload control (Firebase Storage) in the admin app.
- **Admin transcript print:** the admin app needs its own print view of the same table.
- **Desktop splash:** the desktop loading screen still uses the old layout.
- **Multiple announcements on desktop:** the desktop dashboard still shows only the first notice.
