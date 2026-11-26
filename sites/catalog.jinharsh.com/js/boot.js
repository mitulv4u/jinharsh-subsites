// catalog.jinharsh.com: the Jinharsh Catalogues pages on Mitul's PHP hub. His api.php keeps the list of catalogues
// (and the visits, queries and team uploads); this file turns his list into what the pages expect, then starts the
// front page, or a catalogue's own page for /?cat=<id>. Built by tools/php-hub/build.mjs in the Jinharsh Catalogues
// app (github.com/adi6499/PDFUPLOADER) - change it there, not here.
const SITE = {"company":{"name":"Jinharsh Industrial Solutions Private Limited","short":"Jinharsh","tagline":"Your complete industrial solutions provider"},"contact":{"phones":[{"label":"Office","display":"022-409 000 00","dial":"+912240900000"},{"label":"Mobile","display":"+91 80001 04000","dial":"+918000104000"}],"whatsapp":"912240900000","email":"crm@jinharsh.com","website":"https://www.jinharsh.com","address":"76/78 Nagdevi Street, Ground Floor, Mumbai 400003"},"links":[{"label":"Technical Wiki","href":"https://catalog.jinharsh.co.in/index.php/Product_Range"}],"nav":{"query":true,"studio":true,"links":[{"label":"Team Portal","href":"/hub/team.html"},{"label":"Technical Wiki","href":"https://catalog.jinharsh.co.in/index.php/Product_Range","external":true},{"label":"jinharsh.com","href":"https://www.jinharsh.com","external":true}]}};

// details a visitor typed on the old hub page are kept, so they are not asked again
try {
  if (!localStorage.getItem('jd_visitor')) {
    const o = JSON.parse(localStorage.getItem('jh_visitor') || 'null');
    if (o && (o.name || o.email || o.phone)) localStorage.setItem('jd_visitor', JSON.stringify({ name: o.name || '', company: o.company || '', email: o.email || '', phone: o.phone || '' }));
  }
} catch {}

async function getList() {
  try { const l = await window.CATALOGS_REQ; if (Array.isArray(l)) return l; } catch {}
  try { const l = await (await fetch('/hub/api.php?action=catalogs')).json(); if (Array.isArray(l)) return l; } catch {}
  try { const l = await (await fetch('/hub/catalogs.json')).json(); if (Array.isArray(l)) return l; } catch {}
  return [];
}
const getCovers = () => fetch('/hub/covers/covers.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));

// "2.4 MB" (what the team upload stores) -> bytes
const bytesOf = (s) => { const m = /([\d.]+)\s*(KB|MB|GB)/i.exec(String(s || '')); return m ? Math.round(+m[1] * { KB: 1024, MB: 1048576, GB: 1073741824 }[m[2].toUpperCase()]) : null; };

function toDoc(c, covers) {
  const url = String(c.pdfUrl || '');
  const pdf = /\.pdf(\?|#|$)/i.test(url);
  const own = pdf && /^\/(?!\/)/.test(url);
  const abs = /^https?:/i.test(url) ? url : location.origin + url;
  const m = covers[c.id] || {};
  return {
    code: c.id, title: c.title, brand: c.brand || '', note: c.description || '',
    category: [...new Set([c.category, c.badge].filter(Boolean))].join(' · '),
    status: 'live', media: [],
    // a link to an interactive portal (not a PDF) is shown like our "on the maker's website" catalogues
    waiting: !pdf, sourceUrl: pdf ? '' : url,
    cover: m.w ? `/hub/covers/${c.id}.webp` : null, thumb: m.w ? `/hub/covers/${c.id}-t.webp` : null, coverW: m.w || null, coverH: m.h || null,
    pages: m.pages || null, size: m.size || bytesOf(c.pages),
    file: pdf ? url : '', download: pdf ? url : '', name: `${c.id}.pdf`,
    // a PDF on another website cannot be read from here: the reader shows it in Google's viewer (as the hub did)
    frame: pdf && !own ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(abs)}` : '', frameLabel: 'Google viewer',
    updatedAt: c.uploaded_at ? String(c.uploaded_at).replace(' ', 'T') + '+05:30' : '',
  };
}

// the page's frame (top bar etc.) for the front page or for a catalogue (index.html already put one in)
function useShell(kind) {
  if (document.body.dataset.shell === kind) return;
  [...document.body.children].forEach((el) => { if (el.tagName !== 'TEMPLATE' && el.tagName !== 'SCRIPT') el.remove(); });
  document.body.className = kind === 'view' ? 'viewer' : 'viewer hub';
  document.body.dataset.shell = kind;
  document.body.insertBefore(document.getElementById('t-' + kind).content.cloneNode(true), document.body.querySelector('script'));
}

const want = new URLSearchParams(location.search).get('cat');
const [list, covers] = await Promise.all([getList(), getCovers()]);
const docs = list.filter((c) => c && c.id && c.title).map((c) => toDoc(c, covers));
window.__HUB_CATS = Object.fromEntries(docs.map((d) => [d.code, { title: d.title, brand: d.brand }]));
const doc = want ? docs.find((d) => d.code === want) : null;

let boot, entry;
if (doc) {
  useShell('view');
  const others = docs.filter((d) => !d.waiting && d.code !== doc.code && d.cover).slice(0, 24);
  const menu = docs.map((d) => ({ code: d.code, title: d.title, brand: d.brand, category: d.category, thumb: d.thumb || d.cover, waiting: !!d.waiting, link: !!d.waiting && !!d.sourceUrl }));
  boot = { status: doc.waiting ? 'waiting' : 'live', doc, countsScans: false, others, menu, site: SITE, publicUrl: location.origin, printable: true };
  document.title = `${doc.title} · ${SITE.company?.short || 'Jinharsh'}`;
  entry = '/hub/js/view.js';
} else {
  // the front page (an unknown /?cat= link lands here too, as on the old hub)
  useShell('hub');
  // the hub's own order is kept (the page sorts newest first, so each gets a stand-in date in that order)
  const t0 = Date.UTC(2020, 0, 1);
  boot = { catalogs: docs.map((d, i) => ({ ...d, updatedAt: new Date(t0 - i * 60000).toISOString() })), publicUrl: location.origin, site: SITE, printable: true };
  entry = '/hub/js/hub.js';
}
const s = document.createElement('script');
s.type = 'application/json'; s.id = 'boot';
s.textContent = JSON.stringify(boot).replace(/</g, '\\u003c');
document.body.appendChild(s);
await import(entry);
