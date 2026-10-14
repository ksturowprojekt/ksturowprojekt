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

/* ---- wspólne: pobieranie i odczyt stron PZKosz / DZKosz ---- */
const ALLOWED = /(^|\.)(pzkosz\.pl|dzkosz\.wroclaw\.pl|dzkosz\.pl)$/i;
function allowedUrl(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && ALLOWED.test(x.hostname); } catch (e) { return false; } }
async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KSTurowSite/1.0; +https://ksturow.eu)', 'Accept': 'text/html', 'Accept-Language': 'pl' }, cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', oacute: 'ó', Oacute: 'Ó' };
function decode(s) { return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] !== undefined ? ENT[e] : m)); }
function clean(s) { return decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function stripNoise(html) { return String(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ''); }
function htmlToLines(html) {
  return decode(stripNoise(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6]|td|th|span|a|section|article|dt|dd|label)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function rows(html) {
  const out = []; const re = /<tr[\s\S]*?<\/tr>/gi; let m;
  const h = stripNoise(html);
  while ((m = re.exec(h))) { const cells = []; const cr = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi; let c; while ((c = cr.exec(m[0]))) cells.push(clean(c[1])); if (cells.length) out.push(cells); }
  return out;
}
const POS_RE = /(rozgrywający|rzucający|niski skrzydłowy|silny skrzydłowy|środkowy|skrzydłowy|obrońca|center|point guard)(\s*\/\s*(rozgrywający|rzucający|niski skrzydłowy|silny skrzydłowy|środkowy|skrzydłowy))?/i;
const DATE_RE = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
function titleCase(s) {
  return String(s).toLocaleLowerCase('pl').replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('pl'));
}
function isUpperName(s) { return /^[\p{Lu}][\p{Lu}'\- ]+$/u.test(s) && s.length >= 2; }
function personName(s) { s = String(s).replace(/\s+/g, ' ').trim(); return isUpperName(s.replace(/\s/g, '')) || isUpperName(s) ? titleCase(s) : s; }
const NAME_OK = /^[\p{L}][\p{L}'\-]+(\s+[\p{L}][\p{L}'\-]+)+$/u;

/* skład: najpierw tabela (PZKosz), potem karty „Urodzony / Wzrost / Pozycja” (DZKosz) */
function parseRoster(html) {
  const players = [], coaches = [], seen = {};
  function add(p) { const k = p.name.toLocaleLowerCase('pl'); if (!p.name || seen[k]) return; seen[k] = 1; players.push(p); }
  for (const cells of rows(html)) {
    const di = cells.findIndex(c => DATE_RE.test(c));
    if (di >= 0) {
      const name = cells.find((c, i) => i !== di && NAME_OK.test(c) && !POS_RE.test(c));
      if (!name) continue;
      const num = cells.find(c => /^\d{1,2}$/.test(c)) || '';
      const h = cells.map(c => /^(\d{3})\s*cm$/i.exec(c)).find(Boolean);
      const pos = cells.map(c => POS_RE.exec(c)).find(Boolean);
      add({ num, name: personName(name), year: +DATE_RE.exec(cells[di])[3], height: h ? h[1] : '', pos: pos ? pos[0].toLocaleLowerCase('pl').replace(/\s*\/\s*/, ' / ') : '' });
    } else if (cells.length >= 2 && /trener|asystent|kierownik|fizjoterapeut|statystyk/i.test(cells[cells.length - 1]) && NAME_OK.test(cells[0])) {
      coaches.push({ name: personName(cells[0]), role: cells[cells.length - 1] });
    }
  }
  // etykieta w osobnej linii („Urodzony:” / „13.01.2015”) → jedna linia
  const lines = [];
  htmlToLines(html).forEach(l => { const prev = lines[lines.length - 1]; if (prev && /^(Urodzon[ya]|Wzrost|Pozycja|Numer|Nr)\s*:?$/i.test(prev)) lines[lines.length - 1] = prev + ' ' + l; else lines.push(l); });
  const posOf = v => { const pm = POS_RE.exec(v); return pm ? pm[0].toLocaleLowerCase('pl').replace(/\s*\/\s*/, ' / ') : v.trim(); };
  // cała karta zawodnika w jednej linii, np. DZKosz: „13 Mikołaj Bębas Urodzony: 13.01.2015 Wzrost: 148 cm Pozycja: rozgrywający / rzucający”
  const ONE = /^(?:(\d{1,2})\s+)?([\p{L}][\p{L}'\-]+(?:\s+[\p{L}][\p{L}'\-]+){1,3})\s+Urodzon[ya]:?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+Wzrost:?\s*(\d{2,3})?\s*(?:cm)?)?(?:\s+Pozycja:?\s*(.*))?$/iu;
  lines.forEach((l, i) => {
    const o = ONE.exec(l);
    if (o) {
      let pos = o[7] || ''; if (!pos && lines[i + 1] && /^Pozycja/i.test(lines[i + 1])) pos = lines[i + 1].replace(/^Pozycja:?\s*/i, '');
      let num = o[1] || ''; if (!num && /^\d{1,2}$/.test(lines[i - 1] || '')) num = lines[i - 1];
      add({ num, name: personName(o[2]), year: +o[5], height: o[6] || '', pos: pos ? posOf(pos) : '' });
      return;
    }
    const m = /^Urodzon[ya]:?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i.exec(l); if (!m) return;
    const parts = []; for (let j = i - 1; j >= 0 && parts.length < 3; j--) { const x = lines[j]; if (/:|^\d|wzrost|pozycja|urodzon/i.test(x) || !/^[\p{L}'\- ]+$/u.test(x) || !/^\p{Lu}/u.test(x)) break; parts.unshift(x); }
    if (!parts.length) return;
    const nb = lines[i - parts.length - 1] || '', num = /^\d{1,2}$/.test(nb) ? nb : '';
    let height = '', pos = '';
    for (let k = i + 1; k < Math.min(lines.length, i + 6); k++) {
      const w = /^Wzrost:?\s*(\d{2,3})\s*cm/i.exec(lines[k]); if (w) height = w[1];
      const p = /^Pozycja:?\s*(.+)$/i.exec(lines[k]); if (p) { let v = p[1]; if (lines[k + 1] && !/:/.test(lines[k + 1]) && /^\p{Ll}/u.test(lines[k + 1])) v += ' ' + lines[k + 1]; const pm = POS_RE.exec(v); pos = pm ? pm[0].toLocaleLowerCase('pl').replace(/\s*\/\s*/, ' / ') : v.trim(); }
      if (/^Urodzon/i.test(lines[k])) break;
    }
    add({ num, name: personName(parts.join(' ')), year: +m[3], height, pos });
  });
  // „TRENERZY:” i dalej nazwiska — w tej samej linii lub w kolejnych (po przecinkach albo każde osobno)
  const ti = lines.findIndex(l => /^TRENER(?:ZY|)\b\s*:?/i.test(l));
  if (ti >= 0 && !coaches.length) {
    const got = [lines[ti].replace(/^TRENER(?:ZY|)\s*:?\s*/i, '')];
    for (let k = ti + 1; k < Math.min(lines.length, ti + 12); k++) {
      const x = lines[k], nx = lines[k + 1] || '';
      if (/[:\d]|urodzon|wzrost|pozycja/i.test(x) || /^Urodzon/i.test(nx)) break;
      if (!/^[\p{L}'\-\s,.]+$/u.test(x)) break;
      got.push(x);
    }
    got.join(',').split(/\s*,\s*/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => NAME_OK.test(x)).forEach(n => { if (!coaches.some(c => c.name === personName(n))) coaches.push({ name: personName(n), role: 'Trener' }); });
  }
  return { players, coaches };
}

/* terminarz i wyniki: wiersze z datą, dwiema drużynami i (opcjonalnie) wynikiem */
function isoDate(s) {
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = DATE_RE.exec(s); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  return '';
}
function parseSchedule(html, filter) {
  const out = [], key = (filter || 'Turów').toLocaleLowerCase('pl');
  function push(m) { if (!m.date || !m.home || !m.away) return; if (key && !(m.home + ' ' + m.away).toLocaleLowerCase('pl').includes(key)) return; if (!out.some(x => x.date === m.date && x.home === m.home && x.away === m.away)) out.push(m); }
  const teamCell = c => /\p{L}{3,}/u.test(c) && !DATE_RE.test(c) && !/^\d{4}-\d{2}-\d{2}/.test(c) && !/^(kolejka|runda|mecz|hala|szczegóły|relacja|statystyki|protokół|wynik|data|godz\.?|godzina|gospodarz|gość|dom|wyjazd|kol\.?)$/i.test(c) && c.length <= 60;
  // komórka „Drużyna A - Drużyna B” (np. DZKosz) → dwie osobne komórki
  const splitTeams = c => { const p = String(c).split(/\s+[-–—]\s+/); return p.length === 2 && p.every(x => /\p{L}{3,}/u.test(x) && !/^\d/.test(x)) && !DATE_RE.test(c) ? p.map(x => x.trim()) : [c]; };
  const SCORE = /^(\d{1,3})\s*[:\-–]\s*(\d{1,3})$/;
  for (const raw of rows(html)) {
    const cells = [].concat(...raw.map(splitTeams));
    const all = cells.join(' | '); const date = isoDate(all); if (!date) continue;
    const di = cells.findIndex(c => isoDate(c));
    const firstTeam = cells.findIndex((c, i) => i !== di && teamCell(c) && !/^\d/.test(c));
    const TIME = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
    let tmm = TIME.exec(cells[di].replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4}/, ''));
    if (!tmm) { const tc = cells.find((c, i) => i !== di && i < (firstTeam < 0 ? cells.length : firstTeam) && new RegExp('^' + TIME.source + '$').test(c)); if (tc) tmm = TIME.exec(tc); }
    const sc = cells.map((c, i) => i > firstTeam && firstTeam >= 0 ? SCORE.exec(c) : null).find(Boolean);
    const teams = cells.filter((c, i) => i !== di && teamCell(c) && !/^\d/.test(c));
    if (teams.length < 2) continue;
    let sh = '', sa = '';
    if (sc) { sh = sc[1]; sa = sc[2]; }
    else { const nums = cells.filter((c, i) => i > firstTeam && /^\d{1,3}$/.test(c)); if (nums.length >= 2) { sh = nums[nums.length - 2]; sa = nums[nums.length - 1]; } }
    push({ date, time: tmm ? tmm[1].padStart(2, '0') + ':' + tmm[2] : '', home: teams[0], away: teams[1], sh, sa });
  }
  if (!out.length) {
    // układ bez tabel: „2026-10-12 17:00” i dalej drużyna, wynik, drużyna, wynik
    const L = htmlToLines(html);
    for (let i = 0; i < L.length; i++) {
      const date = isoDate(L[i]); if (!date) continue;
      const tm = /\b(\d{1,2}):(\d{2})\b/.exec(L[i]);
      const nxt = L.slice(i + 1, i + 7); const t = [], s = [];
      for (const x0 of nxt) { if (isoDate(x0)) break; const sx = SCORE.exec(x0); if (sx) { s.push(sx[1], sx[2]); if (t.length >= 2) break; continue; }
        const parts = splitTeams(x0); if (parts.length === 2) { t.push(parts[0], parts[1]); continue; } const x = x0; const ms = /^(.+?)\s+(\d{1,3})$/.exec(x); if (ms && teamCell(ms[1])) { t.push(ms[1]); s.push(ms[2]); } else if (/^\d{1,3}$/.test(x)) s.push(x); else if (teamCell(x)) t.push(x); if (t.length >= 2 && s.length >= 2) break; }
      if (t.length >= 2) push({ date, time: tm ? tm[1].padStart(2, '0') + ':' + tm[2] : '', home: t[0], away: t[1], sh: s[0] || '', sa: s[1] || '' });
    }
  }
  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}

/* POST /api/sync  { url } — pobiera skład drużyny ze strony PZKosz / DZKosz (tylko dla zalogowanego administratora)
   Zwraca listę zawodników i trenerów; porównanie i decyzję co dodać/usunąć podejmuje panel. */
export async function onRequestPost({ request, env }) {
  if (!(await authFromRequest(request, env))) return json({ ok: false, error: 'auth' }, 401);
  let b = {}; try { b = await request.json(); } catch (e) { }
  const url = String(b.url || '').trim();
  if (!allowedUrl(url)) return json({ ok: false, error: 'url', message: 'Dozwolone są tylko adresy serwisów PZKosz i DZKosz.' }, 400);
  try {
    const html = await fetchPage(url);
    const r = parseRoster(html);
    if (!r.players.length) return json({ ok: false, error: 'empty', message: 'Nie znaleziono zawodników na tej stronie — układ strony mógł się zmienić.' }, 422);
    return json({ ok: true, url, fetchedAt: new Date().toISOString(), players: r.players, coaches: r.coaches });
  } catch (e) {
    return json({ ok: false, error: 'fetch', message: 'Nie udało się pobrać strony: ' + (e && e.message || e) }, 502);
  }
}
