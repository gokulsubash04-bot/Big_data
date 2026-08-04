import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function MarketBasket({ data }) {
  const rules = data.market_basket_rules || [];
  const [search, setSearch] = useState('');

  const filtered = rules.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.item_A_name || r.stock_code_A || '').toLowerCase().includes(q) ||
      (r.item_B_name || r.stock_code_B || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>🛍️ Market Basket Association Rules (Apriori Mining)</h3>
          <p>Product Cross-Selling & Recommendation Pairs: Support, Confidence & Lift Multipliers</p>
        </div>
      </div>

      <div className="filter-row">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-box"
            style={{ paddingLeft: '36px' }}
            placeholder="Search SKU or Product Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Primary Product (If Purchased)</th>
              <th>Recommended Product (Co-Purchased)</th>
              <th>Support</th>
              <th>Confidence</th>
              <th>Lift Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((r, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{r.item_A_name || r.stock_code_A}</strong> <br />
                  <small style={{ color: 'var(--text-muted)' }}>{r.stock_code_A}</small>
                </td>
                <td>
                  <strong>{r.item_B_name || r.stock_code_B}</strong> <br />
                  <small style={{ color: 'var(--text-muted)' }}>{r.stock_code_B}</small>
                </td>
                <td>{(Number(r.support) * 100).toFixed(2)}%</td>
                <td>{(Number(r.confidence) * 100).toFixed(1)}%</td>
                <td>
                  <span className="pill pill-champions">⚡ {Number(r.lift).toFixed(2)}x Lift</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
