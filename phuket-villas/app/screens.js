'use strict';
/* Villa Group: экраны «Сводка», «Лоты», «Моя вилла», «Консьерж», «Комплектация» (спецификация v2, разделы 6.3–6.6, 6.2.6). */

/* заголовок экрана: где есть вкладки подразделов (< 1280), они идут сразу под заголовком, настройки экрана — после них */
function head(title, sub, tools) {
  const st = subTabs(), h = `<div class="ht"><h1>${title}</h1>${sub ? `<p class="hint">${sub}</p>` : ''}</div>`;
  if (st) return `<div class="head tabbed">${h}</div>${st}${tools ? `<div class="tools tools-row">${tools}</div>` : ''}`;
  return `<div class="head">${h}${tools ? `<div class="tools">${tools}</div>` : ''}</div>`;
}
const emptyBox = (icn, msg, btn) => `<div class="empty">${ic(icn || 'search', 'ic big32')}<p>${msg}</p>${btn || ''}</div>`;

/* ===================== 1. СВОДКА ===================== */
function vDash() {
  const o = stats(), per = S.period, cn = DEMO.concStat[per], sh = revenue(per), mix = clientsUsing();
  const dealsCnt = [0, 1, 2, 3, 4].map(c => S.deals.filter(d => d.col === c).length), mx = Math.max.apply(null, dealsCnt);
  const newReq = S.reqs.find(r => r.st === 'new' && !r.perf), fo = fitOrder(), wo = waitingOrders();
  const stgLine = Object.keys(o.stg).sort().map(k => `${t('stg_s' + k)} ${o.stg[k]}`).join(' · ');
  const bars = S.villas.map(v => `<button class="${v.sale === 'res' ? 'reserved' : v.sale}" data-go-lot="${v.id}" aria-label="${t('bar_aria', {id:v.id, p:pct(v.pct)})}"><span style="height:${Math.max(4, v.pct)}%"></span></button>`).join('');
  const nums = S.villas.map(v => `<span>${v.n % 2 || window.innerWidth >= 600 ? String(v.n).padStart(2, '0') : ''}</span>`).join('');
  const over = o.overN ? `<a class="card kpi" href="#/lots/${o.overV}"><span class="cap">${t('k_over')}</span><span class="v err nw">${moneyS(o.over)}</span><span class="sm soft">${t('k_over_s', {n:o.overN, v:o.overV, d:o.overD})}</span></a>`
    : `<div class="card kpi"><span class="cap">${t('k_over')}</span><span class="v">0</span><span class="sm soft">${t('k_over_0')}</span></div>`;
  const total = o.soldSum + o.resSum;
  const sh3 = shares([sh.own, sh.ext, sh.retail]);
  const chan = SHOP.channels.map((c, i) => `<button class="chrow" data-act="goto-ch" data-v="${c}"><i style="background:var(${SHOP.chart[c]})"></i><span class="chn">${t('ch_' + c)}</span><b class="nw">${moneyM(sh[c])}</b></button>`).join('');
  const chbar = `<div class="chbar" role="img" aria-label="${t('t_shop')}">${SHOP.channels.map((c, i) => `<i style="flex:${Math.max(sh[c], 1)};background:var(${SHOP.chart[c]})"></i>`).join('')}</div>`;
  const shopLines = (wo.length ? `<p class="sm tone-warn">${t('s_wait', {n:t('o_n', {n:wo.length}), x:moneyS(waitSum())})}</p>` : '')
    + (fo && fo.st === 'new' ? `<p class="sm tone-info">${t('s_ord', {id:oid(fo.id), n:nm('Ли Мин'), v:'V-07', x:moneyS(orderAmt(fo))})}</p>` : '');
  const shopTile = `<div class="card tile tile-shop"><div class="row between"><h3>${t('t_shop')}</h3></div>
    <p class="big brass nw">${t('s_rev', {x:moneyS(sh.total)})}</p><p class="sm soft">${t('s_vill', {x:moneyS(sh.forVillas)})}</p>${chbar}<div class="chlist">${chan}</div>${shopLines}
    <a class="lnk" href="#/shop/revenue">${t('go_shop')}</a></div>`;
  const concTile = `<div class="card tile"><h3>${t('t_conc')}</h3><div><span class="cap">${t('c_open')}</span><p class="big nw">${openReqs()}</p></div>
    <p class="sm soft">${t('c_per', {n:cn[0], r:moneyS(cn[1]), p:pct(cn[2])})}</p>
    ${newReq ? `<p class="sm tone-warn">${t('c_new', {id:oid(newReq.id), m:'<span class="sla" data-sla="' + newReq.id + '">' + slaLeft(newReq) + '</span>'})}</p>` : ''}
    <a class="lnk" href="#/concierge">${t('go_conc')}</a></div>`;
  const salesTile = `<div class="card tile"><h3>${t('t_sales')}</h3><div class="funnel">${dealsCnt.map((c, i) => `<a class="fun" href="#/deals"><span>${t('f' + i)}</span><i style="width:${Math.max(6, c / mx * 100)}%"></i><b>${c}</b></a>`).join('')}</div><a class="lnk" href="#/deals">${t('go_deals')}</a></div>`;
  const one = `<div class="card tile one3"><h3>${t('one3')}</h3><div class="o3n"><div><b class="kpi-n nw">${t('one3_n', {a:mix.conc, n:mix.n})}</b><span class="sm soft">${t('one3_a')}</span></div><div><b class="kpi-n nw">${t('one3_n', {a:mix.shop, n:mix.n})}</b><span class="sm soft">${t('one3_b')}</span></div></div><p class="sm soft">${t('one3t')}</p></div>`;
  const tools = perSeg() + curSeg();
  return `${head(t('d_title'), t('d_sub'), tools)}
  <div class="dash">
   <div class="grid kpis d-kpi">
    <div class="card kpi"><span class="cap">${t('k_sold')}</span><span class="v">${t('k_sold_v', {a:o.sold, b:S.villas.length})}</span><span class="sm soft">${t('k_sold_s', {r:o.res, f:o.free})}</span></div>
    <div class="card kpi"><span class="cap">${t('k_in')}</span><span class="v brass nw" title="${esc(t('rate'))}">${moneyS(o.paid)}</span><div class="bar brass"><i style="width:${Math.round(o.paid / total * 100)}%"></i></div><span class="sm soft">${t('k_in_s', {x:moneyS(total)})}</span>${S.cur !== 'THB' ? `<span class="xs faint">${t('rate')}</span>` : ''}</div>
    ${over}
    <div class="card kpi"><span class="cap">${t('k_build')}</span><span class="v">${pct(o.avg)}</span><span class="sm soft">${t('k_build_s')}</span></div>
   </div>
   <div class="card d-build"><div class="row between wrap"><h3>${t('b_title')}</h3><div class="legend"><span class="badge b-accent">${t('sold')}</span><span class="badge b-warn">${t('res')}</span><span class="badge b-free">${t('free')}</span></div></div>
    <div class="vb">${bars}</div><div class="vbn">${nums}</div><p class="sm soft">${stgLine}</p></div>
   <div class="d-sales">${salesTile}</div>
   <div class="d-conc">${concTile}</div><div class="d-shop">${shopTile}</div><div class="d-one">${one}</div>
  </div>`;
}
Object.assign(ACT, {
  'goto-ch'(v) { S.ordCh = v; S.ordSt = 'all'; save(); goto('orders'); }
});

