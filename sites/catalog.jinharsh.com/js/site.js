// Pieces shared by the two public pages (the front page of all catalogues, and each catalogue's page).
import { icon } from '/hub/vendor/icons.js?v=3';
import { qrSvg, qrSvgFile, qrPng, saveBlob } from './qr.js';
import * as M from './motion.js';
import { assemble, enableHoverScatter, swallow, sparkle } from './particles.js';
// the visiting card code is only needed when someone opens a card: fetched quietly once the page is idle
const loadCard = () => import('./card.js');
export const idle = (fn, wait = 1500) => { try { setTimeout(() => (window.requestIdleCallback || ((f) => setTimeout(f, 1)))(() => { try { fn(); } catch {} }, { timeout: 4000 }), wait); } catch {} };
// fetch a script ahead of time without running it (it runs only when it is first used)
export const warmModule = (href) => { try { if (document.querySelector(`link[rel="modulepreload"][href="${href}"]`)) return; const l = document.createElement('link'); l.rel = 'modulepreload'; l.href = href; document.head.appendChild(l); } catch {} };
idle(() => warmModule('/hub/js/card.js'), 2500);
import { copyText, showCopied, flashLink } from './copy.js';
import { querySheet, setSite, track } from './visitor.js';
import { esc, byName, brandHue, blankCover } from './markup.js';
import { teamPath } from './backend.js';
export { esc, byName, brandHue, blankCover };   // (made in markup.js, which the server uses too)
// (the top bar's glass is CSS only: soft blur, light tint, bright rim - app.css "liquid glass")

enableHoverScatter();    // big QR codes: the grains scatter away from the mouse or finger

