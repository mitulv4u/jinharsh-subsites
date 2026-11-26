// JINHARSH Catalog Hub: the menu of every catalogue, the catalogue itself, QR codes, queries and visit counting.
// Everything the hub did before still works the same way and still goes through api.php (the catalogue list, visits,
// downloads, queries, team uploads). What changed: the PDF pages are drawn here (PDF.js), so they show on every
// phone - the browser's own PDF box stayed blank on Android; the QR codes carry the Jinharsh logo; and the page is
// styled with plain CSS instead of being built in the browser, so it shows much sooner.
import { icon } from '/hub/vendor/icons.js';
import { qrSvg, qrSvgFile, qrPng, saveBlob } from '/hub/assets/qr.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ui = (fn) => { try { fn(); } catch (e) { /* cosmetic */ } };
const toast = (t) => ui(() => window.JUI.toast(t));

let CATALOGS = [];
let activeBrand = 'ALL';
let activeCat = null;
let mode = 'pages';   // how the catalogue is shown: 'pages' (drawn here), 'google' (Google's viewer), 'native', 'portal'

// ---------- who is visiting, and what they do (sent to api.php exactly as before) ----------
function getVisitor() {
  try { return JSON.parse(localStorage.getItem('jh_visitor') || '{}'); } catch { return {}; }
}
function saveVisitor(info) {
  const merged = { ...getVisitor(), ...info };
  try { localStorage.setItem('jh_visitor', JSON.stringify(merged)); } catch {}
}
function getVisitSource() {
  const p = new URLSearchParams(location.search);
  return p.get('utm_source') || p.get('src') || (p.get('cat') ? 'qr-direct' : 'direct');
}
const device = () => (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop');
function trackEvent(type, catObj) {
  const visitor = getVisitor();
  const payload = {
    type,
    catalog_id: catObj ? catObj.id : '',
    catalog_title: catObj ? catObj.title : '',
    brand: catObj ? catObj.brand : '',
    email: visitor.email || '',
    name: visitor.name || '',
    company: visitor.company || '',
    source: getVisitSource(),
    referrer: document.referrer || '',
    page_url: location.href,
    device: device(),
  };
  try {
    fetch('/hub/api.php?action=track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  } catch {}
}

// ---------- icons in the buttons ----------
ui(() => {
  $('#menuBtn').innerHTML = icon('menu');
  $('#sideClose').innerHTML = icon('x');
  $('#searchIcon').outerHTML = icon('search');
  $('#download-pdf-btn').insertAdjacentHTML('afterbegin', icon('arrow-down-to-line'));
  $$('.v-actions [data-query]').forEach((b) => b.insertAdjacentHTML('afterbegin', icon('message-square-text')));
  $('#share-btn').insertAdjacentHTML('afterbegin', icon('share-2'));
  $('#copy-link-btn').innerHTML = icon('link');
  $('#show-qr-btn').innerHTML = icon('qr-code');
  $('#zOut').innerHTML = icon('zoom-out');
  $('#zIn').innerHTML = icon('zoom-in');
  $$('.sheet-x').forEach((b) => { b.innerHTML = icon('x'); });
});

// ---------- the menu (always on the left on big screens, slides in on phones) ----------
function toggleSidebar(force) {
  const sb = $('#catalog-sidebar'), bd = $('#sidebar-backdrop');
  const open = typeof force === 'boolean' ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', open);
  bd.classList.toggle('open', open);
}
$('#menuBtn').addEventListener('click', () => toggleSidebar());
$('#sideClose').addEventListener('click', () => toggleSidebar(false));
$('#sidebar-backdrop').addEventListener('click', () => toggleSidebar(false));

function renderBrandPills() {
  const brands = ['ALL', ...new Set(CATALOGS.map((c) => c.brand))];
  $('#brand-pills').innerHTML = brands.map((b) =>
    `<button type="button" class="ju-chip${b === activeBrand ? ' on' : ''}" data-brand="${esc(b)}">${b === 'ALL' ? 'All Brands' : esc(b)}</button>`).join('');
}
$('#brand-pills').addEventListener('click', (e) => {
  const b = e.target.closest('[data-brand]');
  if (!b) return;
  activeBrand = b.dataset.brand;
  renderBrandPills();
  renderMenu();
});

function renderMenu() {
  const q = ($('#cat-search').value || '').trim().toLowerCase();
  const filtered = CATALOGS.filter((c) => {
    if (activeBrand !== 'ALL' && c.brand !== activeBrand) return false;
    if (q && !`${c.title} ${c.brand} ${c.category} ${c.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
  $('#catalog-menu').innerHTML = filtered.map((c) => {
    const on = activeCat && activeCat.id === c.id;
    return `<button type="button" class="mi${on ? ' on' : ''}" data-id="${esc(c.id)}"${on ? ' aria-current="true"' : ''}>
      <span class="t"><span class="b">${esc(c.brand)}</span>${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ''}</span>
      <span class="n">${esc(c.title)}</span><span class="c">${esc(c.category)}</span></button>`;
  }).join('') || '<p class="none">No matching catalogs.</p>';
}
$('#cat-search').addEventListener('input', renderMenu);
$('#catalog-menu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]');
  if (b) selectCatalog(b.dataset.id, true);
});

// ---------- start ----------
async function init() {
  try {
    CATALOGS = await (window.CATALOGS_REQ || fetch('/hub/api.php?action=catalogs').then((r) => r.json()));
    if (!Array.isArray(CATALOGS)) throw new Error('no list');
  } catch {
    try { CATALOGS = await fetch('/hub/catalogs.json').then((r) => r.json()); } catch { CATALOGS = []; }
  }
  if (!Array.isArray(CATALOGS)) CATALOGS = [];
  renderBrandPills();
  renderMenu();

  const params = new URLSearchParams(location.search);
  const catId = params.get('cat');
  const found = CATALOGS.find((c) => c.id === catId) || CATALOGS[0];
  if (found) selectCatalog(found.id, false);
  $('#viewer').classList.remove('waiting');
  if (params.get('qr') === '1') openQrStudio();

  trackEvent('visit', found || null);
}

const isPdfUrl = (url) => /\.pdf(\?|#|$)/i.test(url || '');
// a PDF on this website (its pages can be drawn here); PDFs on other websites keep Google's viewer
const isOwnFile = (url) => (/^\/(?!\/)/.test(url || '') || String(url || '').startsWith(location.origin + '/'));

function selectCatalog(id, pushUrl) {
  activeCat = CATALOGS.find((c) => c.id === id) || CATALOGS[0];
  if (!activeCat) return;
  closeQrStudio();
  toggleSidebar(false);

  $('#active-brand').textContent = activeCat.brand;
  $('#active-brand').hidden = !activeCat.brand;
  $('#active-category').textContent = activeCat.category;
  $('#active-badge').textContent = activeCat.pages || '';
  $('#active-badge').hidden = !activeCat.pages;
  $('#active-title').textContent = activeCat.title;
  $('#active-desc').textContent = activeCat.description;
  $('#open-raw-pdf').href = activeCat.pdfUrl;
  const dl = $('#download-pdf-btn');
  dl.lastChild.textContent = isPdfUrl(activeCat.pdfUrl) ? 'Download PDF' : 'Open Portal ↗';
  document.title = `${activeCat.title} — JINHARSH Catalog Hub`;

  mode = !isPdfUrl(activeCat.pdfUrl) ? 'portal' : isOwnFile(activeCat.pdfUrl) ? 'pages' : 'google';

  if (pushUrl) {
    const url = new URL(location.href);
    url.searchParams.set('cat', activeCat.id);
    url.searchParams.delete('qr');
    history.replaceState({}, '', url.toString());
    trackEvent('view', activeCat);
    // on a phone the menu covered the page: start the new catalogue from its top
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }

  loadViewer();
  renderMenu();
}

// ---------- showing the catalogue ----------
function showFrame(src) {
  $('#pagesBox').hidden = true;
  $('#zoomBox').hidden = true;
  const f = $('#pdf-iframe');
  f.hidden = false;
  f.src = src;
}
function showPages() {
  const f = $('#pdf-iframe');
  f.hidden = true;
  f.src = 'about:blank';
  $('#pagesBox').hidden = false;
}

function loadViewer() {
  if (!activeCat) return;
  stopReader();
  const url = activeCat.pdfUrl;
  const absUrl = url.startsWith('http') ? url : `${location.origin}${url}`;
  const label = $('#viewer-mode-label'), btn = $('#viewer-mode-btn'), raw = $('#open-raw-pdf');

  if (mode === 'portal') {
    showFrame(url);
    label.textContent = 'Interactive Application Portal';
    btn.hidden = true;
    raw.textContent = 'Open Portal ↗';
    return;
  }
  btn.hidden = false;
  raw.textContent = 'Open Fullscreen ↗';
  const own = isOwnFile(url);
  // (the words in "long" are left out on phones, to keep the bar short)
  if (mode === 'pages') {
    showPages();
    label.textContent = 'Opening…';
    btn.innerHTML = '<span class="long">Trouble viewing? </span>Try Google viewer';
    startReader(url);
  } else if (mode === 'google') {
    showFrame(`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absUrl)}`);
    label.textContent = 'Embedded Google PDF Viewer';
    btn.innerHTML = own ? 'Back to page view' : 'Switch to <span class="long">Native </span>Browser Viewer';
  } else {
    showFrame(url);
    label.textContent = 'Native Browser PDF Viewer';
    btn.innerHTML = '<span class="long">Trouble viewing? </span>Try Embedded Viewer';
  }
}
function toggleViewerMode() {
  if (!activeCat || mode === 'portal') return;
  const own = isOwnFile(activeCat.pdfUrl);
  mode = own ? (mode === 'pages' ? 'google' : 'pages') : (mode === 'google' ? 'native' : 'google');
  loadViewer();
}
$('#viewer-mode-btn').addEventListener('click', toggleViewerMode);
$('#open-raw-pdf').addEventListener('click', () => trackEvent('download', activeCat));

// ---------- the pages, drawn as they come near the screen ----------
let lib = null;
async function pdfjs() {
  if (lib) return lib;
  lib = await import('/hub/vendor/pdfjs/pdf.min.mjs');
  lib.GlobalWorkerOptions.workerSrc = '/hub/vendor/pdfjs/pdf.worker.min.mjs';
  return lib;
}
const PDF_OPTS = {
  cMapUrl: '/hub/vendor/pdfjs/cmaps/', cMapPacked: true,
  standardFontDataUrl: '/hub/vendor/pdfjs/standard_fonts/',
  wasmUrl: '/hub/vendor/pdfjs/wasm/', iccUrl: '/hub/vendor/pdfjs/iccs/',
  isEvalSupported: false,
};
// slower phones: sharp enough, half the memory per page
const lite = (() => { try { return (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4); } catch { return false; } })();
const quality = () => (lite ? Math.min(2, (window.devicePixelRatio || 1) * 1.1) : Math.min(3, (window.devicePixelRatio || 1) * 1.35));

let current = null;   // the catalogue being read: { task, doc, stop }
function stopReader() {
  if (!current) return;
  const c = current; current = null;
  try { c.stop && c.stop(); } catch {}
  try { c.task && c.task.destroy(); } catch {}
  $$('#pages canvas').forEach((cv) => { cv.width = cv.height = 0; });
  $('#pages').innerHTML = '';
}

async function startReader(url) {
  const me = {};
  current = me;
  const pagesEl = $('#pages'), label = $('#viewer-mode-label');
  pagesEl.innerHTML = '<div class="page" data-n="1" style="aspect-ratio:210/297"><span class="pno">Opening…</span></div>';
  try {
    const L = await pdfjs();
    if (current !== me) return;
    me.task = L.getDocument({ url, rangeChunkSize: 256 * 1024, disableAutoFetch: true, ...PDF_OPTS });
    const pdf = await me.task.promise;
    if (current !== me) return;
    me.doc = pdf;
    const n = pdf.numPages;
    const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
    if (current !== me) return;
    let html = '';
    for (let i = 1; i <= n; i++) html += `<div class="page" data-n="${i}" style="aspect-ratio:${first.width} / ${first.height}"><span class="pno">${i}</span></div>`;
    pagesEl.innerHTML = html;
    label.innerHTML = `Page <span id="posN">1</span> of ${n}`;
    $('#zoomBox').hidden = false;
    me.stop = drawPages(pdf, pagesEl);
  } catch (e) {
    if (current !== me) return;
    console.error(e);
    label.textContent = 'The pages could not be shown here';
    pagesEl.innerHTML = '<p class="reader-note">The pages could not be shown here. Use <b>Download PDF</b>, or <b>Try Google viewer</b> above.</p>';
  }
}

function drawPages(pdf, pagesEl) {
  const state = new Map();   // page number -> { width, task }
  const near = new Set();
  let busy = false, gone = false;

  async function draw(el) {
    const num = Number(el.dataset.n), w = el.clientWidth;
    const st = state.get(num);
    if (st && Math.abs(st.width - w) < 2) return;
    const page = await pdf.getPage(num);
    if (gone) return;
    const base = page.getViewport({ scale: 1 });
    el.style.aspectRatio = `${base.width} / ${base.height}`;
    const vp = page.getViewport({ scale: (el.clientWidth * quality()) / base.width });
    const cv = document.createElement('canvas');
    cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
    const g = cv.getContext('2d', { alpha: false });
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    const task = page.render({ canvasContext: g, canvas: cv, viewport: vp, background: '#ffffff' });
    state.set(num, { width: w, task });
    try { await task.promise; } catch { state.delete(num); return; }
    if (gone || !near.has(num)) { cv.width = cv.height = 0; state.delete(num); return; }
    const old = el.querySelector('canvas'); if (old) { old.width = old.height = 0; old.remove(); }
    el.insertBefore(cv, el.querySelector('.pno'));
    state.set(num, { width: w, task: null });
    page.cleanup();
  }

  async function pump() {
    if (busy || gone) return;
    busy = true;
    try {
      // the pages nearest the middle of the screen first
      const mid = innerHeight / 2;
      const order = [...near].map((num) => pagesEl.children[num - 1]).filter(Boolean)
        .map((el) => ({ el, d: Math.abs(el.getBoundingClientRect().top + el.clientHeight / 2 - mid) })).sort((a, b) => a.d - b.d);
      for (const { el } of order) {
        if (gone) return;
        if (near.has(Number(el.dataset.n))) await draw(el);
      }
    } finally { busy = false; }
    const todo = [...near].some((num) => { const s = state.get(num); const el = pagesEl.children[num - 1]; return el && (!s || Math.abs(s.width - el.clientWidth) >= 2); });
    if (todo && !gone) setTimeout(pump, 0);
  }

  function release(num) {
    const s = state.get(num), el = pagesEl.children[num - 1];
    if (s && s.task) { try { s.task.cancel(); } catch {} }
    const cv = el && el.querySelector('canvas'); if (cv) { cv.width = cv.height = 0; cv.remove(); }
    state.delete(num);
  }

  // pages within about two screens are drawn; pages far away let go of their memory
  const nearObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const num = Number(e.target.dataset.n);
      if (e.isIntersecting) near.add(num); else { near.delete(num); release(num); }
    }
    pump();
  }, { rootMargin: lite ? '110% 0px 110% 0px' : '200% 0px 200% 0px' });
  // which page is in the middle of the screen
  const posObs = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) ui(() => { $('#posN').textContent = e.target.dataset.n; });
  }, { rootMargin: '-45% 0px -45% 0px' });
  for (const el of pagesEl.children) { nearObs.observe(el); posObs.observe(el); }

  // zoom: wider pages (sideways scroll), drawn again sharp
  const steps = [1, 1.25, 1.5, 2, 2.5];
  let z = 0;
  const setZoom = (k) => {
    z = Math.max(0, Math.min(steps.length - 1, k));
    pagesEl.style.setProperty('--zoom', steps[z]);
    $('#zOut').disabled = z === 0; $('#zIn').disabled = z === steps.length - 1;
    $('#zVal').textContent = Math.round(steps[z] * 100) + '%';
    clearTimeout(setZoom.t); setZoom.t = setTimeout(pump, 120);
  };
  const zin = () => setZoom(z + 1), zout = () => setZoom(z - 1);
  $('#zIn').addEventListener('click', zin);
  $('#zOut').addEventListener('click', zout);
  setZoom(0);
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(pump, 200); };
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    gone = true;
    nearObs.disconnect(); posObs.disconnect();
    window.removeEventListener('resize', onResize);
    $('#zIn').removeEventListener('click', zin);
    $('#zOut').removeEventListener('click', zout);
    for (const num of [...state.keys()]) release(num);
    near.clear();
    try { pdf.destroy(); } catch {}
  };
}

// ---------- windows ----------
function openWin(id) { const w = $('#' + id); w.hidden = false; return w; }
function closeWin(w) { if (w) w.hidden = true; }
$$('.ju-overlay').forEach((w) => {
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-close]')) closeWin(w); });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = $$('.ju-overlay').filter((w) => !w.hidden);
  if (open.length) open.forEach(closeWin); else toggleSidebar(false);
});

// ---------- download (the optional email first, once per device) ----------
function handleDownloadClick() {
  if (!activeCat) return;
  if (!isPdfUrl(activeCat.pdfUrl) || getVisitor().email) { triggerActualDownload(); return; }
  $('#dl-modal-title').textContent = activeCat.title;
  openWin('download-email-modal');
}
function triggerActualDownload() {
  closeWin($('#download-email-modal'));
  if (!activeCat) return;
  trackEvent('download', activeCat);
  const a = document.createElement('a');
  a.href = activeCat.pdfUrl;
  a.download = `${activeCat.id}.pdf`;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
$('#download-pdf-btn').addEventListener('click', handleDownloadClick);
$('#dl-skip').addEventListener('click', triggerActualDownload);
$('#dl-email-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#dl-name').value.trim(), email = $('#dl-email').value.trim();
  if (email || name) saveVisitor({ name, email });
  triggerActualDownload();
});

// ---------- query / RFQ ----------
function openQueryModal() {
  const v = getVisitor();
  if (v.name) $('#q-name').value = v.name;
  if (v.email) $('#q-email').value = v.email;
  if (v.company) $('#q-company').value = v.company;
  if (v.phone) $('#q-phone').value = v.phone;
  $('#query-cat-label').textContent = activeCat ? `Catalog: ${activeCat.title} (${activeCat.brand})` : 'General JinHarsh Catalog Inquiry';
  $('#q-status').hidden = true;
  openWin('query-modal');
  setTimeout(() => ui(() => $(v.name ? '#q-message' : '#q-name').focus()), 60);
}
const closeQueryModal = () => closeWin($('#query-modal'));
document.addEventListener('click', (e) => { if (e.target.closest('[data-query]')) openQueryModal(); });

$('#query-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#q-submit-btn'), status = $('#q-status');
  const name = $('#q-name').value.trim(), company = $('#q-company').value.trim(), email = $('#q-email').value.trim();
  const phone = $('#q-phone').value.trim(), message = $('#q-message').value.trim();
  saveVisitor({ name, company, email, phone });
  btn.disabled = true;
  status.hidden = false; status.className = 'status'; status.textContent = 'Sending your query...';
  try {
    const res = await fetch('/hub/api.php?action=inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, company, email, phone, message,
        catalog_id: activeCat ? activeCat.id : '',
        catalog_title: activeCat ? activeCat.title : '',
        brand: activeCat ? activeCat.brand : '',
        source: getVisitSource(),
        device: device(),
      }),
    });
    if (res.ok) {
      status.className = 'status ok'; status.textContent = 'Thank you! Your query has been sent to our JinHarsh team.';
      $('#q-message').value = '';
      setTimeout(closeQueryModal, 1800);
    } else {
      status.className = 'status bad'; status.textContent = 'Could not submit right now. Please WhatsApp +91-22-40900000.';
    }
  } catch {
    status.className = 'status bad'; status.textContent = 'Network error. Please WhatsApp +91-22-40900000.';
  } finally {
    btn.disabled = false;
  }
});

// ---------- links, copying, sharing ----------
// the permanent link of a catalogue (printed QR codes use it, so it never changes)
const getDirectUrl = (id) => (id ? `${location.origin}/?cat=${encodeURIComponent(id)}` : `${location.origin}/`);

async function copyText(text) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch {}
  // older phones and plain http: the old way
  try {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch { return false; }
}
async function copyLink(id, btn) {
  const ok = await copyText(getDirectUrl(id));
  toast(ok ? 'Link copied' : 'Could not copy. Please copy it from the address bar.');
  if (ok && btn) { const was = btn.innerHTML; btn.innerHTML = icon('check'); setTimeout(() => { btn.innerHTML = was; }, 1500); }
}
$('#copy-link-btn').addEventListener('click', (e) => activeCat && copyLink(activeCat.id, e.currentTarget));

function openShare() {
  if (!activeCat) return;
  const url = getDirectUrl(activeCat.id), title = activeCat.title;
  $('#share-title').textContent = title;
  $('#share-url').textContent = url.replace(/^https?:\/\//, '');
  const text = `${title} — JinHarsh catalogue: ${url}`;
  const row = (k, ic, label, extra = '') => `<${k.href ? `a href="${esc(k.href)}" target="_blank" rel="noopener"` : `button type="button" data-k="${k.id}"`}${extra}><span class="ic">${icon(ic)}</span>${label}</${k.href ? 'a' : 'button'}>`;
  $('#share-list').innerHTML = [
    row({ href: `https://wa.me/?text=${encodeURIComponent(text)}` }, 'message-circle', 'WhatsApp'),
    row({ href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}` }, 'mail', 'Email'),
    row({ id: 'copy' }, 'copy', 'Copy link'),
    row({ id: 'qr' }, 'qr-code', 'QR code'),
    navigator.share ? row({ id: 'more' }, 'share-2', 'More…') : '',
  ].join('');
  openWin('share-modal');
}
$('#share-btn').addEventListener('click', openShare);
$('#share-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b || !activeCat) return;
  const k = b.dataset.k;
  if (k === 'copy') copyLink(activeCat.id);
  if (k === 'qr') { closeWin($('#share-modal')); showSingleQr(); }
  if (k === 'more') navigator.share({ title: activeCat.title, url: getDirectUrl(activeCat.id) }).catch(() => {});
});

// ---------- QR codes (with the Jinharsh logo) ----------
let qrFor = null;
function showSingleQr() {
  if (!activeCat) return;
  const url = getDirectUrl(activeCat.id);
  qrFor = { id: activeCat.id, url };
  $('#modal-qr-title').textContent = activeCat.title;
  $('#modal-qr-url').textContent = url;
  $('#modal-qr-box').innerHTML = qrSvg(url, { logo: true, title: activeCat.title });
  openWin('single-qr-modal');
}
$('#show-qr-btn').addEventListener('click', showSingleQr);
$('#qr-png-btn').addEventListener('click', async () => { if (qrFor) saveBlob(await qrPng(qrFor.url, true, 2000), `qr-${qrFor.id}.png`); });
$('#qr-svg-btn').addEventListener('click', async () => { if (qrFor) saveBlob(new Blob([await qrSvgFile(qrFor.url, true)], { type: 'image/svg+xml' }), `qr-${qrFor.id}.svg`); });
$('#qr-copy-btn').addEventListener('click', (e) => { if (qrFor) copyLink(qrFor.id === 'main-hub' ? '' : qrFor.id, e.currentTarget); });

// QR Studio: every catalogue's code, and the main hub's
let studioEntries = [];
function openQrStudio() {
  $('#viewer').hidden = true;
  $('#qr-studio-panel').hidden = false;
  studioEntries = [
    { id: 'main-hub', title: 'Main Exhibition Catalog Hub (All Brands)', brand: 'JINHARSH HQ', url: `${location.origin}/` },
    ...CATALOGS.map((c) => ({ id: c.id, title: c.title, brand: c.brand, url: getDirectUrl(c.id) })),
  ];
  $('#qr-grid').innerHTML = studioEntries.map((e, i) => `
    <div class="qr-card">
      <div class="b">${esc(e.brand)}</div>
      <div class="t">${esc(e.title)}</div>
      <div class="q">${qrSvg(e.url, { logo: true, title: e.title })}</div>
      <div class="u">${esc(e.url)}</div>
      <div class="acts"><button class="ju-btn accent" type="button" data-png="${i}">PNG</button><button class="ju-btn" type="button" data-svg="${i}">SVG</button></div>
    </div>`).join('');
  window.scrollTo(0, 0);
}
function closeQrStudio() {
  $('#qr-studio-panel').hidden = true;
  $('#viewer').hidden = false;
}
$('#qr-studio-btn').addEventListener('click', openQrStudio);
$('#qr-close-btn').addEventListener('click', closeQrStudio);
$('#qr-grid').addEventListener('click', async (e) => {
  const p = e.target.closest('[data-png]'), s = e.target.closest('[data-svg]');
  if (p) { const x = studioEntries[+p.dataset.png]; saveBlob(await qrPng(x.url, true, 2000), `qr-${x.id}.png`); }
  if (s) { const x = studioEntries[+s.dataset.svg]; saveBlob(new Blob([await qrSvgFile(x.url, true)], { type: 'image/svg+xml' }), `qr-${x.id}.svg`); }
});
$('#qr-all-btn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  toast('Making the ZIP…');
  try {
    const { makeZip } = await import('/hub/assets/zip.js');
    const files = [];
    for (const x of studioEntries) {
      files.push({ name: `PNG/qr-${x.id}.png`, data: new Uint8Array(await (await qrPng(x.url, true, 2000)).arrayBuffer()) });
      files.push({ name: `SVG/qr-${x.id}.svg`, data: await qrSvgFile(x.url, true) });
    }
    saveBlob(makeZip(files), 'jinharsh-catalog-qr-codes.zip');
  } catch (err) {
    console.error(err);
    toast('Could not make the ZIP. Please download them one by one.');
  } finally { btn.disabled = false; }
});

init();