/* ===================== 2. ЛОТЫ ===================== */
function lotCard(v) {
  const st = stageOf(v.pct), ty = TYPES[v.type];
  return `<a class="card lot ${RT.id === v.id ? 'sel' : ''}" href="#/lots/${v.id}">
    <span class="l-n n nw">${v.id}</span><span class="l-b">${saleBadge(v)}</span>
    <span class="l-t sm soft">${t('lot_spec', {t:v.type, br:ty.br, m2:ty.m2})}</span><b class="l-p nw">${thb(PRICE[v.type])}</b>
    <span class="l-r"><span class="bar ${v.pct >= 90 ? 'ok' : ''}"><i style="width:${v.pct}%"></i></span><span class="sm soft l-s"><span class="nw">${pct(v.pct)}</span> · <span class="ell">${t('st' + st)}</span></span></span></a>`;
}
function vLots() {
  const f = S.filterLots, c = {all:S.villas.length, free:0, res:0, sold:0};
  S.villas.forEach(v => c[v.sale]++);
  const list = S.villas.filter(v => f === 'all' || v.sale === f);
  const group = (q, a, b) => {
    const vs = list.filter(v => queueOf(v.n) === q);
    return vs.length ? `<h3 class="sec-t">${t('queue_n', {n:q, a:String(a).padStart(2, '0'), b:String(b).padStart(2, '0')})}</h3><div class="lgrid">${vs.map(lotCard).join('')}</div>` : '';
  };
  const body = list.length ? group(1, 1, 8) + group(2, 9, 14) + group(3, 15, 19)
    : emptyBox('search', t('lots_none'), `<button class="btn btn-o" data-act="flt-lots" data-v="all">${t('reset_filter')}</button>`);
  return `${head(t('lots_title', {n:S.villas.length}), t('lots_hint'))}
   <div class="caps">${[['all', t('f_all')], ['free', t('free')], ['res', t('res')], ['sold', t('sold')]].map(x => `<button class="capsule" data-act="flt-lots" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}<i>${c[x[0]]}</i></button>`).join('')}</div>${body}`;
}
function payRows(v, withBtn) {
  return v.pays.map((p, k) => {
    const s = payStatus(v, k);
    return `<div class="pay"><div class="m"><b>${t('pn' + k)}</b><div class="sm soft nw">${money(p.amt)}</div></div>
      <span class="badge b-${s.c}">${s.t}</span>${withBtn && (s.s === 'due' || s.s === 'over') ? `<button class="btn btn-o sm" data-act="pay-open" data-v="${k}">${t('pay_btn')}</button>` : ''}</div>`;
  }).join('');
}
function panelVilla(id) {
  const v = vById(id); if (!v) return '';
  const ty = TYPES[v.type], st = stageOf(v.pct), paid = paidOf(v);
  const dots = [1, 2, 3, 4, 5, 6, 7].map(n => `<i class="${n < st ? 'd' : n === st && v.pct < 100 ? 'c' : n <= st ? 'd' : ''}"></i>`).join('');
  let who;
  if (v.sale === 'free') who = `<div class="card flat"><b>${t('free_title')}</b><p class="sm soft">${t('free_hint')}</p></div>`;
  else who = `<div class="card flat"><span class="cap">${t('buyer_cap')}</span><p><b>${esc(nm(v.buyer))}</b></p><p class="sm soft">${t('mgr_line', {m:esc(nm(v.mgr)), k:t(v.sale === 'res' ? 'k_booking' : 'k_contract'), d:fdate(v.contract || v.pays[0].paid)})}</p></div>
    <div class="card flat"><h3>${t('sched_t')}</h3>${payRows(v, false)}
    <div class="row between ptotal"><span class="soft">${t('paid_lbl')}</span><b class="brass nw">${t('paid_of', {a:thb(paid), b:thb(PRICE[v.type])})}</b></div></div>`;
  const over = v.n === 4 && !S.remind ? `<p class="sm tone-err">${t('lot_over_note', {s:t('pn3'), n:diffDays(TODAY, v.pays[3].due)})}</p>` : '';
  let foot = '';
  if (v.sale === 'free') foot = `<button class="btn btn-p" data-act="book-open" data-v="${v.id}">${t('book_btn')}</button>`;
  else if (v.n === 4) foot = S.remind ? `<button class="btn btn-o" disabled>${t('remind_done')}</button>` : `<button class="btn btn-p" data-act="remind">${t('remind_btn')}</button>`;
  else if (v.n === 7) foot = `<a class="btn btn-p" href="#/villa">${t('open_portal')}</a>`;
  const body = `${photo(DEMO.files.type[v.type], {cls:'r32', w:[800], sizes:'440px', alt:t('alt_type', {t:v.type}), iw:800, ih:533})}<p class="cap">${t('type_vis', {t:v.type})}</p>
   <div class="row wrap">${saleBadge(v)}<span class="sm soft">${t('queue_short', {n:queueOf(v.n)})}</span></div>
   <p>${t('spec_full', {t:v.type, br:ty.br, m2:ty.m2, p:ty.plot})}</p><p class="disp price nw">${thb(PRICE[v.type])}</p>
   <div class="card flat"><span class="cap">${t('pn_cap')}</span><p><b>${pct(v.pct)}</b> · ${t('st' + st)}</p><div class="bar ${v.pct >= 90 ? 'ok' : ''}"><i style="width:${v.pct}%"></i></div><div class="dots">${dots}</div></div>
   ${who}${over}`;
  return panelShell({title:t('dl_villa', {id:v.id}), body, foot, aria:t('panel_aria')});
}
Object.assign(ACT, {
  'flt-lots'(v) { S.filterLots = v; rerender(); },
  remind() { S.remind = true; rerender(); toast(t('remind_toast')); },
  'book-open'(v) { MODAL = {type:'book', id:v}; renderLayer(); }
});
function bookVilla(vid, did) {
  const v = vById(vid), d = dealById(did);
  v.sale = 'res'; v.buyer = d.name; v.mgr = d.mgr; v.pays = genPays(v, v.n - 1); v.pays[0].paid = TODAY; v.pays[0].due = null; v.contract = TODAY; v.dealId = d.id;
  d.col = 3; d.villa = v.n; d.int = v.id; d.days = 0; d.tasks = [false, false]; d.hist.unshift([TODAY, 'h_booked', v.id]);
  MODAL = null; toast(t('toast_booked', {v:vid, n:nm(d.name)}));
}
MODALS.book = m => {
  const leads = S.deals.filter(d => d.col === 1 || d.col === 2), v = vById(m.id);
  return sheet(`<h2>${t('bk_title', {id:v.id})}</h2><p class="sm soft">${t('bk_sub', {p:thb(PRICE[v.type])})}</p><div class="opts">${leads.map(d => `<button class="opt" data-act="book-pick" data-v="${d.id}" data-vid="${v.id}"><span class="t"><b>${esc(nm(d.name))}</b> <span class="sm soft">· ${t('f' + d.col)}</span><br><span class="sm soft">${t('bk_bud', {i:intLabel(d), b:thb(d.bud)})}</span></span>${d.bud >= PRICE[v.type] ? `<span class="badge b-ok">${t('bk_fit')}</span>` : ''}</button>`).join('')}</div><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button>`);
};
Object.assign(ACT, {
  'book-pick'(v, el) { bookVilla(el.dataset.vid, v); rerender(); }
});

