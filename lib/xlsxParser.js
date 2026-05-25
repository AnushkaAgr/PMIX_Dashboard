import * as XLSX from 'xlsx';
import fs from 'fs';

const BL_IDX = {
  name: 0, avg_price: 1, avg_cost: 2, margin: 3, quantity: 4, total_cost: 5,
  net_sales: 6, total_margin: 7, cogs_pct: 8, margin_pct: 9, menu_mix_pct: 10,
  margin_tier: 11, mix_tier: 12, me_quadrant: 13, category: 14, sub_category: 15,
};

const CH_IDX = {
  name: 0, avg_price: 1, avg_cost: 2, margin: 3, quantity: 4, total_cost: 5,
  net_sales: 6, total_margin: 7, cogs_pct: 8, margin_pct: 9, menu_mix_pct: 10,
  margin_tier: 11, mix_tier: 12, me_quadrant: 13, revenue_center: 14,
  category: 15, sub_category: 16, return_rate: 20, reorder_rate: 21,
};

const BK_IDX = { name: 0, revenue: 3, volume: 6, guests: 9, return_rate: 10, reorder_rate: 11 };

const MODIFIER_COSTS = {"Basmati Rice":0.2127,"1/2 Masala Quinoa":0.1529,"Lemon Turmeric Rice":0.2488,"1/2 Basmati Rice":0.097,"1/2 and 1/2 Grains":0.1297,"1/2 South Indian Rice Noodles":0.1812,"Masala Quinoa":0.3059,"South Indian Rice Noodles":0.3623,"Chicken Tikka":0.8532,"1/2 Roasted Vegetables":0.4085,"1/2 and 1/2 Mains":0.505,"1/2 Chicken":0.3946,"Organic Tandoori Paneer":1.2321,"1/2 Tandoori Paneer":0.7393,"Cauliflower + Potato":0.8703,"1/2 Spicy Chili Chicken":0.4663,"Roasted Vegetables":0.8169,"1/2 Lamb Kebab":0.933,"Lamb Kebab":1.866,"Spicy Chili Chicken":0.9327,"Extra Chicken Tikka":0.8532,"Extra Cauliflower + Potato":0.8703,"Extra Organic Tandoori Paneer":1.2321,"Extra Roasted Vegetables":0.8169,"Extra Lamb Kebab":1.866,"Extra Spicy Chili Chicken":0.9327,"Tomato Garlic (Butter Masala)":0.7524,"Tikka Masala":0.7545,"Tamarind Chili (Spicy)":0.7234,"Coconut Ginger":0.8331,"Peanut Sesame":0.531,"Spiced Chickpeas":0.1483,"Sautéed Spinach":0.2568,"Indian Street Corn":0.0117,"Pickled Onions":0.0394,"Cucumber Cubes":0.0363,"Chopped Cilantro":0.0232,"Roasted Lentils":0.0061,"Carrot Slaw":0.039,"Mango Salsa":0.1801,"Kachumber Salad":0.0545,"Shredded Paneer Cheese":0.1792,"Chickpea Noodles":0.0091,"Romaine":0.114,"Avocado":0.2404,"Lentil Chips":0.0416,"Mint Cilantro Chutney":0.1465,"Toasted Cumin Yogurt":0.0716,"Spicy Mango Chutney":0.1777,"Ginger Tamarind Chutney":0.1429,"Sweet Tamarind Chutney":0.1171,"Chili Lime Vinaigrette":0.092,"Kokum Vinaigrette":0.0778,"That Fire Hot Sauce - Side":0.44,"Garlic Naan":0.5958,"Naan":0.4913,"Mini Samosas":1.1637,"Mango Lassi":1.4091,"Cucumber Raita":0.4323,"Samosa Chaat":2.2232,"Masala Chai Cookies":0.3341,"1/2 and 1/2 Greens":0.3393,"1/2 Spinach":0.3573,"Romaine Lettuce":0.5774,"1/2 Romaine Lettuce":0.2887,"Sexygreens":0.662,"1/2 Arugula":0.3984,"Arugula":0.7969,"Baby Spinach":0.7145,"1/2 Cauliflower + Potato":0.4352,"1/2 Lemon Turmeric Rice":0.1135,"1/2 Sexygreens":0.331,"Masala Yogurt":0.1245};

