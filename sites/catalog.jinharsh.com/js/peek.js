// Quick look: a catalogue's first pages in a window, without opening the reader. Swipe (or use the arrows) through
// them; pressing a page opens the catalogue at that page. The pictures come from tools/php-hub/make-extras.mjs.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc } from './markup.js';
import { catPath } from './backend.js';

export const pageLink = (code, n) => { const p = catPath(code); return n > 1 ? `${p}${p.includes('?') ? '&' : '?'}page=${n}` : p; };

export function peekSheet(d, from = null) {
  const pages = [d.cover || d.thumb, ...(d.peek || [])].filter(Boolean);
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  ov.innerHTML = `<div class="ju-sheet wide peek-sheet" role="dialog" aria-modal="true" aria-label="Quick look: ${esc(d.title)}">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="ju-eyebrow">${icon('eye')}Quick look</div>
    <h2>${esc(d.title)}</h2>
    <div class="peek-wrap">
      <button class="ju-icon peek-nav prev" type="button" data-step="-1" aria-label="Previous page">${icon('chevron-right')}</button>
      <div class="peek-strip" tabindex="0">
        ${pages.map((src, i) => `<a class="peek-page" href="${esc(pageLink(d.code, i + 1))}" aria-label="Open at page ${i + 1}">
          <img src="${esc(src)}" alt="Page ${i + 1}" decoding="async"${i > 1 ? ' loading="lazy"' : ''}><span class="pno">${i + 1}</span></a>`).join('')}
      </div>
      <button class="ju-icon peek-nav next" type="button" data-step="1" aria-label="Next page">${icon('chevron-right')}</button>
    </div>
    <div class="peek-dots" aria-hidden="true">${pages.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
    <div class="btns">
      <a class="ju-btn primary" href="${esc(catPath(d.code))}">${icon('book-open')}${d.pages > 1 ? `Read all ${d.pages} pages` : 'Read it'}</a>
      <button class="ju-btn" type="button" data-ask data-code="${esc(d.code)}" data-title="${esc(d.title)}">${icon('message-square-text')}Ask about it</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.peek-sheet'), strip = ov.querySelector('.peek-strip');
  if (from) M.growFrom(sheet, from); else M.play(sheet, [{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.3,1)' });
  M.rise(ov.querySelectorAll('.peek-page'), { delay: 120, step: 60, y: 14 });

  // which page is in the middle: its dot lights up
  const dots = [...ov.querySelectorAll('.peek-dots i')];
  const at = () => { const w = strip.firstElementChild?.offsetWidth || 1; return Math.round(strip.scrollLeft / (w + 14)); };
  strip.addEventListener('scroll', () => { const k = at(); dots.forEach((d0, i) => d0.classList.toggle('on', i === k)); }, { passive: true });
  const step = (n) => { const w = strip.firstElementChild?.offsetWidth || 0; strip.scrollBy({ left: n * (w + 14), behavior: M.calm() ? 'auto' : 'smooth' }); };

  let closing = false;
  const close = () => {
    if (closing) return; closing = true;
    document.removeEventListener('keydown', onKey);
    M.play(sheet, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(14px) scale(.98)' }], { duration: 220, easing: 'ease-in' })
      .then(() => { ov.remove(); document.body.style.overflow = ''; });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => {
    if (e.target === ov || e.target.closest('[data-x]')) return close();
    const s = e.target.closest('[data-step]'); if (s) { step(+s.dataset.step); M.bump(s, 1.1); return; }
    if (e.target.closest('[data-ask]')) close();   // (site.js opens the query window)
  });
  strip.focus({ preventScroll: true });
}
