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

export default function ExecutiveOverview({ data }) {
  const { customer_summary = [], rfm_segments = [], clickstream_funnel = {} } = data;

  const totalRevenue = customer_summary.reduce((acc, c) => acc + (Number(c.total_monetary_spend) || 0), 0);
  const activeCustomers = customer_summary.length;
  const totalOrders = customer_summary.reduce((acc, c) => acc + (Number(c.transaction_frequency) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // RFM Doughnut Chart Data
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

  // Clickstream Overview Bar Chart Data
  const evCounts = clickstream_funnel.event_counts || { view: 0, search: 0, add_to_cart: 0, purchase: 0 };
  const funnelBarData = {
    labels: ['Page Views', 'Searches', 'Add to Cart', 'Purchases'],
    datasets: [
      {
        label: 'Event Volume',
        data: [evCounts.view || 0, evCounts.search || 0, evCounts.add_to_cart || 0, evCounts.purchase || 0],
        backgroundColor: ['#06b6d4', '#6366f1', '#f59e0b', '#10b981'],
        borderRadius: 6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
    }
  };

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Total Gross Revenue</span>
            <span>💰</span>
          </div>
          <div className="metric-val">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="metric-change">▲ Enterprise Gross Sales</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Active Customers</span>
            <span>👥</span>
          </div>
          <div className="metric-val">{activeCustomers.toLocaleString()}</div>
          <div className="metric-change">▲ Active Accounts</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Completed Transactions</span>
            <span>📦</span>
          </div>
          <div className="metric-val">{totalOrders.toLocaleString()}</div>
          <div className="metric-change">▲ Invoiced Purchases</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-lbl">Average Order Value</span>
            <span>💳</span>
          </div>
          <div className="metric-val">${avgOrderValue.toFixed(2)}</div>
          <div className="metric-change">▲ High Basket Spend</div>
        </div>
      </div>

      {/* Overview Charts Grid */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>👥 Customer RFM Segment Distribution</h3>
              <p>PySpark Quantile Scoring & Behavioral Clustering</p>
            </div>
          </div>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={rfmChartData} options={rfmChartOptions} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>🌐 Clickstream Event Conversion Funnel</h3>
              <p>Browsing Sessions: Views → Searches → Carts → Purchases</p>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={funnelBarData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
