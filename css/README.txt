# Night mode fixes for CGTIA CareEd student portal

Drop-in: replace `css/portal.css` on the client site with the file in this folder.

What was fixed:
- Huge white / light band on every page in night mode (forced `#eef1f7` shell background)
- Empty states (messages, attendance, certificates, notifications, etc.) no longer pure white
- Calendar day cells, schedule rows, fees actions, transcript, filter chips
- Quiz / test interview options and result screen
- Lesson scroll fade gradients (top/bottom blend) for dark
- Sticky header soft fade instead of a hard white strip
- Dashboard banner: person / placeholder rises above the card edge (overflow visible)
- Inputs, more-tiles, drawer, profile cells, promo plain chips, chips/badges contrast

Theme attribute: `html[data-theme="dark"]` (already used by the portal toggle).
