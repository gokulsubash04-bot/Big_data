import React from 'react';
import { Download, ExternalLink } from 'lucide-react';

export default function Header({ activeView, setActiveView }) {
  const titles = {
    customer_analysis: { title: 'Customer Analytics Pipeline', subtitle: 'Electronics Data → HDFS → YARN → PySpark → Data Cleaning → RFM Analysis → K-Means → Customer Segmentation' },
    hadoop: { title: 'Apache Hadoop & HDFS Cluster Architecture', subtitle: 'NameNode metadata, DataNode storage blocks, YARN resource allocation & file paths' }
  };

  const current = titles[activeView] || { title: 'Analytics Suite', subtitle: 'Enterprise Dashboard' };

  const handleExport = () => {
    alert("Datasets Export Triggered! All processed datasets are available via /api/data.");
  };

  const handleHdfsClick = (e) => {
    if (setActiveView) {
      setActiveView('hadoop');
    }
  };

  const handleYarnClick = (e) => {
    if (setActiveView) {
      setActiveView('hadoop');
    }
  };

  return (
    <header className="top-header">
      <div className="header-title">
        <h1>{current.title}</h1>
        <p>{current.subtitle}</p>
      </div>

      <div className="header-actions">
        <a
          href="http://localhost:9870"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleHdfsClick}
          className="status-chip"
          style={{ textDecoration: 'none', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}
          title="Click to view Hadoop HDFS Status & Web UI"
        >
          🐘 HDFS (:9870)
        </a>
        <a
          href="http://localhost:8088"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleYarnClick}
          className="status-chip"
          style={{ textDecoration: 'none', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer' }}
          title="Click to view YARN ResourceManager Status & Web UI"
        >
          ⚙️ YARN (:8088)
        </a>
        <span className="status-chip">● API Live (8501)</span>
        <button className="btn-export" onClick={handleExport}>
          <Download size={15} />
          Export Datasets
        </button>
      </div>
    </header>
  );
}
