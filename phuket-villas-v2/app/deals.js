'use strict';
/*
 * Villa Group: «Сделки» (спецификация v2, раздел 6.1, вариант A): резиновая доска на всю ширину, карточка 100 px без кнопок,
 * панель сделки поверх доски, перетаскивание (мышь: сдвиг 4 px; палец: удержание 250 мс), клавиатура, меню «⋯», телефон: вкладки этапов + лист.
 */
const STAGE_DOT = ['text-3', 'info', 'accent', 'warn', 'ok'];
const MGRS = ['Елена М.', 'Чен Ю.'];
const typeOfDeal = d => ['A', 'B', 'C'].includes(d.int) ? d.int : d.villa ? V(d.villa).type : ((vById(d.int) || {}).type || 'B');
function intLabel(d) {
  if (d.col >= 3 && d.villa) return t('int_villa', {id:V(d.villa).id, t:V(d.villa).type});
  if (['A', 'B', 'C'].includes(d.int)) return t('int_lead', {t:d.int, b:money(d.bud, 'THB', 'kb')});
  const v = vById(d.int);                                                   // интерес к конкретной вилле: занята — честно говорим
  return v && v.sale !== 'free' ? t('int_taken', {id:v.id, t:v.type}) : t('int_villa', {id:d.int, t:v ? v.type : ''});
}
const dealsVis = () => S.deals.filter(d => S.dealMgr === 'all' || d.mgr === S.dealMgr);
const dayTone = d => { const thr = DEMO.dealWarn[d.col]; return !thr ? '' : d.days > thr * 2 ? 'err' : d.days > thr ? 'warn' : ''; };
const colStat = (list, c) => { const ds = list.filter(d => d.col === c); return {n:ds.length, sum:sumBy(ds, dealAmt)}; };

function dealCard(d) {
  const tone = dayTone(d);
  return `<div class="deal${RT.id === d.id ? ' sel' : ''}" data-deal="${d.id}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(t('dl_card', {n:nm(d.name), c:t('f' + d.col)}))}" aria-keyshortcuts="Control+ArrowRight Control+ArrowLeft Meta+ArrowRight Meta+ArrowLeft">
   <div class="d1"><b class="dn ell">${esc(nm(d.name))}</b><b class="da nw">${money(dealAmt(d), 'THB', 'kb')}</b></div>
   <div class="d2"><span class="di ell">${intLabel(d)}</span><span class="dd2 nw ${tone ? 'tone-' + tone : ''}">${tone ? ic('clock', 'ic sm12') : ''}${fdays(d.days)}</span></div>
   <div class="d3"><span class="src ell">${t('src_' + d.src)}</span><span class="mgr" title="${esc(nm(d.mgr))}">${initials(nm(d.mgr))}</span><button class="more" data-act="deal-menu" data-v="${d.id}" aria-haspopup="menu" aria-label="${esc(t('dl_menu', {n:nm(d.name)}))}">${ic('more')}</button></div></div>`;
}
function colHtml(c, list) {
  const ds = list.filter(d => d.col === c), st = colStat(list, c);
  return `<section class="kcol" data-drop-col="${c}" aria-label="${t('f' + c)}"><header class="kh"><i class="sdot" style="background:var(--${STAGE_DOT[c]})"></i><b class="kn ell" title="${t('f' + c)}">${t('f' + c)}</b><span class="kc">${st.n}</span><span class="ks nw">${money(st.sum, 'THB', 'kb')}</span></header>
   <div class="kb">${ds.map(dealCard).join('') || `<p class="kempty">${t('dl_none')}</p>`}</div></section>`;
}
function vDeals() {
  const b = bp(), list = dealsVis(), total = sumBy(list, dealAmt), tab = S.dealTab;
  const tools = `<span class="cap">${t('dl_mgr')}</span>${seg('dealmgr', [['all', t('f_all')]].concat(MGRS.map(m => [m, nm(m)])), S.dealMgr, 'sm')}`;
  const sub = t('dl_sub', {n:t('dl_n', {n:list.length}), x:money(total, 'THB', 'kb')});
  let body;
  if (b.phone) {
    const st = colStat(list, tab);
    body = `<div class="caps dtabs">${[0, 1, 2, 3, 4].map(i => `<button class="capsule" data-act="dealtab" data-v="${i}" aria-pressed="${tab === i}">${t('f' + i)}<i>${colStat(list, i).n}</i></button>`).join('')}</div>
     <p class="sm soft dsum">${t('dl_n', {n:st.n})} · <span class="nw">${money(st.sum, 'THB', 'kb')}</span></p>
     <div class="dcards">${list.filter(d => d.col === tab).map(dealCard).join('') || `<p class="kempty">${t('dl_none')}</p>`}</div>`;
  } else {
    body = `<div class="boardwrap"><div class="board" tabindex="-1">${[0, 1, 2, 3, 4].map(c => colHtml(c, list)).join('')}</div></div>`;
  }
  return `${head(t('dl_title'), sub, tools)}<p class="hint dhint">${b.phone ? t('dl_hint_m') : t('dl_hint_d')}</p>${body}`;
}
function boardShade() {
  const w = $('.boardwrap'), bd = $('.board'); if (!w || !bd) return;
  w.classList.toggle('shade', bd.scrollLeft + bd.clientWidth < bd.scrollWidth - 4);
}
document.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('board')) boardShade(); }, true);
window.addEventListener('resize', boardShade);

