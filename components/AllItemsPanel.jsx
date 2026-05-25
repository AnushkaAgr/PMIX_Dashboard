'use client';

import { useState } from 'react';
import FilterBar from './FilterBar';
import Pagination, { PAGE_SIZE } from './Pagination';
import { fmt$, fmtN, fmtPct, CHART_COLOR, meBadgeClass } from '@/lib/fmt';

export default function AllItemsPanel({ allItems }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ col: 'net_sales', dir: 'desc' });
  const [page, setPage] = useState(0);

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  function setCol(col) {
    setSort(s => ({ col, dir: s.col === col ? (s.dir === 'asc' ? 'desc' : 'asc') : 'desc' }));
    setPage(0);
  }
  const sortCls = col => sort.col === col ? (sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';

  let tableData = items.filter(i =>
    !search ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );
  tableData = [...tableData].sort((a, b) => {
    const v = sort.dir === 'asc' ? 1 : -1;
    return typeof a[sort.col] === 'string'
      ? a[sort.col].localeCompare(b[sort.col]) * v
      : (a[sort.col] - b[sort.col]) * v;
  });
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={f => { setFilterCat(f.cat); setFilterME(f.me); setPage(0); }} />

      <div className="table-wrap">
        <div className="table-header">
          <h3>All items — full detail</h3>
          <input
            className="search-box"
            placeholder="Search items…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className={sortCls('name')} onClick={() => setCol('name')}>Item</th>
                <th className={sortCls('me_quadrant')} onClick={() => setCol('me_quadrant')}>ME</th>
                <th className={sortCls('category')} onClick={() => setCol('category')}>Category</th>
                <th className={sortCls('sub_category')} onClick={() => setCol('sub_category')}>Sub-cat</th>
                <th className={sortCls('net_sales')} onClick={() => setCol('net_sales')}>Net Sales</th>
                <th className={sortCls('quantity')} onClick={() => setCol('quantity')}>Qty</th>
                <th className={sortCls('margin_pct')} onClick={() => setCol('margin_pct')}>Margin %</th>
                <th className={sortCls('cogs_pct')} onClick={() => setCol('cogs_pct')}>COGS %</th>
                <th className={sortCls('avg_price')} onClick={() => setCol('avg_price')}>Price</th>
                <th className={sortCls('avg_cost')} onClick={() => setCol('avg_cost')}>Cost</th>
                <th className={sortCls('total_margin')} onClick={() => setCol('total_margin')}>Total Margin</th>
                <th className={sortCls('menu_mix_pct')} onClick={() => setCol('menu_mix_pct')}>Mix %</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((i, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td><span className={`me-badge ${meBadgeClass(i.me_quadrant)}`}>{i.me_quadrant}</span></td>
                  <td>{i.category}</td>
                  <td>{i.sub_category}</td>
                  <td>{fmt$(i.net_sales)}</td>
                  <td>{fmtN(i.quantity)}</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min(100, i.margin_pct)}%`, background: CHART_COLOR }} /></div>
                      {fmtPct(i.margin_pct)}
                    </div>
                  </td>
                  <td>{fmtPct(i.cogs_pct)}</td>
                  <td>${i.avg_price?.toFixed(2)}</td>
                  <td>${i.avg_cost?.toFixed(2)}</td>
                  <td>{fmt$(i.total_margin)}</td>
                  <td>{fmtPct(i.menu_mix_pct)}</td>
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
