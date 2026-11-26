// The visitor side of the sales features (the server side is server/activity.mjs):
//   track(type, code)              a visit, a read, a download, a share or a video, sent quietly in the background
//   beforeDownload({ from }, go)   the first download on this device: an optional "who's downloading?" window, then go()
//   querySheet({ code, title, from, message })   "Send a query": name, company, email or phone, message
// What a visitor types is remembered on this device, so they type it only once, and goes with their next visits.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { swallow, pourInto, sparkle } from './particles.js';
import { sendTrack, sendInquiry } from './backend.js';

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
export function querySheet({ code = '', title = '', from = null, onTop = false, message = '' } = {}) {
  const v = visitor();
  const phone = (SITE.contact?.phones || [])[0];
  const s = openSheet(`
    <div class="ju-eyebrow">Send a query</div>
    <h2>${title ? `About “${esc(title)}”` : 'Ask us anything'}</h2>
    <p class="ju-muted form-sub">Prices, stock, delivery, a part number or a replacement: our team will get back to you.</p>
    <form novalidate>
      ${fields(v, { needName: true })}
      <label class="field"><span>Your question</span><textarea class="ju-inp area" name="message" rows="4" maxlength="2000" placeholder="Part number, quantity, where it is needed…">${esc(message)}</textarea></label>
      <label class="hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="form-err" hidden></p>
      <div class="btns form-btns">
        <button class="ju-btn accent" type="submit">${icon('send')}Send</button>
      </div>
      <p class="ju-small ju-muted form-note">${icon('lock')}Give an email or a phone number so we can reply.</p>
    </form>`, { from, onTop, label: 'Send a query' });
  const form = s.sheet.querySelector('form'), err = form.querySelector('.form-err'), btn = form.querySelector('[type=submit]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = read(form);
    err.hidden = true;
    if (!f.name) { M.shake(form.elements.name); form.elements.name.focus(); return; }
    if (!f.email && !f.phone) { M.shake(form.elements.email.closest('.two')); form.elements.email.focus(); return; }
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { M.shake(form.elements.email); return; }
    remember({ name: f.name, company: f.company, email: f.email, phone: f.phone });
    btn.disabled = true;
    try {
      await sendInquiry({ ...f, code, title, device: device(), source: source() });
    } catch (ex) {
      btn.disabled = false;
      err.textContent = (ex && ex.message) || 'Could not send. Please try again.';
      err.hidden = false; M.shake(err);
      return;
    }
    // sent: the form gives way to a thank-you, a tick drawing itself and a little spray of grains
    await M.resize(s.sheet, () => {
      s.sheet.querySelector('form').remove();
      s.sheet.querySelector('.form-sub').remove();
      s.sheet.querySelector('h2').textContent = 'Thank you, ' + f.name.split(' ')[0] + '!';
      s.sheet.insertAdjacentHTML('beforeend', `
        <div class="sent">
          <div class="sent-tick">${icon('circle-check', 'i-draw')}</div>
          <p>Your query is with our team. We will get back to you soon${f.phone ? ' on ' + esc(f.phone) : f.email ? ' at ' + esc(f.email) : ''}.</p>
          ${phone ? `<p class="ju-small ju-muted">Urgent? Call <a href="tel:${esc(phone.dial)}">${esc(phone.display)}</a></p>` : ''}
          <div class="btns form-btns"><button class="ju-btn primary" type="button" data-done>Done</button></div>
        </div>`);
    }, 'gentle');
    try { sparkle(s.sheet.querySelector('.sent-tick'), { n: 30 }); } catch {}
    s.sheet.querySelector('[data-done]').addEventListener('click', (ev) => s.close(centre(ev.currentTarget)));
    toast('Query sent');
  });
}