/* ---------- панель сделки ---------- */
function panelDeal(id) {
  const d = dealById(id); if (!d) return '';
  const col = d.col, ty = typeOfDeal(d);
  const phone = '+66 •• ••• ' + String(4821 - d.id.replace('D', '') * 37).slice(-4), h = d.handle;
  const mask = h.slice(0, 2) + '••••' + h.slice(-2), mname = t('msg_' + d.msg);
  const summary = kv([
    [t('dp_budget'), `<span class="nw">${thb(d.bud)}</span>`], [t('dp_interest'), col >= 3 && d.villa ? t('int_villa', {id:V(d.villa).id, t:V(d.villa).type}) : t('int_spec', {t:ty, br:TYPES[ty].br})],
    [t('dp_src'), `<span class="src">${t('src_' + d.src)}</span>`], [t('dp_mgr_c'), `<span class="mgr">${initials(nm(d.mgr))}</span> ${esc(nm(d.mgr))}`],
    [t('dp_stage_c'), `<span class="nw">${t('dp_days', {n:d.days})}</span>`], [t('dp_lang'), `<span class="src">${LANG_NAME[d.lang]}</span>`]]);
  /* вилла */
  let villa;
  if (col >= 3 && d.villa) {
    const v = V(d.villa), p0 = v.pays[0];
    villa = `<div class="card flat vcard"><b class="nw">${v.id} · ${t('type_n', {t:v.type})} · ${thb(PRICE[v.type])}</b><p class="sm soft">${t('dp_booking', {a:thb(p0.amt), d:p0.paid ? fshort(p0.paid) : '—'})}</p><a class="lnk" href="#/lots/${v.id}">${t('dp_open_lot')} ${ic('right', 'ic sm16')}</a></div>`;
  } else {
    const fits = S.villas.filter(v => v.sale === 'free' && v.type === ty && PRICE[v.type] <= d.bud).sort((a, b) => PRICE[a.type] - PRICE[b.type] || a.n - b.n).slice(0, 3);
    const canBook = col === 1 || col === 2;
    if (fits.length) villa = `<div class="vlist">${fits.map(v => `<div class="vrow"><b class="nw vn">${v.id}</b><span class="sm soft ell">${t('dp_vspec', {t:v.type, m2:TYPES[v.type].m2})}</span><b class="nw">${thb(PRICE[v.type])}</b><button class="btn btn-o sm" data-act="deal-book" data-v="${d.id}" data-vid="${v.id}" ${canBook ? '' : 'disabled'}>${t('book_btn')}</button></div>`).join('')}</div>${canBook ? '' : `<p class="sm faint">${t('dp_after_qual')}</p>`}`;
    else {
      const near = S.villas.filter(v => v.sale === 'free').sort((a, b) => (b.type === ty) - (a.type === ty) || PRICE[a.type] - PRICE[b.type])[0];
      villa = `<p class="sm soft">${near ? t('dp_none_near', {id:near.id, p:thb(PRICE[near.type])}) : t('dp_none')}</p>`;
    }
  }
  const tasks = [0, 1].map(i => `<button class="task" data-act="task" data-v="${d.id}" data-i="${i}" role="checkbox" aria-checked="${d.tasks[i]}"><span class="tb">${ic('check', 'ic')}</span><span class="tt">${t('tk_' + col + '_' + i, {x:ty})}</span></button>`).join('');
  const hist = d.hist.slice(0, 5).map(h => `<li><span class="sm faint nw">${fshort(h[0])}</span><span>${t(h[1], {s:h[1] === 'h_new' ? t('src_' + h[2]) : '', c:/^h_(stage|moved)$/.test(h[1]) ? t('f' + h[2]) : '', v:/^h_(booked|signed)$/.test(h[1]) ? h[2] : ''})}</span></li>`).join('');
  const body = `${blk(t('dp_summary'), summary)}${blk(t('dp_stage'), stepper([0, 1, 2, 3, 4].map(i => t('f' + i)), col))}${blk(col >= 3 ? t('dp_villa') : t('dp_fit'), villa)}
    ${blk(t('dp_contacts'), `<p class="nw">${phone}</p><p class="nw">${mname} · ${mask}</p><p class="sm faint">${t('dp_phone_note')}</p>`)}${blk(t('dp_tasks'), `<div class="tasks">${tasks}</div>`)}${blk(t('dp_hist'), `<ul class="hist">${hist}</ul>`)}`;
  const prevOk = col > 0 && checkMove(d, col - 1).ok;
  const main = [['dp_to_q', 1], ['dp_to_show', 2], ['dp_to_book', 3], ['dp_to_sign', 4]][col];
  let foot = '';
  if (col < 4) foot = `${prevOk ? `<button class="btn btn-o" data-act="deal-move" data-v="${d.id}" data-to="${col - 1}">${ic('left', 'ic sm16')}${t('f' + (col - 1))}</button>` : '<span></span>'}<button class="btn btn-p" data-act="deal-move" data-v="${d.id}" data-to="${main[1]}">${t(main[0])}${col < 3 ? ' ' + ic('right', 'ic sm16') : ''}</button>`;
  return panelShell({title:esc(nm(d.name)), badge:`<span class="badge st-badge" style="--c:var(--${STAGE_DOT[col]})">${t('f' + col)}</span>`, body, foot, aria:t('panel_aria')});
}

