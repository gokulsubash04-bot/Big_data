import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function RFMTable({ data }) {
  const rfmRows = data.rfm_segments || [];
  const [search, setSearch] = useState('');

  const filtered = rfmRows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.customer_id || '').toLowerCase().includes(q) ||
      (r.customer_segment || '').toLowerCase().includes(q) ||
      (r.rfm_score || '').toLowerCase().includes(q) ||
      (r.cluster_id || '').toLowerCase().includes(q)
    );
  });

  const getPillClass = (segment) => {
    const seg = (segment || '').toLowerCase().replace(/[^a-z]/g, '');
    if (seg.includes('champion')) return 'pill-champions';
    if (seg.includes('loyal')) return 'pill-loyal';
    if (seg.includes('potential')) return 'pill-potential';
    if (seg.includes('new')) return 'pill-new';
    if (seg.includes('risk')) return 'pill-atrisk';
    return 'pill-lost';
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>👥 RFM Segmentation & Customer Behavioral Profiles</h3>
          <p>Recency (Days), Frequency (Orders), Monetary Spend ($), Rule Segments, and K-Means Clusters</p>
        </div>
      </div>

      <div className="filter-row">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-box"
            style={{ paddingLeft: '36px' }}
            placeholder="Search Customer ID, Segment, Score, or Cluster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Segment</th>
              <th>RFM Score</th>
              <th>Cluster</th>
              <th>Recency</th>
              <th>Frequency</th>
              <th>Monetary Spend ($)</th>
              <th>AOV ($)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((r, idx) => {
              const spend = Number(r.total_monetary_spend || r.monetary || 0);
              const freq = Number(r.transaction_frequency || r.frequency || 0);
              const aov = Number(r.avg_order_value || (freq > 0 ? spend / freq : 0));

              return (
                <tr key={r.customer_id || idx}>
                  <td><strong>{r.customer_id}</strong></td>
                  <td>
                    <span className={`pill ${getPillClass(r.customer_segment)}`}>
                      {r.customer_segment || 'Unassigned'}
                    </span>
                  </td>
                  <td><code>{r.rfm_score || 'N/A'}</code></td>
                  <td>
                    <span className="pill" style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                      {r.cluster_id || 'Cluster_1'}
                    </span>
                  </td>
                  <td>{r.recency_days != null ? `${r.recency_days} days` : '-'}</td>
                  <td>{freq} orders</td>
                  <td>${spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${aov.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
