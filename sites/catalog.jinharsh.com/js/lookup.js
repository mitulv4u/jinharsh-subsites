// Finding things for visitors, shared by the search box, the query window and the helper: catalogues by name and
// brand, and (when the site has it, see tools/php-hub/make-extras.mjs) the pages that mention a part number or a word.
//   configure({ catalogs, search })   the page's catalogue list and the address of the page-text file
//   brands(), catalogs()              what the site has
//   findCatalogs(q)                   catalogues whose name, brand or category match
//   findPages(q, { max, perCat })     pages that contain every word: [{ code, page, score, snippet (HTML) }]
//   loadPages()                       fetch the page texts now (e.g. when a search box is touched)
import { esc } from './markup.js';

let LIST = [], URL_ = '', index = null, loading = null;

export function configure({ catalogs = [], search = '' } = {}) {
  if (catalogs.length) LIST = catalogs;
  if (search) URL_ = search;
}
export const catalogs = () => LIST;
export const catalogOf = (code) => LIST.find((d) => d.code === code) || null;
export const brands = () => [...new Set(LIST.map((d) => d.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
export const hasPages = () => !!URL_;

export function loadPages() {
  if (!URL_) return Promise.resolve(null);
  return loading || (loading = fetch(URL_).then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j || !j.cats) return null;
    index = Object.entries(j.cats).map(([code, pages]) => ({ code, pages, low: pages.map((p) => String(p).toLowerCase()) }));
    return index;
  }).catch(() => null));
}

const norm = (q) => String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();
const wordsOf = (q) => norm(q).split(' ').filter((w) => w.length > 1 || /\d/.test(w));

export function findCatalogs(q) {
  const ws = wordsOf(q);
  if (!ws.length) return [];
  return LIST.filter((d) => { const t = [d.title, d.brand, d.category, d.note].join(' ').toLowerCase(); return ws.every((w) => t.includes(w)); });
}
export function findBrands(q) {
  const s = norm(q);
  if (s.length < 2) return [];
  return brands().filter((b) => b.toLowerCase().startsWith(s) || s.includes(b.toLowerCase()));
}

// every word must be on the page; the whole phrase together ranks higher
export async function findPages(q, { max = 8, perCat = 3 } = {}) {
  if (!index) await loadPages();
  if (!index) return [];
  const s = norm(q), ws = wordsOf(q);
  if (!ws.length) return [];
  const out = [];
  for (const c of index) {
    let n = 0;
    for (let i = 0; i < c.low.length && n < perCat; i++) {
      const t = c.low[i];
      if (!ws.every((w) => t.includes(w))) continue;
      const at = t.indexOf(s);
      out.push({ code: c.code, page: i + 1, score: at >= 0 ? 2 : 1, snippet: snippet(c.pages[i], t, at >= 0 ? s : ws[0], ws) });
      n++;
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}

// a short piece of the page around the words, the words marked (built from the text, then made safe)
function snippet(text, low, first, words) {
  const at = Math.max(0, low.indexOf(first));
  const from = Math.max(0, at - 38), to = Math.min(text.length, at + first.length + 70);
  const raw = text.slice(from, to), lo = raw.toLowerCase();
  const spans = [];
  for (const w of new Set(words)) for (let k = lo.indexOf(w); k >= 0; k = lo.indexOf(w, k + w.length)) spans.push([k, k + w.length]);
  spans.sort((a, b) => a[0] - b[0]);
  let s = '', pos = 0;
  for (const [a, b] of spans) {
    if (b <= pos) continue;
    const st = Math.max(a, pos);
    s += esc(raw.slice(pos, st)) + `<mark>${esc(raw.slice(st, b))}</mark>`;
    pos = b;
  }
  s += esc(raw.slice(pos));
  return (from ? '…' : '') + s + (to < text.length ? '…' : '');
}

// does this look like a part number? (letters and digits together, or a long number: 22220 EJW33, 6205-2RS, LM48548)
export const looksLikePart = (q) => /\b(?=[a-z0-9-]*\d)[a-z0-9][a-z0-9-]{3,}\b/i.test(q || '');
