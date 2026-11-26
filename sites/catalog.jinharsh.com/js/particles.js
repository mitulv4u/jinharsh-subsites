// The QR code as particles: every square breaks into tiny grains that collapse into a swirling cluster, then fly
// out and land as the finished code; and a mouse or a finger moving over a code pushes the grains apart.
//
//   const p = collapseFrom(tileEl, link);   // the grains of an existing QR collapse into a cluster (it keeps swirling)
//   p.into(newTileEl, newLink);             // ...then burst out and become another QR
//   assemble(tileEl, link);                 // scattered grains collapse and come together as this QR
//   enableHoverScatter();                   // mouse / finger over any .qr-tile[data-link] pushes its grains apart
//
// Rules kept: the real QR is always in the page underneath (only hidden while the grains fly) and a timer always
// brings it back, so a paused or slow browser still ends with the finished, scannable code. "Reduce motion" = none of this.
import { makeQR } from './qr.js';
import { calm } from './motion.js';

const ORANGE = [234, 88, 12], INK = [17, 17, 19];
const MAX_IDLE_MS = 60000;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// lands with a small overshoot, like a spring
const easeOutBack = (t) => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// one formula for the collapse and the swirl after it, so the cluster never jumps
const swirlAngle = (p, el, e) => p.ang + p.spin * (1.4 * e + (el / 900) * e);
const colour = (t) => `rgb(${Math.round(lerp(ORANGE[0], INK[0], t))},${Math.round(lerp(ORANGE[1], INK[1], t))},${Math.round(lerp(ORANGE[2], INK[2], t))})`;
// ---------- how much the phone can take ----------
// Slower phones get lighter effects: about half the grains, and the see-through drawing layers at a lower
// resolution. Decided from what the phone says about itself (processor cores, memory, data saver) and from how
// smoothly the effects really run: if frames keep arriving late, everything after switches to the lighter kind,
// and the phone is remembered for a week. html.lite also turns off the frosted blur (see app.css).
const LITE_KEY = 'jd-lite';
export const perf = { lite: false };
try {
  const nav = navigator, cores = nav.hardwareConcurrency || 8, mem = nav.deviceMemory || 8;
  const save = !!(nav.connection && nav.connection.saveData);
  let seen = 0;
  try { seen = Number(localStorage.getItem(LITE_KEY)) || 0; } catch {}
  perf.lite = save || mem <= 3 || cores <= 4 || Date.now() - seen < 7 * 864e5;
  if (perf.lite) document.documentElement.classList.add('lite');
} catch {}
function goLite() {
  if (perf.lite) return;
  perf.lite = true;
  try { document.documentElement.classList.add('lite'); } catch {}
  try { localStorage.setItem(LITE_KEY, String(Date.now())); } catch {}
}
// every animation frame passes through here; 9 late frames (under 25 a second) out of 24 = a slow phone
let lastFrame = 0, frames = 0, late = 0;
function frameCheck(now) {
  if (perf.lite || !now || now === lastFrame) return;
  const d = now - lastFrame;
  lastFrame = now;
  if (d > 250 || document.visibilityState !== 'visible') { frames = late = 0; return; } // asleep, not slow
  frames++;
  if (d > 40) late++;
  if (frames >= 24) { if (late >= 9) goLite(); frames = late = 0; }
}
const many = (n) => (perf.lite ? Math.max(12, Math.round(n * 0.45)) : n);          // fewer loose grains
const fewerCols = (c) => (perf.lite ? Math.max(16, Math.round(c * 0.68)) : c);   // about half the cells
const layerDpr = () => Math.min(window.devicePixelRatio || 1, perf.lite ? 1.25 : 2);
// how many grains along each side of one QR square: 2 x 2 on phones, 3 x 3 when the squares are big
// (one grain per square, or 2 x 2 for big ones, on slower phones)
const grainsPer = (k) => (perf.lite ? (k >= 7 ? 2 : 1) : (k >= 7 ? 3 : 2));
const GRAIN = 1.8; // size of a loose grain while it flies

// where every grain of the QR inside `tile` sits on screen (each dark square split into grainsPer x grainsPer)
function cellsOf(tile, link) {
  const svg = tile && tile.querySelector('svg');
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  if (!r.width) return null;
  const q = makeQR(link, true), margin = 4, k = r.width / (q.n + margin * 2);
  const g = grainsPer(k), ks = k / g;
  const cells = [];
  for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (q.dark(y, x)) {
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) cells.push({ x: r.left + (x + margin) * k + i * ks, y: r.top + (y + margin) * k + j * ks });
  }
  return { cells, k, ks, cx: r.left + r.width / 2, cy: r.top + r.height / 2, size: r.width, svg };
}

function makeCanvas() {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', zIndex: '95', pointerEvents: 'none' });
  const dpr = layerDpr();
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  const g = cv.getContext('2d');
  document.body.appendChild(cv);
  return { cv, g, dpr };
}

// draws a grain on whole screen pixels, so neighbouring grains meet without light seams
function grain(g, dpr, x, y, s) {
  const X = Math.round(x * dpr), Y = Math.round(y * dpr);
  g.fillRect(X, Y, Math.max(1, Math.round((x + s) * dpr) - X), Math.max(1, Math.round((y + s) * dpr) - Y));
}

function hide(svg) { if (svg) svg.style.visibility = 'hidden'; }
function show(svg) { if (svg) svg.style.visibility = ''; }

