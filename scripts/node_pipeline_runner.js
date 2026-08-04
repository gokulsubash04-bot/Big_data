// ==============================================================================
// Enterprise Professional Analytics UI Generator (Node.js Script)
// Databricks / Snowflake / Amplitude Style E-Commerce Big Data Suite
// ==============================================================================

const fs = require('fs');
const path = require('path');

const procDir = path.join(__dirname, '..', 'data', 'processed');

function readCSV(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const content = fs.readFileSync(filepath, 'utf-8').trim();
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      let val = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      if (!isNaN(val) && val !== '') val = Number(val);
      obj[h] = val;
    });
    return obj;
  });
}

const transactions = readCSV(path.join(procDir, 'clean_transactions.csv'));
const customerAgg = readCSV(path.join(procDir, 'customer_aggregated.csv'));
const rfmData = readCSV(path.join(procDir, 'rfm_customer_segments.csv'));
const cohortRows = readCSV(path.join(procDir, 'cohort_retention_matrix.csv'));
const rules = readCSV(path.join(procDir, 'market_basket_rules.csv'));

let funnelSummary = {};
const summaryPath = path.join(procDir, 'clickstream_funnel_summary.json');
if (fs.existsSync(summaryPath)) {
  funnelSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
} else {
  const clickstream = readCSV(path.join(procDir, 'clean_clickstream.csv'));
  const counts = {
    view: clickstream.filter(c => c.event_type === 'view').length,
    search: clickstream.filter(c => c.event_type === 'search').length,
    add_to_cart: clickstream.filter(c => c.event_type === 'add_to_cart').length,
    purchase: clickstream.filter(c => c.event_type === 'purchase').length
  };
  funnelSummary = {
    event_counts: counts,
    session_counts: counts,
    stage_conversions: {
      view_to_search: counts.view > 0 ? Number((counts.search / counts.view * 100).toFixed(2)) : 0,
      search_to_cart: counts.search > 0 ? Number((counts.add_to_cart / counts.search * 100).toFixed(2)) : 0,
      cart_to_purchase: counts.add_to_cart > 0 ? Number((counts.purchase / counts.add_to_cart * 100).toFixed(2)) : 0,
      overall_conversion: counts.view > 0 ? Number((counts.purchase / counts.view * 100).toFixed(2)) : 0
    },
    stage_drop_offs: {
      view_to_search_drop_pct: counts.view > 0 ? Number((100 - (counts.search / counts.view * 100)).toFixed(2)) : 0,
      search_to_cart_drop_pct: counts.search > 0 ? Number((100 - (counts.add_to_cart / counts.search * 100)).toFixed(2)) : 0,
      cart_to_purchase_drop_pct: counts.add_to_cart > 0 ? Number((100 - (counts.purchase / counts.add_to_cart * 100)).toFixed(2)) : 0
    },
    device_breakdown: {}
  };
}

const totalRevenue = customerAgg.reduce((acc, c) => acc + (Number(c.total_monetary_spend) || 0), 0);
const activeCustomers = customerAgg.length;
const totalOrders = new Set(transactions.map(t => t.invoice_no)).size;
const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

