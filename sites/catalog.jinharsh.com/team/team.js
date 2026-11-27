// The Team Portal of catalog.jinharsh.com: visitors and queries, uploading catalogues, exhibition settings.
// It looks like the catalogue pages (Jinharsh UI kit, the same icons, QR codes and calm animations) and does exactly
// what the portal did before: Google sign-in (@jinharsh.com), and every read and save goes to api.php with the same
// fields as before. Only content@ and mitul.vasa@ (admins) may remove catalogues and change the settings.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from '/hub/js/motion.js';
import { qrSvg, qrPng, saveBlob } from '/hub/js/qr.js';
import { copyText, showCopied } from '/hub/js/copy.js';
import { depthSwitch } from '/hub/js/depth.js';

const API = '/hub/api.php';
const CLIENT_ID = '232694715908-2575cktv96o2l83tsi5oo4u3cs5g0anc.apps.googleusercontent.com';
const ADMINS = 'content@jinharsh.com and mitul.vasa@jinharsh.com';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ui = (fn) => { try { fn(); } catch { /* cosmetic */ } };
const toast = (t) => ui(() => window.JUI.toast(t));

let TOKEN = sessionStorage.getItem('jh_team_token') || '';
let USER = null, DATA = null, LAST = null;
let shown = { kpi: {} };

// the catalogue's brand and category, guessed from the PDF's file name (the portal's own rules, unchanged)
const BRAND_RULES = [
  { match: /timken|srb|trb|borewell/i, brand: 'Timken', cat: 'Bearings & Housed Units' },
  { match: /lovejoy|qf|quick.?flex/i, brand: 'Timken Lovejoy', cat: 'Couplings' },
  { match: /rexnord|omega|viva|link.?belt|colour.?coat/i, brand: 'Regal Rexnord', cat: 'Couplings' },
  { match: /groz|lube|grease/i, brand: 'Groz', cat: 'Lubrication & Tools' },
  { match: /abb|baldor|motor|drive/i, brand: 'ABB & Baldor', cat: 'Motors & Drives' },
  { match: /drager|dräger|gas|x-am|safety/i, brand: 'Dräger', cat: 'Safety & Gas Detection' },
  { match: /flexco|convey|belt/i, brand: 'Flexco', cat: 'Conveying Equipment' },
  { match: /shell|omala|tellus|gadus/i, brand: 'Shell', cat: 'Industrial Lubricants' },
  { match: /lubrilog/i, brand: 'Lubrilog', cat: 'Industrial Lubricants' },
  { match: /ador|weld/i, brand: 'Ador Fontech', cat: 'Welding & Wear' },
  { match: /pidilite|zorrik|m-seal/i, brand: 'Pidilite', cat: 'Adhesives & Coatings' },
  { match: /dodge/i, brand: 'Dodge', cat: 'Bearings & Housed Units' },
];
const BRANDS = ['Timken', 'Regal Rexnord', 'Timken Lovejoy', 'SKF', 'Dodge', 'ABB & Baldor', 'Shell', 'Lubrilog', 'Groz', 'Dräger', 'Flexco', 'Ador Fontech', 'Pidilite', 'JinHarsh'];
const CATEGORIES = [['Bearings & Housed Units', 'Bearings & Housed Units'], ['Couplings', 'Couplings & Power Transmission'], ['Motors & Drives', 'Motors & Drives'],
  ['Lubrication & Tools', 'Lubrication & Tools'], ['Industrial Lubricants', 'Industrial Lubricants'], ['Safety & Gas Detection', 'Safety & Gas Detection'],
  ['Conveying Equipment', 'Conveying Equipment'], ['Welding & Wear', 'Welding & Wear'], ['Adhesives & Coatings', 'Adhesives & Coatings'], ['Application Hub', 'Application Hub']];

// what each kind of visitor action looks like
const ACTIONS = {
  visit: { ic: 'eye', word: 'Opened' },
  view: { ic: 'book-open', word: 'Read' },
  download: { ic: 'arrow-down-to-line', word: 'Downloaded' },
  query: { ic: 'message-square-text', word: 'Asked' },
  share: { ic: 'share-2', word: 'Shared' },
  video: { ic: 'play', word: 'Watched a video' },
};
const PHASES = {
  pre_exhibition: { word: 'Before', pill: '' },
  during_exhibition: { word: 'During', pill: 'ok' },
  post_exhibition: { word: 'After', pill: 'warn' },
};

