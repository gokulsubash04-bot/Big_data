import React, { useState } from 'react';
import { Table, Search, Download, FileText, Database } from 'lucide-react';

export default function RawDataViewer({ data }) {
  const { customer_summary = [], rfm_segments = [], cohort_matrix = [] } = data;
  const [activeTable, setActiveTable] = useState('rfm');
  const [searchTerm, setSearchTerm] = useState('');

  const tableData = activeTable === 'rfm' ? rfm_segments : customer_summary;

  const filteredData = tableData.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(term));
  });

  return (
    <div className="panel" style={{ padding: '24px' }}>
      {/* Header & Table Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--cyan)" />
            Live Ingested E-Commerce Datasets Explorer
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Inspect processed customer profiles, PySpark aggregations, and RFM machine learning clusters
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTable('rfm')}
            style={{
              background: activeTable === 'rfm' ? 'var(--cyan)' : '#0f172a',
              color: activeTable === 'rfm' ? '#0f172a' : 'var(--text-muted)',
              border: '1px solid var(--card-border)',
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
            <FileText size={15} /> RFM ML Segments ({rfm_segments.length})
          </button>

          <button
            onClick={() => setActiveTable('summary')}
            style={{
              background: activeTable === 'summary' ? 'var(--cyan)' : '#0f172a',
              color: activeTable === 'summary' ? '#0f172a' : 'var(--text-muted)',
              border: '1px solid var(--card-border)',
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
            <Table size={15} /> Customer Aggregates ({customer_summary.length})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{
        marginBottom: '16px',
        position: 'relative',
        maxWidth: '360px'
      }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        <input
          type="text"
          placeholder="Filter by Customer ID, Segment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: '#0f172a',
            border: '1px solid var(--card-border)',
            padding: '10px 12px 10px 36px',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
        <table className="data-table">
          <thead>
            {activeTable === 'rfm' ? (
              <tr>
                <th>Customer ID</th>
                <th>Recency (Days)</th>
                <th>Transaction Freq</th>
                <th>Monetary Spend ($)</th>
                <th>R-Score</th>
                <th>F-Score</th>
                <th>M-Score</th>
                <th>Customer Segment</th>
                <th>Cluster ID</th>
              </tr>
            ) : (
              <tr>
                <th>Customer ID</th>
                <th>Total Spend ($)</th>
                <th>Total Orders</th>
                <th>Units Purchased</th>
                <th>First Purchase</th>
                <th>Last Purchase</th>
                <th>Cart Ratio</th>
                <th>Avg Order Value ($)</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredData.slice(0, 15).map((row, idx) => (
              <tr key={idx}>
                {activeTable === 'rfm' ? (
                  <>
                    <td><code style={{ color: '#38bdf8' }}>{row.customer_id}</code></td>
                    <td>{row.recency_days} days</td>
                    <td>{row.transaction_frequency}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>${Number(row.total_monetary_spend || 0).toFixed(2)}</td>
                    <td><span className="pill" style={{ background: '#1e293b', color: 'var(--cyan)' }}>{row.r_score}</span></td>
                    <td><span className="pill" style={{ background: '#1e293b', color: 'var(--indigo)' }}>{row.f_score}</span></td>
                    <td><span className="pill" style={{ background: '#1e293b', color: 'var(--emerald)' }}>{row.m_score}</span></td>
                    <td>
                      <span className={`pill ${
                        row.customer_segment === 'Champions' ? 'pill-champions' :
                        row.customer_segment === 'Loyal Customers' ? 'pill-loyal' :
                        row.customer_segment === 'At Risk' ? 'pill-atrisk' : 'pill-lost'
                      }`}>
                        {row.customer_segment}
                      </span>
                    </td>
                    <td><code>{row.cluster_id}</code></td>
                  </>
                ) : (
                  <>
                    <td><code style={{ color: '#38bdf8' }}>{row.customer_id}</code></td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>${Number(row.total_monetary_spend || 0).toFixed(2)}</td>
                    <td>{row.transaction_frequency}</td>
                    <td>{row.total_items_purchased}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.first_purchase}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.last_purchase}</td>
                    <td>{row.cart_to_view_ratio}</td>
                    <td>${Number(row.avg_order_value || 0).toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
        Showing top {Math.min(15, filteredData.length)} of {filteredData.length} records in dataset
      </div>
    </div>
  );
}
