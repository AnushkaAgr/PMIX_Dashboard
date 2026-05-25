'use client';

import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, BubbleController, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bubble } from 'react-chartjs-2';
import FilterBar from './FilterBar';
import Pagination, { PAGE_SIZE } from './Pagination';
import { fmtK, fmt$, fmtN, fmtPct, COLORS, CHART_COLOR, meBadgeClass } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, BubbleController, Tooltip, Legend);

export default function MEPanel({ allItems }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ col: 'net_sales', dir: 'desc' });
  const [page, setPage] = useState(0);

  function applyFilters(f) { setFilterCat(f.cat); setFilterME(f.me); setPage(0); }

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  const quads = ['Star', 'Plow Horse', 'Puzzle', 'Dog'];
  const quadCls = ['star', 'plow', 'puzzle', 'dog'];

  const meSummary = quads.map((q, idx) => {
    const qItems = items.filter(x => x.me_quadrant === q);
    const rev = qItems.reduce((a, x) => a + x.net_sales, 0);
    return { q, cls: quadCls[idx], count: qItems.length, rev };
  });

  const meRevVals = quads.map(q => items.filter(i => i.me_quadrant === q).reduce((a, i) => a + i.net_sales, 0));
  const meRevChart = {
    labels: quads,
    datasets: [{ data: meRevVals, backgroundColor: quads.map(q => COLORS[q]), borderWidth: 2, borderColor: '#fff' }],
  };

  const meCountVals = quads.map(q => items.filter(i => i.me_quadrant === q).length);
  const meCountChart = {
    labels: quads,
    datasets: [{ data: meCountVals, backgroundColor: quads.map(q => COLORS[q]), borderWidth: 2, borderColor: '#fff' }],
  };

  const bubbleDatasets = quads.map(q => ({
    label: q,
    data: items.filter(i => i.me_quadrant === q).map(i => ({
      x: i.quantity,
      y: i.margin_pct,
      r: Math.max(4, Math.min(20, i.net_sales / 2000)),
      name: i.name,
    })),
    backgroundColor: COLORS[q] + '99',
    borderColor: COLORS[q],
    borderWidth: 1,
  }));

  function setCol(col) {
    setSort(s => ({ col, dir: s.col === col ? (s.dir === 'asc' ? 'desc' : 'asc') : 'desc' }));
    setPage(0);
  }
  const sortCls = col => sort.col === col ? (sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';

  let tableData = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.me_quadrant.toLowerCase().includes(search.toLowerCase())
  );
  tableData = [...tableData].sort((a, b) => {
    const v = sort.dir === 'asc' ? 1 : -1;
    return typeof a[sort.col] === 'string' ? a[sort.col].localeCompare(b[sort.col]) * v : (a[sort.col] - b[sort.col]) * v;
  });
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const revDonutOpts = {
    responsive: true, cutout: '60%',
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: c => { const t = meRevVals.reduce((a, b) => a + b, 0); return `${c.label}: ${fmtK(c.raw)} (${t ? (c.raw / t * 100).toFixed(1) : 0}%)`; } } },
    },
  };
  const countDonutOpts = {
    responsive: true, cutout: '60%',
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: c => `${c.label}: ${c.raw} items` } },
    },
  };
  const bubbleOpts = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: c => [c.raw.name, 'Qty: ' + fmtN(c.raw.x), 'Margin: ' + c.raw.y?.toFixed(1) + '%'] } },
    },
    scales: {
      x: { title: { display: true, text: 'Quantity sold', font: { size: 11 } }, ticks: { font: { size: 10 } } },
      y: { title: { display: true, text: 'Margin %', font: { size: 11 } }, ticks: { callback: v => v + '%', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
    },
  };

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={applyFilters} />

      <div className="me-grid">
        {meSummary.map(({ q, cls, count, rev }) => (
          <div key={q} className={`me-card ${cls}`}>
            <div className="me-label">{q}</div>
            <div className="me-count">{count}</div>
            <div className="me-rev">{fmtK(rev)} revenue</div>
          </div>
        ))}
      </div>

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Revenue by ME quadrant</h3>
          <Doughnut data={meRevChart} options={revDonutOpts} />
        </div>
        <div className="chart-card">
          <h3>Item count by ME quadrant</h3>
          <Doughnut data={meCountChart} options={countDonutOpts} />
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <h3>Margin % vs quantity — ME scatter</h3>
          <Bubble data={{ datasets: bubbleDatasets }} options={bubbleOpts} />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h3>ME item detail — all items</h3>
          <input className="search-box" placeholder="Search items…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className={sortCls('name')} onClick={() => setCol('name')}>Item</th>
                <th className={sortCls('me_quadrant')} onClick={() => setCol('me_quadrant')}>Quadrant</th>
                <th className={sortCls('category')} onClick={() => setCol('category')}>Category</th>
                <th className={sortCls('net_sales')} onClick={() => setCol('net_sales')}>Net Sales</th>
                <th className={sortCls('quantity')} onClick={() => setCol('quantity')}>Qty</th>
                <th className={sortCls('margin_pct')} onClick={() => setCol('margin_pct')}>Margin %</th>
                <th className={sortCls('menu_mix_pct')} onClick={() => setCol('menu_mix_pct')}>Menu Mix %</th>
                <th className={sortCls('avg_price')} onClick={() => setCol('avg_price')}>Avg Price</th>
                <th className={sortCls('avg_cost')} onClick={() => setCol('avg_cost')}>Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((i, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td><span className={`me-badge ${meBadgeClass(i.me_quadrant)}`}>{i.me_quadrant}</span></td>
                  <td>{i.category}</td>
                  <td>{fmt$(i.net_sales)}</td>
                  <td>{fmtN(i.quantity)}</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min(100, i.margin_pct)}%`, background: CHART_COLOR }} /></div>
                      {fmtPct(i.margin_pct)}
                    </div>
                  </td>
                  <td>{fmtPct(i.menu_mix_pct)}</td>
                  <td>${i.avg_price?.toFixed(2)}</td>
                  <td>${i.avg_cost?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={tableData.length} page={page} onPage={setPage} />
      </div>
    </div>
  );
}