// One swarm of grains living on a see-through layer over the page.
function swarm() {
  let canvas = null, raf = 0, parts = [], mode = 'idle', t0 = 0, cluster = { x: 0, y: 0 }, ended = false, onDone = null;
  const hidden = new Set();
  const safety = setTimeout(() => finish(), MAX_IDLE_MS);

  function finish() {
    if (ended) return; ended = true;
    cancelAnimationFrame(raf); clearTimeout(safety);
    hidden.forEach(show); hidden.clear();
    if (canvas) canvas.cv.remove();
    if (onDone) onDone();
  }

  function frame(now) {
    if (ended) return;
    frameCheck(now);
    const g = canvas.g, dpr = canvas.dpr;
    g.clearRect(0, 0, canvas.cv.width, canvas.cv.height);
    const el = now - t0;
    let busy = false;
    for (const p of parts) {
      let x, y, s, c, a = 1;
      if (mode === 'collapse' || mode === 'swirl') {
        // towards the cluster, then a slow swirl around it
        const t = clamp01((el - p.delay) / 520);
        const e = easeInOut(t);
        const ang = swirlAngle(p, el, e);
        const cxp = cluster.x + Math.cos(ang) * p.orbit, cyp = cluster.y + Math.sin(ang) * p.orbit * 0.82;
        x = lerp(p.sx, cxp, e); y = lerp(p.sy, cyp, e);
        s = lerp(p.s0, GRAIN, e); c = colour(lerp(p.c0, 0, e));
        if (t < 1) busy = true;
      } else if (mode === 'burst') {
        const t = clamp01((el - p.delay) / p.dur);
        const e = easeOutBack(t);
        x = lerp(p.sx, p.tx, e); y = lerp(p.sy, p.ty, e);
        s = lerp(GRAIN, p.ts, clamp01(t * 1.3)); c = colour(clamp01(t * 1.4));
        if (p.extra) { a = 1 - clamp01(t * 1.5); s = GRAIN * a; }
        if (t < 1) busy = true;
      }
      if (a <= 0 || s <= 0) continue;
      g.globalAlpha = a; g.fillStyle = c;
      grain(g, dpr, x, y, s);
    }
    g.globalAlpha = 1;
    if (mode === 'collapse' && !busy) { mode = 'swirl'; }
    if (mode === 'burst' && !busy) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  function start(m) { mode = m; t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }

  // current on-screen position of each grain (so the next move starts exactly where it is)
  function snapshot() {
    const el = performance.now() - t0;
    for (const p of parts) {
      if (mode === 'collapse' || mode === 'swirl') {
        const e = easeInOut(clamp01((el - p.delay) / 520));
        const ang = swirlAngle(p, el, e);
        p.sx = lerp(p.sx, cluster.x + Math.cos(ang) * p.orbit, e); p.sy = lerp(p.sy, cluster.y + Math.sin(ang) * p.orbit * 0.82, e);
      }
    }
  }

  return {
    // grains of an existing QR (or scattered points) collapse into a cluster at (cx, cy)
    collapse(points, cx, cy, size, svg) {
      if (calm()) { finish(); return this; }
      try {
        canvas = makeCanvas();
        if (svg) { hide(svg); hidden.add(svg); }
        cluster = { x: cx, y: cy };
        const radius = Math.max(16, size * 0.14);
        parts = points.map((pt) => ({
          sx: pt.x, sy: pt.y, s0: pt.s, c0: pt.c0 ?? 1,
          ang: Math.random() * Math.PI * 2, orbit: Math.sqrt(Math.random()) * radius,
          spin: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9),
          delay: Math.random() * 160,
        }));
        start('collapse');
      } catch { finish(); }
      return this;
    },
    // fly out of the cluster and land on the grains of the QR in `tile`
    into(tile, link, done) {
      onDone = done || null;
      if (ended) { if (done) done(); return; }
      try {
        const c = cellsOf(tile, link);
        if (!c) { finish(); return; }
        snapshot();
        hide(c.svg); hidden.add(c.svg);
        // more grains needed than there are: new ones are born in the cluster; too many: the spare ones shrink away
        const targets = c.cells.slice().sort(() => Math.random() - 0.5);
        while (parts.length < targets.length) {
          const b = parts[Math.floor(Math.random() * parts.length)] || { sx: cluster.x, sy: cluster.y };
          parts.push({ sx: b.sx + (Math.random() - 0.5) * 8, sy: b.sy + (Math.random() - 0.5) * 8 });
        }
        const maxD = c.size * 0.75;
        parts.forEach((p, i) => {
          const t = targets[i];
          if (!t) { p.extra = true; p.tx = p.sx; p.ty = p.sy; p.ts = 0; p.delay = 0; p.dur = 300; return; }
          p.tx = t.x; p.ty = t.y; p.ts = c.ks;
          const d = Math.hypot(t.x - c.cx, t.y - c.cy);
          p.delay = (d / maxD) * 260 + Math.random() * 140; // the middle lands first, the edges last
          p.dur = 620 + Math.random() * 240;
        });
        start('burst');
        setTimeout(() => finish(), 1700); // the safety timer: the real QR always comes back
      } catch { finish(); }
    },
    cancel: finish,
    get ended() { return ended; },
  };
}