/* ===================== 3. МОЯ ВИЛЛА ===================== */
function vVilla() {
  const v = V(7), paid = paidOf(v), tot = PRICE.B, pc = Math.round(paid / tot * 100), st = stageOf(v.pct), ty = TYPES[v.type], sel = S.mile;
  const miles = DEMO.mile.map((m, i) => {
    const n = i + 1, cls = m[0] === 'done' ? 'done' : m[0] === 'cur' ? 'cur' : '';
    const lab = m[0] === 'done' ? t('m_done', {d:fmonthS(m[1])}) : m[0] === 'cur' ? t('m_cur', {d:fmonthS(m[1])}) : t('m_plan', {d:fmonthS(m[1])});
    const ph = DEMO.stagePhotos[i].length && m[0] !== 'plan' ? photo(DEMO.stagePhotos[i][0], {cls:'r43', w:[800], sizes:'132px', alt:t('alt_stage', {n:stageName(n)}), iw:800, ih:600}) : `<span class="ph r43 fail">${ic('img', 'ic ph-ic')}</span>`;
    return `<button class="mile ${cls}" data-act="mile" data-v="${n}" aria-pressed="${sel === n}">${ph}<span class="mn"><span class="c">${n}</span><b class="sm ell2">${stageName(n)}</b></span><span class="xs soft ell">${lab}</span></button>`;
  }).join('');
  const mi = DEMO.mile[sel - 1], files = mi[0] === 'plan' ? [] : DEMO.stagePhotos[sel - 1], nPh = files.length;
  const photos = nPh ? `<div class="pcar" style="--n:${nPh}">${files.map((f, i) => `<button class="phb" data-act="photo" data-v="${i}" aria-label="${t('photo_open', {i:i + 1})}">${photo(f, {cls:'r43', w:[800, 1600], sizes:'(min-width:1024px) 280px, 86vw', alt:t('alt_stage', {n:stageName(sel)}), iw:1600, ih:1200})}</button>`).join('')}</div>
     <p>${t('rp' + Math.min(sel, 3), {d:fshort('2026-10-14')})}</p><p class="sm faint">${t('rep_date', {d:fdate(sel === 3 ? TODAY : mi[1])})}</p><p class="sm tone-ok">${t('rep_ok')}</p>`
    : emptyBox('img', t('rep_none'));
  const docs = DEMO.docs.map(d => ({n:d[0], s:d[1], d:d[2]})).concat(S.receipt ? [{n:'dc6', s:'ds_rec', d:TODAY}] : []);
  const docList = docs.map(d => `<button class="docrow" data-act="doc" data-v="${d.n}">${ic('doc')}<span class="dt"><b class="sm">${t(d.n)}</b><span class="sm faint">${d.d ? fdate(d.d) : '—'}</span></span><span class="badge ${d.s === 'ds_wait' ? 'b-warn' : 'b-ok'}">${t(d.s)}</span></button>`).join('');
  const rent = S.afterMode === 'rent', inc = rentInc(S.occ);
  const after = `<div class="after-ph">${photo(DEMO.files.after[0], {cls:'r32', w:[800], sizes:'(min-width:1024px) 300px, 45vw', alt:t('alt_after1'), iw:800, ih:533})}${photo(DEMO.files.after[1], {cls:'r32', w:[800], sizes:'(min-width:1024px) 300px, 45vw', alt:t('alt_after2'), iw:800, ih:533})}</div>
    <div class="mt-s">${seg('after', [['self', t('af_me')], ['rent', t('af_rent')]], S.afterMode)}</div>
    ${rent ? `<div class="grid afgrid"><div><span class="cap">${t('af_n')}</span><p class="disp nw">${thb(9500)}</p></div><div><span class="cap">${t('af_occ')}</span><p class="disp"><span id="occv">${pct(S.occ)}</span></p></div><div><span class="cap">${t('af_inc')}</span><p class="disp nw"><span id="incv">${thb(inc)}</span></p><span class="sm soft" id="yv">${t('af_y', {p:pct1(inc / tot * 100)})}</span></div></div>
      <input type="range" min="50" max="85" step="1" value="${S.occ}" data-act="occ" aria-label="${t('af_occ')}"><p class="sm soft">${t('af_note', {c:thb(300000)})}</p>`
      : `<p>${t('af_self')}</p><a class="btn btn-o" href="#/concierge/k118">${t('af_go')}</a>`}`;
  return `${head(t('v_h'), t('spec_short', {br:ty.br, m2:ty.m2, p:ty.plot}), `<span class="badge b-info nw">${t('v_hand')}</span>`)}
  <div class="villa2">
   <div class="a-hero hero">${photo(DEMO.files.hero, {cls:'hero-ph', w:[800, 1600], sizes:'(min-width:1440px) 1100px, 100vw', alt:t('alt_hero'), iw:1600, ih:900, eager:true})}<span class="chip">${t('v_vis')}</span></div>
   <div class="card a-ready"><div class="row between wrap"><div><span class="cap">${t('v_ready')}</span><p class="kpi-n">${pct(v.pct)}</p></div><span class="badge b-info">${stageName(st)}</span></div><div class="bar"><i style="width:${v.pct}%"></i></div>
    <div class="miles">${miles}</div></div>
   <div class="card a-report"><h3>${sel}. ${stageName(sel)} · ${t('rep_t')}</h3>${photos}</div>
   <div class="card a-pay"><div class="row between wrap"><h3>${t('pay_t')}</h3>${curSeg()}</div>
     <div class="paysum"><span class="cap">${t('paid_cap')}</span><p class="kpi-n brass nw">${money(paid)}</p>${cnyRow(paid)}<p class="sm soft nw">${t('pay_of', {b:money(tot), p:pct(pc)})}</p></div>
     <div class="bar brass"><i style="width:${pc}%"></i></div><div>${payRows(v, true)}</div></div>
   <div class="card a-docs"><h3>${t('doc_t')}</h3><div>${docList}</div><p class="sm faint">${t('doc_note')}</p></div>
   <div class="card a-after"><h3>${t('af_t')}</h3>${after}</div>
  </div>`;
}
Object.assign(ACT, {
  mile(v) { S.mile = +v; rerender(); },
  photo(v) { MODAL = {type:'photo', stage:S.mile, i:+v}; renderLayer(); },
  'photo-nav'(v) { const n = DEMO.stagePhotos[MODAL.stage - 1].length || 1; MODAL.i = (MODAL.i + +v + n) % n; renderLayer(); },
  'pay-open'(v) { MODAL = {type:'pay', k:+v}; renderLayer(); },
  'pay-do'(v) { V(7).pays[+v].paid = TODAY; S.receipt = true; MODAL = null; rerender(); toast(t('pay_toast')); },
  doc(v) { MODAL = {type:'doc', n:v}; renderLayer(); },
  after(v) { S.afterMode = v; rerender(); }
});
MODALS.pay = m => {
  const p = V(7).pays[m.k];
  return sheet(`<h2>${t('pay_sh', {s:t('pn' + m.k)})}</h2><p class="sm soft">${t('pay_amt')}</p><p class="disp price brass nw">${money(p.amt)}</p>${cnyRow(p.amt)}
   <div class="card flat"><p class="sm">${t('pay_req', {n:m.k + 1})}</p></div>
   <div class="btns"><button class="btn btn-p block" data-act="pay-do" data-v="${m.k}">${t('pay_mark')}</button><button class="btn btn-o block" data-act="close-modal">${t('close')}</button></div>`);
};
MODALS.doc = m => sheet(`<h2>${t(m.n)}</h2><div class="docprev"><span class="cap">${t('doc_demo')}</span><p class="disp mt-s">${t(m.n)}</p><i></i><i style="width:90%"></i><i style="width:96%"></i><i style="width:70%"></i><i style="width:84%"></i></div><button class="btn btn-p block" data-act="close-modal">${t('close')}</button>`);
MODALS.photo = m => {
  const n = DEMO.stagePhotos[m.stage - 1].length || 1;
  return sheet(`<h2>${m.stage}. ${stageName(m.stage)}</h2>${photo(DEMO.stagePhotos[m.stage - 1][m.i], {cls:'r43 big', w:[800, 1600], sizes:'(min-width:768px) 520px, 92vw', alt:t('alt_stage', {n:stageName(m.stage)}), iw:1600, ih:1200})}<p class="sm soft ctr">${t('photo_cap', {i:m.i + 1, n})}</p>
   <div class="row"><button class="ibtn" data-act="photo-nav" data-v="-1" aria-label="${t('photo_prev')}" ${n < 2 ? 'disabled' : ''}>${ic('left')}</button><button class="btn btn-p grow" data-act="close-modal">${t('close')}</button><button class="ibtn" data-act="photo-nav" data-v="1" aria-label="${t('photo_next')}" ${n < 2 ? 'disabled' : ''}>${ic('right')}</button></div>`);
};
document.addEventListener('input', e => {
  if (!e.target.dataset || e.target.dataset.act !== 'occ') return;
  S.occ = +e.target.value; const inc = rentInc(S.occ);
  $('#occv').textContent = pct(S.occ); $('#incv').textContent = thb(inc);
  $('#yv').textContent = t('af_y', {p:pct1(inc / PRICE.B * 100)}); save();
});

