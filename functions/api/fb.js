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


/* ---- Wpisy z Facebooka (Graph API) ----
   Token strony (Page Access Token) — wklejony w panelu (KV „fb:token”, nigdy nie jest odsyłany)
   albo zmienna środowiskowa FB_TOKEN. Wpisy trzymane w KV przez 15 minut. Zdjęcia idą przez /api/fbimg,
   więc przeglądarka odwiedzającego nie łączy się z Facebookiem (RODO, bez cookies). */
const TTL = 15 * 60 * 1000;
const GRAPH_V = 'v23.0'; // wersja Graph API (można nadpisać zmienną FB_API_VERSION)
const FIELDS = 'message,story,created_time,permalink_url,full_picture,status_type,attachments{media_type,title,description,subattachments.limit(6){media}}';

async function getToken(env) { return (env.CMS && await env.CMS.get('fb:token')) || env.FB_TOKEN || ''; }
function img(u) { return u ? '/api/fbimg?u=' + encodeURIComponent(u) : ''; }

async function refresh(env, limit) {
  const token = await getToken(env);
  if (!token) return { ok: false, error: 'no-token', message: 'Brak tokenu strony Facebooka — wklej go w panelu (Facebook → Wpisy na stronie).' };
  const u = 'https://graph.facebook.com/' + (env.FB_API_VERSION || GRAPH_V) + '/me/posts?fields=' + encodeURIComponent(FIELDS) + '&limit=' + limit + '&access_token=' + encodeURIComponent(token);
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) return { ok: false, error: 'graph', message: 'Facebook odrzucił zapytanie: ' + ((j.error && j.error.message) || ('HTTP ' + r.status)) };
  const posts = (j.data || []).map(p => {
    const a = (p.attachments && p.attachments.data && p.attachments.data[0]) || {};
    const subs = ((a.subattachments && a.subattachments.data) || []).map(s => s.media && s.media.image && s.media.image.src).filter(Boolean);
    const imgs = (subs.length ? subs : [p.full_picture]).filter(Boolean).slice(0, 6).map(img);
    return { id: p.id, text: p.message || p.story || a.title || '', date: p.created_time, link: p.permalink_url || '', imgs, video: a.media_type === 'video' };
  }).filter(p => p.text || p.imgs.length);
  const out = { posts, at: new Date().toISOString() };
  if (env.CMS) await env.CMS.put('fb:posts', JSON.stringify(out));
  return { ok: true, ...out };
}

export async function onRequestGet({ request, env }) {
  const limit = Math.max(1, Math.min(20, +new URL(request.url).searchParams.get('n') || 8));
  const cached = env.CMS ? await env.CMS.get('fb:posts', 'json') : null;
  if (cached && Date.now() - Date.parse(cached.at) < TTL && cached.posts.length >= Math.min(limit, cached.posts.length)) {
    return json({ ok: true, posts: cached.posts.slice(0, limit), at: cached.at }, 200, { 'Cache-Control': 'public, max-age=120' });
  }
  let out;
  try { out = await refresh(env, 20); } catch (e) { out = { ok: false, error: 'fetch', message: String(e && e.message || e) }; }
  if (!out.ok && cached) out = { ok: true, stale: true, posts: cached.posts, at: cached.at };
  if (out.ok) out.posts = out.posts.slice(0, limit);
  return json(out, out.ok ? 200 : 503, out.ok ? { 'Cache-Control': 'public, max-age=120' } : {});
}

/* POST (panel, wymaga hasła): { token } zapisuje token; { refresh: true } pobiera wpisy od nowa; { remove: true } usuwa token */
export async function onRequestPost({ request, env }) {
  if (!(await authFromRequest(request, env))) return json({ ok: false, error: 'auth' }, 401);
  if (!env.CMS) return noKv();
  let b = {}; try { b = await request.json(); } catch (e) { }
  if (b.remove) { await env.CMS.delete('fb:token'); await env.CMS.delete('fb:posts'); return json({ ok: true, hasToken: !!env.FB_TOKEN }); }
  if (b.token) await env.CMS.put('fb:token', String(b.token).trim());
  if (b.status) return json({ ok: true, hasToken: !!(await getToken(env)) });
  try { return json(await refresh(env, 20)); }
  catch (e) { return json({ ok: false, error: 'fetch', message: String(e && e.message || e) }, 502); }
}