// The QR already on screen in `tile` breaks into grains that collapse and keep swirling until .into() is called.
export function collapseFrom(tile, link) {
  const s = swarm();
  const c = cellsOf(tile, link);
  if (!c) { s.cancel(); return s; }
  return s.collapse(c.cells.map((p) => ({ x: p.x, y: p.y, s: c.ks + 0.3, c0: 1 })), c.cx, c.cy, c.size, c.svg);
}

// Scattered grains collapse into the middle of `tile`, then come together as its QR.
// With { from: element }, the grains burst out of that element (for example the Share button) instead.
export function assemble(tile, link, { from = null } = {}) {
  const c = cellsOf(tile, link);
  if (!c || calm()) return;
  const s = swarm();
  const R = Math.max(innerWidth, innerHeight) * 0.42;
  const n = Math.min(c.cells.length, perf.lite ? 700 : 1800);
  const fr = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null;
  const pts = Array.from({ length: n }, () => {
    if (fr && fr.width) {
      // out of the button: start inside it, already flung a little outward
      const a = Math.random() * Math.PI * 2, d = Math.random() * 46;
      return { x: fr.left + Math.random() * fr.width + Math.cos(a) * d, y: fr.top + Math.random() * fr.height + Math.sin(a) * d, s: 1 + Math.random() * 2, c0: 0 };
    }
    const a = Math.random() * Math.PI * 2, d = R * (0.4 + Math.random() * 0.6);
    return { x: c.cx + Math.cos(a) * d, y: c.cy + Math.sin(a) * d, s: 1 + Math.random() * 2.2, c0: 0 };
  });
  s.collapse(pts, c.cx, c.cy, c.size, c.svg);
  setTimeout(() => s.into(tile, link), 720);
}

// ---------- a mouse or a finger pushes the grains apart ----------
// On any big QR that carries data-link="...", the grains near a moving mouse (or a finger touching the code)
// scatter away and spring back home. The QR tiles have touch-action: none, so a finger that starts on the code
// moves the grains instead of scrolling the page; elsewhere the page scrolls as always.
// The grains always settle back exactly, so the code still scans once the mouse or finger has gone.
let hoverInstalled = false;
export function enableHoverScatter() {
  if (hoverInstalled) return;
  hoverInstalled = true;
  const begin = (e) => {
    if (calm()) return;
    const tile = e.target && e.target.closest && e.target.closest('.qr-tile[data-link]');
    if (!tile) return;
    if (tile.__scatter) { tile.__scatter.poke(e); return; }
    const svg = tile.querySelector('svg');
    if (!svg || svg.style.visibility === 'hidden') return; // still being assembled by the grains above
    try { tile.__scatter = scatter(tile, svg, tile.dataset.link, e); }
    catch {
      tile.__scatter = null;
      tile.querySelectorAll(':scope > canvas').forEach((c) => c.remove());
      const path = svg.querySelector('path'); if (path) path.style.visibility = '';
    }
  };
  document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') begin(e); }, { passive: true });
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !e.target?.closest?.('.qr-tile[data-link]')?.__scatter) begin(e); }, { passive: true });
}

