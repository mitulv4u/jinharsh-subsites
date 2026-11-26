// QR Studio (for posters, stands and visiting cards): every catalogue's QR code on one page, plus the one for the
// front page. Each can be saved as a picture (PNG) or a print file (SVG), or made into a visiting card; "Download all"
// saves every code in one ZIP. Opens from the QR button on the front page, or straight away at /?qr=1.
// The codes are the permanent /c/<code> links: printed once, they keep working when a PDF is replaced.
import { icon } from '/hub/vendor/icons.js?v=3';
import { qrSvg, qrSvgFile, qrPng, saveBlob } from './qr.js';
import * as M from './motion.js';
import { swallow, pourInto } from './particles.js';
import { makeZip } from './zip.js';
import { catPath } from './backend.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byName = (a, b) => { const x = String(a).toLowerCase(), y = String(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }; // A to Z, ignoring capitals
const toast = (t) => { try { JUI.toast(t); } catch {} };
const fileName = (s) => String(s || 'QR').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const short = (u) => String(u).replace(/^https?:\/\//, '').replace(/\/$/, '');

export function openStudio({ catalogs = [], publicUrl = location.origin, site = {}, printable = true, from = null } = {}) {
  const base = String(publicUrl).replace(/\/$/, '');
  const entries = [
    { code: '', title: 'All catalogues (front page)', brand: site.company?.short || 'Jinharsh', link: base + '/' },
    ...catalogs.map((c) => ({ code: c.code, title: c.title, brand: c.brand || '', link: `${base}${catPath(c.code)}`, waiting: !!c.waiting })),
  ];
  const brands = [...new Set(catalogs.map((c) => c.brand).filter(Boolean))].sort(byName);
  const ov = document.createElement('div');
  ov.className = 'ju-overlay studio-ov';
  ov.innerHTML = `<div class="ju-sheet studio" role="dialog" aria-modal="true" aria-label="QR Studio">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="ju-eyebrow">QR Studio</div>
    <h2>QR codes for posters, stands and visiting cards</h2>
    <p class="ju-muted st-sub">Every code opens its catalogue and never changes, even when the PDF is replaced. PNG is a picture; SVG stays sharp at any size, for the print shop.</p>
    ${printable ? '' : `<div class="notice warn st-warn">${icon('circle-alert')}<p><b>Preview codes: do not print.</b> They point to ${esc(short(base))}. Print them once the site is live at catalog.jinharsh.com.</p></div>`}
    <div class="st-bar">
      <label class="searchbox st-search"><span class="sr">Search</span>${icon('search')}<input class="ju-inp" type="search" placeholder="Search catalogues" autocomplete="off"></label>
      <button class="ju-btn primary" type="button" data-all>${icon('download')}Download all (ZIP)</button>
    </div>
    ${brands.length > 1 ? `<div class="chips st-chips"><button class="ju-chip on" type="button" data-brand="">All</button>${brands.map((b) => `<button class="ju-chip" type="button" data-brand="${esc(b)}">${esc(b)}</button>`).join('')}</div>` : ''}
    <div class="st-grid">${entries.map((e, i) => `
      <article class="st-card${i === 0 ? ' is-hub' : ''}" data-i="${i}" data-brand="${esc(e.brand)}" data-q="${esc((e.title + ' ' + e.brand + ' ' + e.code).toLowerCase())}">
        <div class="qr-tile st-qr" data-link="${esc(e.link)}">${qrSvg(e.link, { logo: true, title: e.title })}</div>
        <div class="st-brand">${esc(e.brand)}${e.waiting ? ' · <span>PDF coming</span>' : ''}</div>
        <b class="st-title">${esc(e.title)}</b>
        <span class="st-link mono">${esc(short(e.link))}</span>
        <div class="st-btns">
          <button class="ju-btn sm" type="button" data-png="${i}">${icon('image')}PNG</button>
          <button class="ju-btn sm" type="button" data-svg="${i}">${icon('printer')}SVG</button>
          <button class="ju-btn sm icon-only" type="button" data-card="${i}" aria-label="Visiting card" title="Visiting card">${icon('id-card')}</button>
        </div>
      </article>`).join('')}</div>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.studio');
  if (from) { try { const r = from.getBoundingClientRect(); pourInto({ left: r.left, top: r.top, width: r.width, height: r.height }, sheet); } catch {} }
  M.rise(ov.querySelectorAll('.st-card'), { delay: 120, step: 35 });

  let closed = false;
  const close = (at) => {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey);
    swallow(sheet, { at });
    M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: 'ease-in' }).then(() => { ov.remove(); document.body.style.overflow = ''; });
    // leaving the studio: the address goes back to the plain front page
    try { const u = new URL(location.href); if (u.searchParams.has('qr')) { u.searchParams.delete('qr'); history.replaceState(null, '', u.pathname + (u.search || '')); } } catch {}
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  // search and brand
  let brand = '', q = '';
  const filter = () => ov.querySelectorAll('.st-card').forEach((c) => {
    c.hidden = !((!brand || c.dataset.brand === brand || c.classList.contains('is-hub')) && (!q || c.dataset.q.includes(q)));
  });
  ov.querySelector('.st-search input').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); filter(); });

  ov.addEventListener('click', async (e) => {
    if (e.target === ov) return close();
    const x = e.target.closest('[data-x]');
    if (x) { const b = x.getBoundingClientRect(); return close({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); }
    const chip = e.target.closest('[data-brand]');
    if (chip && chip.classList.contains('ju-chip')) {
      brand = chip.dataset.brand;
      ov.querySelectorAll('.st-chips .ju-chip').forEach((c) => c.classList.toggle('on', c === chip));
      filter(); return;
    }
    const b = e.target.closest('button');
    if (!b) return;
    const label = b.innerHTML;
    try {
      if (b.dataset.png) { const en = entries[+b.dataset.png]; M.nudgeDown(b.querySelector('.i')); saveBlob(await qrPng(en.link, true, 2000), `QR ${fileName(en.title)}.png`); toast('QR picture saved'); }
      if (b.dataset.svg) { const en = entries[+b.dataset.svg]; saveBlob(new Blob([await qrSvgFile(en.link, true)], { type: 'image/svg+xml' }), `QR ${fileName(en.title)}.svg`); toast('Saved: best for printing'); }
      if (b.dataset.card) {
        const en = entries[+b.dataset.card];
        const m = await import('./card.js');
        m.cardSheet({ link: en.link, title: en.code ? en.title : 'Jinharsh Catalogues', site, printable, from: b });
      }
      if (b.matches('[data-all]')) {
        b.disabled = true;
        const files = [];
        const list = entries.filter((_, i) => !ov.querySelector(`.st-card[data-i="${i}"]`).hidden);
        for (let i = 0; i < list.length; i++) {
          const en = list[i], name = fileName(en.code ? `${en.title} (${en.code})` : en.title);
          b.innerHTML = `${icon('download')}Making ${i + 1} of ${list.length}…`;
          files.push({ name: `PNG pictures/QR ${name}.png`, data: new Uint8Array(await (await qrPng(en.link, true, 1600)).arrayBuffer()) });
          files.push({ name: `SVG for printing/QR ${name}.svg`, data: await qrSvgFile(en.link, true) });
        }
        files.push({ name: 'Read me.txt', data: `QR codes made ${new Date().toLocaleString('en-IN')}\r\n\r\nEvery code opens its catalogue at ${short(base)} and never changes.\r\nPNG = picture (2000 px wide is plenty for A4 posters).\r\nSVG = sharp at any size: send these to the print shop.\r\n${printable ? '' : '\r\nPREVIEW CODES: these point to a test address. Do not print them.\r\n'}` });
        saveBlob(makeZip(files), `Jinharsh QR codes ${new Date().toISOString().slice(0, 10)}.zip`);
        b.innerHTML = label; b.disabled = false;
        toast(`${list.length} QR codes saved in one ZIP`);
      }
    } catch { toast('Could not make the file. Please try again.'); b.innerHTML = label; b.disabled = false; }
  });
}
