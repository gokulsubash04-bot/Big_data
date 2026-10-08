import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  AlertTriangle,
  Package,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Boxes
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ProductRestockAnalysis({ data }) {
  const restockData = data?.product_restock || {};
  const kpis = restockData.kpis || {};
  const allProducts = restockData.all_products || [];
  const topRecommendations = restockData.top_restock_recommendations || [];
  const categorySummary = restockData.category_restock_summary || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [orderedItems, setOrderedItems] = useState({});

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(allProducts.map(p => p.category))).filter(Boolean)];

  // Filter products
  const filteredProducts = allProducts.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesUrgency = urgencyFilter === 'ALL' || item.restock_urgency === urgencyFilter;

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const handleSimulateOrder = (productId) => {
    setOrderedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Top Products Needing Restock Chart Data
  const topRestockList = [...allProducts]
    .sort((a, b) => (Number(b.recommended_restock_units) || 0) - (Number(a.recommended_restock_units) || 0))
    .slice(0, 8);

  const restockComparisonChartData = {
    labels: topRestockList.map(p => p.product_name.length > 18 ? p.product_name.substring(0, 16) + '..' : p.product_name),
    datasets: [
      {
        label: 'Recommended Restock Units',
        data: topRestockList.map(p => Number(p.recommended_restock_units) || 0),
        backgroundColor: '#ef4444',
        borderRadius: 6
      },
      {
        label: 'Current Warehouse Stock',
        data: topRestockList.map(p => Number(p.current_stock) || 0),
        backgroundColor: '#3b82f6',
        borderRadius: 6
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1e293b' } }
    }
  };

  // Category Restock Distribution Chart Data
  const categoryChartData = {
    labels: categorySummary.map(c => c.category),
    datasets: [
      {
        data: categorySummary.map(c => c.total_restock_needed),
        backgroundColor: [
          '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
          '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'
        ],
        borderWidth: 2,
        borderColor: '#111827'
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Restock KPI Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="metric-top">
            <span className="metric-lbl">Critical Stockout Alerts</span>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div className="metric-val" style={{ color: '#f87171' }}>
            {kpis.critical_stockout_items || 0} Products
          </div>
          <div className="metric-change" style={{ color: '#ef4444' }}>
            🚨 Stock depletion &gt; 90% or stockout imminent
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-top">
            <span className="metric-lbl">Total Recommended Units to Order</span>
            <Boxes size={20} color="#f59e0b" />
          </div>
          <div className="metric-val" style={{ color: '#fbbf24' }}>
            {Number(kpis.total_recommended_restock_units || 0).toLocaleString()} Units
          </div>
          <div className="metric-change" style={{ color: '#f59e0b' }}>
            📦 Recommended buffer + lead time demand
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="metric-top">
            <span className="metric-lbl">Potential Revenue at Risk</span>
            <DollarSign size={20} color="#10b981" />
          </div>
          <div className="metric-val" style={{ color: '#34d399' }}>
            ${Number(kpis.total_revenue_at_risk || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="metric-change" style={{ color: '#10b981' }}>
            💰 Revenue protected by timely restocking
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div className="metric-top">
            <span className="metric-lbl">Fastest Selling Item</span>
            <TrendingUp size={20} color="#06b6d4" />
          </div>
          <div className="metric-val" style={{ fontSize: '18px', lineHeight: 1.3, color: '#38bdf8' }}>
            {kpis.fastest_moving_product || 'None'}
          </div>
          <div className="metric-change" style={{ color: '#06b6d4' }}>
            ⚡ Highest daily transaction velocity
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#ef4444" /> Top Products Needing Urgent Restock
              </h3>
              <p>Comparison: Units Needed to Reorder vs Current Available Stock</p>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <Bar data={restockComparisonChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="#06b6d4" /> Restock Demand by Category
              </h3>
              <p>Total units needed to restock across product categories</p>
            </div>
          </div>
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', background: '#0f172a', padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search product name, ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                outline: 'none',
                width: '100%',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Urgency Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Urgency:</span>
            {[
              { key: 'ALL', label: 'All Items' },
              { key: 'CRITICAL_RESTOCK', label: '🚨 Critical' },
              { key: 'HIGH_PRIORITY', label: '⚠️ High' },
              { key: 'ADEQUATE', label: '🟢 Adequate' }
            ].map(pill => (
              <button
                key={pill.key}
                onClick={() => setUrgencyFilter(pill.key)}
                style={{
                  background: urgencyFilter === pill.key ? '#334155' : 'transparent',
                  color: urgencyFilter === pill.key ? '#38bdf8' : '#94a3b8',
                  border: '1px solid #334155',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#94a3b8" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Electronics Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Restock Priority Table */}
      <div className="panel">
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#f59e0b" /> Product Restock & Reorder Priority List
            </h3>
            <p>Ranked by restock urgency, sales velocity, and days of supply remaining</p>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', background: '#0f172a', padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
            Showing {filteredProducts.length} of {allProducts.length} items
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>RANK</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>PRODUCT</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>PRICE</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>SALES & VELOCITY</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>CURRENT STOCK</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>DAYS LEFT</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>URGENCY</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>RECOMMENDED RESTOCK</th>
                <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>ACTION / PO</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isCritical = p.restock_urgency === 'CRITICAL_RESTOCK';
                const isHigh = p.restock_urgency === 'HIGH_PRIORITY';
                const isOrdered = orderedItems[p.product_id];
                const stockPct = Math.min(100, Math.max(0, (Number(p.current_stock) / (Number(p.initial_stock) || 1)) * 100));

                return (
                  <tr
                    key={p.product_id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px', fontWeight: 800, color: isCritical ? '#ef4444' : '#94a3b8', fontSize: '14px' }}>
                      #{p.restock_priority_rank}
                    </td>

                    {/* Product Info */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                        {p.product_name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.product_id}
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.category}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>
                      ${Number(p.unit_price).toFixed(2)}
                    </td>

                    {/* Sales & Velocity */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px' }}>
                        {Number(p.units_sold).toLocaleString()} units sold
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        ⚡ {p.daily_sales_velocity} units/day
                      </div>
                    </td>

                    {/* Current Stock with Progress Bar */}
                    <td style={{ padding: '12px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        <span style={{ color: p.current_stock === 0 ? '#ef4444' : '#f8fafc' }}>
                          {p.current_stock} left
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          / {p.initial_stock}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${stockPct}%`,
                            height: '100%',
                            background: stockPct < 20 ? '#ef4444' : stockPct < 50 ? '#f59e0b' : '#10b981',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </td>

                    {/* Days Remaining */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: Number(p.days_of_stock_remaining) < 15 ? 'rgba(239, 68, 68, 0.2)' : Number(p.days_of_stock_remaining) < 35 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: Number(p.days_of_stock_remaining) < 15 ? '#f87171' : Number(p.days_of_stock_remaining) < 35 ? '#fbbf24' : '#34d399'
                        }}
                      >
                        <Clock size={12} />
                        {Number(p.days_of_stock_remaining) >= 999 ? '99+ d' : `${p.days_of_stock_remaining} days`}
                      </span>
                    </td>

                    {/* Urgency Badge */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-block',
                          background: isCritical ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isCritical ? '#f87171' : isHigh ? '#fbbf24' : '#34d399',
                          border: `1px solid ${isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981'}`
                        }}
                      >
                        {isCritical ? '🚨 CRITICAL' : isHigh ? '⚠️ HIGH' : '🟢 ADEQUATE'}
                      </span>
                    </td>

                    {/* Recommended Restock Quantity */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: Number(p.recommended_restock_units) > 0 ? '#fbbf24' : '#94a3b8' }}>
                          +{Number(p.recommended_restock_units).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>units</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Valued: ${(Number(p.revenue_at_risk) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleSimulateOrder(p.product_id)}
                        style={{
                          background: isOrdered ? 'rgba(16, 185, 129, 0.2)' : Number(p.recommended_restock_units) > 0 ? 'var(--emerald)' : '#334155',
                          color: isOrdered ? '#34d399' : Number(p.recommended_restock_units) > 0 ? '#0f172a' : '#94a3b8',
                          border: isOrdered ? '1px solid #10b981' : 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isOrdered ? (
                          <>
                            <CheckCircle2 size={14} /> PO Placed
                          </>
                        ) : (
                          <>
                            <ArrowUpRight size={14} /> Order Stock
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
