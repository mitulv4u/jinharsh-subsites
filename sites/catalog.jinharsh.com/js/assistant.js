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
import { read, intentOf, decodeBearing, convert, brandInfo, siteHelp, isYes, isNo } from './jini-brain.js';

const KEY = 'jd_chat';
const $ = (s, el = document) => el.querySelector(s);
let SITE = {}, HERE = null, ui = null, jini = null, state = { open: false, log: [], flow: null, greeted: false, ctx: {}, offer: null };

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

// ---------- what they wrote -> what to do ----------
// Jini reads the whole message (jini-brain.js): part numbers, quantities, names, phone numbers, emails, companies,
// cities, brands, "urgent". What she learns is remembered for the rest of the visit, so "price?" or "yes" later on
// means the part you were talking about; your name and number are kept so you are never asked twice.
const ctxOf = () => (state.ctx = state.ctx || {});
function learn(info) {
  const c = ctxOf();
  if (info.parts.length) c.part = info.parts.slice(0, 3).join(', ');
  if (info.qty) { c.qty = info.qty; c.unit = info.unit; }
  if (info.city) c.city = info.city;
  if (info.urgent) c.urgent = true;
  if (info.brands.length) c.brand = info.brands[0];
  const v = visitor(), add = {};
  if (info.name && !v.name) add.name = info.name;
  if (info.phone && !v.phone) add.phone = info.phone;
  if (info.email && !v.email) add.email = info.email;
  if (info.company && !v.company) add.company = info.company;
  if (Object.keys(add).length) { try { localStorage.setItem('jd_visitor', JSON.stringify({ ...v, ...add })); } catch {} }
  save();
}
// a yes/no question she asked: a typed "yes" or "no" answers it
const offer = (yes, arg = '') => { state.offer = { yes, arg }; save(); };
const contactRow = () => [['Talk to a person', 'person']];

