import React from 'react';
import { Users, Database, Server } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'customer_analysis', label: 'Customer Analytics Pipeline', icon: Users },
    { id: 'hadoop', label: 'Hadoop HDFS Architecture', icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-box">
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <Server size={22} color="#ffffff" />
          </div>
          <div className="brand-info">
            <h2>Big Data Pipeline</h2>
            <span>Hadoop & PySpark RFM</span>
          </div>
        </div>

        <div className="nav-menu">
          <div className="nav-section-title">Pipeline Architecture</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} className="icon" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <p style={{ fontSize: '11px', color: 'var(--emerald)', margin: '0 0 4px 0', fontWeight: 600 }}>
            ● Pipeline Status: Active
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            HDFS: hdfs://namenode:9000<br />
            API: http://localhost:8501
          </p>
        </div>
      </div>
    </aside>
  );
}



