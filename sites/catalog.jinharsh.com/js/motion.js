// Movement for the whole site, in one place.
// The kit's rules are kept: animations only MOVE things (or fade something that is leaving), nothing reacts
// to scrolling, "reduce motion" turns everything off, and every animation is also ended by a timer, so a
// browser that pauses animations still shows the finished page. Every function is guarded: if anything
// fails, the page simply skips the movement.

export const calm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// ---------- real springs ----------
// A spring is simulated once (stiffness, damping, mass) and turned into a CSS linear() curve,
// so things settle like real objects instead of following a fixed curve. Older browsers get a close curve.
const LINEAR_OK = (() => { try { return CSS.supports('transition-timing-function', 'linear(0, 0.5 50%, 1)'); } catch { return false; } })();
function makeSpring(stiffness, damping, mass = 1) {
  const dt = 1 / 240; let x = 0, v = 0, t = 0; const pts = [0];
  while (t < 2.5) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt; pts.push(x);
    if (t > 0.2 && Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break;
  }
  const step = Math.max(1, Math.round(pts.length / 56)), out = [];
  for (let i = 0; i < pts.length; i += step) out.push(+pts[i].toFixed(4));
  out[out.length - 1] = 1;
  return { easing: LINEAR_OK ? `linear(${out.join(', ')})` : 'cubic-bezier(.2,.9,.25,1.1)', duration: Math.round(t * 1000) };
}
export const SPRING = {
  snappy: makeSpring(380, 30),   // buttons, small icons
  smooth: makeSpring(210, 26),   // rows, sheets: no visible bounce
  gentle: makeSpring(150, 19),   // big moves: a soft overshoot, like iOS
  bouncy: makeSpring(260, 15),   // the moment a QR code is ready
};
try {
  const r = document.documentElement.style;
  for (const [k, s] of Object.entries(SPRING)) { r.setProperty('--sp-' + k, s.easing); r.setProperty('--sp-' + k + '-ms', s.duration + 'ms'); }
} catch {}

// Plays an animation and resolves when it ends (or when the safety timer runs out).
export function play(el, frames, opts = {}) {
  if (!el || !el.animate || calm()) return Promise.resolve();
  try {
    const o = { duration: 300, easing: 'ease', ...opts };
    const a = el.animate(frames, o);
    const done = new Promise((r) => { a.onfinish = r; a.oncancel = r; });
    const timer = new Promise((r) => setTimeout(r, o.duration + (o.delay || 0) + 120));
    return Promise.race([done, timer]).then(() => { try { a.finish(); } catch {} });
  } catch { return Promise.resolve(); }
}
const sp = (name, extra) => ({ duration: SPRING[name].duration, easing: SPRING[name].easing, ...extra });

// ---------- small pieces ----------
export const shake = (el) => play(el, [
  { transform: 'translateX(0)' }, { transform: 'translateX(-11px)' }, { transform: 'translateX(9px)' },
  { transform: 'translateX(-6px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' },
], { duration: 460, easing: 'cubic-bezier(.36,.07,.19,.97)' });

export const bump = (el, k = 1.18) => play(el, [{ transform: 'scale(1)' }, { transform: `scale(${k})`, offset: 0.35 }, { transform: 'scale(1)' }], sp('snappy', { duration: 360 }));

export const nudgeDown = (el) => play(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)' });

// A number that rolls to its new value like a counter (old one slides out, new one slides in).
// several things rise into place one after another (each starts a little lower and see-through)
export function rise(els, { delay = 0, step = 45, y = 12 } = {}) {
  [...(els || [])].forEach((el, i) => play(el, [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }],
    { duration: SPRING.gentle.duration, easing: SPRING.gentle.easing, delay: delay + i * step, fill: 'backwards' }));
}

export function roll(el, text) {
  if (!el) return;
  const old = el.textContent;
  if (old === text) return;
  el.textContent = text;
  if (calm() || !old || old === ' ') return;
  const up = parseFloat(String(text).replace(/[^\d.-]/g, '')) >= parseFloat(String(old).replace(/[^\d.-]/g, ''));
  play(el, [{ transform: `translateY(${up ? 60 : -60}%)` }, { transform: 'none' }], sp('smooth'));
}

