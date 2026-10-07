'use strict';
/*
 * Villa Group: ядро прототипа. Форматы (Intl), состояние, расчёты, магазин (остатки, заказы, поставки, выручка),
 * иконки, фото с запасным вариантом, каркас (шапка, меню, рельс, нижняя панель), панели, окна, тосты, обработка событий.
 * Экраны — в screens.js, deals.js, shop.js; запуск — в main.js. Тексты интерфейса — только в i18n.js, цвета — только токены styles.css.
 */

/* ===================== i18n и форматы ===================== */
const I18N = window.VG_I18N, D = I18N.dict, LANGS = I18N.langs;
const LOC = {ru:'ru-RU', en:'en-GB', zh:'zh-CN'};
const LANG_NAME = {ru:'Русский', en:'English', zh:'中文'}, LANG_SHORT = {ru:'RU', en:'EN', zh:'中文'};
const HTML_LANG = {ru:'ru', en:'en', zh:'zh-Hans'};
let LANG = (function () { const l = document.documentElement.lang; return l === 'zh-Hans' || l === 'zh' ? 'zh' : LANGS.includes(l) ? l : 'ru'; })();
const LI = () => LANGS.indexOf(LANG);
const warned = {};
function t(k, v) {
  const e = D[k];
  if (!e) { if (!warned[k]) { warned[k] = 1; console.warn('i18n: нет ключа ' + k); } return k; }
  let s = e[LI()];
  if (s == null || s === '') s = e[0];
  if (s && typeof s === 'object') s = s[new Intl.PluralRules(LOC[LANG]).select(v && v.n)] || s.other;
  if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => x in v ? v[x] : m);
  return /[VMPKМПК]-\d/.test(s) ? s.replace(/\b([VMPKМПК])-(\d)/g, '$1\u2060-\u2060$2') : s;     // номера не рвутся по дефису
}
const chatTxt = (k, l) => (I18N.chat[k] && (I18N.chat[k][l] || I18N.chat[k].ru)) || k;
/* имена людей и компаний: RU — как в данных; EN и ZH — латиницей (иероглифы для имён не придумываем) */
const nm = n => LANG === 'ru' || !I18N.names[n] ? n : I18N.names[n];
/* номера документов: в RU первая буква кириллическая (М-2041, П-118, К-118), в EN и ZH латинская */
const oid = id => LANG === 'ru' ? id.replace(/^M/, 'М').replace(/^P/, 'П').replace(/^K/, 'К') : id;
const nf = (n, o) => new Intl.NumberFormat(LOC[LANG], o).format(n);
const pct = n => nf(n / 100, {style:'percent', maximumFractionDigits:0});
const pct1 = n => nf(n / 100, {style:'percent', minimumFractionDigits:1, maximumFractionDigits:1});
const NB = ' ';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const pd = s => new Date(s + 'T00:00:00');
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((pd(a) - pd(b)) / 864e5);
const MON = {
  ru:['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'],
  ruFull:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
  en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};
const P2 = n => String(n).padStart(2, '0');
function fdate(s) {                                    // 15.11.2026 · 15 Nov 2026 · 2026年11月15日
  const d = pd(s), y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
  return LANG === 'zh' ? `${y}年${m + 1}月${dd}日` : LANG === 'en' ? `${dd} ${MON.en[m]} ${y}` : `${P2(dd)}.${P2(m + 1)}.${y}`;
}
function fshort(s) {                                   // 24.10 · 24 Oct · 10月24日
  const d = pd(s), m = d.getMonth(), dd = d.getDate();
  return LANG === 'zh' ? `${m + 1}月${dd}日` : LANG === 'en' ? `${dd} ${MON.en[m]}` : `${P2(dd)}.${P2(m + 1)}`;
}
function fmonth(s) {                                   // март 2027 · Mar 2027 · 2027年3月
  const d = pd(s), y = d.getFullYear(), m = d.getMonth();
  return LANG === 'zh' ? `${y}年${m + 1}月` : LANG === 'en' ? `${MON.en[m]} ${y}` : `${MON.ruFull[m]} ${y}`;
}
function fmonthS(s) {                                  // фев 2027 · Feb 2027 · 2027年2月
  const d = pd(s), y = d.getFullYear(), m = d.getMonth();
  return LANG === 'zh' ? `${y}年${m + 1}月` : LANG === 'en' ? `${MON.en[m]} ${y}` : `${MON.ru[m]} ${y}`;
}
const fday = fshort;
const fdays = n => t('days_short', {n});
const unit = (n, u) => nf(n) + NB + t('u_' + u, {n});       // 150 м² · 6 шт.

