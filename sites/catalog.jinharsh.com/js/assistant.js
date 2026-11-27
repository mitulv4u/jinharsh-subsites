// The Jinharsh helper: a friendly chat in the corner of every catalogue page. It works without any AI service (no
// running cost): it understands the usual things people ask (a part number, a brand, a price, a person to talk to,
// where we are), finds them inside our catalogues (lookup.js), and takes a query step by step, sending it with one
// tap at the end. The chat goes with the visitor from page to page during a visit.
//   startHelper({ site, current })   current = { code, title } on a catalogue's page
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { esc } from './markup.js';
import { pageLink } from './peek.js';
import { catPath, sendInquiry } from './backend.js';
import { visitor, device, source } from './visitor.js';
import { findPages, findCatalogs, findBrands, brands, catalogs, catalogOf, loadPages } from './lookup.js';
import { byeHtml } from './goodbye.js';
import { startJini, jiniSvg } from './jini.js';

const KEY = 'jd_chat';
const $ = (s, el = document) => el.querySelector(s);
let SITE = {}, HERE = null, ui = null, jini = null, state = { open: false, log: [], flow: null, greeted: false };

const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, log: state.log.slice(-60) })); } catch {} };
const load = () => { try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.log)) state = { ...state, ...s }; } catch {} };
const first = (n) => String(n || '').trim().split(/\s+/)[0];
const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function startHelper({ site = {}, current = null } = {}) {
  SITE = site; HERE = current;
  load();
  const box = document.createElement('div');
  box.className = 'as has-jini';
  box.innerHTML = `
    <button class="as-fab" type="button" aria-label="Chat with the Jinharsh helper" aria-expanded="false">${icon('message-circle')}<i class="as-on"></i></button>
    <div class="as-hint" hidden></div>
    <section class="as-panel" role="dialog" aria-label="Jinharsh helper" hidden>
      <header class="as-head">
        <span class="as-av">${jiniSvg()}</span>
        <span class="as-who"><b>Jini · Jinharsh helper</b><small><i class="as-on"></i>Here to help you find things</small></span>
        <button class="ju-icon as-x" type="button" aria-label="Close the chat">${icon('x')}</button>
      </header>
      <div class="as-log" aria-live="polite"></div>
      <div class="as-quick"></div>
      <form class="as-in">
        <input class="ju-inp" name="t" autocomplete="off" maxlength="300" placeholder="Part number, brand or question…" aria-label="Your message">
        <button class="ju-btn accent as-send" type="submit" aria-label="Send">${icon('send')}</button>
      </form>
    </section>`;
  document.body.appendChild(box);
  ui = { box, fab: $('.as-fab', box), hint: $('.as-hint', box), panel: $('.as-panel', box), log: $('.as-log', box), quick: $('.as-quick', box), form: $('.as-in', box) };
  ui.log.innerHTML = state.log.map((m) => bubble(m)).join('');
  ui.fab.addEventListener('click', () => (ui.panel.hidden ? open() : close()));
  $('.as-x', box).addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ui.panel.hidden) close(); });
  ui.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = ui.form.elements.t.value.trim();
    if (!t) return;
    ui.form.elements.t.value = '';
    me(t);
    handle(t);
  });
  ui.quick.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; me(b.textContent.trim()); act(b.dataset.act, b.dataset.arg || ''); });
  ui.log.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; e.preventDefault(); me(b.textContent.trim()); act(b.dataset.act, b.dataset.arg || ''); });
  // Jini, the helper you can see: she walks around the page, waves, has a tip now and then, and opens this chat
  const tips = HERE
    ? [`Want a price for <b>${esc(HERE.title)}</b>? Tap me.`, 'Press <b>Read now</b> to flip through every page.', 'You can download it too, or share it on WhatsApp.', 'Looking for a size or a part number? Tap me and type it.']
    : ['Type a part number in the search box: I will find the page for you.', 'Tap the 👁 on a card for a quick look inside.', 'Need a price? Tap me and tell me the part.', 'Not sure which catalogue? Tell me what you need.'];
  try {
    jini = startJini({ onOpen: () => (ui.panel.hidden ? open() : close()), tips,
      hello: HERE ? `Hi! I'm Jini from Jinharsh 👋 Need a price for this one? Tap me.` : `Hi! I'm Jini from Jinharsh 👋 Looking for a part? Tap me.` });
  } catch { box.classList.remove('has-jini'); }   // (the round button stays, if she could not appear)
  if (state.open) open(false);
  else if (!state.greeted && !jini) nudge();
}