function scatter(tile, svg, link, firstEvent) {
  const path = svg.querySelector('path');
  const r = svg.getBoundingClientRect();
  const q = makeQR(link, true), margin = 4, k = r.width / (q.n + margin * 2);
  const gp = grainsPer(k), ks = k / gp;
  const parts = [];
  for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (q.dark(y, x)) {
    for (let j = 0; j < gp; j++) for (let i = 0; i < gp; i++) {
      const hx = (x + margin) * k + i * ks, hy = (y + margin) * k + j * ks;
      // each grain is a little lighter or heavier, so they spread like dust rather than in a neat ring
      parts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, m: 0.65 + Math.random() * 0.7 });
    }
  }
  // a see-through layer exactly over the code; the logo and white card underneath stay as they are
  if (getComputedStyle(tile).position === 'static') tile.style.position = 'relative';
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  const dpr = layerDpr();
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  // (an SVG picture has no offsetLeft/offsetTop, so measure it against the tile it sits in)
  const tb = tile.getBoundingClientRect();
  const left = r.left - tb.left - tile.clientLeft, top = r.top - tb.top - tile.clientTop;
  Object.assign(cv.style, { position: 'absolute', left: left + 'px', top: top + 'px', width: r.width + 'px', height: r.height + 'px', pointerEvents: 'none' });
  tile.appendChild(cv);
  const g = cv.getContext('2d');
  if (path) path.style.visibility = 'hidden';

  const R = Math.max(46, k * 8.5);             // how far the mouse or finger reaches
  const HOLD = 550;                             // after the movement stops (or the finger lifts), the grains go home
  const P = { x: -9999, y: -9999, last: 0, down: false };
  // followed on the whole page, so leaving the code never goes unnoticed
  const onMove = (ev) => {
    const b = svg.getBoundingClientRect();
    if (ev.type === 'pointerup' || ev.type === 'pointercancel') { if (ev.pointerType !== 'mouse') { P.down = false; P.last = 0; wake(); settleSoon(); } return; }
    if (ev.pointerType !== 'mouse' && ev.type === 'pointermove' && !P.down) return; // a finger only counts while it touches
    if (ev.type === 'pointerdown' && ev.pointerType !== 'mouse') P.down = true;
    const over = ev.clientX >= b.left - 8 && ev.clientX <= b.right + 8 && ev.clientY >= b.top - 8 && ev.clientY <= b.bottom + 8;
    if (!over) { if (P.last) { P.last = 0; wake(); settleSoon(); } return; }
    P.x = ev.clientX - b.left; P.y = ev.clientY - b.top; P.last = performance.now();
    wake();
    clearTimeout(idle); idle = setTimeout(wake, HOLD + 30); // wake once more so the grains start home after a pause
    settleSoon();
  };
  // the timer that always brings the real code back, even if the browser pauses the animation
  const settleSoon = () => { clearTimeout(hard); hard = setTimeout(() => { if (!stopped && !P.down && (!P.last || performance.now() - P.last >= HOLD)) stop(); }, HOLD + 1200); };
  let idle = 0, hard = 0, raf = 0, stopped = false;
  for (const t of ['pointermove', 'pointerup', 'pointercancel']) document.addEventListener(t, onMove, { passive: true });
  function stop() {
    if (stopped) return; stopped = true;
    cancelAnimationFrame(raf); clearTimeout(idle); clearTimeout(hard);
    for (const t of ['pointermove', 'pointerup', 'pointercancel']) document.removeEventListener(t, onMove);
    cv.remove();
    if (path) path.style.visibility = '';
    tile.__scatter = null;
  }
  function wake() { if (!raf && !stopped) raf = requestAnimationFrame(step); }
  function step(now) {
    raf = 0;
    frameCheck(now);
    if (!tile.isConnected) { stop(); return; }
    const pushing = P.down || (P.last && performance.now() - P.last < HOLD);
    g.clearRect(0, 0, cv.width, cv.height);
    let moving = false;
    const s = ks;
    for (const p of parts) {
      if (pushing) {
        const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy) || 0.001;
        if (d < R) { const f = Math.pow(1 - d / R, 2) * k * 0.95 / p.m; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      }
      p.vx += (p.hx - p.x) * 0.07; p.vy += (p.hy - p.y) * 0.07;   // the spring that pulls it home
      p.vx *= 0.8; p.vy *= 0.8;                                  // calm it down
      p.x += p.vx; p.y += p.vy;
      let off = Math.hypot(p.x - p.hx, p.y - p.hy);
      const fast = Math.abs(p.vx) + Math.abs(p.vy) > 0.05;
      if (fast || (!pushing && off > 0.08)) moving = true;
      else if (!pushing || off < 0.08) { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; off = 0; }
      const t = Math.min(1, off / (k * 3));                      // pushed grains turn orange, grains at home are black
      g.fillStyle = t > 0.02 ? colour(1 - t) : 'rgb(17,17,19)';
      grain(g, dpr, p.x, p.y, s);
    }
    if (!moving) {
      if (!pushing) stop();       // everything home and nothing touching: the real code takes over again
      return;                     // pushed but settled: wait for the next movement
    }
    raf = requestAnimationFrame(step);
  }
  setTimeout(() => stop(), 120000); // never left running
  onMove(firstEvent);
  return { stop, poke: onMove };
}

