import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ClickstreamFunnel({ data }) {
  const funnel = data.clickstream_funnel || {};
  const evCounts = funnel.event_counts || {};
  const sessCounts = funnel.session_counts || {};
  const conversions = funnel.stage_conversions || {};
  const dropOffs = funnel.stage_drop_offs || {};
  const devices = funnel.device_breakdown || {};

  const totalEv = Object.values(evCounts).reduce((a, b) => a + Number(b), 0);
  const totalSess = sessCounts.total_sessions || sessCounts.view || 0;

  // Funnel Volume Chart Data
  const volumeChartData = {
    labels: ['Page Views', 'Product Searches', 'Add to Cart', 'Purchases'],
    datasets: [
      {
        label: 'Total Event Volume',
        data: [evCounts.view || 0, evCounts.search || 0, evCounts.add_to_cart || 0, evCounts.purchase || 0],
        backgroundColor: ['#06b6d4', '#6366f1', '#f59e0b', '#10b981'],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
    }
  };

  // Device Breakdown Chart Data
  const devLabels = Object.keys(devices);
  const deviceChartData = {
    labels: devLabels,
    datasets: [
      { label: 'View → Cart %', data: devLabels.map(d => devices[d].view_to_cart_pct), backgroundColor: '#06b6d4', borderRadius: 4 },
      { label: 'Cart → Purch %', data: devLabels.map(d => devices[d].cart_to_purchase_pct), backgroundColor: '#f59e0b', borderRadius: 4 },
      { label: 'Overall Conv %', data: devLabels.map(d => devices[d].overall_conversion_pct), backgroundColor: '#10b981', borderRadius: 4 }
    ]
  };

  const deviceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#d1d5db', font: { family: 'Plus Jakarta Sans' } } } },
    scales: {
      x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
    }
  };

  // Funnel Stages Flow definition
  const stages = [
    { id: 'view', name: '1. Page Views', count: evCounts.view || 0, sess: sessCounts.view || 0, icon: '👁️', color: '#06b6d4', convPct: 100 },
    { id: 'search', name: '2. Product Searches', count: evCounts.search || 0, sess: sessCounts.search || 0, icon: '🔍', color: '#6366f1', convPct: conversions.view_to_search, dropPct: dropOffs.view_to_search_drop_pct, dropCount: dropOffs.view_to_search_drop_count },
    { id: 'cart', name: '3. Add to Cart', count: evCounts.add_to_cart || 0, sess: sessCounts.add_to_cart || 0, icon: '🛒', color: '#f59e0b', convPct: conversions.search_to_cart, dropPct: dropOffs.search_to_cart_drop_pct, dropCount: dropOffs.search_to_cart_drop_count },
    { id: 'purchase', name: '4. Purchase Completed', count: evCounts.purchase || 0, sess: sessCounts.purchase || 0, icon: '🎉', color: '#10b981', convPct: conversions.cart_to_purchase, dropPct: dropOffs.cart_to_purchase_drop_pct, dropCount: dropOffs.cart_to_purchase_drop_count }
  ];

  // Highest drop-off calculation
  const highestDrop = Object.entries({
    'View → Search': dropOffs.view_to_search_drop_pct || 0,
    'Search → Cart': dropOffs.search_to_cart_drop_pct || 0,
    'Cart → Purchase': dropOffs.cart_to_purchase_drop_pct || 0
  }).sort((a, b) => b[1] - a[1])[0];

  const highestStageName = highestDrop ? highestDrop[0] : 'Checkout';
  const highestDropPct = highestDrop ? highestDrop[1] : 0;

  return (
    <div>
      {/* Top Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top"><span className="metric-lbl">Total Events</span><span>🌐</span></div>
          <div className="metric-val">{totalEv.toLocaleString()}</div>
          <div className="metric-change">Raw User Interactions</div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span className="metric-lbl">Total Sessions</span><span>📱</span></div>
          <div className="metric-val">{totalSess.toLocaleString()}</div>
          <div className="metric-change">Unique User Sessions</div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span className="metric-lbl">Cart → Purchase Rate</span><span>🛒</span></div>
          <div className="metric-val">{conversions.cart_to_purchase || 0}%</div>
          <div className="metric-change" style={{ color: 'var(--emerald)' }}>Checkout Intent Conversion</div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span className="metric-lbl">Overall Conversion</span><span>🎯</span></div>
          <div className="metric-val">{conversions.overall_conversion || 0}%</div>
          <div className="metric-change" style={{ color: 'var(--cyan)' }}>View → Purchase Conversion</div>
        </div>
      </div>

      {/* Stage Progression Step Cards */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <h3>📊 Stage-by-Stage Conversion Funnel Flow</h3>
            <p>User volume, conversion efficiency, and stage drop-off diagnostics</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {stages.map((st, idx) => (
            <div
              key={st.id}
              style={{
                background: '#0f172a',
                border: '1px solid var(--card-border)',
                borderTop: `4px solid ${st.color}`,
                borderRadius: '10px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>{st.icon}</span>
                <span className="pill" style={{ background: `${st.color}20`, color: st.color, fontWeight: 700 }}>
                  Step {idx + 1}
                </span>
              </div>
              <h4 style={{ margin: '12px 0 4px 0', color: 'var(--text-heading)', fontSize: '15px', fontWeight: 700 }}>
                {st.name}
              </h4>
              <div style={{ fontSize: '22px', fontWeight: 800, color: st.color }}>
                {st.count.toLocaleString()}{' '}
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>events</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {st.sess.toLocaleString()} unique sessions
              </div>

              {idx > 0 ? (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--emerald)' }}>
                    <span>Step Conversion:</span> <strong>{st.convPct}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--rose)', marginTop: '4px' }}>
                    <span>Stage Drop-off:</span> <strong>-{st.dropPct}% ({(st.dropCount || 0).toLocaleString()} sess)</strong>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Baseline User Traffic (100%)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>🌐 Stage Event Volume Conversion</h3>
              <p>Event breakdown from page load to completed order</p>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={volumeChartData} options={chartOptions} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>💻 Device Conversion Breakdown</h3>
              <p>Conversion metrics across Mobile, Desktop, and Tablet</p>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={deviceChartData} options={deviceChartOptions} />
          </div>
        </div>
      </div>

      {/* Device Table & Diagnostics Grid */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>📱 Device Performance Matrix</h3>
              <p>Conversion rates and session efficiency by device type</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Sessions</th>
                  <th>Views</th>
                  <th>Carts</th>
                  <th>Purchases</th>
                  <th>View→Cart %</th>
                  <th>Cart→Purch %</th>
                  <th>Overall Conv %</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(devices).map((dev) => {
                  const d = devices[dev];
                  const statusPill =
                    d.overall_conversion_pct > 15 ? (
                      <span className="pill pill-champions">Top Performer</span>
                    ) : d.overall_conversion_pct > 8 ? (
                      <span className="pill pill-loyal">Average</span>
                    ) : (
                      <span className="pill pill-atrisk">Needs UX Fix</span>
                    );

                  return (
                    <tr key={dev}>
                      <td><strong>{dev}</strong></td>
                      <td>{(d.total_sessions || 0).toLocaleString()}</td>
                      <td>{(d.views || 0).toLocaleString()}</td>
                      <td>{(d.add_to_carts || 0).toLocaleString()}</td>
                      <td>{(d.purchases || 0).toLocaleString()}</td>
                      <td>{d.view_to_cart_pct}%</td>
                      <td>{d.cart_to_purchase_pct}%</td>
                      <td><strong>{d.overall_conversion_pct}%</strong> {statusPill}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>⚡ Optimization Diagnostics & Recommendations</h3>
              <p>Automated friction detection and actionable UX recovery steps</p>
            </div>
          </div>

          <div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontWeight: 700, fontSize: '14px' }}>
                ⚠️ High Friction Stage: {highestStageName} ({highestDropPct}% Drop-off)
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '8px', lineHeight: 1.5 }}>
                The primary bottleneck occurs at <strong>{highestStageName}</strong>. Streamlining this transition will directly increase overall store revenue.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#0f172a', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>💡 Recommendation 1: Express 1-Click Checkout</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enable Apple Pay / Google Pay to bypass lengthy registration forms during checkout.</div>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>💡 Recommendation 2: Cart Abandonment Nudges</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trigger exit-intent popups and automated email reminders at 30 minutes post-cart abandonment.</div>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>💡 Recommendation 3: Mobile Viewport Optimization</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Implement sticky "Add to Cart" and floating mobile sticky checkout buttons to boost mobile conversion rates.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
