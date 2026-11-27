// Jini's knowledge (no AI service, no cost, nothing leaves the page): what a message means and what she knows.
// Nothing here touches the page, so it can be tested on its own (tools/test-jini.mjs).
//   read(text)            -> { parts, qty, unit, name, phone, email, company, city, urgent, brands }  what the message contains
//   intentOf(text)        -> 'greet' | 'thanks' | 'bye' | 'bot' | 'person' | 'where' | 'hours' | 'price' | 'stock' | ... | ''
//   decodeBearing(code)   -> { kind, bore, notes[] } or null   (what a bearing number says, by the usual ISO rules)
//   convert(text)         -> 'a sentence' or ''                 (mm/inch, kg/lb, kW/HP, °C/°F, litres/gallons, bar/psi, Nm/lbf·ft, m/ft)
//   brandInfo(name)       -> what a brand makes (short, general)
//   siteHelp(text)        -> how to do something on this site, or ''

// ---------- what a message contains ----------
const BRAND_ALIASES = [
  [/\btimken\s*lovejoy|\blovejoy\b|\bquick\s*flex\b|\bqf\s*coupling/i, 'Timken Lovejoy'],
  [/\btimken\b/i, 'Timken'],
  [/\bregal\b|\brexnord\b|\bomega\s*(coupling|elastomer)?/i, 'Regal Rexnord'],
  [/\bgroz\b/i, 'Groz'],
  [/\bshell\b|\bomala\b|\btellus\b|\bgadus\b|\brimula\b|\bspirax\b/i, 'Shell'],
  [/\bflexco\b/i, 'Flexco'],
  [/\bjin\s*harsh\b|\bjis\b/i, 'JinHarsh'],
];
const UNIT_WORDS = 'nos?|numbers?|pcs?|pieces?|units?|sets?|pairs?|qty|quantity|litres?|liters?|ltrs?|l|kg|kgs|kilos?|metres?|meters?|mtrs?|m|boxes?|drums?|pails?|buckets?|rolls?';
const UNIT_RE = new RegExp(`(?:\\b(?:qty|quantity)\\s*[:=-]?\\s*(\\d{1,6})\\b)|(?:\\b(\\d{1,6})\\s*(?:x\\s*)?(${UNIT_WORDS})\\b)|(?:\\bx\\s*(\\d{1,6})\\b)`, 'i');
const UNIT_NAME = (u) => {
  u = (u || '').toLowerCase();
  if (/^(l|ltrs?|litres?|liters?)$/.test(u)) return 'litres';
  if (/^(kg|kgs|kilos?)$/.test(u)) return 'kg';
  if (/^(m|mtrs?|metres?|meters?)$/.test(u)) return 'metres';
  if (/^sets?$/.test(u)) return 'sets';
  if (/^pairs?$/.test(u)) return 'pairs';
  if (/^(boxes?|drums?|pails?|buckets?|rolls?)$/.test(u)) return u.replace(/s?$/, 's');
  return 'nos';
};

const PRE = 'UCFL|UCP|UCF|UCT|UC|UK|SN|NUP|NU|NJ|NF|NN|NK|NA|HK|RNA|JLM|JHM|LM|HM|JL|JM|EE|NP|JP';
const SUF = String.raw`(?:[a-z]+\d[a-z0-9]*|\d+[a-z][a-z0-9]*|ZZ|2Z|Z|RS|RSH|LLU|DDU|EJ|EM|EMB|CC|CA|CAK|CCK|K|E|MA|MB|M|J|TVP|TN|NR|N)`;
const PART = new RegExp(String.raw`\b(?:(?:${PRE})[-\s]?)?\d{3,6}(?:[-\s/]?${SUF}\b){0,3}|\b[a-z]{1,4}\d{2,6}[a-z0-9-]*\b`, 'gi');

