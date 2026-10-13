/* ---- wspólne: autoryzacja panelu ----
   Hasło: 1) zmienione w panelu (skrót w KV), 2) zmienna środowiskowa ADMIN_PASSWORD,
   3) awaryjnie hasło demonstracyjne „kosz2026” (ustaw ADMIN_PASSWORD w Cloudflare!). */
const DEMO_PASS = 'kosz2026';
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
async function sha(text) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function checkAuth(env, login, pass) {
  if (!pass) return false;
  if (login !== undefined && login !== (env.ADMIN_LOGIN || 'admin')) return false;
  const stored = env.CMS ? await env.CMS.get('cms:passhash') : null;
  if (stored) return (await sha('ksturow:' + pass)) === stored;
  return pass === (env.ADMIN_PASSWORD || DEMO_PASS);
}
async function authFromRequest(request, env) {
  const pass = request.headers.get('X-Admin-Password') || '';
  let p = pass; try { p = decodeURIComponent(pass); } catch (e) { }
  return checkAuth(env, undefined, p);
}
const noKv = () => json({ ok: false, error: 'no-kv', message: 'Brak podpiętej bazy KV o nazwie CMS w ustawieniach projektu Cloudflare Pages.' }, 503);

/* POST /api/img  { data: "data:image/…;base64,…" } — zapis zdjęcia z panelu, zwraca stały adres */
export async function onRequestPost({ request, env }) {
  if (!env.CMS) return noKv();
  if (!(await authFromRequest(request, env))) return json({ ok: false, error: 'auth' }, 401);
  let b = {}; try { b = await request.json(); } catch (e) { }
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(b.data || ''));
  if (!m) return json({ ok: false, error: 'format' }, 400);
  const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  if (bin.length > 8 * 1024 * 1024) return json({ ok: false, error: 'too-big' }, 413);
  const id = (await sha(m[2])).slice(0, 32) + '.' + (m[1].split('/')[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg'));
  if (!(await env.CMS.get('img:' + id, 'stream'))) await env.CMS.put('img:' + id, bin, { metadata: { type: m[1] } });
  return json({ ok: true, url: '/api/img/' + id });
}