// ---------- small helpers ----------
const fillIcons = (root = document) => $$('.ti[data-i]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.i); });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function when(ts) {   // "2026-11-27 14:05:33" (India time) -> "Today, 2:05 pm"
  const m = /^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)/.exec(String(ts || ''));
  if (!m) return esc(ts || '');
  const [, y, mo, d, h, mi] = m.map(Number);
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - new Date(y, mo - 1, d)) / 86400000);
  const day = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${d} ${MONTHS[mo - 1]}${y !== now.getFullYear() ? ' ' + y : ''}`;
  return `${day}, ${(h % 12) || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
const dayOf = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]}` : ''; };
const place = (o) => [o.city, o.country].filter((x) => x && x !== 'Unknown').join(', ');
const hue = (s) => { let h = 0; for (const c of String(s || 'J')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const pill = (phase) => { const p = PHASES[phase] || PHASES.pre_exhibition; return `<span class="ju-pill ${p.pill}">${p.word}</span>`; };
// India time "2026-11-27 14:05:33" -> a real moment; the last hour reads "Just now" / "5 min ago"
const istMs = (ts) => { const m = /^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)(?::(\d\d))?/.exec(String(ts || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) - 19800000 : 0; };
const secsAgo = (ts) => { const t = istMs(ts); return t ? (Date.now() - t) / 1000 : Infinity; };
const ago = (ts) => { const s = secsAgo(ts); return s < 50 ? 'Just now' : s < 3600 ? `${Math.max(1, Math.round(s / 60))} min ago` : when(ts); };
const evKey = (e) => e.id || [e.timestamp_ist, e.type, e.catalog_id, e.ip, e.city].join('|');
const qKey = (q) => [q.timestamp_ist, q.name, q.email, q.phone, String(q.message || '').slice(0, 40)].join('|');
// what someone is doing, in words
const DOING = {
  visit: (t) => (t ? `Opened ${t}` : 'On the front page'),
  view: (t) => `Reading ${t || 'a catalogue'}`,
  download: (t) => `Downloaded ${t || 'a catalogue'}`,
  query: () => 'Sent a query',
  share: (t) => `Shared ${t || 'a catalogue'}`,
  video: () => 'Watching a video',
};
const doing = (e) => (DOING[e.type] || DOING.visit)(e.catalog_title);

function countTo(el, to) {   // the numbers roll up to their value
  const from = Number(el.dataset.n || 0);
  el.dataset.n = to;
  if (from === to || M.calm()) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 650;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setStatus(el, kind, text) {   // kind: '' (working), 'ok', 'bad'
  el.hidden = !text;
  el.className = 'status ' + kind;
  el.innerHTML = (kind === 'ok' ? `<span class="ti">${icon('circle-check')}</span>` : kind === 'bad' ? `<span class="ti">${icon('circle-alert')}</span>` : '') + esc(text);
  if (kind === 'ok') M.bump(el.querySelector('.ti'), 1.25);
  if (kind === 'bad') M.shake(el);
}

function confirmSheet({ title, text, yes }) {   // a small window: "Remove this?" with Cancel / Remove
  return new Promise((done) => {
    const ov = document.createElement('div');
    ov.className = 'ju-overlay';
    ov.innerHTML = `<div class="ju-sheet" role="alertdialog" aria-modal="true" style="max-width:420px">
      <h3 style="margin:0 0 6px;font-size:19px">${esc(title)}</h3><p class="ju-muted" style="margin:0 0 18px">${esc(text)}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="ju-btn" type="button" data-no>Cancel</button>
      <button class="ju-btn" type="button" data-yes style="background:var(--bad);border-color:var(--bad);color:#fff">${icon('trash-2')}${esc(yes)}</button></div></div>`;
    const close = (v) => { ov.remove(); document.removeEventListener('keydown', key); done(v); };
    const key = (e) => { if (e.key === 'Escape') close(false); };
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-no]')) close(false); if (e.target.closest('[data-yes]')) close(true); });
    document.addEventListener('keydown', key);
    document.body.appendChild(ov);
    ov.querySelector('[data-no]').focus();
  });
}

// ---------- top bar ----------
fillIcons();
ui(() => {
  const b = $('#themeTop'), T = window.JDTheme;
  if (!T) { b.hidden = true; return; }
  const ICON = { light: 'sun', sun: 'sunset', dark: 'moon' };
  const paint = () => { const m = T.mode(); b.innerHTML = icon(ICON[m]); b.title = `Look: ${T.label(m)}`; };
  paint();
  b.addEventListener('click', () => {
    const r = b.getBoundingClientRect(), next = T.next();
    M.themeSwitch(r.left + r.width / 2, r.top + r.height / 2, () => { T.set(next); paint(); if (!TOKEN) googleButton(); });
    M.bump(b, 1.15);
    toast(T.label(next));
  });
});
// 3D (the same as on the catalogue pages): a round switch in the top bar, off until turned on
ui(() => depthSwitch({ before: $('#themeTop'), icon: true }));
$('#refresh').innerHTML = icon('refresh-cw');
$('#refresh').addEventListener('click', (e) => {
  M.play(e.currentTarget.querySelector('.i'), [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)' });
  load().then((n) => { if (n === 0) toast('Up to date'); });
});
$('#signOut').addEventListener('click', () => signOut());

// ---------- your account: tap your initial (on a phone it is the only way to Sign out, so the bar stays tidy) ----------
const who = $('#who');
who.setAttribute('role', 'button'); who.tabIndex = 0; who.setAttribute('aria-haspopup', 'menu'); who.setAttribute('aria-label', 'Your account');
who.addEventListener('click', (e) => { e.stopPropagation(); if ($('.acct')) closeAcct(); else openAcct(); });
who.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); who.click(); } });
const outside = (e) => { if (!e.target.closest('.acct') && !e.target.closest('#who')) closeAcct(); };
const acctKey = (e) => { if (e.key === 'Escape') { closeAcct(); who.focus(); } };
function openAcct() {
  const r = who.getBoundingClientRect(), email = (USER && USER.email) || '';
  const el = document.createElement('div');
  el.className = 'acct'; el.setAttribute('role', 'menu');
  el.style.top = `${Math.round(r.bottom + 10)}px`;
  el.style.right = `${Math.max(12, Math.round(innerWidth - r.right))}px`;
  el.innerHTML = `<div class="acct-who"><span class="av">${esc((email[0] || '?').toUpperCase())}</span>
      <span style="min-width:0"><b>${esc(email)}</b><span class="ju-pill ${isAdmin() ? 'ok' : 'blue'}">${isAdmin() ? 'Admin' : 'Upload only'}</span></span></div>
    <a href="/" role="menuitem">${icon('globe')}Catalogue site</a>
    <button type="button" class="out" role="menuitem" data-out>${icon('arrow-left')}Sign out</button>`;
  document.body.appendChild(el);
  M.play(el, [{ opacity: 0, transform: 'scale(.92) translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  el.querySelector('[data-out]').addEventListener('click', () => { closeAcct(); signOut(); });
  setTimeout(() => document.addEventListener('pointerdown', outside), 0);
  document.addEventListener('keydown', acctKey);
}
function closeAcct() {
  const el = $('.acct');
  document.removeEventListener('pointerdown', outside);
  document.removeEventListener('keydown', acctKey);
  if (!el) return;
  M.play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.95) translateY(-4px)' }], { duration: 160, easing: 'ease-in' }).then(() => el.remove());
}

// ---------- sign in ----------
let tries = 0;
// Google's sign-in script is fetched only when someone starts to sign in (a touch, the mouse, a key, or a tap on
// the button): it sets Google's cookies, so a page that is only looked at stays free of them (and opens faster).
// Until then a look-alike button stands in; one tap on it loads the real one in its place.
let gsi = null, wantSignIn = false;
const GOOGLE_G = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.8 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
const loadGsi = () => gsi || (gsi = new Promise((ok, no) => {
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = no;
  document.head.appendChild(s);
}));
function standIn() {   // the look-alike button, until Google's own is there
  const box = $('#g_id_signin');
  if (box.querySelector('iframe, .g-real')) return;
  box.innerHTML = `<button type="button" class="g-stand" id="gStand">${GOOGLE_G}<span>Sign in with Google</span></button>`;
  $('#gStand').addEventListener('click', () => { $('#gStand').classList.add('busy'); wantSignIn = true; startGsi(); });
  const early = () => { ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'focusin'].forEach((t) => removeEventListener(t, early, true)); startGsi(); };
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'focusin'].forEach((t) => addEventListener(t, early, { capture: true, passive: true }));
}
function startGsi() { loadGsi().then(googleButton, () => gateMsg('Google sign-in did not load. Please check the internet connection and reload the page.', true)); }
function googleButton() {
  const g = window.google && window.google.accounts && window.google.accounts.id;
  if (!g) {
    if (!gsi) { standIn(); return; }   // (not asked for yet: the look-alike stays)
    if (++tries < 120) setTimeout(googleButton, 150);
    else gateMsg('Google sign-in did not load. Please check the internet connection and reload the page.', true);
    return;
  }
  g.initialize({ client_id: CLIENT_ID, hd: 'jinharsh.com', callback: onGoogle });
  $('#g_id_signin').innerHTML = '';
  const dark = document.documentElement.classList.contains('dark');
  g.renderButton($('#g_id_signin'), { theme: dark ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 280 });
  // they already tapped the look-alike: offer Google's one-tap sign-in straight away (the real button is there too)
  if (wantSignIn) { wantSignIn = false; try { g.prompt(); } catch { /* the button works anyway */ } }
}
function gateMsg(text, bad = false) {
  const el = $('#gateMsg');
  el.hidden = !text;
  el.className = 'gate-msg' + (bad ? ' bad' : '');
  el.innerHTML = text ? (bad ? icon('circle-alert') : '') + esc(text) : '';
  if (bad && text) M.shake(el);
}
async function onGoogle(response) {
  gateMsg('Checking your account…');
  try {
    const r = await fetch(`${API}?action=google_auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      TOKEN = j.token; USER = j.user;
      sessionStorage.setItem('jh_team_token', TOKEN);
      gateMsg('');
      openDash();
    } else gateMsg(j.error || 'Google sign-in did not work. Please try again.', true);
  } catch { gateMsg('No connection. Please check the internet and try again.', true); }
}
function showGate(msg = '') {
  $('#dash').hidden = true;
  $('#gate').hidden = false;
  $('#who').hidden = true;
  $('#signOut').hidden = true;
  $('#gateFoot').textContent = `Only ${ADMINS} can remove catalogues and change the settings.`;
  gateMsg(msg, !!msg);
  googleButton();
}
function signOut(msg = '') {
  sessionStorage.removeItem('jh_team_token');
  TOKEN = ''; USER = null; DATA = null; shown = { kpi: {} };
  clearTimeout(liveTimer);
  ui(() => window.google.accounts.id.disableAutoSelect());
  showGate(msg);
}

// ---------- signed in ----------
async function openDash() {
  $('#gate').hidden = true;
  $('#dash').hidden = false;
  $('#signOut').hidden = false;
  let tab = sessionStorage.getItem('jh_team_tab') || 'analytics';
  await load();
  if (tab === 'settings' && !isAdmin()) tab = 'analytics';
  showTab(tab, false);
  M.rise($$('.dash-head, .now, .kpi, .cities, #tab-analytics .panel'), { step: 40 });
  clearTimeout(liveTimer);
  liveTimer = setTimeout(tick, LIVE_MS);
}
const isAdmin = () => !!(USER && USER.role === 'admin');

// returns how many new things came in (-1 when it could not look)
async function load(live = false) {
  let r;
  const fail = (text) => { if (live) liveState('off'); else toast(text); return -1; };
  try { r = await fetch(`${API}?action=analytics`, { headers: { 'X-Team-Token': TOKEN }, cache: 'no-store' }); } catch { return fail('No connection. Please try again.'); }
  if (r.status === 401) { signOut('Your sign-in has ended. Please sign in again.'); return -1; }
  if (!r.ok) return fail('Could not load the portal. Please try again.');
  const next = await r.json().catch(() => null);
  if (!next || !TOKEN) return -1;
  const prev = DATA;
  DATA = next;
  USER = DATA.user || USER;
  // what came in since the last look (nothing is "new" on the very first look)
  const seen = prev && new Set((prev.events || []).map(evKey));
  const fresh = seen ? (DATA.events || []).filter((e) => !seen.has(evKey(e))) : [];
  const seenQ = prev && new Set((prev.inquiries || []).map(qKey));
  const freshQ = seenQ ? (DATA.inquiries || []).filter((q) => !seenQ.has(qKey(q))) : [];
  paintWho();
  paintExhibition();
  paintNumbers(!!prev);
  if (!prev || fresh.length) paintEvents(false, new Set(fresh.map(evKey)));
  if (!prev || freshQ.length || JSON.stringify(prev.query_status || {}) !== JSON.stringify(DATA.query_status || {})) paintQueries(new Set(freshQ.map(qKey)));
  if (!prev || JSON.stringify(prev.custom_catalogs) !== JSON.stringify(DATA.custom_catalogs)) paintUploads();
  paintSettings();
  paintNow();
  liveState('on');
  if (prev) announce(fresh, freshQ);
  return fresh.length + freshQ.length;
}

