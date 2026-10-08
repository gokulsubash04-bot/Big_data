import React from 'react';
import { LayoutDashboard, Users, AlertTriangle, Filter, Database, Server } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'customer_analysis', label: 'Customer Analytics & RFM', icon: Users },
    { id: 'restock', label: 'Inventory Restock Intelligence', icon: AlertTriangle },
    { id: 'funnel', label: 'Clickstream Funnel', icon: Filter },
    { id: 'hadoop', label: 'Hadoop HDFS Cluster', icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-box">
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
            <Server size={22} color="#ffffff" />
          </div>
          <div className="brand-info">
            <h2>Big Data Analytics</h2>
            <span>E-Commerce Pipeline</span>
          </div>
        </div>

        <div className="nav-menu">
          <div className="nav-section-title">Analytics Navigation</div>
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
            ● System Status: Active
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            API: /api/data<br />
            HDFS: hdfs://namenode:9000
          </p>
        </div>
      </div>
    </aside>
  );
}
