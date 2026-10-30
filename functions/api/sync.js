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

/* ---- wspólne: pobieranie i odczyt stron PZKosz / DZKosz / DALK (FIBA – Genius Sports) ---- */
const ALLOWED = /(^|\.)(pzkosz\.pl|dzkosz\.wroclaw\.pl|dzkosz\.pl|dalk\.pl|geniussports\.com)$/i;
function allowedUrl(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && ALLOWED.test(x.hostname); } catch (e) { return false; } }
async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KSTurowSite/1.0; +https://ksturow.eu)', 'Accept': 'text/html', 'Accept-Language': 'pl' }, cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}
/* Strony z systemem FIBA (Genius Sports), np. dalk.pl/fiba/…?WHurl=/competition/…: sama strona nie zawiera danych —
   wczytuje je skrypt z geniussports.com. Szukamy w stronie adresu tego serwisu i pobieramy dane spod „WHurl”. */
function unwrapJs(t) {
  if (/<(table|tr|div|li)\b/i.test(t) && !/\\u003c|\\"/.test(t)) return t;
  return t.replace(/\\u([0-9a-f]{4})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(["'\/])/g, '$1').replace(/\\[nrt]/g, ' ');
}
// kod organizacji w systemie FIBA/Genius Sports (np. dla DALK) — można też ustawić zmienną środowiskową FIBA_ORG
let FIBA_ORG = '';
/* ---- FIBA / Genius Sports (DALK i inne ligi z „WHurl”) ----
   Strona ligi (np. dalk.pl/fiba/terminarz.html?WHurl=/competition/49982/schedule) osadza dane z
   hosted.dcd.shared.geniussports.com/embednf/{org}/en{WHurl} — odpowiedź to JSON { html, css, js }. */
const GENIUS = 'https://hosted.dcd.shared.geniussports.com';
const ORG_BY_HOST = { 'dalk.pl': 'dalk' };
function geniusUrl(url, kind) {
  let u; try { u = new URL(url); } catch (e) { return ''; }
  let org = '', path = '';
  if (/geniussports\.com$/i.test(u.hostname)) {
    const m = /^\/(?:embednf\/)?([a-z0-9_]+)\/[a-z]{2}(\/competition\/.+)$/i.exec(u.pathname); if (!m) return '';
    org = m[1]; path = m[2];
  } else {
    const wh = u.searchParams.get('WHurl'); if (!wh) return '';
    org = ORG_BY_HOST[u.hostname.replace(/^www\./, '')] || FIBA_ORG; path = wh.split('?')[0];
  }
  if (!org) return '';
  path = path.replace(/\/+$/, '');
  const team = /^(\/competition\/\d+\/team\/\d+)(\/[a-z]+)?$/.exec(path);
  if (team && kind === 'roster') path = team[1] + '/roster';
  if (team && kind === 'schedule' && !team[2]) path = team[1] + '/schedule';
  return GENIUS + '/embednf/' + org.toLowerCase() + '/en' + path;
}
async function fetchGenius(u) {
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KSTurowSite/1.0; +https://ksturow.eu)', 'Accept': 'application/json,text/html,*/*' }, cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error('FIBA/Genius Sports: HTTP ' + r.status);
  const t = await r.text();
  try { const j = JSON.parse(t); if (j && typeof j.html === 'string') return j.html; } catch (e) { }
  return t;
}
/* terminarz Genius: bloki „match-wrap” z datą („Sep 12, 2026, 1:30 PM”), gospodarzem, gościem i wynikiem */
function parseGeniusSchedule(html, filter) {
  const out = [], key = (filter || 'Turów').toLocaleLowerCase('pl');
  const cls = (b, c, tag) => { const m = new RegExp('class\\s*=\\s*"[^"]*\\b' + c + '\\b[^"]*"[^>]*>([\\s\\S]*?)</' + (tag || 'span') + '>', 'i').exec(b); return m ? clean(m[1]) : ''; };
  const blocks = String(html).split(/class\s*=\s*"match-wrap\b/i).slice(1);
  for (const b of blocks) {
    const done = !/^[^"]*STATUS_SCHEDULED/i.test(b) && !/class\s*=\s*"upcoming matchStatus"/i.test(b);
    const when = cls(b, 'match-time', 'div'); const date = isoDate(when); if (!date) continue;
    const ai = b.search(/class\s*=\s*"away-team\b/i); if (ai < 0) continue;
    const homeB = b.slice(0, ai), awayB = b.slice(ai);
    const home = cls(homeB, 'team-name-full') || cls(homeB, 'teamnames', 'a'), away = cls(awayB, 'team-name-full') || cls(awayB, 'teamnames', 'a'); if (!home || !away) continue;
    let sh = '', sa = '';
    if (done) { sh = (/\d+/.exec(cls(homeB, 'homescore', 'div') || cls(homeB, 'fake-cell', 'div')) || [''])[0]; sa = (/\d+/.exec(cls(awayB, 'awayscore', 'div') || cls(awayB, 'fake-cell', 'div')) || [''])[0]; if (!sh || !sa) sh = sa = ''; }
    if (key && !(home + ' ' + away).toLocaleLowerCase('pl').includes(key)) continue;
    if (!out.some(x => x.date === date && x.home === home && x.away === away)) out.push({ date, time: hm(when), home, away, sh, sa, place: cls(b, 'venuename', 'a') });
  }
  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}
async function geniusRoster(url) {
  const base = geniusUrl(url, 'roster'); if (!base) return null;
  const html = await fetchGenius(base);
  let staff = ''; try { staff = await fetchGenius(base.replace(/\/roster$/, '/staff')); } catch (e) { }
  return html + '\n' + staff;
}
async function geniusSchedule(url, filter) {
  const u = geniusUrl(url, 'schedule'); if (!u) return null;
  const html = await fetchGenius(u);
  const m = parseGeniusSchedule(html, filter);
  return m.length ? m : parseSchedule(html, filter);
}
async function resolvePage(url) {
  let wh = null, origin = ''; try { const u0 = new URL(url); wh = u0.searchParams.get('WHurl'); origin = u0.origin; } catch (e) { }
  const html = await fetchPage(url);
  if (!wh) return html;
  const path = (wh.startsWith('/') ? wh : '/' + wh);
  const cands = [];
  const found = (html.replace(/\\\//g, '/').match(/(?:https?:)?\/\/[a-z0-9.-]*geniussports\.com\/[^"'\s<>\\)]*/gi) || []).map(u => (u.startsWith('//') ? 'https:' + u : u).replace(/&amp;/g, '&'));
  for (const u of found) {
    let x; try { x = new URL(u); } catch (e) { continue; }
    const seg = x.pathname.split('/').filter(Boolean);
    const ei = seg.findIndex(v => /^(embednf|embed)$/i.test(v));
    if (ei >= 0 && seg[ei + 1]) cands.push(x.origin + '/' + seg[ei] + '/' + seg[ei + 1] + '/pl', 'https://hosted.dcd.shared.geniussports.com/' + seg[ei + 1] + '/pl', x.origin + '/' + seg[ei] + '/' + seg[ei + 1] + '/en');
    const li = seg.findIndex(v => /^[a-z]{2}$/.test(v));
    if (li >= 1) cands.push(x.origin + '/' + seg.slice(0, li + 1).join('/'));
  }
  const org = /hosted\.wh\.geniussports\.com\/embed\/?\?([A-Za-z0-9_]{2,20})/.exec(html) || /(?:data-org|orgCode|org_code|"org"|'org')\s*[:=]\s*["']([A-Za-z0-9_]{2,20})["']/.exec(html);
  if (org) { const g = GENIUS + '/embednf/' + org[1].toLowerCase() + '/en' + path.split('?')[0]; try { return await fetchGenius(g); } catch (e) { } }
  if (org) cands.push('https://hosted.dcd.shared.geniussports.com/' + org[1] + '/pl', 'https://hosted.dcd.shared.geniussports.com/embednf/' + org[1] + '/pl');
  if (FIBA_ORG) cands.unshift('https://hosted.dcd.shared.geniussports.com/embednf/' + FIBA_ORG + '/pl', 'https://hosted.dcd.shared.geniussports.com/' + FIBA_ORG + '/pl');
  const tried = [];
  for (const base of [...new Set(cands)].slice(0, 8)) {
    try {
      const r = await fetch(base + path, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KSTurowSite/1.0)', 'Accept': 'text/html,*/*', 'Accept-Language': 'pl', 'Referer': origin + '/' } });
      tried.push(base.replace('https://', '') + ' → ' + r.status);
      if (r.ok) { const t = await r.text(); if (t && t.length > 300) return unwrapJs(t); }
    } catch (e) { tried.push(base.replace('https://', '') + ' → błąd'); }
  }
  const info = found.length ? 'znalezione adresy: ' + [...new Set(found)].slice(0, 3).join(', ') + (tried.length ? '; próby: ' + tried.join(', ') : '') : 'na stronie nie znaleziono adresu systemu FIBA/Genius Sports';
  throw new Error('strona wczytuje dane skryptem FIBA (Genius Sports), którego nie udało się odczytać automatycznie (' + info + '). Użyj „⎘ Wklej dane ręcznie” i prześlij ten komunikat twórcy strony.');
}
/* tekst skopiowany ze strony (Ctrl+A, Ctrl+C) → prosty HTML: wiersze z tabulatorami to wiersze tabeli */
function textToHtml(text) {
  const e = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return String(text || '').split(/\r?\n/).map(l => l.includes('\t') ? '<table><tr>' + l.split('\t').map(c => '<td>' + e(c.trim()) + '</td>').join('') + '</tr></table>' : '<div>' + e(l.trim()) + '</div>').join('\n');
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
function personName(s) {
  s = String(s).replace(/\s+/g, ' ').trim();
  const cm = /^([^,]+),\s*([^,]+)$/.exec(s); if (cm) s = cm[2] + ' ' + cm[1]; // „KOWALSKI, Jan” → „Jan Kowalski”
  if (isUpperName(s.replace(/\s/g, '')) || isUpperName(s)) return titleCase(s);
  return s.split(' ').map(w => w.length > 1 && isUpperName(w) ? titleCase(w) : w).join(' ');
}
const POS_CODE = { pg: 'rozgrywający', sg: 'rzucający', sf: 'niski skrzydłowy', pf: 'silny skrzydłowy', c: 'środkowy', g: 'obrońca', f: 'skrzydłowy', 'g/f': 'obrońca / skrzydłowy', 'f/c': 'skrzydłowy / środkowy', 'f/g': 'skrzydłowy / obrońca', 'c/f': 'środkowy / skrzydłowy',
  guard: 'obrońca', forward: 'skrzydłowy', 'point guard': 'rozgrywający', 'shooting guard': 'rzucający', 'small forward': 'niski skrzydłowy', 'power forward': 'silny skrzydłowy' };
const NAME_OK = /^[\p{L}][\p{L}'\-]+(\s+[\p{L}][\p{L}'\-]+)+$/u;

/* skład: najpierw tabela (PZKosz), potem karty „Urodzony / Wzrost / Pozycja” (DZKosz) */
function parseRoster(html) {
  const players = [], coaches = [], seen = {};
  function add(p) { const k = p.name.toLocaleLowerCase('pl'); if (!p.name || seen[k]) return; seen[k] = 1; players.push(p); }
  let head = null;
  const HEAD = /^(no\.?|nr\.?|#|numer|name|player|players|player name|shirt number|shirt no\.?|role|zawodnik|zawodnicy|zawodniczka|imię i nazwisko|nazwisko i imię|nazwisko|imię)$/i;
  for (const cells of rows(html)) {
    if (cells.some(c => HEAD.test(c)) && cells.every(c => !/^\d+([.,]\d+)?$/.test(c)) && !cells.some(c => DATE_RE.test(c))) { head = cells.map(c => c.toLocaleLowerCase('pl')); continue; }
    const di = cells.findIndex(c => DATE_RE.test(c) || isoDate(c));
    if (di < 0 && head && /trener|coach|asystent|kierownik|manager|staff/i.test(cells.join(' '))) {
      const nm = cells.find(c => NAME_OK.test(c) || /^[^,]+,\s*[^,]+$/.test(c)); const rl = cells.find(c => /trener|coach|asystent|kierownik|manager/i.test(c));
      if (nm && rl && nm !== rl) { coaches.push({ name: personName(nm), role: /head coach|^coach$/i.test(rl) ? 'Trener' : /assist/i.test(rl) ? 'Asystent trenera' : rl }); continue; }
    }
    if (di < 0 && head) {
      const ni = cells.findIndex(c => (NAME_OK.test(c) || /^[\p{L}'\-]+,\s*[\p{L}'\- ]+$/u.test(c)) && !POS_RE.test(c) && !POS_CODE[c.toLowerCase()]);
      if (ni < 0) continue;
      const hi = re => head.findIndex(h => re.test(h));
      const nc = hi(/^(no\.?|nr\.?|#|numer|nr koszulki|shirt number|shirt no\.?)$/i), hc = hi(/^(height|wzrost|ht)/i), pcI = hi(/^(pos|position|pozycja)/i);
      const num = nc >= 0 ? (/^\d{1,2}$/.test(cells[nc] || '') ? cells[nc] : '') : (cells.find((c, i) => i < ni && /^\d{1,2}$/.test(c)) || '');
      if (/^(team|totals|team totals|razem|suma|drużyna|zespół|total)\b/i.test(cells[ni])) continue;
      const h = hc >= 0 ? /^(\d{3})/.exec(cells[hc] || '') : null;
      const yc = cells.map(c => /^(19[5-9]\d|20[0-2]\d)$/.exec(c)).find(Boolean);
      const pc = pcI >= 0 && POS_CODE[(cells[pcI] || '').toLowerCase()] ? cells[pcI] : cells.find(c => POS_CODE[c.toLowerCase()] && c.length > 1); const pr = cells.map(c => POS_RE.exec(c)).find(Boolean);
      add({ num, name: personName(cells[ni]), year: yc ? +yc[1] : '', height: h ? h[1] : '', pos: pr ? pr[0].toLocaleLowerCase('pl').replace(/\s*\/\s*/, ' / ') : (pc ? POS_CODE[pc.toLowerCase()] : '') });
      continue;
    }
    if (di >= 0) {
      const name = cells.find((c, i) => i !== di && NAME_OK.test(c) && !POS_RE.test(c));
      if (!name) continue;
      const num = cells.find(c => /^\d{1,2}$/.test(c)) || '';
      const h = cells.map(c => /^(\d{3})\s*cm$/i.exec(c)).find(Boolean);
      const pos = cells.map(c => POS_RE.exec(c)).find(Boolean);
      add({ num, name: personName(name), year: +isoDate(cells[di]).slice(0, 4), height: h ? h[1] : '', pos: pos ? pos[0].toLocaleLowerCase('pl').replace(/\s*\/\s*/, ' / ') : '' });
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
  lines.forEach(l => { const m = /^(Trener(?: główny)?|I trener|II trener|Asystent(?: trenera)?|Head Coach|Coach|Assistant Coach)\s*:\s*(.+)$/i.exec(l); if (m && !/,/.test(m[2]) && NAME_OK.test(personName(m[2]))) { const n = personName(m[2]); if (!coaches.some(c => c.name === n)) coaches.push({ name: n, role: /head|główny|^i trener/i.test(m[1]) ? 'Trener' : /asyst|assist|ii trener/i.test(m[1]) ? 'Asystent trenera' : 'Trener' }); } });
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
const MON = { sty: 1, lut: 2, mar: 3, kwi: 4, maj: 5, cze: 6, lip: 7, sie: 8, wrz: 9, paz: 10, lis: 11, gru: 12, jan: 1, feb: 2, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, mai: 5, okt: 10, dez: 12, mae: 3 };
function monNum(w) { const k = String(w).toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('ä', 'ae').slice(0, 3); return MON[k] || 0; }
const p2 = n => String(n).padStart(2, '0');
function isoDate(s) {
  s = String(s);
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = DATE_RE.exec(s); if (m) return m[3] + '-' + p2(m[2]) + '-' + p2(m[1]);
  m = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(s); if (m) return m[3] + '-' + p2(m[2]) + '-' + p2(m[1]);
  m = /\b(\d{1,2})\.?\s+(\p{L}{3,})\.?,?\s+(\d{4})\b/u.exec(s); if (m && monNum(m[2])) return m[3] + '-' + p2(monNum(m[2])) + '-' + p2(m[1]);
  m = /\b(\p{L}{3,})\.?\s+(\d{1,2}),?\s+(\d{4})\b/u.exec(s); if (m && monNum(m[1])) return m[3] + '-' + p2(monNum(m[1])) + '-' + p2(m[2]);
  return '';
}
// godzina „18:30” albo „6:30 PM”
function hm(s) {
  const m = /\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*([AaPp])\.?[Mm]\.?)?/.exec(String(s)); if (!m) return '';
  let h = +m[1]; if (m[3]) { const pm = /p/i.test(m[3]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
  return p2(h) + ':' + m[2];
}
function parseSchedule(html, filter) {
  const out = [], key = (filter || 'Turów').toLocaleLowerCase('pl');
  function push(m) { if (!m.date || !m.home || !m.away) return; if (key && !(m.home + ' ' + m.away).toLocaleLowerCase('pl').includes(key)) return; if (!out.some(x => x.date === m.date && x.home === m.home && x.away === m.away)) out.push(m); }
  const teamCell = c => /\p{L}{3,}/u.test(c) && !isoDate(c) && !/^(hala|arena|sala|venue|ul\.|final|zakończ|box score|statyst|szczeg|relacja|live|bilety|tickets|mecz nr|game)/i.test(c) && !DATE_RE.test(c) && !/^\d{4}-\d{2}-\d{2}/.test(c) && !/^(kolejka|runda|mecz|hala|szczegóły|relacja|statystyki|protokół|wynik|data|godz\.?|godzina|gospodarz|gość|dom|wyjazd|kol\.?)$/i.test(c) && c.length <= 60;
  // komórka „Drużyna A - Drużyna B” (np. DZKosz) → dwie osobne komórki
  const splitTeams = c => { const p = String(c).split(/\s+[-–—]\s+/); return p.length === 2 && p.every(x => /\p{L}{3,}/u.test(x) && !/^\d/.test(x)) && !DATE_RE.test(c) ? p.map(x => x.trim()) : [c]; };
  const SCORE = /^(\d{1,3})\s*[:\-–]\s*(\d{1,3})$/;
  for (const raw of rows(html)) {
    const cells = [].concat(...raw.map(splitTeams));
    const all = cells.join(' | '); const date = isoDate(all); if (!date) continue;
    const di = cells.findIndex(c => isoDate(c));
    const firstTeam = cells.findIndex((c, i) => i !== di && teamCell(c) && !/^\d/.test(c));
    let time = hm(cells[di].replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4}/, ''));
    if (!time) { const tc = cells.find((c, i) => i !== di && i < (firstTeam < 0 ? cells.length : firstTeam) && /^([01]?\d|2[0-3]):[0-5]\d(\s*[AaPp]\.?[Mm]\.?)?$/.test(c)); if (tc) time = hm(tc); }
    const sc = cells.map((c, i) => i > firstTeam && firstTeam >= 0 ? SCORE.exec(c) : null).find(Boolean);
    const teams = cells.filter((c, i) => i !== di && teamCell(c) && !/^\d/.test(c));
    if (teams.length < 2) continue;
    let sh = '', sa = '';
    if (sc) { sh = sc[1]; sa = sc[2]; }
    else { const nums = cells.filter((c, i) => i > firstTeam && /^\d{1,3}$/.test(c)); if (nums.length >= 2) { sh = nums[nums.length - 2]; sa = nums[nums.length - 1]; } }
    push({ date, time, home: teams[0], away: teams[1], sh, sa });
  }
  if (!out.length) {
    // układ bez tabel: „2026-10-12 17:00” i dalej drużyna, wynik, drużyna, wynik
    const L = htmlToLines(html);
    for (let i = 0; i < L.length; i++) {
      const date = isoDate(L[i]); if (!date) continue;
      const tNext = !hm(L[i]) && /^([01]?\d|2[0-3]):[0-5]\d(\s*[AaPp]\.?[Mm]\.?)?$/.test(L[i + 1] || '');
      const tm = hm(L[i]) || (tNext ? hm(L[i + 1]) : '');
      const nxt = L.slice(i + (tNext ? 2 : 1), i + (tNext ? 10 : 9)); const t = [], s = [];
      let skip = false;
      for (const x0 of nxt) { if (skip) { skip = false; continue; } if (/^(venue|hala|miejsce|arena|lokalizacja|obiekt|sala)\s*[:/]?\s*$/i.test(x0)) { skip = true; continue; } if (isoDate(x0)) break; const sx = SCORE.exec(x0); if (sx) { s.push(sx[1], sx[2]); if (t.length >= 2) break; continue; }
        const parts = splitTeams(x0); if (parts.length === 2) { t.push(parts[0], parts[1]); continue; } const x = x0; const ms = /^(.+?)\s+(\d{1,3})$/.exec(x); if (ms && teamCell(ms[1])) { t.push(ms[1]); s.push(ms[2]); } else if (/^\d{1,3}$/.test(x)) s.push(x); else if (teamCell(x)) t.push(x); if (t.length >= 2 && s.length >= 2) break; }
      if (t.length >= 2) push({ date, time: tm, home: t[0], away: t[1], sh: s[0] || '', sa: s[1] || '' });
    }
  }
  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
}

/* POST /api/sync  { url } — pobiera skład drużyny ze strony PZKosz / DZKosz (tylko dla zalogowanego administratora)
   Zwraca listę zawodników i trenerów; porównanie i decyzję co dodać/usunąć podejmuje panel. */
export async function onRequestPost({ request, env }) {
  FIBA_ORG = (env && env.FIBA_ORG) || '';
  if (!(await authFromRequest(request, env))) return json({ ok: false, error: 'auth' }, 401);
  let b = {}; try { b = await request.json(); } catch (e) { }
  // skład wklejony ręcznie w panelu (tekst skopiowany ze strony drużyny)
  if (b.text) {
    const r = parseRoster(textToHtml(b.text));
    if (!r.players.length) return json({ ok: false, error: 'empty', message: 'Nie rozpoznano zawodników w wklejonym tekście. Skopiuj całą stronę ze składem (Ctrl+A, Ctrl+C) i wklej jeszcze raz.' }, 422);
    return json({ ok: true, url: '', fetchedAt: new Date().toISOString(), players: r.players, coaches: r.coaches });
  }
  const url = String(b.url || '').trim();
  if (!allowedUrl(url)) return json({ ok: false, error: 'url', message: 'Dozwolone są tylko adresy serwisów PZKosz, DZKosz i DALK.' }, 400);
  try {
    const html = (await geniusRoster(url)) || await resolvePage(url);
    const r = parseRoster(html);
    if (!r.players.length) return json({ ok: false, error: 'empty', message: 'Nie znaleziono zawodników na tej stronie — układ strony mógł się zmienić.' }, 422);
    return json({ ok: true, url, fetchedAt: new Date().toISOString(), players: r.players, coaches: r.coaches });
  } catch (e) {
    return json({ ok: false, error: 'fetch', message: 'Nie udało się pobrać strony: ' + (e && e.message || e) }, 502);
  }
}
