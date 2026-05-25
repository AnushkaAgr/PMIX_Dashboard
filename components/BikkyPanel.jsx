'use client';

import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import FilterBar from './FilterBar';
import Pagination, { PAGE_SIZE } from './Pagination';
import { fmtN, CHART_COLOR, meBadgeClass, rateTagClass } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const hOpts = (fmt) => ({
  indexAxis: 'y', responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
  scales: { x: { ticks: { callback: fmt, font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } },
});

function RateTag({ v }) {
  if (v == null) return <span>—</span>;
  return <span className={`rate-tag ${rateTagClass(v)}`}>{v.toFixed(1)}%</span>;
}

export default function BikkyPanel({ allItems }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ col: 'bk_is_return', dir: 'desc' });
  const [page, setPage] = useState(0);

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  const withData = items.filter(i => i.bk_is_return != null || i.bk_dl_return != null);

  const isReturnTop = [...withData].filter(i => i.bk_is_return != null).sort((a, b) => (b.bk_is_return || 0) - (a.bk_is_return || 0)).slice(0, 12);
  const dlReturnTop = [...withData].filter(i => i.bk_dl_return != null).sort((a, b) => (b.bk_dl_return || 0) - (a.bk_dl_return || 0)).slice(0, 12);

  const isReturnChart = {
    labels: isReturnTop.map(i => i.name.length > 20 ? i.name.slice(0, 18) + '…' : i.name),
    datasets: [{ data: isReturnTop.map(i => i.bk_is_return), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };
  const dlReturnChart = {
    labels: dlReturnTop.map(i => i.name.length > 20 ? i.name.slice(0, 18) + '…' : i.name),
    datasets: [{ data: dlReturnTop.map(i => i.bk_dl_return), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };

  function setCol(col) {
    setSort(s => ({ col, dir: s.col === col ? (s.dir === 'asc' ? 'desc' : 'asc') : 'desc' }));
    setPage(0);
  }
  const sortCls = col => sort.col === col ? (sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';

  let tableData = withData.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  tableData = [...tableData].sort((a, b) => {
    const v = sort.dir === 'asc' ? 1 : -1;
    const av = a[sort.col] ?? -1, bv = b[sort.col] ?? -1;
    return typeof av === 'string' ? av.localeCompare(bv) * v : (av - bv) * v;
  });
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={f => { setFilterCat(f.cat); setFilterME(f.me); setPage(0); }} />

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Top items by in-store 90-day return rate</h3>
          <Bar data={isReturnChart} options={hOpts(v => v?.toFixed(1) + '%')} />
        </div>
        <div className="chart-card">
          <h3>Top items by 3PD+Loyalty 90-day return rate</h3>
          <Bar data={dlReturnChart} options={hOpts(v => v?.toFixed(1) + '%')} />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h3>Bikky retention — all items with data</h3>
          <input className="search-box" placeholder="Search items…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className={sortCls('name')} onClick={() => setCol('name')}>Item</th>
                <th>ME</th>
                <th className={sortCls('bk_is_guests')} onClick={() => setCol('bk_is_guests')}>In-Store Guests</th>
                <th className={sortCls('bk_is_return')} onClick={() => setCol('bk_is_return')}>IS Return %</th>
                <th className={sortCls('bk_is_reorder')} onClick={() => setCol('bk_is_reorder')}>IS Reorder %</th>
                <th className={sortCls('bk_dl_guests')} onClick={() => setCol('bk_dl_guests')}>3PD+Loyalty Guests</th>
                <th className={sortCls('bk_dl_return')} onClick={() => setCol('bk_dl_return')}>3PD+Loyalty Return %</th>
                <th className={sortCls('bk_dl_reorder')} onClick={() => setCol('bk_dl_reorder')}>3PD+Loyalty Reorder %</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((i, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td><span className={`me-badge ${meBadgeClass(i.me_quadrant)}`}>{i.me_quadrant}</span></td>
                  <td>{i.bk_is_guests != null ? fmtN(i.bk_is_guests) : '—'}</td>
                  <td><RateTag v={i.bk_is_return} /></td>
                  <td><RateTag v={i.bk_is_reorder} /></td>
                  <td>{i.bk_dl_guests != null ? fmtN(i.bk_dl_guests) : '—'}</td>
                  <td><RateTag v={i.bk_dl_return} /></td>
                  <td><RateTag v={i.bk_dl_reorder} /></td>
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
