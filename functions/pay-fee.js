/**
 * /pay-fee?token=... : adds link-preview tags (title and the payment image) to the payment page.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').trim();
  let title = 'Payment';
  let feeName = '';
  if (token) {
    try {
      const r = await fetch(url.origin + '/api/validate-fee-link?token=' + encodeURIComponent(token));
      const d = await r.json();
      if (d && d.valid && d.feeName) feeName = d.feeName;
    } catch (e) { /* keep the default title */ }
  }
  if (feeName) title = feeName + ' · CGTIA Payment';
  const page = await env.ASSETS.fetch(new URL('/index.html', url.origin));
  const img = url.origin + '/assets/images/og/payment-og.jpg';
  const desc = 'Pay your school fees securely online. Powered by Caregivers Training and Internship Academy Limited.';
  const tags = `<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CGTIA">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
`;
  const html = (await page.text()).replace('</head>', tags + '</head>').replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>');
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