// ---------- a picture breaks into coloured grains that bind together somewhere else ----------
// Used by "Read now": the cover on the page dissolves into grains (each keeps its colour), they scatter,
// then bind together as the first page of the reader. `toEl` stays hidden until they have landed;
// a timer always shows it, and "reduce motion" just shows it.
export function bindImage(fromEl, toEl, { cols = 46, sample = null } = {}) {
  cols = fewerCols(cols);
  return new Promise((resolve) => {
    const reveal = () => { try { toEl.style.visibility = ''; } catch {} resolve(); };
    try {
      if (calm() || !fromEl || !toEl) { reveal(); return; }
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      if (!a.width || !b.width) { reveal(); return; }
      const rows = Math.max(8, Math.round(cols * (b.height / b.width)));
      // the grain colours, read from the cover picture (falls back to Jinharsh colours if the picture can't be read)
      let px = null;
      try {
        const src = sample || fromEl;
        if (src.tagName === 'CANVAS' || (src.tagName === 'IMG' && src.complete && src.naturalWidth)) {
          const oc = document.createElement('canvas'); oc.width = cols; oc.height = rows;
          const og = oc.getContext('2d', { willReadFrequently: true });
          og.drawImage(src, 0, 0, cols, rows);
          px = og.getImageData(0, 0, cols, rows).data;
        }
      } catch { px = null; }
      const { cv, g, dpr } = makeCanvas();
      toEl.style.visibility = 'hidden';
      const cwA = a.width / cols, chA = a.height / rows, cwB = b.width / cols, chB = b.height / rows;
      const parts = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4;
        const col = px ? `rgb(${px[k]},${px[k + 1]},${px[k + 2]})` : ((i + j) % 5 ? 'rgb(17,17,19)' : 'rgb(234,88,12)');
        const sx = a.left + i * cwA, sy = a.top + j * chA;
        const ang = Math.random() * Math.PI * 2, d = 30 + Math.random() * Math.max(80, a.width * 0.6);
        const tx = b.left + i * cwB, ty = b.top + j * chB;
        const dist = Math.hypot(tx - (b.left + b.width / 2), ty - (b.top + b.height / 2)) / (Math.hypot(b.width, b.height) / 2);
        parts.push({ sx, sy, mx: sx + Math.cos(ang) * d, my: sy + Math.sin(ang) * d, tx, ty, col,
          d1: Math.random() * 40, d2: 110 + dist * 100 + Math.random() * 50 }); // about half a second in all
      }
      const t0 = performance.now();
      let done = false;
      const finish = () => { if (done) return; done = true; cv.remove(); reveal(); };
      setTimeout(finish, 1100); // the timer that always shows the page
      const frame = (now) => {
        if (done) return;
        frameCheck(now);
        const el = now - t0;
        g.clearRect(0, 0, cv.width, cv.height);
        let busy = false;
        for (const p of parts) {
          let x, y, w, h;
          const t2 = clamp01((el - p.d2) / 250);
          if (t2 <= 0) {
            // 1. the cover dissolves: grains drift apart and shrink
            const t1 = easeInOut(clamp01((el - p.d1) / 150));
            x = lerp(p.sx, p.mx, t1); y = lerp(p.sy, p.my, t1);
            w = lerp(cwA, GRAIN, t1); h = lerp(chA, GRAIN, t1);
            busy = true;
          } else {
            // 2. they bind together as the page, landing with a small spring
            const e = easeOutBack(t2), f = clamp01(t2 * 1.25);
            const fx = lerp(p.sx, p.mx, 1), fy = lerp(p.sy, p.my, 1);
            x = lerp(fx, p.tx, e); y = lerp(fy, p.ty, e);
            w = lerp(GRAIN, cwB, f); h = lerp(GRAIN, chB, f);
            if (t2 < 1) busy = true;
          }
          g.fillStyle = p.col;
          const X = Math.round(x * dpr), Y = Math.round(y * dpr);
          g.fillRect(X, Y, Math.max(1, Math.round((x + w) * dpr) - X + 1), Math.max(1, Math.round((y + h) * dpr) - Y + 1));
        }
        if (!busy) { finish(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } catch { reveal(); }
  });
}

// ---------- a page of the reader forms out of its own grains ----------
// The first time a page comes into view, its picture breaks into small cells (each keeps its colour). They fly in
// from a loose cloud around the page, top rows first, a little orange while they fly, and land as a mosaic of the
// page; the sharp page then appears underneath while the mosaic fades. The swarm follows the page if it scrolls.
// Never more than a few pages at once (fast scrolling just shows them), and the page is always shown in the end.
let pagesForming = 0;
export function formPage(pageEl, canvas, { cols = 44, maxAtOnce = 3 } = {}) {
  cols = fewerCols(cols);
  if (perf.lite) maxAtOnce = 1;
  return new Promise((resolve) => {
    let shown = false;
    const show = () => { if (shown) return; shown = true; try { canvas.style.visibility = ''; pageEl.classList.remove('forming'); } catch {} resolve(); };
    try {
      if (calm() || !pageEl || !canvas || pagesForming >= maxAtOnce) { show(); return; }
      const r0 = pageEl.getBoundingClientRect();
      if (!r0.width || r0.bottom < 0 || r0.top > innerHeight) { show(); return; }
      const rows = Math.max(8, Math.round(cols * (r0.height / r0.width)));
      const oc = document.createElement('canvas'); oc.width = cols; oc.height = rows;
      const og = oc.getContext('2d', { willReadFrequently: true });
      og.drawImage(canvas, 0, 0, cols, rows);
      const px = og.getImageData(0, 0, cols, rows).data;
      pagesForming++;
      let counted = true;
      const uncount = () => { if (counted) { counted = false; pagesForming = Math.max(0, pagesForming - 1); } };
      canvas.style.visibility = 'hidden';
      pageEl.classList.add('forming');
      const parts = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4, ang = Math.random() * Math.PI * 2, d = 24 + Math.random() * r0.width * 0.5;
        parts.push({ i, j, r: px[k], g: px[k + 1], b: px[k + 2], own: `rgb(${px[k]},${px[k + 1]},${px[k + 2]})`,
          dx: Math.cos(ang) * d, dy: Math.sin(ang) * d + r0.height * 0.06,
          delay: (j / rows) * 140 + Math.random() * 50, dur: 230 + Math.random() * 80 }); // about half a second in all
      }
      const t0 = performance.now(), FADE = 110;
      let landed = 0;
      const hard = setTimeout(() => { uncount(); show(); }, 1100); // the timer that always shows the page
      fxAdd({
        draw(g, dpr, now) {
          const b = pageEl.getBoundingClientRect();
          // gone, or scrolled away: just show it
          if (!pageEl.isConnected || !b.width || b.bottom < -60 || b.top > innerHeight + 60) { clearTimeout(hard); uncount(); show(); return false; }
          const el = now - t0, cw = b.width / cols, ch = b.height / rows;
          let alpha = 1, all = true;
          if (landed) { alpha = 1 - (el - landed) / FADE; if (alpha <= 0) return false; }
          for (const p of parts) {
            const t = clamp01((el - p.delay) / p.dur);
            if (t < 1) all = false;
            if (t <= 0) continue;
            // small grains while they fly; only as they land do they spread out to fill their bit of the page
            const e = easeOutBack(t), grow = clamp01((t - 0.7) / 0.3), gg = grow * grow;
            const x = b.left + p.i * cw + p.dx * (1 - e), y = b.top + p.j * ch + p.dy * (1 - e);
            const w = lerp(GRAIN, cw, gg), h = lerp(GRAIN, ch, gg);
            const m = (1 - clamp01(t * 1.4)) * 0.55; // the orange tint fades as the grain lands
            g.globalAlpha = alpha * Math.min(1, t * 4);
            g.fillStyle = m > 0.01 ? `rgb(${Math.round(lerp(p.r, 234, m))},${Math.round(lerp(p.g, 88, m))},${Math.round(lerp(p.b, 12, m))})` : p.own;
            const X = Math.round(x * dpr), Y = Math.round(y * dpr);
            g.fillRect(X, Y, Math.max(1, Math.round((x + w) * dpr) - X + 1), Math.max(1, Math.round((y + h) * dpr) - Y + 1));
          }
          g.globalAlpha = 1;
          if (all && !landed) { landed = el; clearTimeout(hard); uncount(); show(); } // the sharp page takes over underneath
          return true;
        },
        end() { clearTimeout(hard); uncount(); show(); },
      });
    } catch { show(); }
  });
}

// ---------- the upload window ----------
const inkNow = () => (document.documentElement.classList.contains('dark') ? 'rgb(236,236,240)' : 'rgb(17,17,19)');

// Grains pour out of `fromRect` (the button that was pressed, or where a file was dropped) into a window that is
// opening, and melt into it.
export function pourInto(fromRect, toEl, { n = 70 } = {}) {
  if (calm() || !fromRect || !toEl || !fromRect.width) return;
  n = many(n);
  const ink = inkNow(), t0 = performance.now();
  const ps = Array.from({ length: n }, () => ({
    sx: fromRect.left + Math.random() * fromRect.width, sy: fromRect.top + Math.random() * fromRect.height,
    u: 0.08 + Math.random() * 0.84, v: 0.05 + Math.random() * 0.55,          // where in the window it lands
    bend: (Math.random() - 0.5) * 160, delay: Math.random() * 220, dur: 520 + Math.random() * 260,
    s: 1.3 + Math.random() * 1.7, col: Math.random() < 0.7 ? 'rgb(234,88,12)' : ink }));
  fxAdd({
    draw(g, dpr, now) {
      const b = toEl.getBoundingClientRect();
      if (!b.width) return false;
      const el = now - t0;
      let alive = false;
      for (const p of ps) {
        const t = clamp01((el - p.delay) / p.dur);
        if (t >= 1) continue;
        alive = true;
        if (t <= 0) continue;
        const e = easeInOut(t), arc = Math.sin(Math.PI * t);
        const x = lerp(p.sx, b.left + p.u * b.width, e) + arc * p.bend, y = lerp(p.sy, b.top + p.v * b.height, e) - arc * 40;
        dot(g, dpr, x, y, p.s * (1 - 0.5 * t), p.col, t > 0.75 ? (1 - t) / 0.25 : Math.min(1, t * 5));
      }
      return alive;
    },
  });
}

// The QR in `tile` rearranges its own grains into a new code. `paint()` puts the new code in; the grains of the
// old code then slide over to the squares of the new one, orange while they move. Used while a link is typed.
export function morphQR(tile, fromLink, toLink, paint) {
  let a = null;
  try { if (!calm() && fromLink) a = cellsOf(tile, fromLink); } catch { a = null; }
  if (tile.__morph) tile.__morph.stop();
  paint();
  if (!a || !a.cells.length) return;
  let b = null;
  try { b = cellsOf(tile, toLink); } catch { b = null; }
  if (!b || !b.cells.length) return;
  const r0 = b.svg.getBoundingClientRect();
  const path = b.svg.querySelector('path');
  if (path) path.style.visibility = 'hidden';
  const nA = a.cells.length, nB = b.cells.length, s = b.ks + 0.3;
  const parts = b.cells.map((c, i) => {
    const o = a.cells[Math.min(nA - 1, Math.floor((i * nA) / nB))];
    const d = Math.hypot(c.x - b.cx, c.y - b.cy) / (b.size / 2);
    return { sx: o.x, sy: o.y, tx: c.x, ty: c.y, delay: d * 120 + Math.random() * 60 };
  });
  let stopped = false;
  const m = { stop: () => { if (stopped) return; stopped = true; clearTimeout(hard); if (path) path.style.visibility = ''; if (tile.__morph === m) tile.__morph = null; } };
  tile.__morph = m;
  const hard = setTimeout(m.stop, 1500); // the real code always comes back
  const t0 = performance.now(), DUR = 380;
  fxAdd({
    draw(g, dpr, now) {
      if (stopped || !tile.isConnected) { m.stop(); return false; }
      const r = b.svg.getBoundingClientRect(), ox = r.left - r0.left, oy = r.top - r0.top; // follow the window
      const el = now - t0;
      let busy = false;
      for (const p of parts) {
        const t = clamp01((el - p.delay) / DUR);
        if (t < 1) busy = true;
        const e = easeInOut(t);
        g.fillStyle = colour(1 - Math.sin(Math.PI * t) * 0.75);
        grain(g, dpr, lerp(p.sx, p.tx, e) + ox, lerp(p.sy, p.ty, e) + oy, s);
      }
      if (!busy) { m.stop(); return false; }
      return true;
    },
    end: () => m.stop(),
  });
}

// While a file uploads, a thin stream of grains flows from its cover into the moving end of the progress bar.
// Returns stop(); it also ends by itself when the cover leaves the page, and after 10 minutes at most.
// (Its own layer: an upload can take longer than the shared layer is allowed to live.)
export function stream(fromEl, toPoint, { rate = 34 } = {}) {
  if (calm() || !fromEl) return () => {};
  if (perf.lite) rate *= 0.45;
  const L = makeCanvas();
  L.cv.style.zIndex = '96';
  const ink = inkNow(), ps = [];
  let stopped = false, ended = false, last = performance.now(), acc = 0, raf = 0;
  const end = () => { if (ended) return; ended = true; cancelAnimationFrame(raf); clearTimeout(cap); L.cv.remove(); };
  const cap = setTimeout(end, 600000);
  const frame = (now) => {
    raf = 0;
    if (ended) return;
    frameCheck(now);
    if (!fromEl.isConnected) { end(); return; }
    const dt = Math.min(64, now - last); last = now;
    const a = fromEl.getBoundingClientRect();
    let to = null;
    try { to = toPoint(); } catch {}
    if (!stopped && to && a.width) {
      acc += (dt * rate) / 1000;
      while (acc >= 1) {
        acc--;
        ps.push({ sx: a.left + a.width * (0.15 + Math.random() * 0.7), sy: a.top + a.height * (0.2 + Math.random() * 0.6), t0: now,
          dur: 520 + Math.random() * 300, bend: (Math.random() - 0.5) * 50, s: 1.2 + Math.random() * 1.6, col: Math.random() < 0.65 ? 'rgb(234,88,12)' : ink });
      }
    }
    L.g.clearRect(0, 0, L.cv.width, L.cv.height);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i], t = (now - p.t0) / p.dur;
      if (t >= 1 || !to) { ps.splice(i, 1); continue; }
      const e = t * t; // faster and faster towards the bar
      dot(L.g, L.dpr, lerp(p.sx, to.x, e) + Math.sin(Math.PI * t) * p.bend, lerp(p.sy, to.y, e), p.s * (1 - 0.4 * t), p.col,
        Math.min(1, t * 6) * (t > 0.85 ? (1 - t) / 0.15 : 1));
    }
    if (stopped && !ps.length) { end(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { if (stopped) return; stopped = true; setTimeout(end, 1500); };
}

// A small spray of grains off the edge of a round icon (the contact buttons, when the mouse comes over them).
export function sparkle(el, { n = 18 } = {}) {
  if (calm() || !el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  n = many(n);
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2, ink = inkNow(), t0 = performance.now();
  const ps = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2;
    return { a, d0: rad * 0.9, d1: rad + 8 + Math.random() * 22, delay: Math.random() * 90, dur: 420 + Math.random() * 260,
      s: 1.2 + Math.random() * 1.5, col: Math.random() < 0.72 ? 'rgb(234,88,12)' : ink };
  });
  fxAdd({
    draw(g, dpr, now) {
      const el2 = now - t0;
      let alive = false;
      for (const p of ps) {
        const t = clamp01((el2 - p.delay) / p.dur);
        if (t >= 1) continue;
        alive = true;
        if (t <= 0) continue;
        const d = lerp(p.d0, p.d1, 1 - Math.pow(1 - t, 3));
        dot(g, dpr, cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d + t * t * 6, p.s * (1 - 0.4 * t), p.col, 1 - t);
      }
      return alive;
    },
  });
}

// ---------- small effects on one shared layer: a burst, a pour, a dissolve ----------
let fx = null;
function fxAdd(item) {
  if (!fx) {
    const L = makeCanvas();
    L.cv.style.zIndex = '96';
    fx = { ...L, items: [], raf: 0, guard: 0 };
  }
  fx.items.push(item);
  clearTimeout(fx.guard);
  fx.guard = setTimeout(fxClear, 4000); // never left on screen, even if the browser pauses drawing
  if (!fx.raf) fx.raf = requestAnimationFrame(fxFrame);
}
function fxClear() { if (!fx) return; cancelAnimationFrame(fx.raf); fx.items.forEach((it) => it.end && it.end()); fx.cv.remove(); fx = null; }
function fxFrame(now) {
  if (!fx) return;
  frameCheck(now);
  fx.raf = 0;
  const { g, cv, dpr } = fx;
  g.clearRect(0, 0, cv.width, cv.height);
  fx.items = fx.items.filter((it) => {
    const alive = it.draw(g, dpr, now);
    if (!alive && it.end) it.end();
    return alive;
  });
  if (fx.items.length) fx.raf = requestAnimationFrame(fxFrame); else fxClear();
}
const dot = (g, dpr, x, y, s, col, a) => {
  if (s <= 0 || a <= 0) return;
  g.globalAlpha = a; g.fillStyle = col;
  const X = Math.round(x * dpr), Y = Math.round(y * dpr);
  g.fillRect(X, Y, Math.max(1, Math.round((x + s) * dpr) - X), Math.max(1, Math.round((y + s) * dpr) - Y));
  g.globalAlpha = 1;
};
function colourOf(el) {
  try {
    const st = getComputedStyle(el);
    const bg = st.backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(bg)) return bg;
    return st.color || 'rgb(17,17,19)';
  } catch { return 'rgb(17,17,19)'; }
}

