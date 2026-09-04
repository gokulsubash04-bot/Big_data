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
    <div>
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
    </div>
  );
}
