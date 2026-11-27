// Spatial 3D, like the iPhone's "spatial" lock screen. With it on, the page is a scene in layers: the sky far
// behind, the cards and their covers lifted off the page, the round buttons and the big title nearest. Tilting the
// phone (or, on a computer, moving the mouse) moves each layer by its own amount, so the page has real depth.
// It moves on springs, so it feels like an object with weight rather than a picture sliding about; the phone's
// own sensor shake is smoothed away first. Nothing glows or shines: only the layers move (css/depth.css, which is
// fetched only once someone turns 3D on).
//   - home: the newest covers stand behind the big title and one in front of it, like the clock on the lock screen
//   - each catalogue: the next pages stand behind the cover like a real book, and fan out as it tilts
//   - Jini sways as the phone tilts; a quick shake of the phone calls her (the "jd:shake" event, jini.js)
// It is OFF until the person turns it on with the 3D switch (under the search box, under a catalogue's cover, in
// the Team Portal's top bar). The switch is on every device: phones and tablets tilt, computers follow the mouse,
// and a device with no motion sensor gets a slow, gentle drift instead. It shows even when the device asks for calm
// motion ("reduce motion", which many Android phones turn on with battery saver): the 3D only ever runs when the
// person turns it on themselves. iPhones ask once for "Motion & Orientation". The choice is kept on this device
// (theme-boot.js reads it early, so the home page keeps room for its scene from the first paint).
import * as M from './motion.js';

const KEY = 'jd_tilt';
const RANGE = 14;   // degrees of tilt for the full effect
const ICON = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="m15.194 13.707 3.814 1.86-1.86 3.814"/><path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"/><path d="M21.79796 11 A 10 5 0 1 0 19 15.57071"/></svg>';   // (Lucide rotate-3d, ISC)
const root = document.documentElement;
const toast = (t) => { try { window.JUI.toast(t); } catch {} };
const saved = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const keep = (on) => { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch {} };
const mm = (q) => { try { return matchMedia(q).matches; } catch { return false; } };
const mouseDemo = () => { try { return new URLSearchParams(location.search).get('tilt') === 'mouse'; } catch { return false; } };
// phones and tablets tilt; computers (a mouse or trackpad is the main pointer) use the mouse
const tilts = () => 'DeviceOrientationEvent' in window && mm('(pointer: coarse)') && !mouseDemo();
const mouses = () => mouseDemo() || (mm('(hover: hover) and (pointer: fine)') && !mm('(pointer: coarse)'));
const asksFirst = () => typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
const clamp1 = (v) => Math.max(-1, Math.min(1, v));

// ---------- springs ----------
// --tx / --ty (-1 to 1) say where the viewer is: +x = seen from the right, +y = seen from below.
// --lift: 0 = flat, 1 = the layers lifted apart. Each has a goal and moves to it on a spring.
const spring = (k, zeta) => ({ x: 0, v: 0, g: 0, k, c: 2 * Math.sqrt(k) * zeta });
const TX = spring(64, 0.74), TY = spring(64, 0.74), LIFT = spring(38, 0.8);
let raf = 0, last = 0, running = false, how = '', got = false, drifting = false, base = null, fx = 0, fy = 0, lastT = 0, cssP = null;
function frame(now) {
  raf = 0;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  last = now;
  let busy = false;
  if (drifting) {   // (no motion sensor: the scene sways slowly by itself)
    const t = now / 1000;
    TX.g = 0.5 * Math.sin(t * 0.6);
    TY.g = 0.36 * Math.sin(t * 0.45 + 1.3);
    busy = running;
  }
  for (const s of [TX, TY, LIFT]) {
    s.v += (s.k * (s.g - s.x) - s.c * s.v) * dt;
    s.x += s.v * dt;
    if (Math.abs(s.g - s.x) > 0.0004 || Math.abs(s.v) > 0.0004) busy = true;
    else { s.x = s.g; s.v = 0; }
  }
  write();
  if (busy) raf = requestAnimationFrame(frame);
  else { last = 0; if (!running && LIFT.x === 0) teardown(); }
}
function write() {
  root.style.setProperty('--tx', TX.x.toFixed(4));
  root.style.setProperty('--ty', TY.x.toFixed(4));
  root.style.setProperty('--lift', LIFT.x.toFixed(4));
}
const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

