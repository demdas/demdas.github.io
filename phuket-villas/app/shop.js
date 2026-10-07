'use strict';
/* Villa Group: модуль «Магазин» (спецификация v2, раздел 6.2): каталог, заказы, поставки, выручка. Данные и расчёты — в data.js и core.js. */

const ORD_STEPS = ['new', 'confirmed', 'waiting', 'ready', 'delivered'];
const OSTAT = {new:'b-info', confirmed:'b-free', waiting:'b-warn', ready:'b-accent', delivered:'b-ok'};
const SSTAT = {ordered:'b-free', transit:'b-info', customs:'b-warn', received:'b-ok'};
const SKU_NAME = c => t('sku_' + c);
const discount = p => Math.round((1 - p.partner / p.retail) * 100);
const availBadge = c => {
  const a = availOf(c), p = PROD[c];
  if (a.k === 'stock') return {c:'b-ok', t:t('av_stock_q', {q:unit(a.a, p.unit)})};
  if (a.k === 'low') return {c:'b-warn', t:t('av_low_q', {q:unit(a.a, p.unit)})};
  if (a.k === 'transit') return {c:'b-info', t:t('av_transit', {d:fshort(a.date)})};
  return {c:'b-info', t:a.date ? t('av_order_d', {d:fshort(a.date)}) : t('av_order')};
};
/* человекочитаемый клиент заказа */
function clientName(o) {
  const c = o.c;
  if (c.k === 'own') return t('ch_own') + ' · ' + c.villa;
  if (c.k === 'dev') return nm(c.n) + ' (' + t('cl_dev') + ')';
  if (c.k === 'contr') return nm(c.n) + ' (' + t('cl_contr') + ')';
  if (c.k === 'show') return t('ch_retail') + ' · ' + t('cl_show');
  return nm(c.n) + ' · ' + (c.villa || t('cl_' + c.note));
}
function lineName(l) { return l.fit != null ? t('fv_' + l.fit + '_' + l.j) : l.kit ? t('kit_' + l.kit) : SKU_NAME(l.sku); }
function lineQty(l) { return l.sku ? unit(l.qty, PROD[l.sku].unit) : '1'; }
function composition(o) {
  const l = o.lines[0], extra = o.lines.length - 1;
  return `<span class="cpn">${lineName(l)} × ${lineQty(l)}</span>` + (extra > 0 ? `<span class="cpm faint nw">${t('o_more', {n:extra})}</span>` : '');
}
const priceName = o => t('pt_' + o.price);
const waitCell = o => { if (o.st !== 'waiting') return '—'; const w = waitDate(o); return w ? `<span class="nw">${fshort(w.date)}, ${oid(w.id)}</span>` : '—'; };