function sheetToRows(ws) {
  if (!ws || !ws['!ref']) return [];
  const ref = XLSX.utils.decode_range(ws['!ref']);
  const rows = [];
  for (let r = ref.s.r; r <= ref.e.r; r++) {
    const row = [];
    for (let c = ref.s.c; c <= ref.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? cell.v : null);
    }
    rows.push(row);
  }
  return rows;
}

function isDataRow(row, nameCol) {
  if (!row || row.length <= nameCol) return false;
  const name = (row[nameCol] || '').toString().trim();
  if (!name) return false;
  const skip = ['avg margin', 'menu mix threshold', 'grand total', 'item  name', 'item name'];
  return !skip.some(s => name.toLowerCase().includes(s));
}

function sf(val, def) {
  if (val == null) return def !== undefined ? def : null;
  const n = parseFloat(val);
  return isNaN(n) ? (def !== undefined ? def : null) : n;
}
function ss(val) { return val != null ? val.toString().trim() : ''; }

export function inferPeriodLabel(filename) {
  const fnMatch = filename.match(/P(\d+)[_\s](\d{4})/i);
  const periods = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return fnMatch
    ? `${periods[parseInt(fnMatch[1])] || 'P' + fnMatch[1]} ${fnMatch[2]}`
    : filename.replace(/\.xlsx?$/i, '');
}

