'use client';

import { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, BubbleController, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import FilterBar from './FilterBar';
import { fmtK, fmtN, fmtPct, COLORS, CHART_COLOR } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, BubbleController, Title, Tooltip, Legend);

export default function OverviewPanel({ items: allItems, channelTotals }) {
  const [filterCat, setFilterCat] = useState('all');
  const [filterME, setFilterME] = useState('all');

  if (!allItems) return null;

  const items = allItems.filter(i =>
    (filterCat === 'all' || i.category === filterCat) &&
    (filterME === 'all' || i.me_quadrant === filterME)
  );

  const rev = items.reduce((a, i) => a + i.net_sales, 0);
  const qty = items.reduce((a, i) => a + i.quantity, 0);
  const margin = items.reduce((a, i) => a + i.total_margin, 0);
  const avgM = rev ? margin / rev * 100 : 0;
  const starRev = items.filter(i => i.me_quadrant === 'Star').reduce((a, i) => a + i.net_sales, 0);
  const starCarry = rev ? starRev / rev * 100 : 0;

  const catRevMap = {};
  items.forEach(i => { catRevMap[i.category] = (catRevMap[i.category] || 0) + i.net_sales; });
  const catSorted = Object.entries(catRevMap).sort((a, b) => b[1] - a[1]);
  const catRevChart = {
    labels: catSorted.map(([k]) => k),
    datasets: [{ data: catSorted.map(([, v]) => v), backgroundColor: CHART_COLOR, borderRadius: 4 }],
  };

  const quads = ['Star', 'Plow Horse', 'Puzzle', 'Dog'];
  const meRevVals = quads.map(q => items.filter(i => i.me_quadrant === q).reduce((a, i) => a + i.net_sales, 0));
  const meRevChart = {
    labels: quads,
    datasets: [{ data: meRevVals, backgroundColor: quads.map(q => COLORS[q]), borderWidth: 2, borderColor: '#fff' }],
  };

  const top10 = [...items].sort((a, b) => b.net_sales - a.net_sales).slice(0, 10);
  const top10Chart = {
    labels: top10.map(i => i.name.length > 22 ? i.name.slice(0, 20) + '…' : i.name),
    datasets: [{ data: top10.map(i => i.net_sales), backgroundColor: CHART_COLOR, borderRadius: 3 }],
  };

  const ih = items.reduce((a, i) => a + i.ih_sales, 0);
  const _3p = items.reduce((a, i) => a + i.threedp_sales, 0);
  const lo = items.reduce((a, i) => a + i.lo_sales, 0);
  const chLabels = ['In-House', '3rd Party Delivery', 'Loyalty'];
  const chVals = [ih, _3p, lo];
  const chChart = {
    labels: chLabels,
    datasets: [{ data: chVals, backgroundColor: [COLORS.inhouse, COLORS.delivery, COLORS.loyalty], borderWidth: 2, borderColor: '#fff' }],
  };

  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtK(c.raw) } } },
    scales: { x: { ticks: { font: { size: 11 } } }, y: { ticks: { callback: fmtK, font: { size: 11 } }, grid: { color: '#f3f4f6' } } },
  };
  const top10Opts = {
    indexAxis: 'y', responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => [fmtK(c.raw), 'ME: ' + (top10[c.dataIndex]?.me_quadrant || '')] } },
    },
    scales: { x: { ticks: { callback: fmtK, font: { size: 10 } }, grid: { color: '#f3f4f6' } }, y: { ticks: { font: { size: 10 } } } },
  };
  const donutOpts = (vals) => ({
    responsive: true, cutout: '60%',
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: c => { const t = vals.reduce((a, b) => a + b, 0); return `${c.label}: ${fmtK(c.raw)} (${t ? (c.raw / t * 100).toFixed(1) : 0}%)`; } } },
    },
  });

  return (
    <div>
      <FilterBar items={allItems} filterCat={filterCat} filterME={filterME} onChange={f => { setFilterCat(f.cat); setFilterME(f.me); }} />

      <div className="kpi-row">
        <div className="kpi-card accent">
          <div className="kpi-label">Net Revenue</div>
          <div className="kpi-value">{fmtK(rev)}</div>
          <div className="kpi-sub">{items.length} items</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Items Sold</div>
          <div className="kpi-value">{fmtN(qty)}</div>
          <div className="kpi-sub">units</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Avg Margin</div>
          <div className="kpi-value">{fmtPct(avgM)}</div>
          <div className="kpi-sub">blended</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Stars Carry</div>
          <div className="kpi-value">{fmtPct(starCarry)}</div>
          <div className="kpi-sub">of total revenue</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Margin $</div>
          <div className="kpi-value">{fmtK(margin)}</div>
          <div className="kpi-sub">blended</div>
        </div>
      </div>

      <div className="chart-row wide">
        <div className="chart-card">
          <h3>Revenue by category</h3>
          <Bar data={catRevChart} options={barOpts} />
        </div>
        <div className="chart-card">
          <h3>Menu engineering quadrant revenue</h3>
          <Doughnut data={meRevChart} options={donutOpts(meRevVals)} />
        </div>
      </div>

      <div className="chart-row two">
        <div className="chart-card">
          <h3>Top 10 items by net sales</h3>
          <Bar data={top10Chart} options={top10Opts} />
        </div>
        <div className="chart-card">
          <h3>Channel split — revenue</h3>
          <Doughnut data={chChart} options={donutOpts(chVals)} />
        </div>
      </div>
    </div>
  );
}
