// Who else is looking right now. Every open page says where it is about every 30 seconds (only while it is on
// screen) and gets back how many people are on the site and on each catalogue: no names, nothing personal.
//   watchLive(code, onCounts)   code = a catalogue's code, or '' for the front page; onCounts({ total, cats })
import { sendPing } from './backend.js';

// one id per browser tab, so a person moving from page to page counts once
const ID = (() => {
  const make = () => Math.random().toString(36).slice(2, 12);
  try { let v = sessionStorage.getItem('jd_live'); if (!v) { v = make(); sessionStorage.setItem('jd_live', v); } return v; } catch { return make(); }
})();

export function watchLive(code, onCounts) {
  let timer = 0;
  const beat = async () => {
    clearTimeout(timer);
    if (!document.hidden) { try { const c = await sendPing({ code, id: ID }); if (c && c.ok !== false) onCounts(c); } catch { /* next time */ } }
    timer = setTimeout(beat, 30000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
  addEventListener('pagehide', () => { sendPing({ code, id: ID, leave: true }).catch(() => {}); });
  setTimeout(beat, 900);
}

// "2 others" etc. (the person reading it is never counted)
export const others = (n) => `${n} ${n === 1 ? 'other person' : 'others'}`;