/* ---------- правила переноса: одни на перетаскивание, меню, клавиатуру и кнопки панели ---------- */
function checkMove(d, to) {
  const from = d.col;
  if (to === from || to < 0 || to > 4) return {ok:false};
  if (from === 4) return {ok:false, k:'dd_contract'};
  if (from === 3 && to < 3) return {ok:false, k:'dd_bookhold'};
  if (to <= 2) return {ok:true, act:'move'};
  if (to === 3) { if (from === 0) return {ok:false, k:'dd_qual'}; return S.villas.some(v => v.sale === 'free') ? {ok:true, act:'pick'} : {ok:false, k:'dd_nofree'}; }
  if (from === 3) return {ok:true, act:'sign'};
  return {ok:false, k:'dd_first_book'};
}
let FOCUS_DEAL = null;
function moveDeal(d, to) { d.col = to; d.days = 0; d.tasks = [false, false]; d.hist.unshift([TODAY, 'h_moved', to]); }
function tryMove(id, to, via) {
  const d = dealById(id), chk = checkMove(d, to);
  if (!chk.ok) { if (chk.k) toast(t(chk.k)); return false; }
  if (via) FOCUS_DEAL = id;
  if (chk.act === 'move') {
    const run = () => { moveDeal(d, to); rerender(); toast(t('dd_moved', {n:nm(d.name), c:t('f' + to)})); };
    const el = bp().phone && document.querySelector('.deal[data-deal="' + id + '"]');
    if (el && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { el.classList.add('leaving'); setTimeout(run, 150); } else run();
  } else { MODAL = {type:chk.act === 'sign' ? 'sign' : 'pickvilla', id}; renderLayer(); }
  return true;
}
MODALS.pickvilla = m => {
  const d = dealById(m.id), want = typeOfDeal(d);
  const fr = S.villas.filter(v => v.sale === 'free').sort((a, b) => (b.type === want) - (a.type === want) || a.n - b.n);
  return sheet(`<h2>${t('pv_title')}</h2><p class="sm soft">${t('pv_sub', {n:esc(nm(d.name)), i:intLabel(d)})}</p><div class="opts">${fr.length ? fr.map(v => `<button class="opt" data-act="book-pick" data-v="${d.id}" data-vid="${v.id}"><span class="t"><b>${t('pv_line', {id:v.id, t:v.type})}</b><br><span class="sm soft">${t('pv_line2', {p:thb(PRICE[v.type]), pc:pct(v.pct)})}</span></span>${v.type === want ? `<span class="badge b-accent">${t('pv_type')}</span>` : ''}${d.bud >= PRICE[v.type] ? `<span class="badge b-ok">${t('pv_bud')}</span>` : ''}</button>`).join('') : emptyBox('search', t('pv_none'))}</div><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button>`);
};
MODALS.sign = m => {
  const d = dealById(m.id), v = V(d.villa);
  return sheet(`<h2>${t('sg_title')}</h2><p>${esc(nm(d.name))} · ${v.id}</p><p class="sm soft">${t('sg_text', {a:thb(v.pays[1].amt)})}</p><div class="btns"><button class="btn btn-p block" data-act="sign-do" data-v="${d.id}">${t('sg_yes')}</button><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button></div>`);
};
MODALS.moveto = m => {
  const d = dealById(m.id);
  return sheet(`<h2>${t('mv_title')}</h2><p class="sm soft">${esc(nm(d.name))} · ${t('f' + d.col)}</p><div class="opts">${[0, 1, 2, 3, 4].filter(c => c !== d.col).map(c => {
    const chk = checkMove(d, c);
    return `<button class="opt" data-act="deal-move" data-v="${d.id}" data-to="${c}" ${chk.ok ? '' : 'disabled'}><span class="t"><b>${t('f' + c)}</b>${chk.ok ? '' : `<br><span class="sm soft">${t(chk.k)}</span>`}</span></button>`;
  }).join('')}</div><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button>`);
};
Object.assign(ACT, {
  dealtab(v) { S.dealTab = +v; rerender(); },
  dealmgr(v) { S.dealMgr = v; rerender(); },
  'deal-open'(v) { POP = null; location.hash = '#/deals/' + v.toLowerCase(); },
  'deal-move'(v, el) { MODAL = null; POP = null; const to = +el.dataset.to; renderLayer(); tryMove(v, to, 'ui'); },
  'deal-book'(v, el) { bookVilla(el.dataset.vid, v); rerender(); },
  'sign-do'(v) { const d = dealById(v), vl = V(d.villa); vl.sale = 'sold'; vl.pays[1].paid = TODAY; vl.pays[1].due = null; vl.contract = TODAY; d.col = 4; d.days = 0; d.tasks = [true, false]; d.hist.unshift([TODAY, 'h_signed', vl.id]); MODAL = null; rerender(); toast(t('toast_sold', {v:vl.id, a:thb(vl.pays[1].amt)})); },
  task(v, el) { const d = dealById(v), i = +el.dataset.i; d.tasks[i] = !d.tasks[i]; rerender(); },
  'deal-menu'(v, el, e) {
    e.stopPropagation(); const d = dealById(v);
    if (bp().phone) { MODAL = {type:'moveto', id:v}; POP = null; renderLayer(); return; }
    const items = [{act:'deal-open', v, t:t('dp_open')}, '-'];
    if (checkMove(d, d.col + 1).ok) items.push({act:'deal-move', v, to:d.col + 1, t:t('mv_next', {c:t('f' + (d.col + 1))})});
    if (d.col > 0 && checkMove(d, d.col - 1).ok) items.push({act:'deal-move', v, to:d.col - 1, t:t('mv_prev', {c:t('f' + (d.col - 1))})});
    items.push({act:'deal-moveto', v, t:t('mv_to')});
    POP = {rect:el.getBoundingClientRect(), items}; OPEN_DD = null; chrome(); renderLayer();
  },
  'deal-moveto'(v) { POP = null; MODAL = {type:'moveto', id:v}; renderLayer(); }
});

/* ---------- перетаскивание: указатель (мышь, перо) и палец с удержанием ---------- */
const DND = {g:null, quiet:0};
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const stopTouch = e => { if (e.cancelable) e.preventDefault(); };
function dndDown(e) {
  if (RT.name !== 'deals' || DND.g || KB.g) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const card = e.target.closest('.deal[data-deal]');
  if (!card || e.target.closest('.more')) return;
  const touch = e.pointerType === 'touch';
  const g = DND.g = {id:card.dataset.deal, card, pid:e.pointerId, touch, x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY, on:false, timer:0, ghost:null, dz:null, ox:0, oy:0, hint:null};
  if (touch) g.timer = setTimeout(() => { if (bp().phone) { const id = g.id; dndEnd(true); if (navigator.vibrate) navigator.vibrate(10); DND.quiet = performance.now() + 400; MODAL = {type:'moveto', id}; renderLayer(); } else dndStart(g); }, 250);
  document.addEventListener('pointermove', dndMove);
  document.addEventListener('pointerup', dndUp);
  document.addEventListener('pointercancel', dndCancel);
  document.addEventListener('keydown', dndKey);
}
function dndStart(g) {
  if (DND.g !== g || g.on) return;
  g.on = true;
  const r = g.card.getBoundingClientRect(), d = dealById(g.id);
  g.ox = g.x0 - r.left; g.oy = g.y0 - r.top; g.rect = r;
  g.ghost = g.card.cloneNode(true); g.ghost.removeAttribute('data-deal'); g.ghost.removeAttribute('tabindex'); g.ghost.classList.add('deal-ghost');
  g.ghost.style.width = r.width + 'px';
  document.body.appendChild(g.ghost);
  g.hint = document.createElement('div'); g.hint.className = 'dnd-hint'; g.hint.hidden = true; document.body.appendChild(g.hint);
  g.card.classList.add('dragging'); document.body.classList.add('dnd');
  const bd0 = $('.board'); if (bd0) bd0.style.scrollSnapType = 'none';       // иначе привязка к колонкам возвращает доску назад при автопрокрутке
  document.querySelectorAll('.kcol').forEach(c => { const col = +c.dataset.dropCol; if (col !== d.col) c.classList.add(checkMove(d, col).ok ? 'can' : 'cannot'); });
  if (g.touch) { document.addEventListener('touchmove', stopTouch, {passive:false}); if (navigator.vibrate) navigator.vibrate(10); }
  dndPlace(g);
  const tick = () => {                                   // у краёв доски она прокручивается сама, у верха и низа окна — страница
    if (DND.g !== g) return;
    const bd = $('.board');
    if (bd) {
      const br = bd.getBoundingClientRect(), E = 48;
      const dx = g.x < br.left + E ? -Math.ceil(16 * (br.left + E - g.x) / E) : g.x > br.right - E ? Math.ceil(16 * (g.x - (br.right - E)) / E) : 0;
      if (dx) { bd.scrollLeft += Math.max(-16, Math.min(16, dx)); dndPlace(g); }
    }
    const dy = g.y < 70 ? -14 : g.y > innerHeight - 70 ? 14 : 0;
    if (dy) { scrollBy(0, dy); dndPlace(g); }
    g.raf = requestAnimationFrame(tick);
  };
  g.raf = requestAnimationFrame(tick);
}
function dndPlace(g) {
  g.ghost.style.left = (g.x - g.ox) + 'px'; g.ghost.style.top = (g.y - g.oy) + 'px';
  const el = document.elementFromPoint(g.x, g.y), dz = el && el.closest('[data-drop-col]'), d = dealById(g.id);
  if (dz !== g.dz) {
    if (g.dz) g.dz.classList.remove('over');
    g.dz = dz;
    if (dz && +dz.dataset.dropCol !== d.col && checkMove(d, +dz.dataset.dropCol).ok) dz.classList.add('over');
  }
  const chk = dz && +dz.dataset.dropCol !== d.col ? checkMove(d, +dz.dataset.dropCol) : null;
  if (chk && !chk.ok && chk.k) { g.hint.hidden = false; g.hint.textContent = t(chk.k); g.hint.style.left = Math.min(g.x + 14, innerWidth - 220) + 'px'; g.hint.style.top = (g.y + 18) + 'px'; } else g.hint.hidden = true;
}
function dndMove(e) {
  const g = DND.g; if (!g || e.pointerId !== g.pid) return;
  g.x = e.clientX; g.y = e.clientY;
  if (!g.on) {
    const dist = Math.hypot(g.x - g.x0, g.y - g.y0);
    if (g.touch) { if (dist > 8) dndEnd(true); }          // палец пошёл раньше удержания: это прокрутка
    else if (dist > 4) dndStart(g);
    return;
  }
  dndPlace(g);
}
function dndUp(e) { const g = DND.g; if (g && e.pointerId === g.pid) dndEnd(false); }
function dndCancel(e) { const g = DND.g; if (g && e.pointerId === g.pid) dndEnd(true); }
function dndKey(e) { if (e.key === 'Escape' && DND.g) dndEnd(true); }
function dndEnd(cancel) {
  const g = DND.g; if (!g) return;
  DND.g = null; clearTimeout(g.timer); cancelAnimationFrame(g.raf);
  document.removeEventListener('pointermove', dndMove); document.removeEventListener('pointerup', dndUp);
  document.removeEventListener('pointercancel', dndCancel); document.removeEventListener('keydown', dndKey);
  document.removeEventListener('touchmove', stopTouch);
  if (!g.on) return;
  document.body.classList.remove('dnd'); if (g.hint) g.hint.remove();
  const bd1 = $('.board'); if (bd1) bd1.style.scrollSnapType = '';
  document.querySelectorAll('.kcol').forEach(c => c.classList.remove('can', 'cannot', 'over'));
  DND.quiet = performance.now() + 300;                   // после перетаскивания клик по карточке не срабатывает
  const col = g.dz ? +g.dz.dataset.dropCol : -1, d = dealById(g.id);
  const drop = !cancel && col >= 0 && col !== d.col;
  const finish = () => { g.ghost.remove(); g.card.classList.remove('dragging'); };
  if (drop) {
    if (checkMove(d, col).ok) { finish(); tryMove(g.id, col, 'drag'); return; }
    tryMove(g.id, col, 'drag');                          // запрет: объяснение тостом, карточка возвращается
  }
  if (reduceMotion() || !g.rect) { finish(); return; }
  const r = g.card.getBoundingClientRect();
  g.ghost.style.transition = 'left .15s ease-out, top .15s ease-out, transform .15s ease-out'; g.ghost.style.left = r.left + 'px'; g.ghost.style.top = r.top + 'px'; g.ghost.style.transform = 'none';
  setTimeout(finish, 160);
}
document.addEventListener('pointerdown', dndDown);
document.addEventListener('contextmenu', e => { if (DND.g) e.preventDefault(); });
document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('.deal')) e.preventDefault(); });
/* клик по карточке открывает панель; клик по «⋯» — меню */
document.addEventListener('click', e => {
  const card = e.target.closest && e.target.closest('.deal[data-deal]');
  if (!card || e.target.closest('.more') || RT.name !== 'deals') return;
  if (performance.now() < DND.quiet) return;
  location.hash = '#/deals/' + card.dataset.deal.toLowerCase();
});

