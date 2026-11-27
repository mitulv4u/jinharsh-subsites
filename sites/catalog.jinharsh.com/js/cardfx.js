// Cards that react (front page). A card leans a little towards the mouse as it moves over it, and its cover opens
// like a book, showing the page behind it; held there, the book turns through its first pages (when the site has
// pictures of them, see tools/php-hub/make-extras.mjs). Mouse and pen only: on phones the Quick look button does
// this. Calm motion (the phone's "reduce motion") turns it all off.
import * as M from './motion.js';

const fine = () => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; } };

export function cardFx(box, docOf) {
  if (!fine() || M.calm()) return;
  let cur = null, raf = 0, px = 0, py = 0;
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest('.cat-card:not(.ghost-card)');
    if (card !== cur) { leave(); if (card) enter(card); }
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5;
    py = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(lean);
  });
  box.addEventListener('pointerleave', leave);
  // (a click opens the catalogue: put the cover back first so the page change starts from a closed book)
  box.addEventListener('click', () => leave(), true);

  function lean() {
    raf = 0;
    if (!cur) return;
    cur.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`);
    cur.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
  }
  function enter(card) {
    cur = card;
    card.classList.add('tilt');
    openBook(card, docOf(card.dataset.key));
  }
  function leave() {
    if (!cur) return;
    const c = cur; cur = null;
    c.classList.remove('tilt');
    c.style.removeProperty('--rx'); c.style.removeProperty('--ry');
    closeBook(c);
  }
}

// ---------- the cover as a book ----------
const books = new WeakMap();   // card -> { el, timer, turned }
function openBook(card, d) {
  const cover = card.querySelector('.cc-cover > img');
  if (!cover || !d || d.waiting) return;
  closeBook(card, true);
  const host = cover.parentElement;
  const el = document.createElement('div');
  el.className = 'cc-book';
  el.style.cssText = `left:${cover.offsetLeft}px;top:${cover.offsetTop}px;width:${cover.offsetWidth}px;height:${cover.offsetHeight}px`;
  const pages = (d.peek || []).slice(0, 4);
  // the pages behind the cover, page 2 on top; without pictures of them, a plain page
  el.innerHTML = pages.length
    ? pages.map((src, i) => `<img class="cc-leaf" src="${src}" alt="" decoding="async" style="z-index:${10 - i}">`).join('')
    : '<span class="cc-leaf blank"></span>';
  host.insertBefore(el, cover);
  card.classList.add('book-open');
  const b = { el, timer: 0, turned: [] };
  books.set(card, b);
  if (!pages.length) return;
  // held over the card: turn the pages one by one (each waits for its picture), then stay on the last
  const leaves = [cover, ...el.querySelectorAll('img.cc-leaf')];
  let i = 0;
  const turn = async () => {
    if (books.get(card) !== b || i >= leaves.length - 1) return;
    const next = leaves[i + 1];
    try { await next.decode(); } catch { return; }
    if (books.get(card) !== b) return;
    const page = leaves[i++];
    b.turned.push(page);
    page.animate([{ transform: page === cover ? 'translateY(-6px) rotateY(-24deg)' : 'rotateY(0)', opacity: 1 },
      { transform: `${page === cover ? 'translateY(-6px) ' : ''}rotateY(-170deg)`, opacity: 1, offset: 0.92 },
      { transform: `${page === cover ? 'translateY(-6px) ' : ''}rotateY(-178deg)`, opacity: 0 }],
    { duration: 700, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
    b.timer = setTimeout(turn, 1150);
  };
  b.timer = setTimeout(turn, 650);
}
function closeBook(card, now = false) {
  const b = books.get(card);
  card.classList.remove('book-open');
  if (!b) return;
  books.delete(card);
  clearTimeout(b.timer);
  // the turned pages come back (the cover last, so it ends on top), then the pages behind are taken away
  for (const p of b.turned) {
    for (const a of p.getAnimations()) {
      if (now) { a.cancel(); continue; }
      a.updatePlaybackRate(-2.4);
      a.finished.then(() => a.cancel(), () => {});
    }
  }
  const el = b.el;
  if (now) { el.remove(); return; }
  setTimeout(() => el.remove(), 520);
}
