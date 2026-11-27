// "See you later": a warm goodbye from the Jinharsh team. Browsers never let a page show anything while its tab is
// being closed, so the goodbye comes at the moments a page can see:
//   - on a computer, when the mouse heads up out of the page (towards the tabs, Back or close), once per visit
//   - when a link takes someone to another website (jinharsh.com, the Technical Wiki, a maker's site)
//   - after a query has been sent (byeHtml() inside the thank-you)
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc } from './markup.js';
import { jiniSvg } from './jini.js';

const HEART = '<svg class="bye-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';

export const byeHtml = ({ title = 'See you later!', text = 'Thank you for visiting Jinharsh. We are here whenever you need us.' } = {}) => `
  <div class="bye">
    <div class="bye-jini" aria-hidden="true">${jiniSvg()}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    <p class="bye-sign">${HEART}With care, team Jinharsh</p>
  </div>`;

let shown = false;
function card({ html, buttons = '', auto = 0 }) {
  if (document.querySelector('.bye-ov')) return null;
  const ov = document.createElement('div');
  ov.className = 'bye-ov';
  ov.innerHTML = `<div class="bye-card ju-card" role="dialog" aria-modal="true" aria-label="See you later">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>${html}${buttons}</div>`;
  document.body.appendChild(ov);
  const c = ov.querySelector('.bye-card');
  M.play(c, [{ opacity: 0, transform: 'translateY(18px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.15)' });
  M.play(ov, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  let t = 0;
  const close = () => {
    clearTimeout(t);
    document.removeEventListener('keydown', key);
    return M.play(c, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: 240, easing: 'ease-in' })
      .then(() => M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 })).then(() => ov.remove());
  };
  const key = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-x], [data-stay]')) close(); });
  if (auto) t = setTimeout(close, auto);
  return { ov, close };
}

// leaving from a computer: a goodbye with one tap to send a query, or to stay
export function seeYouExit({ onQuery } = {}) {
  const c = card({
    html: byeHtml({ title: 'Leaving already? See you later!', text: 'Thank you for visiting Jinharsh. Didn’t find something? Tell us in one line and we will find it for you.' }),
    buttons: `<div class="btns bye-btns"><button class="ju-btn accent" type="button" data-q>${icon('message-square-text')}Send a quick query</button><button class="ju-btn" type="button" data-stay>Keep browsing</button></div>`,
  });
  if (!c) return;
  c.ov.querySelector('[data-q]').addEventListener('click', () => { c.close(); if (onQuery) onQuery(); });
}

// going to another website: a short wave on the way out
export function seeYouLink(host) {
  card({ html: byeHtml({ title: 'See you later!', text: `Opening ${host}. Come back anytime: your catalogues are right here.` }), auto: 1800 });
}

// watch for the moments above (call once per page)
export function watchGoodbye({ onQuery } = {}) {
  const start = Date.now();
  const busy = () => !!document.querySelector('.ju-overlay, .reader-ov, .as-panel:not([hidden]), .bye-ov');
  const fine = (() => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; } })();
  try { shown = !!sessionStorage.getItem('jd_bye'); } catch {}
  if (fine) {
    document.addEventListener('mouseout', (e) => {
      if (shown || e.relatedTarget || e.clientY > 2 || Date.now() - start < 8000 || busy()) return;
      shown = true;
      try { sessionStorage.setItem('jd_bye', '1'); } catch {}
      seeYouExit({ onQuery });
    });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
    let u;
    try { u = new URL(a.href, location.href); } catch { return; }
    if (!/^https?:$/.test(u.protocol) || u.host === location.host) return;
    const host = u.host.replace(/^www\./, '');
    if (a.target === '_blank') { seeYouLink(host); return; }   // (the new tab opens straight away; this tab says goodbye)
    e.preventDefault();
    seeYouLink(host);
    setTimeout(() => { location.href = u.href; }, 1100);
  });
}