function extractFromWorkbook(wb, filename) {
  const required = [
    'Menu Item Master with Cost - Bl',
    'Menu Item Master with Cost - In',
    'Menu Item Master with Cost - 3P',
    'Menu Item Master with Cost - Lo',
  ];
  for (const s of required) {
    if (!wb.SheetNames.includes(s)) {
      throw new Error(`Sheet not found: "${s}"`);
    }
  }

  const blRows = sheetToRows(wb.Sheets['Menu Item Master with Cost - Bl']).slice(1).filter(r => isDataRow(r, 0));
  const ihRows = sheetToRows(wb.Sheets['Menu Item Master with Cost - In']).slice(1).filter(r => isDataRow(r, 0));
  const _3pRows = sheetToRows(wb.Sheets['Menu Item Master with Cost - 3P']).slice(1).filter(r => isDataRow(r, 0));
  const loRows = sheetToRows(wb.Sheets['Menu Item Master with Cost - Lo']).slice(1).filter(r => isDataRow(r, 0));

  function buildChLookup(rows) {
    const lkp = {};
    rows.forEach(r => {
      const name = ss(r[CH_IDX.name]);
      if (name) lkp[name] = {
        quantity: sf(r[CH_IDX.quantity], 0),
        net_sales: sf(r[CH_IDX.net_sales], 0),
        total_margin: sf(r[CH_IDX.total_margin], 0),
        me_quadrant: ss(r[CH_IDX.me_quadrant]),
        return_rate: sf(r[CH_IDX.return_rate]),
        reorder_rate: sf(r[CH_IDX.reorder_rate]),
      };
    });
    return lkp;
  }

  const ihL = buildChLookup(ihRows);
  const _3pL = buildChLookup(_3pRows);
  const loL = buildChLookup(loRows);

  function buildBkLookup(sheetName) {
    if (!wb.SheetNames.includes(sheetName)) return {};
    const rows = sheetToRows(wb.Sheets[sheetName]).slice(1).filter(r => r[0]);
    const lkp = {};
    rows.forEach(r => {
      const name = ss(r[BK_IDX.name]);
      if (name) lkp[name] = {
        guests: sf(r[BK_IDX.guests]),
        return_rate: sf(r[BK_IDX.return_rate]),
        reorder_rate: sf(r[BK_IDX.reorder_rate]),
      };
    });
    return lkp;
  }

  const bkIS = buildBkLookup('updated Bikky In store Raw Data');
  const bkDL = buildBkLookup('Updated Bikky Delivery + Pickup');

  const items = blRows.map(r => {
    const name = ss(r[BL_IDX.name]);
    const avg_price = sf(r[BL_IDX.avg_price], 0);
    const avg_cost = sf(r[BL_IDX.avg_cost], 0);
    const margin_unit = sf(r[BL_IDX.margin], avg_price - avg_cost);
    const quantity = sf(r[BL_IDX.quantity], 0);
    const net_sales = sf(r[BL_IDX.net_sales], 0);
    const total_margin = sf(r[BL_IDX.total_margin], 0);
    const margin_pct = sf(r[BL_IDX.margin_pct], 0);
    const cogs_pct = sf(r[BL_IDX.cogs_pct], 0);
    const menu_mix_pct = sf(r[BL_IDX.menu_mix_pct], 0);
    const me_quadrant = ss(r[BL_IDX.me_quadrant]);
    const category = ss(r[BL_IDX.category]);
    const sub_category = ss(r[BL_IDX.sub_category]);

    const ih = ihL[name] || {};
    const _3p = _3pL[name] || {};
    const lo = loL[name] || {};
    const bkI = bkIS[name] || {};
    const bkD = bkDL[name] || {};

    return {
      name, category, sub_category, me_quadrant,
      quantity: Math.round(quantity),
      net_sales: Math.round(net_sales * 100) / 100,
      total_margin: Math.round(total_margin * 100) / 100,
      avg_price: Math.round(avg_price * 100) / 100,
      avg_cost: Math.round(avg_cost * 100) / 100,
      margin_unit: Math.round(margin_unit * 100) / 100,
      margin_pct: Math.round(margin_pct * 10000) / 100,
      cogs_pct: Math.round(cogs_pct * 10000) / 100,
      menu_mix_pct: Math.round(menu_mix_pct * 1000000) / 10000,
      ih_qty: Math.round(ih.quantity || 0),
      ih_sales: Math.round((ih.net_sales || 0) * 100) / 100,
      threedp_qty: Math.round(_3p.quantity || 0),
      threedp_sales: Math.round((_3p.net_sales || 0) * 100) / 100,
      lo_qty: Math.round(lo.quantity || 0),
      lo_sales: Math.round((lo.net_sales || 0) * 100) / 100,
      bk_is_return: bkI.return_rate != null ? Math.round(bkI.return_rate * 10000) / 100 : null,
      bk_is_reorder: bkI.reorder_rate != null ? Math.round(bkI.reorder_rate * 10000) / 100 : null,
      bk_is_guests: bkI.guests != null ? Math.round(bkI.guests) : null,
      bk_dl_return: bkD.return_rate != null ? Math.round(bkD.return_rate * 10000) / 100 : null,
      bk_dl_reorder: bkD.reorder_rate != null ? Math.round(bkD.reorder_rate * 10000) / 100 : null,
      bk_dl_guests: bkD.guests != null ? Math.round(bkD.guests) : null,
    };
  }).filter(i => i.name).sort((a, b) => b.net_sales - a.net_sales);

  const totalRev = items.reduce((a, i) => a + i.net_sales, 0);
  const totalQty = items.reduce((a, i) => a + i.quantity, 0);
  const totalMargin = items.reduce((a, i) => a + i.total_margin, 0);
  const avgMarginPct = totalRev ? totalMargin / totalRev * 100 : 0;
  const starRev = items.filter(i => i.me_quadrant === 'Star').reduce((a, i) => a + i.net_sales, 0);
  const starsCarry = totalRev ? starRev / totalRev * 100 : 0;
  const meCounts = {};
  ['Star', 'Plow Horse', 'Puzzle', 'Dog'].forEach(q => {
    meCounts[q] = items.filter(i => i.me_quadrant === q).length;
  });

  const catRevMap = {};
  items.forEach(i => { catRevMap[i.category] = (catRevMap[i.category] || 0) + i.net_sales; });
  const catRevSorted = Object.fromEntries(
    Object.entries(catRevMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v * 100) / 100])
  );

  const meRevMap = {};
  ['Star', 'Plow Horse', 'Puzzle', 'Dog'].forEach(q => {
    meRevMap[q] = Math.round(items.filter(i => i.me_quadrant === q).reduce((a, i) => a + i.net_sales, 0) * 100) / 100;
  });

  const ihTotal = { sales: Math.round(items.reduce((a, i) => a + i.ih_sales, 0) * 100) / 100, qty: items.reduce((a, i) => a + i.ih_qty, 0) };
  const _3pTotal = { sales: Math.round(items.reduce((a, i) => a + i.threedp_sales, 0) * 100) / 100, qty: items.reduce((a, i) => a + i.threedp_qty, 0) };
  const loTotal = { sales: Math.round(items.reduce((a, i) => a + i.lo_sales, 0) * 100) / 100, qty: items.reduce((a, i) => a + i.lo_qty, 0) };

  return {
    meta: { period: inferPeriodLabel(filename), source_file: filename, item_count: items.length },
    kpis: {
      total_revenue: Math.round(totalRev * 100) / 100,
      total_items_sold: Math.round(totalQty),
      total_margin: Math.round(totalMargin * 100) / 100,
      avg_margin_pct: Math.round(avgMarginPct * 100) / 100,
      stars_carry_pct: Math.round(starsCarry * 100) / 100,
      me_counts: meCounts,
    },
    channel_totals: { inhouse: ihTotal, delivery: _3pTotal, loyalty: loTotal },
    category_revenue: catRevSorted,
    me_revenue: meRevMap,
    top10_items: items.slice(0, 10).map(i => ({ name: i.name, net_sales: i.net_sales, quantity: i.quantity, me_quadrant: i.me_quadrant, category: i.category })),
    items,
  };
}

