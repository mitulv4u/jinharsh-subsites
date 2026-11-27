/* Light, dark, or following the sun. Loaded before the UI kit's script, so the page is drawn in the right look
   straight away (no dark flash on phones set to dark).

   Three choices, kept on this device:  light (the default) · sun · dark
   "Follow the sun": the page sits on a soft sky that slowly drifts (app.css), and its colours follow the day: rose
   at dawn, clear in the morning, warming through the afternoon, golden before sunset; at sunset the page fades softly
   into a warm plum dusk that cools to night. Sunrise and sunset are worked out for Mumbai (or, outside India, from
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
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  // ---- the sky through the day: three colours of a soft gradient, top to bottom ----
  var C = {
    night: [[13, 17, 32], [11, 11, 15], [20, 15, 13]],
    predawn: [[26, 32, 54], [46, 32, 48], [69, 40, 31]],
    dawn: [[248, 216, 224], [251, 228, 206], [226, 236, 251]],
    morning: [[222, 235, 252], [242, 243, 248], [251, 236, 218]],
    noon: [[228, 238, 252], [247, 242, 234], [252, 226, 196]],
    afternoon: [[251, 232, 210], [251, 221, 190], [249, 202, 162]],
    golden: [[254, 222, 192], [251, 202, 162], [246, 186, 142]],
    dusk: [[60, 35, 52], [68, 39, 29], [30, 21, 18]],
  };
  var blend = function (a, b, k) { return a.map(function (c, i) { return c.map(function (v, j) { return v + (b[i][j] - v) * k; }); }); };
  // what the sky is doing now: dark or not, and its three colours
  // (to see another time of day, add ?sky=17.5 to the address: the sky of 5:30 pm today)
  var TRY = (function () { try { var m = /[?&]sky=(\d{1,2}(?:\.\d+)?)/.exec(location.search); return m ? +m[1] : null; } catch (e) { return null; } })();
  function sky(now) {
    if (!now && TRY !== null) { var d1 = new Date(); d1.setHours(0, 0, 0, 0); now = d1.valueOf() + TRY * 3600e3; }
    now = now || Date.now();
    var p = place(), s = sunTimes(new Date(now), p[0], p[1]), R = s.rise, S = s.set, h = 3600e3;
    if (!isFinite(R) || !isFinite(S) || S - R < 5 * h) { var d0 = new Date(now); d0.setHours(0, 0, 0, 0); R = d0.valueOf() + 6.5 * h; S = d0.valueOf() + 18.5 * h; }
    var marks = [   // [moment, colours, dark]; it is dark until sunrise and from sunset
      [R - 1.5 * h, C.night, 1], [R, C.predawn, 1],
      [R, C.dawn, 0], [R + 1.5 * h, C.morning, 0], [(R + S) / 2, C.noon, 0], [S - 2 * h, C.afternoon, 0], [S, C.golden, 0],
      [S, C.dusk, 1], [S + 1.5 * h, C.night, 1],
    ];
    for (var i = 0; i < marks.length - 1; i++) {
      var a = marks[i], b = marks[i + 1];
      if (now >= a[0] && now < b[0]) return { dark: !!a[2], stops: blend(a[1], b[1], ease((now - a[0]) / (b[0] - a[0]))) };
    }
    return { dark: true, stops: C.night };
  }

  // ---- painting it ----
  var rgb = function (c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; };
  var VARS = ['--bg', '--sky1', '--sky2', '--sky3', '--muted'];
  function paint(dark, stops) {
    H.classList.toggle('dark', dark);
    put('jui_dark', dark ? '1' : '0'); // keeps the UI kit in step
    var bg = stops ? rgb(stops[1]) : '';
    if (stops) {
      H.style.setProperty('--bg', bg);
      H.style.setProperty('--sky1', rgb(stops[0]));
      H.style.setProperty('--sky2', bg);
      H.style.setProperty('--sky3', rgb(stops[2]));
      // on the warm light sky, small grey text gets a touch more ink so it stays easy to read
      if (dark) H.style.removeProperty('--muted'); else H.style.setProperty('--muted', '#525259');
    } else VARS.forEach(function (v) { H.style.removeProperty(v); });
    var meta = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < meta.length; i++) { meta[i].removeAttribute('media'); meta[i].setAttribute('content', bg || (dark ? '#0a0a0a' : '#f4f4f6')); }
  }
  function apply(m) {
    m = m || mode();
    if (m === 'sun') { H.dataset.sky = '1'; var s = sky(); paint(s.dark, s.stops); }
    else { delete H.dataset.sky; paint(m === 'dark', null); }
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
      if (s.dark === was) { paint(s.dark, s.stops); return; }
      if (document.startViewTransition && !document.hidden) {
        H.classList.add('vt-sky');
        var t = document.startViewTransition(function () { paint(s.dark, s.stops); });
        t.finished.then(function () { H.classList.remove('vt-sky'); }, function () { H.classList.remove('vt-sky'); });
      } else paint(s.dark, s.stops);
    }, 30e3);
  }

  var LABEL = { light: 'Light', sun: 'Follow the sun', dark: 'Dark' };
  try { if (localStorage.getItem('jd_tilt') === '1') document.documentElement.classList.add('depth-pre'); } catch (e) {}
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
