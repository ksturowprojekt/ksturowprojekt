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

/* GET  /api/content  — najnowsze treści strony (każdy odwiedzający, bez pamięci podręcznej)
   PUT  /api/content  — zapis z panelu (wymaga hasła w nagłówku X-Admin-Password) */
export async function onRequestGet({ env }) {
  if (!env.CMS) return noKv();
  const [state, meta, ph] = await Promise.all([env.CMS.get('cms:state', 'json'), env.CMS.get('cms:meta', 'json'), env.CMS.get('cms:passhash')]);
  return json({ ok: true, state: state || null, updated: meta ? meta.updated : null, defaultPass: !ph && !env.ADMIN_PASSWORD });
}
export async function onRequestPut({ request, env }) {
  if (!env.CMS) return noKv();
  if (!(await authFromRequest(request, env))) { await new Promise(r => setTimeout(r, 600)); return json({ ok: false, error: 'auth' }, 401); }
  const text = await request.text();
  if (text.length > 20 * 1024 * 1024) return json({ ok: false, error: 'too-big', message: 'Dane są za duże (limit 20 MB).' }, 413);
  let data; try { data = JSON.parse(text); } catch (e) { return json({ ok: false, error: 'json' }, 400); }
  if (!data || data._app !== 'ksturow-cms') return json({ ok: false, error: 'format' }, 400);
  if (data.settings) delete data.settings.passHash;
  const updated = new Date().toISOString();
  await env.CMS.put('cms:state', JSON.stringify(data));
  await env.CMS.put('cms:meta', JSON.stringify({ updated }));
  return json({ ok: true, updated });
}