// ---------- what moves it ----------
function onTurn(e) {
  if (e.beta == null || e.gamma == null) return;
  got = true;
  drifting = false;   // (readings after all: they take over from the drift)
  // held sideways: the readings turn with the screen
  const o = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0);
  const a = ((o % 360) + 360) % 360;
  let x = e.gamma, y = e.beta;
  if (a === 90) { x = e.beta; y = -e.gamma; } else if (a === 270) { x = -e.beta; y = e.gamma; } else if (a === 180) { x = -e.gamma; y = -e.beta; }
  const t = performance.now(), dt = lastT ? Math.min(0.25, (t - lastT) / 1000) : 0;
  lastT = t;
  if (!base || Math.abs(x - fx) > 45 || Math.abs(y - fy) > 45) { base = { x, y }; fx = x; fy = y; }
  // the sensor's own tremble, smoothed away; then the middle slowly follows however the phone is held
  // (over a few seconds), so the scene always settles back to rest
  fx += (x - fx) * 0.45; fy += (y - fy) * 0.45;
  const f = 1 - Math.exp(-dt / 3.2);
  base.x += (fx - base.x) * f; base.y += (fy - base.y) * f;
  TX.g = clamp1((fx - base.x) / RANGE); TY.g = clamp1((fy - base.y) / RANGE);
  kick();
}
function onMouse(e) {
  if (e.pointerType === 'touch') return;
  TX.g = clamp1((e.clientX / innerWidth - 0.5) * 2) * 0.85;
  TY.g = clamp1((e.clientY / innerHeight - 0.5) * 2) * 0.85;
  kick();
}
function onLeave(e) { if (!e.relatedTarget) { TX.g = 0; TY.g = 0; kick(); } }   // (the mouse left the window)
// a quick shake (three hard jolts within a second) calls Jini
let jolts = [], lastShake = -Infinity;
function onMotion(e) {
  const a = e.acceleration;
  if (!a || a.x == null) return;
  const t = performance.now(), m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  if (m > 15 && (!jolts.length || t - jolts[jolts.length - 1] > 110)) jolts.push(t);
  jolts = jolts.filter((s) => t - s < 1000);
  if (jolts.length >= 3 && t - lastShake > 5000) { lastShake = t; jolts = []; dispatchEvent(new CustomEvent('jd:shake')); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) base = null; });

// ---------- the scenes ----------
const loadCss = () => cssP || (cssP = new Promise((ok) => {
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = new URL('../css/depth.css', import.meta.url).href;
  l.onload = ok; l.onerror = ok;
  document.head.appendChild(l);
  setTimeout(ok, 4000);
}));
// home: the newest covers behind the big title, one in front of it
function heroScene() {
  const hero = document.querySelector('.hub-hero'), h1 = hero && hero.querySelector('h1');
  if (!h1 || hero.querySelector('.hero-scene')) return;
  const srcs = [...document.querySelectorAll('.cat-card:not(.ghost-card) .cc-cover > img')].map((i) => i.currentSrc || i.getAttribute('src')).filter(Boolean);
  if (srcs.length < 3) return;
  const el = document.createElement('div');
  el.className = 'hero-scene';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = srcs.slice(0, 3).map((s, i) => `<img class="hs-back b${i}" src="${s}" alt="" decoding="async">`).join('')
    + (srcs[3] ? `<img class="hs-front" src="${srcs[3]}" alt="" decoding="async">` : '');
  h1.insertAdjacentElement('beforebegin', el);
}
// a catalogue: its next pages behind the cover, like a real book
function coverStack() {
  const box = document.querySelector('.v-cover[data-previews]'), img = box && box.querySelector(':scope > img');
  const from = box && box.dataset.previews, n = box ? Number(box.dataset.pages) || 0 : 0;
  if (!img || !from || n < 2 || box.querySelector('.v-stack')) return;
  const st = document.createElement('div');
  st.className = 'v-stack';
  st.setAttribute('aria-hidden', 'true');
  st.innerHTML = [2, 3, 4].filter((i) => i <= n).map((i, k) => `<img class="vs-page p${k}" src="${from}${i}.webp" alt="" decoding="async">`).join('');
  img.insertAdjacentElement('afterend', st);   // (after the cover, so the page's own code still finds the cover first)
  const fit = () => { st.style.cssText = `left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${img.offsetWidth}px;height:${img.offsetHeight}px`; };
  fit();
  try { const ro = new ResizeObserver(fit); ro.observe(img); st._ro = ro; } catch {}
}
function teardown() {
  root.classList.remove('depth', 'depth-pre');
  for (const p of ['--tx', '--ty', '--lift']) root.style.removeProperty(p);
  document.querySelectorAll('.hero-scene, .v-stack').forEach((e) => { try { e._ro && e._ro.disconnect(); } catch {} e.remove(); });
}

