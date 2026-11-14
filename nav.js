/* Mansoor Khan Academy: shared site menu.
   The menu is built from /pages.json, which is generated automatically on every publish,
   so a new page shows up here by itself. The list below is only a fallback. */
(function () {
  if (window.__mkaNav || document.getElementById('mka-nav')) return;
  window.__mkaNav = 1;
  var self = document.currentScript;
  var hideHeader = !!(self && self.hasAttribute('data-hide-header'));
  var path = decodeURIComponent(location.pathname).toLowerCase().replace(/index\.html$/, '');
  var FALLBACK = {
    extraLinks: [['Prompt Book', 'https://promptbookapp.github.io/'], ['Contact', 'mailto:mansoorkhan8185@gmail.com']],
    pages: [
      { url: '/Tools/Video-to-Audio-Converter/', label: 'Video to Audio Converter', group: 'tools', menu: true },
      { url: '/Tools/Video-%26-Audio-to-Text/', label: 'Video & Audio to Text', group: 'tools', menu: true },
      { url: '/Tools/video-editor/', label: 'AI Video Editor', group: 'tools', menu: true },
      { url: '/personalized-printables/', label: 'Printables', group: 'page', menu: true }
    ]
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function on(h) { try { return decodeURIComponent(h).toLowerCase() === path; } catch (e) { return false; } }
  function a(label, href) {
    return '<a ' + (on(href) ? 'class="on" ' : '') + 'href="' + esc(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>';
  }
  var CSS = '<style>' +
    ':host{display:block;position:fixed;top:0;left:0;right:0;width:100%;z-index:2147483000;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '*{box-sizing:border-box}' +
    '.bar{background:rgba(8,12,26,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.14);color:#f4f6ff}' +
    '.in{max-width:1180px;margin:0 auto;padding:0 14px;height:52px;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.logo{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none;font-weight:800;font-size:.95rem;white-space:nowrap}' +
    '.logo img{width:30px;height:30px;border-radius:50%;background:#fff}' +
    'nav{display:flex;align-items:center;gap:4px}' +
    'nav a,.dd>button{color:#c3cbe3;text-decoration:none;font:600 .9rem inherit;font-family:inherit;padding:8px 12px;border-radius:10px;background:none;border:0;cursor:pointer;white-space:nowrap}' +
    'nav a:hover,.dd>button:hover,nav a.on,.dd>button.on{color:#fff;background:rgba(255,255,255,.1)}' +
    '.dd{position:relative}' +
    '.menu{display:none;position:absolute;top:100%;left:0;min-width:240px;margin-top:6px;padding:6px;background:#0d1428;border:1px solid rgba(255,255,255,.16);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.5)}' +
    '.dd.open .menu{display:block}.menu a{display:block;padding:10px 12px}' +
    '.burger{display:none;width:42px;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:1.2rem;cursor:pointer}' +
    '@media(max-width:860px){.burger{display:block}nav{display:none;position:absolute;left:0;right:0;top:52px;max-height:calc(100vh - 52px);overflow:auto;flex-direction:column;align-items:stretch;gap:2px;padding:10px 14px 14px;background:#0a0f20;border-bottom:1px solid rgba(255,255,255,.14)}' +
    '.bar.open nav{display:flex}nav a,.dd>button{padding:12px;text-align:left;width:100%}.dd .menu{display:block;position:static;margin:0 0 0 10px;padding:0;background:none;border:0;box-shadow:none}}' +
    '@media(min-width:861px){.dd>button::after{content:" \\25BE"}}' +
    '</style>';

  var host = document.createElement('div');
  host.id = 'mka-nav';
  host.style.cssText = 'display:block;position:fixed;top:0;left:0;right:0;width:100%;z-index:2147483000;margin:0';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  function render(data) {
    var pages = (data.pages || []).filter(function (p) { return p.menu !== false; });
    var tools = pages.filter(function (p) { return p.group === 'tools'; }).sort(function (x, y) { return x.label.localeCompare(y.label); });
    var other = pages.filter(function (p) { return p.group !== 'tools'; }).sort(function (x, y) { return x.label.localeCompare(y.label); });
    var toolsOn = path.indexOf('/tools/') === 0;
    var secs = hideHeader ? [].slice.call(document.querySelectorAll('body section[id]')).map(function (s) { var h = s.querySelector('h2'); return h ? [h.textContent.trim(), '#' + s.id] : null; }).filter(Boolean) : [];
    root.innerHTML = CSS +
      '<div class="bar" id="bar"><div class="in">' +
      '<a class="logo" href="/"><img src="/logo-mansoor.png" alt="" width="30" height="30"><span>Mansoor Khan Academy</span></a>' +
      '<button class="burger" id="bg" aria-label="Menu" aria-expanded="false">&#9776;</button>' +
      '<nav aria-label="Site menu">' + a('Home', '/') +
      '<div class="dd" id="dd"><button type="button" id="ddb" class="' + (toolsOn ? 'on' : '') + '" aria-haspopup="true" aria-expanded="false">Tools</button><div class="menu">' +
      a('All tools', '/Tools/') + tools.map(function (p) { return a(p.label, p.url); }).join('') + '</div></div>' +
      (secs.length ? '<div class="dd" id="dd2"><button type="button" id="ddb2" aria-haspopup="true" aria-expanded="false">On this page</button><div class="menu">' + secs.map(function (s) { return '<a href="' + esc(s[1]) + '">' + esc(s[0]) + '</a>'; }).join('') + '</div></div>' : '') +
      other.map(function (p) { return a(p.label, p.url); }).join('') +
      (data.extraLinks || []).map(function (l) { return a(l[0], l[1]); }).join('') + '</nav></div></div>';
    var q = function (id) { return root.querySelector('#' + id); };
    var bar = q('bar'), dd = q('dd');
    q('bg').addEventListener('click', function () { var o = bar.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    q('ddb').addEventListener('click', function (e) { e.stopPropagation(); var d2 = q('dd2'); if (d2) d2.classList.remove('open'); var o = dd.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    if (q('ddb2')) q('ddb2').addEventListener('click', function (e) { e.stopPropagation(); dd.classList.remove('open'); var o = q('dd2').classList.toggle('open'); this.setAttribute('aria-expanded', o); });
  }
  document.addEventListener('click', function () { ['#dd', '#dd2'].forEach(function (s) { var d = root.querySelector(s); if (d) d.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ['#dd', '#dd2'].forEach(function (s) { var d = root.querySelector(s); if (d) d.classList.remove('open'); }); var b = root.querySelector('#bar'); if (b) b.classList.remove('open'); } });

  function mount() {
    document.body.insertBefore(host, document.body.firstChild);
    var cs = getComputedStyle(document.body);
    document.body.style.boxSizing = 'border-box';
    document.body.style.paddingTop = (parseFloat(cs.paddingTop) || 0) + 52 + 'px';
    if (hideHeader) { var st = document.createElement('style'); st.textContent = 'body>header{display:none!important}'; document.head.appendChild(st); }
    shift(); setTimeout(shift, 1200);
  }
  /* Pages with their own sticky/fixed top bar: move it below the menu so nothing is hidden */
  function shift() {
    var all = document.body.querySelectorAll('*'), vh = window.innerHeight;
    for (var i = 0; i < all.length; i++) {
      var el = all[i]; if (el === host) continue;
      var c = getComputedStyle(el);
      if ((c.position === 'sticky' || c.position === 'fixed') && c.top === '0px' && c.display !== 'none') {
        if (c.position === 'fixed' && el.getBoundingClientRect().height > vh * 0.4) continue;
        el.style.top = '52px';
      }
    }
  }
  render(FALLBACK);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  try {
    fetch('/pages.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.pages) render(d); }).catch(function () {});
  } catch (e) {}
})();
