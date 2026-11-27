// The front page: every live catalogue, with brand filters and search.
// Links from the old catalog.jinharsh.com hub keep working: /?cat=<name> opens that catalogue.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc, ui, contactHtml, shareSheet, qrSheet, toast, wireNav } from './site.js';
import { cardHtml as card, sortCatalogs, brandsOf, hubEyebrow, chipsHtml } from './markup.js';
import { saveFiles } from './handoff.js';
import { track } from './visitor.js';
import { catPath, teamPath, canUpload } from './backend.js';
import { cardFx } from './cardfx.js';
import { peekSheet } from './peek.js';
import { watchLive, others } from './live.js';
import { finder } from './finder.js';
import { configure } from './lookup.js';
import { startHelper } from './assistant.js';
import { watchGoodbye } from './goodbye.js';
import { querySheet } from './visitor.js';

const $ = (s, el = document) => el.querySelector(s);
const params = new URLSearchParams(location.search);
const cat = params.get('cat');
if (cat && /^[A-Za-z0-9-]{1,40}$/.test(cat) && !catPath('x').includes('?')) location.replace(catPath(cat.toLowerCase()));

const S = { all: [], brand: '', q: '', publicUrl: location.origin, site: {}, printable: true, searchUrl: '', live: null };

ui(() => {
  $('#searchIcon').outerHTML = icon('search');
  $('#hubQr').innerHTML = icon('qr-code');
  $('#hubShare').innerHTML = icon('share-2');
});
// the QR button opens QR Studio: every catalogue's code (and the front page's), for posters and visiting cards
const studio = (from = null) => import('./studio.js')
  .then((m) => m.openStudio({ catalogs: S.all, publicUrl: S.publicUrl, site: S.site, printable: S.printable, from }))
  .catch(() => toast('Could not open QR Studio. Please try again.'));
$('#hubQr').addEventListener('click', (e) => studio(e.currentTarget));
// a labelled QR Studio button in the top bar (a site's extra buttons) opens it here too, without reloading
document.addEventListener('click', (e) => { const a = e.target.closest('[data-studio]'); if (!a) return; e.preventDefault(); studio(a); });

// ---------- Upload, for the team ----------
// Shown to whoever may use the team page (signed in, or the office Wi-Fi copy where it is open).
// The PDFs chosen here are handed to the team page, which opens its upload window with them.
async function toTeam(files) {
  const pdfs = [...files].filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
  if (!pdfs.length) { toast('Only PDF files can be uploaded.'); return; }
  try { await saveFiles(pdfs); } catch { /* the team page will ask to choose the file again */ }
  location.href = teamPath + '#upload';
}
canUpload().then((ok) => {
  if (!ok) return;
  const b = $('#hubUpload');
  b.innerHTML = icon('upload') + '<span>Upload PDF</span>';
  b.hidden = false;
  M.bump(b, 1.06);
  b.addEventListener('click', () => { $('#hubFile').value = ''; $('#hubFile').click(); });
  $('#hubFile').addEventListener('change', (e) => toTeam(e.target.files));
  ui(() => { $('#dropIcon').outerHTML = icon('upload', 'bob'); });
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; $('#dropVeil').hidden = false; });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) $('#dropVeil').hidden = true; });
  window.addEventListener('drop', (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; $('#dropVeil').hidden = true; toTeam(e.dataTransfer.files); });
}).catch(() => {});
$('#hubShare').addEventListener('click', (e) => shareSheet({ link: S.publicUrl + '/', title: 'Jinharsh Catalogues', from: e.currentTarget, site: S.site, printable: S.printable }));

// the server puts the cards into the page itself, so they are on screen before this script has even arrived
const SERVED = $('#cards').hasAttribute('data-ready');
// otherwise: waiting shapes while the list arrives (plain, nothing moves or shines)
if (!SERVED) $('#cards').innerHTML = Array.from({ length: 6 }, () => '<div class="cat-card ghost-card"><div class="cc-cover"></div><div class="cc-body"><i></i><i></i></div></div>').join('');