/* ===================== 4. КОНСЬЕРЖ ===================== */
const RSTAT = {new:'info', asg:'warn', work:'warn', done:'ok'};
const LN = {ru:'русский', en:'English', zh:'中文', th:'ไทย'};          // названия языков на самих языках
function slaHtml(r) {
  if (r.st !== 'new' || r.perf || r.sla == null) return '';
  const m = slaLeft(r);
  return `<span class="sla ${m === 0 ? 'over' : 'warn'}" data-sla="${r.id}" data-long="${m === 0 ? 0 : 1}">${m > 0 ? t('min_short', {n:m}) : t('sla_breached')}</span>`;
}
const whenOf = r => fshort(r.date) + (r.time ? ', ' + r.time : '');
const perfBadge = p => p.busy ? t(p.g === 'f' ? 'busy_f' : 'busy_m', {t:p.busy}) : p.after ? t('free_after', {t:p.after}) : t('cn_free');
function vConc() {
  const b = bp(), f = S.filterReq, c = {all:S.reqs.length, new:0, asg:0, work:0, done:0};
  S.reqs.forEach(r => c[r.st]++);
  const list = S.reqs.filter(r => f === 'all' || r.st === f);
  const sel = S.reqs.find(r => r.key === RT.id) || null, two = b.side, deskSel = sel || (two ? (list[0] || S.reqs[0]) : null);
  const rows = list.map(r => `<a class="crow" href="${hrefOf('conc', r.key)}" ${deskSel && deskSel.id === r.id ? 'aria-current="true"' : ''}><span class="ico">${ic(r.ic)}</span><span class="ct"><b class="sm ell">${t(r.rt)}</b><span class="sm soft ell">${esc(nm(r.who))} · ${r.villa} · ${whenOf(r)}</span></span><span class="cr"><span class="badge b-${RSTAT[r.st]}">${t('rs_' + r.st)}</span>${slaHtml(r)}</span></a>`).join('')
    || emptyBox('search', t('cn_none'), `<button class="btn btn-o" data-act="flt-req" data-v="all">${t('reset_filter')}</button>`);
  const showList = two || !sel, showDet = two || !!sel;
  return `${head(t('cn_title'), t('cn_hint', {id:oid('K-118')}))}
   <div class="caps">${['all', 'new', 'asg', 'work', 'done'].map(x => `<button class="capsule" data-act="flt-req" data-v="${x}" aria-pressed="${f === x}">${t('rf_' + x)}<i>${c[x]}</i></button>`).join('')}</div>
   <div class="split2 ${b.x2 ? 'three' : ''}">${showList ? `<div class="card clist">${rows}</div>` : ''}${showDet && deskSel ? reqDetail(deskSel, b.x2) : ''}${showDet && deskSel && b.x2 ? reqAside(deskSel) : ''}</div>`;
}
function reqDetail(r, x2) {
  const order = ['new', 'asg', 'work', 'done'], ix = order.indexOf(r.st), p = DEMO.perf.find(x => x.id === r.perf);
  const rl = S.readLang;
  const msgs = r.msgs.map(m => {
    if (m.from === 's') return `<div class="msg s">${esc(t(m.sk, m.sv.n ? {n:nm(m.sv.n)} : {s:t('rs_' + m.sv.s)}))}</div>`;
    const orig = m.o !== rl && !m.pending, shown = m.pending ? m.o : rl;
    return `<div class="msg ${m.from}"><div class="who">${m.from === 'o' ? esc(nm(r.who)) + ' · ' + t('cn_owner') : t('cn_disp')}</div><span ${shown === 'zh' ? 'lang="zh"' : shown === 'th' ? 'lang="th"' : ''}>${esc(chatTxt(m.k, shown))}</span>${m.pending ? `<q>${t('cn_trans')}</q>` : orig ? `<q>${t('cn_orig', {l:t('ln_' + m.o), x:esc(chatTxt(m.k, m.o))})}</q>` : ''}</div>`;
  }).join('');
  const nextBtn = r.st === 'asg' ? `<button class="btn btn-p" data-act="next-status">${t('cn_start')}</button>` : r.st === 'work' ? `<button class="btn btn-p" data-act="next-status">${t('cn_finish')}</button>` : '';
  const left = slaHtml(r) ? (slaLeft(r) > 0 ? '· ' + t('cn_left', {x:slaHtml(r)}) : '· ' + slaHtml(r)) : '';
  const assignBtn = !r.perf && !x2 ? `<button class="btn btn-p" data-act="assign-open">${t('cn_assign')}</button>` : '';
  return `<div class="card cdet"><a class="back-m lnk" href="#/concierge">${ic('left', 'ic sm16')}${t('cn_back')}</a>
   <div class="row between wrap"><h3>${t(r.rt)}</h3><span class="badge b-${RSTAT[r.st]}">${t('rs_' + r.st)}</span></div>
   <p class="sm soft">${esc(nm(r.who))} · ${r.villa} · ${whenOf(r)}${r.flight ? ' · ' + t('cn_flight', {x:t('fl_arr', {n:r.flight.no, t:r.flight.t})}) : ''}</p>
   ${stepper(order.map(n => t('rs_' + n)), ix)}
   <div class="row between wrap"><span class="sm">${p ? t('cn_perf', {n:'<b>' + nm(p.n) + '</b>', r:t('pr_' + p.role)}) : t('cn_noperf')} ${left}</span>
    <span class="row">${assignBtn}${nextBtn}</span></div>
   <hr class="hr">
   <div class="row between wrap"><span class="cap">${t('cn_read')}</span>${seg('read', [['ru', 'RU'], ['en', 'EN'], ['zh', 'ZH'], ['th', 'TH']], rl, 'sm')}</div>
   <div class="chat">${msgs}</div>
   <div class="quick">${[0, 1, 2].map(i => `<button class="btn btn-o" data-act="quick" data-v="${i}"><span>${chatTxt('q' + i, LANG)}</span>${ic('send', 'ic sm16')}</button>`).join('')}</div>
   <div class="fake-inp" aria-disabled="true">${t('cn_demo_inp')}</div>
   <p class="sm faint">${t('cn_ai')}</p></div>`;
}
function reqAside(r) {
  const p = DEMO.perf.find(x => x.id === r.perf);
  return `<aside class="card caside" aria-label="${t('cn_info')}"><h3>${t('cn_info')}</h3>${kv([
    [t('cn_owner_c'), esc(nm(r.who))], [t('cn_villa_c'), r.villa], [t('cn_lang_c'), t('ln_' + r.ol)],
    [t('cn_flight_c'), r.flight ? t('fl_arr', {n:r.flight.no, t:r.flight.t}) : '—'], [t('cn_perf_c'), p ? nm(p.n) : t('cn_noperf')]])}
   ${!r.perf ? `<button class="btn btn-p" data-act="assign-open">${t('cn_assign')}</button>` : ''}</aside>`;
}
function curReq() { return S.reqs.find(r => r.key === RT.id) || S.reqs[0]; }
Object.assign(ACT, {
  'flt-req'(v) { S.filterReq = v; rerender(); },
  read(v) { S.readLang = v; rerender(); },
  'assign-open'() { MODAL = {type:'assign', id:curReq().id}; renderLayer(); },
  'assign-pick'(v) { const r = curReq(), p = DEMO.perf.find(x => x.id === v); r.perf = v; r.st = 'asg'; r.msgs.push({from:'s', sk:'cn_assigned', sv:{n:p.n}}); MODAL = null; rerender(); toast(t('cn_assigned', {n:nm(p.n)})); },
  'next-status'() { const r = curReq(); r.st = r.st === 'asg' ? 'work' : 'done'; r.msgs.push({from:'s', sk:'cn_status', sv:{s:r.st}}); rerender(); },
  quick(v) { const r = curReq(), m = {from:'d', o:'ru', k:'q' + v, pending:true}; r.msgs.push(m); rerender(); setTimeout(() => { m.pending = false; save(); if (RT.name === 'conc') rerender(); }, 600); }
});
MODALS.assign = m => sheet(`<h2>${t('cn_assign_t')}</h2><p class="sm soft">${t('cn_assign_s', {id:oid(m.id)})}</p><div class="opts">${DEMO.perf.map(p => `<button class="opt" data-act="assign-pick" data-v="${p.id}" ${p.busy ? 'disabled' : ''}><span class="t"><b>${nm(p.n)}</b> · <span class="sm soft">${t('pr_' + p.role)}</span><br><span class="sm soft">${p.lang}</span></span><span class="badge ${p.busy ? 'b-warn' : 'b-ok'}">${perfBadge(p)}</span></button>`).join('')}</div><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button>`);

