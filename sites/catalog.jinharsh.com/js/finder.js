// Instant search inside the catalogues (front page). While someone types in the search box, a list under it shows
// the catalogue pages that contain those words (part numbers, products, sizes...) with the words marked; choosing
// one opens that catalogue at that page. The text of every page comes from one file made by
// tools/php-hub/make-extras.mjs ({ v, cats: { code: [page 1 text, page 2 text, ...] } }), fetched the first time
// the search box is used. Without that file nothing changes: the box still filters the cards by name.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc } from './markup.js';
import { pageLink } from './peek.js';

const MAX = 8, PER_CAT = 3;

export function finder({ input, url, docs }) {
  if (!input || !url) return;
  let index = null, loading = null, sel = -1, last = '';
  const box = document.createElement('div');
  box.className = 'finder';
  box.id = 'finder';
  box.setAttribute('role', 'listbox');
  box.hidden = true;
  input.closest('.hub-search').appendChild(box);
  input.setAttribute('aria-controls', 'finder');
  input.setAttribute('aria-autocomplete', 'list');

  const load = () => loading || (loading = fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j || !j.cats) return null;
    // lower-case copies for matching, made once
    index = Object.entries(j.cats).map(([code, pages]) => ({ code, pages, low: pages.map((p) => String(p).toLowerCase()) }));
    return index;
  }).catch(() => null));
  for (const t of ['focus', 'pointerenter']) input.addEventListener(t, load, { once: true, passive: true });

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

  async function run() {
    const q = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (q.length < 2) { hide(); last = ''; return; }
    if (q === last && !box.hidden) return;
    last = q;
    if (!index) {
      box.innerHTML = `<div class="f-note">${icon('search')}Looking inside the catalogues…</div>`;
      show();
      await load();
      if (!index) { hide(); return; }
      if (input.value.trim().toLowerCase().replace(/\s+/g, ' ') !== q) return;
    }
    const hits = search(q);
    sel = -1;
    box.innerHTML = hits.length
      ? `<div class="f-head">Inside the catalogues</div>` + hits.map((h) => {
        const d = docs().find((x) => x.code === h.code) || { title: h.code };
        return `<a class="f-item" role="option" href="${esc(pageLink(h.code, h.page))}">
          <span class="f-thumb">${d.thumb || d.cover ? `<img src="${esc(d.thumb || d.cover)}" alt="" loading="lazy">` : ''}</span>
          <span class="f-text"><b>${esc(d.title)}</b><small>${h.snippet}</small></span>
          <span class="f-page">Page ${h.page}</span></a>`;
      }).join('')
      : `<div class="f-note">${icon('search')}No page mentions “${esc(input.value.trim())}”. Ask us: we will find it for you.</div>`;
    const wasHidden = box.hidden;
    show();
    if (wasHidden) M.play(box, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
    M.rise(box.querySelectorAll('.f-item'), { step: 25, y: 6 });
  }

  // every word must be on the page; the whole phrase together ranks higher
  function search(q) {
    const words = q.split(' ').filter((w) => w.length > 1 || /\d/.test(w));
    if (!words.length) return [];
    const out = [];
    for (const c of index) {
      let n = 0;
      for (let i = 0; i < c.low.length && n < PER_CAT; i++) {
        const t = c.low[i];
        if (!words.every((w) => t.includes(w))) continue;
        const at = t.indexOf(q);
        out.push({ code: c.code, page: i + 1, score: at >= 0 ? 2 : 1, snippet: snippet(c.pages[i], t, at >= 0 ? q : words[0], words) });
        n++;
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, MAX);
  }
  function snippet(text, low, first, words) {
    const at = Math.max(0, low.indexOf(first));
    const from = Math.max(0, at - 38), to = Math.min(text.length, at + first.length + 70);
    const raw = text.slice(from, to), lo = raw.toLowerCase();
    // where the words are in this piece (overlaps joined), then the piece with those parts marked
    const spans = [];
    for (const w of new Set(words)) for (let k = lo.indexOf(w); k >= 0; k = lo.indexOf(w, k + w.length)) spans.push([k, k + w.length]);
    spans.sort((a, b) => a[0] - b[0]);
    let s = '', pos = 0;
    for (const [a, b] of spans) {
      if (b <= pos) continue;
      const st = Math.max(a, pos);
      s += esc(raw.slice(pos, st)) + `<mark>${esc(raw.slice(st, b))}</mark>`;
      pos = b;
    }
    s += esc(raw.slice(pos));
    return (from ? '…' : '') + s + (to < text.length ? '…' : '');
  }
  function show() { box.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function hide() { box.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); }
}