function extractBYOFromWorkbook(wb) {
  if (!wb.SheetNames.includes('Clean Modifiers')) {
    return { by_item: {}, aggregated: {}, ih_data: {}, lo3p_data: {}, items: [] };
  }

  const extractedCosts = {};
  const BYO_COST_SHEETS = [
    'BYO Grain Bowl', 'BYO Salad Bowl', 'BYO Greens + Grains Bowl', 'BYO Indian Burrito',
    'Chicken Tikka Bowl', 'Spicy Chili Chicken Bowl', 'Paneer Tikka Bowl',
    'Spiced Cauli + Quinoa Bowl', 'Tandoori Paneer Burrito', 'Butter Chicken Burrito',
  ];
  const SEC_KW_COST = ['BASES', 'EXTRA MAIN', 'MAIN', 'SAUCE', 'VEGGIES', 'TOPPINGS', 'CHUTNEY AND DRESSINGS', 'MAKE IT MEAL'];
  const SKIP_STARTS_COST = ['BYO ', 'BOWLS -', 'AVG ', 'TOTAL ', 'MODIFIER +', 'FINAL ', 'Grand Total'];

  BYO_COST_SHEETS.forEach(sname => {
    const actual = wb.SheetNames.find(s => s.startsWith(sname.slice(0, 20)));
    if (!actual) return;
    const rows = sheetToRows(wb.Sheets[actual]);
    let inSec = false;
    rows.forEach(row => {
      const v = (row[0] || '').toString().trim();
      if (SEC_KW_COST.some(k => v.includes(k)) && (v.includes(' - ') || v.startsWith('BYO '))) { inSec = true; return; }
      if (!inSec) return;
      if (SKIP_STARTS_COST.some(s => v.startsWith(s))) { inSec = false; return; }
      if (!v || v === 'modifier' || v === 'No Catering') return;
      const cost = parseFloat(row[3]);
      if (!isNaN(cost) && cost > 0 && !extractedCosts[v]) extractedCosts[v] = Math.round(cost * 10000) / 10000;
      const v7 = (row[7] || '').toString().trim();
      const cost10 = parseFloat(row[10]);
      if (v7 && !isNaN(cost10) && cost10 > 0 && !extractedCosts[v7]) extractedCosts[v7] = Math.round(cost10 * 10000) / 10000;
    });
  });

  const allCosts = Object.assign({}, MODIFIER_COSTS, extractedCosts);

  const MOD_TYPE_TO_SEC = {
    'Main': 'MAIN', '1/2 Main': 'MAIN',
    'Base': 'BASES', '1/2 Base': 'BASES',
    'Sauce': 'SAUCE',
    'Veggie': 'VEGGIES',
    'Topping': 'TOPPINGS',
    'Extra Main': 'EXTRA MAIN',
    'Chutney and Dressing': 'CHUTNEY AND DRESSINGS',
  };

  const ITEM_MAP = {
    'BYO Grain Bowl': { lo3p: ['Grain Bowl'], ih: ['Grain Bowl - In House'] },
    'BYO Salad Bowl': { lo3p: ['Salad Bowl'], ih: ['Salad Bowl - In House'] },
    'BYO Greens + Grains Bowl': { lo3p: ['Greens + Grains Bowl'], ih: ['Greens + Grains Bowl - In House', 'Harvest Chicken Bowl - In House'] },
    'BYO Indian Burrito': { lo3p: ['BYO Indian Burrito'], ih: ['Burrito - In House'] },
    'Chicken Tikka Bowl': { lo3p: ['Chicken Tikka Bowl'], ih: ['Chicken Tikka Bowl - In House'] },
    'Spicy Chili Chicken Bowl': { lo3p: ['Spicy Chili Chicken Bowl'], ih: ['Spicy Chili Chicken Bowl - In House'] },
    'Paneer Tikka Bowl': { lo3p: ['Paneer Tikka Bowl'], ih: ['Paneer Tikka Bowl - In House'] },
    'Spiced Cauli + Quinoa Bowl': { lo3p: ['Spiced Cauli + Quinoa Bowl'], ih: ['Cauliflower + Quinoa - In House'] },
    'Tandoori Paneer Burrito': { lo3p: ['Tandoori Paneer Burrito'], ih: ['Tandoori Paneer Burrito - In House'] },
    'Butter Chicken Burrito': { lo3p: ['Butter Chicken Burrito'], ih: ['Butter Chicken Burrito - In House'] },
  };

  function getChannel(itemType) {
    if (!itemType) return null;
    if (itemType.endsWith('- In House')) return 'ih';
    if (itemType.endsWith('- Online')) return 'lo3p';
    return null;
  }

  const ws = wb.Sheets['Clean Modifiers'];
  const rows = sheetToRows(ws);
  if (!rows.length) return { by_item: {}, aggregated: {}, ih_data: {}, lo3p_data: {}, items: [], modifier_costs: allCosts };

  const cmRows = rows.slice(1).filter(r => r[0] && r[1] && r[5] > 0 && r[8]);

  function buildSections(parentNames, channelFilter) {
    const parentSet = new Set(parentNames.map(p => p.toLowerCase()));
    const secs = {};
    for (const r of cmRows) {
      if (!parentSet.has((r[1] || '').toLowerCase())) continue;
      const ch = getChannel(r[2]);
      if (channelFilter && ch !== channelFilter) continue;
      const sec = MOD_TYPE_TO_SEC[r[8]];
      if (!sec) continue;
      const mod = (r[0] || '').toString().trim();
      const qty = Math.round(parseFloat(r[5]) || 0);
      if (!secs[sec]) secs[sec] = {};
      secs[sec][mod] = (secs[sec][mod] || 0) + qty;
    }
    return Object.fromEntries(
      Object.entries(secs)
        .filter(([, mods]) => Object.keys(mods).length)
        .map(([sec, mods]) => [sec,
          Object.entries(mods).map(([modifier, qty]) => ({ modifier, qty })).sort((a, b) => b.qty - a.qty)
        ])
    );
  }

  const allByItem = {}, ihByItem = {}, lo3pByItem = {};
  for (const [itemName, parents] of Object.entries(ITEM_MAP)) {
    const allParents = [...parents.lo3p, ...parents.ih];
    const all = buildSections(allParents, null);
    const ih = buildSections(parents.ih, 'ih');
    const lo3p = buildSections(parents.lo3p, 'lo3p');
    if (Object.keys(all).length) allByItem[itemName] = all;
    if (Object.keys(ih).length) ihByItem[itemName] = ih;
    if (Object.keys(lo3p).length) lo3pByItem[itemName] = lo3p;
  }

  const allAgg = {};
  Object.values(allByItem).forEach(secs => Object.entries(secs).forEach(([sec, mods]) => {
    if (!allAgg[sec]) allAgg[sec] = {};
    mods.forEach(m => { allAgg[sec][m.modifier] = (allAgg[sec][m.modifier] || 0) + m.qty; });
  }));
  const aggregated = Object.fromEntries(Object.entries(allAgg).map(([sec, mods]) => [sec,
    Object.entries(mods).map(([modifier, qty]) => ({ modifier, qty })).sort((a, b) => b.qty - a.qty)
  ]));

  return {
    by_item: allByItem,
    aggregated,
    ih_data: ihByItem,
    lo3p_data: lo3pByItem,
    items: Object.keys(allByItem),
    modifier_costs: allCosts,
  };
}

export function parseFile(filePath, filename) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const raw = extractFromWorkbook(wb, filename);
  const byo = extractBYOFromWorkbook(wb);
  return { ...raw, byo };
}