/* ===================== 5. КОМПЛЕКТАЦИЯ (бывшая «Отделка») ===================== */
const fitVarKey = (i, j) => 'fv_' + i + '_' + j;
function availShort(c) {
  const a = availOf(c);
  if (a.k === 'stock') return {k:'ok', t:t('av_stock')};
  if (a.k === 'low') return {k:'warn', t:t('av_low_q', {q:unit(a.a, PROD[c].unit)})};
  if (a.k === 'transit') return {k:'info', t:t('av_transit', {d:fshort(a.date)})};
  return {k:'info', t:a.date ? t('av_order_d', {d:fshort(a.date)}) : t('av_order')};
}
function vFit() {
  const sur = fitSur(), allSame = S.fit.every(x => x === S.fit[0]), pk = allSame ? S.fit[0] : -1, fo = fitOrder(), b = bp();
  const pos = FIT.map((p, i) => `<section class="card pos"><div class="pos-h"><h3>${t(p.n)}</h3><p class="sm soft">${t(fitVarKey(i, S.fit[i]))}</p></div><div class="vars">${p.sku.map((sku, j) => {
    const ex = p.extra[j], av = sku ? availShort(sku) : null;
    return `<button class="var" data-act="fitsel" data-p="${i}" data-v="${j}" aria-pressed="${S.fit[i] === j}">
     <span class="ck">${ic('check', 'ic')}</span>${sku ? photo(PROD[sku].img, {cls:'r11', w:[400, 800], sizes:'144px', alt:t('sku_' + sku), iw:800, ih:800}) : `<span class="ph r11 fail">${ic('nosofa', 'ic ph-ic')}</span>`}
     <span class="vt">${t(fitVarKey(i, j))}</span><b class="vp nw">${ex ? '+' + thb(ex) : t('fit_incl')}</b>${av ? `<span class="vs tone-${av.k}">${av.t}</span>` : '<span class="vs"></span>'}</button>`;
  }).join('')}</div></section>`).join('');
  const lines = FIT.map((p, i) => S.fit[i] ? `<div class="row between sm eline"><span class="ell">${t(fitVarKey(i, S.fit[i]))}</span><b class="nw">+${thb(p.extra[S.fit[i]])}</b></div>` : '').join('') || `<p class="sm soft">${t('est_all')}</p>`;
  const canEdit = !fo || fo.st === 'new';
  let btn;
  if (fo && !canEdit) btn = `<button class="btn btn-p block" disabled>${t('ord_upd')}</button><p class="sm faint ctr">${t('ord_locked')}</p>`;
  else if (fo) btn = sur ? `<button class="btn btn-p block" data-act="order-go">${t('ord_upd')}</button>` : `<button class="btn btn-o block" data-act="order-cancel">${t('ord_cancel')}</button>`;
  else btn = `<button class="btn btn-p block" data-act="order-go" ${sur ? '' : 'disabled'}>${t('ord_go')}</button>${sur ? '' : `<p class="sm faint ctr">${t('est_all')}</p>`}`;
  const est = `<div class="card est"><span class="cap">${t('est_t')}</span><div>${lines}</div><div class="row between etot"><span class="soft">${t('est_sur')}</span><b class="brass nw">${sur ? '+' + thb(sur) : thb(0)}</b></div>
    <p class="sm soft">${t('est_deliv')}</p>${btn}</div>`;
  let banner = '';
  if (fo) {
    const wd = fo.st === 'waiting' ? waitDate(fo) : null;
    const catg = wd ? t('catg_' + (PROD[wd.items[0][0]].cat)) : '';
    const txt = fo.st === 'new' ? t('ob_new', {id:oid(fo.id)}) : fo.st === 'waiting' ? t('ob_wait', {id:oid(fo.id), c:catg, d:wd ? fshort(wd.date) : ''}) : t('ob_' + fo.st, {id:oid(fo.id)});
    banner = `<div class="card banner"><b>${txt}</b><a class="lnk" href="${hrefOf('orders', fo.id)}">${t('ord_open_shop')} ${ic('right', 'ic sm16')}</a></div>`;
  }
  const bar = `<div class="estbar"><div class="eb"><span class="cap">${t('est_sur')}</span><b class="brass nw">${sur ? '+' + thb(sur) : t('est_in_price')}</b></div>${fo ? (sur && canEdit ? `<button class="btn btn-p" data-act="order-go">${t('ord_upd')}</button>` : canEdit ? `<button class="btn btn-o" data-act="order-cancel">${t('ord_cancel')}</button>` : `<button class="btn btn-p" disabled>${t('ord_upd')}</button>`) : `<button class="btn btn-p" data-act="order-go" ${sur ? '' : 'disabled'}>${t('ord_go')}</button>`}</div>`;
  return `${head(t('fit_title'), t('fit_hint'), seg('pkg', [['0', t('pk0')], ['1', t('pk1')], ['2', t('pk2')]], String(pk)) + (pk < 0 ? `<span class="badge b-accent">${t('pk_own')}</span>` : ''))}
   ${banner}<div class="fit2"><div class="poslist">${pos}</div><div class="estbox">${est}</div></div>${bar}`;
}
Object.assign(ACT, {
  pkg(v) { S.fit = FIT.map(() => +v); rerender(); },
  fitsel(v, el) { S.fit[+el.dataset.p] = +v; rerender(); },
  'order-go'() { const upd = !!fitOrder(); fitOrderSave(); MODAL = {type:'fitorder', upd}; rerender(); },
  'order-cancel'() { const o = fitOrder(); releaseNeeds(o); S.shop.orders = S.shop.orders.filter(x => x !== o); rerender(); toast(t('ord_withdrawn', {id:oid(o.id)})); }
});
MODALS.fitorder = m => {
  const o = fitOrder(); if (!o) return '';
  return sheet(`<h2>${t(m.upd ? 'ord_updated' : 'ord_created', {id:oid(o.id)})}</h2><p class="sm soft">${t('ord_wait', {m:nm('Чен Ю.')})}</p>
   <div>${o.lines.map(l => `<div class="row between sm eline"><span class="ell">${t(fitVarKey(l.fit, l.j))}</span><b class="nw">+${thb(l.amt)}</b></div>`).join('')}</div>
   <div class="row between etot"><span>${t('ord_total')}</span><b class="brass nw">+${thb(orderAmt(o))}</b></div><p class="sm soft">${t('ord_note')}</p>
   <div class="btns"><button class="btn btn-p block" data-act="close-modal">${t('ord_done')}</button><a class="btn btn-t block" href="${hrefOf('orders', o.id)}" data-act="close-modal">${t('ord_open_shop')} ${ic('right', 'ic sm16')}</a></div>`);
};

VIEWS.dash = vDash; VIEWS.lots = vLots; VIEWS.villa = vVilla; VIEWS.conc = vConc; VIEWS.fit = vFit;
PANELS.lots = panelVilla;
