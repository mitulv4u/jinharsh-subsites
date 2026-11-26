/* Light, dark, or following the sun. Loaded before the UI kit's script, so the page is drawn in the right look
   straight away (no dark flash on phones set to dark).

   Three choices, kept on this device:  light (the default) · sun · dark
   "Follow the sun": light by day, dark at night. About 45 minutes before sunset the background slowly warms, like
   evening light; at sunset the page fades softly into dark, still warm, cooling to night over the next 45 minutes.
   Before sunrise the same happens in reverse. Sunrise and sunset are worked out for Mumbai (or, outside India, from
   the device's time zone): no location permission is asked.

   window.JDTheme.mode()        'light' | 'sun' | 'dark'
   window.JDTheme.set(mode)     choose (the caller animates the change)
   window.JDTheme.next(mode)    the one after it on the button: light -> sun -> dark -> light
   window.JDTheme.label(mode)   words for the button and the toast */
(function () {
  'use strict';
  var H = document.documentElement, KEY = 'jd_theme';
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };

  // the choice; someone who had picked dark before keeps dark
  function mode() {
    var m = get(KEY);
    if (m === 'light' || m === 'sun' || m === 'dark') return m;
    return get('jui_dark') === '1' ? 'dark' : 'light';
  }

  // ---- sunrise and sunset (the standard astronomy formulas, as in SunCalc) ----
  var rad = Math.PI / 180, DAY = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, E = rad * 23.4397;
  function sunTimes(date, lat, lon) {
    var d = date.valueOf() / DAY - 0.5 + J1970 - J2000, lw = rad * -lon, phi = rad * lat;
    var n = Math.round(d - J0 - lw / (2 * Math.PI)), ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(E) * Math.sin(L));
    var noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n, set = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L), rise = noon - (set - noon);
    var t = function (j) { return (j + 0.5 - J1970) * DAY; };
    return { rise: t(rise), set: t(set) };
  }
  function place() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (/Kolkata|Calcutta/.test(tz)) return [19.076, 72.878]; // Mumbai
    return [20, -new Date().getTimezoneOffset() / 4];          // the time zone gives a rough longitude
  }
  var W = 45 * 60e3; // the warm, slow part before and after sunrise and sunset
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  // what the sky is doing now: dark or not, and how warm (0..1)
  function sky(now) {
    now = now || Date.now();
    var p = place(), s = sunTimes(new Date(now), p[0], p[1]), R = s.rise, S = s.set;
    if (!isFinite(R) || !isFinite(S)) { var d0 = new Date(now); d0.setHours(0, 0, 0, 0); R = d0.valueOf() + 6.5 * 3600e3; S = d0.valueOf() + 18.5 * 3600e3; }
    if (now < R - W) return { dark: true, warm: 0 };
    if (now < R) return { dark: true, warm: ease((now - (R - W)) / W) };
    if (now < R + W) return { dark: false, warm: ease(1 - (now - R) / W) };
    if (now < S - W) return { dark: false, warm: 0 };
    if (now < S) return { dark: false, warm: ease((now - (S - W)) / W) };
    if (now < S + W) return { dark: true, warm: ease(1 - (now - S) / W) };
    return { dark: true, warm: 0 };
  }

  // ---- the background colours ----
  var BASE = { light: [244, 244, 246], dark: [10, 10, 10] };
  var WARM = { light: [251, 222, 196], dark: [58, 34, 22] };   // evening peach · ember
  var mix = function (a, b, k) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')'; };
  function paint(dark, warm) {
    H.classList.toggle('dark', dark);
    put('jui_dark', dark ? '1' : '0'); // keeps the UI kit in step
    var k = dark ? 0.62 * warm : 0.58 * warm;
    var bg = k > 0.004 ? mix(BASE[dark ? 'dark' : 'light'], WARM[dark ? 'dark' : 'light'], k) : '';
    if (bg) H.style.setProperty('--bg', bg); else H.style.removeProperty('--bg');
    var meta = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < meta.length; i++) { meta[i].removeAttribute('media'); meta[i].setAttribute('content', bg || (dark ? '#0a0a0a' : '#f4f4f6')); }
  }
  function apply(m) {
    m = m || mode();
    if (m === 'sun') { H.dataset.sky = '1'; var s = sky(); paint(s.dark, s.warm); }
    else { delete H.dataset.sky; paint(m === 'dark', 0); }
  }

  // following the sun: a small step every half minute (the background eases between steps); the switch between
  // light and dark itself is a slow cross-fade where the browser can do one
  var timer = 0;
  function follow() {
    clearInterval(timer);
    if (mode() !== 'sun') return;
    timer = setInterval(function () {
      if (mode() !== 'sun') { clearInterval(timer); return; }
      var s = sky(), was = H.classList.contains('dark');
      if (s.dark === was) { paint(s.dark, s.warm); return; }
      if (document.startViewTransition && !document.hidden) {
        H.classList.add('vt-sky');
        var t = document.startViewTransition(function () { paint(s.dark, s.warm); });
        t.finished.then(function () { H.classList.remove('vt-sky'); }, function () { H.classList.remove('vt-sky'); });
      } else paint(s.dark, s.warm);
    }, 30e3);
  }

  var LABEL = { light: 'Light', sun: 'Follow the sun', dark: 'Dark' };
  window.JDTheme = {
    mode: mode,
    set: function (m) { put(KEY, m); apply(m); follow(); return m; },
    next: function (m) { return { light: 'sun', sun: 'dark', dark: 'light' }[m || mode()] || 'light'; },
    label: function (m) { return LABEL[m || mode()]; },
    sky: sky,
  };
  apply();
  follow();
})();
