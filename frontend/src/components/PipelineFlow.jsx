import React from 'react';
import { Database, Cpu, Sparkles, Filter, BarChart, Binary, Users, Server, Layout, ArrowRight } from 'lucide-react';

export default function PipelineFlow() {
  const steps = [
    { title: 'Electronics Data', icon: Database, desc: 'Transactions & Products', color: '#06b6d4' },
    { title: 'Data Loader', icon: Server, desc: 'CSV Ingestion Engine', color: '#38bdf8' },
    { title: 'Hadoop HDFS', icon: Database, desc: '/ecommerce/raw/', color: '#10b981' },
    { title: 'YARN', icon: Server, desc: 'Cluster Resource Manager', color: '#6366f1' },
    { title: 'PySpark', icon: Sparkles, desc: 'Parallel ETL Engine', color: '#f59e0b' },
    { title: 'Data Cleaning', icon: Filter, desc: 'Sessionization & Cleaning', color: '#8b5cf6' },
    { title: 'RFM Analysis', icon: BarChart, desc: 'Recency, Frequency, Monetary', color: '#ec4899' },
    { title: 'K-Means', icon: Binary, desc: '3D Cluster Algorithm', color: '#a855f7' },
    { title: 'Customer Segments', icon: Users, desc: 'Champions, Loyal, At Risk', color: '#10b981' },
    { title: 'app.py', icon: Cpu, desc: 'Threaded REST API (8501)', color: '#3b82f6' },
    { title: 'React Dashboard', icon: Layout, desc: 'Glassmorphism UI', color: '#06b6d4' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      padding: '18px 22px',
      marginBottom: '24px',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} /> Electronics E-Commerce Big Data Architecture Flow
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
          Hadoop HDFS + PySpark + K-Means
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '1050px' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <div style={{
                background: '#090d16',
                border: `1px solid ${step.color}55`,
                borderRadius: '8px',
                padding: '10px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flex: 1,
                minWidth: '92px'
              }}>
                <Icon size={18} color={step.color} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                  {step.title}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  {step.desc}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
