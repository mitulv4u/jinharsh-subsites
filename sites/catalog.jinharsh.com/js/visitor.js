// The visitor side of the sales features (the server side is server/activity.mjs):
//   track(type, code)              a visit, a read, a download, a share or a video, sent quietly in the background
//   beforeDownload({ from }, go)   the first download on this device: an optional "who's downloading?" window, then go()
//   querySheet({ code, title, from, message, page })   "Send a query": what they need (with suggestions), contact once
// What a visitor types is remembered on this device, so they type it only once, and goes with their next visits.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { swallow, pourInto, sparkle } from './particles.js';
import { sendTrack, sendInquiry } from './backend.js';
import { loadPages, findPages, findCatalogs, findBrands, catalogOf } from './lookup.js';
import { byeHtml } from './goodbye.js';
import { jiniSvg } from './jini.js';

const KEY = 'jd_visitor', ASKED = 'jd_dl_asked', SRC = 'jd_src';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (t) => { try { JUI.toast(t); } catch {} };
let SITE = {};
export const setSite = (s) => { SITE = s || {}; };

export const visitor = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } };
function remember(v) {
  try {
    const keep = Object.fromEntries(Object.entries(v).filter(([, x]) => x));
    localStorage.setItem(KEY, JSON.stringify({ ...visitor(), ...keep }));
  } catch {}
}
export function device() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  return /Mobi|iPhone|Android/i.test(ua) ? 'phone' : 'computer';
}
// where this visit came from: a tag in the link (?src= / utm_source=), the site that sent them, or "QR or direct"
// (a scanned QR sends no referrer). Worked out on the first page of a visit and kept for the rest of it.
export function source() {
  try { const s = sessionStorage.getItem(SRC); if (s) return s; } catch {}
  const p = new URLSearchParams(location.search);
  let s = p.get('utm_source') || p.get('src') || '';
  if (!s) {
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch {}
    if (ref === location.hostname) ref = '';
    s = /whatsapp|wa\.me/.test(ref) ? 'whatsapp' : /(^|\.)google\./.test(ref) ? 'google' : /linkedin|lnkd/.test(ref) ? 'linkedin'
      : /facebook|fb\.com/.test(ref) ? 'facebook' : /instagram/.test(ref) ? 'instagram' : /bing\./.test(ref) ? 'bing'
      : ref || (device() === 'computer' ? 'direct' : 'QR or direct');
  }
  s = s.slice(0, 40);
  try { sessionStorage.setItem(SRC, s); } catch {}
  return s;
}

export function track(type, code = '') {
  try {
    const v = visitor();
    sendTrack({ type, code, device: device(), source: source(), visitor: v.name || v.email || v.phone ? v : undefined });
  } catch {}
}

// ---------- a small window (used by both forms) ----------
function openSheet(inner, { from = null, onTop = false, label = '' } = {}) {
  const ov = document.createElement('div');
  ov.className = 'ju-overlay';
  if (onTop) ov.style.zIndex = '130'; // above the reader
  ov.innerHTML = `<div class="ju-sheet form-sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>${inner}</div>`;
  document.body.appendChild(ov);
  const wasOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const sheet = ov.querySelector('.ju-sheet');
  let closed = false;
  const close = (at) => {
    if (closed) return Promise.resolve(); closed = true;
    document.removeEventListener('keydown', onKey);
    swallow(sheet, { at });
    return M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: 'ease-in' }).then(() => { ov.remove(); document.body.style.overflow = wasOverflow; });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => {
    if (e.target === ov) close();
    const x = e.target.closest('[data-x]');
    if (x) { const b = x.getBoundingClientRect(); close({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); }
  });
  if (from && from.getBoundingClientRect) { const r = from.getBoundingClientRect(); try { pourInto({ left: r.left, top: r.top, width: r.width, height: r.height }, sheet); } catch {} }
  setTimeout(() => { const f = sheet.querySelector('[autofocus]'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); }, 80);
  return { ov, sheet, close };
}
const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const fields = (v, { needName = false } = {}) => `
  <div class="two">
    <label class="field"><span>Your name${needName ? '' : ' (optional)'}</span><input class="ju-inp" name="name" autocomplete="name" maxlength="80" value="${esc(v.name)}" autofocus></label>
    <label class="field"><span>Company</span><input class="ju-inp" name="company" autocomplete="organization" maxlength="120" value="${esc(v.company)}"></label>
  </div>
  <div class="two">
    <label class="field"><span>Email</span><input class="ju-inp" name="email" type="email" inputmode="email" autocomplete="email" maxlength="120" value="${esc(v.email)}"></label>
    <label class="field"><span>Phone / WhatsApp</span><input class="ju-inp" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" value="${esc(v.phone)}"></label>
  </div>`;
