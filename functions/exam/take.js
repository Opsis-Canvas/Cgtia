/**
 * /exam/take?token=... : adds link-preview tags (title and branded image) to the exam page.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').trim();
  let title = 'Examination';
  if (token) {
    try {
      const r = await fetch(url.origin + '/api/exam-link?token=' + encodeURIComponent(token));
      const d = await r.json();
      if (d && d.valid && d.title) title = d.title;
    } catch (e) { /* keep the default title */ }
  }
  const page = await env.ASSETS.fetch(new URL('/index.html', url.origin));
  const img = url.origin + '/assets/images/og/exam-og.jpg';
  const desc = 'Click on the link to begin your examination. Powered by Caregivers Training and Internship Academy Limited.';
  const heading = title + ' · CareEd Exam';
  const tags = `<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CGTIA">
<meta property="og:title" content="${esc(heading)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(heading)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">`;
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(esc(heading)); } })
    .on('head', { element(el) { el.append(tags, { html: true }); } })
    .transform(page);
}