// closing a window: it floats away as soft grains from where you pressed X, while the veil clears
// light / dark: the sun or moon in the top bar; the new look spreads out in a circle from it.
// Until it is pressed the page follows the phone's own setting; afterwards the choice is kept on this device.
// The sun / moon button: Light (the default) -> Follow the sun -> Dark. The icon shows the choice now; the new look
// spreads out in a circle from the button. (theme-boot.js does the work, including following the sun.)
// ---------- extra top-bar buttons ----------
// A site can ask for them in site.json: "nav": { "query": true, "studio": true, "links": [{ "label", "href", "external" }] }
// (the PHP catalogue hub shows its Send Query, QR Studio, Team Portal, Technical Wiki and website buttons this way).
// Wide screens show them all; on phones Send query stays and the rest sit behind one small menu button.
export function wireNav(SITE, { code = '', title = '' } = {}) {
  const nav = SITE && SITE.nav;
  const bar = document.querySelector('.ju-top .top-in');
  if (!nav || !bar || bar.querySelector('.top-nav')) return;
  const items = [];
  if (nav.studio) items.push({ label: 'QR Studio', href: '/?qr=1', studio: true, ic: 'qr-code' });
  for (const l of nav.links || []) items.push({ label: l.label, href: l.href, external: !!l.external, ic: l.external ? 'external-link' : 'users' });
  const attrs = (it) => `href="${esc(it.href)}"${it.studio ? ' data-studio' : ''}${it.external ? ' target="_blank" rel="noopener"' : ''}`;
  const el = document.createElement('nav');
  el.className = 'top-nav';
  el.setAttribute('aria-label', 'More from the hub');
  el.innerHTML = (nav.query ? `<button class="ju-btn sm accent nav-q" type="button" aria-label="Send query">${icon('message-square-text')}<span>Send query</span></button>` : '')
    + items.map((it) => `<a class="ju-btn sm ghost nav-l" ${attrs(it)}>${esc(it.label)}${it.external ? ' ↗' : ''}</a>`).join('')
    + (items.length ? `<button class="ju-icon nav-more" type="button" aria-label="More" aria-haspopup="menu" aria-expanded="false">${icon('layout-grid')}</button>` : '');
  bar.insertBefore(el, bar.querySelector('#hubUpload, #hubQr, #themeTop') || null);
  if (nav.studio) { const q = document.getElementById('hubQr'); if (q) q.hidden = true; }   // (the labelled one replaces it)
  const qb = el.querySelector('.nav-q');
  if (qb) qb.addEventListener('click', (e) => querySheet({ code, title, from: e.currentTarget }));
  const more = el.querySelector('.nav-more');
  if (!more) return;
  let pop = null;
  const close = () => { if (!pop) return; pop.remove(); pop = null; more.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', onKey); };
  const away = (e) => { if (pop && !pop.contains(e.target) && !more.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  more.addEventListener('click', () => {
    if (pop) { close(); return; }
    pop = document.createElement('div');
    pop.className = 'nav-pop ju-glass ju-menu';
    pop.setAttribute('role', 'menu');
    pop.innerHTML = items.map((it) => `<a role="menuitem" ${attrs(it)}>${icon(it.ic)}<span>${esc(it.label)}</span></a>`).join('');
    const b = more.getBoundingClientRect();
    pop.style.top = Math.round(b.bottom + 8) + 'px';
    pop.style.right = Math.max(8, Math.round(innerWidth - b.right)) + 'px';
    document.body.appendChild(pop);
    more.setAttribute('aria-expanded', 'true');
    pop.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(close, 0); });
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', onKey);
  });
}

export const THEME_ICON = { light: 'sun', sun: 'sunset', dark: 'moon' };
const THEME_TIP = { light: 'Light', sun: 'Follow the sun: light by day, a warm sunset, dark at night', dark: 'Dark' };
function wireTheme() {
  const b = document.getElementById('themeTop');
  if (!b || !window.JDTheme) return;
  const paint = () => {
    const m = JDTheme.mode(), next = JDTheme.next(m);
    b.innerHTML = icon(THEME_ICON[m]);
    b.setAttribute('aria-label', `Look: ${JDTheme.label(m)}. Change to ${JDTheme.label(next)}`);
    b.title = THEME_TIP[m];
  };
  paint();
  b.addEventListener('click', () => {
    const r = b.getBoundingClientRect(), next = JDTheme.next();
    M.themeSwitch(r.left + r.width / 2, r.top + r.height / 2, () => { JDTheme.set(next); paint(); });
    M.bump(b, 1.15);
    toast(THEME_TIP[next]);
  });
}
try { wireTheme(); } catch { /* cosmetic */ }

export const centreOf = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
const swallowOut = (sheet, ov, at) => { swallow(sheet, { at }); return M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease-in' }); };

export const ui = (fn) => { try { fn(); } catch (e) {} };
export const toast = (t) => ui(() => JUI.toast(t));
export const shortLink = (l) => String(l).replace(/^https?:\/\//, '').replace(/\/$/, '');


const GO = `<span class="c-go" aria-hidden="true">${icon('chevron-down')}</span>`;
// the mouse coming over a contact button sprays a few grains off its round icon (not more than once a moment)
function wireContactHover() {
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const it = e.target.closest && e.target.closest('.c-item');
    if (!it || (e.relatedTarget && it.contains(e.relatedTarget))) return;
    const now = Date.now();
    if (now - (it.__sp || 0) < 700) return;
    it.__sp = now;
    try { sparkle(it.querySelector('.c-ic')); } catch {}
  }, { passive: true });
}
try { wireContactHover(); } catch { /* cosmetic */ }

// any button marked data-ask opens "Send a query" (about the catalogue in data-code, if any)
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-ask]');
  if (!b) return;
  e.preventDefault();
  querySheet({ code: b.dataset.code || '', title: b.dataset.title || '', message: b.dataset.message || '', from: b, onTop: !!b.closest('.reader-ov') });
});

