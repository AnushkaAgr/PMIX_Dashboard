'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSheets, fetchData } from '@/lib/api';
import OverviewPanel from '@/components/OverviewPanel';
import MenuMixPanel from '@/components/MenuMixPanel';
import MEPanel from '@/components/MEPanel';
import ChannelsPanel from '@/components/ChannelsPanel';
import BikkyPanel from '@/components/BikkyPanel';
import BYOPanel from '@/components/BYOPanel';
import AllItemsPanel from '@/components/AllItemsPanel';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'menu-mix',  label: 'Menu Mix' },
  { id: 'byo',       label: 'BYO Breakdown' },
  { id: 'me',        label: 'Menu Engineering' },
  { id: 'channels',  label: 'Channels' },
  { id: 'bikky',     label: 'Customer Retention' },
  { id: 'items',     label: 'All Items' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!localStorage.getItem('pmix_token')) {
      router.replace('/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetchSheets()
      .then(list => {
        setSheets(list);
        if (list.length > 0) setSelectedFile(list[0].filename);
        else setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [authChecked]);

  useEffect(() => {
    if (!selectedFile) return;
    setDataLoading(true);
    setError('');
    fetchData(selectedFile)
      .then(d => { setData(d); setLoading(false); setDataLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); setDataLoading(false); });
  }, [selectedFile]);

  function handleLogout() {
    localStorage.removeItem('pmix_token');
    router.replace('/login');
  }

  if (!authChecked || loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="loading-screen">
        <span style={{ color: '#dc2626' }}>{error}</span>
        <button onClick={handleLogout} style={{ marginTop: 12, padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Sign out</button>
      </div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="container">
      <div className="header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>RASA · Menu Product Mix Dashboard</h1>
            {data?.meta?.period && <span className="period-badge">{data.meta.period}</span>}
          </div>
          <div className="header-sub">
            {data ? `${data.meta.item_count} menu items · Source: ${data.meta.source_file}` : 'Loading…'}
          </div>
        </div>
        <div className="header-right">
          <img src="/WhiteLogo.png" alt="Kutlerri" className="header-logo" />
        </div>
      </div>

      <div className="tabs-row">
        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tabs-controls">
          {sheets.length > 1 && (
            <div className="period-selector">
              <label>Period:</label>
              <select
                className="period-select"
                value={selectedFile}
                onChange={e => setSelectedFile(e.target.value)}
              >
                {sheets.map(s => (
                  <option key={s.filename} value={s.filename}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {dataLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Loading period data…
        </div>
      )}

      {!dataLoading && data && (
        <>
          {activeTab === 'overview' && (
            <OverviewPanel
              items={items}
              channelTotals={data.channel_totals}
            />
          )}
          {activeTab === 'menu-mix' && <MenuMixPanel allItems={items} />}
          {activeTab === 'byo' && <BYOPanel byo={data.byo} />}
          {activeTab === 'me' && <MEPanel allItems={items} />}
          {activeTab === 'channels' && <ChannelsPanel allItems={items} />}
          {activeTab === 'bikky' && <BikkyPanel allItems={items} />}
          {activeTab === 'items' && <AllItemsPanel allItems={items} />}
        </>
      )}
    </div>
  );
}