const read = (form) => Object.fromEntries(['name', 'company', 'email', 'phone', 'message', 'website'].map((k) => [k, (form.elements[k]?.value || '').trim()]));

// ---------- before the first download ----------
// Asked once per device, and it can always be skipped: the download never waits for a form.
export function needsDetails() {
  const v = visitor();
  try { if (localStorage.getItem(ASKED)) return false; } catch { return false; }
  return !(v.email || v.phone);
}
export function beforeDownload({ from = null, onTop = false } = {}, go) {
  const v = visitor();
  const s = openSheet(`
    <div class="ju-eyebrow">Download</div>
    <h2>Before you download</h2>
    <p class="ju-muted form-sub">Tell us who is downloading, so we can help with prices, stock and delivery. You can skip this.</p>
    <form novalidate>
      ${fields(v)}
      <div class="btns form-btns">
        <button class="ju-btn ghost" type="button" data-skip>Skip, just download</button>
        <button class="ju-btn primary" type="submit">${icon('arrow-down-to-line')}Download</button>
      </div>
      <p class="ju-small ju-muted form-note">${icon('lock')}Only our team sees this, to answer your questions.</p>
    </form>`, { from, onTop, label: 'Before you download' });
  const done = (save) => {
    try { localStorage.setItem(ASKED, '1'); } catch {}
    if (save) { const f = read(s.sheet.querySelector('form')); remember({ name: f.name, company: f.company, email: f.email, phone: f.phone }); }
    s.close(from ? centre(from) : null);
    setTimeout(go, 120);
  };
  s.sheet.querySelector('[data-skip]').addEventListener('click', () => done(false));
  s.sheet.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = read(e.currentTarget);
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { M.shake(e.currentTarget.elements.email); return; }
    done(true);
  });
}

// ---------- "Send a query" ----------
// One box for what they need (with examples in it and suggestions from our catalogues as they type), small taps for
// price / stock / delivery, and their contact details only the first time: after that it is one tap to send.
const EXAMPLES = ['e.g. 22220 EJW33 spherical roller bearing, 40 nos', 'e.g. Rexnord Omega coupling E50, 2 nos', 'e.g. Shell Omala S2 GX 220 gear oil, 20 litres',
  'e.g. Groz grease gun for the workshop, 10 nos', 'e.g. Flexco fasteners for a 1200 mm belt'];
const NEEDS = ['Price', 'Stock', 'Delivery time', 'Datasheet', 'Replacement'];
const reachOf = (s) => { s = String(s || '').trim(); return s.includes('@') ? { email: s, phone: '' } : { email: '', phone: s }; };
const okReach = (s) => { const r = reachOf(s); return r.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) : r.phone.replace(/\D/g, '').length >= 7; };