async function load() {
  try {
    // the server puts the list inside the page; only a "Try again" fetches it
    let j = null;
    const boot = document.getElementById('boot');
    if (boot) { try { j = JSON.parse(boot.textContent); } catch {} boot.remove(); }
    if (!j) { const r = await fetch('/api/catalogs'); j = await r.json(); }
    S.all = j.catalogs || []; S.publicUrl = (j.publicUrl || location.origin).replace(/\/$/, ''); S.site = j.site || {}; S.printable = j.printable !== false;
    S.searchUrl = j.search || '';
  } catch {
    $('#cards').innerHTML = `<div class="ju-card empty-hub"><h2>The catalogues could not be loaded</h2><p class="ju-muted">Please check the internet connection and try again.</p><button class="ju-btn primary" type="button" data-reload>Try again</button></div>`;
    return;
  }
  // catalogues with a PDF first (newest first), then those still waiting
  sortCatalogs(S.all);
  const brands = brandsOf(S.all);
  $('#contact').innerHTML = contactHtml(S.site, '');
  ui(() => wireNav(S.site));   // a site's extra top-bar buttons, if it has any
  if (SERVED) {   // already on screen: nothing to draw, unless someone typed a search before this script arrived
    $('#cards').removeAttribute('data-ready');
    if ($('#q').value.trim()) { S.q = $('#q').value; draw(); }
  }
  else {
    $('#hubEyebrow').textContent = hubEyebrow(S.all, brands);
    $('#chips').innerHTML = chipsHtml(brands, S.brand);
    draw(true);
  }
  // cards that react to the mouse, search inside the catalogues, and who else is looking right now
  ui(() => cardFx($('#cards'), (code) => S.all.find((d) => d.code === code)));
  configure({ catalogs: S.all, search: S.searchUrl });
  ui(() => finder({ input: $('#q'), onAsk: (t) => querySheet({ message: t, from: $('#q') }) }));
  // the helper in the corner, and a warm goodbye when someone is leaving
  ui(() => startHelper({ site: S.site }));
  ui(() => watchGoodbye({ onQuery: () => querySheet({}) }));
  ui(() => watchLive('', (c) => { S.live = c; paintLive(); }));
  // catalog.jinharsh.com/?qr=1 opens QR Studio straight away (the address the team was given for it)
  if (new URLSearchParams(location.search).get('qr') === '1') studio();
}

function visible() {
  const q = S.q.trim().toLowerCase();
  return S.all.filter((d) => (!S.brand || d.brand === S.brand) &&
    (!q || [d.title, d.brand, d.category, d.note].join(' ').toLowerCase().includes(q)));
}

function draw(first) {
  const box = $('#cards');
  const list = visible();
  let done = () => {};
  if (!first) ui(() => { done = JUI.flip(box); });
  box.classList.toggle('ju-enter', !!first);
  box.innerHTML = list.length ? list.map(card).join('')
    : `<div class="ju-card empty-hub"><h2>No catalogue matches “${esc(S.q || S.brand)}”</h2><p class="ju-muted">Try another word, or ask us: we will send you the right catalogue.</p><button class="ju-btn" type="button" data-clear>Show all catalogues</button></div>`;
  done();
  paintLive(false);
}

// "3 others are looking at catalogues right now", and a small "2 looking" on the covers of the catalogues open now
function paintLive(animate = true) {
  const c = S.live;
  if (!c) return;
  let pill = $('#livePill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'livePill'; pill.className = 'live-pill'; pill.hidden = true;
    pill.setAttribute('aria-live', 'polite');
    $('#cards').before(pill);
  }
  const n = Math.max(0, (c.total || 0) - 1);
  const text = n ? `${others(n)} ${n === 1 ? 'is' : 'are'} looking at catalogues right now` : '';
  if (text && pill.dataset.t !== text) {
    pill.innerHTML = `<i class="dot"></i><span>${text}</span>`;
    if (pill.hidden) { pill.hidden = false; if (animate) M.play(pill, [{ opacity: 0, transform: 'translateY(6px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1.2)' }); }
    else if (animate) M.bump(pill.querySelector('.dot'), 1.6);
  }
  if (!text) pill.hidden = true;
  pill.dataset.t = text;
  document.querySelectorAll('#cards .cat-card[data-key]').forEach((card) => {
    const k = (c.cats || {})[card.dataset.key] || 0;
    let b = card.querySelector('.cc-live');
    if (!k) { if (b) { b.remove(); } return; }
    const label = `${k} looking`;
    if (!b) {
      b = document.createElement('span');
      b.className = 'cc-live';
      card.appendChild(b);
      b.innerHTML = `<i class="dot"></i><span>${label}</span>`;
      if (animate) M.play(b, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
    } else if (b.textContent !== label) { b.querySelector('span').textContent = label; if (animate) M.bump(b, 1.12); }
    b.title = `${k} ${k === 1 ? 'person has' : 'people have'} this catalogue open right now`;
  });
}

$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-brand]'); if (!b) return;
  S.brand = b.dataset.brand;
  document.querySelectorAll('#chips .ju-chip').forEach((c) => c.classList.toggle('on', c === b));
  M.bump(b, 1.06);
  draw();
});
let t = 0;
$('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value; draw(); }, 120); });
$('#cards').addEventListener('click', (e) => {
  const q = e.target.closest('[data-qr]');
  if (q) { const d = S.all.find((x) => x.code === q.dataset.qr); if (d) qrSheet({ link: `${S.publicUrl}${catPath(d.code)}`, title: d.title }); return; }
  const pk = e.target.closest('[data-peek]');
  if (pk) { const d = S.all.find((x) => x.code === pk.dataset.peek); if (d) peekSheet(d, pk); return; }
  if (e.target.closest('[data-reload]')) { location.reload(); return; }
  if (e.target.closest('[data-clear]')) { S.q = ''; S.brand = ''; $('#q').value = ''; document.querySelectorAll('#chips .ju-chip').forEach((c, i) => c.classList.toggle('on', i === 0)); draw(); }
});

load();
// one visit to the front page per visit to the site
try { if (!sessionStorage.getItem('seen_hub')) { sessionStorage.setItem('seen_hub', '1'); track('hub'); } } catch {}