/* ===================== состояние ===================== */
const TODAY = DEMO.today, PRICE = DEMO.price, TYPES = DEMO.types;
const stageOf = p => p >= 100 ? 7 : p >= 90 ? 6 : p >= 65 ? 5 : p >= 50 ? 4 : p >= 20 ? 3 : p >= 5 ? 2 : 1;
function genPays(v, i) {
  const P = PRICE[v.type], pays = [];
  const bron = addDays('2025-06-10', i * 11), contr = addDays(bron, 8);
  for (let k = 0; k < 6; k++) {
    const amt = k === 0 ? 500000 : k === 1 ? Math.round(P * 0.3) - 500000 : Math.round(P * DEMO.payPct[k]);
    let paid = null, due = null;
    if (v.sale === 'sold') {
      if (k === 0) paid = bron; else if (k === 1) paid = contr;
      else if (v.pct >= DEMO.payThr[k]) paid = addDays(contr, 55 * (k - 1));
      if (paid && paid > '2026-10-01') paid = '2026-09-' + String(10 + k);
    } else if (k === 0) paid = '2026-09-' + String(18 + (i % 9));
    if (!paid && k >= 2) due = addDays(TODAY, Math.round((DEMO.payThr[k] - v.pct) / 0.08));
    if (!paid && k === 1) due = addDays(TODAY, 21);
    pays.push({amt, paid, due});
  }
  if (v.n === 7) { pays[0].paid = '2026-03-12'; pays[1].paid = '2026-03-20'; pays[2].paid = '2026-07-28'; pays[3].due = '2026-11-15'; pays[4].due = '2027-03-15'; pays[5].due = '2027-09-15'; }
  if (v.n === 4) { pays[3].paid = null; pays[3].due = addDays(TODAY, -9); pays[3].od = true; }
  v.contract = pays[1].paid || pays[0].paid || null;
  return pays;
}
function seedVillas() {
  return DEMO.villas.map((r, i) => {
    const n = i + 1, v = {n, id:'V-' + String(n).padStart(2, '0'), type:r[0], sale:r[1], pct:r[2], buyer:null, mgr:null, pays:[], dealId:null};
    if (DEMO.buyers[n]) { v.buyer = DEMO.buyers[n][0]; v.mgr = DEMO.buyers[n][1]; }
    if (r[1] !== 'free') v.pays = genPays(v, i);
    return v;
  });
}
function seedDeals() {
  return DEMO.deals.map(r => {
    const d = {id:r[0], name:r[1], src:r[2], int:r[3], bud:r[4], mgr:r[5], days:r[6], col:r[7], villa:r[8], lang:r[9], msg:r[10], handle:r[11], tasks:[false, false], hist:[]};
    d.hist = [[addDays(TODAY, -d.days - 6), 'h_new', d.src], [addDays(TODAY, -d.days - 2), 'h_call', null], [addDays(TODAY, -d.days), 'h_stage', d.col]];
    if (d.col === 4) d.tasks = [true, false];
    return d;
  });
}
const seedReqs = () => DEMO.reqs.map(r => Object.assign({}, r, {key:r.id.replace('K-', 'k'), msgs:r.msgs.map(m => ({from:m[0], o:m[1], k:m[2]}))}));

