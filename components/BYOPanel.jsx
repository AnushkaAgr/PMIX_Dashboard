'use client';

import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fmtN } from '@/lib/fmt';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const SEC_LABELS = {
  BASES: 'Bases', MAIN: 'Mains', 'EXTRA MAIN': 'Extra Mains',
  SAUCE: 'Sauces', VEGGIES: 'Veggies', TOPPINGS: 'Toppings',
  'CHUTNEY AND DRESSINGS': 'Chutneys & Dressings', 'MAKE IT MEAL': 'Make It a Meal',
};
const SEC_COLORS = {
  BASES: '#7c3aed', MAIN: '#3a7be0', 'EXTRA MAIN': '#6366f1',
  SAUCE: '#10b981', VEGGIES: '#f59e0b', TOPPINGS: '#8b5cf6',
  'CHUTNEY AND DRESSINGS': '#f472b6', 'MAKE IT MEAL': '#14b8a6',
};
const SEC_ORDER = ['BASES', 'MAIN', 'EXTRA MAIN', 'SAUCE', 'VEGGIES', 'TOPPINGS', 'CHUTNEY AND DRESSINGS', 'MAKE IT MEAL'];

function getDataSource(byo, activeItem, channel) {
  const chData = channel === 'ih' ? byo.ih_data : channel === 'lo3p' ? byo.lo3p_data : null;
  if (activeItem === 'all') {
    if (!chData) return byo.aggregated;
    const agg = {};
    Object.values(chData).forEach(secs =>
      Object.entries(secs).forEach(([sec, mods]) => {
        if (!agg[sec]) agg[sec] = {};
        mods.forEach(m => { agg[sec][m.modifier] = (agg[sec][m.modifier] || 0) + m.qty; });
      })
    );
    return Object.fromEntries(Object.entries(agg).map(([s, mods]) =>
      [s, Object.entries(mods).map(([modifier, qty]) => ({ modifier, qty })).sort((a, b) => b.qty - a.qty)]
    ));
  }
  return (chData ? chData[activeItem] : byo.by_item[activeItem]) || {};
}

export default function BYOPanel({ byo }) {
  const [activeItem, setActiveItem] = useState('all');
  const [channel, setChannel] = useState('all');
  const [secFilter, setSecFilter] = useState('all');

  if (!byo || !byo.items?.length) {
    return <div className="chart-card"><p style={{ color: 'var(--muted)', fontSize: 13 }}>No BYO data found in this file.</p></div>;
  }

  const dataSource = getDataSource(byo, activeItem, channel);
  const sections = secFilter === 'all' ? SEC_ORDER : [secFilter];
  const activeSections = sections.filter(s => dataSource[s]?.length);

  const modifierCosts = byo.modifier_costs || {};

  const tableRows = [];
  activeSections.forEach(sec => {
    const mods = dataSource[sec] || [];
    const total = mods.reduce((a, b) => a + b.qty, 0);
    mods.forEach(m => {
      tableRows.push({
        modifier: m.modifier, section: sec, sectionLabel: SEC_LABELS[sec] || sec,
        qty: m.qty, avg_cost: modifierCosts[m.modifier] ?? null,
        pct: total ? m.qty / total * 100 : 0,
      });
    });
  });
  tableRows.sort((a, b) => b.qty - a.qty);

  const chBtns = [
    { id: 'all', label: 'Blended' },
    { id: 'ih', label: 'In-House' },
    { id: 'lo3p', label: 'Loyalty+3PD' },
  ];

  const itemDisplay = activeItem === 'all' ? '(all)' : activeItem;
  const tableTitle = activeItem === 'all'
    ? 'BYO modifier detail — all items (aggregated)'
    : `BYO modifier detail — ${activeItem}`;

  return (
    <div>
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px 10px',
          boxShadow: 'var(--shadow)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Channel:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {chBtns.map(b => (
              <button
                key={b.id}
                className={`byo-item-btn${channel === b.id ? ' active' : ''}`}
                onClick={() => setChannel(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>Item:</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`byo-item-btn${activeItem === 'all' ? ' active' : ''}`} onClick={() => setActiveItem('all')}>All items</button>
          {byo.items.map(item => (
            <button key={item} className={`byo-item-btn${activeItem === item ? ' active' : ''}`} onClick={() => setActiveItem(item)}>{item}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Section:</span>
          <select
            className="tab-filter-select"
            value={secFilter}
            onChange={e => setSecFilter(e.target.value)}
          >
            <option value="all">All sections</option>
            {SEC_ORDER.map(s => <option key={s} value={s}>{SEC_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="byo-charts-grid">
        {activeSections.map(sec => {
          const mods = (dataSource[sec] || []).filter(m => !m.modifier.startsWith('Skip'));
          if (!mods.length) return null;
          const total = mods.reduce((a, b) => a + b.qty, 0);
          const top = mods.slice(0, 8);
          const color = SEC_COLORS[sec] || '#6b7280';
          const chartData = {
            labels: top.map(m => m.modifier.length > 24 ? m.modifier.slice(0, 22) + '…' : m.modifier),
            datasets: [{ data: top.map(m => m.qty), backgroundColor: color + 'cc', borderColor: color, borderWidth: 1, borderRadius: 4 }],
          };
          const opts = {
            indexAxis: 'y', responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => [fmtN(c.raw) + ' orders', (c.raw / total * 100).toFixed(1) + '% of section'] } } },
            scales: { x: { ticks: { font: { size: 10 } }, grid: { color: '#f3f4f6' } }, y: { ticks: { font: { size: 10 } } } },
          };
          return (
            <div key={sec} className="chart-card">
              <h3>{SEC_LABELS[sec] || sec}</h3>
              <Bar data={chartData} options={opts} />
            </div>
          );
        })}
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h3>{tableTitle}</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Modifier</th>
                <th>Section</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Avg Cost</th>
                <th style={{ textAlign: 'right' }}>% of section</th>
                <th>Volume bar</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(0, 60).map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{r.modifier}</td>
                  <td><span style={{ background: '#9f7cef22', color: '#9f7cef', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{r.sectionLabel}</span></td>
                  <td>{itemDisplay}</td>
                  <td style={{ textAlign: 'right' }}>{fmtN(r.qty)}</td>
                  <td style={{ textAlign: 'right' }}>{r.avg_cost != null ? '$' + r.avg_cost.toFixed(2) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{r.pct.toFixed(1)}%</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min(100, r.pct)}%`, background: '#9f7cef' }} /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
