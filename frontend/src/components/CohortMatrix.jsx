import React from 'react';

export default function CohortMatrix({ data }) {
  const cohortRows = data.cohort_matrix || [];

  const getCellColor = (val) => {
    const pct = Number(val) || 0;
    if (pct === 100) return 'rgba(99, 102, 241, 0.3)';
    if (pct >= 50) return 'rgba(16, 185, 129, 0.35)';
    if (pct >= 30) return 'rgba(16, 185, 129, 0.2)';
    if (pct >= 15) return 'rgba(245, 158, 11, 0.2)';
    if (pct > 0) return 'rgba(239, 68, 68, 0.15)';
    return 'transparent';
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>📅 Monthly Cohort Retention Rate Matrix (%)</h3>
          <p>Percentage of users making repeat transactions in subsequent months</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Acquisition Cohort</th>
              <th>Cohort Size</th>
              <th>Month 0</th>
              <th>Month 1</th>
              <th>Month 2</th>
              <th>Month 3</th>
              <th>Month 4</th>
              <th>Month 5</th>
              <th>Month 6</th>
            </tr>
          </thead>
          <tbody>
            {cohortRows.map((row, idx) => (
              <tr key={row.cohort_month || idx}>
                <td><strong>{row.cohort_month}</strong></td>
                <td>{row.cohort_size} active</td>
                {['Month_0', 'Month_1', 'Month_2', 'Month_3', 'Month_4', 'Month_5', 'Month_6'].map((mKey) => {
                  const val = row[mKey];
                  const displayVal = val !== undefined && val !== '' ? `${Number(val).toFixed(1)}%` : '-';
                  return (
                    <td
                      key={mKey}
                      style={{
                        background: getCellColor(val),
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
