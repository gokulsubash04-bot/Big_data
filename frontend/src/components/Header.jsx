import React from 'react';
import { Download } from 'lucide-react';

export default function Header({ activeView }) {
  const titles = {
    overview: { title: 'Executive Overview', subtitle: 'Real-time revenue, orders, customer acquisition and conversion metrics' },
    clickstream: { title: 'Clickstream Event Conversion Funnel', subtitle: 'Stage-by-stage user volume, drop-off diagnostics, and device conversion analytics' },
    rfm: { title: 'Customer RFM Segments', subtitle: 'Recency, Frequency, Monetary spend scoring & behavioral clusters' },
    cohorts: { title: 'Monthly Cohort Retention Matrix', subtitle: 'Multi-month active user repeat transaction percentage heatmap' },
    basket: { title: 'Market Basket Association Rules', subtitle: 'Apriori product recommendations, support, confidence & lift multipliers' }
  };

  const current = titles[activeView] || { title: 'Analytics Suite', subtitle: 'Enterprise Dashboard' };

  const handleExport = () => {
    alert("Datasets Export Triggered! All processed datasets are available via /api/data.");
  };

  return (
    <header className="top-header">
      <div className="header-title">
        <h1>{current.title}</h1>
        <p>{current.subtitle}</p>
      </div>

      <div className="header-actions">
        <span className="status-chip">● API Live (8501)</span>
        <button className="btn-export" onClick={handleExport}>
          <Download size={15} />
          Export Datasets
        </button>
      </div>
    </header>
  );
}