// ---------- live: the portal looks again by itself (every 10 s, every 30 s while the tab is in the background) ----------
const LIVE_MS = 10000, AWAY_MS = 30000, TITLE = document.title;
let liveTimer = 0, busy = false, unseen = 0;
async function tick() {
  clearTimeout(liveTimer);
  if (!TOKEN) return;
  if (!busy) { busy = true; try { await load(true); } catch { /* next time */ } busy = false; }
  if (TOKEN) liveTimer = setTimeout(tick, document.hidden ? AWAY_MS : LIVE_MS);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  unseen = 0; document.title = TITLE;
  if (TOKEN && DATA) tick();   // back on the tab: look straight away
});
setInterval(() => {   // "Just now" becomes "1 min ago", and the live dots go out after 3 minutes
  if (!DATA || document.hidden) return;
  $$('[data-ago]').forEach((el) => { el.textContent = ago(el.dataset.ago); });
  $$('#events .row[data-ts]').forEach((row) => row.classList.toggle('fresh', secsAgo(row.dataset.ts) < 180));
}, 20000);

function liveState(s) {
  $('#now').classList.toggle('off', s === 'off');
  $('#nowS').textContent = s === 'off' ? 'Reconnecting…' : 'Live: new visits show up here by themselves';
}

function announce(fresh, freshQ) {
  const n = fresh.length + freshQ.length;
  if (!n) return;
  if (document.hidden) { unseen += n; document.title = `(${unseen}) ${TITLE}`; return; }   // the tab's title counts them
  ui(() => M.bump($('#now .pulse'), 1.7));
  if (freshQ.length) { const q = newest(freshQ)[0]; toast(`New query from ${q.name || q.email || q.phone || 'a visitor'}`); return; }
  if (n > 1) { toast(`${n} new visitor actions`); return; }
  const e = fresh[0], d = doing(e);
  toast(`${e.name || e.email || place(e) || 'Someone'}: ${d[0].toLowerCase()}${d.slice(1)}`);
}

// which catalogues are open right now, and how many people have each one open
function paintOpen(live) {
  let el = $('#nowOpen');
  if (!el) { el = document.createElement('div'); el.id = 'nowOpen'; el.className = 'now-open'; $('#now .now-h').after(el); }
  const titles = {};
  for (const e of DATA.events || []) if (e.catalog_id && e.catalog_title && !titles[e.catalog_id]) titles[e.catalog_id] = e.catalog_title;
  const cats = Object.entries((live && live.cats) || {}).sort((a, b) => b[1] - a[1]);
  const front = live ? live.total - cats.reduce((s, [, k]) => s + k, 0) : 0;
  const rows = [...cats.map(([id, k]) => [titles[id] || id, k, 'cat', id]), ...(front > 0 ? [['Front page', front, 'front', '']] : [])];
  const html = rows.length ? `<span class="now-open-h">Open now</span>${rows.map(([t, k, kind, id]) => `<span class="ju-pill tap" title="${esc(t)}" ${drillAttrs(kind, id, `${t}: see its visitors`)}><i class="eye">${icon('eye')}</i><span class="t">${esc(t)}</span><b>${k}</b></span>`).join('')}` : '';
  if (el.innerHTML === html) return;
  const was = el.innerHTML;
  el.innerHTML = html;
  el.hidden = !html;
  if (html && was) M.rise(el.querySelectorAll('.ju-pill'), { step: 30, y: 4 });
}

// who is on the site right now: anyone who did something in the last 5 minutes, with what they did last
const NOW_SECS = 300;
function paintNow() {
  const people = new Map();
  for (const e of DATA.events || []) {
    if (secsAgo(e.timestamp_ist) > NOW_SECS) continue;
    const k = e.ip || [e.city, e.device, e.source].join('|');
    const had = people.get(k);
    if (!had || istMs(e.timestamp_ist) >= istMs(had.timestamp_ist)) people.set(k, e);
  }
  const list = [...people.entries()].sort((a, b) => istMs(b[1].timestamp_ist) - istMs(a[1].timestamp_ist));
  // the pages open right now (every open page says so every 30 s; only the team sees this), else recent activity
  const live = DATA.live && typeof DATA.live.total === 'number' ? DATA.live : null;
  const n = live ? live.total : list.length, box = $('#nowList');
  $('#now').classList.toggle('idle', !n);
  paintOpen(live);
  const t = n ? `${n} ${n === 1 ? 'person is' : 'people are'} on the catalogue site right now` : 'Nobody on the catalogue site right now';
  if ($('#nowT').textContent !== t) $('#nowT').textContent = t;
  // (the people who did something lately; none when the live count says nobody has the site open now)
  const want = live && !live.total ? [] : list.slice(0, 6), keep = new Set(want.map(([k]) => k));
  // the ones who left fade out, new ones pop in, the ones who did something new give a small nod
  $$('.who-now', box).forEach((el) => {
    if (keep.has(el.dataset.p)) return;
    el.dataset.p = '';
    M.play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 260, easing: 'ease-in' }).then(() => el.remove());
  });
  [...want].reverse().forEach(([k, e]) => {
    const label = e.name || e.email || place(e) || 'Someone';
    const sub = doing(e) + (place(e) && label !== place(e) ? ` · ${place(e)}` : '');
    const html = `<span class="av" style="--h:${hue(e.city || label)}">${esc(label[0].toUpperCase())}</span>
      <span><b>${esc(label)}</b><small>${esc(sub)}</small></span><span class="age" data-ago="${esc(e.timestamp_ist)}">${ago(e.timestamp_ist)}</span>`;
    let el = $$('.who-now', box).find((c) => c.dataset.p === k);
    if (!el) {
      el = document.createElement('div');
      el.className = 'who-now tap';
      el.dataset.p = k;
      el.dataset.drill = 'who'; el.dataset.arg = k; el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.innerHTML = html;
      box.prepend(el);
      M.play(el, [{ opacity: 0, transform: 'scale(.9) translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    } else if (el.dataset.e !== evKey(e)) {
      el.innerHTML = html;
      M.bump(el.querySelector('.av'), 1.15);
    }
    el.dataset.e = evKey(e);
    el.title = `${label}: ${sub}`;
  });
  let more = $('.now-more', box);
  if (list.length > want.length) {
    if (!more) { more = document.createElement('span'); more.className = 'now-more'; box.appendChild(more); }
    more.textContent = `+${list.length - want.length} more`;
  } else if (more) more.remove();
}

function paintWho() {
  const w = $('#who');
  const email = (USER && USER.email) || '';
  w.innerHTML = `<span class="av">${esc((email[0] || '?').toUpperCase())}</span><span class="em">${esc(email)}</span>
    <span class="ju-pill ${isAdmin() ? 'ok' : 'blue'}">${isAdmin() ? 'Admin' : 'Upload only'}</span>`;
  w.title = email;
  w.hidden = false;
  $('#settingsTab').hidden = !isAdmin();
  if (!$('#upBy').value) $('#upBy').value = email;
}

const shift = (iso, n) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); if (!m) return ''; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)); return d.toISOString().slice(0, 10); };
function lineHtml(start, end, phase, tap = false) {   // Before: to the day before it starts · During: its days · After: from the day after it ends
  const seg = (k, title, sub) => `<div class="seg${phase === k ? ' on' : ''}${tap ? ' tap' : ''}"${tap ? ` ${drillAttrs('phase', k, `${title} the exhibition: see the visitors`)}` : ''}><b>${title}</b>${sub}</div>`;
  return seg('pre_exhibition', 'Before', start ? `to ${dayOf(shift(start, -1))}` : '')
    + seg('during_exhibition', 'During', start && end ? `${dayOf(start)} – ${dayOf(end)}` : '')
    + seg('post_exhibition', 'After', end ? `from ${dayOf(shift(end, 1))}` : '');
}
function paintExhibition() {
  const c = DATA.config || {};
  $('#exName').textContent = c.exhibition_name || 'Exhibition';
  const p = PHASES[DATA.current_phase] || PHASES.pre_exhibition;
  $('#exPhase').innerHTML = `<span class="ju-pill ${p.pill}">${DATA.current_phase === 'during_exhibition' ? 'On now' : DATA.current_phase === 'post_exhibition' ? 'Finished' : 'Coming up'}</span>`;
  $('#exLine').innerHTML = lineHtml(c.start_date, c.end_date, DATA.current_phase, true);
}