/* магазин: остатки, поставки, заказы */
function seedShop() {
  const inv = {};
  SHOP.products.forEach(p => { inv[p.code] = {s:p.stock, r:p.res}; });
  const SUPFOR = {'P-118':['M-2032'], 'P-121':['M-2034']};
  const sup = SHOP.supplies.map(s => ({id:s.id, supplier:s.supplier, items:s.items.map(x => x.slice()), st:s.st, date:s.date, rec:s.st === 'received' ? s.date : null, for:(SUPFOR[s.id] || []).slice()}));
  const orders = SHOP.orders.map(r => {
    const price = r[4], st = r[6], lines = [], needs = [], reserved = st === 'confirmed' || st === 'ready';
    r[5].forEach(l => {
      if (Array.isArray(l)) { lines.push({sku:l[0], qty:l[1], amt:l[1] * PROD[l[0]][price]}); needs.push({sku:l[0], qty:l[1], got:reserved ? l[1] : 0}); }
      else { lines.push({kit:l.kit, qty:1, amt:l.amt}); l.needs.forEach(n => needs.push({sku:n[0], qty:n[1], got:0})); }
    });
    const hist = [[r[1], 'created']];
    if (st !== 'new') hist.push([addDays(r[1], 1), 'confirmed']);
    if (st === 'waiting') hist.push([addDays(r[1], 1), 'waiting']);
    if (st === 'ready' || st === 'delivered') hist.push([addDays(r[1], 3), 'ready']);
    if (st === 'delivered') hist.push([addDays(r[1], 5) > TODAY ? TODAY : addDays(r[1], 5), 'delivered']);
    return {id:r[0], date:r[1], c:r[2], ch:r[3], price, lines, needs, st, mgr:r[7], wait:r[8] || [], hist, dyn:false};
  });
  return {inv, sup, orders, next:2042, stockUpd:SHOP.stockUpdated};
}
function freshState() {
  return {role:'partner', cur:'THB', period:'m', villas:seedVillas(), deals:seedDeals(), reqs:seedReqs(), shop:seedShop(),
    filterLots:'all', filterReq:'all', readLang:LANG, fit:[0,0,0,0,0,0], mile:3, afterMode:'self', occ:68,
    remind:false, dealTab:0, dealMgr:'all', receipt:false,
    cat:'all', av:{stock:true, low:true, order:true, transit:true}, priceView:'retail', ordCh:'all', ordSt:'all',
    t0:Date.now()};                  // отсчёт SLA заявки K-118: с первого открытия демо или с «Сбросить демо»
}
const SKEY = 'vg-proto-v4';
let S = loadState();
function loadState() { try { const j = sessionStorage.getItem(SKEY); if (j) return JSON.parse(j); } catch (e) { /* пусто */ } return freshState(); }
function save() { try { sessionStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { /* пусто */ } }
const V = n => S.villas[n - 1];
const vById = id => S.villas.find(v => v.id === id);
const dealById = id => S.deals.find(d => d.id === id);
const sumBy = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/* ===================== деньги ===================== */
/* mode: 'full' (28 500 000 ฿), 'short' (28,5 млн ฿; до 10 млн два знака; меньше миллиона — тыс.), 'mln' (всегда млн: 0,98 млн ฿), 'kb' (канбан: от 100 млн целые) */
function money(thb, cur, mode) {
  cur = cur || S.cur; mode = mode || 'full';
  const v = thb * DEMO.rate[cur], sym = DEMO.sym[cur], a = Math.abs(v);
  if (mode === 'full') { const n = nf(Math.round(v)); return LANG === 'ru' ? n + NB + sym : sym + n; }
  if (LANG === 'zh') {
    if (a >= 1e8) return sym + nf(v / 1e8, {maximumFractionDigits:2}) + '\u2060亿';
    const w = v / 1e4; return sym + nf(w, {maximumFractionDigits:Math.abs(w) >= 1000 ? 0 : 1, useGrouping:false}) + '\u2060万';
  }
  const big = a >= 1e6 || mode === 'mln', n = big ? v / 1e6 : v / 1e3;
  const d = !big ? 0 : mode === 'kb' ? (a >= 1e8 ? 0 : 1) : (a < 1e7 ? 2 : 1);
  const s = nf(n, {maximumFractionDigits:d});
  if (LANG === 'ru') return s + NB + (big ? 'млн' : 'тыс.') + NB + sym;
  return sym + s + (big ? 'M' : 'K');
}
const thb = n => money(n, 'THB');
const moneyS = (n, c) => money(n, c, 'short');
const moneyM = (n, c) => money(n, c, 'mln');
/* второй ряд суммы в юанях для китайского интерфейса */
const cnyRow = n => LANG === 'zh' && S.cur === 'THB' ? `<span class="sub nw">≈ ${money(n, 'CNY')}</span>` : '';
/* доли в десятых процента методом наибольшего остатка: сумма ровно 100,0 */
function shares(vals) {
  const tot = sumBy(vals, x => x) || 1, raw = vals.map(x => x / tot * 1000), fl = raw.map(Math.floor);
  let left = 1000 - sumBy(fl, x => x);
  raw.map((x, i) => [x - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(p => { if (left > 0) { fl[p[1]]++; left--; } });
  return fl.map(x => x / 10);
}

/* ===================== расчёты по виллам, платежам, консьержу ===================== */
function payStatus(v, k) {
  const p = v.pays[k];
  if (p.paid) return {c:'ok', t:p.paid === TODAY ? t('ps_today') : t('ps_paid', {d:fdate(p.paid)}), s:'paid'};
  if (p.od || (p.due && p.due < TODAY)) return {c:'err', t:t('ps_over', {n:diffDays(TODAY, p.due)}), s:'over'};
  if (p.due && diffDays(p.due, TODAY) <= 60) return {c:'warn', t:t('ps_due', {d:fdate(p.due)}), s:'due'};
  return {c:'free', t:t('ps_plan', {d:p.due ? fmonth(p.due) : '—'}), s:'plan'};
}
const paidOf = v => v.pays.reduce((s, p) => s + (p.paid ? p.amt : 0), 0);
function stats() {
  const vs = S.villas, o = {sold:0, res:0, free:0, soldSum:0, resSum:0, paid:0, over:0, overN:0, overD:0, pct:0, stg:{}};
  vs.forEach(v => {
    o[v.sale]++; if (v.sale === 'sold') o.soldSum += PRICE[v.type]; if (v.sale === 'res') o.resSum += PRICE[v.type];
    o.paid += paidOf(v); o.pct += v.pct;
    v.pays.forEach((p, k) => { const s = payStatus(v, k); if (s.s === 'over') { o.over += p.amt; o.overN++; o.overD = Math.max(o.overD, diffDays(TODAY, p.due)); o.overV = v.id; } });
    const st = stageOf(v.pct); o.stg[st] = (o.stg[st] || 0) + 1;
  });
  o.avg = Math.round(o.pct / vs.length);
  return o;
}
const openReqs = () => S.reqs.filter(r => r.st !== 'done').length;
const slaLeft = r => Math.max(0, r.sla - Math.floor((Date.now() - S.t0) / 60000));
const dealAmt = d => d.col >= 3 && d.villa ? PRICE[V(d.villa).type] : d.bud;
const rentInc = occ => Math.round(9500 * 365 * occ / 100 * 0.75 - 300000);

/* ===================== магазин: остатки, заказы, поставки, выручка ===================== */
const inv = c => S.shop.inv[c];
const availQ = c => inv(c).s - inv(c).r;
const supOf = id => S.shop.sup.find(s => s.id === id);
const supFor = c => S.shop.sup.filter(s => s.st !== 'received' && s.items.some(i => i[0] === c)).sort((a, b) => a.date < b.date ? -1 : 1)[0] || null;
/* статус наличия позиции: stock · low · order · transit */
function availOf(c) {
  const p = PROD[c], a = availQ(c);
  if (a > 0) return {k:a > p.min ? 'stock' : 'low', a};
  const s = supFor(c);
  if (s && s.st !== 'ordered') return {k:'transit', a:0, s, date:s.date};
  return {k:'order', a:0, s, date:s ? s.date : null};
}
const orderAmt = o => sumBy(o.lines, l => l.amt);
const shopOrders = () => S.shop.orders;
const orderById = id => S.shop.orders.find(o => o.id === id);
const orderOpen = o => o.st !== 'delivered';
const waitingOrders = () => S.shop.orders.filter(o => o.st === 'waiting');
const waitDate = o => o.wait.map(id => supOf(id)).filter(Boolean).sort((a, b) => a.date < b.date ? 1 : -1)[0] || null;   // ограничивает самая поздняя поставка
function stockValue(price) { return sumBy(SHOP.products, p => inv(p.code).s * p[price]); }
const reservedValue = () => sumBy(SHOP.products, p => inv(p.code).r * p.retail);
const catCount = () => { const o = {all:SHOP.products.length}; SHOP.cats.forEach(c => { o[c] = SHOP.products.filter(p => p.cat === c).length; }); return o; };
function availCount() { const o = {stock:0, low:0, order:0, transit:0}; SHOP.products.forEach(p => { o[availOf(p.code).k]++; }); return o; }
function histAdd(o, type) { o.hist.push([TODAY, type]); }
function orderConfirm(o) {
  const w = new Set(); let short = false;
  o.needs.forEach(n => {
    const take = Math.min(Math.max(0, availQ(n.sku)), n.qty - n.got); inv(n.sku).r += take; n.got += take;
    if (n.got < n.qty) { short = true; const s = supFor(n.sku); if (s) w.add(s.id); }
  });
  histAdd(o, 'confirmed');
  if (short) { o.st = 'waiting'; o.wait = [...w]; o.wait.forEach(id => { const sp = supOf(id); if (!sp.for.includes(o.id)) sp.for.push(o.id); }); histAdd(o, 'waiting'); } else { o.st = 'confirmed'; o.wait = []; }
}
function orderReady(o) { o.st = 'ready'; histAdd(o, 'ready'); }
function orderShip(o) {
  o.needs.forEach(n => { const i = inv(n.sku); i.s = Math.max(0, i.s - n.qty); i.r = Math.max(0, i.r - n.got); });
  o.st = 'delivered'; histAdd(o, 'delivered');
}
function supplyReceive(id) {
  const s = supOf(id);
  s.items.forEach(i => { inv(i[0]).s += i[1]; });
  s.st = 'received'; s.rec = TODAY; S.shop.stockUpd = TODAY;
  waitingOrders().forEach(o => {
    const w = new Set(); let short = false;
    o.needs.forEach(n => {
      if (n.got < n.qty) { const take = Math.min(Math.max(0, availQ(n.sku)), n.qty - n.got); inv(n.sku).r += take; n.got += take; }
      if (n.got < n.qty) { short = true; const sp = supFor(n.sku); if (sp) w.add(sp.id); }
    });
    o.wait = [...w]; o.wait.forEach(id => { const sp = supOf(id); if (!sp.for.includes(o.id)) sp.for.push(o.id); });
    if (!short) { o.st = 'ready'; histAdd(o, 'ready'); }
  });
}
/* «Новый» заказ резервирует остаток сразу (модель склад / резерв / доступно); недостающее ждёт поставку при подтверждении */
function reserveNeeds(o) { o.needs.forEach(n => { const take = Math.min(Math.max(0, availQ(n.sku)), n.qty - n.got); inv(n.sku).r += take; n.got += take; }); }
function releaseNeeds(o) { o.needs.forEach(n => { const i = inv(n.sku); i.r = Math.max(0, i.r - n.got); n.got = 0; }); }
function orderCreate(cl, code, qty) {
  const p = PROD[code], id = 'M-' + (S.shop.next++);
  const o = {id, date:TODAY, c:cl.c, ch:cl.ch, price:cl.price, lines:[{sku:code, qty, amt:qty * p[cl.price]}], needs:[{sku:code, qty, got:0}], st:'new',
    mgr:cl.ch === 'retail' ? 'Елена М.' : SHOP.shopMgr, wait:[], hist:[[TODAY, 'created']], dyn:true};
  S.shop.orders.unshift(o); reserveNeeds(o); return o;
}
/* заказ из «Комплектации»: М-2041, канал «Розница», цена «доплата к базовой» */
const fitOrder = () => orderById('M-2041');
const orderByKey = k => S.shop.orders.find(o => normId(o.id) === k);
const fitSur = () => S.fit.reduce((s, j, i) => s + FIT[i].extra[j], 0);
function fitLines() {
  const lines = [], needs = [];
  S.fit.forEach((j, i) => { if (j > 0) { lines.push({fit:i, j, qty:1, amt:FIT[i].extra[j]}); if (FIT[i].sku[j]) needs.push({sku:FIT[i].sku[j], qty:1, got:0}); } });
  return {lines, needs};
}
function fitOrderSave() {
  const f = fitLines(); let o = fitOrder();
  if (o) { releaseNeeds(o); o.lines = f.lines; o.needs = f.needs; reserveNeeds(o); return o; }
  o = {id:'M-2041', date:TODAY, c:{k:'person', n:'Ли Мин', villa:'V-07'}, ch:'retail', price:'fit', lines:f.lines, needs:f.needs, st:'new', mgr:'Чен Ю.', wait:[], hist:[[TODAY, 'created']], dyn:true};
  S.shop.orders.unshift(o); reserveNeeds(o); return o;
}
/* выручка по каналам за период: 30 дней — из списка заказов, квартал и год — агрегаты + заказы, созданные в демо */
function revenue(per) {
  const r = {own:0, ext:0, retail:0, hill:0, n:{own:0, ext:0, retail:0}};
  const add = o => { if (o.st === 'new') return; r[o.ch] += orderAmt(o); r.n[o.ch]++; if (o.ch === 'retail' && o.c.villa) r.hill += orderAmt(o); };
  if (per === 'm') S.shop.orders.forEach(add);
  else { const a = SHOP.agg[per]; r.own = a.own; r.ext = a.ext; r.retail = a.retail; r.hill = a.hill; r.n = {own:a.n[0], ext:a.n[1], retail:a.n[2]}; S.shop.orders.filter(o => o.dyn).forEach(add); }
  r.total = r.own + r.ext + r.retail; r.cnt = r.n.own + r.n.ext + r.n.retail; r.forVillas = r.own + r.hill;
  return r;
}
function revenueCats() {
  const o = {}; SHOP.cats.forEach(c => { o[c] = 0; });
  S.shop.orders.filter(ord => ord.st !== 'new').forEach(ord => ord.lines.forEach(l => { o[l.fit != null ? FIT[l.fit].cat : l.kit ? 'furn' : PROD[l.sku].cat] += l.amt; }));
  return o;
}
const waitSum = () => sumBy(waitingOrders(), orderAmt);
function clientsUsing() {
  const sold = S.villas.filter(v => v.sale === 'sold').length;
  const shopSet = new Set(SHOP.buyersQuarter);
  S.shop.orders.forEach(o => { if (o.c.k === 'person' && o.c.villa) shopSet.add(o.c.n); });
  return {n:sold, conc:DEMO.buyersConc.length, shop:shopSet.size};
}

/* ===================== иконки (Lucide, штрих 1.75) ===================== */
const ICO = {
 dash:'<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
 sales:'<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
 villa:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 conc:'<path d="M3 20a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1Z"/><path d="M20 16a8 8 0 1 0-16 0"/><path d="M12 4v4"/><path d="M10 4h4"/>',
 shop:'<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
 lots:'<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>',
 deals:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
 fit:'<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/>',
 catalog:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
 orders:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
 supplies:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
 revenue:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 system:'<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
 check:'<path d="M20 6 9 17l-5-5"/>', chev:'<path d="m6 9 6 6 6-6"/>', x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 img:'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
 send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
 plus:'<path d="M5 12h14"/><path d="M12 5v14"/>', minus:'<path d="M5 12h14"/>',
 right:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', left:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
 plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
 brush:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
 key:'<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
 sim:'<path d="M20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L20 7.5Z"/><path d="M8 14h8v4H8z"/>',
 food:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
 doc:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
 reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
 pkg:'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
 filter:'<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
 nosofa:'<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="m3 3 18 18"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', link:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
 user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};
const ic = (n, c) => `<svg class="${c || 'ic'}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ''}</svg>`;

/* ===================== фото: слоты, запасной вариант ===================== */
/* Файлы лежат в site/phuket-villas/img/ (слот-ширина.webp), их поставляет исследователь. Пока файла нет, блок показывает подложку с иконкой.
   Слот с пустым путём в data.js (кадр не принят) сразу показывает заглушку без запроса. Слот, который один раз не загрузился, больше не запрашивается (нет шума в консоли и лишних запросов). */
const IMG_DIR = '../img/', IMG_FAIL = new Set();
function photo(slot, o) {
  o = o || {};
  const ws = o.w || [800, 1600], cls = 'ph ' + (o.cls || ''), icn = ic(o.icon || 'img', 'ic ph-ic');
  if (!slot || IMG_FAIL.has(slot)) return `<span class="${cls} fail">${icn}</span>`;
  const set = ws.map(w => `${IMG_DIR}${slot}-${w}.webp ${w}w`).join(', ');
  return `<span class="${cls}">${icn}<img src="${IMG_DIR}${slot}-${ws[0]}.webp" srcset="${set}" sizes="${o.sizes || '100vw'}" alt="${esc(o.alt || '')}" width="${o.iw || 800}" height="${o.ih || 600}" data-slot="${slot}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></span>`;
}
document.addEventListener('error', e => {
  const im = e.target;
  if (im && im.tagName === 'IMG' && im.dataset && im.dataset.slot) { IMG_FAIL.add(im.dataset.slot); const p = im.parentNode; im.remove(); if (p) p.classList.add('fail'); }
}, true);

/* ===================== маршруты и каркас ===================== */
const SECTIONS = [
  {k:'dash', ic:'dash', names:['dash'], to:'dashboard'}, {k:'sales', ic:'sales', names:['lots', 'deals'], to:'lots'}, {k:'villa', ic:'villa', names:['villa', 'fit'], to:'villa'},
  {k:'conc', ic:'conc', names:['conc'], to:'concierge'}, {k:'shop', ic:'shop', names:['shop', 'orders', 'supplies', 'revenue'], to:'shop'}
];
const PATH = {dash:'dashboard', lots:'lots', deals:'deals', villa:'villa', fit:'fitout', conc:'concierge', shop:'shop', orders:'shop/orders', supplies:'shop/supplies', revenue:'shop/revenue'};
const SUBTABS = {sales:['lots', 'deals'], villa:['villa', 'fit'], shop:['shop', 'orders', 'supplies', 'revenue']};
const NAV_KEY = {dash:'nav_dash', lots:'nav_lots', deals:'nav_deals', villa:'nav_villa', fit:'nav_fit', conc:'nav_conc', shop:'nav_catalog', orders:'nav_orders', supplies:'nav_supplies', revenue:'nav_revenue'};
const ROLES = {partner:{start:'dash'}, sales:{start:'deals'}, buyer:{start:'villa'}, conc:{start:'conc'}, shop:{start:'orders'}};
const WIDE = {work:['lots', 'deals', 'shop', 'orders', 'supplies'], over:['dash', 'revenue'], read:['villa', 'fit'], dlg:['conc']};
const pageKind = n => Object.keys(WIDE).find(k => WIDE[k].includes(n)) || 'over';
let RT = {name:'dash', id:null}, OPEN_DD = null, POP = null;
/* hash: #/shop/orders/m2041 — идентификаторы в адресе только латиницей в нижнем регистре; кириллическую М, К, П понимаем тоже */
const normId = s => String(s || '').toLowerCase().replace(/м/g, 'm').replace(/к/g, 'k').replace(/п/g, 'p').replace(/[^a-z0-9]/g, '');
function parseHash() {
  const h = (location.hash || '').replace(/^#\/?/, '').split('/').map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  const id = h[1] || null;
  switch (h[0]) {
    case 'dashboard': return {name:'dash', id:null};
    case 'lots': return {name:'lots', id:id && id.toUpperCase()};
    case 'deals': return {name:'deals', id:id && id.toUpperCase()};
    case 'villa': return {name:'villa', id:null};
    case 'fitout': return {name:'fit', id:null};
    case 'concierge': return {name:'conc', id:id && normId(id)};
    case 'shop':
      if (!h[1] || h[1] === 'catalog') return {name:'shop', id:h[2] ? h[2].toUpperCase() : null};
      if (h[1] === 'orders') return {name:'orders', id:h[2] ? normId(h[2]) : null};
      if (h[1] === 'supplies') return {name:'supplies', id:null};
      if (h[1] === 'revenue') return {name:'revenue', id:null};
  }
  return null;
}
function hrefOf(name, id) {
  if (!id) return '#/' + PATH[name];
  if (name === 'lots') return '#/lots/' + id;
  if (name === 'deals') return '#/deals/' + id.toLowerCase();
  if (name === 'conc') return '#/concierge/' + id.toLowerCase().replace('-', '');
  if (name === 'shop') return '#/shop/catalog/' + id.toLowerCase();
  if (name === 'orders') return '#/shop/orders/' + id.toLowerCase().replace('-', '');
  return '#/' + PATH[name];
}
const sectionOf = n => SECTIONS.find(s => s.names.includes(n)) || SECTIONS[0];
function goto(name, id) { const h = hrefOf(name, id); if (location.hash === h) rerender(); else location.hash = h; }
function bp() {
  const w = window.innerWidth;
  return {w, xs:w < 360, phone:w < 768, rail:w >= 768 && w < 1280, menu:w >= 1280, side:w >= 1024, x2:w >= 1680};
}
const bpKey = () => [360, 768, 1024, 1200, 1280, 1680, 1880].map(x => window.innerWidth >= x ? 1 : 0).join('');

/* язык и тема: общие для описания и демо, хранятся в localStorage (vg-lang, vg-theme) */
const store = {get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* пусто */ } }};
let THEME = ['light', 'dark'].includes(store.get('vg-theme')) ? store.get('vg-theme') : 'system';
const sysDark = () => !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
const resolveTheme = () => THEME === 'system' ? (sysDark() ? 'dark' : 'light') : THEME;
function syncThemeColor() {
  requestAnimationFrame(() => {
    let m = document.querySelector('meta[name=theme-color]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  });
}
function applyTheme() {
  const set = () => { document.documentElement.setAttribute('data-theme', resolveTheme()); syncThemeColor(); };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(set); else set();
}
function setTheme(p) { THEME = p; store.set('vg-theme', p); applyTheme(); chrome(); }
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (THEME === 'system') applyTheme(); });
const fontsLoaded = {};
function loadFont(key, href) { if (fontsLoaded[key]) return; fontsLoaded[key] = 1; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
function setLang(l) {
  LANG = l; store.set('vg-lang', l); document.documentElement.lang = HTML_LANG[l];
  S.readLang = l; rerender();
}
function applyStatic() {
  document.documentElement.lang = HTML_LANG[LANG];
  $('#brandsub').textContent = t('brand_sub');
  const mail = '<a href="mailto:hello@demda.pro">hello@demda.pro</a>', tg = '<a href="https://t.me/demda" rel="noopener">Telegram @demda</a>';
  $('#foot').innerHTML = esc(t('foot')) + '<br>' + esc(t('foot_write')) + ' ' + (LANG === 'zh' ? mail + ' · ' + tg : tg + ' · ' + mail);
  $('#side').setAttribute('aria-label', t('ui_sections')); $('#bnav').setAttribute('aria-label', t('ui_sections'));
  document.querySelector('meta[name=description]').content = t('app_desc');
}
const initials = n => { const p = n.split(/[\s.·]+/).filter(Boolean); return (p.length > 1 ? p.slice(0, 2).map(x => x[0]).join('') : n.slice(0, 2)).toUpperCase(); };
const seg = (act, opts, cur, cls) => `<div class="seg ${cls || ''}" role="group">${opts.map(o => `<button data-act="${act}" data-v="${o[0]}" aria-pressed="${String(cur) === String(o[0])}">${o[1]}</button>`).join('')}</div>`;
const curSeg = () => seg('cur', [['THB', '฿'], ['USD', '$'], ['CNY', '¥']], S.cur, 'sm');
const perSeg = () => seg('period', [['m', t('p_m')], ['q', t('p_q')], ['y', t('p_y')]], S.period, 'sm');
const saleBadge = v => v.sale === 'sold' ? `<span class="badge b-accent">${t('sold')}</span>` : v.sale === 'res' ? `<span class="badge b-warn">${t('res')}</span>` : `<span class="badge b-free">${t('free')}</span>`;
const stageName = n => t('st' + n);
const queueOf = n => n <= 8 ? 1 : n <= 14 ? 2 : 3;
const newOrders = () => S.shop.orders.filter(o => o.st === 'new').length;

function menuHtml(kind, items, cur, label, btnInner, extra) {
  const open = OPEN_DD === kind;
  return `<div class="dd"><button class="ctl" data-act="dd" data-v="${kind}" aria-haspopup="menu" aria-expanded="${open}" aria-label="${esc(label)}" title="${esc(label)}">${btnInner}</button>
  ${open ? `<div class="dd-menu" role="menu" aria-label="${esc(label)}">${extra && extra.head || ''}${items.map(i => `<button role="menuitemradio" aria-checked="${cur === i[0]}" data-act="${kind}" data-v="${i[0]}">${i[2] ? ic(i[2]) : ''}<span>${i[1]}</span>${cur === i[0] ? ic('check', 'ic ck') : ''}</button>`).join('')}${extra && extra.tail || ''}</div>` : ''}</div>`;
}
function roleLabels(r) {
  return r === 'buyer' ? [nm('Ли Мин'), t('villa_n', {id:'V-07'})] : [t('role_full_' + r), t('role_demo')];
}
function chrome() {
  applyStatic();
  const b = bp(), sec = sectionOf(RT.name);
  const href = n => '#/' + PATH[n];
  /* нижняя панель (< 768): пять разделов */
  $('#bnav').innerHTML = SECTIONS.map(s => `<a href="${href(s.names.includes(RT.name) ? RT.name : s.names[0])}" ${sec.k === s.k ? 'aria-current="page"' : ''}>${ic(s.ic, '')}<span>${t('sec_' + s.k)}</span>${s.k === 'shop' && newOrders() ? `<i class="dot" aria-label="${newOrders()}"></i>` : ''}</a>`).join('');
  /* рельс 72 (768–1279) и меню 232 (≥ 1280) */
  if (b.menu) {
    const grp = (cap, ks) => `<div class="cap grp">${cap}</div>` + ks.map(k => `<a href="${href(k)}" ${RT.name === k ? 'aria-current="page"' : ''}>${ic(k === 'shop' ? 'catalog' : k === 'villa' ? 'villa' : k, '')}<span>${t(NAV_KEY[k])}</span>${k === 'orders' && newOrders() ? `<b class="badge b-info cnt">${newOrders()}</b>` : ''}</a>`).join('');
    $('#side').innerHTML = `<div class="sidein">${grp(t('role_partner'), ['dash']) + grp(t('role_sales'), ['lots', 'deals']) + grp(t('role_buyer'), ['villa', 'fit']) + grp(t('role_conc'), ['conc']) + grp(t('sec_shop'), ['shop', 'orders', 'supplies', 'revenue'])}</div>
      <div class="sidefoot"><a class="btn btn-t" href="../?lang=${LANG}">${ic('link', 'ic sm16')}${t('about')}</a><button class="btn btn-t" data-act="reset">${ic('reset', 'ic sm16')}${t('reset_demo')}</button><p class="sm faint">${t('demo_note')}</p></div>`;
  } else {
    $('#side').innerHTML = SECTIONS.map(s => `<a href="${href(s.names.includes(RT.name) ? RT.name : s.names[0])}" ${sec.k === s.k ? 'aria-current="page"' : ''}>${ic(s.ic, '')}<span>${t('sec_' + s.k)}</span>${s.k === 'shop' && newOrders() ? `<i class="dot" aria-label="${newOrders()}"></i>` : ''}</a>`).join('');
  }
  $('#asView').innerHTML = b.menu ? `<span class="cap">${t('v_show')}</span><div class="seg" role="group" aria-label="${t('ui_role')}">${Object.keys(ROLES).map(k => `<button data-act="role" data-v="${k}" aria-pressed="${S.role === k}">${t('role_' + k)}</button>`).join('')}</div>` : '';
  const themeIc = {light:'sun', dark:'moon', system:'system'}[THEME], rl = roleLabels(S.role);
  const head = `<div class="dd-head"><b>${rl[0]}</b><span>${rl[1]}</span></div>`;
  const roleItems = b.menu ? [] : Object.keys(ROLES).map(k => [k, t('role_' + k)]);
  const avatarBtn = `<span class="av">${t('role_av_' + S.role)}</span>`;
  const open = OPEN_DD === 'avatar';
  $('#topctl').innerHTML = menuHtml('lang', LANGS.map(l => [l, LANG_NAME[l]]), LANG, t('ui_lang'), `<span>${LANG_SHORT[LANG]}</span>${ic('chev', 'ic chev')}`)
    + menuHtml('theme', [['system', t('th_system'), 'system'], ['light', t('th_light'), 'sun'], ['dark', t('th_dark'), 'moon']], THEME, t('th_label', {x:t('th_' + THEME)}), ic(themeIc))
    + `<div class="dd"><button class="ctl avatar" data-act="dd" data-v="avatar" aria-haspopup="menu" aria-expanded="${open}" aria-label="${esc(t('ui_menu'))}" title="${esc(t('ui_menu'))}">${avatarBtn}</button>
      ${open ? `<div class="dd-menu" role="menu" aria-label="${esc(t('ui_menu'))}">${head}${roleItems.map(i => `<button role="menuitemradio" aria-checked="${S.role === i[0]}" data-act="role" data-v="${i[0]}"><span>${i[1]}</span>${S.role === i[0] ? ic('check', 'ic ck') : ''}</button>`).join('')}${roleItems.length ? '<hr>' : ''}<a class="mi" role="menuitem" href="../?lang=${LANG}">${ic('link')}<span>${t('about')}</span></a><button role="menuitem" data-act="reset">${ic('reset')}<span>${t('reset_demo')}</span></button></div>` : ''}</div>`;
}
/* вкладки подразделов (< 1280) */
function subTabs() {
  const sec = sectionOf(RT.name), list = SUBTABS[sec.k];
  if (!list || bp().menu) return '';
  return `<nav class="subtabs" aria-label="${t('ui_sub')}">${list.map(n => `<a href="#/${PATH[n]}" ${RT.name === n ? 'aria-current="page"' : ''}>${t(n === 'villa' ? 'tab_villa' : NAV_KEY[n])}${n === 'orders' && newOrders() ? `<b class="badge b-info cnt">${newOrders()}</b>` : ''}</a>`).join('')}</nav>`;
}

/* ===================== панели, окна, тосты ===================== */
function panelShell(o) {
  return `<div class="scrim" data-act="panel-close"></div><aside class="panel" role="dialog" aria-label="${esc(o.aria || o.title)}" tabindex="-1">
   <div class="grab" aria-hidden="true"></div>
   <header class="phd"><div class="pt"><h2>${o.title}</h2>${o.sub || ''}</div>${o.badge || ''}<button class="ibtn" data-act="panel-close" aria-label="${t('close')}">${ic('x')}</button></header>
   <div class="pb">${o.body}</div>${o.foot ? `<footer class="pf">${o.foot}</footer>` : ''}</aside>`;
}
const stepper = (steps, cur) => `<ol class="stepper" role="list">${steps.map((s, i) => `<li class="${i < cur ? 'past' : i === cur ? 'cur' : ''}" ${i === cur ? 'aria-current="step"' : ''}><i></i><span>${s}</span></li>`).join('')}</ol>`;
const kv = rows => `<dl class="kv">${rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`;
const blk = (cap, inner) => `<section class="blk"><h3 class="cap">${cap}</h3>${inner}</section>`;

let MODAL = null, TOAST = null, toastT = null;
const sheet = inner => `<div class="sheet-ov" data-ov="1"><div class="sheet" role="dialog" aria-modal="true" tabindex="-1"><div class="grab" aria-hidden="true"></div>${inner}</div></div>`;
const MODALS = {};                                       // тип окна -> функция разметки; регистрируют экраны
function modalHtml() { const m = MODAL; return m && MODALS[m.type] ? MODALS[m.type](m) : ''; }
function toast(msg) { TOAST = msg; clearTimeout(toastT); toastT = setTimeout(() => { TOAST = null; renderLayer(); }, 4000); renderLayer(); const l = $('#live'); if (l) l.textContent = msg; }
function renderLayer() {
  const had = !!$('.sheet'), mt = MODAL && MODAL.type;
  $('#layer').innerHTML = modalHtml() + popHtml() + (TOAST ? `<div class="toast" role="status">${esc(TOAST)}</div>` : '');
  if (MODAL && (!had || LASTMODAL !== mt)) { const f = $('.sheet .btn-p') || $('.sheet button'); if (f) f.focus({preventScroll:true}); }
  LASTMODAL = mt;
}
let LASTMODAL = null;
/* всплывающее меню у кнопки «⋯»: рисуется в слое, чтобы его не обрезала прокрутка доски */
function popHtml() {
  if (!POP) return '';
  const r = POP.rect, w = POP.w || 240, left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)), top = r.bottom + 6;
  const inner = POP.make ? POP.make() : POP.items.map(i => i === '-' ? '<hr>' : `<button role="menuitem" data-act="${i.act}" data-v="${i.v}"${i.to != null ? ` data-to="${i.to}"` : ''}>${i.t}</button>`).join('');
  return `<div class="pop" role="menu" style="left:${left}px;top:${Math.min(top, innerHeight - 300)}px;width:${w}px">${inner}</div>`;
}

/* ===================== отрисовка ===================== */
const VIEWS = {};                                        // имя экрана -> функция разметки; регистрируют screens.js, deals.js, shop.js
const PANELS = {};                                       // имя экрана -> функция панели (по RT.id)
function render() {
  let r = parseHash();
  if (!r) { r = {name:ROLES[S.role].start, id:null}; history.replaceState(null, '', '#/' + PATH[r.name]); }
  RT = r;
  document.body.dataset.page = RT.name;
  chrome();
  if (LANG === 'zh') loadFont('sc', 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600&display=swap');
  if (RT.name === 'conc') loadFont('th', 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500&display=swap');
  const kind = pageKind(RT.name);
  $('#app').innerHTML = `<div class="page ${kind}">${VIEWS[RT.name]()}</div>`;
  const pf = PANELS[RT.name], p = pf ? pf(RT.id) : '';
  $('#panel').innerHTML = p || '';
  document.body.classList.toggle('panel-open', !!p);
  document.body.classList.toggle('has-bar', RT.name === 'fit' && !bp().side);
  document.title = t('app_title_short') + ' — ' + t(NAV_KEY[RT.name]);
  renderLayer();
  if (typeof afterRender === 'function') afterRender();
}
let lastName = null;
function rerender() {
  save();
  const y = scrollY, bd = $('.board'), bx = bd ? bd.scrollLeft : 0, pb = $('.pb'), py = pb ? pb.scrollTop : 0, ts = $('.subtabs'), tx = ts ? ts.scrollLeft : 0;
  render(); scrollTo(0, y);
  const nb = $('.board'); if (nb) { nb.scrollLeft = bx; boardShade(); }
  const np = $('.pb'); if (np && pb) np.scrollTop = py;
  const nt = $('.subtabs'); if (nt) nt.scrollLeft = tx;
}

/* ===================== действия и события ===================== */
const ACT = {
 role(v) { S.role = v; MODAL = null; OPEN_DD = null; const h = '#/' + PATH[ROLES[v].start]; if (location.hash === h) rerender(); else { save(); location.hash = h; } },
 dd(v) { OPEN_DD = OPEN_DD === v ? null : v; POP = null; chrome(); renderLayer(); if (OPEN_DD) { const b = $('.dd-menu [aria-checked=true]') || $('.dd-menu button'); if (b) b.focus(); } },
 lang(v) { OPEN_DD = null; setLang(v); },
 theme(v) { OPEN_DD = null; setTheme(v); },
 period(v) { S.period = v; rerender(); },
 cur(v) { S.cur = v; rerender(); },
 'panel-close'() { closePanel(); },
 'close-modal'() { MODAL = null; renderLayer(); },
 reset() { S = freshState(); MODAL = null; OPEN_DD = null; POP = null; save(); const h = '#/' + PATH[ROLES[S.role].start]; if (location.hash === h) render(); else location.hash = h; toast(t('reset_toast')); },
 'go'(v) { location.hash = '#/' + v; }
};
function closePanel() {
  const base = {lots:'lots', deals:'deals', shop:'shop', orders:'shop/orders'}[RT.name];
  if (base && RT.id) { save(); location.hash = '#/' + base; } else rerender();
}
document.addEventListener('click', e => {
  if (typeof DND !== 'undefined' && performance.now() < DND.quiet) { DND.quiet = 0; e.preventDefault(); e.stopPropagation(); return; }
  if ((OPEN_DD && !e.target.closest('.dd')) || (POP && !e.target.closest('.pop, [data-act=deal-menu]'))) { OPEN_DD = null; POP = null; chrome(); renderLayer(); }
  const go2 = e.target.closest('[data-go-lot]');
  if (go2) { location.hash = '#/lots/' + go2.dataset.goLot.toLowerCase(); return; }
  if (e.target.dataset && e.target.dataset.ov && MODAL) { MODAL = null; renderLayer(); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el.dataset.v, el, e);
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (typeof DND !== 'undefined' && DND.g) return;
    if (OPEN_DD || POP) { const k = OPEN_DD; OPEN_DD = null; POP = null; chrome(); renderLayer(); const b = k && $('[data-act=dd][data-v=' + k + ']'); if (b) b.focus(); return; }
    if (MODAL) { MODAL = null; renderLayer(); return; }
    if (typeof KB !== 'undefined' && KB.g) return;
    if ($('.panel')) closePanel();
    return;
  }
  const menu = e.target.closest && e.target.closest('.dd-menu, .pop');
  if (menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const bs = [...menu.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
    bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); e.preventDefault();
  }
});
window.addEventListener('hashchange', () => {
  const prev = lastName, r = parseHash(); POP = null; OPEN_DD = null; render();
  if (r && prev !== r.name) scrollTo(0, 0);
  lastName = r && r.name;
});
let RZ = bpKey();
window.addEventListener('resize', () => { const k = bpKey(); if (k !== RZ) { RZ = k; rerender(); } });
setInterval(() => {
  document.querySelectorAll('[data-sla]').forEach(el => {
    const r = S.reqs.find(x => x.id === el.dataset.sla); if (!r) return;
    const m = slaLeft(r), long = el.dataset.long;
    el.textContent = m > 0 ? (long ? t('min_short', {n:m}) : m) : (long ? t('sla_breached') : 0);
    el.className = 'sla ' + (m === 0 ? 'over' : 'warn');
  });
}, 20000);
