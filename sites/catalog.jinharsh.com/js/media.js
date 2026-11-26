// "Watch & learn" on a catalogue's page: product videos, installation videos, and trials & recommendations
// (proof from real plants). The team adds them under Edit details. YouTube and Vimeo videos play in a window over
// the page (YouTube without its tracking cookies); anything else opens in a new tab.
import { icon } from '/hub/vendor/icons.js?v=3';
import * as M from './motion.js';
import { swallow, pourInto } from './particles.js';
import { track } from './visitor.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GROUPS = [
  { kind: 'video', title: 'Product videos', ic: 'play' },
  { kind: 'install', title: 'Installation videos', ic: 'wrench' },
  { kind: 'trial', title: 'Trials & recommendations', ic: 'badge-check' },
];

// what a link is: a YouTube or Vimeo video (with its id), or anything else
export function videoOf(url) {
  try {
    const u = new URL(url), h = u.hostname.replace(/^www\.|^m\./, '');
    let id = '';
    if (h === 'youtu.be') id = u.pathname.slice(1);
    else if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/) || [])[1] || '';
    if (/^[\w-]{6,20}$/.test(id)) return { site: 'youtube', id, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
    const v = h === 'vimeo.com' ? (u.pathname.match(/^\/(\d{5,12})/) || [])[1] : '';
    if (v) return { site: 'vimeo', id: v, thumb: '', embed: `https://player.vimeo.com/video/${v}?autoplay=1` };
  } catch {}
  return null;
}

export function mediaHtml(media = [], code = '') {
  const list = (media || []).filter((m) => m && m.url);
  if (!list.length) return '';
  const card = (m) => {
    const v = videoOf(m.url);
    let host = '';
    try { host = new URL(m.url).hostname.replace(/^www\./, ''); } catch {}
    const isPdf = /\.pdf(\?|#|$)/i.test(m.url);
    return `<a class="md-card${v ? ' is-video' : ''}" href="${esc(m.url)}" target="_blank" rel="noopener" data-media="${esc(m.kind)}" data-code="${esc(code)}">
      <div class="md-pic">${v && v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="md-ic">${icon(isPdf ? 'file-text' : GROUPS.find((g) => g.kind === m.kind)?.ic || 'external-link')}</span>`}
        ${v ? `<span class="md-play">${icon('play')}</span>` : ''}</div>
      <div class="md-text"><b>${esc(m.title || (v ? 'Watch the video' : host))}</b><small>${v ? (v.site === 'youtube' ? 'YouTube' : 'Vimeo') : isPdf ? 'PDF · ' + esc(host) : esc(host)}</small></div>
    </a>`;
  };
  return `<section class="media-sec">
    ${GROUPS.map((g) => {
      const items = list.filter((m) => m.kind === g.kind);
      return items.length ? `<div class="md-group"><h2>${icon(g.ic)}${g.title}</h2><div class="md-grid">${items.map(card).join('')}</div></div>` : '';
    }).join('')}
  </section>`;
}

// a video plays in a window over the page; the window floats away as soft grains like the others
function play(a) {
  const v = videoOf(a.href);
  if (!v) return false;
  const ov = document.createElement('div');
  ov.className = 'ju-overlay video-ov';
  ov.innerHTML = `<div class="video-box" role="dialog" aria-modal="true" aria-label="Video">
    <button class="ju-icon close-x" type="button" data-x aria-label="Close">${icon('x')}</button>
    <div class="video-frame"><iframe src="${esc(v.embed)}" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
  </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  const box = ov.querySelector('.video-box');
  try { const r = a.getBoundingClientRect(); pourInto({ left: r.left, top: r.top, width: r.width, height: r.height }, box); } catch {}
  let closed = false;
  const close = (at) => {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey);
    ov.querySelector('iframe').src = 'about:blank'; // stop the sound at once
    swallow(box, { at });
    M.play(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: 'ease-in' }).then(() => { ov.remove(); document.body.style.overflow = ''; });
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => {
    if (e.target === ov) return close();
    const x = e.target.closest('[data-x]');
    if (x) { const b = x.getBoundingClientRect(); close({ x: b.left + b.width / 2, y: b.top + b.height / 2 }); }
  });
  return true;
}

let wired = false;
export function wireMedia() {
  if (wired) return;
  wired = true;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-media]');
    if (!a) return;
    track('video', a.dataset.code || '');
    if (e.ctrlKey || e.metaKey || e.shiftKey) return; // their own new tab
    if (play(a)) e.preventDefault();
  });
}
