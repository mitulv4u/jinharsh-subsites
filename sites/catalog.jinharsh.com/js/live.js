// Who is looking right now, for the team (the Team Portal shows it; visitors never see it). Every open page says
// where it is about every 30 seconds, only while it is on screen: a catalogue's code, or '' for the front page.
// No names, nothing personal.
//   watchLive(code)
import { sendPing } from './backend.js';

// one id per browser tab, so a person moving from page to page counts once
const ID = (() => {
  const make = () => Math.random().toString(36).slice(2, 12);
  try { let v = sessionStorage.getItem('jd_live'); if (!v) { v = make(); sessionStorage.setItem('jd_live', v); } return v; } catch { return make(); }
})();

export function watchLive(code) {
  let timer = 0;
  const beat = async () => {
    clearTimeout(timer);
    if (!document.hidden) { try { await sendPing({ code, id: ID }); } catch { /* next time */ } }
    timer = setTimeout(beat, 30000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
  addEventListener('pagehide', () => { sendPing({ code, id: ID, leave: true }).catch(() => {}); });
  setTimeout(beat, 900);
}