// ---------- one thing turning into another ----------
// Moves `el` so it seems to start at `from` (a box on screen) and grow into its real place.
export function growFrom(el, from, spring = 'gentle') {
  try {
    if (!el || !from || calm()) return Promise.resolve();
    const to = el.getBoundingClientRect();
    if (!to.width || !from.width) return Promise.resolve();
    const dx = from.left - to.left, dy = from.top - to.top, sx = from.width / to.width, sy = from.height / to.height;
    return play(el, [
      { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transformOrigin: '0 0', transform: 'none' },
    ], sp(spring));
  } catch { return Promise.resolve(); }
}

// A copy of `target` flies from the box `from` to where `target` is, then the real one takes over.
// Used when the small QR in a row grows into the big one, and when a new QR flies into its row.
export function fly(from, target, { spring = 'gentle', radiusFrom = null } = {}) {
  try {
    if (!target || !from || calm()) return Promise.resolve();
    const to = target.getBoundingClientRect();
    if (!to.width || !from.width) return Promise.resolve();
    const ghost = target.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
      position: 'fixed', left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px',
      margin: '0', zIndex: '90', pointerEvents: 'none', transformOrigin: '0 0', boxSizing: 'border-box',
    });
    document.body.appendChild(ghost);
    target.style.visibility = 'hidden';
    const dx = from.left - to.left, dy = from.top - to.top, sx = from.width / to.width, sy = from.height / to.height;
    const r0 = radiusFrom != null ? radiusFrom / sx : null;
    const rest = getComputedStyle(target).borderRadius;
    const a = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, b = { transform: 'none' };
    if (r0 != null) { a.borderRadius = r0 + 'px'; b.borderRadius = rest; }
    const end = () => { try { ghost.remove(); } catch {} target.style.visibility = ''; };
    setTimeout(end, SPRING[spring].duration + 400); // the safety timer
    return play(ghost, [a, b], sp(spring)).then(end, end);
  } catch { try { target.style.visibility = ''; } catch {} return Promise.resolve(); }
}

// Changes what is inside `box` and lets its height glide from the old size to the new one.
export function resize(box, change, spring = 'smooth') {
  const h0 = box ? box.getBoundingClientRect().height : 0;
  change();
  try {
    if (!box || calm()) return Promise.resolve();
    const h1 = box.getBoundingClientRect().height;
    if (Math.abs(h1 - h0) < 2) return Promise.resolve();
    const was = box.style.overflow;
    box.style.overflow = 'hidden';
    return play(box, [{ height: h0 + 'px' }, { height: h1 + 'px' }], sp(spring)).then(() => { box.style.overflow = was; });
  } catch { return Promise.resolve(); }
}

// A sheet leaving: it sinks and the veil clears, then it is hidden.
export function leave(sheet, veil) {
  if (calm() || !sheet) return Promise.resolve();
  const phone = innerWidth <= 760;
  return Promise.all([
    play(sheet, [{ transform: 'none' }, { transform: phone ? 'translateY(70%)' : 'translateY(14px) scale(.95)', opacity: phone ? 1 : 0 }], { duration: phone ? 260 : 190, easing: 'cubic-bezier(.4,0,1,1)' }),
    veil ? play(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: phone ? 260 : 200, easing: 'ease-in' }) : null,
  ]);
}

// A row leaving the list (archived or deleted): it slides aside, then the list closes the gap.
export const slideAway = (el) => play(el, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-28px)', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)' });

// Light / dark: the new look spreads out in a circle from the button you pressed.
export function themeSwitch(x, y, apply) {
  if (calm() || !document.startViewTransition) { apply(); return; }
  try {
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement;
    root.classList.add('vt-theme');
    const t = document.startViewTransition(() => apply());
    t.finished.finally(() => root.classList.remove('vt-theme'));
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 560, easing: 'cubic-bezier(.3,.7,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  } catch { apply(); }
}
