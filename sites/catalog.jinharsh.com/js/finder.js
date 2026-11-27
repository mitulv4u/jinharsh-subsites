// Instant search inside the catalogues (front page). While someone types in the search box, a list under it shows
// the catalogue pages that contain those words (part numbers, products, sizes...) with the words marked; choosing
// one opens that catalogue at that page. The page texts come from lookup.js (made by tools/php-hub/make-extras.mjs);
// without them nothing changes: the box still filters the cards by name.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc } from './markup.js';
import { pageLink } from './peek.js';
import { hasPages, loadPages, findPages, catalogOf } from './lookup.js';

export function finder({ input, onAsk }) {
  if (!input || !hasPages()) return;
  let sel = -1, last = '';
  const box = document.createElement('div');
  box.className = 'finder';
  box.id = 'finder';
  box.setAttribute('role', 'listbox');
  box.hidden = true;
  input.closest('.hub-search').appendChild(box);
  input.setAttribute('aria-controls', 'finder');
  input.setAttribute('aria-autocomplete', 'list');
  for (const t of ['focus', 'pointerenter']) input.addEventListener(t, () => loadPages(), { once: true, passive: true });

  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 140); });
  input.addEventListener('keydown', (e) => {
    const items = [...box.querySelectorAll('.f-item')];
    if (box.hidden || !items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('on', i === sel));
      items[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); items[sel].click(); }
    else if (e.key === 'Escape') hide();
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.hub-search')) hide(); });
  input.addEventListener('focus', () => { if (box.innerHTML && input.value.trim().length >= 2) show(); });
  box.addEventListener('click', (e) => { const a = e.target.closest('[data-askq]'); if (a && onAsk) { e.preventDefault(); hide(); onAsk(input.value.trim()); } });

  async function run() {
    const raw = input.value.trim(), q = raw.toLowerCase().replace(/\s+/g, ' ');
    if (q.length < 2) { hide(); last = ''; return; }
    if (q === last && !box.hidden) return;
    last = q;
    if (box.hidden) { box.innerHTML = `<div class="f-note">${icon('search')}Looking inside the catalogues…</div>`; show(); }
    const hits = await findPages(q);
    if (input.value.trim().toLowerCase().replace(/\s+/g, ' ') !== q) return;
    sel = -1;
    const ask = `<button class="f-ask" type="button" data-askq>${icon('message-square-text')}<span>Ask us about “${esc(raw)}”</span><b>One tap</b></button>`;
    box.innerHTML = (hits.length
      ? `<div class="f-head">Inside the catalogues</div>` + hits.map((h) => {
        const d = catalogOf(h.code) || { title: h.code };
        return `<a class="f-item" role="option" href="${esc(pageLink(h.code, h.page))}">
          <span class="f-thumb">${d.thumb || d.cover ? `<img src="${esc(d.thumb || d.cover)}" alt="" loading="lazy">` : ''}</span>
          <span class="f-text"><b>${esc(d.title)}</b><small>${h.snippet}</small></span>
          <span class="f-page">Page ${h.page}</span></a>`;
      }).join('')
      : `<div class="f-note">${icon('search')}No page mentions “${esc(raw)}”. Our team can still find it for you:</div>`) + ask;
    show();
    M.rise(box.querySelectorAll('.f-item, .f-ask'), { step: 25, y: 6 });
  }
  function show() {
    const was = box.hidden;
    box.hidden = false; input.setAttribute('aria-expanded', 'true');
    if (was) M.play(box, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  }
  function hide() { box.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); }
}
