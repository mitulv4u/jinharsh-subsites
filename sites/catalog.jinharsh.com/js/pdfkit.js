// Small helpers around PDF.js (Mozilla's PDF reader), loaded only when a page needs it.
let lib = null;
export async function pdfjs() {
  if (lib) return lib;
  lib = await import('/hub/vendor/pdfjs/pdf.min.js');
  lib.GlobalWorkerOptions.workerSrc = '/hub/vendor/pdfjs/pdf.worker.min.js';
  return lib;
}

export const PDF_OPTS = {
  cMapUrl: '/hub/vendor/pdfjs/cmaps/', cMapPacked: true,
  standardFontDataUrl: '/hub/vendor/pdfjs/standard_fonts/',
  wasmUrl: '/hub/vendor/pdfjs/wasm/', iccUrl: '/hub/vendor/pdfjs/iccs/',
  isEvalSupported: false,
};

const ui = (fn) => { try { const r = fn(); if (r && r.catch) r.catch(() => {}); } catch {} };

// The small copy of a cover (a canvas or a loaded picture), for lists and the front page: 360 px wide,
// about a sixth of the bytes of the full cover. Returns { blob, w, h }.
export async function makeThumb(src, width = 360) {
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  if (!sw || !sh) throw new Error('no picture');
  const w = Math.min(width, sw), h = Math.round((sh * w) / sw);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { alpha: false });
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  let blob = await new Promise((ok) => cv.toBlob(ok, 'image/webp', 0.8));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.8));
  if (!blob) throw new Error('no picture');
  return { blob, w, h };
}

// Reads a chosen file: page count, a good title guess, and a cover picture of page 1.
export async function inspectPdf(file, coverWidth = 720) {
  const L = await pdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = L.getDocument({ data, ...PDF_OPTS });
  const doc = await task.promise;
  let metaTitle = '';
  try { metaTitle = (await doc.getMetadata())?.info?.Title || ''; } catch {}
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = coverWidth / base.width;
  const vp = page.getViewport({ scale });
  const cv = document.createElement('canvas');
  cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  const g = cv.getContext('2d', { alpha: false });
  g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: g, canvas: cv, viewport: vp, background: '#ffffff' }).promise;
  const webp = await new Promise((ok) => cv.toBlob(ok, 'image/webp', 0.84));
  const cover = webp && webp.type === 'image/webp' ? webp : await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.84));
  const out = { pages: doc.numPages, title: guessTitle(metaTitle, file.name), cover, coverW: cv.width, coverH: cv.height, canvas: cv };
  ui(() => task.destroy());
  return out;
}

// "Final Jinharsh Catalogue - 8th Nov 2025.cdr" -> "Jinharsh Catalogue - 8th Nov 2025"
// "FLYER 28th Oct 2025 (1)-compressed.pdf"      -> "Flyer 28th Oct 2025"
export function guessTitle(meta, fileName) {
  const tidy = (s) => String(s || '')
    .replace(/\.(pdf|cdr|docx?|pptx?|xlsx?|indd|ai|psd|odt)$/i, '')
    .replace(/^microsoft (word|powerpoint|excel)\s*-\s*/i, '')
    .replace(/(^|[-_ ])(compressed|optimi[sz]ed|min|final|copy)(?=$|[-_ .(])/gi, ' ')
    .replace(/\(\d+\)/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/\s+/g, ' ').trim();
  const nice = (s) => s.replace(/\b([A-Z]{4,})\b/g, (w) => w[0] + w.slice(1).toLowerCase());
  const m = tidy(meta);
  if (m && m.split(' ').length >= 2 && !/^untitled|^document\d*$/i.test(m)) return nice(m).slice(0, 140);
  return nice(tidy(fileName)).slice(0, 140) || 'Document';
}

export function fmtSize(b) {
  if (!b && b !== 0) return '';
  if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
  return (b / 1048576).toFixed(b < 10 * 1048576 ? 1 : 0) + ' MB';
}