const SIDE = ['greet', 'bot', 'thanks', 'bye', 'person', 'where', 'hours', 'order', 'convert', 'help', 'brands'];
async function handle(text) {
  const t = text.trim(), info = read(t), intent = intentOf(t);
  learn(info);
  if (state.flow) {
    const f = state.flow, answer = isYes(t) || isNo(t);
    // after a side question Jini asked "shall we carry on?": yes carries on, no cancels
    if (state.side && answer) { state.side = false; save(); return isYes(t) ? next() : act('restart'); }
    state.side = false;
    // a new request while one is ready to send: start the new one
    if (f.step === 'confirm' && !answer && (info.parts.length || info.brands.length || ['price', 'stock'].includes(intent))) { state.flow = null; save(); }
    // a question on the side (or anything that is not an answer to what was asked): answer it, then offer to carry on
    else if (!answer && (SIDE.includes(intent) || !fits(f.step, t, info, intent))) {
      await answer_(t, info, intent);
      state.offer = null;
      if (intent === 'bye' || !state.flow) return;
      state.side = true; save();
      return say(f.step === 'confirm' ? `Your query for <b>${esc(f.what)}</b> is ready whenever you are.` : 'Shall we carry on with your query?',
        f.step === 'confirm' ? [['Send now', 'send'], ['Cancel it', 'restart']] : [['Carry on', 'resume'], ['Cancel it', 'restart']]);
    } else return step(t, info);
  }
  return answer_(t, info, intent);
}
// does this message answer what Jini just asked?
function fits(stepName, t, info, intent) {
  if (stepName === 'confirm') return false;
  if (stepName === 'what') return true;
  if (stepName === 'qty') return !!info.qty || /^\s*\d+(\.\d+)?\s*$/.test(t) || /^(not sure|don'?t know|skip|later)/i.test(t);
  if (stepName === 'name') return !!info.name || (/^[a-z][a-z .'-]{1,40}$/i.test(t) && !isYes(t) && !isNo(t) && !intent && t.split(/\s+/).length <= 4);
  if (stepName === 'reach') return !!(info.phone || info.email);
  return true;
}
async function answer_(t, info, intent) {
  const c = ctxOf();
  if (state.offer) {
    const o = state.offer; state.offer = null; save();
    if (isYes(t)) return act(o.yes, o.arg);
    if (isNo(t)) return say('No problem 🙂 What else can I find for you?', MENU);
  }
  if (/^(how|where (do|can) i|can i|is it possible|what if i)\b/i.test(t)) { const h = siteHelp(t); if (h) return say(h, [['Find a part', 'find'], ['Talk to a person', 'person']]); }
  switch (intent) {
    case 'greet': return say(`${hello()}! 😊 Tell me a part number, a product or a brand: I will find it in our catalogues, explain it, or get you a price.`, MENU);
    case 'thanks': return say(`You are most welcome${visitor().name ? ', ' + esc(first(visitor().name)) : ''}! 😊 Anything else I can find for you?`, [['Get a price', 'price'], ['No, that is all', 'bye']]);
    case 'bye': return act('bye');
    case 'bot': return say(`I am <b>Jini</b>, the Jinharsh helper on this site 👋 I am not a person, but I know our catalogues page by page: I can find parts, explain bearing numbers, convert units and send your query. For anything else, our team (real people!) is one tap away.`, [['Find a part', 'find'], ['Talk to a person', 'person']]);
    case 'person': return act('person');
    case 'where': return act('where');
    case 'hours': return say(`I don't have the office timings with me, sorry. You can send a query any time and our team will reply during working hours, or call them directly:${contactHtml(true)}`, [['Send a query', 'price']]);
    case 'order': return say(`For an order, a dispatch, an invoice or a payment, our team has the details. The quickest way is to call or WhatsApp them:${contactHtml(true)}`, [['Send a message instead', 'price']]);
    case 'convert': { const s = convert(t); if (s) return say(`${s}<br><span class="as-soft">Rounded; for exact sizes check the catalogue table.</span>`, [['Find a part', 'find'], ['Get a price', 'price']]); break; }
    case 'help': { const h = siteHelp(t); if (h) return say(h, [['Find a part', 'find'], ['Talk to a person', 'person']]); break; }
    case 'brands': return act('brands');
    default: break;
  }
  // a bearing number: say what it is, show where it is in our catalogues, and offer a price
  const bearing = info.parts.map(decodeBearing).find(Boolean);
  if (bearing && (intent === 'decode' || intent === '' || intent === 'catalog')) return explainBearing(bearing, t);
  if (intent === 'price' || intent === 'stock') {
    if (intent === 'stock' && !info.parts.length && !c.part) return say('Our team confirms stock and delivery time for each item. Which part, and how many?', [['Send a query', 'price'], ['Talk to a person', 'person']]);
    const said = productOf(t, info);
    return startQuery({ text: info.parts.length ? whatOf(t, info) : said, fromCtx: !info.parts.length && !said });
  }
  if (intent === 'catalog' || (info.brands.length && !info.parts.length)) {
    if (info.brands.length) return act('brand', info.brands[0]);
    return act('catalogs');
  }
  if (intent === 'decode' && !info.parts.length) return say('Tell me the number you see on the part (for example <b>6205-2RS</b>, <b>22220 EJW33</b> or <b>UCP208</b>) and I will explain it.');
  return find(t);
}
// the product in a sentence like "need 20 litres shell omala gear oil urgently for Pune" -> "shell omala gear oil"
function productOf(t, info) {
  let s = whatOf(t, info)
    .replace(/\b(hi|hello|please|pls|kindly|i|we|you|need|needs|want|wants|require|required|requirement|looking for|send|give|get|share|quote|quotation|price|prices|rate|rates|cost|of|for|the|a|an|me|us|some|your|best|urgent|urgently|asap|immediately|today|stock|available|availability|do you have|have)\b/gi, ' ')
    .replace(new RegExp(`\\b${info.qty || '#'}\\s*(${'nos?|pcs?|pieces?|units?|sets?|pairs?|litres?|liters?|ltrs?|l|kg|kgs|metres?|meters?|m|boxes?|drums?|pails?|rolls?'})?\\b`, 'i'), ' ')
    .replace(info.city ? new RegExp(`\\b(in|to|at|delivery)?\\s*${info.city}\\b`, 'i') : /$^/, ' ')
    .replace(/\b(qty|quantity|x)\b/gi, ' ').replace(/[?,.!]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return s.split(' ').filter((w) => w.length > 1).length >= 1 && /[a-z]{3,}/i.test(s) ? s : '';
}
// what they need, in their words, without the contact details
const whatOf = (t, info) => t.replace(info.email, '').replace(info.phone, '').replace(/\b(i am|i'm|my name is|this is)\s+[a-z]+(\s+[a-z]+)?/i, '').replace(/\s{2,}/g, ' ').replace(/[,\s]+$/, '').trim();

async function explainBearing(b, t) {
  ctxOf().part = b.code; save();
  const pages = await findPages(b.code.split(' ')[0], { max: 2, perCat: 1 });
  const html = `<b>${esc(b.code)}</b> is ${b.kind}${b.bore ? `, with a <b>${b.bore} mm</b> bore` : ''}.`
    + (b.notes.length ? `<ul class="as-list">${b.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '')
    + (pages.length ? `In our catalogues:${pages.map(pageCard).join('')}` : '')
    + 'Shall I get you the price and stock for it?';
  offer('ask', b.code);
  return say(html, [['Yes, get a price', 'ask', b.code], ['Something else', 'find']]);
}

async function act(a, arg = '', text = '') {
  if (a === 'qty') return step(arg, read(arg));   // (a chip with a quantity on it answers the quantity question)
  if (a === 'menu') return say('Sure! What would you like to do?', MENU);
  if (a === 'find') return say('Type the part number, product or brand (for example <b>22220 EJW33</b>, <b>grease gun</b> or <b>Omega coupling</b>), and I will look inside our catalogues. You can also write it all in one line, like <b>40 pcs 6205-2RS for Pune</b>.');
  if (a === 'brands') {
    const bs = brands();
    return say(bs.length ? `We have catalogues from <b>${bs.map(esc).join('</b>, <b>')}</b>. Which one would you like to know about?` : 'Tell me the brand you need, and I will check for you.',
      bs.slice(0, 8).map((b) => [b, 'brand', b]));
  }
  if (a === 'brand') {
    ctxOf().brand = arg; save();
    // that brand's own catalogues (a catalogue that only mentions the brand, like the master guide, is not one of them)
    const own = catalogs().filter((d) => (d.brand || '').toLowerCase() === arg.toLowerCase());
    const list = (own.length ? own : findCatalogs(arg)).slice(0, 4);
    const about = brandInfo(arg);
    return say(`${about ? esc(about) + '<br>' : ''}${list.length ? `Here ${list.length === 1 ? 'is' : 'are'} our <b>${esc(arg)}</b> catalogue${list.length === 1 ? '' : 's'}:${list.map(catCard).join('')}` : `I don't have a ${esc(arg)} catalogue here yet, but our team can help.`}`,
      [[`Price for ${arg} parts`, 'price'], ['Another brand', 'brands'], ...contactRow()]);
  }
  if (a === 'catalogs') {
    const list = catalogs().filter((d) => !d.waiting).slice(0, 6);
    return say(`Here are our catalogues. Open one to read it, or tell me what you are looking for:${list.map(catCard).join('')}`, [['Our brands', 'brands'], ['Find a part', 'find']]);
  }
  if (a === 'person') {
    const c = ctxOf(), item = (state.flow && state.flow.what) || c.part || '';
    const what = item ? [item, state.flow && state.flow.qty ? state.flow.qty : c.qty ? `${c.qty} ${c.unit || 'nos'}` : ''].filter(Boolean).join(', ') : '';
    return say(`Our team will be happy to help${what ? ` with <b>${esc(what)}</b>` : ''}:${contactHtml(false, what)}`, [['Send a query instead', 'price'], ['Back to search', 'find']]);
  }
  if (a === 'where') {
    const ad = SITE.contact?.address;
    return say(ad ? `We are at <b>${esc(ad)}</b>. <a class="as-link" href="https://www.google.com/maps/search/${encodeURIComponent(ad)}" target="_blank" rel="noopener">Open in Maps</a>` : 'Our team will share the address with you.', [['Talk to a person', 'person'], ['Find a part', 'find']]);
  }
  if (a === 'bye') {
    return say(byeHtml({ title: 'See you later!', text: 'It was lovely helping you. Come back anytime: we are always here for you.' }), [['One more thing', 'menu']]);
  }
  if (a === 'price') return startQuery({ about: arg ? catalogOf(arg) : null, text, fromCtx: !text });   // arg: a catalogue's code
  if (a === 'ask') return startQuery({ text: arg });                                                      // arg: what they searched for
  if (a === 'send') return send();
  if (a === 'restart') { state.flow = null; save(); return say('No problem 🙂 What do you need?', MENU); }
  if (a === 'skip') return step('', read(''));
  if (a === 'resume') return state.flow ? next() : say('What do you need?', MENU);
}

async function find(text) {
  const [pages, cats] = [await findPages(text, { max: 4, perCat: 2 }), findCatalogs(text).slice(0, 3)];
  const bs = findBrands(text);
  if (!pages.length && !cats.length) {
    // nothing for the whole sentence: try its strongest words (a part number, then the longer words)
    const words = (read(text).parts[0] || text.split(/\s+/).filter((w) => w.length > 3 && !/^(need|want|have|with|from|that|this|what|your|please|price|about|which)$/i.test(w)).slice(0, 2).join(' ')).trim();
    if (words && words.toLowerCase() !== text.trim().toLowerCase()) {
      const p2 = await findPages(words, { max: 4, perCat: 2 });
      if (p2.length) { ctxOf().part = words; save(); offer('ask', text); return say(`Here is what our catalogues say about <b>${esc(words)}</b>:${p2.map(pageCard).join('')}Want a price for it?`, [['Yes, get a price', 'ask', text], ['Search again', 'find'], ...contactRow()]); }
    }
    offer('ask', text);
    return say(`I could not find “${esc(text)}” in our catalogues${bs.length ? `, but we do supply <b>${esc(bs[0])}</b>` : ''}. Our team can source it for you: shall I send it to them?`,
      [['Yes, send it', 'ask', text], ['Talk to a person', 'person'], ['Search again', 'find']]);
  }
  ctxOf().part = text; save();
  offer('ask', text);
  const html = (pages.length ? `I found <b>${esc(text)}</b> here:` : 'Here is what I found:')
    + pages.map((p) => pageCard(p)).join('') + cats.filter((d) => !pages.some((p) => p.code === d.code)).map(catCard).join('');
  await say(html + 'Want a price for it?', [['Get a price for this', 'ask', text], ['Search something else', 'find'], ['Talk to a person', 'person']]);
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
// call / WhatsApp / email; WhatsApp opens with what they were asking about already written
function contactHtml(short = false, what = '') {
  const c = SITE.contact || {}, ph = (c.phones || [])[0];
  const wa = c.whatsapp ? `https://wa.me/${c.whatsapp}${what ? `?text=${encodeURIComponent(`Hello Jinharsh, I need: ${what}`)}` : ''}` : '';
  return `${short ? '' : ''}<div class="as-contact">
    ${ph ? `<a class="ju-btn sm" href="tel:${esc(ph.dial)}">${icon('phone')}Call ${esc(ph.display)}</a>` : ''}
    ${wa ? `<a class="ju-btn sm" href="${esc(wa)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp${what ? ' (with your request)' : ''}</a>` : ''}
    ${c.email ? `<a class="ju-btn sm" href="mailto:${esc(c.email)}">${icon('mail')}${esc(c.email)}</a>` : ''}</div>`;
}

// ---------- a query, one question at a time (anything already said is not asked again) ----------
function startQuery({ about = null, text = '', fromCtx = false } = {}) {
  const c = ctxOf(), here = about || (HERE ? { code: HERE.code, title: HERE.title } : null);
  const what = (text || (fromCtx ? c.part : '') || '').trim();
  state.flow = { step: 'what', what, qty: c.qty ? `${c.qty} ${c.unit || 'nos'}` : '', city: c.city || '', urgent: !!c.urgent, about: here ? { code: here.code, title: here.title } : null };
  save();
  return next(what ? `Sure! Let me get you a price for <b>${esc(what)}</b>.` : '');
}
// asks the next thing it does not know yet, or shows the summary
function next(lead = '') {
  const f = state.flow, v = visitor();
  const pre = lead ? lead + ' ' : '';
  if (!f.what) { f.step = 'what'; save(); return say(`${pre || `Happy to help${f.about ? ` with <b>${esc(f.about.title)}</b>` : ''}! `}What exactly do you need? A part number, size or product name is perfect. You can write it all in one line, like <b>40 pcs 22220 EJW33 for Pune</b>.`, [['Cancel', 'restart']]); }
  if (!f.qty && !f.qtyAsked) { f.step = 'qty'; f.qtyAsked = true; save(); return say(`${pre}How many do you need?`, [['1', 'qty', '1'], ['5', 'qty', '5'], ['10', 'qty', '10'], ['Not sure yet', 'skip']]); }
  const name = f.name || v.name, reach = f.phone || f.email || v.phone || v.email;
  if (!name) { f.step = 'name'; save(); return say(`${pre}Lovely! May I have your name?`); }
  if (!reach) { f.step = 'reach'; save(); return say(`${pre}Thanks, ${esc(first(name))}! What is the best phone number (WhatsApp) or email for our reply?`); }
  f.step = 'confirm'; save();
  return say(`${pre}Here is your query:<div class="as-sum">
      ${f.about ? `<div><span>About</span><b>${esc(f.about.title)}</b></div>` : ''}
      <div><span>Need</span><b>${esc(f.what)}</b></div>${f.qty ? `<div><span>Quantity</span><b>${esc(f.qty)}</b></div>` : ''}
      ${f.city ? `<div><span>Deliver to</span><b>${esc(f.city)}</b></div>` : ''}${f.urgent ? '<div><span>When</span><b>Urgent</b></div>' : ''}
      <div><span>Reply to</span><b>${esc(name)} · ${esc(reach)}</b></div></div>Shall I send it to our team?`,
    [['Send now', 'send'], ['Change something', 'restart']]);
}

async function step(text, info) {
  const f = state.flow, t = String(text || '').trim();
  if (/^(cancel|stop|never ?mind|no thanks|start again)$/i.test(t)) return act('restart');
  if (f.step === 'confirm') { if (isYes(t)) return send(); if (isNo(t)) return act('restart'); }
  // anything useful in the answer is taken, whatever was asked (a name and a number in one line, a quantity, a city...)
  if (info.qty) f.qty = `${info.qty} ${info.unit || 'nos'}`;
  if (info.city) f.city = info.city;
  if (info.urgent) f.urgent = true;
  if (info.phone) f.phone = info.phone;
  if (info.email) f.email = info.email;
  if (info.name) f.name = info.name;
  if (f.step === 'what') {
    if (!t) return say('Just type what you need, for example <b>6205 2RS bearing</b>.');
    f.what = whatOf(t, info) || t;
  } else if (f.step === 'qty') {
    if (!info.qty) { if (/^not sure/i.test(t) || !t) f.qty = ''; else if (/^\d+$/.test(t)) f.qty = `${t} nos`; else f.qty = t.slice(0, 40); }
  } else if (f.step === 'name') {
    if (!f.name) { if (!t || /\d/.test(t) || isYes(t) || isNo(t)) return say('Sorry, I did not catch your name. What should our team call you?'); f.name = t.replace(/^(i am|i'm|my name is|this is)\s+/i, '').slice(0, 80); }
  } else if (f.step === 'reach') {
    if (!f.phone && !f.email) return say('Hmm, that does not look complete. Could you type your phone number (with WhatsApp) or your email?');
  }
  save();
  return next();
}

async function send() {
  const f = state.flow, v = visitor();
  if (!f || f.step !== 'confirm') return act('menu');
  const name = f.name || v.name, email = f.email || (f.phone ? '' : v.email) || '', phone = f.phone || (f.email ? '' : v.phone) || '';
  try {
    await sendInquiry({ name, company: v.company || '', email, phone,
      message: [f.what, f.qty ? `Quantity: ${f.qty}` : '', f.city ? `Deliver to: ${f.city}` : '', f.urgent ? 'Needed: urgently' : ''].filter(Boolean).join('\n'),
      code: f.about ? f.about.code : '', title: f.about ? f.about.title : '', device: device(), source: source() });
  } catch (e) {
    return say(`Sorry, that did not go through (${esc((e && e.message) || 'no connection')}). Shall I try again?`, [['Try again', 'send'], ['Talk to a person', 'person']]);
  }
  try { localStorage.setItem('jd_visitor', JSON.stringify({ ...v, name, ...(email ? { email } : {}), ...(phone ? { phone } : {}) })); } catch {}
  try { sessionStorage.setItem('jd_bye', '1'); } catch {}
  state.flow = null; state.ctx = {}; save();
  await say(`Sent! ✅ Thank you, <b>${esc(first(name))}</b>. Our team will get back to you soon${phone ? ` on <b>${esc(phone)}</b>` : email ? ` at <b>${esc(email)}</b>` : ''}.`);
  return say(byeHtml({ title: 'See you later!', text: 'Thank you for trusting Jinharsh. Anything else, anytime: we are right here.' }), [['Ask something else', 'menu']]);
}
