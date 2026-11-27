// A catalogue's own page: what a scanned QR code opens. The server puts the catalogue's details into the page
// itself (id="boot"), so the cover and title show at once; the PDF pages are then drawn as they come near the screen.
import { icon } from '/hub/vendor/icons.js?v=3';
import { pdfjs, PDF_OPTS, fmtSize } from './pdfkit.js';
import * as M from './motion.js';
import { esc, ui, contactHtml, shareSheet, qrSheet, blankCover, idle, warmModule, wireNav } from './site.js';
import { bindImage, swallow, formPage, perf } from './particles.js';
import { track, needsDetails, beforeDownload } from './visitor.js';
import { mediaHtml as renderMedia, wireMedia } from './media.js';
import { catPath } from './backend.js';
import { watchLive } from './live.js';
import { configure } from './lookup.js';
import { startHelper } from './assistant.js';
import { watchGoodbye } from './goodbye.js';
import { querySheet } from './visitor.js';

const $ = (s, el = document) => el.querySelector(s);

let BOOT = {};
try { BOOT = JSON.parse($('#boot').textContent); } catch {}
const SITE = BOOT.site || {};
const D = BOOT.doc;
const app = $('#app');
const preview = new URLSearchParams(location.search).has('preview');
// ?page=37 (from a search result or a Quick look page): the reader opens straight at that page
const START = Math.max(0, parseInt(new URLSearchParams(location.search).get('page') || '', 10) || 0);
const PUBLIC = (BOOT.publicUrl || location.origin).replace(/\/$/, '');
const linkOf = (code) => `${PUBLIC}${catPath(code)}`;
// product videos, installation videos, trials & recommendations (added by the team under Edit details)
const mediaHtml = () => renderMedia(D && D.media, D && D.code);
wireMedia();

ui(() => { $('#brand b').textContent = SITE.company?.short || 'Jinharsh'; $('#brand small').textContent = 'Catalogues'; });
ui(() => wireNav(SITE, D ? { code: D.code, title: D.title } : {}));   // a site's extra top-bar buttons, if it has any
// the menu of every catalogue, from the top bar
ui(() => {
  const b = $('#menuTop');
  if (!(BOOT.menu || []).length) { b.hidden = true; return; }
  b.innerHTML = icon('menu');
  // the menu's code is fetched only when it is first needed (or quietly once the page has settled)
  b.addEventListener('click', () => import('./catmenu.js').then((m) => m.openMenu({ list: BOOT.menu, current: D ? D.code : '', from: b })).catch(() => {}));
  idle(() => warmModule('/hub/js/catmenu.js'), 2000);
});

// the other catalogues, under every page (like the menu of the old catalogue hub)
function othersHtml() {
  const list = (BOOT.others || []).slice(0, 8);
  if (!list.length) return '';
  return `<section class="more-cats">
    <div class="mc-head"><h2>More catalogues</h2><a class="ju-btn sm ghost" href="/">${icon('book-open')}See all</a></div>
    <div class="mc-grid">${list.map((o) => `<a class="mc-card" href="${esc(catPath(o.code))}">
      <div class="mc-cover">${o.cover ? `<img src="${esc(o.thumb || o.cover)}" alt="" width="${o.coverW || 720}" height="${o.coverH || 1018}" loading="lazy" decoding="async" style="view-transition-name:cover-${esc(o.code)}">` : blankCover(o)}</div>
      <div class="mc-text">${o.brand ? `<span class="mc-brand">${esc(o.brand)}</span>` : ''}<b>${esc(o.title)}</b></div>
    </a>`).join('')}</div>
  </section>`;
}

function wireCommon(title, link) {
  const extra = { site: SITE, printable: BOOT.printable !== false, code: D ? D.code : '' };
  ui(() => { const s = $('#shareTop'); s.hidden = false; s.innerHTML = icon('share-2'); s.addEventListener('click', (e) => shareSheet({ link, title, from: e.currentTarget, ...extra })); });
  ui(() => $('#shareBtn').addEventListener('click', (e) => { M.bump(e.currentTarget.querySelector('.i'), 1.25); shareSheet({ link, title, from: e.currentTarget, ...extra }); }));
  ui(() => $('#qrBtn').addEventListener('click', () => qrSheet({ link, title })));
}