export function contactHtml(SITE, title, code = '') {
  setSite(SITE);
  const C = SITE.contact || {};
  const items = [];
  const subj = title ? `About: ${title}` : 'Enquiry';
  (C.phones || []).slice(0, 1).forEach((p) => items.push(`<a class="c-item" data-k="call" href="tel:${esc(p.dial)}"><span class="c-ic">${icon('phone')}</span><span><b>Call</b><small>${esc(p.display)}</small></span>${GO}</a>`));
  if (C.whatsapp) items.push(`<a class="c-item" data-k="wa" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Hello Jinharsh, ' + (title ? 'I have a question about “' + title + '”.' : 'I have a question.'))}" target="_blank" rel="noopener"><span class="c-ic">${icon('message-circle')}</span><span><b>WhatsApp</b><small>Chat with us</small></span>${GO}</a>`);
  if (C.email) items.push(`<a class="c-item" data-k="mail" href="mailto:${esc(C.email)}?subject=${encodeURIComponent(subj)}"><span class="c-ic">${icon('mail')}</span><span><b>Email</b><small>${esc(C.email)}</small></span>${GO}</a>`);
  if (C.website) items.push(`<a class="c-item" data-k="web" href="${esc(C.website)}" target="_blank" rel="noopener"><span class="c-ic">${icon('globe')}</span><span><b>Website</b><small>${esc(C.website.replace(/^https?:\/\//, ''))}</small></span>${GO}</a>`);
  const phones = (C.phones || []).map((p) => `<a href="tel:${esc(p.dial)}">${esc(p.display)}</a>`).join(' · ');
  return `<section class="ju-card contact">
    <div class="contact-head">
      <div><h2>Questions? Talk to us.</h2>
      <p>${esc(SITE.company?.name || '')}${SITE.company?.tagline ? ' · ' + esc(SITE.company.tagline) : ''}</p></div>
      <button class="ju-btn accent" type="button" data-ask data-code="${esc(code)}" data-title="${esc(title || '')}">${icon('message-square-text')}Send a query</button>
    </div>
    <div class="c-grid">${items.join('')}</div>
    <p class="addr">${C.address ? esc(C.address) + '<br>' : ''}${phones}</p>
  </section>
  <footer class="v-foot">© ${new Date().getFullYear()} ${esc(SITE.company?.name || '')} · <a class="team-link" href="${esc(teamPath)}">${icon('upload')}Team: upload catalogues</a>${(SITE.links || []).map((l) => ` · <a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</footer>`;
}

export async function share(title, url) {
  if (navigator.share) {
    try { await navigator.share({ title, text: title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  if (await copyText(url)) toast('Link copied'); else window.prompt('Copy this link:', url);
}

// The Share window: grains burst out of the Share button and bind together as the QR code,
// with the ways to send it underneath (WhatsApp, email, copy link, the QR picture, and the phone's own share menu).
export function shareSheet({ link, title, from = null, site = {}, printable = true, code = '' }) {
  track('share', code);
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  const safe = String(title || 'Jinharsh catalogues').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 90);
  const msg = `${title} ${link}`;
  ov.innerHTML = `<div class="ju-sheet qr-sheet share-sheet" role="dialog" aria-modal="true" aria-label="Share">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="ju-eyebrow">Share</div>
    <h2>${esc(title)}</h2>
    <div class="qr-tile qr-big" data-link="${esc(link)}">${qrSvg(link, { logo: true, title })}</div>
    <p class="qr-link mono">${esc(shortLink(link))}</p>
    <div class="share-grid">
      <a class="share-opt" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><span class="so-ic wa">${icon('message-circle')}</span><span>WhatsApp</span></a>
      <a class="share-opt" href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(title + '\n' + link)}"><span class="so-ic">${icon('mail')}</span><span>Email</span></a>
      <button class="share-opt" type="button" data-copy><span class="so-ic">${icon('copy')}</span><span>Copy link</span></button>
      <button class="share-opt" type="button" data-png><span class="so-ic">${icon('download')}</span><span>QR picture</span></button>
      <button class="share-opt" type="button" data-card><span class="so-ic">${icon('id-card')}</span><span>Visiting card</span></button>
      ${navigator.share ? `<button class="share-opt" type="button" data-more><span class="so-ic">${icon('share-2')}</span><span>More…</span></button>` : ''}
    </div>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.share-sheet');
  // even rows: up to five side by side, six as two rows of three
  const grid = ov.querySelector('.share-grid'), n = grid.children.length;
  grid.style.gridTemplateColumns = `repeat(${n <= 5 ? n : Math.ceil(n / 2)}, minmax(0, 1fr))`;
  let closing = false;
  const close = async (at) => {
    if (closing) return; closing = true;
    document.removeEventListener('keydown', onKey);
    await swallowOut(sheet, ov, at);
    ov.remove(); document.body.style.overflow = '';
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', async (e) => {
    if (e.target === ov) return close();
    if (e.target.closest('[data-x]')) return close(centreOf(e.target.closest('[data-x]')));
    const b = e.target.closest('.share-opt'); if (!b) return;
    M.bump(b.querySelector('.so-ic'), 1.15);
    if (b.matches('[data-copy]')) {
      if (await copyText(link)) { toast('Link copied'); showCopied(b); flashLink(ov.querySelector('.qr-link')); } else window.prompt('Copy this link:', link);
    }
    if (b.matches('[data-png]')) { saveBlob(await qrPng(link, true, 2000), `QR ${safe}.png`); toast('QR picture saved'); }
    if (b.matches('[data-more]')) { try { await navigator.share({ title, text: title, url: link }); } catch {} }
    if (b.matches('[data-card]')) {
      loadCard().then((m) => m.cardSheet({ link, title, site, printable, from: b })).catch(() => toast('Could not open the card. Please try again.'));
      close(centreOf(b));
    }
  });
  // the grains come out of the button that was pressed (or from all around)
  setTimeout(() => assemble(ov.querySelector('.qr-big'), link, { from }), 60);
}

