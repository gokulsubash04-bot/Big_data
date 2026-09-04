import React, { useState } from 'react';
import { Database, Server, HardDrive, ExternalLink, Activity, CheckCircle2, Globe, Info, Terminal } from 'lucide-react';

export default function HadoopCluster() {
  const [selectedFrame, setSelectedFrame] = useState(null);

  const hadoopServices = [
    {
      id: 'hdfs',
      name: 'HDFS NameNode',
      type: 'Master Node (Metadata & Namespace)',
      port: '9870 (Web UI) / 9000 (IPC)',
      url: 'http://localhost:9870',
      status: 'Active / Configured',
      role: 'Manages HDFS directory tree & file system namespace (/ecommerce/raw/)',
      color: '#10b981'
    },
    {
      id: 'datanode',
      name: 'HDFS DataNode',
      type: 'Worker Node (Block Storage)',
      port: '9864 (Web UI)',
      url: 'http://localhost:9864',
      status: 'Active / Configured',
      role: 'Stores raw transactions, clickstream logs & block replicas',
      color: '#06b6d4'
    },
    {
      id: 'yarn',
      name: 'YARN ResourceManager',
      type: 'Cluster Scheduler & Resource Allocator',
      port: '8088 (Web UI)',
      url: 'http://localhost:8088',
      status: 'Active / Configured',
      role: 'Allocates compute resources for PySpark & MapReduce jobs',
      color: '#6366f1'
    },
    {
      id: 'nodemanager',
      name: 'YARN NodeManager',
      type: 'Container Execution Agent',
      port: 'Internal Container',
      url: null,
      status: 'Active / Configured',
      role: 'Launches and monitors task execution containers',
      color: '#f59e0b'
    }
  ];

  const hdfsPaths = [
    {
      path: 'hdfs://namenode:9000/ecommerce/raw/transactions.csv',
      type: 'Raw Electronics Transactions',
      format: 'CSV (Uncompressed)',
      size: '2.45 MB',
      description: 'Raw customer purchase invoice records ingested into HDFS block storage'
    },
    {
      path: 'hdfs://namenode:9000/ecommerce/raw/clickstream.csv',
      type: 'Raw Browsing Events Log',
      format: 'CSV (Uncompressed)',
      size: '6.57 MB',
      description: 'Raw web/mobile clickstream session logs (view, search, cart, purchase)'
    },
    {
      path: 'hdfs://namenode:9000/ecommerce/processed/customer_aggregated.csv',
      type: 'Master Customer Aggregates',
      format: 'CSV / Parquet Output',
      size: '217 KB',
      description: 'Cleaned metrics: total monetary spend, frequency, order counts, cart ratio'
    },
    {
      path: 'hdfs://namenode:9000/ecommerce/processed/rfm_customer_segments.csv',
      type: 'RFM & K-Means Clusters',
      format: 'CSV Output',
      size: '160 KB',
      description: 'Recency, Frequency, Monetary scoring and ML segment cluster assignments'
    }
  ];

  return (
    <div>
      {/* Cluster Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'var(--emerald)',
            padding: '12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={28} color="#0f172a" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>
              Apache Hadoop (HDFS & YARN) Big Data Architecture
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Distributed storage & cluster compute infrastructure supporting PySpark batch ETL
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setSelectedFrame(selectedFrame === 'http://localhost:9870' ? null : 'http://localhost:9870')}
            className="btn-export"
            style={{ background: selectedFrame === 'http://localhost:9870' ? '#10b981' : 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--emerald)', color: selectedFrame === 'http://localhost:9870' ? '#0f172a' : '#34d399' }}
          >
            <Globe size={15} />
            {selectedFrame === 'http://localhost:9870' ? 'Close HDFS View' : 'Embed HDFS UI (:9870)'}
          </button>

          <button
            onClick={() => setSelectedFrame(selectedFrame === 'http://localhost:8088' ? null : 'http://localhost:8088')}
            className="btn-export"
            style={{ background: selectedFrame === 'http://localhost:8088' ? '#6366f1' : 'rgba(99, 102, 241, 0.2)', border: '1px solid var(--indigo)', color: selectedFrame === 'http://localhost:8088' ? '#ffffff' : '#818cf8' }}
          >
            <Globe size={15} />
            {selectedFrame === 'http://localhost:8088' ? 'Close YARN View' : 'Embed YARN UI (:8088)'}
          </button>
        </div>
      </div>

      {/* Port Connection Status Callout */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px'
      }}>
        <Info size={18} color="#818cf8" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-main)' }}>Hadoop Web UI Connection Note:</strong>
          <span style={{ color: 'var(--text-body)', marginLeft: '6px' }}>
            Port <code>9870</code> (HDFS NameNode) and <code>8088</code> (YARN) require Docker container binding. If direct external links return <em>ERR_CONNECTION_REFUSED</em>, run <code style={{ background: '#0f172a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>docker compose up -d</code> in terminal to launch the Hadoop container cluster.
          </span>
        </div>
      </div>

      {/* Embedded Live Web UI Inspector Container */}
      {selectedFrame && (
        <div className="panel" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} /> Live Web UI Frame: <code>{selectedFrame}</code>
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={selectedFrame} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--emerald)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ExternalLink size={13} /> Open in External Browser
              </a>
              <button onClick={() => setSelectedFrame(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
            </div>
          </div>
          <iframe
            src={selectedFrame}
            title="Hadoop Web UI"
            style={{ width: '100%', height: '520px', border: '1px solid var(--card-border)', borderRadius: '8px', background: '#ffffff' }}
          />
        </div>
      )}

      {/* Cluster Nodes Grid */}
      <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Server size={18} color="var(--cyan)" />
        Distributed Hadoop Service Nodes
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {hadoopServices.map((srv, idx) => (
          <div key={idx} className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{
                  background: `${srv.color}22`,
                  color: srv.color,
                  border: `1px solid ${srv.color}55`,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {srv.type}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--emerald)', fontWeight: 600 }}>
                  <CheckCircle2 size={13} />
                  {srv.status}
                </span>
              </div>

              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-main)' }}>{srv.name}</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {srv.role}
              </p>
            </div>

            <div style={{
              background: '#0f172a',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Port / Binding:</span>
              <code style={{ color: srv.color, fontWeight: 600 }}>{srv.port}</code>
            </div>
          </div>
        ))}
      </div>

      {/* HDFS Dataset Storage Matrix */}
      <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <HardDrive size={18} color="var(--emerald)" />
        HDFS Distributed Storage File Paths (`/ecommerce/`)
      </h3>

      <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>HDFS URI / Path</th>
                <th>Dataset Description</th>
                <th>Format</th>
                <th>Size</th>
                <th>Block Status</th>
              </tr>
            </thead>
            <tbody>
              {hdfsPaths.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <code style={{ background: '#0f172a', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.path}
                    </code>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>{item.type}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.description}</span>
                  </td>
                  <td>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--indigo)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {item.format}
                    </span>
                  </td>
                  <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>{item.size}</td>
                  <td>
                    <span style={{ color: 'var(--emerald)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={13} /> In HDFS DataNode
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