/* ===================== Каталог ===================== */
function matchProd(p) { return (S.cat === 'all' || p.cat === S.cat) && S.av[availOf(p.code).k]; }
const defFilter = () => S.cat === 'all' && Object.values(S.av).every(Boolean);
function filterPane(b) {
  const cc = catCount(), ac = availCount();
  const cats = ['all'].concat(SHOP.cats).map(c => `<button class="frow" role="radio" aria-checked="${S.cat === c}" data-act="cat" data-v="${c}"><i class="rd"></i><span class="ell">${c === 'all' ? t('f_all') : t('cat_' + c)}</span><b>${cc[c]}</b></button>`).join('');
  const avs = ['stock', 'low', 'order', 'transit'].map(a => `<button class="frow" role="checkbox" aria-checked="${S.av[a]}" data-act="av" data-v="${a}"><i class="cb">${ic('check', 'ic')}</i><span class="ell">${t('avf_' + a)}</span><b>${ac[a]}</b></button>`).join('');
  return `<h3 class="cap">${t('flt_cat')}</h3><div role="radiogroup" aria-label="${t('flt_cat')}">${cats}</div><h3 class="cap">${t('flt_av')}</h3><div>${avs}</div>${defFilter() ? '' : `<button class="btn btn-t" data-act="flt-reset">${t('flt_reset')}</button>`}`;
}
function vShop() {
  const b = bp(), list = SHOP.products.filter(matchProd), cc = catCount();
  const pv = S.priceView;
  const card = p => {
    const big = pv === 'retail' ? p.retail : p.partner, sm = pv === 'retail' ? `<span class="nw">${t('pc_p', {x:thb(p.partner)})}</span><span class="nw disc">${t('pc_d', {d:discount(p)})}</span>` : `<span class="nw">${t('pc_retail', {x:thb(p.retail)})}</span>`, ab = availBadge(p.code);
    return `<a class="card pcard ${RT.id === p.code ? 'sel' : ''}" href="${hrefOf('shop', p.code)}" aria-label="${esc(SKU_NAME(p.code))}">${photo(p.img, {cls:'r11', w:[400, 800], sizes:'(min-width:1280px) 214px, 45vw', alt:SKU_NAME(p.code), iw:800, ih:800})}
     <span class="cap pcat">${t('cat_' + p.cat)}</span><span class="pname" title="${esc(SKU_NAME(p.code))}">${SKU_NAME(p.code)}</span>
     <span class="pprice"><b class="nw">${thb(big)}</b><span class="xs faint nw">/ ${t('u_' + p.unit, {n:1})}</span></span><span class="pp xs soft">${sm}</span><span class="badge ${ab.c}">${ab.t}</span></a>`;
  };
  const grid = list.length ? `<div class="pgrid">${list.map(card).join('')}</div>` : emptyBox('search', t('cat_none'), `<button class="btn btn-o" data-act="flt-reset">${t('flt_reset')}</button>`);
  const top = !b.menu ? `<div class="catbar"><div class="caps">${['all'].concat(SHOP.cats).map(c => `<button class="capsule" data-act="cat" data-v="${c}" aria-pressed="${S.cat === c}">${c === 'all' ? t('f_all') : t('cat_' + c)}<i>${cc[c]}</i></button>`).join('')}</div>
     <button class="btn btn-o sm avbtn" data-act="av-open" aria-haspopup="true">${ic('filter', 'ic sm16')}${t('flt_av')}${ic('chev', 'ic sm16')}</button></div>` : '';
  const tools = `<span class="cap">${t('pc_price')}</span>${seg('pview', [['retail', t('pt_retail')], ['partner', t('pt_partner')]], pv, 'sm')}`;
  return `${head(t('cat_title'), t('cat_sub', {n:SHOP.products.length, x:moneyS(stockValue('retail'), 'THB')}), tools)}${top}
   ${b.menu ? `<div class="catlay"><aside class="card filters">${filterPane(b)}</aside><div>${grid}</div></div>` : grid}`;
}
function panelSku(code) {
  const p = PROD[code]; if (!p) return '';
  const i = inv(code), a = availOf(code), sup = S.shop.sup.filter(s => s.st !== 'received' && s.items.some(x => x[0] === code));
  const transit = sup.filter(s => s.st !== 'ordered')[0], ordered = sup.filter(s => s.st === 'ordered')[0];
  const ords = S.shop.orders.filter(o => o.lines.some(l => l.sku === code)).slice(0, 3);
  const incoming = transit ? `<span class="nw">${unit(transit.items.find(x => x[0] === code)[1], p.unit)}, <a class="lnk-i" href="#/shop/supplies">${oid(transit.id)}</a>, ${fshort(transit.date)}</span>` : '—';
  const stockRows = [[t('sk_stock'), `<span class="nw">${unit(i.s, p.unit)}</span>`], [t('sk_res'), `<span class="nw">${unit(i.r, p.unit)}</span>`], [t('sk_avail'), `<b class="nw">${unit(Math.max(0, i.s - i.r), p.unit)}</b>`], [t('sk_transit'), incoming]];
  if (a.a <= 0 && !transit) stockRows.push([t('sk_order'), ordered ? t('sk_order_s', {q:unit(ordered.items.find(x => x[0] === code)[1], p.unit), id:oid(ordered.id), d:fshort(ordered.date)}) : t('sk_order_w', {n:6})]);
  const body = `${photo(p.img, {cls:'r11 skuph', w:[400, 800], sizes:'360px', alt:SKU_NAME(code), iw:800, ih:800})}
   ${blk(t('sk_prices'), kv([[t('pt_retail'), `<span class="nw">${thb(p.retail)} / ${t('u_' + p.unit, {n:1})}</span>`], [t('pt_partner'), `<span class="nw">${thb(p.partner)} / ${t('u_' + p.unit, {n:1})}</span>`], [t('sk_disc'), `<span class="nw">−${discount(p)} %</span>`]]))}
   ${blk(t('sk_stockb'), kv(stockRows))}
   ${blk(t('sk_orders'), ords.length ? `<div class="olist">${ords.map(o => `<a class="orow" href="${hrefOf('orders', o.id)}"><b class="nw">${oid(o.id)}</b><span class="ell">${esc(clientName(o))}</span><span class="nw">${lineQty(o.lines.find(l => l.sku === code))}</span><span class="badge ${OSTAT[o.st]}">${t('os_' + o.st)}</span></a>`).join('')}</div>` : `<p class="sm faint">${t('sk_orders_none')}</p>`)}`;
  return panelShell({title:SKU_NAME(code), sub:`<span class="sm faint">${code}</span>`, body, foot:`<span></span><button class="btn btn-p" data-act="nw-open" data-v="${code}">${t('sk_to_order')}</button>`, aria:SKU_NAME(code)});
}
const nwStep = code => ['m2', 'lm'].includes(PROD[code].unit) ? 10 : 1;
const nwMax = code => { const k = availOf(code).k; return k === 'stock' || k === 'low' ? availQ(code) : Infinity; };
MODALS.neworder = m => {
  const p = PROD[m.code], cl = SHOP.clients.find(c => c.id === m.client), max = nwMax(m.code), unitP = p[cl.price], tot = m.qty * unitP, wait = m.qty > availQ(m.code);
  const rows = SHOP.clients.map(c => `<button class="opt" role="radio" aria-checked="${m.client === c.id}" data-act="nw-client" data-v="${c.id}"><i class="rd"></i><span class="t"><b>${esc(clientName({c:c.c}))}</b></span><span class="sm soft nw">${t('pt_' + c.price)} · ${thb(p[c.price])}</span></button>`).join('');
  return sheet(`<h2>${t('nw_title')}</h2><p class="sm soft">${SKU_NAME(m.code)} · ${m.code}</p><h3 class="cap">${t('nw_client')}</h3><div class="opts" role="radiogroup">${rows}</div>
   <h3 class="cap">${t('nw_qty')}</h3><div class="qty"><button class="ibtn" data-act="nw-q" data-v="-1" aria-label="${t('nw_minus')}" ${m.qty <= 1 ? 'disabled' : ''}>${ic('minus')}</button><input id="nwq" type="number" inputmode="numeric" min="1" ${max < Infinity ? `max="${max}"` : ''} step="${nwStep(m.code)}" value="${m.qty}" aria-label="${t('nw_qty')}" data-act="nwq"><span class="faint">${t('u_' + p.unit, {n:1})}</span><button class="ibtn" data-act="nw-q" data-v="1" aria-label="${t('nw_plus')}" ${m.qty >= max ? 'disabled' : ''}>${ic('plus')}</button></div>
   ${max < Infinity ? `<p class="sm faint">${t('nw_max', {q:unit(max, p.unit)})}</p>` : `<p class="sm tone-info">${t('nw_wait')}</p>`}
   <div class="row between etot"><span class="soft">${t('nw_total')}</span><b class="nw tot17" id="nwtot">${thb(tot)}</b></div>
   <div class="btns"><button class="btn btn-p block" data-act="nw-create">${t('nw_create')}</button><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button></div>`);
};
/* ввод с клавиатуры: только состояние и сумма, без перерисовки листа (иначе клик по «Создать заказ» после ввода терялся) */
function nwTyped(el, final) {
  const m = MODAL, p = PROD[m.code], cl = SHOP.clients.find(c => c.id === m.client), max = nwMax(m.code);
  m.qty = Math.max(1, Math.min(max, Math.round(+el.value) || 1));
  const tot = $('#nwtot'); if (tot) tot.textContent = thb(m.qty * p[cl.price]);
  const mi = document.querySelector('[data-act=nw-q][data-v="-1"]'), pl = document.querySelector('[data-act=nw-q][data-v="1"]');
  if (mi) mi.disabled = m.qty <= 1; if (pl) pl.disabled = m.qty >= max;
  if (final) el.value = m.qty;
}
function nwSet(q) {
  const m = MODAL, max = nwMax(m.code); q = Math.max(1, Math.min(max, Math.round(q) || 1)); m.qty = q; renderLayer();
}
Object.assign(ACT, {
  cat(v) { S.cat = v; rerender(); },
  av(v) { S.av[v] = !S.av[v]; rerender(); },
  'flt-reset'() { S.cat = 'all'; S.av = {stock:true, low:true, order:true, transit:true}; rerender(); },
  pview(v) { S.priceView = v; rerender(); },
  'av-open'(v, el) {
    if (bp().phone) { MODAL = {type:'avail'}; renderLayer(); return; }
    POP = {rect:el.getBoundingClientRect(), w:260, make:() => { const ac = availCount(); return ['stock', 'low', 'order', 'transit'].map(a => `<button class="frow" role="menuitemcheckbox" aria-checked="${S.av[a]}" data-act="av" data-v="${a}"><i class="cb">${ic('check', 'ic')}</i><span class="ell">${t('avf_' + a)}</span><b>${ac[a]}</b></button>`).join(''); }};
    OPEN_DD = null; chrome(); renderLayer();
  },
  'nw-open'(v) { const st = nwStep(v); MODAL = {type:'neworder', code:v, client:'own', qty:st}; renderLayer(); },
  'nw-client'(v) { MODAL.client = v; renderLayer(); },
  'nw-q'(v) { nwSet(MODAL.qty + +v * nwStep(MODAL.code)); },
  'nw-create'() {
    const m = MODAL, cl = SHOP.clients.find(c => c.id === m.client), o = orderCreate(cl, m.code, m.qty); MODAL = null; rerender(); toast(t('nw_toast', {id:oid(o.id)}));
  }
});
MODALS.avail = () => { const ac = availCount(); return sheet(`<h2>${t('flt_av')}</h2><div>${['stock', 'low', 'order', 'transit'].map(a => `<button class="frow" role="checkbox" aria-checked="${S.av[a]}" data-act="av" data-v="${a}"><i class="cb">${ic('check', 'ic')}</i><span class="ell">${t('avf_' + a)}</span><b>${ac[a]}</b></button>`).join('')}</div><button class="btn btn-p block" data-act="close-modal">${t('close')}</button>`); };
document.addEventListener('change', e => { if (e.target.id === 'nwq' && MODAL && MODAL.type === 'neworder') nwTyped(e.target, true); });
document.addEventListener('input', e => { if (e.target.id === 'nwq' && MODAL && MODAL.type === 'neworder') nwTyped(e.target, false); });

