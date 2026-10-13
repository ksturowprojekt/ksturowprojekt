/* Pośrednik dla zdjęć z wpisów Facebooka — tylko serwery zdjęć Facebooka (fbcdn.net).
   Dzięki temu odwiedzający nie łączy się bezpośrednio z Facebookiem. */
const OK = /(^|\.)(fbcdn\.net|fbsbx\.com)$/i;
export async function onRequestGet({ request }) {
  const u = new URL(request.url).searchParams.get('u') || '';
  let x; try { x = new URL(u); } catch (e) { return new Response('Bad url', { status: 400 }); }
  if (x.protocol !== 'https:' || !OK.test(x.hostname)) return new Response('Forbidden', { status: 403 });
  const r = await fetch(x.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return new Response('Not found', { status: 404 });
  const type = r.headers.get('Content-Type') || 'image/jpeg';
  if (!/^image\//.test(type)) return new Response('Forbidden', { status: 403 });
  return new Response(r.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
}
