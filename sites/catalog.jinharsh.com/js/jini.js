// Jini, the Jinharsh helper you can see: a small person with a headset who lives on the catalogue pages. She walks
// in and waves when someone arrives, breathes and blinks while waiting, strolls to another corner now and then
// (looking the way she walks), says a short tip in a speech bubble, can be picked up and put anywhere, and opens the
// chat when tapped. "Reduce motion" on the phone keeps her standing still (she still blinks and talks).
//   jiniSvg()                         the drawing alone (also used in the chat and the goodbye)
//   startJini({ onOpen, tips })       -> { say(text, ms), hide(), show(), wave() }
import * as M from './motion.js';

export const jiniSvg = (cls = '') => `<svg class="jini-svg ${cls}" viewBox="0 0 80 112" aria-hidden="true">
  <ellipse class="j-shadow" cx="40" cy="108" rx="17" ry="3.2"/>
  <g class="j-all">
    <g class="j-leg j-leg-l"><rect x="31" y="74" width="8" height="26" rx="4" fill="#2f3542"/><ellipse cx="34.5" cy="101" rx="6" ry="3.4" fill="#1e222b"/></g>
    <g class="j-leg j-leg-r"><rect x="41" y="74" width="8" height="26" rx="4" fill="#2f3542"/><ellipse cx="45.5" cy="101" rx="6" ry="3.4" fill="#1e222b"/></g>
    <g class="j-arm j-arm-l"><rect x="17" y="49" width="8.5" height="25" rx="4.25" fill="#c2410c"/><circle cx="21.2" cy="75" r="4.3" fill="#f0c19a"/></g>
    <rect x="23" y="46" width="34" height="33" rx="11" fill="#c2410c"/>
    <path d="M33 46 L40 55 L47 46 Z" fill="#fff"/>
    <circle cx="48" cy="62" r="2.6" fill="#fff" opacity=".9"/>
    <rect x="36" y="39" width="8" height="9" rx="3" fill="#e9b48a"/>
    <g class="j-arm j-arm-r"><rect x="54.5" y="49" width="8.5" height="25" rx="4.25" fill="#c2410c"/><circle cx="58.8" cy="75" r="4.3" fill="#f0c19a"/></g>
    <g class="j-head">
      <circle cx="26.3" cy="29" r="3.2" fill="#e9b48a"/><circle cx="53.7" cy="29" r="3.2" fill="#e9b48a"/>
      <circle cx="40" cy="27" r="14.5" fill="#f0c19a"/>
      <path d="M25.5 26 C25 13 33 9.5 40.5 9.8 C49 10 56 15 54.6 26.5 C52 21 47 18.4 40 18.6 C33 18.8 28.6 21 25.5 26 Z" fill="#33241b"/>
      <path d="M50 13.5 C56 16 58 24 56.6 31 C56 36 53.5 40 51 41 C53 35 53.8 29 52.6 23 Z" fill="#33241b"/>
      <g class="j-eyes"><ellipse cx="34.6" cy="28.6" rx="1.9" ry="2.3" fill="#1f1a17"/><ellipse cx="45.4" cy="28.6" rx="1.9" ry="2.3" fill="#1f1a17"/>
        <circle cx="35.2" cy="27.8" r=".6" fill="#fff"/><circle cx="46" cy="27.8" r=".6" fill="#fff"/></g>
      <path d="M31.5 24.2 Q34.6 22.6 37.4 24" stroke="#33241b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M42.6 24 Q45.4 22.6 48.5 24.2" stroke="#33241b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <circle cx="31.4" cy="33.2" r="2.4" fill="#f08a7a" opacity=".35"/><circle cx="48.6" cy="33.2" r="2.4" fill="#f08a7a" opacity=".35"/>
      <path class="j-mouth" d="M36 34.2 Q40 37.8 44 34.2 Q40 36 36 34.2 Z" fill="#9c3b2a" stroke="#9c3b2a" stroke-width="1" stroke-linejoin="round"/>
      <path d="M24.6 27 C24.6 14.8 31.6 8.2 40 8.2 C48.4 8.2 55.4 14.8 55.4 27" stroke="#20242c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="21.6" y="24" width="5.4" height="9" rx="2.4" fill="#20242c"/><rect x="53" y="24" width="5.4" height="9" rx="2.4" fill="#20242c"/>
      <path d="M55.6 32 C55 36.6 51.6 38.6 46.6 38.4" stroke="#20242c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <circle cx="45.8" cy="38.4" r="1.7" fill="#20242c"/>
    </g>
  </g>
</svg>`;