// ---------- not available ----------
if (!D || (BOOT.status !== 'live' && BOOT.status !== 'waiting')) {
  const t = {
    archived: ['This catalogue is no longer available', 'It may have been replaced by a newer one. Contact us and we will send you the latest.'],
    retired: ['This catalogue is no longer available', 'It may have been replaced by a newer one. Contact us and we will send you the latest.'],
    missing: ['Nothing is linked to this code', 'Please check the link, or have a look at all our catalogues.'],
  }[BOOT.status] || ['Something went wrong', 'Please try again in a moment.'];
  app.innerHTML = `<div class="ju-enter"><section class="ju-card gone"><div class="art">${icon('circle-alert')}</div><h1>${t[0]}</h1><p>${t[1]}</p>
    <p style="margin-top:18px"><a class="ju-btn primary" href="/">${icon('book-open')}See all catalogues</a></p></section>${othersHtml()}${contactHtml(SITE, BOOT.doc?.title, BOOT.doc?.code)}</div>`;
} else if (BOOT.status === 'waiting') {
  showWaiting();
} else {
  showDoc();
}

// ---------- a catalogue whose PDF is not uploaded yet ----------
function showWaiting() {
  let host = '';
  try { host = D.sourceUrl ? new URL(D.sourceUrl).hostname.replace(/^www\./, '') : ''; } catch {}
  // a link to an interactive guide (a website, not a PDF), like the colour-coating line or the borewell rig guides
  const portal = D.sourceUrl && !/\.pdf(\?|#|$)/i.test(D.sourceUrl);
  app.innerHTML = `
    <section class="v-hero">
      <div class="v-cover">${blankCover(D, 'big')}</div>
      <div class="v-text">
        <div class="ju-eyebrow">${D.brand ? `<span class="brand-pill">${esc(D.brand)}</span>` : ''}${D.category ? esc(D.category) : 'Catalogue'}</div>
        <h1>${esc(D.title)}</h1>
        <p class="sub">${D.note ? esc(D.note) : ''}</p>
        <div class="v-actions">
          ${D.sourceUrl ? `<a class="ju-btn accent" href="${esc(D.sourceUrl)}" target="_blank" rel="noopener" id="srcBtn">${icon('external-link')}${portal ? 'Open the interactive guide' : `Open the PDF (${esc(host)})`}</a>` : `<button class="ju-btn accent" type="button" data-ask data-code="${esc(D.code)}" data-title="${esc(D.title)}" data-message="Please send me a copy of this catalogue.">${icon('message-square-text')}Ask us for a copy</button>`}
          <button class="ju-btn" type="button" id="shareBtn">${icon('share-2')}Share</button>
          <button class="ju-btn" type="button" id="qrBtn">${icon('qr-code')}QR code</button>
        </div>
      </div>
    </section>
    ${mediaHtml()}
    ${othersHtml()}
    ${contactHtml(SITE, D.title, D.code)}`;
  wireCommon(D.title, linkOf(D.code));
  ui(() => $('#srcBtn').addEventListener('click', () => track(portal ? 'read' : 'download', D.code)));
  countVisit();
}

// ---------- the catalogue ----------
// "26 November 2026", written out by hand: asking the phone for an Indian-style date loads its whole language
// tables the first time (about a tenth of a second, longer on a slow phone), right while the page is opening
function longDate(iso) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date(iso);
  return isNaN(d) ? '' : `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function showDoc() {
  const updated = longDate(D.updatedAt);
  const ratio = D.coverW && D.coverH ? D.coverW / D.coverH : 210 / 297;
  const cover = D.cover
    ? `<img src="${esc(D.cover)}" alt="Cover of ${esc(D.title)}" width="${D.coverW || 720}" height="${D.coverH || 1018}" fetchpriority="high" style="view-transition-name:cover-${esc(D.code)}">`
    : blankCover(D, 'big');
  const dl = D.download || D.file + '?dl=1';
  const arrived = app.querySelector('.v-cover img'); // the cover the page came with (already on screen)
  app.innerHTML = `
    <section class="v-hero">
      <div class="v-cover">${cover}</div>
      <div class="v-text">
        <div class="ju-eyebrow">${D.brand ? `<span class="brand-pill">${esc(D.brand)}</span>` : ''}PDF${D.pages ? ' · ' + D.pages + (D.pages === 1 ? ' page' : ' pages') : ''} · ${fmtSize(D.size)}</div>
        <h1>${esc(D.title)}</h1>
        <p class="sub">${[D.note ? esc(D.note) : '', updated ? 'Updated ' + updated : ''].filter(Boolean).join(' · ')}</p>
        <div class="v-actions">
          <button class="ju-btn accent" type="button" id="readBtn">${icon('book-open')}Read now</button>
          <a class="ju-btn primary" href="${esc(dl)}" download="${esc(D.name)}" id="dlBtn">${icon('arrow-down-to-line')}Download</a>
          <button class="ju-btn" type="button" id="shareBtn">${icon('share-2')}Share</button>
          <button class="ju-btn icon-only" type="button" id="qrBtn" aria-label="QR code" title="QR code">${icon('qr-code')}</button>
        </div>
        <button class="ask-link" type="button" data-ask data-code="${esc(D.code)}" data-title="${esc(D.title)}">${icon('message-square-text')}Ask about price, stock or delivery${icon('chevron-right')}</button>
      </div>
    </section>
    ${mediaHtml()}
    ${othersHtml()}
    ${contactHtml(SITE, D.title, D.code)}`;

  // keep that same picture rather than a new copy of it: no second decode, no flicker
  const fresh = $('.v-cover img');
  if (arrived && fresh && arrived.getAttribute('src') === fresh.getAttribute('src')) fresh.replaceWith(arrived);

  // "Read now" (or the cover) opens the reader over the page
  const read = () => openReader();
  $('#readBtn').addEventListener('click', read);
  // get the PDF reader ready before it is needed: when a finger or the mouse comes near Read now, or (on a
  // fast phone, without data saver) once the page has settled. It is 474 KB, so it never delays the page itself.
  const warm = () => { pdfjs().catch(() => {}); };
  for (const t of ['pointerenter', 'pointerdown', 'focus']) $('#readBtn').addEventListener(t, warm, { once: true, passive: true });
  // (when idle it is only downloaded, not run, so it costs the phone nothing until Read now)
  if (!perf.lite && !(navigator.connection && navigator.connection.saveData)) idle(() => warmModule('/hub/vendor/pdfjs/pdf.min.js'), 3500);
  ui(() => $('.v-cover img').addEventListener('click', read));
  document.querySelectorAll('a[download]').forEach((a) => a.addEventListener('click', () => M.nudgeDown(a.querySelector('.i'))));
  wireDownload($('#dlBtn'));
  // start fetching the reader in the background, so it opens fast
  wireCommon(D.title, linkOf(D.code));

  countVisit();
  // the helper in the corner (it knows which catalogue this is), and a warm goodbye when someone is leaving
  configure({ catalogs: (BOOT.menu || []).map((m) => ({ ...m, thumb: m.thumb })), search: BOOT.search || '' });
  ui(() => startHelper({ site: SITE, current: { code: D.code, title: D.title } }));
  ui(() => watchGoodbye({ onQuery: () => querySheet({ code: D.code, title: D.title }) }));
  if (START > 1) setTimeout(() => openReader(START), 700);   // (after the page has finished arriving)
  ui(() => watchLive(D.code));   // (where this visitor is; only the team sees it, in the Team Portal)
}

// one visit per catalogue per visit to the site (the team's own "Open page" adds ?preview=1 and is not counted)
function countVisit() {
  if (preview) return;
  ui(() => {
    const k = 'seen_' + D.code;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
    track('visit', D.code);
  });
}

// A download link: the first download on this device may ask who is downloading (always skippable), then the file
// comes; every download is counted.
function wireDownload(a) {
  if (!a) return;
  a.addEventListener('click', (e) => {
    if (!needsDetails()) { track('download', D.code); return; }
    e.preventDefault();
    beforeDownload({ from: a, onTop: !!a.closest('.reader-ov') }, () => {
      track('download', D.code);
      const t = document.createElement('a');
      t.href = a.href; t.download = a.getAttribute('download') || ''; t.hidden = true;
      document.body.appendChild(t); t.click(); t.remove();
    });
  });
}

// a small, light picture of a page (tools/php-hub/make-extras.mjs): shown at once, until the sharp page is drawn on top
const previewImg = (i) => (D && D.previews ? `<img class="pv" data-src="${esc(D.previews)}${i}.webp" alt="" decoding="async">` : '');   // (src set when it is near)

// ---------- the reader: a full-screen window over the page ----------
// The cover breaks into coloured grains that bind together as page 1, then the real pages are drawn as you scroll.
// Closes with the X, the Esc key or the phone's Back button.
let pdfDoc = null;            // the PDF stays loaded after the first open, so opening again is instant
let reader = null;
function openReader(startAt = 1) {
  if (reader) return;
  const ratio = D.coverW && D.coverH ? D.coverW / D.coverH : 210 / 297;
  const dl = D.download || D.file + '?dl=1';
  const ov = document.createElement('div');
  ov.className = 'reader-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', D.title);
  ov.innerHTML = `
    <div class="rbar ju-glass">
      <span class="pos" id="pos">${D.pages ? `Page <span class="rollbox"><span class="n" id="posN">1</span></span> of ${D.pages}` : 'Opening…'}</span>
      <span class="sep"></span>
      <button class="ju-icon" type="button" id="zOut" aria-label="Smaller">${icon('zoom-out')}</button>
      <span class="zoom-val rollbox"><span class="n" id="zVal">100%</span></span>
      <button class="ju-icon" type="button" id="zIn" aria-label="Bigger">${icon('zoom-in')}</button>
      <span class="sep"></span>
      <a class="ju-icon" href="${esc(dl)}" download="${esc(D.name)}" aria-label="Download">${icon('download')}</a>
      <button class="ju-icon" type="button" id="rClose" aria-label="Close">${icon('x')}</button>
    </div>
    <div class="reader-scroll" id="rScroll"><div class="pages-scroll"><div class="pages" id="pages"></div></div></div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  // page placeholders straight away (page 1 shows the cover until it is drawn)
  const pagesEl = $('#pages', ov);
  const n0 = D.pages || 1;
  let html = '';
  for (let i = 1; i <= n0; i++) {
    html += `<div class="page" data-n="${i}" style="aspect-ratio:${ratio}">${i === 1 && D.cover ? `<img class="ph" src="${esc(D.cover)}" alt="">` : previewImg(i)}<span class="pno">${i}</span></div>`;
  }
  pagesEl.innerHTML = html;

  // the phone's Back button closes the reader instead of leaving the page
  try { history.pushState({ reader: 1 }, '', location.href); } catch {}
  const onPop = () => close(true);
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  window.addEventListener('popstate', onPop);
  document.addEventListener('keydown', onKey);
  $('#rClose', ov).addEventListener('click', (e) => { const b = e.currentTarget.getBoundingClientRect(); close(false, { x: b.left + b.width / 2, y: b.top + b.height / 2 }); });
  ov.querySelector('a[download]').addEventListener('click', (e) => M.nudgeDown(e.currentTarget.querySelector('.i')));
  wireDownload(ov.querySelector('a[download]'));
  track('read', D.code);

  let stopReader = () => {};
  function close(fromBack, at = null) {
    if (!reader) return;
    reader = null;
    window.removeEventListener('popstate', onPop);
    document.removeEventListener('keydown', onKey);
    if (!fromBack) { try { history.back(); } catch {} }
    // the page you were reading floats away as soft grains from where X was pressed (or the middle),
    // grains in its own colours, and the bar with it
    const mid = innerHeight / 2;
    const pageNow = [...ov.querySelectorAll('.page')].find((p) => { const b = p.getBoundingClientRect(); return b.top <= mid && b.bottom >= mid; }) || ov.querySelector('.page');
    const hole = at || { x: innerWidth / 2, y: innerHeight / 2 };
    if (pageNow) swallow(pageNow, { sample: pageNow.querySelector('canvas') || pageNow.querySelector('img'), cols: 56, at: hole });
    swallow(ov.querySelector('.rbar'), { cols: 24, at: hole });
    stopReader();
    M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 560, easing: 'ease-in' }).then(() => {
      ov.querySelectorAll('canvas').forEach((c) => { c.width = c.height = 0; });
      ov.remove();
      document.body.style.overflow = '';
    });
  }
  reader = { close };

  // a PDF on another website (no permission to read it from here): the reader shows it in that viewer instead
  if (D.frame) {
    $('#rScroll', ov).innerHTML = `<iframe class="reader-frame" src="${esc(D.frame)}" title="${esc(D.title)}"></iframe>`;
    $('#pos', ov).textContent = D.frameLabel || 'Viewer';
    ov.querySelectorAll('#zOut, #zIn, .zoom-val, .rbar .sep').forEach((el) => { el.hidden = true; });
    M.play($('.rbar', ov), [{ transform: 'translateY(-24px)' }, { transform: 'none' }], { duration: M.SPRING.gentle.duration, easing: M.SPRING.gentle.easing });
    return;
  }

  // the cover dissolves into grains that bind together as page 1 (or, opened at another page, it goes straight there)
  const from = $('.v-cover img') || $('.v-cover .blank-cover');
  const first = pagesEl.firstElementChild;
  M.play($('.rbar', ov), [{ transform: 'translateY(-24px)' }, { transform: 'none' }], { duration: M.SPRING.gentle.duration, easing: M.SPRING.gentle.easing });
  const target = startAt > 1 && pagesEl.children[startAt - 1];
  if (target) requestAnimationFrame(() => { target.scrollIntoView({ block: 'start' }); M.roll($('#posN', ov), startAt); });
  else bindImage(from, first).then(() => M.bump(first, 1.015));

  startReader(pagesEl, $('#rScroll', ov), ov).then((stop) => { stopReader = stop || stopReader; }).catch((e) => {
    console.error(e);
    const pos = $('#pos', ov); if (pos) pos.textContent = 'Could not open the pages';
    pagesEl.insertAdjacentHTML('beforebegin', `<p class="reader-note">The pages could not be shown here. Use <b>Download</b> to open the PDF.</p>`);
  });
}

