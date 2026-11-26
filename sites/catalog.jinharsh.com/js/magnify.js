// The top bar as a clear magnifying glass: what scrolls under it is shown a little bigger, the SAME shape (never
// stretched), sharp (no blur), and bent gently only right at its upper and lower edge, like the rim of a lens.
// It replaces the kit's "liquid glass" bend for this site's bars (that one stretched text up to 11 times at the rim).
//
// Only Chrome and Edge can bend what is behind an element; other browsers, slower phones and the Solid / Frosted
// glass settings keep the kit's plain glass. The kit file itself is not changed.
import { perf } from './particles.js';

const ZOOM = 1.12;       // how much bigger things look under the bar
const RIM = 10;          // px: the soft bend along the edges
const RIM_PULL = 5;      // px: how far the rim pulls inward

let svg = null, made = '', bars = [];
const COLS = 96;          // columns in the map picture (stretched across the bar; exact, as it changes evenly across)
const maps = new Map();

// A PNG picture written byte by byte (8-bit colour, stored without packing): no canvas to set up or read back.
let CRC = null;
function crc32(bytes) {
  if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngUrl(w, h, rgb) {
  const row = w * 3 + 1, raw = new Uint8Array(row * h);           // every row starts with a 0 (no filter)
  for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * row + 1);
  const blocks = Math.max(1, Math.ceil(raw.length / 65535));
  const z = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  z[0] = 0x78; z[1] = 0x01;
  let o = 2;
  for (let i = 0; i < blocks; i++) {
    const part = raw.subarray(i * 65535, Math.min(raw.length, (i + 1) * 65535)), n = part.length;
    z[o++] = i === blocks - 1 ? 1 : 0; z[o++] = n & 255; z[o++] = n >> 8; z[o++] = ~n & 255; z[o++] = (~n >> 8) & 255;
    z.set(part, o); o += n;
  }
  let a = 1, b = 0;
  for (let i = 0; i < raw.length; i++) { a = (a + raw[i]) % 65521; b = (b + a) % 65521; }
  z[o++] = b >> 8; z[o++] = b & 255; z[o++] = a >> 8; z[o++] = a & 255;
  const parts = [Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)];
  const chunk = (type, data) => {
    const c = new Uint8Array(12 + data.length), v = new DataView(c.buffer);
    v.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) c[4 + i] = type.charCodeAt(i);
    c.set(data, 8);
    v.setUint32(8 + data.length, crc32(c.subarray(4, 8 + data.length)));
    parts.push(c);
  };
  const head = new Uint8Array(13), hv = new DataView(head.buffer);
  hv.setUint32(0, w); hv.setUint32(4, h); head[8] = 8; head[9] = 2;  // 8 bits, red-green-blue
  chunk('IHDR', head); chunk('IDAT', z); chunk('IEND', new Uint8Array(0));
  let s = '';
  for (const p of parts) for (let i = 0; i < p.length; i += 8192) s += String.fromCharCode.apply(null, p.subarray(i, i + 8192));
  return 'data:image/png;base64,' + btoa(s);
}

// where each pixel of the bar looks instead ("show what is dx, dy away"), as a picture: red = across, green = down
function mapOf(w, h) {
  const key = w + 'x' + h;
  if (maps.has(key)) return maps.get(key);
  const cx = w / 2, cy = h / 2, k = 1 - 1 / ZOOM;
  const cols = Math.min(w, COLS), step = w / cols;
  const scale = 2 * Math.max(cx * k, cy * k + RIM_PULL) + 2;
  const d = new Uint8Array(cols * h * 3);
  const R = [];
  for (let x = 0; x < cols; x++) R.push(Math.round(128 + (((cx - (x + 0.5) * step) * k) / scale) * 255)); // the middle of each column
  for (let y = 0; y < h; y++) {
    let dy = (cy - (y + 0.5)) * k;                          // towards the middle line: bigger
    const edge = Math.min(y + 0.5, h - y - 0.5);
    if (edge < RIM) { const t = 1 - edge / RIM; dy += (y < cy ? 1 : -1) * RIM_PULL * t * t; } // the rim bends a little more
    const G = Math.round(128 + (dy / scale) * 255);
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3;
      d[i] = R[x]; d[i + 1] = G; d[i + 2] = 128;
    }
  }
  const m = { url: pngUrl(cols, h, d), scale: Math.round(scale * 100) / 100 };
  maps.set(key, m);
  return m;
}

function apply() {
  try {
    const H = document.documentElement;
    const chrome = /Chrome\/\d+/.test(navigator.userAgent || '');
    const clear = H.dataset.juGlass !== 'solid' && H.dataset.juGlass !== 'frosted';
    const on = chrome && clear && !perf.lite;
    if (!on) { bars.forEach((b) => { b.style.backdropFilter = ''; b.style.webkitBackdropFilter = ''; b.classList.remove('mag-on'); }); return; }
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
      document.body.appendChild(svg);
    }
    const key = bars.map((b) => Math.round(b.offsetWidth) + 'x' + Math.round(b.offsetHeight)).join('|');
    if (key !== made) {
      svg.innerHTML = '<defs>' + bars.map((b, i) => {
        const w = Math.round(b.offsetWidth), h = Math.round(b.offsetHeight);
        if (!w || !h) return '';
        const m = mapOf(w, h);
        return `<filter id="jdMag${i}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
          `<feImage href="${m.url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="m" scale="${m.scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
      }).join('') + '</defs>';
      made = key;
    }
    bars.forEach((b, i) => {
      const f = `url(#jdMag${i}) saturate(1.35) brightness(var(--mag-bright, 1))`;
      b.style.webkitBackdropFilter = f; b.style.backdropFilter = f;
      b.classList.add('mag-on');   // a stronger tint with the magnifier, so pictures underneath stay calm (app.css)
    });
  } catch { /* the plain glass stays */ }
}

export function enableMagnifier(selector = '.ju-top') {
  bars = [...document.querySelectorAll(selector)];
  if (!bars.length) return;
  // put on just after the first paint (nothing is under the bar yet), so it never holds up the page appearing
  let started = false;
  const start = () => { if (!started) { started = true; apply(); } };
  try { requestAnimationFrame(() => setTimeout(start, 0)); } catch {}
  setTimeout(start, 1000); // (a page opened in the background gets no frames until it is shown)
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(apply, 180); }, { passive: true });
  // the Glass setting (Solid / Frosted / Clear) and the slower-phone mode switch it off and on
  new MutationObserver(() => apply()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ju-glass', 'class'] });
}