const calmNow = () => M.calm();
const EDGE = 14;

export function startJini({ onOpen = () => {}, tips = [], hello = '', name = 'Jini' } = {}) {
  const el = document.createElement('div');
  el.className = 'jini';
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.setAttribute('aria-label', `Chat with ${name}, the Jinharsh helper`);
  el.innerHTML = `<div class="jini-say" aria-hidden="true" hidden></div><div class="jini-body">${jiniSvg()}</div>`;
  document.body.appendChild(el);
  const bubble = el.querySelector('.jini-say');
  const W0 = () => el.offsetWidth || 76, H0 = () => el.offsetHeight || 106;   // (smaller on phones)
  let x = 0, y = 0, hidden = false, manualUntil = 0, wanderT = 0, sayT = 0, tipsShown = 0, moving = false;
  const store = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch {} return null; };
  const phone = () => innerWidth < 760;

  // where she may stand: the bottom corners, a bit in from the right, and (on wide screens) halfway up either side
  const spots = () => {
    const vw = innerWidth, vh = innerHeight, W = W0(), H = H0(), b = vh - H - EDGE;
    const list = [[vw - W - EDGE, b], [EDGE, b]];
    if (!phone()) list.push([Math.round(vw * 0.7), b], [vw - W - EDGE, Math.round(vh * 0.52 - H / 2)]);
    if (vw >= 1180) list.push([EDGE, Math.round(vh * 0.52 - H / 2)]);
    return list;
  };
  const clamp = () => { x = Math.max(EDGE, Math.min(innerWidth - W0() - EDGE, x)); y = Math.max(70, Math.min(innerHeight - H0() - EDGE, y)); };
  const place = (ms = 0) => { el.style.transition = ms ? `transform ${ms}ms linear` : 'none'; el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  const face = (tx) => { if (Math.abs(tx - x) > 4) el.classList.toggle('to-left', tx < x); };

  function walkTo(tx, ty, then) {
    if (calmNow()) { x = tx; y = ty; clamp(); place(); if (then) then(); return; }
    const d = Math.hypot(tx - x, ty - y);
    if (d < 4) { if (then) then(); return; }
    face(tx);
    const ms = Math.round(Math.min(5200, Math.max(700, d / 0.14)));   // an easy stroll, about 140 px a second
    moving = true;
    el.classList.add('walk');
    hideSay();
    x = tx; y = ty; clamp(); place(ms);
    clearTimeout(walkTo.t);
    walkTo.t = setTimeout(() => { moving = false; el.classList.remove('walk'); store('jd_jini_pos', JSON.stringify([x / innerWidth, y / innerHeight])); if (then) then(); }, ms);
  }
  function wave(n = 2) { el.classList.remove('wave'); void el.offsetWidth; el.style.setProperty('--waves', n); el.classList.add('wave'); clearTimeout(wave.t); wave.t = setTimeout(() => el.classList.remove('wave'), 1100 * n); }
  function say(text, ms = 6500) {
    if (hidden || !text) return;
    bubble.innerHTML = text;
    bubble.hidden = false;
    // the bubble opens towards the middle of the screen
    el.classList.toggle('say-right', x < innerWidth / 2);
    el.classList.toggle('say-below', y < 180);
    M.play(bubble, [{ opacity: 0, transform: 'translateY(6px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1.25)' });
    el.classList.add('talk');
    clearTimeout(say.talkT); say.talkT = setTimeout(() => el.classList.remove('talk'), Math.min(2600, 500 + text.replace(/<[^>]+>/g, '').length * 40));
    clearTimeout(sayT); sayT = setTimeout(hideSay, ms);
  }
  function hideSay() {
    if (bubble.hidden) return;
    clearTimeout(sayT);
    M.play(bubble, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(4px) scale(.96)' }], { duration: 200 }).then(() => { bubble.hidden = true; });
  }

  // now and then she strolls somewhere else, and sometimes has a tip on arrival
  function wander() {
    clearTimeout(wanderT);
    wanderT = setTimeout(() => {
      if (hidden || moving || document.hidden || Date.now() < manualUntil || calmNow()) { wander(); return; }
      const options = spots().filter(([sx, sy]) => Math.hypot(sx - x, sy - y) > 60);
      const [tx, ty] = options[Math.floor(Math.random() * options.length)] || spots()[0];
      walkTo(tx, ty, () => {
        const tipOk = tipsShown < 3 && +(store('jd_jini_tips') || 0) < 8 && tips.length && Math.random() < 0.6;
        if (tipOk) {
          tipsShown++; store('jd_jini_tips', String(+(store('jd_jini_tips') || 0) + 1));
          wave(1);
          say(tips[(tipsShown - 1) % tips.length]);
        } else if (Math.random() < 0.4) wave(1);
        wander();
      });
    }, 22000 + Math.random() * 20000);
  }

  // arriving: the first page of a visit, she walks in from the side and says hello; after that she is where she was
  const saved = (() => { try { return JSON.parse(store('jd_jini_pos') || 'null'); } catch { return null; } })();
  const first = !store('jd_jini_hi');
  const [hx, hy] = spots()[0];
  if (first && !calmNow()) {
    store('jd_jini_hi', '1');
    x = innerWidth + 10; y = hy; place();
    el.classList.add('to-left');
    setTimeout(() => walkTo(hx, hy, () => { el.classList.remove('to-left'); wave(3); say(hello || `Hi! I'm ${name} from Jinharsh 👋 Looking for a part? Tap me.`, 7500); wander(); }), 900);
  } else {
    if (saved) { x = saved[0] * innerWidth; y = saved[1] * innerHeight; } else { x = hx; y = hy; }
    clamp(); place();
    if (first) store('jd_jini_hi', '1');
    setTimeout(() => wave(1), 700);
    wander();
  }

  // pick her up and put her anywhere; a tap (no drag) opens the chat
  let drag = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { sx: e.clientX, sy: e.clientY, ox: e.clientX - x, oy: e.clientY - y, moved: false, id: e.pointerId };
  });
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
    if (!drag.moved) { drag.moved = true; el.classList.add('held'); el.classList.remove('walk'); hideSay(); try { el.setPointerCapture(e.pointerId); } catch {} }
    x = e.clientX - drag.ox; y = e.clientY - drag.oy; place();
  });
  const drop = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const was = drag; drag = null;
    if (!was.moved) { open(); return; }
    el.classList.remove('held');
    clamp(); place(240);
    manualUntil = Date.now() + 120000;   // she stays where she was put for a while
    store('jd_jini_pos', JSON.stringify([x / innerWidth, y / innerHeight]));
    setTimeout(() => { wave(1); say('Here is good! 😊', 2200); }, 260);
  };
  addEventListener('pointerup', drop);
  addEventListener('pointercancel', () => { if (drag) { drag = null; el.classList.remove('held'); } });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !moving && bubble.hidden) { wave(1); say('Need help? Click me to chat.', 2600); } });
  function open() { hideSay(); onOpen(); }

  // a quick shake of the phone (with 3D on, depth.js) calls her: she waves and asks what they are looking for
  addEventListener('jd:shake', () => {
    if (hidden) return;
    manualUntil = Date.now() + 60000;
    wave(3);
    say('You shook the phone! 😊 What are you looking for? Tap me and tell me.', 7000);
  });

  // she glances up when the page scrolls
  let scrollT = 0;
  addEventListener('scroll', () => { el.classList.add('look'); clearTimeout(scrollT); scrollT = setTimeout(() => el.classList.remove('look'), 600); }, { passive: true });
  addEventListener('resize', () => { clamp(); place(); });

  return {
    say, wave,
    hide() { hidden = true; hideSay(); el.classList.add('gone'); },
    show() { hidden = false; el.classList.remove('gone'); clamp(); place(); setTimeout(() => wave(1), 250); },
  };
}