// ---------- drawing pages near the screen ----------
async function startReader(pagesEl, scroller, box) {
  const $$ = (q) => box.querySelector(q);
  const L = await pdfjs();
  // only the pieces of the PDF the pages on screen need (disableStream: no download of the whole file in the
  // background, which for a big catalogue crowded out the pieces for page 1 and used a phone's data)
  if (!pdfDoc) pdfDoc = await L.getDocument({ url: D.file, rangeChunkSize: 512 * 1024, disableAutoFetch: true, disableStream: true, ...PDF_OPTS }).promise;
  const pdf = pdfDoc;
  if (!box.isConnected) return () => {};
  const n = pdf.numPages;
  // the server's page count can be missing for very old uploads: fix the placeholders
  const have = pagesEl.children.length;
  if (have !== n) {
    const ratio = pagesEl.firstElementChild?.style.aspectRatio || String(210 / 297);
    let extra = '';
    for (let i = have + 1; i <= n; i++) extra += `<div class="page" data-n="${i}" style="aspect-ratio:${ratio}">${previewImg(i)}<span class="pno">${i}</span></div>`;
    pagesEl.insertAdjacentHTML('beforeend', extra);
    while (pagesEl.children.length > n) pagesEl.lastElementChild.remove();
  }
  $$('#pos').innerHTML = `Page <span class="rollbox"><span class="n" id="posN">1</span></span> of ${n}`;

  const state = new Map(); // page number -> { canvas, width, task }
  const near = new Set();
  // each page forms out of its own grains the first time it comes into view (page 1 comes from the cover instead);
  // a page drawn ahead of time stays hidden until then, so it never shows before its grains arrive
  const formed = new Set([1]), seen = new Set();
  const form = (el) => {
    const num = Number(el.dataset.n), cv = el.querySelector('canvas');
    if (!cv || formed.has(num)) return;
    if (el.querySelector('img.pv')) { formed.add(num); M.play(cv, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); return; }
    if (!seen.has(num)) { cv.style.visibility = 'hidden'; el.classList.add('forming'); return; }
    formed.add(num);
    formPage(el, cv);
  };
  let busy = false;
  // sharper than the screen for crisp text; on slower phones just sharp enough (half the memory per page)
  const quality = () => (perf.lite ? Math.min(2, (window.devicePixelRatio || 1) * 1.1) : Math.min(3, (window.devicePixelRatio || 1) * 1.35));

  async function draw(el) {
    const num = Number(el.dataset.n);
    const w = el.clientWidth;
    const st = state.get(num);
    if (st && Math.abs(st.width - w) < 2) return;
    const page = await pdf.getPage(num);
    const base = page.getViewport({ scale: 1 });
    el.style.aspectRatio = `${base.width} / ${base.height}`;
    const vp = page.getViewport({ scale: (el.clientWidth * quality()) / base.width });
    const cv = document.createElement('canvas');
    cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
    const g = cv.getContext('2d', { alpha: false });
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    const task = page.render({ canvasContext: g, canvas: cv, viewport: vp, background: '#ffffff' });
    state.set(num, { canvas: null, width: w, task });
    try { await task.promise; } catch { state.delete(num); return; }
    if (!near.has(num)) { cv.width = cv.height = 0; state.delete(num); return; }
    const old = el.querySelector('canvas'); if (old) { old.width = old.height = 0; old.remove(); }
    el.insertBefore(cv, el.querySelector('.pno'));
    form(el);
    const ph = el.querySelector('img.ph'); if (ph) ph.remove();
    state.set(num, { canvas: cv, width: w, task: null });
    page.cleanup();
  }

  async function pump() {
    if (busy) return;
    if (flinging()) { clearTimeout(pump.wait); pump.wait = setTimeout(pump, 140); return; }
    // the small pictures of the pages around here come first (they are tiny, so they show almost at once)
    for (const num of near) { const pv = pagesEl.children[num - 1]?.querySelector('img.pv'); if (pv && !pv.getAttribute('src')) pv.src = pv.dataset.src; }
    busy = true;
    try {
      // nearest pages to the middle of the screen first
      const mid = scroller.clientHeight / 2 + scroller.getBoundingClientRect().top;
      const order = [...near].map((num) => pagesEl.children[num - 1]).filter(Boolean)
        .map((el) => ({ el, d: Math.abs(el.getBoundingClientRect().top + el.clientHeight / 2 - mid) })).sort((a, b) => a.d - b.d);
      for (const { el } of order) {
        if (!near.has(Number(el.dataset.n))) continue;
        await draw(el);
      }
    } finally { busy = false; }
    // something new came near while we were drawing
    const todo = [...near].some((num) => { const s = state.get(num); return !s || Math.abs(s.width - pagesEl.children[num - 1].clientWidth) >= 2; });
    if (todo) setTimeout(pump, 0);
  }

  // how fast the pages are moving: over about 1.5 screens a second counts as a fling
  let lastTop = 0, lastT = 0, speed = 0;
  scroller.addEventListener('scroll', () => {
    const now = performance.now(), dt = Math.max(1, now - lastT);
    speed = Math.abs(scroller.scrollTop - lastTop) / dt;
    lastTop = scroller.scrollTop; lastT = now;
  }, { passive: true });
  const flinging = () => performance.now() - lastT < 120 && speed > (scroller.clientHeight * 1.5) / 1000;

  // tap "Page 12 of 372" to go straight to any page (or to the first or the last)
  const posEl = $$('#pos');
  posEl.setAttribute('role', 'button'); posEl.tabIndex = 0; posEl.title = 'Go to a page';
  const goTo = (v) => { v = Math.max(1, Math.min(n, v)); pagesEl.children[v - 1].scrollIntoView({ block: 'start' }); };
  const ask = () => {
    if (posEl.querySelector('input')) return;
    const cur = Number(($$('#posN') || {}).textContent) || 1;
    posEl.innerHTML = `<button type="button" class="go-end" data-go="1" title="First page">1</button><input type="number" min="1" max="${n}" value="${cur}" inputmode="numeric" aria-label="Go to page"><button type="button" class="go-end" data-go="${n}" title="Last page">${n}</button>`;
    const inp = posEl.querySelector('input');
    let done = false;
    const finish = (v) => {
      if (done) return; done = true;
      posEl.innerHTML = `Page <span class="rollbox"><span class="n" id="posN">${cur}</span></span> of ${n}`;
      if (v) { goTo(v); M.roll($$('#posN'), v); }
    };
    inp.focus(); inp.select();
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(parseInt(inp.value, 10) || cur); if (e.key === 'Escape') { e.stopPropagation(); finish(0); } });
    inp.addEventListener('blur', () => setTimeout(() => { const v = parseInt(inp.value, 10); finish(v && v !== cur ? v : 0); }, 150));
    posEl.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); finish(Number(b.dataset.go)); }));
  };
  posEl.addEventListener('click', (e) => { if (!e.target.closest('input, [data-go]')) ask(); });
  posEl.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('input')) { e.preventDefault(); ask(); } });

  function release(num) {
    const s = state.get(num); const el = pagesEl.children[num - 1];
    const pv = el?.querySelector('img.pv'); if (pv && !pv.complete) pv.removeAttribute('src');   // (passed by: not needed any more)
    if (s?.task) { try { s.task.cancel(); } catch {} }
    const cv = el?.querySelector('canvas'); if (cv) { cv.width = cv.height = 0; cv.remove(); }
    state.delete(num);
  }

  // pages within about two screens are drawn; pages far away let go of their memory
  const nearObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const num = Number(e.target.dataset.n);
      if (e.isIntersecting) near.add(num); else { near.delete(num); release(num); }
    }
    pump();
  }, { root: scroller, rootMargin: perf.lite ? '110% 0px 110% 0px' : '200% 0px 200% 0px' });
  // which page is in the middle of the screen
  const posObs = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) M.roll($$('#posN'), e.target.dataset.n);
  }, { root: scroller, rootMargin: '-45% 0px -45% 0px' });
  // which pages are on screen (or about to be)
  const showObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const num = Number(e.target.dataset.n);
      if (e.isIntersecting) { seen.add(num); form(e.target); } else seen.delete(num);
    }
  }, { root: scroller, rootMargin: '0px 0px 60px 0px' });
  for (const el of pagesEl.children) { nearObs.observe(el); posObs.observe(el); showObs.observe(el); }

  // zoom: wider pages (sideways scroll), redrawn sharp
  const steps = [1, 1.25, 1.5, 2, 2.5];
  let z = 0;
  const setZoom = (k) => {
    z = Math.max(0, Math.min(steps.length - 1, k));
    pagesEl.style.setProperty('--zoom', steps[z]);
    $$('#zOut').disabled = z === 0; $$('#zIn').disabled = z === steps.length - 1;
    M.roll($$('#zVal'), Math.round(steps[z] * 100) + '%');
    clearTimeout(setZoom.t); setZoom.t = setTimeout(pump, 120);
  };
  $$('#zIn').addEventListener('click', () => setZoom(z + 1));
  $$('#zOut').addEventListener('click', () => setZoom(z - 1));
  setZoom(0);
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(pump, 200); };
  window.addEventListener('resize', onResize, { passive: true });
  // closing the reader lets go of everything it drew
  return () => {
    nearObs.disconnect(); posObs.disconnect(); showObs.disconnect();
    window.removeEventListener('resize', onResize);
    for (const num of [...state.keys()]) release(num);
    near.clear();
  };
}