/* ---------- клавиатура: Пробел берёт карточку, ←/→ выбирают этап, Пробел или Enter кладёт, Esc отменяет; Ctrl/⌘+←/→ переносят сразу ---------- */
const KB = {g:null};
function kbMark() {
  const g = KB.g, d = dealById(g.id);
  document.querySelectorAll('.kcol').forEach(c => { const col = +c.dataset.dropCol; c.classList.remove('can', 'cannot', 'over'); if (col === d.col) return; const ok = checkMove(d, col).ok; c.classList.add(ok ? 'can' : 'cannot'); if (col === g.col) c.classList.toggle('over', ok); });
}
function kbEnd() {
  document.querySelectorAll('.kcol').forEach(c => c.classList.remove('can', 'cannot', 'over'));
  const el = document.querySelector('.deal[aria-pressed=true]'); if (el) el.setAttribute('aria-pressed', 'false');
  KB.g = null;
}
function live(msg) { const l = $('#live'); if (l) l.textContent = msg; }
document.addEventListener('keydown', e => {
  if (RT.name !== 'deals') return;
  const card = e.target.closest && e.target.closest('.deal[data-deal]');
  if (!card) return;
  const id = card.dataset.deal, d = dealById(id), dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if ((e.ctrlKey || e.metaKey) && dir) { e.preventDefault(); tryMove(id, d.col + dir, 'key'); return; }
  if (KB.g) {
    if (dir) { e.preventDefault(); KB.g.col = Math.max(0, Math.min(4, KB.g.col + dir)); kbMark(); const chk = checkMove(d, KB.g.col); live(t('dd_kb_to', {n:nm(d.name), c:t('f' + KB.g.col)}) + (chk.ok || KB.g.col === d.col ? '' : ' ' + t(chk.k || 'dd_order'))); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); const to = KB.g.col; kbEnd(); if (to !== d.col) tryMove(id, to, 'key'); else live(t('dd_kb_back', {n:nm(d.name)})); }
    else if (e.key === 'Escape') { e.preventDefault(); kbEnd(); live(t('dd_kb_back', {n:nm(d.name)})); }
    return;
  }
  if (e.key === ' ') { e.preventDefault(); KB.g = {id, col:d.col}; card.setAttribute('aria-pressed', 'true'); kbMark(); live(t('dd_kb_pick', {n:nm(d.name), c:t('f' + d.col)})); }
  else if (e.key === 'Enter') { e.preventDefault(); location.hash = '#/deals/' + id.toLowerCase(); }
});
document.addEventListener('focusout', e => { if (KB.g && e.target.closest && e.target.closest('.deal') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.deal'))) kbEnd(); });

function afterRender() {
  boardShade();
  if (FOCUS_DEAL) { const el = [...document.querySelectorAll('.deal[data-deal="' + FOCUS_DEAL + '"]')].find(x => x.offsetParent !== null); if (el) el.focus({preventScroll:true}); FOCUS_DEAL = null; }
}
VIEWS.deals = vDeals; PANELS.deals = panelDeal;
