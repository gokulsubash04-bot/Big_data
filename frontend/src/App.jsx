import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutiveOverview from './components/ExecutiveOverview';
import ClickstreamFunnel from './components/ClickstreamFunnel';
import RFMTable from './components/RFMTable';
import CohortMatrix from './components/CohortMatrix';
import MarketBasket from './components/MarketBasket';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState({
    customer_summary: [],
    rfm_segments: [],
    cohort_matrix: [],
    market_basket_rules: [],
    clickstream_funnel: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8501/api/data';

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="main-content">
        <Header activeView={activeView} />

        <div className="content-scroll">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
              <h3>⚡ Loading PySpark Analytics Data...</h3>
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--rose)', borderRadius: '12px', padding: '24px', color: 'var(--rose)' }}>
              <h3>⚠️ Unable to connect to Python Analytics API (port 8501)</h3>
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                Please make sure the Python server is running: <code>python app.py</code>
              </p>
            </div>
          ) : (
            <>
              {activeView === 'overview' && <ExecutiveOverview data={data} />}
              {activeView === 'clickstream' && <ClickstreamFunnel data={data} />}
              {activeView === 'rfm' && <RFMTable data={data} />}
              {activeView === 'cohorts' && <CohortMatrix data={data} />}
              {activeView === 'basket' && <MarketBasket data={data} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
