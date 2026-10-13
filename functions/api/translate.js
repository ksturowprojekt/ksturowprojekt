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

/* POST /api/translate  { texts: [..], to: 'en'|'de', from?: 'pl' } — tłumaczenie treści z panelu
   Wymaga powiązania Workers AI o nazwie AI (Settings → Bindings → Workers AI → Variable name: AI).
   Zachowuje formatowanie: akapity, „### nagłówki”, **pogrubienia**, *kursywę*, znaczniki {nazwa} i [DO UZUPEŁNIENIA]. */
const LANG = { pl: 'polish', en: 'english', de: 'german' };
const MODEL = '@cf/meta/m2m100-1.2b';
async function trOne(env, text, from, to) {
  if (!text || !text.trim()) return text;
  // chronione fragmenty: {znaczniki}, [DO UZUPEŁNIENIA…], adresy www/e-mail
  const keep = [];
  let t = text.replace(/\{[a-z]+\}|\[[^\]]*\]|https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+/g, m => { keep.push(m); return '§' + (keep.length - 1) + '§'; });
  const r = await env.AI.run(MODEL, { text: t, source_lang: LANG[from], target_lang: LANG[to] });
  let out = (r && (r.translated_text || r.response)) || t;
  return out.replace(/§\s*(\d+)\s*§/g, (m, i) => keep[+i] !== undefined ? keep[+i] : m);
}
async function translateMd(env, text, from, to) {
  // akapit po akapicie, z zachowaniem „### ” i podziału linii
  const paras = String(text).split(/\n\s*\n/);
  const out = [];
  for (const p of paras) {
    const m = /^(###\s+)(.*)$/s.exec(p.trim());
    if (m) { out.push(m[1] + (await trOne(env, m[2], from, to)).trim()); continue; }
    const lines = p.split('\n'); const tl = [];
    for (const l of lines) tl.push(l.trim() ? (await trOne(env, l, from, to)).trim() : l);
    out.push(tl.join('\n'));
  }
  return out.join('\n\n');
}
export async function onRequestPost({ request, env }) {
  if (!(await authFromRequest(request, env))) return json({ ok: false, error: 'auth' }, 401);
  if (!env.AI) return json({ ok: false, error: 'no-ai', message: 'Brak powiązania Workers AI o nazwie AI w ustawieniach projektu Cloudflare Pages.' }, 503);
  let b = {}; try { b = await request.json(); } catch (e) { }
  const from = b.from || 'pl', to = b.to;
  if (!LANG[from] || !LANG[to] || from === to) return json({ ok: false, error: 'lang' }, 400);
  const texts = Array.isArray(b.texts) ? b.texts.slice(0, 40).map(x => String(x || '').slice(0, 6000)) : [];
  try {
    const res = [];
    for (let i = 0; i < texts.length; i += 4) {
      const part = await Promise.all(texts.slice(i, i + 4).map(x => translateMd(env, x, from, to)));
      res.push(...part);
    }
    return json({ ok: true, texts: res });
  } catch (e) {
    return json({ ok: false, error: 'ai', message: String(e && e.message || e) }, 502);
  }
}