// a small "can I help?" bubble by the button, once per visit, after a little while
function nudge() {
  let seen = false; try { seen = !!sessionStorage.getItem('jd_chat_hint'); } catch {}
  if (seen) return;
  setTimeout(() => {
    if (!ui.panel.hidden || document.querySelector('.ju-overlay, .reader-ov')) return;
    try { sessionStorage.setItem('jd_chat_hint', '1'); } catch {}
    ui.hint.innerHTML = HERE ? `Need a price for <b>${esc(HERE.title)}</b>? I can help.` : 'Looking for a part number? I can find it for you.';
    ui.hint.hidden = false;
    M.play(ui.hint, [{ opacity: 0, transform: 'translateY(8px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    ui.hint.onclick = () => open();
    setTimeout(() => { if (!ui.hint.hidden) M.play(ui.hint, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).then(() => { ui.hint.hidden = true; }); }, 9000);
  }, HERE ? 20000 : 12000);
}

export function openHelper(text = '') { open(); if (text) { me(text); handle(text); } }

function open(animate = true) {
  ui.hint.hidden = true;
  if (jini) jini.hide();
  ui.panel.hidden = false;
  ui.fab.setAttribute('aria-expanded', 'true');
  ui.box.classList.add('is-open');
  state.open = true; save();
  if (animate) M.play(ui.panel, [{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  ui.log.scrollTop = ui.log.scrollHeight;
  loadPages();
  if (!state.greeted) { state.greeted = true; greet(); }
  else if (!ui.quick.innerHTML) quick(state.flow ? [] : MENU);
  if (matchMedia('(pointer: fine)').matches) setTimeout(() => ui.form.elements.t.focus(), 60);
}
function close() {
  state.open = false; save();
  ui.fab.setAttribute('aria-expanded', 'false');
  ui.box.classList.remove('is-open');
  M.play(ui.panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.98)' }], { duration: 200, easing: 'ease-in' }).then(() => { ui.panel.hidden = true; if (jini) jini.show(); });
}

// ---------- the conversation ----------
const bubble = (m) => `<div class="as-msg ${m.who}">${m.html}</div>`;
function push(who, html) {
  state.log.push({ who, html }); save();
  ui.log.insertAdjacentHTML('beforeend', bubble({ who, html }));
  const el = ui.log.lastElementChild;
  M.play(el, [{ opacity: 0, transform: `translateY(8px) scale(.98)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  ui.log.scrollTo({ top: ui.log.scrollHeight, behavior: M.calm() ? 'auto' : 'smooth' });
}
const me = (t) => { quick([]); push('me', esc(t)); };
// the helper "types" for a moment, like a person would
async function say(html, chips = null) {
  ui.log.insertAdjacentHTML('beforeend', '<div class="as-msg bot as-typing"><i></i><i></i><i></i></div>');
  ui.log.scrollTo({ top: ui.log.scrollHeight, behavior: 'smooth' });
  await wait(Math.min(1100, 380 + html.replace(/<[^>]+>/g, '').length * 6));
  ui.log.querySelector('.as-typing')?.remove();
  push('bot', html);
  if (chips) quick(chips);
}
function quick(list) {
  ui.quick.innerHTML = list.map(([label, a, arg = '']) => `<button type="button" class="ju-chip" data-act="${a}" data-arg="${esc(arg)}">${esc(label)}</button>`).join('');
  if (list.length) M.rise(ui.quick.children, { step: 40, y: 6 });
}
const MENU = [['Find a part number', 'find'], ['Get a price', 'price'], ['Our brands', 'brands'], ['Talk to a person', 'person']];

function greet() {
  const v = visitor();
  const name = v.name ? `, ${esc(first(v.name))}` : '';
  if (HERE) say(`${hello()}${name}! 👋 I see you are looking at <b>${esc(HERE.title)}</b>. I can get you a price, find a part inside it, or put you in touch with our team.`,
    [['Price for this', 'price', HERE.code], ['Find a part', 'find'], ['Talk to a person', 'person']]);
  else say(`${hello()}${name}! 👋 Welcome to Jinharsh. Tell me a part number, a product or a brand, and I will find it in our catalogues. I can also send your query to our team in one tap.`, MENU);
}

// what they wrote -> what to do
function handle(text) {
  const t = text.toLowerCase();
  if (state.flow) return step(text);
  if (/^(hi+|hello|hey|hii|namaste|namaskar|good (morning|afternoon|evening)|yo)\b/.test(t) && t.length < 25) return say(`${hello()}! 😊 What are you looking for today?`, MENU);
  if (/\b(thank|thanks|thx|bye|goodbye|see you|that'?s all|nothing else)\b/.test(t)) return act('bye');
  if (/\b(call|phone|number|whats ?app|talk|person|human|someone|contact|speak|executive|agent)\b/.test(t)) return act('person');
  if (/\b(address|where are you|location|located|office|visit you|map)\b/.test(t)) return act('where');
  if (/\b(price|prices|quote|quotation|rate|rates|cost|how much|buy|order|purchase|enquiry|inquiry)\b/.test(t)) return act('price', '', text);
  if (/\b(brands?|catalogu?es?|what do you (sell|have|supply|deal)|products|range|deal in)\b/.test(t)) return act('brands');
  if (/\b(deliver|delivery|shipping|dispatch|stock|available|availability|lead time)\b/.test(t)) {
    return say('Our team confirms stock and delivery time for each item. Tell me the part and the quantity, and I will send it to them right away.', [['Send a query', 'price'], ['Talk to a person', 'person']]);
  }
  return find(text);
}

async function act(a, arg = '', text = '') {
  if (a === 'qty') return step(arg);   // (a chip with a quantity on it answers the quantity question)
  if (a === 'menu') return say('Sure! What would you like to do?', MENU);
  if (a === 'find') return say('Type the part number, product or brand (for example <b>22220 EJW33</b>, <b>grease gun</b> or <b>Omega coupling</b>), and I will look inside our catalogues.');
  if (a === 'brands') {
    const bs = brands();
    return say(bs.length ? `We have catalogues from <b>${bs.map(esc).join('</b>, <b>')}</b>. Which one would you like?` : 'Tell me the brand you need, and I will check for you.',
      bs.slice(0, 8).map((b) => [b, 'brand', b]));
  }
  if (a === 'brand') {
    // that brand's own catalogues (a catalogue that only mentions the brand, like the master guide, is not one of them)
    const own = catalogs().filter((d) => (d.brand || '').toLowerCase() === arg.toLowerCase());
    const list = (own.length ? own : findCatalogs(arg)).slice(0, 4);
    return say(list.length ? `Here ${list.length === 1 ? 'is' : 'are'} our <b>${esc(arg)}</b> catalogue${list.length === 1 ? '' : 's'}:${list.map(catCard).join('')}` : `I could not find a ${esc(arg)} catalogue here, but our team can help.`,
      [['Ask for a price', 'price'], ['Something else', 'find']]);
  }
  if (a === 'person') return say(contactHtml(), [['Send a query instead', 'price'], ['Back to search', 'find']]);
  if (a === 'where') {
    const ad = SITE.contact?.address;
    return say(ad ? `We are at <b>${esc(ad)}</b>. <a class="as-link" href="https://www.google.com/maps/search/${encodeURIComponent(ad)}" target="_blank" rel="noopener">Open in Maps</a>` : 'Our team will share the address with you.', [['Talk to a person', 'person'], ['Find a part', 'find']]);
  }
  if (a === 'bye') {
    return say(byeHtml({ title: 'See you later!', text: 'It was lovely helping you. Come back anytime: we are always here for you.' }), [['One more thing', 'menu']]);
  }
  if (a === 'price') return startQuery({ about: arg ? catalogOf(arg) : null, text });   // arg: a catalogue's code
  if (a === 'ask') return startQuery({ text: arg });                                      // arg: what they searched for
  if (a === 'send') return send();
  if (a === 'restart') { state.flow = null; save(); return say('No problem. What do you need?', MENU); }
  if (a === 'skip') return step('');
}

async function find(text) {
  const [pages, cats] = [await findPages(text, { max: 4, perCat: 2 }), findCatalogs(text).slice(0, 3)];
  const bs = findBrands(text);
  if (!pages.length && !cats.length) {
    return say(`I could not find “${esc(text)}” in our catalogues yet${bs.length ? `, but we do supply <b>${esc(bs[0])}</b>` : ''}. Our team can source it for you: shall I send it to them?`,
      [['Yes, send it', 'ask', text], ['Talk to a person', 'person'], ['Search again', 'find']]);
  }
  const html = (pages.length ? `I found <b>${esc(text)}</b> here:` : 'Here is what I found:')
    + pages.map((p) => pageCard(p)).join('') + cats.filter((d) => !pages.some((p) => p.code === d.code)).map(catCard).join('');
  await say(html, [['Get a price for this', 'ask', text], ['Search something else', 'find'], ['Talk to a person', 'person']]);
}
function pageCard(p) {
  const d = catalogOf(p.code) || { title: p.code };
  return `<a class="as-hit" href="${esc(pageLink(p.code, p.page))}"><span class="as-thumb">${d.thumb || d.cover ? `<img src="${esc(d.thumb || d.cover)}" alt="">` : ''}</span>
    <span><b>${esc(d.title)}</b><small>Page ${p.page} · ${p.snippet}</small></span></a>`;
}
function catCard(d) {
  return `<a class="as-hit" href="${esc(catPath(d.code))}"><span class="as-thumb">${d.thumb || d.cover ? `<img src="${esc(d.thumb || d.cover)}" alt="">` : ''}</span>
    <span><b>${esc(d.title)}</b><small>${esc([d.brand, d.pages ? `${d.pages} page${d.pages == 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '))}</small></span></a>`;
}
function contactHtml() {
  const c = SITE.contact || {}, ph = (c.phones || [])[0];
  return `You can reach our team directly:<div class="as-contact">
    ${ph ? `<a class="ju-btn sm" href="tel:${esc(ph.dial)}">${icon('phone')}Call ${esc(ph.display)}</a>` : ''}
    ${c.whatsapp ? `<a class="ju-btn sm" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp</a>` : ''}
    ${c.email ? `<a class="ju-btn sm" href="mailto:${esc(c.email)}">${icon('mail')}${esc(c.email)}</a>` : ''}</div>`;
}

// ---------- a query, one question at a time ----------
function startQuery({ about = null, text = '' } = {}) {
  const here = about || (HERE ? { code: HERE.code, title: HERE.title } : null);
  state.flow = { step: text.trim() ? 'qty' : 'what', what: text.trim(), about: here ? { code: here.code, title: here.title } : null };
  save();
  if (state.flow.step === 'what') return say(`Happy to help${here ? ` with <b>${esc(here.title)}</b>` : ''}! What exactly do you need? A part number, size or product name is perfect.`, [['Cancel', 'restart']]);
  return say(`Got it: <b>${esc(state.flow.what)}</b>. How many do you need?`, [['1', 'qty', '1'], ['5', 'qty', '5'], ['10', 'qty', '10'], ['Not sure yet', 'skip']]);
}

async function step(text) {
  const f = state.flow, v = visitor();
  if (/^(cancel|stop|never ?mind|no thanks)$/i.test(text.trim())) return act('restart');
  if (f.step === 'what') {
    if (!text.trim()) return say('Just type what you need, for example <b>6205 2RS bearing</b>.');
    f.what = text.trim(); f.step = 'qty'; save();
    return say('How many do you need?', [['1', 'qty', '1'], ['5', 'qty', '5'], ['10', 'qty', '10'], ['Not sure yet', 'skip']]);
  }
  if (f.step === 'qty') {
    f.qty = /^not sure/i.test(text) ? '' : text.trim();
    f.step = v.name ? (v.email || v.phone ? 'confirm' : 'reach') : 'name'; save();
  } else if (f.step === 'name') {
    if (!text.trim()) return say('May I have your name, please?');
    f.name = text.trim().slice(0, 80); f.step = v.email || v.phone ? 'confirm' : 'reach'; save();
  } else if (f.step === 'reach') {
    const s = text.trim(), email = s.includes('@');
    if (email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) : s.replace(/\D/g, '').length < 7) return say('Hmm, that does not look complete. Could you type your phone number (with WhatsApp) or your email?');
    f.email = email ? s : ''; f.phone = email ? '' : s; f.step = 'confirm'; save();
  }
  if (f.step === 'name') return say('Lovely! And your name, please?');
  if (f.step === 'reach') return say(`Thanks${f.name ? ', ' + esc(first(f.name)) : ''}! What is the best phone number (WhatsApp) or email for our reply?`);
  if (f.step === 'confirm') {
    const name = f.name || v.name, reach = f.phone || f.email || v.phone || v.email;
    return say(`Here is your query:<div class="as-sum">
        ${f.about ? `<div><span>About</span><b>${esc(f.about.title)}</b></div>` : ''}
        <div><span>Need</span><b>${esc(f.what)}</b></div>${f.qty ? `<div><span>Quantity</span><b>${esc(f.qty)}</b></div>` : ''}
        <div><span>Reply to</span><b>${esc(name)} · ${esc(reach)}</b></div></div>Shall I send it to our team?`,
      [['Send now', 'send'], ['Start again', 'restart']]);
  }
}

async function send() {
  const f = state.flow, v = visitor();
  if (!f || f.step !== 'confirm') return act('menu');
  const name = f.name || v.name, email = f.email || (f.phone ? '' : v.email) || '', phone = f.phone || (f.email ? '' : v.phone) || '';
  try {
    await sendInquiry({ name, company: v.company || '', email, phone, message: [f.what, f.qty ? `Quantity: ${f.qty}` : ''].filter(Boolean).join('\n'),
      code: f.about ? f.about.code : '', title: f.about ? f.about.title : '', device: device(), source: source() });
  } catch (e) {
    return say(`Sorry, that did not go through (${esc((e && e.message) || 'no connection')}). Shall I try again?`, [['Try again', 'send'], ['Talk to a person', 'person']]);
  }
  try { localStorage.setItem('jd_visitor', JSON.stringify({ ...v, name, ...(email ? { email } : {}), ...(phone ? { phone } : {}) })); } catch {}
  try { sessionStorage.setItem('jd_bye', '1'); } catch {}
  state.flow = null; save();
  await say(`Sent! ✅ Thank you, <b>${esc(first(name))}</b>. Our team will get back to you soon${phone ? ` on <b>${esc(phone)}</b>` : email ? ` at <b>${esc(email)}</b>` : ''}.`);
  return say(byeHtml({ title: 'See you later!', text: 'Thank you for trusting Jinharsh. Anything else, anytime: we are right here.' }), [['Ask something else', 'menu']]);
}