// Closing, gently: `el` softens into small round grains in its own colours, which rise slowly, sway a little and
// fade away, like dust in warm light. It starts where the X was pressed (`at`; the middle of `el` if not given) and
// spreads outward like a ripple on water. `el` is hidden at once; the promise ends when the last grain has faded.
// `sample` (a canvas or picture) gives the grains their colours; otherwise they take the colour of the panel itself.
// (The name stays "swallow" because every window calls it; it used to be a black hole.)
export function swallow(el, { sample = null, cols = 48, at = null } = {}) {
  cols = fewerCols(Math.min(cols, 44));
  return new Promise((resolve) => {
    try {
      if (calm() || !el) { resolve(); return; }
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) { resolve(); return; }
      const rows = Math.max(6, Math.round(cols * r.height / r.width));
      let px = null;
      try {
        if (sample && (sample.tagName === 'CANVAS' || (sample.tagName === 'IMG' && sample.complete && sample.naturalWidth))) {
          const oc = document.createElement('canvas'); oc.width = cols; oc.height = rows;
          const og = oc.getContext('2d', { willReadFrequently: true });
          og.drawImage(sample, 0, 0, cols, rows);
          px = og.getImageData(0, 0, cols, rows).data;
        }
      } catch { px = null; }
      const surface = colourOf(el);
      let ink = 'rgb(17,17,19)';
      try { ink = getComputedStyle(el).color || ink; } catch {}
      const cx = at && isFinite(at.x) ? at.x : r.left + r.width / 2;
      const cy = at && isFinite(at.y) ? at.y : r.top + r.height / 2;
      const cw = r.width / cols, ch = r.height / rows;
      const rmax = Math.max(Math.hypot(r.left - cx, r.top - cy), Math.hypot(r.right - cx, r.top - cy), Math.hypot(r.left - cx, r.bottom - cy), Math.hypot(r.right - cx, r.bottom - cy)) || 1;
      const ps = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4;
        const col = px ? `rgb(${px[k]},${px[k + 1]},${px[k + 2]})` : (Math.random() < 0.05 ? ink : surface);
        const x0 = r.left + i * cw, y0 = r.top + j * ch;
        const r0 = Math.hypot(x0 + cw / 2 - cx, y0 + ch / 2 - cy);
        ps.push({ x0, y0, col,
          delay: (r0 / rmax) * 280 + Math.random() * 140,   // the ripple: nearest first
          dur: 950 + Math.random() * 550,                    // slow, and each at its own pace
          rise: 26 + Math.random() * 64,                     // how far it floats up
          drift: (Math.random() - 0.5) * 34,                 // and a little to one side
          sway: 3 + Math.random() * 7, ph: Math.random() * Math.PI * 2,
          dot: 1.2 + Math.random() * 1.6 });                 // the size it settles to
      }
      el.style.visibility = 'hidden';
      const t0 = performance.now();
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      setTimeout(finish, 2600); // always ends, even if the browser pauses drawing
      fxAdd({
        draw(g, dpr, now) {
          const el2 = now - t0;
          let alive = false;
          for (const p of ps) {
            const t = clamp01((el2 - p.delay) / p.dur);
            if (t >= 1) continue;
            alive = true;
            if (el2 < p.delay) { dot(g, dpr, p.x0, p.y0, Math.max(cw, ch) + 0.6, p.col, 1); continue; } // still part of the panel
            const e = 1 - (1 - t) * (1 - t);                   // eases out: quick to lift, slow to settle
            const soft = clamp01(t * 3.2);                      // the cell becomes a small round grain
            const size = lerp(Math.max(cw, ch), p.dot, easeInOut(soft));
            const x = p.x0 + cw / 2 + p.drift * e + Math.sin(p.ph + t * 4.2) * p.sway * e;
            const y = p.y0 + ch / 2 - p.rise * e;
            const a = Math.pow(1 - t, 1.6);                     // fades softly
            if (soft < 0.6) { dot(g, dpr, x - size / 2, y - size / 2, size, p.col, a); continue; }
            g.globalAlpha = a; g.fillStyle = p.col;
            g.beginPath(); g.arc(x * dpr, y * dpr, (size / 2) * dpr, 0, Math.PI * 2); g.fill();
          }
          g.globalAlpha = 1;
          if (!alive) finish();
          return alive;
        },
        end: finish,
      });
    } catch { resolve(); }
  });
}
export const dissolve = swallow;