const KPIS = [
  ['total_visits', 'Visits', 'eye', 'k-blue'],
  ['post_exhibition_visits', 'After the exhibition', 'calendar-days', 'k-warn'],
  ['total_downloads', 'Downloads', 'arrow-down-to-line', 'k-ok'],
  ['total_inquiries', 'Queries', 'message-square-text', 'k-accent'],
  ['known_email_visitors', 'Known emails', 'mail', ''],
];
let CITY_N = {};
function paintNumbers(live = false) {
  const s = DATA.summary || {};
  const box = $('#kpis');
  if (!box.children.length) box.innerHTML = KPIS.map(([k, label, ic, cls]) => `<div class="kpi tap ${cls}" ${drillAttrs('kpi', k, label + ': see them all')}><span class="k-ic">${icon(ic)}</span><b data-k="${k}">0</b><span>${label}</span><span class="k-go">${icon('chevron-right')}</span></div>`).join('');
  for (const [k] of KPIS) {
    const el = $(`[data-k="${k}"]`, box), from = Number(el.dataset.n || 0), to = Number(s[k] || 0);
    countTo(el, to);
    if (live && to > from) plus(el.closest('.kpi'), to - from);
  }
  const cities = Object.entries(s.top_cities || {}), before = CITY_N;
  CITY_N = Object.fromEntries(cities);
  const html = cities.length
    ? cities.map(([c, n]) => `<span class="ju-pill tap" data-c="${esc(c)}" ${drillAttrs('city', c, `${c}: ${n} visitors`)}>${esc(c)}<b>${n}</b></span>`).join('')
    : '<span class="ju-small ju-muted">No locations yet.</span>';
  if ($('#cities').innerHTML === html) return;
  $('#cities').innerHTML = html;
  if (live) $$('#cities [data-c]').forEach((el) => { if ((before[el.dataset.c] || 0) < CITY_N[el.dataset.c]) M.bump(el, 1.12); });
}
function plus(tile, n) {   // the tile's icon nods and a small "+1" floats up off it
  ui(() => {
    M.bump(tile.querySelector('.k-ic'), 1.2);
    const p = document.createElement('span');
    p.className = 'plus';
    p.textContent = `+${n}`;
    tile.appendChild(p);
    M.play(p, [{ opacity: 0, transform: 'translateY(8px) scale(.9)' }, { opacity: 1, transform: 'none', offset: 0.18 }, { opacity: 1, transform: 'translateY(-3px)', offset: 0.75 }, { opacity: 0, transform: 'translateY(-14px)' }],
      { duration: 2000, easing: 'ease-out' }).then(() => p.remove());
  });
}

// ---------- visitor activity ----------
const F = { q: '', type: 'ALL', phase: 'ALL' };
$('#typeChips').innerHTML = [['ALL', 'All', ''], ['visit', 'Opened', 'eye'], ['view', 'Read', 'book-open'], ['download', 'Downloaded', 'arrow-down-to-line'], ['query', 'Asked', 'message-square-text']]
  .map(([v, label, ic]) => `<button type="button" class="ju-chip${v === 'ALL' ? ' on' : ''}" data-type="${v}">${ic ? icon(ic) : ''}${label}</button>`).join('');
