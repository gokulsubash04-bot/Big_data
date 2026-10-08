import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function ExecutiveOverview({ data, onNavigateTab }) {
  const { customer_summary = [], rfm_segments = [], product_restock = {} } = data;

  const totalRevenue = customer_summary.reduce((acc, c) => acc + (Number(c.total_monetary_spend) || 0), 0);
  const activeCustomers = customer_summary.length;
  const totalOrders = customer_summary.reduce((acc, c) => acc + (Number(c.transaction_frequency) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const restockKPIs = product_restock.kpis || {};
  const topCriticalItems = (product_restock.top_restock_recommendations || []).slice(0, 4);

  // RFM Segment Distribution Chart
  const segCounts = rfm_segments.reduce((acc, c) => {
    const seg = c.customer_segment || 'Other';
    acc[seg] = (acc[seg] || 0) + 1;
    return acc;
  }, {});

  const rfmChartData = {
    labels: Object.keys(segCounts),
    datasets: [
      {
        data: Object.values(segCounts),
        backgroundColor: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#9ca3af'],
        borderWidth: 2,
        borderColor: '#111827'
      }
    ]
  };

  const rfmChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#d1d5db', font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  // Electronics Category Distribution Chart
  const electronicsCategoryData = {
    labels: ['Smartphones', 'Laptops', 'Headphones', 'Monitors', 'Tablets', 'Smartwatches', 'Keyboards', 'Mouse', 'Chargers'],
    datasets: [
      {
        label: 'Electronics Category Demand Share',
        data: [28, 22, 14, 10, 9, 7, 4, 3, 3],
        backgroundColor: ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'],
        borderRadius: 6
      }
    ]
  };

  const categoryChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Electronics Store Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Total Electronics Sales</span>
            <span>💰</span>
          </div>
          <div className="metric-val">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="metric-change">▲ Electronics Revenue</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Active Customers</span>
            <span>👥</span>
          </div>
          <div className="metric-val">{activeCustomers.toLocaleString()}</div>
          <div className="metric-change">▲ Electronics Buyers</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Invoiced Orders</span>
            <span>📦</span>
          </div>
          <div className="metric-val">{totalOrders.toLocaleString()}</div>
          <div className="metric-change">▲ Electronics Purchases</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Average Order Value (AOV)</span>
            <span>💳</span>
          </div>
          <div className="metric-val">${avgOrderValue.toFixed(2)}</div>
          <div className="metric-change">▲ High Tech Order Value</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>👥 Customer RFM Segment Distribution</h3>
              <p>PySpark Quantile Scoring & K-Means Behavioral Clusters</p>
            </div>
          </div>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={rfmChartData} options={rfmChartOptions} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>📱 Electronics Store Category Demand</h3>
              <p>Smartphones, Laptops, Headphones, Monitors & Accessories</p>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={electronicsCategoryData} options={categoryChartOptions} />
          </div>
        </div>
      </div>

      {/* High-Priority Restock Notification Banner */}
      <div className="panel" style={{ borderLeft: '4px solid #ef4444' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
              🚨 Inventory Alert: Products Needing Urgent Restock
            </h3>
            <p>
              {restockKPIs.critical_stockout_items || topCriticalItems.length} products are facing immediate stockouts due to high purchase velocity. Total recommended reorder: <strong>{Number(restockKPIs.total_recommended_restock_units || 0).toLocaleString()} units</strong>.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('restock')}
              style={{
                background: 'var(--emerald)',
                color: '#0f172a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📦 View Full Restock Plan →
            </button>
          )}
        </div>

        {topCriticalItems.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {topCriticalItems.map(item => (
              <div
                key={item.product_id}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>{item.product_id}</span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#f8fafc' }}>{item.product_name}</h4>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                    {item.current_stock} left
                  </span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Reorder Need:</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                    +{item.recommended_restock_units} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
