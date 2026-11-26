// The visiting card: 89 x 51 mm (the usual Indian card size), two sides, ready for the print shop.
//   Front: the Jinharsh logo and name, the contact details with small orange icons, and on a soft panel on the
//          right the catalogue's own QR with its short link underneath (for people who type instead of scan).
//   Back:  dark, with the logo on a white tile, the name and the website.
//
//   cardSheet({ link, title, site, printable, from })   the window: the card (tap to turn it over), downloads, Print
//   cardSvg(side, opts)     one side as SVG; opts.bleed = 3 adds the 3 mm on every edge that the print shop trims off
//   cardPdf(opts)           both sides in one PDF, with bleed: the file to send to the print shop
//   cardPng(side, opts)     a 300 dpi picture of one side
//   printCard(opts)         prints both sides at real size
import { icon, ICONS } from '/hub/vendor/icons.js?v=3';
import { qrSvg, saveBlob } from './qr.js';
import * as M from './motion.js';
import { bindImage, swallow, cardDust } from './particles.js';

const W = 89, H = 51, BLEED = 3;          // millimetres
const ORANGE = '#ea580c', INK = '#141416', GREY = '#5f5f67', PANEL = '#f4f2ef', NIGHT = '#141416';
const PANEL_X = 57.5, MID = (PANEL_X + W) / 2;              // the soft panel on the right of the front
const FRAME = { x: 60.5, y: 8, s: 25.5 };                   // the white frame around the QR
const QR = { x: 61.25, y: 8.75, s: 24 };                    // the QR itself (24 mm: scans easily off a card)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (t) => { try { JUI.toast(t); } catch {} };
const pct = (v, of) => +(v / of * 100).toFixed(3) + '%';
const isAll = (title) => /^jinharsh catalogues$/i.test(title || '');

// split text into lines of at most `max` letters, at spaces
function wrap(text, max, lines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean), out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    if (out.length === lines) break;
  }
  if (out.length < lines && cur) out.push(cur);
  if (out.length === lines && words.join(' ').length > out.join(' ').length) out[lines - 1] = out[lines - 1].replace(/.{0,1}$/, '…');
  return out.slice(0, lines);
}
// a font size small enough for `text` to fit in `width` mm (Geist letters are about 0.56 of the size wide)
const fit = (text, size, width) => +Math.min(size, width / (Math.max(1, String(text).length) * 0.56)).toFixed(2);

