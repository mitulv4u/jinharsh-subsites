// QR codes with the Jinharsh logo in the middle, drawn in the browser from the catalogue's permanent link (/?cat=<id>).
// The same link always gives the same QR, so a QR made today and one made next year are identical.
import qrcode from '/hub/vendor/qrcode.js';

const LOGO_URL = '/hub/assets/qr-logo.png';

// level M (15% damage allowed) for plain codes: fewer, bigger squares = easier to scan off a small card.
// level H (30%) when the Jinharsh logo sits in the middle, so the hidden squares are rebuilt by the scanner.
export function makeQR(text, logo = false) {
  const qr = qrcode(0, logo ? 'H' : 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  // the square left free for the logo: about a fifth of the width, centred, odd number of modules
  let hole = 0;
  if (logo) { hole = Math.round(n * 0.24); if (hole % 2 !== n % 2) hole += 1; }
  const h0 = (n - hole) / 2, h1 = h0 + hole;
  const dark = (r, c) => qr.isDark(r, c) && !(hole && r >= h0 && r < h1 && c >= h0 && c < h1);
  return { n, dark, hole, h0, logo };
}

function pathOf(q, m) {
  let d = '';
  for (let r = 0; r < q.n; r++) {
    let c = 0;
    while (c < q.n) {
      if (!q.dark(r, c)) { c++; continue; }
      let len = 1;
      while (c + len < q.n && q.dark(r, c + len)) len++;
      d += `M${c + m} ${r + m}h${len}v1h-${len}z`;
      c += len;
    }
  }
  return d;
}

let logoData = null;
export async function logoDataUrl() {
  if (logoData) return logoData;
  const blob = await (await fetch(LOGO_URL)).blob();
  logoData = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(blob); });
  return logoData;
}

// An SVG: sharp at any size, which is what printers want.
// opts.logoHref: image address for the logo (a data: address makes the file stand alone).
export function qrSvg(text, { logo = false, margin = 4, logoHref = LOGO_URL, title = '' } = {}) {
  const q = makeQR(text, logo);
  const s = q.n + margin * 2;
  let extra = '';
  if (logo) {
    const pad = 0.45, x = q.h0 + margin + pad, w = q.hole - pad * 2;
    extra = `<rect x="${q.h0 + margin + 0.2}" y="${q.h0 + margin + 0.2}" width="${q.hole - 0.4}" height="${q.hole - 0.4}" rx="${q.hole * 0.2}" fill="#fff"/>` +
      `<image href="${logoHref}" x="${x}" y="${x}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="${title ? 'QR code: ' + esc(title) : 'QR code'}">` +
    `<rect width="${s}" height="${s}" fill="#fff"/><path d="${pathOf(q, margin)}" fill="#000"/>${extra}</svg>`;
}

// A standalone SVG file (logo embedded, so it opens anywhere).
export async function qrSvgFile(text, logo) {
  const href = logo ? await logoDataUrl() : undefined;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + qrSvg(text, { logo, logoHref: href }).replace('<svg ', '<svg width="1000" height="1000" ');
}

// A PNG picture, about `px` wide, every square a whole number of pixels (no blur).
export async function qrPng(text, logo, px = 2000) {
  const q = makeQR(text, logo), margin = 4, s = q.n + margin * 2;
  const k = Math.max(4, Math.round(px / s)), size = s * k;
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#000';
  for (let r = 0; r < q.n; r++) for (let c = 0; c < q.n; c++) if (q.dark(r, c)) g.fillRect((c + margin) * k, (r + margin) * k, k, k);
  if (logo) {
    const img = new Image(); img.src = await logoDataUrl(); await img.decode();
    const x0 = (q.h0 + margin + 0.2) * k, w0 = (q.hole - 0.4) * k, rad = q.hole * 0.2 * k;
    g.fillStyle = '#fff'; g.beginPath();
    if (g.roundRect) g.roundRect(x0, x0, w0, w0, rad); else g.rect(x0, x0, w0, w0);
    g.fill();
    const x1 = (q.h0 + margin + 0.45) * k, w1 = (q.hole - 0.9) * k;
    g.drawImage(img, x1, x1, w1, w1);
  }
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
