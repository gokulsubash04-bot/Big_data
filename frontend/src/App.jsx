import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExecutiveOverview from './components/ExecutiveOverview';
import CustomerAnalysis from './components/CustomerAnalysis';
import ProductRestockAnalysis from './components/ProductRestockAnalysis';
import ClickstreamFunnel from './components/ClickstreamFunnel';
import HadoopCluster from './components/HadoopCluster';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState({
    customer_summary: [],
    rfm_segments: [],
    cohort_matrix: [],
    clickstream_funnel: {},
    product_restock: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlsToTry = [
      '/api/data',
      'http://localhost:8501/api/data'
    ];

    let currentIdx = 0;

    const tryFetch = () => {
      if (currentIdx >= urlsToTry.length) {
        setError('Backend server not responding on /api/data.');
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
          // Reconcile root API vs legacy API format if needed
          const formattedData = {
            customer_summary: json.customer_summary || json.at_risk_customers || [],
            rfm_segments: json.rfm_segments || json.at_risk_customers || [],
            cohort_matrix: json.cohort_matrix || [],
            clickstream_funnel: json.clickstream_funnel || {},
            product_restock: json.product_restock || {
              all_products: json.products_requiring_restock || [],
              kpis: json.kpi_summary || {},
              top_restock_recommendations: json.products_requiring_restock || []
            },
            kpi_summary: json.kpi_summary || {},
            top_5_products: json.top_5_products || [],
            at_risk_customers: json.at_risk_customers || []
          };
          setData(formattedData);
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
        <Header activeView={activeView} setActiveView={setActiveView} />

        <div className="content-scroll">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
              <h3>⚡ Loading E-Commerce Big Data Analytics...</h3>
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--rose)', borderRadius: '12px', padding: '24px', color: 'var(--rose)' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>⚠️ Unable to Connect to Python Backend API Server</h3>
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                The React frontend is running, but the Python API endpoint (<code>/api/data</code>) did not return data.
              </p>
            </div>
          ) : (
            <>
              {activeView === 'overview' && <ExecutiveOverview data={data} onNavigateTab={setActiveView} />}
              {activeView === 'customer_analysis' && <CustomerAnalysis data={data} />}
              {activeView === 'restock' && <ProductRestockAnalysis data={data} />}
              {activeView === 'funnel' && <ClickstreamFunnel data={data} />}
              {activeView === 'hadoop' && <HadoopCluster />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