$('#typeChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]'); if (!b) return;
  F.type = b.dataset.type;
  $$('#typeChips .ju-chip').forEach((c) => c.classList.toggle('on', c === b));
  M.bump(b, 1.06);
  paintEvents(true);
});
let qt = 0;
$('#q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { F.q = e.target.value.trim().toLowerCase(); paintEvents(true); }, 150); });
$('#phase').addEventListener('change', (e) => { F.phase = e.target.value; paintEvents(true); });

const newest = (list) => [...(list || [])].sort((a, b) => String(b.timestamp_ist || '').localeCompare(String(a.timestamp_ist || '')));
function paintEvents(animate = false, fresh = new Set()) {
  if (!DATA) return;
  const all = newest(DATA.events).filter((ev) => (F.type === 'ALL' || ev.type === F.type) && (F.phase === 'ALL' || ev.phase === F.phase)
    && (!F.q || JSON.stringify(ev).toLowerCase().includes(F.q)));
  const list = all.slice(0, 200);
  ELIST = list;
  const box = $('#events');
  if (!list.length) {
    box.innerHTML = `<div class="empty"><span class="ti">${icon('users')}</span>${(DATA.events || []).length ? 'Nothing matches these filters.' : 'No visitors yet. They appear here as soon as someone opens the catalogue site.'}</div>`;
    $('#eventsMore').hidden = true;
    return;
  }
  box.innerHTML = `<div class="row hd"><span></span><span>Catalogue</span><span>Visitor</span><span>Where</span><span>When</span><span>From</span></div>`
    + list.map((ev, i) => {
      const a = ACTIONS[ev.type] || { ic: 'file-text', word: ev.type || 'Action' };
      const who = ev.email ? `<a class="lk" href="mailto:${esc(ev.email)}">${esc(ev.email)}</a>` : ev.name ? esc(ev.name) : '<span class="ju-muted">Anonymous</span>';
      return `<div class="row tap${fresh.has(evKey(ev)) ? ' is-new' : ''}${secsAgo(ev.timestamp_ist) < 180 ? ' fresh' : ''}" data-ts="${esc(ev.timestamp_ist)}" data-i="${i}" role="button" tabindex="0" title="Open the details">
        <span class="a-ic ${esc(ev.type)}" title="${esc(a.word)}">${icon(a.ic)}</span>
        <span><span class="main">${esc(ev.catalog_title || 'Front page')}</span><span class="sub">${esc(a.word)}${ev.brand ? ' · ' + esc(ev.brand) : ''}</span></span>
        <span><span class="main" style="font-weight:550">${who}</span><span class="sub">${esc(ev.company || '')}</span></span>
        <span><span class="main" style="font-weight:500">${esc(place(ev) || 'Unknown')}</span><span class="sub">${esc(ev.region || '')}</span></span>
        <span><span class="main" style="font-weight:500" data-ago="${esc(ev.timestamp_ist)}" title="${esc(when(ev.timestamp_ist))}">${ago(ev.timestamp_ist)}</span><span class="sub">${pill(ev.phase)}</span></span>
        <span><span class="main" style="font-weight:500">${esc(ev.source || 'direct')}</span><span class="sub">${esc(ev.device || '')}</span></span>
      </div>`;
    }).join('');
  const more = $('#eventsMore');
  more.hidden = all.length <= list.length;
  more.textContent = `Showing the newest ${list.length} of ${all.length}. Download the CSV for all of them.`;
  if (animate) M.rise($$('.row:not(.hd)', box).slice(0, 12), { step: 22, y: 6 });
  else M.rise($$('.row.is-new', box), { step: 70, y: -10 });   // new ones drop in at the top
}

// ---------- queries: search, filters, "New" since your last look, by day, a status the whole team shares ----------
const QF = { q: '', f: 'all' };
const QSEEN = (() => { try { return +(localStorage.getItem('tp_q_seen') || 0); } catch { return 0; } })();   // (when you last looked)
const STATUS = { new: { word: 'New', next: 'contacted', hint: 'Mark as contacted' }, contacted: { word: 'Contacted', next: 'done', hint: 'Mark as done' }, done: { word: 'Done', next: 'new', hint: 'Mark as new again' } };
const qStatus = (r) => ((DATA.query_status || {})[r.id] || {}).s || 'new';
const qStatusInfo = (r) => (DATA.query_status || {})[r.id] || null;
const isUnseen = (r) => istMs(r.timestamp_ist) > QSEEN;
const dayLabel = (ts) => {
  const t = istMs(ts); if (!t) return 'Earlier';
  const d = new Date(t + 19800000), now = new Date(Date.now() + 19800000);
  const days = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 864e5) - Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 864e5);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${d.getUTCFullYear() !== now.getUTCFullYear() ? ' ' + d.getUTCFullYear() : ''}`;
};
const QFILTERS = [['all', 'All', ''], ['new', 'New', 'circle-alert'], ['contacted', 'Contacted', 'phone'], ['done', 'Done', 'circle-check'], ['today', 'Today', 'calendar-days']];

function paintQueries(fresh = new Set()) {
  const all = newest(DATA.inquiries);
  const box = $('#queries');
  const counts = { all: all.length, new: 0, contacted: 0, done: 0, today: 0 };
  for (const r of all) { counts[qStatus(r)]++; if (dayLabel(r.timestamp_ist) === 'Today') counts.today++; }
  $('#qChips').innerHTML = QFILTERS.map(([k, label, ic]) => `<button type="button" class="ju-chip${QF.f === k ? ' on' : ''}" data-qf="${k}">${ic ? icon(ic) : ''}${label}<b>${counts[k]}</b></button>`).join('');
  const nNew = all.filter(isUnseen).length;
  $('#qNew').hidden = !nNew;
  $('#qNew').innerHTML = `${nNew} new<span class="long"> since you last looked</span>`;
  const q = QF.q;
  const list = all.filter((r) => (QF.f === 'all' || (QF.f === 'today' ? dayLabel(r.timestamp_ist) === 'Today' : qStatus(r) === QF.f))
    && (!q || [r.name, r.company, r.email, r.phone, r.message, r.catalog_title, r.brand, r.city].join(' ').toLowerCase().includes(q)));
  QLIST = list;
  if (!all.length) { box.innerHTML = `<div class="empty"><span class="ti">${icon('message-square-text')}</span>No queries yet. They appear here as soon as someone sends one from the catalogue site.</div>`; return; }
  if (!list.length) { box.innerHTML = `<div class="empty"><span class="ti">${icon('search')}</span>No query matches. <button class="ju-btn sm" type="button" data-qclear>Show all</button></div>`; return; }
  let day = '', html = '';
  list.forEach((r, i) => {
    const d = dayLabel(r.timestamp_ist);
    if (d !== day) { day = d; html += `<div class="q-day">${esc(d)}</div>`; }
    const s = qStatus(r), wa = waLink(r.phone), name = r.name || 'No name';
    html += `<div class="qcard tap st-${s}${isUnseen(r) ? ' unseen' : ''}${fresh.has(qKey(r)) ? ' is-new' : ''}" data-i="${i}" role="button" tabindex="0" title="Open the query">
      <span class="q-av" style="--h:${hue(name)}">${esc(name[0].toUpperCase())}</span>
      <div class="q-main">
        <div class="q-top"><b>${esc(name)}</b>${r.company ? `<span class="q-co">${esc(r.company)}</span>` : ''}${isUnseen(r) ? '<span class="q-newdot">New</span>' : ''}</div>
        <p class="q-text">${esc(r.message || '(no message)')}</p>
        <div class="q-meta">${r.catalog_title ? `<span>${icon('book-open')}${esc(r.catalog_title)}</span>` : ''}${place(r) ? `<span>${icon('map-pin')}${esc(place(r))}</span>` : ''}<span title="${esc(when(r.timestamp_ist))}">${esc(ago(r.timestamp_ist))}</span></div>
      </div>
      <div class="q-side">
        ${r.id ? `<button class="q-st" type="button" data-status="${esc(r.id)}" title="${esc(STATUS[s].hint)}">${esc(STATUS[s].word)}</button>` : ''}
        <span class="q-acts">
          ${r.phone ? `<a class="ju-icon" href="tel:${esc(r.phone)}" title="Call ${esc(r.phone)}" aria-label="Call">${icon('phone')}</a>` : ''}
          ${wa ? `<a class="ju-icon" href="${esc(wa)}" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">${icon('message-circle')}</a>` : ''}
          ${r.email ? `<a class="ju-icon" href="mailto:${esc(r.email)}" title="Email ${esc(r.email)}" aria-label="Email">${icon('mail')}</a>` : ''}
        </span>
      </div>
    </div>`;
  });
  box.innerHTML = html;
  M.rise($$('.qcard.is-new', box), { step: 70, y: -10 });
}
$('#qChips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-qf]'); if (!b) return;
  QF.f = b.dataset.qf; M.bump(b, 1.06); paintQueries();
  M.rise($$('#queries .qcard').slice(0, 10), { step: 22, y: 6 });
});
let qqT = 0;
$('#qq').addEventListener('input', (e) => { clearTimeout(qqT); qqT = setTimeout(() => { QF.q = e.target.value.trim().toLowerCase(); paintQueries(); }, 150); });
$('#queries').addEventListener('click', (e) => { if (e.target.closest('[data-qclear]')) { QF.q = ''; QF.f = 'all'; $('#qq').value = ''; paintQueries(); } });
// once the queries have been on screen for a few seconds, they count as seen (the "New" marks stay until the next visit)
ui(() => {
  let t = 0;
  new IntersectionObserver((en) => {
    clearTimeout(t);
    if (en[0].isIntersecting) t = setTimeout(() => { try { localStorage.setItem('tp_q_seen', String(Date.now())); } catch {} }, 4000);
  }, { threshold: 0.25 }).observe($('#queries'));
});

// the status: a tap on it moves it on (New -> Contacted -> Done -> New); the whole team sees it
async function setQueryStatus(id, status, from) {
  const before = (DATA.query_status || {})[id];
  DATA.query_status = { ...(DATA.query_status || {}) };
  if (status === 'new') delete DATA.query_status[id]; else DATA.query_status[id] = { s: status, by: (USER && USER.email) || '', at: '' };
  paintQueries();
  dispatchEvent(new Event('tp:status'));
  if (from) M.bump(from, 1.1);
  try {
    const r = await fetch(`${API}?action=query_status`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Team-Token': TOKEN }, body: JSON.stringify({ id, status }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { signOut('Your sign-in has ended. Please sign in again.'); return; }
    if (!r.ok || !j.ok) throw new Error(j.error || 'Could not save');
    if (status !== 'new') DATA.query_status[id] = j.status;
    toast(status === 'done' ? 'Marked as done' : status === 'contacted' ? 'Marked as contacted' : 'Marked as new');
    dispatchEvent(new Event('tp:status'));
  } catch {
    if (before) DATA.query_status[id] = before; else delete DATA.query_status[id];
    paintQueries(); dispatchEvent(new Event('tp:status'));
    toast('Could not save the status. Please try again.');
  }
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-status]');
  if (b) { e.stopPropagation(); const r = (DATA.inquiries || []).find((x) => x.id === b.dataset.status); if (r) setQueryStatus(r.id, STATUS[qStatus(r)].next, b); return; }
  const c = e.target.closest('[data-setstatus]');
  if (c) setQueryStatus(c.dataset.setstatus, c.dataset.s, c);
}, true);

// ---------- a row opens its details in a window ----------
let QLIST = [], ELIST = [];
function wireRows(box, open) {
  box.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;   // (a phone number or an email link still works by itself)
    const r = e.target.closest('.tap[data-i]'); if (r) open(+r.dataset.i, r);
  });
  box.addEventListener('keydown', (e) => {
    const r = e.target.closest && e.target.closest('.tap[data-i]');
    if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(+r.dataset.i, r); }
  });
}
wireRows($('#queries'), (i, from) => openQuery(i, from));
wireRows($('#events'), (i, from) => openEvent(i, from));

const digits = (s) => String(s || '').replace(/\D/g, '');
const waLink = (phone) => { let d = digits(phone); if (d.length === 10) d = '91' + d; return d.length >= 11 ? `https://wa.me/${d}` : ''; };
const pageOf = (msg) => { const m = /page (\d+)/i.exec(msg || ''); return m ? +m[1] : 0; };
const catLink = (id, page = 0) => (id ? `/?cat=${encodeURIComponent(id)}${page > 1 ? `&page=${page}` : ''}` : '/');
const fact = (label, value) => (value ? `<div class="fact"><span>${label}</span><b>${value}</b></div>` : '');
const recent = (ts) => (secsAgo(ts) < 3600 ? ` <span class="ju-muted">· ${esc(ago(ts))}</span>` : '');   // ("· 5 min ago" within the hour)
const placeOf = (o) => [o.city, o.region, o.country].filter((x) => x && x !== 'Unknown').join(', ');

