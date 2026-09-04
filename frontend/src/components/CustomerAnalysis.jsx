import React, { useState } from 'react';
import ExecutiveOverview from './ExecutiveOverview';
import RFMTable from './RFMTable';
import CohortMatrix from './CohortMatrix';
import ClickstreamFunnel from './ClickstreamFunnel';
import PipelineFlow from './PipelineFlow';
import RawDataViewer from './RawDataViewer';
import { Users, Calendar, Globe, BarChart3, Database } from 'lucide-react';

export default function CustomerAnalysis({ data }) {
  const [subTab, setSubTab] = useState('overview');

  return (
    <div>
      {/* Pipeline Flowchart Banner */}
      <PipelineFlow />
      {/* Sub-navigation pill bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: '#1e293b',
        padding: '6px',
        borderRadius: '10px',
        width: 'fit-content',
        border: '1px solid var(--card-border)'
      }}>
        <button
          onClick={() => setSubTab('overview')}
          style={{
            background: subTab === 'overview' ? 'var(--emerald)' : 'transparent',
            color: subTab === 'overview' ? '#0f172a' : 'var(--text-muted)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart3 size={15} /> Overview & KPIs
        </button>

        <button
          onClick={() => setSubTab('rfm')}
          style={{
            background: subTab === 'rfm' ? 'var(--emerald)' : 'transparent',
            color: subTab === 'rfm' ? '#0f172a' : 'var(--text-muted)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={15} /> RFM & ML Segments
        </button>

        <button
          onClick={() => setSubTab('data')}
          style={{
            background: subTab === 'data' ? 'var(--emerald)' : 'transparent',
            color: subTab === 'data' ? '#0f172a' : 'var(--text-muted)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Database size={15} /> Raw Dataset Explorer
        </button>

        <button
          onClick={() => setSubTab('cohorts')}
          style={{
            background: subTab === 'cohorts' ? 'var(--emerald)' : 'transparent',
            color: subTab === 'cohorts' ? '#0f172a' : 'var(--text-muted)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={15} /> Cohort Retention
        </button>

        <button
          onClick={() => setSubTab('clickstream')}
          style={{
            background: subTab === 'clickstream' ? 'var(--emerald)' : 'transparent',
            color: subTab === 'clickstream' ? '#0f172a' : 'var(--text-muted)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <Globe size={15} /> Clickstream Funnel
        </button>
      </div>

      {/* Render selected Customer Analysis module */}
      {subTab === 'overview' && <ExecutiveOverview data={data} />}
      {subTab === 'rfm' && <RFMTable data={data} />}
      {subTab === 'data' && <RawDataViewer data={data} />}
      {subTab === 'cohorts' && <CohortMatrix data={data} />}
      {subTab === 'clickstream' && <ClickstreamFunnel data={data} />}
    </div>
  );
}
