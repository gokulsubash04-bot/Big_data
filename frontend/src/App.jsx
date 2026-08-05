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
    const urlsToTry = [
      'http://localhost:8501/api/data',
      '/api/data'
    ];

    let currentIdx = 0;

    const tryFetch = () => {
      if (currentIdx >= urlsToTry.length) {
        setError('Backend server not responding on port 8501.');
        setLoading(false);
        return;
      }

      const url = urlsToTry[currentIdx];
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          return res.json();
        })
        .then((json) => {
          setData(json);
          setLoading(false);
          setError(null);
        })
        .catch(() => {
          currentIdx++;
          tryFetch();
        });
    };

    tryFetch();
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
              <h3 style={{ margin: 0, fontSize: '18px' }}>⚠️ Unable to Connect to Python Backend API Server</h3>
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                The React frontend is running, but the Python backend server (<code>app.py</code>) is not running on port <strong>8501</strong>.
              </p>
              <div style={{ marginTop: '16px', background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--cyan)', fontSize: '13px' }}>💡 How to Fix:</p>
                <ol style={{ margin: '8px 0 0 20px', padding: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  <li>Open a new terminal window in the project folder.</li>
                  <li>Run the command: <code style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>python app.py</code></li>
                  <li>Refresh this browser page.</li>
                </ol>
              </div>
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
