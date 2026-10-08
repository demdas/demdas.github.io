/*
 * demda.pro/ai-dc: тема, появление по прокрутке, счётчики, пауза бесконечных анимаций вне экрана, шина-навигация, видео.
 * Без библиотек. Без JS страница полностью читается (весь текст и цифры в разметке).
 */
(function () {
  'use strict';
  /* Видео: поставьте true, когда на сервере лежат /demo/files/ai-dc/ai-dc-1080.mp4 и ai-dc-720.mp4 и постеры video-poster-*.avif|webp рядом со страницей */
  var VIDEO_READY = false;
  var VIDEO_SRC = {hd: '/demo/files/ai-dc/ai-dc-1080.mp4', sd: '/demo/files/ai-dc/ai-dc-720.mp4'};

  var doc = document, html = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- тема ---------- */
  var tbtn = $('#theme-btn');
  function isDark() { return html.getAttribute('data-theme') === 'dark'; }
  function syncTheme() {
    if (tbtn) tbtn.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    var m = $('meta[name=theme-color]'); if (m) m.content = isDark() ? '#0B0D10' : '#F3F4F1';
  }
  function setTheme(t) {
    var apply = function () { html.setAttribute('data-theme', t); syncTheme(); };
    try { localStorage.setItem('ai-dc-theme', t); } catch (e) {}
    if (doc.startViewTransition && !reduce.matches) doc.startViewTransition(apply); else apply();
  }
  syncTheme();
  if (tbtn) tbtn.addEventListener('click', function () { setTheme(isDark() ? 'light' : 'dark'); });

  /* ---------- счётчики ---------- */
  function fmtNum(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function count(el, dur, delay) {
    var to = parseFloat(el.getAttribute('data-to')), dec = +el.getAttribute('data-dec') || 0, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = fmtNum(to * e, dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmtNum(to, dec);
    }
    setTimeout(function () { requestAnimationFrame(step); }, delay || 0);
  }
  var nums = $$('.num');
  var animate = hasIO && !reduce.matches;
  if (animate) {
    nums.forEach(function (n) { n.textContent = fmtNum(0, +n.getAttribute('data-dec') || 0); });
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        var n = e.target, inCard = n.closest('.sc, .costbar');
        count(n, inCard ? 900 : 1200, inCard ? 120 : 0);
      });
    }, {rootMargin: '0px 0px -10% 0px'});
    nums.forEach(function (n) { if (!n.closest('.hero')) nio.observe(n); });
  }

  /* ---------- первый экран ---------- */
  function heroStart() {
    if (html.classList.contains('go')) return;
    html.classList.add('go');
    if (animate) $$('.hero .stat').forEach(function (s, i) { $$('.num', s).forEach(function (n) { count(n, 1200, i * 120); }); });
  }
  var ready = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
  var started = false;
  function go() { if (!started) { started = true; heroStart(); } }
  Promise.race([ready, new Promise(function (r) { setTimeout(r, 600); })]).then(go);
  setTimeout(go, 700);

  /* ---------- появление по прокрутке ---------- */
  var targets = $$('.reveal, [data-anim]');
  if (!hasIO) {
    targets.forEach(function (t) { t.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); rio.unobserve(e.target);
        if (e.target.classList.contains('sc') && e.target.classList.contains('sc-ok')) {
          setTimeout(function () { e.target.classList.add('sc-flash'); setTimeout(function () { e.target.classList.remove('sc-flash'); }, 300); }, 120 + 460);
        }
      });
    }, {rootMargin: '0px 0px -10% 0px', threshold: 0});
    targets.forEach(function (t) { rio.observe(t); });
  }

  /* ---------- бесконечные анимации: только в зоне видимости и в активной вкладке ---------- */
  var nodes = $('.nodes');
  if (nodes && hasIO) {
    var vis = false;
    var upd = function () { nodes.classList.toggle('live', vis && !doc.hidden); };
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; upd(); }).observe(nodes);
    doc.addEventListener('visibilitychange', upd);
  } else if (nodes) { nodes.classList.add('live'); }

  /* ---------- шапка: кнопка «Обсудить» появляется, когда основная ушла из вида ---------- */
  var hcta = $('#hero-cta'), tcta = $('#top-cta');
  if (hcta && tcta && hasIO) {
    new IntersectionObserver(function (es) {
      var r = es[0];
      tcta.classList.toggle('show', !r.isIntersecting && r.boundingClientRect.top < 0);
    }).observe(hcta);
  } else if (tcta) { tcta.classList.add('show'); }

  /* ---------- шина-навигация ---------- */
  var rail = $('#rail');
  if (rail && hasIO) {
    var links = $$('a[data-sec]', rail), secs = links.map(function (a) { return $('#' + a.getAttribute('data-sec')); });
    var hero = $('#offer');
    new IntersectionObserver(function (es) { rail.classList.toggle('show', !es[0].isIntersecting); }, {rootMargin: '-40% 0px 0px 0px'}).observe(hero);
    var setActive = function (i) {
      links.forEach(function (a, k) { a.classList.toggle('on', k === i); a.classList.toggle('done', k < i); if (k === i) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      rail.style.setProperty('--rp', links.length > 1 ? (i / (links.length - 1)).toFixed(3) : 0);
    };
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(secs.indexOf(e.target)); });
    }, {rootMargin: '-40% 0px -55% 0px'});
    secs.forEach(function (s) { if (s) sio.observe(s); });
  } else if (rail) { rail.classList.add('show'); }

  /* ---------- подписи номеров на узких сегментах разбивки затрат ---------- */
  var cost = $('#more-cost');
  function fitSegs() {
    $$('.cb2-seg', cost).forEach(function (s) { var b = $('b', s); b.hidden = s.getBoundingClientRect().width < 24; });
  }
  if (cost) {
    cost.addEventListener('toggle', fitSegs);
    window.addEventListener('resize', function () { if (cost.open) fitSegs(); });
  }

  /* ---------- видео: компонент готов, но выводится только при VIDEO_READY ---------- */
  if (VIDEO_READY) {
    var put = function (tplId, slotSel) {
      var tpl = $(tplId), slot = $(slotSel); if (!tpl || !slot) return;
      slot.appendChild(tpl.content.cloneNode(true));
    };
    put('#tpl-video-link', '[data-video-slot=hero]');
    put('#tpl-video-section', '[data-video-slot=section]');
    var dtpl = $('#tpl-video-dialog'); doc.body.appendChild(dtpl.content.cloneNode(true));
    var dlg = $('#vdlg'), box = $('.vbox', dlg), err = $('.verr', dlg), opener = null;
    var build = function () {
      err.hidden = true; box.hidden = false; box.textContent = '';
      var v = doc.createElement('video');
      v.controls = true; v.setAttribute('playsinline', ''); v.preload = 'metadata';
      var small = window.matchMedia('(max-width: 1023px)').matches;
      (small ? [VIDEO_SRC.sd, VIDEO_SRC.hd] : [VIDEO_SRC.hd, VIDEO_SRC.sd]).forEach(function (u) { var s = doc.createElement('source'); s.src = u; s.type = 'video/mp4'; v.appendChild(s); });
      v.addEventListener('error', fail, true);
      box.appendChild(v);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    };
    var fail = function () { box.hidden = true; box.textContent = ''; err.hidden = false; };
    var close = function () { if (dlg.open) dlg.close(); };
    dlg.addEventListener('close', function () {
      var v = $('video', box); if (v) { v.pause(); v.removeAttribute('src'); $$('source', v).forEach(function (s) { s.remove(); }); v.load(); }
      box.textContent = ''; html.classList.remove('lock');
      if (opener) opener.focus();
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    doc.addEventListener('click', function (e) {
      var o = e.target.closest('[data-video-open]');
      if (o) { opener = o; html.classList.add('lock'); dlg.showModal(); build(); return; }
      if (e.target.closest('[data-video-close]')) close();
      if (e.target.closest('[data-video-retry]')) build();
    });
  }
})();
