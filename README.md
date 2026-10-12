# CGTIA — React 19 + HTM Buildless

Converted to Master Prompt B architecture (React 19 + HTM + ES Modules).

**Visuals are the original site markup** — not redesigned. Each page injects the original HTML so the UI looks the same.

## Structure
```
/
├── index.html
├── css/app.css          # original styles
├── js/runtime-classic.js # original interactive runtime
├── src/
│   ├── app.js
│   ├── pages/           # one page module per route
│   │   └── content/     # original HTML bodies
│   ├── components/
│   ├── router/
│   └── config/
└── netlify/functions/
```

## Run
Must be served over HTTP (not file://).

- SPCK: Preview
- Desktop: `npx serve .` or `python3 -m http.server 8080`
