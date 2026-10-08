import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DEFAULT_ANALYTICS_DATA = {
  kpi_summary: {
    total_revenue: 25577303.0,
    total_orders: 8277,
    average_order_value: 3090.17,
    unique_customers: 2414,
    repeat_customer_rate: 87.03,
    clickstream_conversion_rate: 21.51,
    total_at_risk_customers: 454,
    total_products_requiring_restock: 11
  },
  top_5_products: [
    { rank: 1, product_id: 'P005', product_name: 'MacBook Pro 16" M3 Max', category: 'Laptops', units_sold: 1322, total_revenue: 3303678.0, unit_price: 2499.0 },
    { rank: 2, product_id: 'P006', product_name: 'Dell XPS 15 OLED', category: 'Laptops', units_sold: 1319, total_revenue: 2372881.0, unit_price: 1799.0 },
    { rank: 3, product_id: 'P008', product_name: 'Lenovo ThinkPad X1 Carbon', category: 'Laptops', units_sold: 1257, total_revenue: 2009943.0, unit_price: 1599.0 },
    { rank: 4, product_id: 'P007', product_name: 'HP Spectre x360 2-in-1', category: 'Laptops', units_sold: 1415, total_revenue: 1979585.0, unit_price: 1399.0 },
    { rank: 5, product_id: 'P025', product_name: 'Samsung Galaxy Tab S9 Ultra', category: 'Tablets', units_sold: 1350, total_revenue: 1618650.0, unit_price: 1199.0 }
  ],
  clickstream_funnel: {
    session_counts: { total_sessions: 15000, view: 13943, search: 5445, add_to_cart: 8710, purchase: 2999 },
    stage_conversions: { overall_conversion_pct: 21.51 }
  },
  rfm_segments_summary: {
    'Loyal Customers': 833,
    'Potential Loyalists': 451,
    'Champions': 437,
    'Lost': 400,
    'New Customers': 183,
    'At Risk': 110
  },
  at_risk_customers: [
    { customer_id: 'C1954', recency_days: 215, transaction_frequency: 4, total_monetary_spend: 18450.0, avg_order_value: 4612.5, customer_segment: 'At Risk' },
    { customer_id: 'C0812', recency_days: 198, transaction_frequency: 3, total_monetary_spend: 14200.0, avg_order_value: 4733.33, customer_segment: 'At Risk' },
    { customer_id: 'C1104', recency_days: 192, transaction_frequency: 5, total_monetary_spend: 13900.0, avg_order_value: 2780.0, customer_segment: 'At Risk' },
    { customer_id: 'C0235', recency_days: 188, transaction_frequency: 3, total_monetary_spend: 11500.0, avg_order_value: 3833.33, customer_segment: 'At Risk' }
  ],
  products_requiring_restock: [
    { product_id: 'P005', product_name: 'MacBook Pro 16" M3 Max', category: 'Laptops', current_stock: 478, reorder_point: 250, days_of_stock_remaining: 8.2, recommended_restock_units: 320, revenue_at_risk: 799680.0 },
    { product_id: 'P001', product_name: 'iPhone 15 Pro 256GB', category: 'Smartphones', current_stock: 312, reorder_point: 350, days_of_stock_remaining: 5.1, recommended_restock_units: 450, revenue_at_risk: 449550.0 },
    { product_id: 'P006', product_name: 'Dell XPS 15 OLED', category: 'Laptops', current_stock: 210, reorder_point: 250, days_of_stock_remaining: 4.5, recommended_restock_units: 280, revenue_at_risk: 503720.0 }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(DEFAULT_ANALYTICS_DATA);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((json) => {
        if (json && json.kpi_summary) {
          setData(json);
        }
      })
      .catch((err) => {
        console.warn('API fetch warning (using preloaded analytics payload):', err);
      });
  }, []);

  const kpi = data.kpi_summary || DEFAULT_ANALYTICS_DATA.kpi_summary;
  const top5 = data.top_5_products || DEFAULT_ANALYTICS_DATA.top_5_products;
  const funnel = data.clickstream_funnel || DEFAULT_ANALYTICS_DATA.clickstream_funnel;
  const rfmSummary = data.rfm_segments_summary || DEFAULT_ANALYTICS_DATA.rfm_segments_summary;
  const atRisk = data.at_risk_customers || DEFAULT_ANALYTICS_DATA.at_risk_customers;
  const restock = data.products_requiring_restock || DEFAULT_ANALYTICS_DATA.products_requiring_restock;

  // Bar Chart Data for Top 5 Products
  const topProductsChartData = {
    labels: top5.map((p) => p.product_name),
    datasets: [
      {
        label: 'Total Sales Revenue ($)',
        data: top5.map((p) => p.total_revenue),
        backgroundColor: 'rgba(56, 189, 248, 0.7)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const topProductsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value) => '$' + (value / 1000000).toFixed(1) + 'M'
        },
        grid: { color: '#334155' }
      }
    }
  };

  // RFM Doughnut Chart Data
  const rfmChartData = {
    labels: Object.keys(rfmSummary),
    datasets: [
      {
        data: Object.values(rfmSummary),
        backgroundColor: ['#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#fbbf24', '#f87171']
      }
    ]
  };

  const rfmChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } }
  };

  // Funnel Sessions
  const sessions = funnel.session_counts || { view: 13943, search: 5445, add_to_cart: 8710, purchase: 2999, total_sessions: 15000 };
  const totalSess = sessions.total_sessions || 15000;

  const filteredAtRisk = atRisk.filter((c) =>
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid #334155', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛒 Electronics E-Commerce Analytics Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>Real-World Big Data Pipeline & Business Intelligence Engine</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="http://localhost:9870" target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#f8fafc', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>🐘 HDFS NameNode (9870)</a>
          <a href="http://localhost:8088" target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#f8fafc', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>⚙️ YARN Resource (8088)</a>
          <a href="/api/data" target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#f8fafc', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>⚡ JSON Data API</a>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px' }}>
        {/* KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>${(kpi.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Completed Transactions</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>{(kpi.total_orders || 0).toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Unique Invoices Processed</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #a78bfa' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>AVERAGE ORDER VALUE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>${(kpi.average_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Revenue / Total Orders</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>UNIQUE CUSTOMERS</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>{(kpi.unique_customers || 0).toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Purchasing Accounts</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #fbbf24' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>REPEAT CUSTOMER RATE</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>{kpi.repeat_customer_rate || 0}%</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Customers with &gt;1 Order</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f87171' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>CLICKSTREAM CONVERSION</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>{kpi.clickstream_conversion_rate || 0}%</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sessions to Purchases</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', marginBottom: '24px' }}>
          {[
            { id: 'overview', label: 'Executive Overview' },
            { id: 'top-products', label: 'Top 5 Sales Products' },
            { id: 'rfm-atrisk', label: 'RFM & At-Risk Customers' },
            { id: 'restock', label: 'Inventory & Restock Intel' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === t.id ? '#38bdf8' : '#94a3b8',
                borderBottom: activeTab === t.id ? '2px solid #38bdf8' : '2px solid transparent',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Executive Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Top 5 Products by Sales Revenue</div>
                <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>Best Sellers</span>
              </div>
              <div style={{ height: '320px' }}>
                <Bar data={topProductsChartData} options={topProductsChartOptions} />
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Clickstream Conversion Funnel</div>
                <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>Session Journey</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'Total Sessions', count: totalSess, pct: 100, color: '#38bdf8' },
                  { name: 'View Products', count: sessions.view || 13943, pct: Math.round(((sessions.view || 13943) / totalSess) * 100), color: '#818cf8' },
                  { name: 'Search Catalog', count: sessions.search || 5445, pct: Math.round(((sessions.search || 5445) / totalSess) * 100), color: '#a78bfa' },
                  { name: 'Add to Cart', count: sessions.add_to_cart || 8710, pct: Math.round(((sessions.add_to_cart || 8710) / totalSess) * 100), color: '#fbbf24' },
                  { name: 'Completed Purchase', count: sessions.purchase || 2999, pct: Math.round(((sessions.purchase || 2999) / totalSess) * 100), color: '#34d399' }
                ].map((step, idx) => (
                  <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '13px' }}>
                      <span>{step.name}</span>
                      <span style={{ color: step.color }}>{step.count.toLocaleString()} ({step.pct}%)</span>
                    </div>
                    <div style={{ background: '#334155', height: '8px', borderRadius: '4px', width: '100%', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ background: step.color, height: '100%', width: `${step.pct}%`, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Top Products */}
        {activeTab === 'top-products' && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Top 5 Products Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Rank</th>
                  <th style={{ padding: '12px' }}>Product ID</th>
                  <th style={{ padding: '12px' }}>Product Name</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Unit Price</th>
                  <th style={{ padding: '12px' }}>Units Sold</th>
                  <th style={{ padding: '12px' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((p) => (
                  <tr key={p.rank} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>#{p.rank}</td>
                    <td style={{ padding: '12px' }}><code style={{ background: '#0f172a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>{p.product_id}</code></td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{p.product_name}</td>
                    <td style={{ padding: '12px' }}>{p.category}</td>
                    <td style={{ padding: '12px' }}>${p.unit_price.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>{p.units_sold.toLocaleString()} units</td>
                    <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>${p.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: RFM & At-Risk */}
        {activeTab === 'rfm-atrisk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>RFM Customer Segments Distribution</div>
                <div style={{ height: '300px' }}>
                  <Doughnut data={rfmChartData} options={rfmChartOptions} />
                </div>
              </div>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Segmentation Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                      <th style={{ padding: '10px' }}>Segment</th>
                      <th style={{ padding: '10px' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rfmSummary).map(([seg, count]) => (
                      <tr key={seg} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>{seg}</td>
                        <td style={{ padding: '10px' }}>{count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>⚠️ At-Risk Customers List ({atRisk.length})</div>
                <input
                  type="text"
                  placeholder="Search Customer ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Customer ID</th>
                    <th style={{ padding: '12px' }}>Recency (Days)</th>
                    <th style={{ padding: '12px' }}>Frequency</th>
                    <th style={{ padding: '12px' }}>Total Spend</th>
                    <th style={{ padding: '12px' }}>AOV</th>
                    <th style={{ padding: '12px' }}>Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtRisk.slice(0, 15).map((c) => (
                    <tr key={c.customer_id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px' }}><code style={{ background: '#0f172a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>{c.customer_id}</code></td>
                      <td style={{ padding: '12px', color: '#f87171', fontWeight: 700 }}>{c.recency_days} days ago</td>
                      <td style={{ padding: '12px' }}>{c.transaction_frequency} orders</td>
                      <td style={{ padding: '12px' }}>${c.total_monetary_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px' }}>${c.avg_order_value.toFixed(2)}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>{c.customer_segment}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Restock */}
        {activeTab === 'restock' && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🚨 Products Requiring Restock ({restock.length})</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Product ID</th>
                  <th style={{ padding: '12px' }}>Product Name</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Current Stock</th>
                  <th style={{ padding: '12px' }}>Reorder Point</th>
                  <th style={{ padding: '12px' }}>Days Left</th>
                  <th style={{ padding: '12px' }}>Rec. Order Units</th>
                  <th style={{ padding: '12px' }}>Revenue at Risk</th>
                </tr>
              </thead>
              <tbody>
                {restock.map((p) => (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px' }}><code style={{ background: '#0f172a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>{p.product_id}</code></td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{p.product_name}</td>
                    <td style={{ padding: '12px' }}>{p.category}</td>
                    <td style={{ padding: '12px', color: '#f87171', fontWeight: 700 }}>{p.current_stock}</td>
                    <td style={{ padding: '12px' }}>{p.reorder_point}</td>
                    <td style={{ padding: '12px' }}>~{p.days_of_stock_remaining} days</td>
                    <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 700 }}>+{p.recommended_restock_units.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#fbbf24' }}>${p.revenue_at_risk.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
