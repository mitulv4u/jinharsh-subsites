// HTML pieces made in two places: by the server, which puts the front page's cards into the page itself (so they are
// on screen before any script has run), and by the pages (hub.js draws the cards again when a brand or the search
// changes). One copy of the code, so both always match. Nothing here may touch the page (no document, no window):
// the server runs this file too.
// (the icons file is imported as ../vendor/icons.js?v=N, the same address as everywhere else: bump N here as well)
import { icon } from '../vendor/icons.js?v=3';
import { fmtSize } from './pdfkit.js';
import { catPath } from './backend.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A to Z, ignoring capitals (brand names): plain comparison, as the language-aware one loads big tables on first use
export const byName = (a, b) => { const x = String(a).toLowerCase(), y = String(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; };

// a calm colour per brand, for catalogues that have no cover picture yet
export function brandHue(name) {
  let h = 0; for (const ch of String(name || 'Jinharsh')) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
export function blankCover(doc, extraClass = '') {
  const b = doc.brand || 'Jinharsh';
  return `<div class="blank-cover ${extraClass}" style="--h:${brandHue(b)}"><span class="bc-brand">${esc(b)}</span><span class="bc-title">${esc(doc.title)}</span></div>`;
}

// ---------- the front page ----------
// catalogues with a PDF first (newest first), then those still waiting
export const sortCatalogs = (list) => list.sort((a, b) => (a.waiting === b.waiting ? byName(b.updatedAt, a.updatedAt) : a.waiting ? 1 : -1));
export const brandsOf = (list) => [...new Set(list.map((d) => d.brand).filter(Boolean))].sort(byName);

export function hubEyebrow(list, brands) {
  const ready = list.filter((d) => !d.waiting).length;
  return `${list.length} catalogue${list.length === 1 ? '' : 's'}${brands.length ? ` · ${brands.length} brand${brands.length === 1 ? '' : 's'}` : ''} · ${ready} ready to read`;
}

export const chipsHtml = (brands, current = '') =>
  ['', ...brands].map((b) => `<button type="button" class="ju-chip${b === current ? ' on' : ''}" data-brand="${esc(b)}">${b ? esc(b) : 'All'}</button>`).join('');

export function cardHtml(d, i = 99) {
  const meta = d.waiting ? (d.sourceUrl ? 'On the maker’s website' : 'Coming soon')
    : [d.pages ? `${d.pages} pages` : null, fmtSize(d.size)].filter(Boolean).join(' · ');
  return `<article class="cat-card${d.waiting ? ' is-waiting' : ''}" data-key="${esc(d.code)}">
    <a class="cc-link" href="${esc(catPath(d.code))}">
      <div class="cc-cover">${d.cover ? `<img src="${esc(d.thumb || d.cover)}" alt="" width="${d.coverW || 720}" height="${d.coverH || 1018}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"${i < 2 ? ' fetchpriority="high"' : ''} style="view-transition-name:cover-${esc(d.code)}">` : blankCover(d)}</div>
      <div class="cc-body">
        <div class="cc-top">${d.brand ? `<span class="brand-pill">${esc(d.brand)}</span>` : ''}${d.category ? `<span class="cc-cat">${esc(d.category)}</span>` : ''}</div>
        <h2>${esc(d.title)}</h2>
        ${d.note ? `<p>${esc(d.note)}</p>` : ''}
        <div class="cc-foot"><span class="${d.waiting ? 'ju-pill warn' : 'cc-meta'}">${esc(meta)}</span><span class="cc-go">${icon(d.waiting ? 'external-link' : 'book-open')}</span></div>
      </div>
    </a>
    <button class="ju-icon cc-qr" type="button" data-qr="${esc(d.code)}" aria-label="QR code for ${esc(d.title)}" title="QR code">${icon('qr-code')}</button>
  </article>`;
}
