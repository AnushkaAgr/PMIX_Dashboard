'use client';

import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import FilterBar from './FilterBar';
import { fmtK, fmtN, CHART_COLOR } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MenuMixPanel({ allItems }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  const mixMap = {};
  items.forEach(i => { mixMap[i.sub_category] = (mixMap[i.sub_category] || 0) + i.quantity; });
  const mixTotal = Object.values(mixMap).reduce((a, b) => a + b, 0);
  const mixSorted = Object.entries(mixMap).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const subcatChart = {
    labels: mixSorted.map(([k]) => k),
    datasets: [{ data: mixSorted.map(([, v]) => mixTotal ? v / mixTotal * 100 : 0), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };

  const cat = (filterCat && filterCat !== 'all') ? filterCat : 'Entrees';
  const catItems = items.filter(i => i.category === cat);
  const catTotal = catItems.reduce((a, i) => a + i.net_sales, 0);
  const catTop = [...catItems].sort((a, b) => b.net_sales - a.net_sales).slice(0, 12);
  const catBreakdownChart = {
    labels: catTop.map(i => i.name.length > 20 ? i.name.slice(0, 18) + '…' : i.name),
    datasets: [{ data: catTop.map(i => catTotal ? i.net_sales / catTotal * 100 : 0), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };

  const catRevMap = {};
  items.forEach(i => { catRevMap[i.category] = (catRevMap[i.category] || 0) + i.net_sales; });
  const catRevSorted = Object.entries(catRevMap).sort((a, b) => b[1] - a[1]);
  const catRevChart = {
    labels: catRevSorted.map(([k]) => k),
    datasets: [{ data: catRevSorted.map(([, v]) => v), backgroundColor: CHART_COLOR, borderRadius: 4 }],
  };

  const topQty = [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 15);
  const topQtyChart = {
    labels: topQty.map(i => i.name.length > 22 ? i.name.slice(0, 20) + '…' : i.name),
    datasets: [{ data: topQty.map(i => i.quantity), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };

  const barOpts = (fmt) => ({
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
    scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { callback: fmt, font: { size: 10 } }, grid: { color: '#f3f4f6' } } },
  });
  const hbarOpts = (fmt) => ({
    indexAxis: 'y', responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
    scales: { x: { ticks: { callback: fmt, font: { size: 10 } }, grid: { color: '#f3f4f6' } }, y: { ticks: { font: { size: 10 } } } },
  });

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={f => { setFilterCat(f.cat); setFilterME(f.me); }} />

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Menu mix by sub-category (% quantity)</h3>
          <Bar data={subcatChart} options={barOpts(v => v.toFixed(1) + '%')} />
        </div>
        <div className="chart-card">
          <h3>{cat} breakdown by item (% sales)</h3>
          <Bar data={catBreakdownChart} options={hbarOpts(v => v.toFixed(1) + '%')} />
        </div>
      </div>

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Revenue by category</h3>
          <Bar data={catRevChart} options={barOpts(fmtK)} />
        </div>
        <div className="chart-card">
          <h3>Most sold items (top 15 by quantity)</h3>
          <Bar data={topQtyChart} options={hbarOpts(fmtN)} />
        </div>
      </div>
    </div>
  );
}