// ---------- on and off ----------
function start() {
  if (running) return;
  running = true; got = how !== 'tilt'; base = null; lastT = 0;
  drifting = how === 'drift';
  if (how === 'mouse') { addEventListener('pointermove', onMouse, { passive: true }); document.addEventListener('mouseout', onLeave); }
  else if (how === 'tilt') { addEventListener('deviceorientation', onTurn); addEventListener('devicemotion', onMotion); }
  const pre = root.classList.contains('depth-pre');   // (remembered: the home page kept room for its scene)
  loadCss().then(() => {
    if (!running) return;
    heroScene(); coverStack();
    if (pre) { LIFT.x = 1; LIFT.v = 0; }
    write();   // (the values first, in the same frame as the look: nothing jumps)
    root.classList.add('depth');
    root.classList.remove('depth-pre');
    LIFT.g = 1;
    kick();
  });
}
function stop() {
  running = false; drifting = false;
  removeEventListener('pointermove', onMouse); document.removeEventListener('mouseout', onLeave);
  removeEventListener('deviceorientation', onTurn); removeEventListener('devicemotion', onMotion);
  TX.g = 0; TY.g = 0; LIFT.g = 0;
  if (root.classList.contains('depth')) kick(); else teardown();   // the layers settle back flat, then the 3D is taken off
}
// iPhones: Motion & Orientation (asked on a tap; the shake needs the motion half)
async function ask() {
  const D = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function' ? DeviceMotionEvent.requestPermission() : null;
  const O = DeviceOrientationEvent.requestPermission();
  if (D) D.catch(() => {});
  try { return (await O) === 'granted'; } catch { return false; }
}

// ---------- the switch ----------
// { after: element } puts the switch under it; { inside: element } at the end of it; { before: element, icon: true }
// puts a round icon button before it (a top bar)
const switches = [];
const paint = () => switches.forEach((b) => b.setAttribute('aria-checked', String(running)));
export function depthSwitch({ after = null, inside = null, before = null, icon = false } = {}) {
  how = tilts() ? 'tilt' : mouses() ? 'mouse' : 'drift';
  if (!(after || inside || before) || switches.some((b) => b.isConnected)) return;
  const label = how === 'tilt' ? 'Tilt for 3D' : '3D view';
  const tip = how === 'tilt' ? '3D: tilt the phone to see the page in depth' : how === 'mouse' ? '3D: move the mouse to see the page in depth' : '3D: see the page in depth';
  let b, row = null;
  if (icon) {
    b = document.createElement('button');
    b.className = 'ju-icon tilt-ic';
    b.setAttribute('aria-label', label);
    b.title = tip;
    b.innerHTML = ICON;
    before.insertAdjacentElement('beforebegin', b);
  } else {
    row = document.createElement('div');
    row.className = 'tilt-row';
    row.innerHTML = `<button type="button" class="ju-chip tilt-sw" title="${tip}">${ICON}<span>${label}</span><span class="tg" aria-hidden="true"></span></button>`;
    if (after) after.insertAdjacentElement('afterend', row); else inside.appendChild(row);
    b = row.firstElementChild;
  }
  b.type = 'button';
  b.setAttribute('role', 'switch');
  switches.push(b);
  // no readings soon after it starts: an iPhone that wants a tap again, or no motion sensor at all (then it drifts)
  const check = (fromTap) => setTimeout(() => {
    if (!running || got || how !== 'tilt') return;
    if (asksFirst() && !fromTap) {
      // the first touch anywhere asks again (quietly, if the phone already said yes)
      const again = () => { removeEventListener('touchend', again, true); ask().then((ok) => { if (!ok && running && !got) { stop(); paint(); } }); };
      addEventListener('touchend', again, true);
      return;
    }
    drifting = true; kick();
    if (fromTap) toast('This device has no motion sensor, so the 3D sways gently by itself.');
  }, 1600);
  b.addEventListener('click', async () => {
    try { M.bump(b, 1.06); } catch {}
    if (running) { stop(); keep(false); paint(); return; }
    if (how === 'tilt' && asksFirst()) {
      // (asking must be the very first thing the tap does, or the iPhone will not ask)
      if (!(await ask())) { toast('Motion was not allowed. Close Safari, open the page again, tap Tilt for 3D and choose Allow.'); return; }
    }
    start(); keep(true); paint();
    check(true);
  });
  if (saved() && !running) { start(); paint(); check(false); }
  else if (running) paint();
  else root.classList.remove('depth-pre');
}
