/*
 * Villa Group, страница описания: язык, тема, меню, кадры демо, появление секций.
 * Без сборки и зависимостей. Тот же fmt() использует tools/render.cjs, чтобы RU-разметка
 * в index.html была записана из словаря, а не набрана вручную (страница читается и без JS).
 * Ключи localStorage общие с прототипом: vg-lang = ru|en|zh, vg-theme = system|light|dark.
 */
(function (root) {
  'use strict';
  var LANGS = ['ru', 'en', 'zh'];
  var LANG_ATTR = {ru: 'ru', en: 'en', zh: 'zh-Hans'};

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* Превращает значение ключа в HTML по виду, указанному в data-i18n-as; индекс для массивов — data-i18n-i */
  function fmt(T, lang, key, as, idx) {
    var v = T[lang][key];
    if (v === undefined) throw new Error('нет ключа ' + key + ' (' + lang + ')');
    if (idx !== undefined && idx !== null && idx !== '') v = v[+idx];
    v = String(v);
    if (as === 'p') return v.split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join('');
    if (as === 'jh' || as === 'jt') {
      var m = v.match(/^[^.。]+[.。]/);
      var head = m ? m[0] : v, rest = m ? v.slice(m[0].length).trim() : '';
      return esc(as === 'jh' ? head : rest);
    }
    if (as === 'contact') {
      return esc(v).replace(/hello@demda\.pro/g, '<a href="mailto:hello@demda.pro">hello@demda.pro</a>')
        .replace(/@demda(?![\w.])/g, '<a href="https://t.me/demda" rel="noopener">@demda</a>');
    }
    return esc(v);
  }
  function attrPairs(spec) { return spec.split(',').map(function (p) { var i = p.indexOf(':'); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }); }

  if (typeof module !== 'undefined' && module.exports) { module.exports = {fmt: fmt, attrPairs: attrPairs, esc: esc, LANGS: LANGS}; return; }

  var T = root.VG_TEXTS, doc = document, html = doc.documentElement;
  var store = {get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var dark = matchMedia('(prefers-color-scheme: dark)');
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- язык ---------- */
  var lang = html.getAttribute('data-lang') || 'ru';
  function loadZhFonts() {
    if ($('link[data-zh]')) return;
    var l = doc.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-zh', '');
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600&display=swap';
    doc.head.appendChild(l);
  }
  function applyTexts() {
    $$('[data-i18n]').forEach(function (el) { el.innerHTML = fmt(T, lang, el.getAttribute('data-i18n'), el.getAttribute('data-i18n-as'), el.getAttribute('data-i18n-i')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      attrPairs(el.getAttribute('data-i18n-attr')).forEach(function (p) { el.setAttribute(p[0], T[lang][p[1]]); });
    });
    $$('[data-frame]').forEach(function (el) {
      if (el.getAttribute('data-frame') === 'zh') return;
      ['src', 'srcset'].forEach(function (a) { $$('[' + a + ']', el).forEach(function (n) { n.setAttribute(a, n.getAttribute(a).replace(/-(ru|en|zh)-/g, '-' + lang + '-')); }); });
    });
    $$('a[data-demo]').forEach(function (a) { a.href = 'app/?lang=' + lang + (a.getAttribute('data-demo') || '#/dashboard'); });
    $$('a[data-href-ru]').forEach(function (a) { a.href = lang === 'ru' ? a.getAttribute('data-href-ru') : a.getAttribute('data-href-other'); });
    var lb = $('#lang-cur'); if (lb) lb.textContent = {ru: 'RU', en: 'EN', zh: '中文'}[lang];
    $$('#lang-menu [data-v]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-v') === lang)); });
  }
  function setLang(l, save) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l; html.lang = LANG_ATTR[l]; html.setAttribute('data-lang', l);
    if (save !== false) store.set('vg-lang', l);
    if (l === 'zh') loadZhFonts();
    applyTexts();
  }

  /* ---------- тема ---------- */
  var pref = html.getAttribute('data-pref') || 'system';
  function resolved() { return pref === 'system' ? (dark.matches ? 'dark' : 'light') : pref; }
  function paintTheme() {
    var r = resolved();
    html.setAttribute('data-theme', r); html.setAttribute('data-pref', pref);
    var m = $('meta[name=theme-color]'); if (m) m.content = r === 'dark' ? '#0B100F' : '#F5F2EC';
    $$('#theme-menu [data-v]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-v') === pref)); });
    var tb = $('#theme-btn'); if (tb) tb.setAttribute('aria-label', T[lang].ui_theme + ': ' + T[lang]['ui_theme_' + pref]);
  }
  function setTheme(p) {
    pref = p; store.set('vg-theme', p);
    if (doc.startViewTransition && !reduce.matches) doc.startViewTransition(paintTheme); else paintTheme();
  }
  dark.addEventListener('change', function () { if (pref === 'system') paintTheme(); });

  /* ---------- всплывающие меню ---------- */
  function popover(btn, menu, onPick) {
    function items() { return $$('[role=menuitemradio]', menu); }
    function close(focus) { if (menu.hidden) return; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus(); }
    function open() {
      $$('.menu').forEach(function (m) { if (m !== menu) { m.hidden = true; var b = m.parentNode.querySelector('.ctl'); if (b) b.setAttribute('aria-expanded', 'false'); } });
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      var cur = items().filter(function (i) { return i.getAttribute('aria-checked') === 'true'; })[0] || items()[0]; cur.focus();
    }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(true); });
    menu.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) { onPick(b.getAttribute('data-v')); close(true); } });
    menu.addEventListener('keydown', function (e) {
      var it = items(), i = it.indexOf(doc.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
      else if (e.key === 'Tab') close(false);
    });
    doc.addEventListener('click', function (e) { if (!menu.hidden && !menu.parentNode.contains(e.target)) close(false); });
  }

  /* ---------- шапка и появление секций ---------- */
  function onScroll() { html.classList.toggle('scrolled', (root.scrollY || 0) > 8); }
  function reveal() {
    var els = $$('.rv');
    if (reduce.matches || !('IntersectionObserver' in root)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin: '0px 0px -8% 0px', threshold: 0.05});
    els.forEach(function (e) { io.observe(e); });
  }

  html.classList.add('js');
  setLang(lang, false);
  paintTheme();
  popover($('#lang-btn'), $('#lang-menu'), function (v) { setLang(v); paintTheme(); });
  popover($('#theme-btn'), $('#theme-menu'), setTheme);
  root.addEventListener('scroll', onScroll, {passive: true}); onScroll();
  reveal();
})(this);