// windows can sit on top of each other (a list, then one of its items): Esc and the arrows act on the top one only,
// and the page scrolls again once the last one has closed
const isTop = (ov) => { const all = document.querySelectorAll('.ju-overlay'); return all[all.length - 1] === ov; };
const unlock = () => { if (!document.querySelector('.ju-overlay')) document.body.style.overflow = ''; };
function growFrom(sheet, from) {   // a window grows out of what was pressed
  if (!from || !from.getBoundingClientRect) return;
  const r = from.getBoundingClientRect(), b = sheet.getBoundingClientRect();
  M.play(sheet, [{ opacity: 0, transform: `translate(${(r.left + r.width / 2) - (b.left + b.width / 2)}px, ${(r.top + r.height / 2) - (b.top + b.height / 2)}px) scale(.6)` }, { opacity: 1, transform: 'none' }],
    { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
}

// one item's details: a title, the details, buttons; the arrows (or the keyboard's < >) go to the one before / after
function detailSheet({ list, i, from, render }) {
  let at = i;
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  ov.innerHTML = `<div class="ju-sheet tp-detail" role="dialog" aria-modal="true">
    <div class="detail-top">
      <button class="ju-icon prev" type="button" data-step="-1" aria-label="Newer">${icon('chevron-right')}</button>
      <span class="detail-pos ju-small ju-muted"></span>
      <button class="ju-icon" type="button" data-step="1" aria-label="Older">${icon('chevron-right')}</button>
      <span style="flex:1"></span>
      <button class="ju-icon" type="button" data-x aria-label="Close">${icon('x')}</button>
    </div>
    <div class="detail-body"></div></div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.tp-detail'), body = ov.querySelector('.detail-body');
  const paint = (dir = 0) => {
    body.innerHTML = render(list[at]);
    sheet.setAttribute('aria-label', body.querySelector('h2')?.textContent || 'Details');
    ov.querySelector('.detail-pos').textContent = `${at + 1} of ${list.length}`;
    ov.querySelector('[data-step="-1"]').disabled = at === 0;
    ov.querySelector('[data-step="1"]').disabled = at === list.length - 1;
    if (dir) M.play(body, [{ opacity: 0, transform: `translateX(${dir * 18}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  };
  paint();
  growFrom(sheet, from);
  const onStatus = () => paint();
  addEventListener('tp:status', onStatus);
  const step = (d) => { const n = at + d; if (n < 0 || n >= list.length) return; at = n; paint(d); };
  const close = () => {
    document.removeEventListener('keydown', key);
    removeEventListener('tp:status', onStatus);
    M.play(sheet, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(12px) scale(.97)' }], { duration: 200, easing: 'ease-in' })
      .then(() => { ov.remove(); unlock(); });
  };
  const key = (e) => { if (!isTop(ov)) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); };
  document.addEventListener('keydown', key);
  ov.addEventListener('click', async (e) => {
    if (e.target === ov || e.target.closest('[data-x]')) return close();
    const s = e.target.closest('[data-step]'); if (s) { step(+s.dataset.step); return; }
    const c = e.target.closest('[data-copy]');
    if (c) { if (await copyText(c.dataset.copy)) { showCopied(c); toast('Copied'); } else window.prompt('Copy this:', c.dataset.copy); }
  });
  setTimeout(() => ov.querySelector('[data-x]').focus({ preventScroll: true }), 60);
}

// a drill-down: everything behind a number, a place, a phase, a catalogue or a person, as a list;
// each item opens its details (on top, so closing them comes back to the list)
function drillSheet({ eyebrow, title, sub = '', items, kind = 'event', from, actions = '' }) {
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  const row = (x, i) => {
    if (kind === 'query') {
      return `<button class="drill-row" type="button" data-i="${i}"><span class="a-ic query">${icon('message-square-text')}</span>
        <span class="dr-t"><b>${esc(x.name || 'No name')}${x.company ? ` <span class="ju-muted">· ${esc(x.company)}</span>` : ''}</b><small>${esc(x.message || '')}</small></span>
        <span class="dr-w">${esc(ago(x.timestamp_ist))}</span></button>`;
    }
    const a = ACTIONS[x.type] || { ic: 'file-text', word: x.type || 'Action' };
    const who = x.name || x.email || '';
    return `<button class="drill-row" type="button" data-i="${i}"><span class="a-ic ${esc(x.type)}">${icon(a.ic)}</span>
      <span class="dr-t"><b>${esc(x.catalog_title || 'Front page')}</b><small>${esc([a.word, who, placeOf(x) || '', x._n > 1 ? `${x._n} actions` : ''].filter(Boolean).join(' · '))}</small></span>
      <span class="dr-w">${esc(ago(x.timestamp_ist))}</span></button>`;
  };
  ov.innerHTML = `<div class="ju-sheet tp-drill" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="drill-head">
      <div><div class="ju-eyebrow">${esc(eyebrow)} · <b>${items.length}</b></div><h2>${esc(title)}</h2>${sub ? `<p class="ju-muted">${sub}</p>` : ''}</div>
      <button class="ju-icon" type="button" data-x aria-label="Close">${icon('x')}</button>
    </div>
    ${actions ? `<div class="reach">${actions}</div>` : ''}
    <div class="drill-list">${items.length ? items.slice(0, 300).map(row).join('') : `<div class="empty"><span class="ti">${icon('users')}</span>Nothing here yet.</div>`}</div>
    ${items.length > 300 ? `<p class="more ju-small ju-muted">Showing the newest 300 of ${items.length}. Download the CSV for all of them.</p>` : ''}
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.tp-drill');
  growFrom(sheet, from);
  M.rise([...ov.querySelectorAll('.drill-row')].slice(0, 14), { delay: 120, step: 22, y: 6 });
  const close = () => {
    document.removeEventListener('keydown', key);
    M.play(sheet, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(12px) scale(.97)' }], { duration: 200, easing: 'ease-in' })
      .then(() => { ov.remove(); unlock(); });
  };
  const key = (e) => { if (isTop(ov) && e.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  ov.addEventListener('click', (e) => {
    if (e.target === ov || e.target.closest('[data-x]')) return close();
    const r = e.target.closest('.drill-row');
    if (r) detailSheet({ list: items, i: +r.dataset.i, from: r, render: kind === 'query' ? renderQuery : renderEvent });
  });
  setTimeout(() => ov.querySelector('[data-x]').focus({ preventScroll: true }), 60);
}

// ---------- what each click opens ----------
const personKey = (e) => e.ip || [e.city, e.device, e.source].join('|');
const catTitle = (id) => ((DATA.events || []).find((e) => e.catalog_id === id) || {}).catalog_title || id;
const PHASE_WORDS = { pre_exhibition: 'Before the exhibition', during_exhibition: 'During the exhibition', post_exhibition: 'After the exhibition' };
function drill(kind, arg, from) {
  const ev = newest(DATA.events), q = newest(DATA.inquiries);
  if (kind === 'kpi') {
    if (arg === 'total_inquiries') return drillSheet({ eyebrow: 'Queries', title: 'Every query', items: q, kind: 'query', from });
    if (arg === 'known_email_visitors') {   // one line per person, their latest action, how many in all
      const seen = new Map();
      for (const e of ev) { if (!e.email) continue; const p = seen.get(e.email); if (p) p._n++; else seen.set(e.email, { ...e, _n: 1 }); }
      return drillSheet({ eyebrow: 'Known emails', title: 'People who gave their email', sub: 'Their latest action; open one to see it, or tap their email inside.', items: [...seen.values()], from });
    }
    const pick = { total_visits: ['Visits', 'Every visit', (e) => e.type === 'visit'], post_exhibition_visits: ['After the exhibition', 'Visits after it ended', (e) => e.type === 'visit' && e.phase === 'post_exhibition'],
      total_downloads: ['Downloads', 'Every download', (e) => e.type === 'download'] }[arg];
    if (pick) return drillSheet({ eyebrow: pick[0], title: pick[1], items: ev.filter(pick[2]), from });
  }
  if (kind === 'city') return drillSheet({ eyebrow: 'Where visitors are', title: arg, items: ev.filter((e) => e.city === arg), from });
  if (kind === 'phase') return drillSheet({ eyebrow: 'Exhibition', title: PHASE_WORDS[arg] || arg, items: ev.filter((e) => e.phase === arg), from });
  if (kind === 'cat') {
    return drillSheet({ eyebrow: 'Catalogue', title: catTitle(arg), items: ev.filter((e) => e.catalog_id === arg), from,
      actions: `<a class="ju-btn" href="${esc(catLink(arg))}" target="_blank" rel="noopener">${icon('external-link')}Open its page</a>${q.some((x) => x.catalog_id === arg) ? `<button class="ju-btn" type="button" data-drill="catq" data-arg="${esc(arg)}">${icon('message-square-text')}Its queries</button>` : ''}` });
  }
  if (kind === 'catq') return drillSheet({ eyebrow: 'Queries', title: catTitle(arg), items: q.filter((x) => x.catalog_id === arg), kind: 'query', from });
  if (kind === 'front') return drillSheet({ eyebrow: 'Front page', title: 'The front page', items: ev.filter((e) => !e.catalog_id), from });
  if (kind === 'who') {
    const items = ev.filter((e) => personKey(e) === arg), p = items[0] || {};
    return drillSheet({ eyebrow: 'Visitor', title: p.name || p.email || place(p) || 'A visitor', sub: esc([place(p), p.device, p.source].filter(Boolean).join(' · ')), items, from });
  }
  if (kind === 'email') {
    const items = ev.filter((e) => e.email === arg), p = items[0] || {};
    return drillSheet({ eyebrow: 'Visitor', title: p.name || arg, sub: esc([arg, p.company].filter(Boolean).join(' · ')), items, from,
      actions: `<a class="ju-btn" href="mailto:${esc(arg)}">${icon('mail')}${esc(arg)}</a>${q.some((x) => x.email === arg) ? `<button class="ju-btn" type="button" data-drill="qby" data-arg="${esc(arg)}">${icon('message-square-text')}Their queries</button>` : ''}` });
  }
  if (kind === 'qby') return drillSheet({ eyebrow: 'Queries', title: `From ${arg}`, items: q.filter((x) => x.email === arg || (x.phone && x.phone === arg)), kind: 'query', from });
  return null;
}
// anything marked data-drill opens its list (numbers, places, phases, "open now", people, links inside windows)
document.addEventListener('click', (e) => {
  const d = e.target.closest('[data-drill]');
  if (!d || !DATA) return;
  e.preventDefault();
  M.bump(d, 1.03);
  drill(d.dataset.drill, d.dataset.arg || '', d);
});
document.addEventListener('keydown', (e) => {
  const d = e.target.closest && e.target.closest('[data-drill]');
  if (d && (e.key === 'Enter' || e.key === ' ') && d.tagName !== 'BUTTON') { e.preventDefault(); d.click(); }
});
// (the words you see are the button's name; the hint goes in the tooltip, so screen readers say what is shown)
const drillAttrs = (kind, arg, label) => `data-drill="${kind}" data-arg="${esc(arg)}" role="button" tabindex="0" title="${esc(label)}"`;

// a query: who, how to reach them (call, WhatsApp, email), what about, the whole message, where and when
function renderQuery(r) {
  const page = pageOf(r.message), wa = waLink(r.phone);
  const subject = `Your query${r.catalog_title ? ' about ' + r.catalog_title : ''} - Jinharsh`;
  const all = [`Name: ${r.name || ''}`, r.company ? `Company: ${r.company}` : '', r.phone ? `Phone: ${r.phone}` : '', r.email ? `Email: ${r.email}` : '',
    r.catalog_title ? `About: ${r.catalog_title}${r.brand ? ' (' + r.brand + ')' : ''}` : '', `Message: ${r.message || ''}`, `When: ${when(r.timestamp_ist)}`,
    placeOf(r) ? `Where: ${placeOf(r)}` : ''].filter(Boolean).join('\n');
  const more = (DATA.inquiries || []).filter((x) => x !== r && ((r.email && x.email === r.email) || (r.phone && x.phone === r.phone))).length;
  return `<div class="detail-head">
      <span class="detail-ic q">${icon('message-square-text')}</span>
      <div><div class="ju-eyebrow">Query · ${pill(r.phase)}</div><h2>${esc(r.name || 'No name')}</h2>${r.company ? `<p class="ju-muted">${esc(r.company)}</p>` : ''}</div>
    </div>
    <div class="reach">
      ${r.phone ? `<a class="ju-btn accent" href="tel:${esc(r.phone)}">${icon('phone')}Call ${esc(r.phone)}</a>` : ''}
      ${wa ? `<a class="ju-btn" href="${esc(wa)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp</a>` : ''}
      ${r.email ? `<a class="ju-btn" href="mailto:${esc(r.email)}?subject=${encodeURIComponent(subject)}">${icon('mail')}${esc(r.email)}</a>` : ''}
    </div>
    ${r.id ? `<div class="q-status-row"><span class="q-label">Status</span>${['new', 'contacted', 'done'].map((k) => `<button type="button" class="ju-chip${qStatus(r) === k ? ' on st-' + k : ''}" data-setstatus="${esc(r.id)}" data-s="${k}">${STATUS[k].word}</button>`).join('')}${qStatusInfo(r) && qStatusInfo(r).by ? `<span class="ju-small ju-muted">by ${esc(qStatusInfo(r).by.split('@')[0])}${qStatusInfo(r).at ? ', ' + esc(when(qStatusInfo(r).at)) : ''}</span>` : ''}</div>` : ''}
    <div class="detail-msg">
      <div class="detail-label"><span>Message</span><button class="ju-btn sm ghost" type="button" data-copy="${esc(r.message || '')}">${icon('copy')}Copy</button></div>
      <p>${esc(r.message || '(no message)')}</p>
    </div>
    <div class="facts">
      ${fact('About', r.catalog_title ? `<a class="lk" href="${esc(catLink(r.catalog_id, page))}" target="_blank" rel="noopener">${esc(r.catalog_title)}${page > 1 ? ` · page ${page}` : ''}</a>${r.brand ? ` <span class="ju-muted">· ${esc(r.brand)}</span>` : ''}${r.catalog_id ? `<button class="drill-link" type="button" data-drill="cat" data-arg="${esc(r.catalog_id)}">Everyone on this catalogue ›</button>` : ''}` : 'General question')}
      ${fact('Received', `${esc(when(r.timestamp_ist))}${recent(r.timestamp_ist)}`)}
      ${fact('Where', esc(placeOf(r)) ? `${esc(placeOf(r))}${r.city ? `<button class="drill-link" type="button" data-drill="city" data-arg="${esc(r.city)}">Everyone from ${esc(r.city)} ›</button>` : ''}` : '')}
      ${fact('Came from', esc(r.source || ''))}
      ${more ? fact('Before', `<button class="drill-link" type="button" data-drill="qby" data-arg="${esc(r.email || r.phone)}">${more} more ${more === 1 ? 'query' : 'queries'} from them ›</button>`) : ''}
    </div>
    <div class="btns detail-btns"><button class="ju-btn" type="button" data-copy="${esc(all)}">${icon('copy')}Copy all details</button></div>`;
}

// a visit, a read, a download...: what, who (when known), where from, when, how they came; each can be opened further
function renderEvent(ev) {
  const a = ACTIONS[ev.type] || { ic: 'file-text', word: ev.type || 'Action' };
  let ref = '';
  try { ref = ev.referrer ? new URL(ev.referrer).hostname.replace(/^www\./, '') : ''; } catch {}
  const visits = (DATA.events || []).filter((e) => personKey(e) === personKey(ev)).length;
  return `<div class="detail-head">
      <span class="detail-ic a-ic ${esc(ev.type)}">${icon(a.ic)}</span>
      <div><div class="ju-eyebrow">${esc(a.word)} · ${pill(ev.phase)}</div><h2>${esc(ev.catalog_title || 'Front page')}</h2>${ev.brand ? `<p class="ju-muted">${esc(ev.brand)}</p>` : ''}</div>
    </div>
    ${ev.email ? `<div class="reach"><a class="ju-btn" href="mailto:${esc(ev.email)}">${icon('mail')}${esc(ev.email)}</a></div>` : ''}
    <div class="facts">
      ${fact('Who', `${esc(ev.name || ev.email || 'Anonymous visitor')}${ev.company ? ` <span class="ju-muted">· ${esc(ev.company)}</span>` : ''}${ev.email ? `<button class="drill-link" type="button" data-drill="email" data-arg="${esc(ev.email)}">All they did ›</button>` : visits > 1 ? `<button class="drill-link" type="button" data-drill="who" data-arg="${esc(personKey(ev))}">${visits} actions from this visitor ›</button>` : ''}`)}
      ${fact('When', `${esc(when(ev.timestamp_ist))}${recent(ev.timestamp_ist)}`)}
      ${fact('Where', `${esc(placeOf(ev) || 'Unknown')}${ev.city && ev.city !== 'Unknown' ? `<button class="drill-link" type="button" data-drill="city" data-arg="${esc(ev.city)}">Everyone from ${esc(ev.city)} ›</button>` : ''}`)}
      ${fact('Came from', esc([ev.source || 'direct', ref && ref !== ev.source ? ref : ''].filter(Boolean).join(' · ')))}
      ${fact('Device', esc(ev.device || ''))}
      ${fact('Catalogue', ev.catalog_id ? `<a class="lk" href="${esc(catLink(ev.catalog_id))}" target="_blank" rel="noopener">Open its page</a><button class="drill-link" type="button" data-drill="cat" data-arg="${esc(ev.catalog_id)}">Everyone on it ›</button>` : `<button class="drill-link" type="button" data-drill="front" data-arg="">Everyone on the front page ›</button>`)}
    </div>`;
}
function openQuery(i, from) { detailSheet({ list: QLIST, i, from, render: renderQuery }); }
function openEvent(i, from) { detailSheet({ list: ELIST, i, from, render: renderEvent }); }

$$('[data-export]').forEach((b) => b.addEventListener('click', () => {
  M.nudgeDown(b.querySelector('.i'));
  location.href = `${API}?action=export_csv&type=${encodeURIComponent(b.dataset.export)}&token=${encodeURIComponent(TOKEN)}`;
}));

// ---------- tabs ----------
$('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab, true); });
function showTab(tab, animate) {
  if (tab === 'settings' && !isAdmin()) tab = 'analytics';
  sessionStorage.setItem('jh_team_tab', tab);
  $$('.tabs [data-tab]').forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  for (const t of ['analytics', 'upload', 'settings']) $(`#tab-${t}`).hidden = t !== tab;
  if (animate) M.play($(`#tab-${tab}`), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

// ---------- upload a catalogue ----------
$('#brands').innerHTML = BRANDS.map((b) => `<option value="${esc(b)}"></option>`).join('');
$('#upCat').innerHTML = CATEGORIES.map(([v, label]) => `<option value="${esc(v)}">${esc(label)}</option>`).join('');
let FILE = null;
const drop = $('#drop'), fileInput = $('#file');
fileInput.addEventListener('change', (e) => takeFile(e.target.files[0]));
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => takeFile(e.dataTransfer.files[0]));

function takeFile(file) {
  if (!file) return;
  if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) { setStatus($('#upStatus'), 'bad', 'Please choose a PDF file.'); return; }
  FILE = file;
  setStatus($('#upStatus'), '', '');
  drop.classList.add('has');
  $('#dropT').textContent = file.name;
  $('#dropS').textContent = `${(file.size / 1048576).toFixed(1)} MB · ready to publish (click to choose another)`;
  $('.drop-ic', drop).innerHTML = icon('circle-check');
  M.bump($('.drop-ic', drop), 1.12);
  // a title, brand and category from the file name (only where nothing is typed yet)
  const raw = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const title = raw.replace(/\b\w/g, (m) => m.toUpperCase());
  if (!$('#upTitle').value) $('#upTitle').value = title;
  const rule = BRAND_RULES.find((r) => r.match.test(file.name));
  if (rule) { $('#upBrand').value = rule.brand; $('#upCat').value = rule.cat; }
  if (!$('#upDesc').value) $('#upDesc').value = `Official ${$('#upBrand').value || 'JinHarsh'} catalog (${title}) with technical specifications, selection charts, and direct inquiry support from JinHarsh Industrial Solutions.`;
}

$('#upForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const st = $('#upStatus');
  if (!FILE) { setStatus(st, 'bad', 'First choose the PDF to upload.'); M.shake(drop); return; }
  for (const id of ['upTitle', 'upBrand']) if (!$('#' + id).value.trim()) { M.shake($('#' + id)); $('#' + id).focus(); return; }
  const fd = new FormData();
  fd.append('pdf', FILE);
  fd.append('title', $('#upTitle').value.trim());
  fd.append('brand', $('#upBrand').value.trim());
  fd.append('category', $('#upCat').value);
  fd.append('badge', $('#upBadge').value.trim());
  fd.append('uploaded_by', $('#upBy').value.trim());
  fd.append('description', $('#upDesc').value.trim());
  const btn = $('#upBtn'), bar = $('#bar');
  btn.disabled = true;
  $('#progress').hidden = false; bar.style.width = '0';
  setStatus(st, '', 'Uploading… 0%');
  // (a plain request, so the bar can show how far the upload is)
  const x = new XMLHttpRequest();
  x.open('POST', `${API}?action=upload_catalog`);
  x.setRequestHeader('X-Team-Token', TOKEN);
  x.upload.onprogress = (p) => {
    if (!p.lengthComputable) return;
    const k = Math.round((p.loaded / p.total) * 100);
    bar.style.width = k + '%';
    setStatus(st, '', k < 100 ? `Uploading… ${k}%` : 'Publishing…');
  };
  const finish = () => { btn.disabled = false; setTimeout(() => { $('#progress').hidden = true; }, 600); };
  x.onerror = () => { finish(); setStatus(st, 'bad', 'No connection while uploading. Please try again.'); };
  x.onload = () => {
    finish();
    let j = {};
    try { j = JSON.parse(x.responseText); } catch {}
    if (x.status === 401) { signOut('Your sign-in has ended. Please sign in again.'); return; }
    if (x.status >= 200 && x.status < 300 && j.ok) {
      published(j.catalog);
      setStatus(st, 'ok', 'Live now: anyone can open it, download it and scan its code.');
      resetForm();
      load();
    } else setStatus(st, 'bad', j.error || 'The upload did not work. Please try again.');
  };
  x.send(fd);
});
function resetForm() {
  FILE = null; fileInput.value = '';
  for (const id of ['upTitle', 'upBrand', 'upDesc']) $('#' + id).value = '';
  drop.classList.remove('has');
  $('#dropT').textContent = 'Drop a PDF here, or choose one';
  $('#dropS').textContent = 'Up to 128 MB';
  $('.drop-ic', drop).innerHTML = icon('file-text');
}
function published(cat) {
  const url = `${location.origin}/?cat=${encodeURIComponent(cat.id)}`;
  LAST = { id: cat.id, url };
  $('#doneTitle').textContent = cat.brand ? `${cat.title} (${cat.brand})` : cat.title;
  $('#doneQr').innerHTML = qrSvg(url, { logo: true, title: cat.title });
  $('#doneLink').textContent = url.replace(/^https?:\/\//, '');
  $('#doneOpen').href = url;
  const box = $('#done');
  box.hidden = false;
  M.play(box, [{ opacity: 0, transform: 'scale(.96) translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  M.bump($('.done-tick', box), 1.25);
}
$('#doneCopy').addEventListener('click', async (e) => { if (LAST && await copyText(LAST.url)) showCopied(e.currentTarget); });
$('#doneQrPng').addEventListener('click', async () => { if (LAST) saveBlob(await qrPng(LAST.url, true, 2000), `qr-${LAST.id}.png`); });

function paintUploads() {
  const list = DATA.custom_catalogs || [];
  const box = $('#uploads');
  $('#uploadsSub').textContent = list.length ? `${list.length} catalogue${list.length === 1 ? '' : 's'} added from this portal.` : 'Catalogues added from this portal.';
  box.innerHTML = list.length ? list.map((c) => `<div class="up-item">
      <span class="mini" style="--h:${hue(c.brand)}">${esc((c.brand || 'J').slice(0, 2).toUpperCase())}</span>
      <span style="min-width:0"><b>${esc(c.title)}</b><small>${esc([c.brand, c.category, c.pages].filter(Boolean).join(' · '))}</small></span>
      <span class="acts">
        <a class="ju-icon" href="/?cat=${encodeURIComponent(c.id)}" target="_blank" rel="noopener" title="Open its page" aria-label="Open its page">${icon('external-link')}</a>
        ${isAdmin() ? `<button class="ju-icon del" type="button" data-del="${esc(c.id)}" data-title="${esc(c.title)}" title="Remove" aria-label="Remove">${icon('trash-2')}</button>` : ''}
      </span></div>`).join('')
    : `<div class="empty"><span class="ti">${icon('upload')}</span>Nothing uploaded from here yet.</div>`;
}
$('#uploads').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  const ok = await confirmSheet({ title: `Remove “${b.dataset.title}”?`, text: 'Its page, PDF and QR code stop working. This cannot be undone.', yes: 'Remove' });
  if (!ok) return;
  const r = await fetch(`${API}?action=delete_catalog`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Team-Token': TOKEN }, body: JSON.stringify({ id: b.dataset.del }) }).catch(() => null);
  if (r && r.ok) { toast('Removed'); load(); return; }
  const j = r ? await r.json().catch(() => ({})) : {};
  toast(j.error || 'Could not remove it.');
});

// ---------- settings (admins) ----------
function paintSettings() {
  const c = DATA.config || {};
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#setForm')) return;   // (not while typing)
  $('#setName').value = c.exhibition_name || '';
  $('#setStart').value = c.start_date || '';
  $('#setEnd').value = c.end_date || '';
  $('#setLine').innerHTML = lineHtml(c.start_date, c.end_date, DATA.current_phase);
}
['setStart', 'setEnd'].forEach((id) => $('#' + id).addEventListener('change', () => { $('#setLine').innerHTML = lineHtml($('#setStart').value, $('#setEnd').value, ''); }));
$('#setForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = $('#setStatus'), btn = $('#setBtn');
  if ($('#setEnd').value < $('#setStart').value) { setStatus(st, 'bad', 'The end date is before the start date.'); return; }
  btn.disabled = true;
  const r = await fetch(`${API}?action=save_config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Team-Token': TOKEN },
    body: JSON.stringify({ exhibition_name: $('#setName').value.trim(), start_date: $('#setStart').value, end_date: $('#setEnd').value }),
  }).catch(() => null);
  btn.disabled = false;
  if (r && r.ok) { setStatus(st, 'ok', 'Saved'); load(); return; }
  const j = r ? await r.json().catch(() => ({})) : {};
  setStatus(st, 'bad', j.error || 'Could not save. Please try again.');
});

// ---------- start ----------
if (TOKEN) openDash(); else showGate();
