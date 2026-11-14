/**
 * GET /api/photo?k=exam/<id>.jpg : returns one stored identity photo.
 * Keys are random and only served from the exam photo folder.
 */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const k = new URL(request.url).searchParams.get('k') || '';
  if (!/^exam\/[0-9a-f-]{36}\.jpg$/.test(k) || !env.PHOTOS) return new Response('Not found', { status: 404 });
  const obj = await env.PHOTOS.get(k);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' }
  });
}