// The public "QR code" window: the catalogue's own QR (with the Jinharsh logo), ready for posters and stands.
export function qrSheet({ link, title }) {
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  const safe = String(title || 'Jinharsh catalogues').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 90);
  ov.innerHTML = `<div class="ju-sheet qr-sheet" role="dialog" aria-modal="true" aria-label="QR code">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="qr-tile qr-big" data-link="${esc(link)}">${qrSvg(link, { logo: true, title })}</div>
    <h2>${esc(title)}</h2>
    <p class="qr-link mono">${esc(shortLink(link))}</p>
    <div class="btns">
      <button class="ju-btn primary" type="button" data-png>${icon('download')}Download QR</button>
      <button class="ju-btn" type="button" data-svg>${icon('printer')}For printing (SVG)</button>
      <button class="ju-btn" type="button" data-copy>${icon('copy')}Copy link</button>
    </div>
    <p class="ju-small ju-muted qr-hint">Point a phone camera at it: it opens ${title ? 'this catalogue' : 'all catalogues'}.</p>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.qr-sheet');
  let closing = false;
  const close = async (at) => {
    if (closing) return; closing = true;
    document.removeEventListener('keydown', onKey);
    await swallowOut(sheet, ov, at);
    ov.remove(); document.body.style.overflow = '';
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', async (e) => {
    if (e.target === ov) return close();
    if (e.target.closest('[data-x]')) return close(centreOf(e.target.closest('[data-x]')));
    const b = e.target.closest('button'); if (!b) return;
    if (b.matches('[data-png]')) { M.nudgeDown(b.querySelector('.i')); saveBlob(await qrPng(link, true, 2000), `QR ${safe}.png`); toast('QR picture saved'); }
    if (b.matches('[data-svg]')) { saveBlob(new Blob([await qrSvgFile(link, true)], { type: 'image/svg+xml' }), `QR ${safe}.svg`); toast('Saved: best for printing'); }
    if (b.matches('[data-copy]')) {
      if (await copyText(link)) { toast('Link copied'); showCopied(b); flashLink(ov.querySelector('.qr-link')); } else window.prompt('Copy this link:', link);
    }
  });
  assemble(ov.querySelector('.qr-big'), link);
  M.rise(sheet.querySelectorAll('h2, .qr-link, .btns > .ju-btn, .qr-hint'), { delay: 160, step: 55 });
}