// A card turning over shakes a little dust off its edges: while it turns, grains fly out sideways from its left and
// right edges (which swing in towards the middle and out again), drift down and fade.
export function cardDust(el, { n = 90, turnMs = 800 } = {}) {
  n = many(n);
  if (calm() || !el) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const dark = document.documentElement.classList.contains('dark');
  const ink = dark ? 'rgb(236,236,240)' : 'rgb(17,17,19)';
  const mid = r.left + r.width / 2, half = r.width / 2, t0 = performance.now();
  const ps = Array.from({ length: n }, (_, i) => {
    const born = Math.random() * turnMs * 0.75;
    // where the edge is on screen at that moment of the turn
    const reach = Math.abs(Math.cos(Math.PI * easeInOut(born / turnMs))) * half;
    const dir = i % 2 ? 1 : -1;
    return { born, x: mid + dir * reach, y: r.top + Math.random() * r.height, vx: dir * (0.5 + Math.random() * 2.4), vy: -0.9 + Math.random() * 1.2,
      s: 1.1 + Math.random() * 1.7, life: 520 + Math.random() * 520, col: Math.random() < 0.62 ? 'rgb(234,88,12)' : ink };
  });
  fxAdd({
    draw(g, dpr, now) {
      const el = now - t0;
      let alive = false;
      for (const p of ps) {
        const t = el - p.born;
        if (t < 0) { alive = true; continue; }
        if (t > p.life) continue;
        alive = true;
        const k = t / 16.7; // in frames
        dot(g, dpr, p.x + p.vx * k * 0.92, p.y + p.vy * k + 0.022 * k * k, p.s, p.col, 1 - easeInOut(t / p.life));
      }
      return alive;
    },
  });
}