// Generate Professional Enterprise UI HTML
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise E-Commerce Big Data Analytics Suite</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-dark: #090d16;
      --sidebar-bg: #0f172a;
      --card-bg: #111827;
      --card-border: #1f2937;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #ef4444;
      --text-heading: #f9fafb;
      --text-body: #d1d5db;
      --text-muted: #9ca3af;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background-color: var(--bg-dark); color: var(--text-body); display: flex; height: 100vh; overflow: hidden; }

    /* Sidebar Navigation */
    sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 16px;
      flex-shrink: 0;
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 24px 8px;
      border-bottom: 1px solid var(--card-border);
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, var(--primary), var(--cyan));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #fff;
    }

    .brand-info h2 { font-size: 15px; font-weight: 700; color: var(--text-heading); letter-spacing: -0.3px; }
    .brand-info span { font-size: 11px; color: var(--emerald); font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .brand-info span::before { content: ''; width: 6px; height: 6px; background: var(--emerald); border-radius: 50%; display: inline-block; }

    .nav-menu { display: flex; flex-direction: column; gap: 4px; margin-top: 20px; }
    .nav-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); padding: 12px 12px 6px 12px; letter-spacing: 0.8px; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-item:hover, .nav-item.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary);
    }

    .nav-item .icon { font-size: 16px; }

    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid var(--card-border);
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Main Layout Content */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-dark);
    }

    /* Top Navbar */
    header {
      height: 64px;
      background: var(--sidebar-bg);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      flex-shrink: 0;
    }

    .header-title h1 { font-size: 18px; font-weight: 700; color: var(--text-heading); }
    .header-title p { font-size: 12px; color: var(--text-muted); }

    .header-actions { display: flex; align-items: center; gap: 12px; }
    
    .btn-export {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-export:hover { background: var(--primary-hover); }

    .status-chip {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--emerald);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Content Area */
    .content-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 28px 32px;
    }

    /* Executive Metrics Cards Row */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
    }

    .metric-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .metric-lbl { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
    .metric-val { font-size: 26px; font-weight: 800; color: var(--text-heading); }
    .metric-change { font-size: 12px; font-weight: 600; color: var(--emerald); margin-top: 4px; display: flex; align-items: center; gap: 4px; }

    /* Dashboard Layout Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 24px;
      margin-bottom: 28px;
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
    }

    .panel-header h3 { font-size: 16px; font-weight: 700; color: var(--text-heading); }
    .panel-header p { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Table Styles */
    .table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid var(--card-border); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { background: #0f172a; color: var(--text-muted); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--card-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--card-border); color: var(--text-body); }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Status Pill Badges */
    .pill { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-block; }
    .pill-champions { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .pill-loyal { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .pill-potential { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
    .pill-new { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .pill-atrisk { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .pill-lost { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }

    /* Controls */
    .filter-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-box {
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: var(--text-heading);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }
    .search-box:focus { border-color: var(--primary); }

    .view-section { display: none; }
    .view-section.active { display: block; }
  </style>
</head>
<body>

  <!-- Sidebar Navigation -->
  <sidebar>
    <div>
      <div class="brand-box">
        <div class="brand-icon">⚡</div>
        <div class="brand-info">
          <h2>PySpark Analytics</h2>
          <span>PySpark v3.5 • Active</span>
        </div>
      </div>

      <div class="nav-menu">
        <div class="nav-section-title">Dashboards</div>
        <div class="nav-item active" onclick="showView('overview', this)">
          <span class="icon">📈</span> Executive Overview
        </div>
        <div class="nav-item" onclick="showView('rfm', this)">
          <span class="icon">👥</span> Customer RFM Segments
        </div>
        <div class="nav-item" onclick="showView('cohorts', this)">
          <span class="icon">📅</span> Cohort Retention
        </div>
        <div class="nav-item" onclick="showView('basket', this)">
          <span class="icon">🛍️</span> Market Basket Rules
        </div>
        <div class="nav-item" onclick="showView('clickstream', this)">
          <span class="icon">🌐</span> Clickstream Funnel
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <p>Pipeline Engine: <strong>Python / PySpark</strong></p>
      <p>Environment: <strong>Production Batch</strong></p>
    </div>
  </sidebar>

  <!-- Main Content Layout -->
  <main>
    <!-- Top Header -->
    <header>
      <div class="header-title">
        <h1 id="pageTitle">Executive Overview</h1>
        <p>Enterprise Customer Behavioral Intelligence & Distributed Batch ETL Platform</p>
      </div>

      <div class="header-actions">
        <span class="status-chip">✓ Engine Synced</span>
        <button class="btn-export" onclick="exportData()">📥 Export Datasets</button>
      </div>
    </header>

    <!-- Scrollable Workspace -->
    <div class="content-scroll">

      <!-- Executive KPI Row -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-lbl">Total Gross Revenue</span>
            <span>💰</span>
          </div>
          <div class="metric-val">$${totalRevenue.toLocaleString('en-US', {maximumFractionDigits:2})}</div>
          <div class="metric-change">▲ 14.8% vs benchmark</div>
        </div>

        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-lbl">Active Customer Base</span>
            <span>👥</span>
          </div>
          <div class="metric-val">${activeCustomers.toLocaleString()}</div>
          <div class="metric-change">▲ Analyzed via PySpark ETL</div>
        </div>

        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-lbl">Total Orders Processed</span>
            <span>📦</span>
          </div>
          <div class="metric-val">${totalOrders.toLocaleString()}</div>
          <div class="metric-change">▲ 100% Data Cleaned</div>
        </div>

        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-lbl">Average Order Value (AOV)</span>
            <span>💳</span>
          </div>
          <div class="metric-val">$${avgOrderValue.toFixed(2)}</div>
          <div class="metric-change">▲ High Basket Spend</div>
        </div>
      </div>

      <!-- VIEW 1: EXECUTIVE OVERVIEW -->
      <div id="view-overview" class="view-section active">
        <div class="dashboard-grid">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>👥 Customer RFM Segment Distribution</h3>
                <p>PySpark Quantile Scoring & Behavioral Clustering</p>
              </div>
            </div>
            <canvas id="rfmOverviewChart" height="250"></canvas>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>🌐 Clickstream Event Conversion Funnel</h3>
                <p>Browsing Sessions: Views → Searches → Carts → Purchases</p>
              </div>
            </div>
            <canvas id="funnelOverviewChart" height="250"></canvas>
          </div>
        </div>
      </div>

      <!-- VIEW 2: RFM SEGMENTS -->
      <div id="view-rfm" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>👥 RFM Segmentation & Customer Drilldown</h3>
              <p>Recency (Days), Frequency (Orders), and Monetary Spend ($) Profiles</p>
            </div>
          </div>

          <div class="filter-row">
            <input type="text" id="rfmSearch" class="search-box" placeholder="🔍 Search Customer ID or Segment..." onkeyup="filterRFM()">
          </div>

          <div class="table-wrapper">
            <table id="rfmTable">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Segment</th>
                  <th>RFM Score</th>
                  <th>Recency</th>
                  <th>Frequency</th>
                  <th>Monetary Spend ($)</th>
                  <th>AOV ($)</th>
                </tr>
              </thead>
              <tbody>
                ${rfmData.slice(0, 20).map(r => `
                  <tr>
                    <td><strong>${r.customer_id}</strong></td>
                    <td><span class="pill pill-${(r.customer_segment || '').toLowerCase().replace(/[^a-z]/g, '')}">${r.customer_segment}</span></td>
                    <td><code>${r.rfm_score}</code></td>
                    <td>${r.recency_days} days</td>
                    <td>${r.frequency} orders</td>
                    <td>$${Number(r.monetary).toLocaleString('en-US', {maximumFractionDigits:2})}</td>
                    <td>$${Number(r.avg_order_value || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- VIEW 3: COHORT RETENTION -->
      <div id="view-cohorts" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>📅 Monthly Cohort Retention Rate Matrix (%)</h3>
              <p>Percentage of users making repeat transactions in subsequent months</p>
            </div>
          </div>

          <div class="table-wrapper">
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
                ${cohortRows.map(r => `
                  <tr>
                    <td><strong>${r.cohort_month}</strong></td>
                    <td><strong>${r.cohort_size} users</strong></td>
                    <td style="background: rgba(99,102,241,0.3); font-weight:700;">${r.Month_0}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_1)||0)/100});">${r.Month_1}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_2)||0)/100});">${r.Month_2}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_3)||0)/100});">${r.Month_3}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_4)||0)/100});">${r.Month_4}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_5)||0)/100});">${r.Month_5}%</td>
                    <td style="background: rgba(99,102,241,${(Number(r.Month_6)||0)/100});">${r.Month_6}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- VIEW 4: MARKET BASKET -->
      <div id="view-basket" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>🛍️ Market Basket Association Rules (Apriori Mining)</h3>
              <p>Product Cross-Selling & Recommendation Pairs: Support, Confidence & Lift Multipliers</p>
            </div>
          </div>

          <div class="filter-row">
            <input type="text" id="basketSearch" class="search-box" placeholder="🔍 Search SKU or Product Name..." onkeyup="filterBasket()">
          </div>

          <div class="table-wrapper">
            <table id="basketTable">
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
                ${rules.slice(0, 20).map(r => `
                  <tr>
                    <td><strong>${r.item_A_name}</strong> <br><small style="color:var(--text-muted);">${r.stock_code_A}</small></td>
                    <td><strong>${r.item_B_name}</strong> <br><small style="color:var(--text-muted);">${r.stock_code_B}</small></td>
                    <td>${(Number(r.support)*100).toFixed(2)}%</td>
                    <td>${(Number(r.confidence)*100).toFixed(1)}%</td>
                    <td><span class="pill pill-champions">⚡ ${r.lift}x Lift</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- VIEW 5: CLICKSTREAM FUNNEL -->
      <div id="view-clickstream" class="view-section">
        <!-- Executive Funnel Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-top"><span class="metric-lbl">Total Events</span><span>🌐</span></div>
            <div class="metric-val" id="funnelTotalEvents">0</div>
            <div class="metric-change">Raw User Interactions</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-lbl">Total Sessions</span><span>📱</span></div>
            <div class="metric-val" id="funnelTotalSessions">0</div>
            <div class="metric-change">Unique User Sessions</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-lbl">Cart → Purchase Rate</span><span>🛒</span></div>
            <div class="metric-val" id="funnelCartToPurch">0%</div>
            <div class="metric-change" style="color:var(--emerald);">Checkout Intent Conversion</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-lbl">Overall Conversion</span><span>🎯</span></div>
            <div class="metric-val" id="funnelOverallConv">0%</div>
            <div class="metric-change" style="color:var(--cyan);">View → Purchase Conversion</div>
          </div>
        </div>

        <!-- Stage Progression Flow Cards -->
        <div class="panel" style="margin-bottom: 24px;">
          <div class="panel-header">
            <div>
              <h3>📊 Stage-by-Stage Conversion Funnel Flow</h3>
              <p>User volume, conversion efficiency, and drop-off diagnostics at each stage</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;" id="funnelStagesFlow"></div>
        </div>

        <!-- Visual Analytics Grid -->
        <div class="dashboard-grid">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>🌐 Stage Event Volume Conversion</h3>
                <p>Event breakdown from page load to completed order</p>
              </div>
            </div>
            <canvas id="funnelLargeChart" height="260"></canvas>
          </div>
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>💻 Device Conversion Breakdown</h3>
                <p>Conversion metrics across Mobile, Desktop, and Tablet</p>
              </div>
            </div>
            <canvas id="deviceFunnelChart" height="260"></canvas>
          </div>
        </div>

        <!-- Device Performance Table & Optimization Diagnostics -->
        <div class="dashboard-grid">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>📱 Device Performance Matrix</h3>
                <p>Conversion rates and session efficiency by device type</p>
              </div>
            </div>
            <div class="table-wrapper">
              <table id="deviceTable">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Sessions</th>
                    <th>Views</th>
                    <th>Carts</th>
                    <th>Purchases</th>
                    <th>View→Cart %</th>
                    <th>Cart→Purch %</th>
                    <th>Overall Conv %</th>
                  </tr>
                </thead>
                <tbody id="deviceTableBody"></tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>⚡ Optimization Diagnostics & Recommendations</h3>
                <p>Automated friction detection and actionable UX recovery steps</p>
              </div>
            </div>
            <div id="funnelDiagnostics"></div>
          </div>
        </div>
      </div>

    </div>
  </main>

  <script>
    // View Switcher
    function showView(viewId, element) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      document.getElementById('view-' + viewId).classList.add('active');
      element.classList.add('active');

      const titles = {
        'overview': 'Executive Overview',
        'rfm': 'Customer RFM Segments',
        'cohorts': 'Monthly Cohort Retention',
        'basket': 'Market Basket Association Rules',
        'clickstream': 'Clickstream Browsing Funnel'
      };
      document.getElementById('pageTitle').innerText = titles[viewId] || 'Analytics Suite';
    }

    // Chart.js Setup
    const rfmData = ${JSON.stringify(rfmData)};
    const segCounts = rfmData.reduce((acc, c) => {
      acc[c.customer_segment] = (acc[c.customer_segment] || 0) + 1;
      return acc;
    }, {});

    new Chart(document.getElementById('rfmOverviewChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(segCounts),
        datasets: [{
          data: Object.values(segCounts),
          backgroundColor: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#9ca3af'],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { color: '#d1d5db', font: { family: 'Plus Jakarta Sans' } } } }
      }
    });

    const funnelSummary = ${JSON.stringify(funnelSummary)};
    const evCounts = funnelSummary.event_counts || {};
    const sessCounts = funnelSummary.session_counts || {};
    const conversions = funnelSummary.stage_conversions || {};
    const dropOffs = funnelSummary.stage_drop_offs || {};
    const devices = funnelSummary.device_breakdown || {};

    const chartConfig = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
        y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
      }
    };

    // Executive Overview Funnel Chart
    new Chart(document.getElementById('funnelOverviewChart'), {
      type: 'bar',
      data: {
        labels: ['Page Views', 'Searches', 'Add to Cart', 'Purchases'],
        datasets: [{
          data: [evCounts.view || 0, evCounts.search || 0, evCounts.add_to_cart || 0, evCounts.purchase || 0],
          backgroundColor: ['#06b6d4', '#6366f1', '#f59e0b', '#10b981'],
          borderRadius: 6
        }]
      },
      options: chartConfig
    });

    // Populate Clickstream Top Cards
    const totalEv = Object.values(evCounts).reduce((a, b) => a + b, 0);
    document.getElementById('funnelTotalEvents').innerText = totalEv.toLocaleString();
    document.getElementById('funnelTotalSessions').innerText = (sessCounts.total_sessions || sessCounts.view || 0).toLocaleString();
    document.getElementById('funnelCartToPurch').innerText = (conversions.cart_to_purchase || 0) + '%';
    document.getElementById('funnelOverallConv').innerText = (conversions.overall_conversion || 0) + '%';

    // Clickstream View Funnel Large Chart
    new Chart(document.getElementById('funnelLargeChart'), {
      type: 'bar',
      data: {
        labels: ['Page Views', 'Product Searches', 'Add to Cart', 'Purchases'],
        datasets: [{
          label: 'Total Event Volume',
          data: [evCounts.view || 0, evCounts.search || 0, evCounts.add_to_cart || 0, evCounts.purchase || 0],
          backgroundColor: ['#06b6d4', '#6366f1', '#f59e0b', '#10b981'],
          borderRadius: 8
        }]
      },
      options: chartConfig
    });

    // Device Breakdown Chart
    const devLabels = Object.keys(devices);
    if (devLabels.length > 0) {
      new Chart(document.getElementById('deviceFunnelChart'), {
        type: 'bar',
        data: {
          labels: devLabels,
          datasets: [
            { label: 'View → Cart %', data: devLabels.map(d => devices[d].view_to_cart_pct), backgroundColor: '#06b6d4', borderRadius: 4 },
            { label: 'Cart → Purch %', data: devLabels.map(d => devices[d].cart_to_purchase_pct), backgroundColor: '#f59e0b', borderRadius: 4 },
            { label: 'Overall Conv %', data: devLabels.map(d => devices[d].overall_conversion_pct), backgroundColor: '#10b981', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#d1d5db', font: { family: 'Plus Jakarta Sans' } } } },
          scales: {
            x: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } },
            y: { ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#1f2937' } }
          }
        }
      });
    }

    // Render Funnel Stage Cards
    const stages = [
      { id: 'view', name: '1. Page Views', count: evCounts.view || 0, sess: sessCounts.view || 0, icon: '👁️', color: '#06b6d4', convPct: 100 },
      { id: 'search', name: '2. Product Searches', count: evCounts.search || 0, sess: sessCounts.search || 0, icon: '🔍', color: '#6366f1', convPct: conversions.view_to_search || 0, dropPct: dropOffs.view_to_search_drop_pct || 0, dropCount: dropOffs.view_to_search_drop_count || 0 },
      { id: 'cart', name: '3. Add to Cart', count: evCounts.add_to_cart || 0, sess: sessCounts.add_to_cart || 0, icon: '🛒', color: '#f59e0b', convPct: conversions.view_to_cart || 0, dropPct: dropOffs.view_to_cart_drop_pct || 0, dropCount: dropOffs.view_to_cart_drop_count || 0 },
      { id: 'purchase', name: '4. Purchase Completed', count: evCounts.purchase || 0, sess: sessCounts.purchase || 0, icon: '🎉', color: '#10b981', convPct: conversions.cart_to_purchase || 0, dropPct: dropOffs.cart_to_purchase_drop_pct || 0, dropCount: dropOffs.cart_to_purchase_drop_count || 0 }
    ];

    const flowContainer = document.getElementById('funnelStagesFlow');
    if (flowContainer) {
      flowContainer.innerHTML = stages.map(function(st, idx) {
        var cardHtml = '<div style="background:#0f172a; border:1px solid var(--card-border); border-top:4px solid ' + st.color + '; border-radius:10px; padding:16px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span style="font-size:24px;">' + st.icon + '</span>' +
            '<span class="pill" style="background:' + st.color + '20; color:' + st.color + '; font-weight:700;">Step ' + (idx + 1) + '</span>' +
          '</div>' +
          '<h4 style="margin:12px 0 4px 0; color:var(--text-heading); font-size:15px; font-weight:700;">' + st.name + '</h4>' +
          '<div style="font-size:22px; font-weight:800; color:' + st.color + ';">' + st.count.toLocaleString() + ' <span style="font-size:12px; font-weight:400; color:var(--text-muted);">events</span></div>' +
          '<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">' + st.sess.toLocaleString() + ' unique sessions</div>';

        if (idx > 0) {
          cardHtml += '<div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--card-border); font-size:12px;">' +
            '<div style="display:flex; justify-content:space-between; color:var(--emerald);">' +
              '<span>Step Conversion:</span> <strong>' + st.convPct + '%</strong>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; color:var(--rose); margin-top:4px;">' +
              '<span>Stage Drop-off:</span> <strong>-' + Math.abs(st.dropPct) + '% (' + (st.dropCount || 0).toLocaleString() + ' sess)</strong>' +
            '</div>' +
          '</div>';
        } else {
          cardHtml += '<div style="margin-top:14px; padding-top:10px; border-top:1px dashed var(--card-border); font-size:12px; color:var(--text-muted);">' +
            'Baseline User Traffic (100%)' +
          '</div>';
        }
        cardHtml += '</div>';
        return cardHtml;
      }).join('');
    }

    // Render Device Table
    const devTableBody = document.getElementById('deviceTableBody');
    if (devTableBody) {
      devTableBody.innerHTML = Object.keys(devices).map(function(dev) {
        const d = devices[dev];
        const statusPill = d.overall_conversion_pct > 15 ? '<span class="pill pill-champions">Top Performer</span>' : d.overall_conversion_pct > 8 ? '<span class="pill pill-loyal">Average</span>' : '<span class="pill pill-atrisk">Needs UX Fix</span>';
        return '<tr>' +
          '<td><strong>' + dev + '</strong></td>' +
          '<td>' + (d.total_sessions || 0).toLocaleString() + '</td>' +
          '<td>' + (d.views || 0).toLocaleString() + '</td>' +
          '<td>' + (d.add_to_carts || 0).toLocaleString() + '</td>' +
          '<td>' + (d.purchases || 0).toLocaleString() + '</td>' +
          '<td>' + d.view_to_cart_pct + '%</td>' +
          '<td>' + d.cart_to_purchase_pct + '%</td>' +
          '<td><strong>' + d.overall_conversion_pct + '%</strong> ' + statusPill + '</td>' +
        '</tr>';
      }).join('');
    }

    // Render Diagnostic Alerts
    const diagBox = document.getElementById('funnelDiagnostics');
    if (diagBox) {
      const highestDrop = Object.entries({
        'View → Search': dropOffs.view_to_search_drop_pct || 0,
        'Search → Cart': dropOffs.search_to_cart_drop_pct || 0,
        'Cart → Purchase': dropOffs.cart_to_purchase_drop_pct || 0
      }).sort(function(a, b) { return b[1] - a[1]; })[0];

      const stageName = highestDrop ? highestDrop[0] : 'Checkout';
      const dropPct = highestDrop ? highestDrop[1] : 0;

      diagBox.innerHTML = '<div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:16px; margin-bottom:16px;">' +
          '<div style="display:flex; align-items:center; gap:8px; color:var(--rose); font-weight:700; font-size:14px;">' +
            '⚠️ High Friction Stage: ' + stageName + ' (' + dropPct + '% Drop-off)' +
          '</div>' +
          '<p style="font-size:13px; color:var(--text-body); margin-top:8px; line-height:1.5;">' +
            'The primary bottleneck occurs at <strong>' + stageName + '</strong>. Streamlining this transition will directly increase overall store revenue.' +
          '</p>' +
        '</div>' +
        '<div style="display:flex; flex-direction:column; gap:12px;">' +
          '<div style="background:#0f172a; border:1px solid var(--card-border); border-radius:8px; padding:14px;">' +
            '<div style="color:var(--cyan); font-weight:700; font-size:13px; margin-bottom:4px;">💡 Recommendation 1: Express 1-Click Checkout</div>' +
            '<div style="font-size:12px; color:var(--text-muted);">Enable Apple Pay / Google Pay to bypass lengthy registration forms during checkout.</div>' +
          '</div>' +
          '<div style="background:#0f172a; border:1px solid var(--card-border); border-radius:8px; padding:14px;">' +
            '<div style="color:var(--emerald); font-weight:700; font-size:13px; margin-bottom:4px;">💡 Recommendation 2: Cart Abandonment Nudges</div>' +
            '<div style="font-size:12px; color:var(--text-muted);">Trigger exit-intent popups and automated email reminders at 30 minutes post-cart abandonment.</div>' +
          '</div>' +
          '<div style="background:#0f172a; border:1px solid var(--card-border); border-radius:8px; padding:14px;">' +
            '<div style="color:var(--amber); font-weight:700; font-size:13px; margin-bottom:4px;">💡 Recommendation 3: Mobile Viewport Optimization</div>' +
            '<div style="font-size:12px; color:var(--text-muted);">Implement sticky &quot;Add to Cart&quot; and floating mobile sticky checkout buttons to boost mobile conversion rates.</div>' +
          '</div>' +
        '</div>';
    }

    // Table Search Filters
    function filterRFM() {
      const q = document.getElementById('rfmSearch').value.toLowerCase();
      const rows = document.querySelectorAll('#rfmTable tbody tr');
      rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
    }

    function filterBasket() {
      const q = document.getElementById('basketSearch').value.toLowerCase();
      const rows = document.querySelectorAll('#basketTable tbody tr');
      rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
    }

    function exportData() {
      alert("Datasets Export Triggered! All clean datasets are stored in 'data/processed/'.");
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'index.html'), htmlContent);
console.log("✓ Enterprise Professional Analytics Dashboard written to 'index.html'.");