/* ===================== Заказы ===================== */
function ordersVis() {
  return S.shop.orders.filter(o => (S.ordCh === 'all' || o.ch === S.ordCh) && (S.ordSt === 'all' || (S.ordSt === 'active' ? orderOpen(o) : !orderOpen(o))))
    .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1));
}
function vOrders() {
  const b = bp(), all = S.shop.orders, list = ordersVis(), rv = {cnt:all.length, total:sumBy(all, orderAmt)};
  const cnt = {all:all.length}; SHOP.channels.forEach(c => { cnt[c] = all.filter(o => o.ch === c).length; });
  const tabs = `<div class="caps">${['all'].concat(SHOP.channels).map(c => `<button class="capsule" data-act="ord-ch" data-v="${c}" aria-pressed="${S.ordCh === c}">${c === 'all' ? t('f_all') : t('ch_' + c)}<i>${cnt[c]}</i></button>`).join('')}</div>`;
  const stSeg = seg('ord-st', [['all', t('f_all')], ['active', t('os_active')], ['done', t('os_done')]], S.ordSt, 'sm');
  let body;
  if (!list.length) body = emptyBox('search', t('ord_none'), `<button class="btn btn-o" data-act="ord-reset">${t('reset_filter')}</button>`);
  else if (b.side) {
    const wide = b.w >= 1880;
    body = `<div class="tw"><table class="tbl otbl"><thead><tr><th class="c-no">${t('oc_no')}</th><th class="c-date">${t('oc_date')}</th><th>${t('oc_client')}</th><th>${t('oc_comp')}</th><th class="num c-sum">${t('oc_sum')}</th><th class="c-price">${t('oc_price')}</th><th class="c-st">${t('oc_status')}</th><th class="c-due">${t('oc_due')}</th>${wide ? `<th class="c-mgr">${t('oc_mgr')}</th>` : ''}</tr></thead><tbody>${list.map(o => `<tr tabindex="0" data-act="order-open" data-v="${normId(o.id)}" class="${RT.id === normId(o.id) ? 'sel' : ''}"><td class="c-no"><b class="nw">${oid(o.id)}</b></td><td class="c-date nw">${fshort(o.date)}</td>
      <td><div class="cl ell" title="${esc(clientName(o))}">${esc(clientName(o))}</div><span class="chcap">${t('ch_' + o.ch)}</span></td><td><div class="cp">${composition(o)}</div></td><td class="num c-sum"><b class="nw">${thb(orderAmt(o))}</b></td><td class="c-price xs faint">${priceName(o)}</td>
      <td class="c-st"><span class="badge ${OSTAT[o.st]}">${t('os_' + o.st)}</span></td><td class="c-due sm">${waitCell(o)}</td>${wide ? `<td class="c-mgr sm">${esc(nm(o.mgr))}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  } else body = `<div class="ocards">${list.map(o => `<a class="card ocard ${RT.id === normId(o.id) ? 'sel' : ''}" href="${hrefOf('orders', o.id)}"><span class="o1"><b class="nw">${oid(o.id)}</b><span class="badge ${OSTAT[o.st]}">${t('os_' + o.st)}</span></span>
      <span class="o2 sm ell">${esc(clientName(o))}${o.c.k === 'own' || o.c.k === 'show' ? '' : ' · ' + t('ch_' + o.ch)}</span><span class="o3 sm soft cp">${composition(o)}</span><span class="o4"><span class="sm faint nw">${fshort(o.date)}</span><b class="nw">${thb(orderAmt(o))}</b></span></a>`).join('')}</div>`;
  return `${head(t('ord_title'), t('ord_sub', {n:t('o_n', {n:rv.cnt}), x:thb(rv.total)}), b.phone ? '' : stSeg)}${tabs}${b.phone ? `<div class="stwrap">${stSeg}</div>` : ''}${body}`;
}
function panelOrder(key) {
  const o = orderByKey(key); if (!o) return '';
  const w = o.st === 'waiting' ? waitDate(o) : null, ix = ORD_STEPS.indexOf(o.st);
  const lines = o.lines.map(l => `<div class="oline">${l.sku ? photo(PROD[l.sku].img, {cls:'r11 th40', w:[400], sizes:'40px', alt:lineName(l), iw:400, ih:400}) : `<span class="ph r11 th40 fail">${ic('pkg', 'ic ph-ic')}</span>`}<span class="ln"><span class="sm ell2">${lineName(l)}</span><span class="xs faint nw">${l.fit != null ? t('pt_fit') : lineQty(l) + (l.sku ? ' × ' + thb(PROD[l.sku][o.price]) : '')}</span></span><b class="nw">${l.fit != null ? '+' : ''}${thb(l.amt)}</b></div>`).join('');
  const villaLink = o.c.villa && !o.c.villa.includes(',') ? `<a class="lnk-i" href="#/lots/${o.c.villa}">${t('o_villa_link', {id:o.c.villa})} ${ic('right', 'ic sm12')}</a>` : o.c.villa ? esc(o.c.villa) : '—';
  const info = kv([[t('oc_client'), esc(clientName(o))], [t('oc_ch'), t('ch_' + o.ch)], [t('oc_price'), priceName(o)], [t('oc_mgr'), esc(nm(o.mgr))], [t('oc_villa'), villaLink]]);
  const plaque = w ? `<div class="plaque">${ic('clock', 'ic')}<span>${t('o_wait_p', {id:oid(w.id), s:esc(nm(w.supplier)), d:fshort(w.date)})} <a class="lnk-i" href="#/shop/supplies">${t('o_wait_link')}</a></span></div>` : '';
  const hist = o.hist.slice().reverse().map(h => `<li><span class="sm faint nw">${fshort(h[0])}</span><span>${t('oh_' + h[1])}</span></li>`).join('');
  const body = `${stepper(ORD_STEPS.map(s => t('os_' + s)), ix)}${plaque}${blk(t('o_info'), info)}${blk(t('o_lines'), `<div class="olines">${lines}</div><div class="row between etot"><span>${t('o_total')}</span><b class="brass nw tot17">${thb(orderAmt(o))}</b></div>`)}${blk(t('dp_hist'), `<ul class="hist">${hist}</ul>`)}`;
  const nxt = {new:['oa_confirm', 'confirm'], confirmed:['oa_ready', 'ready'], ready:['oa_ship', 'ship']}[o.st];
  const foot = nxt ? `<span></span><button class="btn btn-p" data-act="ord-do" data-v="${nxt[1]}" data-id="${o.id}">${t(nxt[0])}</button>` : o.st === 'waiting' ? `<p class="sm soft">${t('oa_wait')}</p>` : '';
  return panelShell({title:oid(o.id), badge:`<span class="badge ${OSTAT[o.st]}">${t('os_' + o.st)}</span>`, body, foot, aria:t('o_panel')});
}
Object.assign(ACT, {
  'ord-ch'(v) { S.ordCh = v; rerender(); },
  'ord-st'(v) { S.ordSt = v; rerender(); },
  'ord-reset'() { S.ordCh = 'all'; S.ordSt = 'all'; rerender(); },
  'order-open'(v) { location.hash = '#/shop/orders/' + v; },
  'ord-do'(v, el) {
    const o = orderById(el.dataset.id);
    if (v === 'confirm') orderConfirm(o); else if (v === 'ready') orderReady(o); else orderShip(o);
    rerender(); toast(t('os_toast', {id:oid(o.id), s:t('os_' + o.st)}));
  }
});
document.addEventListener('keydown', e => { const tr = e.target.closest && e.target.closest('tr[data-act=order-open]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ACT['order-open'](tr.dataset.v); } });

/* ===================== Поставки ===================== */
function supComp(s) { return s.items.map(i => `${SKU_NAME(i[0])} × ${unit(i[1], PROD[i[0]].unit)}`).join(', '); }
const supFor2 = s => s.for.length ? s.for.map(id => `<a class="lnk-i nw" href="${hrefOf('orders', id)}">${oid(id)}</a>`).join(', ') + ' + ' + t('sp_stock') : t('sp_stock');
const supDate = s => s.st === 'received' ? t('sp_got', {d:fshort(s.rec)}) : fshort(s.date);
function vSupplies() {
  const b = bp(), list = S.shop.sup, open = list.filter(s => s.st !== 'received').length;
  const act = s => s.st === 'transit' || s.st === 'customs' ? `<button class="btn btn-o sm" data-act="rc-open" data-v="${s.id}">${t('sp_accept')}</button>` : s.st === 'ordered' ? `<span class="sm faint nw">${t('sp_expected', {d:fshort(s.date)})}</span>` : '';
  const body = b.side ? `<div class="tw"><table class="tbl stbl"><thead><tr><th class="c-no">${t('oc_no')}</th><th>${t('sp_supplier')}</th><th>${t('oc_comp')}</th><th class="c-st">${t('oc_status')}</th><th class="c-date2">${t('oc_date')}</th><th>${t('sp_for')}</th><th class="c-act"></th></tr></thead><tbody>${list.map(s => `<tr><td class="c-no"><b class="nw">${oid(s.id)}</b></td><td><div class="ell">${esc(nm(s.supplier))}</div></td><td><div class="ell">${supComp(s)}</div></td><td class="c-st"><span class="badge ${SSTAT[s.st]}">${t('ss_' + s.st)}</span></td><td class="c-date2 nw">${supDate(s)}</td><td class="sm">${supFor2(s)}</td><td class="c-act">${act(s)}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="ocards">${list.map(s => `<div class="card ocard sup"><span class="o1"><b class="nw">${oid(s.id)}</b><span class="badge ${SSTAT[s.st]}">${t('ss_' + s.st)}</span></span><span class="o2 sm ell">${esc(nm(s.supplier))}</span><span class="o3 sm soft ell">${supComp(s)}</span><span class="o4"><span class="sm faint nw">${supDate(s)}</span>${act(s)}</span></div>`).join('')}</div>`;
  return `${head(t('sp_title'), t('sp_sub', {n:open, d:fshort(S.shop.stockUpd)}))}${body}`;
}
MODALS.receive = m => {
  const s = supOf(m.id);
  return sheet(`<h2>${t('rc_title', {id:oid(s.id)})}</h2><p>${supComp(s)}</p><p class="sm soft">${esc(nm(s.supplier))}</p><div class="btns"><button class="btn btn-p block" data-act="rc-do" data-v="${s.id}">${t('rc_yes')}</button><button class="btn btn-o block" data-act="close-modal">${t('cancel')}</button></div>`);
};
Object.assign(ACT, {
  'rc-open'(v) { MODAL = {type:'receive', id:v}; renderLayer(); },
  'rc-do'(v) { supplyReceive(v); MODAL = null; rerender(); toast(t('rc_toast', {id:oid(v)})); }
});

/* ===================== Выручка ===================== */
function vRevenue() {
  const per = S.period, r = revenue(per), cats = revenueCats(), wo = waitingOrders(), sh = shares([r.own, r.ext, r.retail]);
  const kpi = [[t('rv_rev'), moneyS(r.total), 'brass', ''], [t('rv_orders'), String(r.cnt), '', ''], [t('rv_avg'), moneyS(r.cnt ? r.total / r.cnt : 0), '', ''], [t('rv_wait'), moneyS(waitSum()), '', t('o_n', {n:wo.length})]];
  const chbar = `<div class="chbar big" role="img" aria-label="${t('rv_ch')}">${SHOP.channels.map(c => `<i style="flex:${Math.max(r[c], 1)};background:var(${SHOP.chart[c]})"></i>`).join('')}</div>`;
  const rows = SHOP.channels.map((c, i) => `<button class="chrow big" data-act="goto-ch" data-v="${c}"><i style="background:var(${SHOP.chart[c]})"></i><span class="chn">${t('ch_' + c)}</span><b class="nw">${moneyM(r[c])}</b><span class="sm soft nw sh">${nf(sh[i], {minimumFractionDigits:1, maximumFractionDigits:1})} %</span><span class="sm faint nw ocount">${t('o_n', {n:r.n[c]})}</span></button>`).join('');
  const mx = Math.max.apply(null, SHOP.cats.map(c => cats[c]));
  const catRows = SHOP.cats.slice().sort((a, b) => cats[b] - cats[a]).map(c => `<div class="cbar"><span class="sm cl">${t('cat_' + c)}</span><span class="bt"><i style="width:${Math.max(2, cats[c] / mx * 100)}%"></i></span><b class="nw sm">${thb(cats[c])}</b></div>`).join('');
  return `${head(t('rv_title'), t('rv_note'), perSeg() + curSeg())}
   <div class="grid kpis rkpi">${kpi.map(k => `<div class="card kpi"><span class="cap">${k[0]}</span><span class="v nw ${k[2]}">${k[1]}</span>${k[3] ? `<span class="sm soft">${k[3]}</span>` : ''}</div>`).join('')}</div>
   <div class="rgrid"><div class="card rch"><h3>${t('rv_ch')}</h3>${chbar}<div class="chlist">${rows}</div><div class="row between etot"><span class="sm soft">${t('rv_villas')}</span><b class="brass nw">${moneyS(r.forVillas)}</b></div></div>
   <div class="card rcat"><h3>${t('rv_cat')}</h3><p class="sm faint">${t('rv_cat_note')}</p><div class="cbars">${catRows}</div></div></div>`;
}

VIEWS.shop = vShop; VIEWS.orders = vOrders; VIEWS.supplies = vSupplies; VIEWS.revenue = vRevenue;
PANELS.shop = panelSku; PANELS.orders = panelOrder;