export function querySheet({ code = '', title = '', from = null, onTop = false, message = '', page = 0 } = {}) {
  const v = visitor();
  const known = !!(v.name && (v.email || v.phone));
  const phone = (SITE.contact?.phones || [])[0], wa = SITE.contact?.whatsapp;
  let about = code ? { code, title, page } : null;
  const s = openSheet(`
    <div class="ju-eyebrow q-eyebrow">${icon('message-square-text')}Send a query</div>
    <h2>What do you need?</h2>
    <div class="q-host form-sub"><span class="q-jini">${jiniSvg()}</span><p>Tell me what you need: a part number, a product or a brand. I will pass it straight to our team, and they will reply with price, stock and delivery.</p></div>
    <form novalidate class="q-form">
      <div class="q-about" hidden></div>
      <div class="q-box">
        <textarea class="ju-inp area q-msg" name="message" rows="3" maxlength="2000" placeholder="${esc(EXAMPLES[0])}" aria-label="What you need" autofocus>${esc(message)}</textarea>
        <div class="q-sugg" role="listbox" aria-label="From our catalogues" hidden></div>
      </div>
      <div class="q-label">What would you like to know?</div>
      <div class="q-needs" role="group" aria-label="What would you like to know">${NEEDS.map((n) => `<button type="button" class="ju-chip" aria-pressed="false" data-need="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <div class="q-more">
        <div class="q-qty"><span class="q-label">How many</span>
          <span class="q-step"><button type="button" data-qty="-1" aria-label="Fewer">−</button><input name="qty" inputmode="numeric" maxlength="7" placeholder="Qty" aria-label="Quantity"><button type="button" data-qty="1" aria-label="More">+</button></span>
          <select class="ju-inp q-unit" name="unit" aria-label="Unit">${['nos', 'sets', 'metres', 'litres', 'kg', 'boxes'].map((u) => `<option>${u}</option>`).join('')}</select></div>
        <div class="q-when"><span class="q-label">Needed</span>
          <select class="ju-inp" name="when" aria-label="When it is needed"><option value="">Any time</option><option>Urgently</option><option>This week</option><option>This month</option><option>Just checking the price</option></select></div>
      </div>
      ${known ? `<div class="q-me">${icon('user')}<span>We will reply to <b>${esc(v.name)}</b> · ${esc(v.phone || v.email)}</span><button type="button" class="q-change">Change</button></div>` : ''}
      <div class="q-contact"${known ? ' hidden' : ''}>
        <div class="two">
          <label class="field"><span>Your name</span><input class="ju-inp" name="name" autocomplete="name" maxlength="80" value="${esc(v.name)}" placeholder="e.g. Rakesh Shah"></label>
          <label class="field"><span>Phone or email</span><input class="ju-inp" name="reach" autocomplete="tel" maxlength="120" value="${esc(v.phone || v.email)}" placeholder="+91 98200 11223 or you@company.com"></label>
        </div>
        <label class="field"><span>Company <i class="ju-muted">(if you like)</i></span><input class="ju-inp" name="company" autocomplete="organization" maxlength="120" value="${esc(v.company)}" placeholder="e.g. Tata Steel"></label>
      </div>
      <label class="hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="form-err" hidden></p>
      <button class="ju-btn accent q-send" type="submit">${icon('send')}Send query</button>
      ${phone || wa ? `<p class="ju-small ju-muted q-alt">Rather talk? ${phone ? `<a href="tel:${esc(phone.dial)}">Call ${esc(phone.display)}</a>` : ''}${phone && wa ? ' · ' : ''}${wa ? `<a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp us</a>` : ''}</p>` : ''}
    </form>`, { from, onTop, label: 'Send a query' });
  const form = s.sheet.querySelector('form'), err = form.querySelector('.form-err'), btn = form.querySelector('[type=submit]');
  const msg = form.elements.message, sugg = form.querySelector('.q-sugg'), aboutEl = form.querySelector('.q-about');

  // what it is about (a catalogue, maybe a page of it): shown as a small tag that can be removed
  const paintAbout = () => {
    aboutEl.hidden = !about;
    aboutEl.innerHTML = about ? `${icon('book-open')}<span>About <b>${esc(about.title)}</b>${about.page > 1 ? ` · page ${about.page}` : ''}</span><button type="button" class="ju-icon" data-unabout aria-label="Not about this catalogue">${icon('x')}</button>` : '';
  };
  paintAbout();
  aboutEl.addEventListener('click', (e) => { if (e.target.closest('[data-unabout]')) { about = null; paintAbout(); msg.focus(); } });

  // the examples in the box change every few seconds while it is empty, so people see what to write
  let ex = 0;
  const exTimer = setInterval(() => { if (!s.sheet.isConnected) { clearInterval(exTimer); return; } if (!msg.value) { ex = (ex + 1) % EXAMPLES.length; msg.placeholder = EXAMPLES[ex]; } }, 2600);

  // suggestions from our catalogues while typing: brands, catalogues, and pages that mention a part number
  let st = 0, seq = 0;
  msg.addEventListener('input', () => { clearTimeout(st); st = setTimeout(suggest, 220); });
  msg.addEventListener('focus', () => loadPages(), { once: true });
  async function suggest() {
    const text = msg.value.trim(), my = ++seq;
    // a part number if there is one (letters and digits, like 6205-2RS or 22220EJW33); otherwise the last few words,
    // leaving out quantities and filler (10 nos, need, please...)
    const part = (text.match(/[a-z0-9][a-z0-9./-]{3,}/gi) || []).filter((t) => /\d/.test(t) && /[a-z]/i.test(t)).pop()
      || (text.match(/\d{4,}/g) || []).pop();
    const FILL = /^(\d{1,3}|nos?|pcs|pieces?|qty|units?|litres?|liters?|ltrs?|kg|kgs|need|needs|want|required|require|please|pls|for|of|the|a|an|and|with|price|rate|quote)$/i;
    const q = part || text.split(/\s+/).filter((w) => !FILL.test(w)).slice(-3).join(' ');
    if (q.length < 2) { sugg.hidden = true; return; }
    const cats = findCatalogs(q).slice(0, 2), bs = findBrands(q).slice(0, 2);
    const pages = await findPages(q, { max: 3, perCat: 1 });
    if (my !== seq) return;
    const rows = [
      ...pages.map((p) => { const d = catalogOf(p.code) || { title: p.code }; return { code: p.code, title: d.title, page: p.page, html: `${icon('file-text')}<span><b>${esc(d.title)}</b><small>Page ${p.page} · ${p.snippet}</small></span>` }; }),
      ...cats.filter((d) => !pages.some((p) => p.code === d.code)).map((d) => ({ code: d.code, title: d.title, page: 0, html: `${icon('book-open')}<span><b>${esc(d.title)}</b><small>${esc(d.brand || '')} catalogue</small></span>` })),
      ...bs.filter((b) => !cats.some((d) => d.brand === b)).map((b) => ({ brand: b, html: `${icon('badge-check')}<span><b>${esc(b)}</b><small>We supply ${esc(b)}</small></span>` })),
    ].slice(0, 4);
    if (!rows.length) { sugg.hidden = true; return; }
    sugg.innerHTML = `<div class="q-sugg-h">${icon('search')}Found in our catalogues: tap to add</div>` + rows.map((r, i) => `<button type="button" class="q-s" data-i="${i}">${r.html}</button>`).join('');
    sugg._rows = rows;
    if (sugg.hidden) { sugg.hidden = false; M.play(sugg, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180 }); }
  }
  sugg.addEventListener('click', (e) => {
    const b = e.target.closest('.q-s'); if (!b) return;
    const r = sugg._rows[+b.dataset.i];
    if (r.code) { about = { code: r.code, title: r.title, page: r.page }; paintAbout(); M.bump(aboutEl, 1.03); }
    else if (r.brand && !msg.value.toLowerCase().includes(r.brand.toLowerCase())) msg.value = `${r.brand} ${msg.value}`.trim();
    sugg.hidden = true;
    msg.focus();
  });

  // − / + on the quantity (typing works too)
  form.querySelector('.q-step').addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]'); if (!b) return;
    const q = form.elements.qty, n = Math.max(0, (parseInt(q.value, 10) || 0) + Number(b.dataset.qty));
    q.value = n ? String(n) : '';
    M.bump(q, 1.08);
  });
  form.elements.qty.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });
  // Jini talks for a moment when the window opens
  const jiniEl = s.sheet.querySelector('.q-jini');
  if (jiniEl) { jiniEl.classList.add('talk', 'wave'); setTimeout(() => jiniEl.classList.remove('talk'), 2200); setTimeout(() => jiniEl.classList.remove('wave'), 2300); }

  // price / stock / delivery... one tap each
  form.querySelector('.q-needs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-need]'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); b.classList.toggle('on', on); M.bump(b, 1.06);
  });
  const change = form.querySelector('.q-change');
  if (change) change.addEventListener('click', () => {
    form.querySelector('.q-me').remove();
    const c = form.querySelector('.q-contact'); c.hidden = false;
    M.play(c, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 260 });
    form.elements.name.focus();
  });

  const fail = (el, text) => { err.textContent = text; err.hidden = false; M.shake(el); if (el.focus) el.focus(); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const needs = [...form.querySelectorAll('[data-need].on')].map((b) => b.dataset.need.toLowerCase());
    const text = msg.value.trim();
    if (!text && !needs.length && !about) return fail(msg, 'Tell us what you need: a part number, product or brand.');
    const name = form.elements.name.value.trim(), reach = form.elements.reach.value.trim();
    if (!name) { form.querySelector('.q-contact').hidden = false; return fail(form.elements.name, 'Please add your name, so we know who to reply to.'); }
    if (!okReach(reach)) { form.querySelector('.q-contact').hidden = false; return fail(form.elements.reach, 'Please add a phone number or an email, so we can reply.'); }
    const r = reachOf(reach), company = form.elements.company.value.trim();
    const qty = form.elements.qty.value.trim(), when_ = form.elements.when.value;
    const full = [text, needs.length ? `Need: ${needs.join(', ')}` : '', qty ? `Quantity: ${qty} ${form.elements.unit.value}` : '', when_ ? `Needed: ${when_.toLowerCase()}` : '',
      about && about.page > 1 ? `Catalogue: ${about.title}, page ${about.page}` : ''].filter(Boolean).join('\n');
    remember({ name, company, email: r.email, phone: r.phone });
    btn.disabled = true;
    btn.innerHTML = `${icon('send')}Sending…`;
    try {
      await sendInquiry({ name, company, email: r.email, phone: r.phone, message: full || 'Please contact me.', website: form.elements.website.value,
        code: about ? about.code : '', title: about ? about.title : '', device: device(), source: source() });
    } catch (ex) {
      btn.disabled = false; btn.innerHTML = `${icon('send')}Send query`;
      return fail(err, (ex && ex.message) || 'Could not send. Please try again.');
    }
    clearInterval(exTimer);
    // sent: a thank-you, a tick drawing itself, and a warm "see you later"
    await M.resize(s.sheet, () => {
      form.remove();
      s.sheet.querySelector('.form-sub').remove();
      s.sheet.querySelector('h2').textContent = `Thank you, ${name.split(' ')[0]}!`;
      s.sheet.insertAdjacentHTML('beforeend', `
        <div class="sent">
          <div class="sent-tick">${icon('circle-check', 'i-draw')}</div>
          <p>Your query is with our team. We will get back to you soon${r.phone ? ' on ' + esc(r.phone) : ' at ' + esc(r.email)}.</p>
          ${byeHtml({ title: 'See you later!', text: 'We are glad you came to us. Anything else, anytime: we are right here.' })}
          ${phone ? `<p class="ju-small ju-muted">Urgent? Call <a href="tel:${esc(phone.dial)}">${esc(phone.display)}</a></p>` : ''}
          <div class="btns form-btns"><button class="ju-btn primary" type="button" data-done>Done</button></div>
        </div>`);
    }, 'gentle');
    try { sparkle(s.sheet.querySelector('.sent-tick'), { n: 30 }); } catch {}
    s.sheet.querySelector('[data-done]').addEventListener('click', (ev) => s.close(centre(ev.currentTarget)));
    try { sessionStorage.setItem('jd_bye', '1'); } catch {}   // (no "leaving already?" after a query has been sent)
    toast('Query sent');
  });
}
