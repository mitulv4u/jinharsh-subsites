// The PHP catalogue hub's version of public/js/backend.js (copied in by tools/php-hub/build.mjs): Mitul's api.php
// keeps the visits and the queries, so these calls send exactly the fields his page always sent.
export const catPath = (code) => `/?cat=${encodeURIComponent(code)}`;   // the hub's catalogue links (printed QR codes)
export const teamPath = '/hub/team.html';

// title and brand of each catalogue, for his records (set by boot.js from his list)
const cat = (code) => (window.__HUB_CATS && window.__HUB_CATS[code]) || {};
const deviceOf = (d) => (d === 'computer' ? 'Desktop' : 'Mobile');
const sourceOf = (s) => (s === 'QR or direct' ? 'qr-direct' : s || 'direct');
// his analytics counts 'visit' and 'download'; a read was a 'view' there
const TYPES = { visit: 'visit', hub: 'visit', read: 'view', download: 'download' };

export function sendTrack(ev) {
  const c = cat(ev.code), v = ev.visitor || {};
  const body = JSON.stringify({
    type: TYPES[ev.type] || ev.type,
    catalog_id: ev.code || '', catalog_title: c.title || '', brand: c.brand || '',
    email: v.email || '', name: v.name || '', company: v.company || '',
    source: sourceOf(ev.source), referrer: document.referrer || '', page_url: location.href, device: deviceOf(ev.device),
  });
  fetch('/hub/api.php?action=track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

export async function sendInquiry(q) {
  if (q.website) return;   // the hidden field only robots fill in
  const c = cat(q.code);
  const r = await fetch('/hub/api.php?action=inquiry', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: q.name || '', company: q.company || '', email: q.email || '', phone: q.phone || '', message: q.message || '',
      catalog_id: q.code || '', catalog_title: q.title || c.title || '', brand: c.brand || '',
      source: sourceOf(q.source), device: deviceOf(q.device),
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false) throw new Error(j.error || 'Could not send. Please try again, or call us.');
}

// uploading happens on the hub's own Team Portal (Google sign-in there), not from the front page
export const canUpload = () => Promise.resolve(false);