// everything the card says, read from site.json
function details(site = {}, link = '', title = '') {
  const C = site.contact || {}, co = site.company || {};
  const name = (co.name || 'Jinharsh Industrial Solutions Private Limited').replace(/\s*Private Limited$/i, ' Pvt. Ltd.');
  const first = name.split(/\s+/)[0];
  return {
    first, rest: name.slice(first.length).trim(),
    tagline: co.tagline ? co.tagline.charAt(0).toUpperCase() + co.tagline.slice(1) : '',
    phones: (C.phones || []).map((p) => p.display).filter(Boolean).join(' · '),
    email: C.email || '',
    web: String(C.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    address: wrap(C.address || '', 38, 2),
    short: String(link || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    all: isAll(title),
  };
}

// a Lucide icon drawn inside the card, `s` mm wide
const ico = (name, x, y, s, col) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
const text = (x, y, t, size, { weight = 400, fill = INK, anchor = '', spacing = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor ? ` text-anchor="${anchor}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}>${esc(t)}</text>`;

function frontBody(d, { link, title, logo, qrLogo, b, withQr }) {
  const out = [];
  out.push(`<rect x="${-b}" y="${-b}" width="${W + 2 * b}" height="${H + 2 * b}" fill="#ffffff"/>`);
  out.push(`<rect x="${PANEL_X}" y="${-b}" width="${W - PANEL_X + b}" height="${H + 2 * b}" fill="${PANEL}"/>`);
  // the logo and the name side by side
  out.push(`<image href="${logo}" x="6" y="5.2" width="11.6" height="11.6"/>`);
  out.push(text(19.6, 10.5, d.first, 4.1, { weight: 800, spacing: '-0.08' }));
  if (d.rest) out.push(text(19.6, 14.3, d.rest, fit(d.rest, 2.05, 36), { weight: 550, fill: GREY }));
  if (d.tagline) out.push(text(6, 21.6, d.tagline, fit(d.tagline, 2.1, 49), { weight: 500 }));
  out.push(`<rect x="6" y="24.1" width="9" height="0.6" rx="0.3" fill="${ORANGE}"/>`);
  // how to reach us, each line with its icon
  const row = (ic, y, t, size = 2.05, weight = 500, fill = INK) => {
    out.push(ico(ic, 6, +(y - 2.02).toFixed(2), 2.5, ORANGE));
    out.push(text(9.8, y, t, fit(t, size, 46), { weight, fill }));
  };
  if (d.phones) row('phone', 30.8, d.phones, 2.1, 650);
  if (d.email) row('mail', 34.7, d.email);
  if (d.web) row('globe', 38.6, d.web);
  if (d.address.length) {
    row('map-pin', 42.5, d.address[0], 1.85, 400, GREY);
    if (d.address[1]) out.push(text(9.8, 45.0, d.address[1], 1.85, { fill: GREY }));
  }
  // the QR on its white frame, with the short link under it
  out.push(`<rect x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.s}" height="${FRAME.s}" rx="2.2" fill="#ffffff" stroke="#e6e1db" stroke-width="0.15"/>`);
  if (withQr) out.push(qrSvg(link, { logo: true, logoHref: qrLogo, title }).replace('<svg ', `<svg x="${QR.x}" y="${QR.y}" width="${QR.s}" height="${QR.s}" `));
  const label = d.all ? 'Scan for our catalogues' : 'Scan for our catalogue';
  out.push(text(MID, 38.4, label, fit(label, 2.05, 27), { weight: 700, anchor: 'middle' }));
  if (d.short) out.push(text(MID, 42.1, d.short, fit(d.short, 1.8, 27), { weight: 500, fill: GREY, anchor: 'middle' }));
  return out.join('\n  ');
}

function backBody(d, { logo, b }) {
  const c = W / 2;
  return [
    `<rect x="${-b}" y="${-b}" width="${W + 2 * b}" height="${H + 2 * b}" fill="${NIGHT}"/>`,
    `<rect x="${c - 7.25}" y="8.4" width="14.5" height="14.5" rx="3.2" fill="#ffffff"/>`,
    `<image href="${logo}" x="${c - 6.25}" y="9.4" width="12.5" height="12.5"/>`,
    text(c, 30.6, d.first, 4.4, { weight: 800, fill: '#ffffff', anchor: 'middle', spacing: '-0.08' }),
    d.rest ? text(c, 34.4, d.rest, fit(d.rest, 2.1, 60), { weight: 500, fill: '#a1a1aa', anchor: 'middle' }) : '',
    `<rect x="${c - 4}" y="37.3" width="8" height="0.6" rx="0.3" fill="${ORANGE}"/>`,
    d.web ? text(c, 43.4, d.web, fit(d.web, 2.2, 60), { weight: 650, fill: ORANGE, anchor: 'middle' }) : '',
  ].filter(Boolean).join('\n  ');
}

// One side of the card as SVG. `logo` and `qrLogo` are picture addresses (data: addresses make a stand-alone file).
export function cardSvg(side, { link, title, site = {}, logo = '/hub/assets/mark.png', qrLogo = '/hub/assets/qr-logo.png', fontCss = '', bleed = 0, withQr = true } = {}) {
  const d = details(site, link, title), b = bleed;
  const body = side === 'back' ? backBody(d, { logo, b }) : frontBody(d, { link, title, logo, qrLogo, b, withQr });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * b}mm" height="${H + 2 * b}mm" viewBox="${-b} ${-b} ${W + 2 * b} ${H + 2 * b}" font-family="Geist, 'Helvetica Neue', Arial, sans-serif" role="img" aria-label="Visiting card, ${side === 'back' ? 'back' : 'front'}">
  ${fontCss ? `<style>${fontCss}</style>` : ''}
  ${body}
</svg>`;
}

// ---------- files ----------
const asDataUrl = async (url) => {
  const b = await (await fetch(url)).blob();
  return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
};
let packing = null; // logo, QR logo and font, read once
function pack() {
  if (!packing) {
    packing = Promise.all([asDataUrl('/hub/assets/mark.png'), asDataUrl('/hub/assets/qr-logo.png'), asDataUrl('/hub/vendor/fonts/Geist-Variable.woff2')])
      .then(([logo, qrLogo, font]) => ({ logo, qrLogo, fontCss: `@font-face{font-family:'Geist';src:url(${font}) format('woff2');font-weight:100 900;font-style:normal}` }))
      .catch((e) => { packing = null; throw e; });
  }
  return packing;
}
export async function cardFile(side, opts) {
  const p = await pack();
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + cardSvg(side, { ...opts, ...p });
}
// one side drawn on a canvas at `dpi` dots per inch
async function raster(side, opts, dpi, bleed = 0) {
  const svg = await cardFile(side, { ...opts, bleed });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); img.src = url; await img.decode();
    await new Promise((r) => setTimeout(r, 60)); // let the font inside the picture settle
    const px = dpi / 25.4, cv = document.createElement('canvas');
    cv.width = Math.round((W + 2 * bleed) * px); cv.height = Math.round((H + 2 * bleed) * px);
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  } finally { URL.revokeObjectURL(url); }
}
export async function cardPng(side, opts) {
  const cv = await raster(side, opts, 300);
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

// The print-shop PDF: one page per side, 95 x 57 mm (the card plus 3 mm bleed), each side a 600 dpi picture.
// The pictures are stored without loss (so the QR stays razor sharp); a TrimBox tells the shop where to cut.
async function pdfImage(cv) {
  const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  if (typeof CompressionStream === 'function') {
    try {
      const rgb = new Uint8Array(cv.width * cv.height * 3);
      for (let i = 0, j = 0; i < data.length; i += 4, j += 3) { rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2]; }
      const z = await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer();
      return { w: cv.width, h: cv.height, filter: 'FlateDecode', bytes: new Uint8Array(z) };
    } catch {}
  }
  const jpg = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.95));
  return { w: cv.width, h: cv.height, filter: 'DCTDecode', bytes: new Uint8Array(await jpg.arrayBuffer()) };
}
function pdfFile(pages, { w, h, bleed, title }) {
  const enc = new TextEncoder(), chunks = [], at = [];
  let len = 0;
  const put = (x) => { const u = typeof x === 'string' ? enc.encode(x) : x; chunks.push(u); len += u.length; };
  const obj = (n, dict, stream) => {
    at[n] = len;
    put(`${n} 0 obj\n${dict}\n`);
    if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); }
    put('endobj\n');
  };
  const f = (v) => String(+v.toFixed(3));
  const str = (s) => '(' + String(s).replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&') + ')';
  put('%PDF-1.4\n'); put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + 3 * i} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  obj(3, `<< /Title ${str(title)} /Creator (Jinharsh Catalogues) /Producer (Jinharsh Catalogues) >>`);
  const box = `[0 0 ${f(w)} ${f(h)}]`, trim = `[${f(bleed)} ${f(bleed)} ${f(w - bleed)} ${f(h - bleed)}]`;
  pages.forEach((p, i) => {
    const n = 4 + 3 * i;
    obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox ${box} /BleedBox ${box} /TrimBox ${trim} /Resources << /XObject << /Im0 ${n + 1} 0 R >> >> /Contents ${n + 2} 0 R >>`);
    obj(n + 1, `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /${p.filter} /Length ${p.bytes.length} >>`, p.bytes);
    const c = enc.encode(`q ${f(w)} 0 0 ${f(h)} 0 0 cm /Im0 Do Q`);
    obj(n + 2, `<< /Length ${c.length} >>`, c);
  });
  const size = 4 + 3 * pages.length, xref = len;
  put(`xref\n0 ${size}\n0000000000 65535 f \n`);
  for (let n = 1; n < size; n++) put(String(at[n]).padStart(10, '0') + ' 00000 n \n');
  put(`trailer\n<< /Size ${size} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}
export async function cardPdf(opts) {
  const pages = [];
  for (const side of ['front', 'back']) pages.push(await pdfImage(await raster(side, opts, 600, BLEED)));
  const pt = 72 / 25.4;
  return pdfFile(pages, { w: (W + 2 * BLEED) * pt, h: (H + 2 * BLEED) * pt, bleed: BLEED * pt, title: 'Visiting card - ' + (opts.title || 'Jinharsh') });
}

// Prints both sides, each on its own 89 x 51 mm page, on white paper whatever the theme.
export async function printCard(opts) {
  let p = {};
  try { p = await pack(); } catch {}
  let area = document.getElementById('printArea'), made = false;
  if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); made = true; }
  const before = area.innerHTML;
  const o = { ...opts, logo: p.logo, qrLogo: p.qrLogo };
  if (!o.logo) { delete o.logo; delete o.qrLogo; }
  area.innerHTML = `<div class="pc-page">${cardSvg('front', o)}</div><div class="pc-page">${cardSvg('back', o)}</div>`;
  const st = document.createElement('style');
  st.textContent = `@page { size: ${W}mm ${H}mm; margin: 0 }
    @media print {
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      body > *:not(#printArea) { display: none !important; }
      #printArea { display: block !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
      #printArea .pc-page { width: ${W}mm; height: ${H}mm; overflow: hidden; break-after: page; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      #printArea .pc-page:last-child { break-after: auto; page-break-after: auto; }
      #printArea svg { display: block; width: ${W}mm; height: ${H}mm; }
    }`;
  document.head.appendChild(st);
  const tidy = () => { st.remove(); if (made) area.remove(); else area.innerHTML = before; window.removeEventListener('afterprint', tidy); };
  window.addEventListener('afterprint', tidy);
  setTimeout(() => window.print(), 120);
  setTimeout(tidy, 60000);
}

// ---------- the window ----------
export function cardSheet({ link, title, site = {}, printable = true, from = null }) {
  const opts = { link, title, site };
  const safe = String(title || 'Jinharsh').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80);
  const all = isAll(title);
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  ov.innerHTML = `<div class="ju-sheet card-sheet" role="dialog" aria-modal="true" aria-label="Visiting card">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="ju-eyebrow">Visiting card</div>
    <h2>Front and back, ready to print</h2>
    <p class="ju-muted card-sub">89 × 51 mm. The QR opens ${all ? 'all our catalogues' : '“' + esc(title) + '”'}, and keeps working after the PDF is replaced.</p>
    ${printable ? '' : `<div class="notice warn card-warn">${icon('circle-alert')}<p><b>Preview only, do not print.</b> Its QR points to the office test address. Print once the site is live at catalog.jinharsh.com.</p></div>`}
    <div class="card-stage" role="button" tabindex="0" aria-label="Turn the card over">
      <div class="card-tilt">
        <div class="card-flip">
          <div class="card-face front">${cardSvg('front', { ...opts, withQr: false })}
            <div class="qr-tile card-qr" data-link="${esc(link)}" style="left:${pct(QR.x, W)};top:${pct(QR.y, H)};width:${pct(QR.s, W)}">${qrSvg(link, { logo: true, title })}</div>
          </div>
          <div class="card-face back" aria-hidden="true">${cardSvg('back', opts)}</div>
        </div>
      </div>
    </div>
    <div class="card-side-row">
      <div class="ju-seg card-seg" role="group" aria-label="Side"><button type="button" class="on" data-side="front" aria-pressed="true">Front</button><button type="button" data-side="back" aria-pressed="false">Back</button></div>
      <span class="ju-muted card-tip">Tap the card to turn it over</span>
    </div>
    <div class="btns card-btns">
      <button class="ju-btn primary" type="button" data-card-pdf>${icon('file-down')}PDF for print shop</button>
      <button class="ju-btn" type="button" data-card-png>${icon('image')}Picture</button>
      <button class="ju-btn" type="button" data-card-svg>${icon('download')}SVG</button>
      <button class="ju-btn" type="button" data-card-print>${icon('printer')}Print</button>
    </div>
    <p class="ju-muted card-foot">PDF: both sides, with the 3 mm edge print shops trim off. Picture and SVG: the side shown.</p>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.card-sheet');
  const stage = ov.querySelector('.card-stage'), tilt = ov.querySelector('.card-tilt'), flipEl = ov.querySelector('.card-flip');
  const faces = { front: ov.querySelector('.card-face.front'), back: ov.querySelector('.card-face.back') };
  let side = 'front', closing = false;

  // turning the card over: a 3D turn, and a little dust shaken off its edges
  const turn = (to) => {
    if (to === side) return;
    side = to;
    flipEl.classList.toggle('is-back', side === 'back');
    faces.front.setAttribute('aria-hidden', side === 'back' ? 'true' : 'false');
    faces.back.setAttribute('aria-hidden', side === 'front' ? 'true' : 'false');
    ov.querySelectorAll('[data-side]').forEach((b) => { const on = b.dataset.side === side; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    try { cardDust(flipEl); } catch {}
  };
  // the card leans a little towards the mouse, like one held in the hand
  const lean = (e) => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
  };
  stage.addEventListener('pointermove', lean, { passive: true });
  stage.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(side === 'front' ? 'back' : 'front'); } });

  const close = (at) => {
    if (closing) return; closing = true;
    document.removeEventListener('keydown', onKey);
    swallow(sheet, { at });
    M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease-in' }).then(() => { ov.remove(); document.body.style.overflow = ''; });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', async (e) => {
    if (e.target === ov) return close();
    const x = e.target.closest('[data-x]');
    if (x) { const b = x.getBoundingClientRect(); return close({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); }
    // a tap on the card turns it over (a tap on its QR only moves the grains)
    if (e.target.closest('.card-stage')) { if (!e.target.closest('.card-qr')) turn(side === 'front' ? 'back' : 'front'); return; }
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.matches('[data-side]')) return turn(b.dataset.side);
    try {
      if (b.matches('[data-card-pdf]')) {
        b.disabled = true;
        try { saveBlob(await cardPdf(opts), `Visiting card ${safe}.pdf`); toast('Saved: send this PDF to the print shop'); } finally { b.disabled = false; }
      }
      if (b.matches('[data-card-png]')) { saveBlob(await cardPng(side, opts), `Visiting card ${safe} (${side}).png`); toast(`Picture of the ${side} saved (300 dpi)`); }
      if (b.matches('[data-card-svg]')) { saveBlob(new Blob([await cardFile(side, opts)], { type: 'image/svg+xml' }), `Visiting card ${safe} (${side}).svg`); toast(`SVG of the ${side} saved`); }
      if (b.matches('[data-card-print]')) await printCard(opts);
    } catch { toast('Could not make the file. Please try again.'); }
  });

  // the card comes together out of grains (in the card's own colours) from the button that opened it
  if (from) {
    stage.style.visibility = 'hidden';
    const go = (p) => {
      const pic = new Image();
      pic.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cardSvg('front', { ...opts, ...(p || {}) }));
      pic.decode().catch(() => {}).then(() => bindImage(from, stage, { cols: 48, sample: pic }));
    };
    // the logo and font make the grains' colours right; never wait more than a moment for them
    Promise.race([pack().catch(() => null), new Promise((r) => setTimeout(() => r(null), 250))]).then(go);
    setTimeout(() => { if (stage.style.visibility === 'hidden' && !document.querySelector('canvas[aria-hidden]')) stage.style.visibility = ''; }, 2600);
  }
}
