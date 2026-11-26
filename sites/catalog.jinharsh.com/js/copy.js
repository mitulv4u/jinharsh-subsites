// Copying a link, and showing that it worked.
//   copyText(text) -> true when it is on the clipboard. Works on the office Wi-Fi address too (plain http), where
//                     the modern clipboard is switched off by the browser: an old-style copy is used there.
//   showCopied(btn)   the button's icon becomes a tick that draws itself and its words roll to "Copied", then back.
//   flashLink(el)     the link text glows orange for a moment, as if picked up.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch {}
  try {
    const was = document.activeElement;
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    try { if (was && was.focus) was.focus({ preventScroll: true }); } catch {}
    return ok;
  } catch { return false; }
}

export function showCopied(btn, { ms = 1800 } = {}) {
  if (!btn || btn.dataset.copied) return;
  btn.dataset.copied = '1';
  const was = btn.innerHTML;
  const tick = icon('check', 'i-draw');
  const ic = btn.querySelector('.so-ic');
  if (ic) {                                     // a Share option: round icon on top, words below
    ic.innerHTML = tick; ic.classList.add('copied');
    const t = btn.querySelector('span:last-child');
    if (t) { t.textContent = 'Copied'; M.play(t, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: M.SPRING.snappy.easing }); }
    M.bump(ic, 1.15);
  } else if (btn.classList.contains('ju-icon')) { // an icon on its own
    btn.innerHTML = tick; btn.classList.add('copied'); M.bump(btn, 1.2);
  } else {                                      // a button with words
    btn.innerHTML = `${tick}<span class="cp-t">Copied</span>`; btn.classList.add('copied');
    M.play(btn.querySelector('.cp-t'), [{ opacity: 0, transform: 'translateY(60%)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: M.SPRING.snappy.easing });
  }
  setTimeout(() => {
    if (!btn.isConnected) return;
    btn.innerHTML = was; btn.classList.remove('copied');
    btn.querySelectorAll('.copied').forEach((e) => e.classList.remove('copied'));
    delete btn.dataset.copied;
    M.play(btn.firstElementChild ? btn : null, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 260 });
  }, ms);
}

export function flashLink(el) {
  if (!el) return;
  let accent = '#ea580c';
  try { accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || accent; } catch {}
  M.play(el, [{ color: accent }, { color: accent, offset: 0.45 }, {}], { duration: 1100, easing: 'ease-out' });
}
