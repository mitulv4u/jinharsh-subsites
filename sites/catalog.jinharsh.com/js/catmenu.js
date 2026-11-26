// The menu of all catalogues on every catalogue's page (like the sidebar of the old catalogue hub): it slides in from
// the left, with a search box and the brands; the catalogue you are on is marked. Closes gently, its grains floating away.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { swallow } from './particles.js';
import { catPath } from './backend.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byName = (a, b) => { const x = String(a).toLowerCase(), y = String(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }; // A to Z, ignoring capitals

export function openMenu({ list = [], current = '', from = null } = {}) {
  if (document.querySelector('.cat-drawer')) return;
  const brands = [...new Set(list.map((c) => c.brand).filter(Boolean))].sort(byName);
  const ov = document.createElement('div');
  ov.className = 'drawer-ov';
  ov.innerHTML = `<aside class="cat-drawer" role="dialog" aria-modal="true" aria-label="All catalogues">
    <div class="cd-head">
      <a class="cd-all" href="/">${icon('layout-grid')}<span><b>All catalogues</b><small>${list.length} catalogue${list.length === 1 ? '' : 's'}</small></span></a>
      <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    </div>
    <label class="searchbox cd-search"><span class="sr">Search</span>${icon('search')}<input class="ju-inp" type="search" placeholder="Search: bearings, couplings, Timken…" autocomplete="off"></label>
    ${brands.length > 1 ? `<div class="cd-chips"><button type="button" class="ju-chip on" data-b="">All</button>${brands.map((b) => `<button type="button" class="ju-chip" data-b="${esc(b)}">${esc(b)}</button>`).join('')}</div>` : ''}
    <nav class="cd-list">${list.map((c) => `
      <a class="cd-item${c.code === current ? ' here' : ''}" href="${esc(catPath(c.code))}" data-b="${esc(c.brand || '')}" data-q="${esc([c.title, c.brand, c.category, c.code].join(' ').toLowerCase())}"${c.code === current ? ' aria-current="page"' : ''}>
        <span class="cd-thumb">${c.thumb ? `<img src="${esc(c.thumb)}" alt="" loading="lazy" decoding="async">` : icon(c.link ? 'external-link' : 'file-text')}</span>
        <span class="cd-text">${c.brand ? `<small>${esc(c.brand)}</small>` : ''}<b>${esc(c.title)}</b>
          ${c.code === current ? '<em>You are here</em>' : c.link ? '<em>Interactive guide</em>' : c.waiting ? '<em>PDF coming</em>' : ''}</span>
      </a>`).join('')}
      <p class="cd-none ju-muted" hidden>No catalogue matches.</p>
    </nav>
  </aside>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const drawer = ov.querySelector('.cat-drawer');
  M.play(ov, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
  M.play(drawer, [{ transform: 'translateX(-104%)' }, { transform: 'none' }], { duration: M.SPRING.smooth.duration, easing: M.SPRING.smooth.easing });
  M.rise(drawer.querySelectorAll('.cd-item'), { delay: 120, step: 18, y: 8 });
  // the catalogue you are on comes into view
  setTimeout(() => { try { drawer.querySelector('.cd-item.here')?.scrollIntoView({ block: 'center' }); } catch {} }, 60);
  setTimeout(() => { const i = drawer.querySelector('.cd-search input'); if (matchMedia('(pointer:fine)').matches) i.focus({ preventScroll: true }); }, 200);

  let brand = '', q = '';
  const filter = () => {
    let shown = 0;
    drawer.querySelectorAll('.cd-item').forEach((a) => { a.hidden = !((!brand || a.dataset.b === brand) && (!q || a.dataset.q.includes(q))); if (!a.hidden) shown++; });
    drawer.querySelector('.cd-none').hidden = shown > 0;
  };
  drawer.querySelector('.cd-search input').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); filter(); });

  let closed = false;
  const close = (at) => {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey);
    swallow(drawer, { at });
    M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in' }).then(() => { ov.remove(); document.body.style.overflow = ''; if (from) try { from.focus({ preventScroll: true }); } catch {} });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => {
    if (e.target === ov) return close();
    const x = e.target.closest('[data-x]');
    if (x) { const b = x.getBoundingClientRect(); return close({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); }
    const chip = e.target.closest('.ju-chip[data-b]');
    if (chip) { brand = chip.dataset.b; drawer.querySelectorAll('.cd-chips .ju-chip').forEach((c) => c.classList.toggle('on', c === chip)); filter(); }
    const here = e.target.closest('.cd-item.here');
    if (here) { e.preventDefault(); close(); }
  });
}
