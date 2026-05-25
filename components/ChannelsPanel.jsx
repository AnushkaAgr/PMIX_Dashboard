'use client';

import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import FilterBar from './FilterBar';
import Pagination, { PAGE_SIZE } from './Pagination';
import { fmtK, fmt$, fmtN, COLORS, CHART_COLOR, meBadgeClass } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const donutOpts = (vals) => ({
  responsive: true, cutout: '60%',
  plugins: {
    legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: c => { const t = vals.reduce((a, b) => a + b, 0); return `${c.label}: ${fmtK(c.raw)} (${t ? (c.raw / t * 100).toFixed(1) : 0}%)`; } } },
  },
});

const barOpts = (fmt) => ({
  responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
  scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { callback: fmt, font: { size: 10 } }, grid: { color: '#f3f4f6' } } },
});

const CATS = ['Entrees', 'NA Drinks', 'Sides', 'Sweets', 'Kids Meal', 'Alc Drinks'];

export default function ChannelsPanel({ allItems }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ col: 'net_sales', dir: 'desc' });
  const [page, setPage] = useState(0);

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  const ih = items.reduce((a, i) => a + i.ih_sales, 0);
  const _3p = items.reduce((a, i) => a + i.threedp_sales, 0);
  const lo = items.reduce((a, i) => a + i.lo_sales, 0);
  const ihQ = items.reduce((a, i) => a + i.ih_qty, 0);
  const _3pQ = items.reduce((a, i) => a + i.threedp_qty, 0);
  const loQ = items.reduce((a, i) => a + i.lo_qty, 0);

  const chLabels = ['In-House', '3PD', 'Loyalty'];
  const chRevVals = [ih, _3p, lo];
  const chQtyVals = [ihQ, _3pQ, loQ];
  const chColors = [COLORS.inhouse, COLORS.delivery, COLORS.loyalty];

  const revDonut = { labels: chLabels, datasets: [{ data: chRevVals, backgroundColor: chColors, borderWidth: 2, borderColor: '#fff' }] };
  const qtyDonut = { labels: chLabels, datasets: [{ data: chQtyVals, backgroundColor: chColors, borderWidth: 2, borderColor: '#fff' }] };

  const catBarFor = (field) => ({
    labels: CATS.map(c => c.length > 12 ? c.slice(0, 11) + '…' : c),
    datasets: [{ data: CATS.map(c => items.filter(i => i.category === c).reduce((a, i) => a + i[field], 0)), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  });

  function setCol(col) {
    setSort(s => ({ col, dir: s.col === col ? (s.dir === 'asc' ? 'desc' : 'asc') : 'desc' }));
    setPage(0);
  }
  const sortCls = col => sort.col === col ? (sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';

  let tableData = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  tableData = [...tableData].sort((a, b) => {
    const v = sort.dir === 'asc' ? 1 : -1;
    return typeof a[sort.col] === 'string' ? a[sort.col].localeCompare(b[sort.col]) * v : (a[sort.col] - b[sort.col]) * v;
  });
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={f => { setFilterCat(f.cat); setFilterME(f.me); setPage(0); }} />

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card" style={{ borderLeft: `3px solid ${COLORS.inhouse}` }}>
          <div className="kpi-label">In-House Revenue</div>
          <div className="kpi-value">{fmtK(ih)}</div>
          <div className="kpi-sub">{fmtN(ihQ)} items</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: `3px solid ${COLORS.delivery}` }}>
          <div className="kpi-label">3PD Revenue</div>
          <div className="kpi-value">{fmtK(_3p)}</div>
          <div className="kpi-sub">{fmtN(_3pQ)} items</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: `3px solid ${COLORS.loyalty}` }}>
          <div className="kpi-label">Loyalty Revenue</div>
          <div className="kpi-value">{fmtK(lo)}</div>
          <div className="kpi-sub">{fmtN(loQ)} items</div>
        </div>
      </div>

      <div className="chart-row three">
        <div className="chart-card">
          <h3>In-House revenue by category</h3>
          <Bar data={catBarFor('ih_sales')} options={barOpts(fmtK)} />
        </div>
        <div className="chart-card">
          <h3>3PD revenue by category</h3>
          <Bar data={catBarFor('threedp_sales')} options={barOpts(fmtK)} />
        </div>
        <div className="chart-card">
          <h3>Loyalty revenue by category</h3>
          <Bar data={catBarFor('lo_sales')} options={barOpts(fmtK)} />
        </div>
      </div>

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Channel revenue split</h3>
          <Doughnut data={revDonut} options={donutOpts(chRevVals)} />
        </div>
        <div className="chart-card">
          <h3>Channel volume split (items sold)</h3>
          <Doughnut data={qtyDonut} options={donutOpts(chQtyVals)} />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h3>Item-level channel breakdown</h3>
          <input className="search-box" placeholder="Search items…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className={sortCls('name')} onClick={() => setCol('name')}>Item</th>
                <th>ME</th>
                <th className={sortCls('net_sales')} onClick={() => setCol('net_sales')}>Total Sales</th>
                <th className={sortCls('ih_sales')} onClick={() => setCol('ih_sales')}>In-House $</th>
                <th className={sortCls('threedp_sales')} onClick={() => setCol('threedp_sales')}>3PD $</th>
                <th className={sortCls('lo_sales')} onClick={() => setCol('lo_sales')}>Loyalty $</th>
                <th>Channel split</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((i, idx) => {
                const total = i.ih_sales + i.threedp_sales + i.lo_sales || 1;
                const ihW = Math.round(i.ih_sales / total * 100);
                const tpW = Math.round(i.threedp_sales / total * 100);
                const loW = Math.round(i.lo_sales / total * 100);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{i.name}</td>
                    <td><span className={`me-badge ${meBadgeClass(i.me_quadrant)}`}>{i.me_quadrant}</span></td>
                    <td>{fmt$(i.net_sales)}</td>
                    <td>{fmt$(i.ih_sales)}</td>
                    <td>{fmt$(i.threedp_sales)}</td>
                    <td>{fmt$(i.lo_sales)}</td>
                    <td>
                      <div className="ch-bar">
                        <div className="ch-ih" style={{ width: `${ihW}%` }} />
                        <div className="ch-3pd" style={{ width: `${tpW}%` }} />
                        <div className="ch-lo" style={{ width: `${loW}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination total={tableData.length} page={page} onPage={setPage} />
      </div>
    </div>
  );
}
