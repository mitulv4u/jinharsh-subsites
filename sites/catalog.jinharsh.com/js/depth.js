// 3D tilt, like the iPhone's "spatial" lock screen. With it on, tilting the phone moves the front page in layers:
// the sky far behind, the cards turning a little to face you, the catalogue covers floating above their cards and
// the round buttons nearest, each by a different amount, so the page has depth. No glow and no shine: only the
// layers move (hub.css, "3D tilt").
// It is OFF until the person turns it on with the "Tilt for 3D" switch under the search box. The switch shows only
// on phones and tablets (touch is the main input; not touch-screen laptops), never when the phone asks for calm motion ("reduce motion"), and it goes
// away by itself on a device without a motion sensor. iPhones ask once for "Motion & Orientation".
// The choice is kept on this device.
// Trying it on a computer: add ?tilt=mouse to the address; the mouse then plays the phone.
import * as M from './motion.js';
import { toast } from './site.js';

const KEY = 'jd_tilt';
const RANGE = 16;   // degrees of tilt for the full effect
const ICON = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="m15.194 13.707 3.814 1.86-1.86 3.814"/><path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"/><path d="M21.79796 11 A 10 5 0 1 0 19 15.57071"/></svg>';   // (Lucide rotate-3d, ISC)
const root = document.documentElement;
const saved = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const keep = (on) => { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch {} };
const mouseDemo = () => { try { return new URLSearchParams(location.search).get('tilt') === 'mouse'; } catch { return false; } };
const touchDevice = () => { try { return 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches; } catch { return false; } };
const asksFirst = () => typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
const clamp = (v) => Math.max(-1, Math.min(1, v));

// ---------- the motion ----------
// --tx / --ty (from -1 to 1) on the page say where the viewer is: +x = seen from the right, +y = seen from below.
let base = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, got = false, running = false, demo = false;
function frame() {
  raf = 0;
  cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;   // eased, so a shaky hand still gives a smooth page
  root.style.setProperty('--tx', cx.toFixed(3));
  root.style.setProperty('--ty', cy.toFixed(3));
  if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(frame);
  else if (!running) { root.classList.remove('depth'); root.style.removeProperty('--tx'); root.style.removeProperty('--ty'); }
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
function onTurn(e) {
  if (e.beta == null || e.gamma == null) return;
  got = true;
  // held sideways: the readings turn with the screen
  const o = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0);
  const a = ((o % 360) + 360) % 360;
  let x = e.gamma, y = e.beta;
  if (a === 90) { x = e.beta; y = -e.gamma; } else if (a === 270) { x = -e.beta; y = e.gamma; } else if (a === 180) { x = -e.gamma; y = -e.beta; }
  // the middle slowly follows however the phone is held, so the page always comes back to rest
  if (!base || Math.abs(x - base.x) > 50 || Math.abs(y - base.y) > 50) base = { x, y };
  base.x += (x - base.x) * 0.008; base.y += (y - base.y) * 0.008;
  tx = clamp((x - base.x) / RANGE); ty = clamp((y - base.y) / RANGE);
  kick();
}
function onMouse(e) { tx = clamp((e.clientX / innerWidth - 0.5) * 2); ty = clamp((e.clientY / innerHeight - 0.5) * 2); kick(); }
function start() {
  if (running) return;
  running = true; base = null;
  root.classList.add('depth');
  if (demo) addEventListener('pointermove', onMouse, { passive: true });
  else addEventListener('deviceorientation', onTurn);
}
function stop() {
  if (!running) return;
  running = false;
  removeEventListener('deviceorientation', onTurn);
  removeEventListener('pointermove', onMouse);
  tx = 0; ty = 0; kick();   // the layers settle back to flat, then the 3D is taken off (frame)
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) base = null; });

// ---------- the switch ----------
// after: the element the switch goes under (the search box)
export function depthSwitch(after) {
  demo = mouseDemo();
  if (!after || document.querySelector('.tilt-row') || M.calm() || !(demo || touchDevice())) return;
  const row = document.createElement('div');
  row.className = 'tilt-row';
  row.innerHTML = `<button type="button" class="ju-chip tilt-sw" aria-pressed="false">${ICON}<span>Tilt for 3D</span></button>`;
  after.insertAdjacentElement('afterend', row);
  const b = row.firstElementChild;
  const paint = (on) => {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    b.title = on ? '3D is on: tilt the phone gently. Tap to turn it off' : 'Turn on 3D: tilt the phone to see the page in depth';
  };
  paint(false);
  // no readings soon after turning on: an iPhone still waiting for a tap (quietly), or no motion sensor at all
  const check = (fromTap) => setTimeout(() => {
    if (!running || got) return;
    stop(); paint(false);
    if (asksFirst() && !fromTap) return;   // (the iPhone forgot its answer: the next tap on the switch asks again)
    keep(false); row.remove();
    if (fromTap) toast('This device has no motion sensor, so 3D tilt cannot work here.');
  }, 1500);
  const turnOn = async (fromTap) => {
    if (!demo && asksFirst() && fromTap) {
      // (must be the first thing the tap does, or the iPhone will not ask)
      let answer = 'denied';
      try { answer = await DeviceOrientationEvent.requestPermission(); } catch {}
      if (answer !== 'granted') { toast('Motion was not allowed. Close Safari, open the page again, tap Tilt for 3D and choose Allow.'); return false; }
    }
    got = demo; start(); paint(true);
    if (!demo) check(fromTap);
    return true;
  };
  b.addEventListener('click', () => {
    try { M.bump(b, 1.06); } catch {}
    if (running) { stop(); paint(false); keep(false); toast('3D tilt off'); return; }
    turnOn(true).then((ok) => { if (ok) { keep(true); toast(demo ? '3D tilt on: move the mouse' : '3D tilt on: tilt your phone gently'); } });
  });
  if (saved()) turnOn(false);
}