export function read(text) {
  const t = String(text || '');
  const out = { parts: [], qty: '', unit: '', name: '', phone: '', email: '', company: '', city: '', urgent: false, brands: [] };
  const email = /[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}/i.exec(t); if (email) out.email = email[0];
  const phone = /(?:\+?\d[\d\s-]{8,}\d)/.exec(t.replace(email ? email[0] : '', ''));
  if (phone && phone[0].replace(/\D/g, '').length >= 10 && phone[0].replace(/\D/g, '').length <= 13) out.phone = phone[0].trim();
  const nm = /\b(?:i am|i'm|im|my name is|this is|myself|name\s*[:-])\s+([a-z][a-z.'-]+(?:\s+[a-z][a-z.'-]+)?)/i.exec(t);
  if (nm && !/^(looking|interested|from|at|in|a|an|the|not|fine|good|ok|okay|here|searching|trying|need|needing)\b/i.test(nm[1])) out.name = nm[1].replace(/\b\w/g, (c) => c.toUpperCase());
  const co = /\b(?:from|at|company\s*[:-]?|working (?:at|with|in))\s+([A-Z][\w&.-]*(?:\s+(?:[A-Z][\w&.-]*|&|and|of|steel|cement|power|industries|limited|ltd|pvt|private))*)/.exec(t);
  if (co && !/^(Pune|Mumbai|Delhi|Chennai|Kolkata|Bengaluru|Bangalore|Hyderabad|Ahmedabad|Surat|Nagpur|India)$/i.test(co[1])) out.company = co[1].trim();
  const city = /\b(?:in|to|at|for|delivery (?:to|at|in))\s+(Mumbai|Pune|Delhi|New Delhi|Chennai|Kolkata|Bengaluru|Bangalore|Hyderabad|Ahmedabad|Surat|Nagpur|Nashik|Aurangabad|Vadodara|Rajkot|Indore|Bhopal|Raipur|Jamshedpur|Bhubaneswar|Visakhapatnam|Vizag|Coimbatore|Kochi|Lucknow|Kanpur|Ludhiana|Jaipur|Goa|Thane|Navi Mumbai|Bellary|Vijayanagar|Salem|Dolvi|Sambalpur|Singapore|Dubai)\b/i.exec(t);
  if (city) out.city = city[1].replace(/\b\w/g, (c) => c.toUpperCase());
  out.urgent = /\b(urgent|urgently|asap|immediately|today|breakdown|emergency)\b/i.test(t);
  const q = UNIT_RE.exec(t.replace(out.phone, ''));
  if (q) { out.qty = q[1] || q[2] || q[4] || ''; out.unit = q[3] ? UNIT_NAME(q[3]) : 'nos'; }
  // part numbers: a bearing-like number with its known prefix and suffixes (6205-2RS C3, NU 2210, UCP208, 22220 EJW33),
  // or letters and digits written together (L100, LM48548); ordinary words around them are never taken in
  const cleaned = t.replace(out.email, ' ').replace(out.phone, ' ');
  const cand = cleaned.match(PART) || [];
  for (let c of cand) {
    c = c.trim().replace(/\s+/g, ' ');
    if (out.qty && new RegExp(`^${out.qty}\\b`).test(c) && !/[a-z]/i.test(c)) continue;
    if (/^\d{1,3}$/.test(c) || /^(19|20)\d\d$/.test(c)) continue;           // a small number or a year
    if (/^\d+\s*(mm|cm|kw|hp|rpm|bar|psi|nm|kg|l|v|w|c|f)$/i.test(c)) continue;  // a size, not a part
    out.parts.push(c.toUpperCase());
  }
  for (const [re, b] of BRAND_ALIASES) if (re.test(t) && !out.brands.includes(b)) out.brands.push(b);
  if (out.brands.includes('Timken Lovejoy')) out.brands = out.brands.filter((b) => b !== 'Timken' || /\btimken\b(?!\s*lovejoy)/i.test(t));
  return out;
}

// ---------- what a message is about ----------
const INTENTS = [
  ['bot', /\b(are you (a )?(bot|robot|human|real|person|ai)|who are you|what are you|your name)\b/i],
  ['thanks', /\b(thank|thanks|thx|thnx|ty|shukriya|dhanyavad)\b/i],
  ['bye', /\b(bye|goodbye|see you|that'?s all|nothing else|no more|done for now)\b/i],
  ['greet', /^(hi+|hello+|hey+|hii+|namaste|namaskar|good (morning|afternoon|evening)|yo|hola)\b[\s!.,]*$/i],
  ['person', /\b(call me|call back|callback|talk to|speak to|speak with|human|person|someone|executive|agent|sales ?(team|person)|contact (number|details|you)|your (number|phone|email|whatsapp)|whats ?app)\b/i],
  ['where', /\b(address|where are you|location|located|office|visit you|map|directions|branch)\b/i],
  ['hours', /\b(timing|timings|hours|open|closed|working days|sunday|saturday|holiday)\b/i],
  ['order', /\b(my order|order status|track(ing)?|dispatch(ed)?|invoice|bill|payment|paid|gst|credit|refund|return)\b/i],
  ['stock', /\b(stock|available|availability|in stock|ready stock|lead time|how soon|how long|when can|deliver(y)?|shipping|ship|courier)\b/i],
  ['price', /\b(price|prices|pricing|quote|quotation|rate|rates|cost|how much|buy|purchase|order|enquiry|inquiry|requirement|require|need|want)\b/i],
  ['convert', /\b(\d+(\.\d+)?)\s*(mm|millimet\w*|inch\w*|in|"|cm|kg|kgs|lbs?|pounds?|kw|hp|horse ?power|°?\s?c|°?\s?f|celsius|fahrenheit|litres?|liters?|l|gallons?|gal|bar|psi|nm|lbf|ft|feet|foot|metres?|meters?|m)\b.*\b(to|in|into|=)\b/i],
  ['decode', /\b(what is|what does|meaning|mean|means|decode|explain|size of|bore of|dimensions? of|which bearing|what bearing)\b/i],
  ['catalog', /\b(catalog|catalogue|catalogues|catalogs|brochure|pdf|datasheet|data sheet|leaflet|price list)\b/i],
  ['brands', /\b(brands?|which companies|what do you (sell|have|supply|deal)|products|range|deal in|dealers?|distributor)\b/i],
  ['help', /\b(how (do|can|to) i|how to|where (is|do i|can i)|can i|help me|not working|unable|can'?t|cannot|download|share|qr|whatsapp it|dark mode|night mode|light mode|go to page|search)\b/i],
];
export function intentOf(text) {
  const t = String(text || '').trim();
  for (const [name, re] of INTENTS) if (re.test(t)) return name;
  return '';
}
export const isYes = (t) => /^(yes|yeah|yep|yup|ok|okay|sure|haan|han|ha|ji|please|send|go ahead|do it|correct|right|confirm)\b/i.test(String(t || '').trim());
export const isNo = (t) => /^(no|nope|nah|not now|later|cancel|stop|never ?mind|nahi|na)\b/i.test(String(t || '').trim());

// ---------- bearing numbers (the usual ISO way of writing them) ----------
const SUFFIX = [
  [/^2RS1?$|^2RSH$|^2RSR$|^LLU$|^DDU$|^2RZ$|^LLB$/, 'rubber seals on both sides'],
  [/^RS1?$|^RSH$|^LU$|^DU$/, 'a rubber seal on one side'],
  [/^2Z$|^ZZ$|^LLH$/, 'metal shields on both sides'],
  [/^Z$/, 'a metal shield on one side'],
  [/^C2$/, 'smaller internal clearance than normal (C2)'],
  [/^C3$/, 'larger internal clearance than normal (C3), for running hot or a tight fit'],
  [/^C4$/, 'even larger internal clearance (C4)'],
  [/^K$/, 'a tapered bore (1:12), for an adapter or withdrawal sleeve'],
  [/^K30$/, 'a tapered bore (1:30)'],
  [/^E$/, 'a high-capacity design'],
  [/^EJ$/, 'high-capacity design with a steel cage (Timken EJ)'],
  [/^EM$|^EMB$/, 'high-capacity design with a brass cage'],
  [/^CC$|^CA$|^CAK$|^CCK$/, 'the maker\'s cage and roller design'],
  [/^W33$/, 'a lubrication groove with three holes in the outer ring (W33)'],
  [/^M$|^MA$|^MB$/, 'a machined brass cage'],
  [/^J$/, 'a pressed steel cage'],
  [/^TN9$|^TVP$|^TNG$|^TN$/, 'a polyamide (plastic) cage'],
  [/^N$/, 'a snap-ring groove in the outer ring'],
  [/^NR$/, 'a snap-ring groove with the snap ring fitted'],
  [/^P6$|^P5$|^P4$/, 'a higher precision class'],
  [/^EJW33$/, 'high-capacity design with a steel cage (Timken EJ) and a lubrication groove with three holes (W33)'],
  [/^EJW33C3$/, 'high-capacity steel-cage design (EJ), lubrication groove (W33) and larger clearance (C3)'],
];
const boreOf = (two) => { const n = Number(two); if (n === 0) return 10; if (n === 1) return 12; if (n === 2) return 15; if (n === 3) return 17; return n >= 4 && n <= 96 ? n * 5 : null; };
export function decodeBearing(code) {
  const raw = String(code || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const m = /^([A-Z]{0,4})[- ]?(\d{3,6})(?:[- /]?([A-Z0-9/ -]*))?$/.exec(raw);
  if (!m) return null;
  const pre = m[1], num = m[2], suf = (m[3] || '').replace(/[\s/-]+/g, '');
  let kind = '', bore = null, notes = [];
  const two = num.slice(-2), base = num.slice(0, -2);
  if (/^UC[PFLT]?|^UK|^SN/.test(pre)) {
    const k = { UC: 'an insert bearing (ball bearing with a set-screw collar, for a housing)', UCP: 'a pillow block unit (insert bearing in a cast-iron foot housing)', UCF: 'a 4-bolt flange unit', UCFL: 'a 2-bolt flange unit', UCT: 'a take-up unit', UK: 'an insert bearing with a tapered bore (for an adapter sleeve)', SN: 'a split plummer block housing' }[pre] || 'a housed bearing unit';
    kind = k; bore = pre === 'SN' ? null : boreOf(two);
    if (pre === 'SN') notes.push(`housing size ${num}; it takes a self-aligning or spherical roller bearing on an adapter sleeve`);
  } else if (/^(NU|NJ|NUP|N|NF|NN)$/.test(pre)) {
    kind = `a cylindrical roller bearing (${pre} type: ${{ NU: 'the inner ring slides, for shafts that grow with heat', NJ: 'takes a little axial load one way', NUP: 'takes a little axial load both ways', N: 'the outer ring slides', NF: 'takes a little axial load one way', NN: 'double row' }[pre]})`;
    bore = boreOf(two);
  } else if (/^(NK|NA|HK|RNA)$/.test(pre)) {
    kind = 'a needle roller bearing'; bore = null; notes.push('needle bearing sizes are written differently; our team will confirm the exact size');
  } else if (!pre && /^(222|223|230|231|232|239|240|241)\d\d$/.test(num)) {
    kind = 'a spherical roller bearing (self-aligning, for heavy loads and misalignment)'; bore = boreOf(two);
  } else if (!pre && /^(292|293|294)\d\d$/.test(num)) {
    kind = 'a spherical roller thrust bearing'; bore = boreOf(two);
  } else if (!pre && /^(302|303|313|320|322|323|329|330|331|332)\d\d$/.test(num)) {
    kind = 'a tapered roller bearing (metric)'; bore = boreOf(two);
  } else if (!pre && /^(511|512|513|514)\d\d$/.test(num)) {
    kind = 'a thrust ball bearing (axial load only)'; bore = boreOf(two);
  } else if (!pre && /^(618|619|160|60|62|63|64)\d\d$/.test(num)) {
    kind = 'a deep groove ball bearing (the most common kind)'; bore = boreOf(two);
    notes.push({ '60': 'extra-light series', '62': 'light series', '63': 'medium series', '64': 'heavy series', '160': 'extra-thin series', '618': 'thin section', '619': 'thin section' }[base] || '');
  } else if (!pre && /^6\d\d$/.test(num)) {
    kind = 'a small deep groove ball bearing'; bore = Number(num.slice(-1)); notes.push('a miniature size');
  } else if (!pre && /^(12|13|22|23)\d\d$/.test(num)) {
    kind = 'a self-aligning ball bearing (forgives some shaft misalignment)'; bore = boreOf(two);
  } else if (!pre && /^(72|73|32|33)\d\d$/.test(num)) {
    kind = /^3[23]/.test(num) ? 'a double-row angular contact ball bearing' : 'an angular contact ball bearing (takes axial and radial load; often used in pairs)';
    bore = boreOf(two);
  } else if (/^(LM|HM|JL|JM|JLM|JHM|M|L|H|EE|NP|JP)$/.test(pre)) {
    kind = 'an inch tapered roller bearing part (cone or cup; they are ordered as a matching set)'; bore = null;
  } else return null;
  const sufNotes = [];
  let rest = suf;
  // match the longest known suffix pieces from the left
  while (rest) {
    let hit = false;
    for (const len of [7, 6, 5, 4, 3, 2, 1]) {
      const piece = rest.slice(0, len);
      const s = SUFFIX.find(([re]) => re.test(piece));
      if (s) { sufNotes.push(`${piece} = ${s[1]}`); rest = rest.slice(len); hit = true; break; }
    }
    if (!hit) { sufNotes.push(`${rest} = a maker's code our team can check`); break; }
  }
  return { code: raw, kind, bore, notes: [...notes.filter(Boolean), ...sufNotes] };
}

// ---------- units ----------
const UNITS = [
  [/^(mm|millimet\w*)$/, 'mm', [['inch', (v) => v / 25.4, 'in']]],
  [/^(inch\w*|in|")$/, 'inch', [['mm', (v) => v * 25.4, 'mm']]],
  [/^cm$/, 'cm', [['inch', (v) => v / 2.54, 'in']]],
  [/^(kg|kgs|kilos?)$/, 'kg', [['lb', (v) => v * 2.20462, 'lb']]],
  [/^(lbs?|pounds?)$/, 'lb', [['kg', (v) => v / 2.20462, 'kg']]],
  [/^kw$/, 'kW', [['HP', (v) => v * 1.34102, 'HP']]],
  [/^(hp|horse ?power)$/, 'HP', [['kW', (v) => v * 0.7457, 'kW']]],
  [/^(°?\s?c|celsius)$/, '°C', [['°F', (v) => v * 9 / 5 + 32, '°F']]],
  [/^(°?\s?f|fahrenheit)$/, '°F', [['°C', (v) => (v - 32) * 5 / 9, '°C']]],
  [/^(litres?|liters?|l)$/, 'litres', [['US gallons', (v) => v / 3.78541, 'US gal']]],
  [/^(gallons?|gal)$/, 'US gallons', [['litres', (v) => v * 3.78541, 'litres']]],
  [/^bar$/, 'bar', [['psi', (v) => v * 14.5038, 'psi']]],
  [/^psi$/, 'psi', [['bar', (v) => v / 14.5038, 'bar']]],
  [/^nm$/, 'N·m', [['lbf·ft', (v) => v * 0.737562, 'lbf·ft']]],
  [/^lbf$/, 'lbf·ft', [['N·m', (v) => v / 0.737562, 'N·m']]],
  [/^(ft|feet|foot)$/, 'ft', [['m', (v) => v * 0.3048, 'm']]],
  [/^(metres?|meters?|m)$/, 'm', [['ft', (v) => v / 0.3048, 'ft']]],
];
const fmtNum = (n) => (Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
export function convert(text) {
  const m = /(-?\d+(?:\.\d+)?)\s*(mm|millimet\w*|inch\w*|in\b|"|cm|kgs?|kilos?|lbs?|pounds?|kw|hp|horse ?power|°?\s?c\b|°?\s?f\b|celsius|fahrenheit|litres?|liters?|l\b|gallons?|gal\b|bar\b|psi|nm\b|lbf|ft\b|feet|foot|metres?|meters?|m\b)/i.exec(String(text || ''));
  if (!m) return '';
  const v = Number(m[1]), u = m[2].toLowerCase().replace(/\s/g, '');
  const row = UNITS.find(([re]) => re.test(u));
  if (!row) return '';
  return row[2].map(([, fn, short]) => `${fmtNum(v)} ${row[1]} = <b>${fmtNum(fn(v))} ${short}</b>`).join('<br>');
}

// ---------- brands (short and general; the catalogues have the details) ----------
const BRANDS = {
  Timken: 'Timken makes bearings (tapered, spherical and cylindrical roller bearings, housed units) and power-transmission parts for heavy industry.',
  'Timken Lovejoy': 'Lovejoy (part of Timken) makes shaft couplings: jaw couplings, Quick Flex (QF) couplings, gear and disc couplings.',
  'Regal Rexnord': 'Regal Rexnord makes power-transmission parts, such as Omega elastomeric couplings, gear couplings, gearboxes and bearings.',
  Groz: 'Groz makes lubrication equipment (grease guns, oil pumps, dispensers), fluid-handling tools, workshop tools and LED work lights.',
  Shell: 'Shell makes industrial lubricants and greases: gear oils (Omala), hydraulic oils (Tellus), greases (Gadus) and more.',
  Flexco: 'Flexco makes conveyor-belt maintenance products: belt fasteners and splices, belt cleaners, skirting and trackers.',
  JinHarsh: 'Our own master guide covers everything we supply across our divisions: bearings, couplings, motors, lubricants, tools, safety and conveying.',
};
export const brandInfo = (b) => BRANDS[b] || '';

// ---------- this site: how to do things ----------
const HELP = [
  [/download|save (the )?pdf|offline/i, 'To <b>download</b> a catalogue: open it and press <b>Download</b> (or the ↓ button in the reader). The PDF saves to your phone or computer.'],
  [/share|send (it|this) to|whats ?app it|forward/i, 'To <b>share</b>: open the catalogue and press <b>Share</b>. You can send it on WhatsApp or email, copy the link, or save its QR code.'],
  [/\bqr\b|visiting card|scan/i, 'Every catalogue has its own <b>QR code</b> (the small square button). <b>QR Studio</b> in the top bar has all of them, ready for posters, stands and visiting cards.'],
  [/go to page|jump|last page|first page|page number/i, 'In the reader, tap <b>"Page 12 of 48"</b> at the top and type any page, or tap the first or last page number to jump there.'],
  [/read|open (the )?(pdf|catalog)|zoom|bigger|smaller/i, 'Press <b>Read now</b> (or tap the cover) to read a catalogue here. Use <b>+</b> and <b>−</b> at the top to zoom, and swipe up and down to turn pages.'],
  [/quick ?look|preview|peek|first pages/i, 'Tap the <b>eye</b> on a catalogue card for a <b>Quick look</b> at its first pages without opening it.'],
  [/search|find (a|the)? ?(part|product)|look for/i, 'Type a <b>part number, product or brand</b> in the search box on the front page: it looks inside every catalogue and opens the right page. Or just tell me here.'],
  [/dark mode|night mode|light mode|theme|look|follow the sun|colou?r/i, 'The <b>sun / moon</b> button in the top bar changes the look: <b>Light</b>, <b>Follow the sun</b> (warm by day, dark at night) or <b>Dark</b>.'],
  [/query|ask (you|a question)|enquiry|inquiry|contact form/i, 'Press <b>Send query</b> at the top (or ask me). Tell us the part and quantity; our team replies with price, stock and delivery.'],
];
export function siteHelp(text) {
  const t = String(text || '');
  const hit = HELP.find(([re]) => re.test(t));
  return hit ? hit[1] : '';
}
