import React from 'react';
import { LayoutDashboard, Users, Calendar, ShoppingBag, Globe, Zap } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'clickstream', label: 'Clickstream Funnel', icon: Globe },
    { id: 'rfm', label: 'RFM Segments', icon: Users },
    { id: 'cohorts', label: 'Cohort Retention', icon: Calendar },
    { id: 'basket', label: 'Market Basket Rules', icon: ShoppingBag },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-box">
          <div className="brand-icon">
            <Zap size={22} color="#ffffff" />
          </div>
          <div className="brand-info">
            <h2>PySpark Analytics</h2>
            <span>PySpark v3.5 • React Suite</span>
          </div>
        </div>

        <div className="nav-menu">
          <div className="nav-section-title">Dashboards</div>
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
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Enterprise Big Data Suite<br />
          React v19 • Vite Engine
        </p>
      </div>
    </aside>
  );
}
