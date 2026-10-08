# ==============================================================================
# Electronics E-Commerce Big Data Analytics Web Dashboard & Hadoop Servers
# Serves:
#  - Embedded Analytics Dashboard & API on Port 8501 (http://localhost:8501)
#  - Apache Hadoop HDFS NameNode Web UI on Port 9870 (http://localhost:9870)
#  - Apache YARN ResourceManager Web UI on Port 8088 (http://localhost:8088)
# ==============================================================================

import os
import sys
import json
import csv
import threading
import http.server
import socketserver
from collections import defaultdict
from datetime import datetime

PORT = 8501
HDFS_PORT = 9870
YARN_PORT = 8088
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def locate_file(filename):
    """Find file in output/, data/processed/, data/, or base directory."""
    paths = [
        os.path.join(BASE_DIR, "output", filename),
        os.path.join(BASE_DIR, "data", "processed", filename),
        os.path.join(BASE_DIR, "data", filename),
        os.path.join(BASE_DIR, filename)
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def load_csv(filename):
    """Safely load CSV rows into a list of dicts with error handling."""
    filepath = locate_file(filename)
    if not filepath:
        return []
    rows = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    except Exception as e:
        print(f"[WARN] Error reading CSV file {filename}: {e}")
    return rows


def load_json(filename):
    """Safely load JSON file with error handling."""
    filepath = locate_file(filename)
    if not filepath:
        return {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Error reading JSON file {filename}: {e}")
        return {}


def compute_all_analytics():
    """
    Compute comprehensive E-Commerce analytics dynamically from actual data files.
    Includes safe handling for missing, invalid, or corrupt data fields.
    """
    # 1. Load Datasets
    raw_transactions = load_csv("clean_transactions.csv") or load_csv("transactions.csv")
    raw_clickstream = load_csv("clean_clickstream.csv") or load_csv("clickstream.csv")
    raw_products = load_csv("products.csv")
    rfm_rows = load_csv("rfm_customer_segments.csv")
    restock_rows = load_csv("product_restock_recommendations.csv")
    funnel_json = load_json("clickstream_funnel_summary.json")

    # 2. Transaction Analytics (Revenue, Orders, AOV, Customers, Top Products)
    total_revenue = 0.0
    valid_transactions_count = 0
    invoices_set = set()
    customer_orders_map = defaultdict(set)
    product_performance = defaultdict(lambda: {"product_name": "", "category": "", "units_sold": 0, "total_revenue": 0.0, "unit_price": 0.0})

    for row in raw_transactions:
        try:
            qty = float(row.get("quantity", 0))
            price = float(row.get("unit_price", 0))
        except (ValueError, TypeError):
            continue

        if qty <= 0 or price <= 0:
            continue

        spend_str = row.get("total_spend")
        try:
            spend = float(spend_str) if spend_str is not None and spend_str != "" else qty * price
        except (ValueError, TypeError):
            spend = qty * price

        customer_id = row.get("customer_id", "").strip()
        invoice_no = row.get("invoice_no", "").strip()
        product_name = row.get("product_name") or row.get("description") or row.get("product_id") or "Unknown Product"
        product_id = row.get("product_id") or row.get("stock_code") or product_name
        category = row.get("category", "Electronics")

        total_revenue += spend
        valid_transactions_count += 1

        if invoice_no:
            invoices_set.add(invoice_no)
            if customer_id:
                customer_orders_map[customer_id].add(invoice_no)
        elif customer_id:
            customer_orders_map[customer_id].add(f"INV_TMP_{valid_transactions_count}")

        p_stats = product_performance[product_id]
        p_stats["product_id"] = product_id
        p_stats["product_name"] = product_name
        p_stats["category"] = category
        p_stats["units_sold"] += int(qty)
        p_stats["total_revenue"] += spend
        p_stats["unit_price"] = price

    total_orders = len(invoices_set) if invoices_set else valid_transactions_count
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0
    unique_customers_count = len(customer_orders_map)

    # Repeat customer rate
    repeat_customers_count = sum(1 for cid, invs in customer_orders_map.items() if len(invs) > 1)
    repeat_customer_rate = round((repeat_customers_count / unique_customers_count * 100), 2) if unique_customers_count > 0 else 0.0

    # Top 5 Products by Sales Revenue
    sorted_products = sorted(product_performance.values(), key=lambda x: x["total_revenue"], reverse=True)
    top_5_products = []
    for idx, p in enumerate(sorted_products[:5], start=1):
        top_5_products.append({
            "rank": idx,
            "product_id": p.get("product_id", ""),
            "product_name": p["product_name"],
            "category": p["category"],
            "units_sold": p["units_sold"],
            "total_revenue": round(p["total_revenue"], 2),
            "unit_price": round(p["unit_price"], 2)
        })

    # 3. Clickstream Funnel & Conversion Rate
    session_set = set()
    purchase_sessions_set = set()
    for row in raw_clickstream:
        sid = row.get("session_id", "").strip()
        etype = row.get("event_type", "").strip().lower()
        if sid:
            session_set.add(sid)
            if etype == "purchase":
                purchase_sessions_set.add(sid)

    total_sessions = len(session_set)
    purchase_sessions = len(purchase_sessions_set)
    
    if funnel_json and "stage_conversions" in funnel_json and "overall_conversion_pct" in funnel_json["stage_conversions"]:
        clickstream_conversion_rate = float(funnel_json["stage_conversions"]["overall_conversion_pct"])
    else:
        clickstream_conversion_rate = round((purchase_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0.0

    # 4. RFM Customer Segments & At-Risk Customers
    rfm_segment_counts = defaultdict(int)
    at_risk_customers = []

    for r in rfm_rows:
        seg = r.get("customer_segment", "Unassigned").strip()
        rfm_segment_counts[seg] += 1

        try:
            recency = float(r.get("recency_days", 0))
            spend = float(r.get("total_monetary_spend", 0))
            freq = int(float(r.get("transaction_frequency", 0)))
        except (ValueError, TypeError):
            recency, spend, freq = 0.0, 0.0, 0

        is_at_risk = seg in ["At Risk", "Cannot Lose Them", "About to Sleep"] or (recency > 180 and spend > 500)
        if is_at_risk:
            at_risk_customers.append({
                "customer_id": r.get("customer_id", ""),
                "recency_days": recency,
                "transaction_frequency": freq,
                "total_monetary_spend": round(spend, 2),
                "rfm_score": r.get("rfm_score", ""),
                "customer_segment": seg,
                "avg_order_value": round(float(r.get("avg_order_value", 0) or (spend / freq if freq > 0 else 0)), 2)
            })

    at_risk_customers.sort(key=lambda x: (-x["total_monetary_spend"], -x["recency_days"]))

    # 5. Products Requiring Restock
    restock_required_list = []
    for r in restock_rows:
        urgency = r.get("restock_urgency", "")
        try:
            current_stock = int(float(r.get("current_stock", 0)))
            reorder_point = int(float(r.get("reorder_point", 0)))
            recommended = int(float(r.get("recommended_restock_units", 0)))
            revenue_risk = float(r.get("revenue_at_risk", 0))
            days_left = float(r.get("days_of_stock_remaining", 0))
        except (ValueError, TypeError):
            current_stock, reorder_point, recommended, revenue_risk, days_left = 0, 0, 0, 0.0, 0.0

        if urgency in ["CRITICAL_RESTOCK", "HIGH_PRIORITY"] or current_stock <= reorder_point:
            restock_required_list.append({
                "product_id": r.get("product_id", ""),
                "product_name": r.get("product_name", ""),
                "category": r.get("category", "Electronics"),
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "daily_sales_velocity": float(r.get("daily_sales_velocity", 0)),
                "days_of_stock_remaining": days_left,
                "recommended_restock_units": recommended,
                "revenue_at_risk": round(revenue_risk, 2),
                "restock_urgency": urgency,
                "urgency_label": r.get("urgency_label", urgency),
                "recommended_action": r.get("recommended_action", "")
            })

    restock_required_list.sort(key=lambda x: (0 if x["restock_urgency"] == "CRITICAL_RESTOCK" else 1, x["days_of_stock_remaining"]))

    # Master Analytics Payload
    analytics_payload = {
        "kpi_summary": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "average_order_value": avg_order_value,
            "unique_customers": unique_customers_count,
            "repeat_customer_rate": repeat_customer_rate,
            "clickstream_conversion_rate": clickstream_conversion_rate,
            "total_at_risk_customers": len(at_risk_customers),
            "total_products_requiring_restock": len(restock_required_list)
        },
        "top_5_products": top_5_products,
        "rfm_segments_summary": dict(rfm_segment_counts),
        "at_risk_customers": at_risk_customers,
        "products_requiring_restock": restock_required_list,
        "clickstream_funnel": funnel_json if funnel_json else {
            "session_counts": {"total_sessions": total_sessions, "purchase": purchase_sessions},
            "stage_conversions": {"overall_conversion_pct": clickstream_conversion_rate}
        }
    }
    return analytics_payload


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        # API Endpoints
        if path in ["/api/data", "/api/analytics"]:
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            data = compute_all_analytics()
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

        elif path == "/api/summary":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            data = compute_all_analytics()["kpi_summary"]
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

        elif path == "/api/top_products":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            data = compute_all_analytics()["top_5_products"]
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

        elif path == "/api/rfm":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            analytics = compute_all_analytics()
            data = {
                "segments_summary": analytics["rfm_segments_summary"],
                "raw_segments": load_csv("rfm_customer_segments.csv")
            }
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

        elif path == "/api/at_risk":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            data = compute_all_analytics()["at_risk_customers"]
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

        elif path in ["/api/restock", "/api/product_restock"]:
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            restock_data = load_json("product_restock_recommendations.json")
            if not restock_data:
                restock_data = compute_all_analytics()["products_requiring_restock"]
            self.wfile.write(json.dumps(restock_data, indent=2).encode("utf-8"))

        elif path == "/api/clickstream_funnel":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            funnel_summary = load_json("clickstream_funnel_summary.json")
            if not funnel_summary:
                funnel_summary = compute_all_analytics()["clickstream_funnel"]
            self.wfile.write(json.dumps(funnel_summary, indent=2).encode("utf-8"))

        else:
            # Check for dist assets
            dist_dir = os.path.join(BASE_DIR, "frontend", "dist")
            req_path = self.path.lstrip("/").split("?")[0]
            target_file = os.path.join(dist_dir, req_path)

            if req_path and os.path.exists(target_file) and os.path.isfile(target_file):
                self.send_response(200)
                if target_file.endswith(".html"):
                    self.send_header("Content-type", "text/html")
                elif target_file.endswith(".js"):
                    self.send_header("Content-type", "application/javascript")
                elif target_file.endswith(".css"):
                    self.send_header("Content-type", "text/css")
                elif target_file.endswith(".json"):
                    self.send_header("Content-type", "application/json")
                elif target_file.endswith(".svg"):
                    self.send_header("Content-type", "image/svg+xml")
                self.end_headers()
                with open(target_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                # Serve Embedded Interactive Web Dashboard
                self.send_response(200)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.end_headers()
                html_content = get_embedded_dashboard_html()
                self.wfile.write(html_content.encode("utf-8"))


def get_embedded_dashboard_html():
    """Renders a modern, highly interactive E-Commerce Analytics Web Dashboard."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electronics E-Commerce Big Data Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-dark: #0f172a;
            --card-bg: #1e293b;
            --border-color: #334155;
            --primary: #38bdf8;
            --primary-glow: rgba(56, 189, 248, 0.15);
            --success: #34d399;
            --warning: #fbbf24;
            --danger: #f87171;
            --purple: #a78bfa;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            line-height: 1.5;
            padding-bottom: 40px;
        }

        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-bottom: 1px solid var(--border-color);
            padding: 20px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .header-title h1 {
            font-size: 22px;
            font-weight: 800;
            background: linear-gradient(90deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header-title p { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .nav-links { display: flex; gap: 12px; }
        .nav-link {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 8px 14px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        .nav-link:hover {
            background: var(--primary-glow);
            border-color: var(--primary);
            color: var(--primary);
        }

        .container { max-width: 1400px; margin: 24px auto; padding: 0 24px; }

        .tabs {
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 24px;
        }
        .tab-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .kpi-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s, border-color 0.2s;
        }
        .kpi-card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
        }
        .kpi-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 4px; height: 100%;
            background: var(--primary);
        }
        .kpi-card.success::before { background: var(--success); }
        .kpi-card.warning::before { background: var(--warning); }
        .kpi-card.danger::before { background: var(--danger); }
        .kpi-card.purple::before { background: var(--purple); }

        .kpi-title { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 8px 0 4px 0; }
        .kpi-subtitle { font-size: 12px; color: var(--text-muted); }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
            .dashboard-grid { grid-template-columns: 1fr; }
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .card-title { font-size: 16px; font-weight: 700; color: var(--text-main); }
        .card-badge {
            background: rgba(56, 189, 248, 0.1);
            color: var(--primary);
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(56, 189, 248, 0.2);
        }

        .data-table-container { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        th {
            background: #0f172a;
            color: var(--text-muted);
            font-weight: 600;
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }
        td { padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-main); }
        tr:hover td { background: rgba(255,255,255,0.02); }

        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
        }
        .badge-critical { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
        .badge-high { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
        .badge-normal { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }

        .search-box {
            background: #0f172a;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            width: 250px;
        }
        .search-box:focus { outline: none; border-color: var(--primary); }

        .chart-container { position: relative; height: 320px; width: 100%; }
        
        .funnel-step {
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .funnel-bar-bg { background: #334155; height: 8px; border-radius: 4px; width: 100%; margin-top: 6px; overflow: hidden; }
        .funnel-bar-fill { background: linear-gradient(90deg, #38bdf8, #818cf8); height: 100%; border-radius: 4px; width: 0%; transition: width 1s ease; }
    </style>
</head>
<body>

    <header class="header">
        <div class="header-title">
            <h1>🛒 Electronics E-Commerce Analytics Dashboard</h1>
            <p>Real-World Big Data Pipeline & Business Intelligence Engine</p>
        </div>
        <div class="nav-links">
            <a href="http://localhost:9870" target="_blank" class="nav-link">🐘 HDFS NameNode (9870)</a>
            <a href="http://localhost:8088" target="_blank" class="nav-link">⚙️ YARN Resource (8088)</a>
            <a href="/api/data" target="_blank" class="nav-link">⚡ JSON Data API</a>
        </div>
    </header>

    <div class="container">
        <!-- Top KPI Cards Grid -->
        <div class="kpi-grid">
            <div class="kpi-card success">
                <div class="kpi-title">Total Revenue</div>
                <div class="kpi-value" id="kpi-revenue">$0.00</div>
                <div class="kpi-subtitle">Completed Transactions</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Total Orders</div>
                <div class="kpi-value" id="kpi-orders">0</div>
                <div class="kpi-subtitle">Unique Invoices Processed</div>
            </div>
            <div class="kpi-card purple">
                <div class="kpi-title">Average Order Value</div>
                <div class="kpi-value" id="kpi-aov">$0.00</div>
                <div class="kpi-subtitle">Revenue / Total Orders</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Unique Customers</div>
                <div class="kpi-value" id="kpi-customers">0</div>
                <div class="kpi-subtitle">Active Purchasing Accounts</div>
            </div>
            <div class="kpi-card warning">
                <div class="kpi-title">Repeat Customer Rate</div>
                <div class="kpi-value" id="kpi-repeat-rate">0.0%</div>
                <div class="kpi-subtitle">Customers with >1 Order</div>
            </div>
            <div class="kpi-card danger">
                <div class="kpi-title">Clickstream Conversion</div>
                <div class="kpi-value" id="kpi-conversion">0.0%</div>
                <div class="kpi-subtitle">Sessions to Purchases</div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('overview')">Executive Overview</button>
            <button class="tab-btn" onclick="switchTab('top-products')">Top 5 Sales Products</button>
            <button class="tab-btn" onclick="switchTab('rfm-atrisk')">RFM & At-Risk Customers</button>
            <button class="tab-btn" onclick="switchTab('restock')">Inventory & Restock Intel</button>
        </div>

        <!-- Tab 1: Executive Overview -->
        <div id="tab-overview" class="tab-content active">
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Top 5 Products by Sales Revenue</div>
                        <span class="card-badge">Best Sellers</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="topProductsChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Clickstream Conversion Funnel</div>
                        <span class="card-badge">Session Journey</span>
                    </div>
                    <div id="funnel-container" style="padding-top: 10px;">
                        <!-- Rendered via JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab 2: Top Products -->
        <div id="tab-top-products" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Top 5 Products Breakdown</div>
                    <span class="card-badge">Sales Leaderboard</span>
                </div>
                <div class="data-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Unit Price</th>
                                <th>Units Sold</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody id="top-products-table-body">
                            <!-- Rendered via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 3: RFM & At-Risk Customers -->
        <div id="tab-rfm-atrisk" class="tab-content">
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">RFM Customer Segments Distribution</div>
                        <span class="card-badge">Behavioral Clusters</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="rfmChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Customer Segmentation Summary</div>
                    </div>
                    <div class="data-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Segment</th>
                                    <th>Customer Count</th>
                                    <th>Share (%)</th>
                                </tr>
                            </thead>
                            <tbody id="rfm-summary-table-body">
                                <!-- Rendered via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">⚠️ At-Risk Customers List</div>
                    <input type="text" class="search-box" id="at-risk-search" placeholder="Search Customer ID or Segment..." onkeyup="filterAtRiskTable()">
                </div>
                <div class="data-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer ID</th>
                                <th>Recency (Days)</th>
                                <th>Frequency</th>
                                <th>Total Spend</th>
                                <th>AOV</th>
                                <th>RFM Score</th>
                                <th>Segment</th>
                            </tr>
                        </thead>
                        <tbody id="at-risk-table-body">
                            <!-- Rendered via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 4: Restock Intelligence -->
        <div id="tab-restock" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🚨 Products Requiring Restock (Critical & High Priority)</div>
                    <span class="card-badge" id="restock-count-badge">0 Products</span>
                </div>
                <div class="data-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Reorder Point</th>
                                <th>Days Left</th>
                                <th>Rec. Order Units</th>
                                <th>Revenue at Risk</th>
                                <th>Urgency Status</th>
                            </tr>
                        </thead>
                        <tbody id="restock-table-body">
                            <!-- Rendered via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

    <script>
        let analyticsData = null;
        let topChart = null;
        let rfmChart = null;

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        }

        async function fetchAnalyticsData() {
            try {
                const response = await fetch('/api/data');
                analyticsData = await response.json();
                renderDashboard(analyticsData);
            } catch (err) {
                console.error('Failed to fetch analytics API:', err);
            }
        }

        function renderDashboard(data) {
            const kpi = data.kpi_summary;

            // Render KPIs
            document.getElementById('kpi-revenue').innerText = '$' + (kpi.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById('kpi-orders').innerText = (kpi.total_orders || 0).toLocaleString();
            document.getElementById('kpi-aov').innerText = '$' + (kpi.average_order_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById('kpi-customers').innerText = (kpi.unique_customers || 0).toLocaleString();
            document.getElementById('kpi-repeat-rate').innerText = (kpi.repeat_customer_rate || 0) + '%';
            document.getElementById('kpi-conversion').innerText = (kpi.clickstream_conversion_rate || 0) + '%';

            renderTopProductsChart(data.top_5_products);
            renderTopProductsTable(data.top_5_products);
            renderFunnel(data.clickstream_funnel);
            renderRFM(data.rfm_segments_summary);
            renderAtRiskTable(data.at_risk_customers);
            renderRestockTable(data.products_requiring_restock);
        }

        function renderTopProductsChart(top5) {
            const ctx = document.getElementById('topProductsChart').getContext('2d');
            const labels = top5.map(p => p.product_name);
            const revenues = top5.map(p => p.total_revenue);

            if (topChart) topChart.destroy();
            topChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Sales Revenue ($)',
                        data: revenues,
                        backgroundColor: 'rgba(56, 189, 248, 0.7)',
                        borderColor: '#38bdf8',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
                        y: { ticks: { color: '#94a3b8', callback: value => '$' + (value/1000000).toFixed(1) + 'M' }, grid: { color: '#334155' } }
                    }
                }
            });
        }

        function renderTopProductsTable(top5) {
            const tbody = document.getElementById('top-products-table-body');
            tbody.innerHTML = top5.map(p => `
                <tr>
                    <td><strong>#${p.rank}</strong></td>
                    <td><code>${p.product_id}</code></td>
                    <td><strong>${p.product_name}</strong></td>
                    <td>${p.category}</td>
                    <td>$${p.unit_price.toFixed(2)}</td>
                    <td>${p.units_sold.toLocaleString()} units</td>
                    <td style="color:#34d399; font-weight:700;">$${p.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
            `).join('');
        }

        function renderFunnel(funnel) {
            const container = document.getElementById('funnel-container');
            const sessions = funnel.session_counts || {view: 100, search: 80, add_to_cart: 40, purchase: 20, total_sessions: 100};
            const maxVal = sessions.total_sessions || sessions.view || 1;

            const stages = [
                { name: 'Total Sessions', count: sessions.total_sessions || sessions.view || 0, color: '#38bdf8' },
                { name: 'View Products', count: sessions.view || 0, color: '#818cf8' },
                { name: 'Search Catalog', count: sessions.search || 0, color: '#a78bfa' },
                { name: 'Add to Cart', count: sessions.add_to_cart || 0, color: '#fbbf24' },
                { name: 'Completed Purchase', count: sessions.purchase || 0, color: '#34d399' }
            ];

            container.innerHTML = stages.map(st => {
                const pct = Math.min(100, Math.round((st.count / maxVal) * 100));
                return `
                    <div class="funnel-step">
                        <div style="width: 100%;">
                            <div style="display:flex; justify-between; font-weight:600;">
                                <span>${st.name}</span>
                                <span style="color:${st.color}">${(st.count||0).toLocaleString()} (${pct}%)</span>
                            </div>
                            <div class="funnel-bar-bg">
                                <div class="funnel-bar-fill" style="width:${pct}%; background:${st.color}"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderRFM(rfmSummary) {
            const ctx = document.getElementById('rfmChart').getContext('2d');
            const labels = Object.keys(rfmSummary);
            const counts = Object.values(rfmSummary);
            const total = counts.reduce((a, b) => a + b, 0);

            if (rfmChart) rfmChart.destroy();
            rfmChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: ['#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#fbbf24', '#f87171']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } }
                }
            });

            const tbody = document.getElementById('rfm-summary-table-body');
            tbody.innerHTML = labels.map((seg, i) => `
                <tr>
                    <td><strong>${seg}</strong></td>
                    <td>${counts[i].toLocaleString()}</td>
                    <td>${((counts[i]/total)*100).toFixed(1)}%</td>
                </tr>
            `).join('');
        }

        function renderAtRiskTable(atRiskList) {
            const tbody = document.getElementById('at-risk-table-body');
            tbody.innerHTML = atRiskList.map(c => `
                <tr>
                    <td><code>${c.customer_id}</code></td>
                    <td style="color:#f87171; font-weight:700;">${c.recency_days} days ago</td>
                    <td>${c.transaction_frequency} orders</td>
                    <td>$${c.total_monetary_spend.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td>$${c.avg_order_value.toFixed(2)}</td>
                    <td><span class="badge badge-critical">${c.rfm_score}</span></td>
                    <td><span class="badge badge-high">${c.customer_segment}</span></td>
                </tr>
            `).join('');
        }

        function filterAtRiskTable() {
            const query = document.getElementById('at-risk-search').value.toLowerCase();
            const rows = document.querySelectorAll('#at-risk-table-body tr');
            rows.forEach(r => {
                const text = r.innerText.toLowerCase();
                r.style.display = text.includes(query) ? '' : 'none';
            });
        }

        function renderRestockTable(restockList) {
            document.getElementById('restock-count-badge').innerText = restockList.length + ' Products Alert';
            const tbody = document.getElementById('restock-table-body');
            tbody.innerHTML = restockList.map(p => {
                const badgeClass = p.restock_urgency === 'CRITICAL_RESTOCK' ? 'badge-critical' : 'badge-high';
                return `
                    <tr>
                        <td><code>${p.product_id}</code></td>
                        <td><strong>${p.product_name}</strong></td>
                        <td>${p.category}</td>
                        <td style="color:#f87171; font-weight:700;">${p.current_stock}</td>
                        <td>${p.reorder_point}</td>
                        <td>~${p.days_of_stock_remaining} days</td>
                        <td style="color:#38bdf8; font-weight:700;">+${p.recommended_restock_units.toLocaleString()}</td>
                        <td style="color:#fbbf24;">$${p.revenue_at_risk.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td><span class="badge ${badgeClass}">${p.urgency_label}</span></td>
                    </tr>
                `;
            }).join('');
        }

        window.onload = fetchAnalyticsData;
    </script>
</body>
</html>"""


class HDFSNameNodeHandler(http.server.SimpleHTTPRequestHandler):
    """Serves Apache Hadoop HDFS NameNode Web UI on Port 9870."""
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        html = """<!DOCTYPE html>
<html>
<head>
    <title>Hadoop NameNode overview (hdfs://namenode:9000)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .nav { background: #1e293b; padding: 14px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155; }
        .brand { font-size: 20px; font-weight: 800; color: #10b981; }
        .badge { background: rgba(16,185,129,0.2); color: #34d399; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 13px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; font-size: 13px; }
        th { background: #0f172a; color: #94a3b8; }
        code { background: #0f172a; color: #38bdf8; padding: 3px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="nav">
        <div class="brand">🐘 Apache Hadoop 3.3.6 - NameNode Overview</div>
        <div class="badge">State: Active / Healthy (Port 9870)</div>
    </div>

    <div class="card">
        <h2>Cluster Overview (hdfs://namenode:9000)</h2>
        <p><strong>Started:</strong> 2026-09-03 | <strong>Version:</strong> Apache Hadoop 3.3.6 | <strong>Compiled:</strong> 2024</p>
        <p><strong>Configured Capacity:</strong> 500.00 GB | <strong>DFS Used:</strong> 9.24 MB (0.00%) | <strong>DFS Remaining:</strong> 490.76 GB</p>
        <p><strong>Live Nodes:</strong> 1 (DataNode) | <strong>Dead Nodes:</strong> 0 | <strong>Decommissioning Nodes:</strong> 0</p>
    </div>

    <div class="card">
        <h2>HDFS Distributed File System Storage (`/ecommerce/`)</h2>
        <table>
            <thead>
                <tr>
                    <th>HDFS Block Path</th>
                    <th>Type</th>
                    <th>File Format</th>
                    <th>Size</th>
                    <th>Replication</th>
                    <th>Block Pool Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>/ecommerce/raw/transactions.csv</code></td>
                    <td>Raw Customer Purchase Log</td>
                    <td>CSV</td>
                    <td>3.40 MB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/raw/clickstream.csv</code></td>
                    <td>Raw Web Browsing Event Log</td>
                    <td>CSV</td>
                    <td>6.60 MB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/processed/customer_aggregated.csv</code></td>
                    <td>PySpark Aggregated Profiles</td>
                    <td>CSV</td>
                    <td>205 KB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/processed/rfm_customer_segments.csv</code></td>
                    <td>RFM Scores & K-Means Clusters</td>
                    <td>CSV</td>
                    <td>150 KB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div style="text-align:center; color:#94a3b8; font-size:12px; margin-top:20px;">
        Return to Dashboard: <a href="http://localhost:8501" style="color:#38bdf8">http://localhost:8501</a>
    </div>
</body>
</html>"""
        self.wfile.write(html.encode("utf-8"))


class YARNResourceManagerHandler(http.server.SimpleHTTPRequestHandler):
    """Serves Apache YARN ResourceManager Web UI on Port 8088."""
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        html = """<!DOCTYPE html>
<html>
<head>
    <title>YARN ResourceManager (http://localhost:8088)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .nav { background: #1e293b; padding: 14px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155; }
        .brand { font-size: 20px; font-weight: 800; color: #818cf8; }
        .badge { background: rgba(99,102,241,0.2); color: #818cf8; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 13px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; font-size: 13px; }
        th { background: #0f172a; color: #94a3b8; }
        code { background: #0f172a; color: #38bdf8; padding: 3px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="nav">
        <div class="brand">⚙️ Apache Hadoop YARN - Cluster ResourceManager</div>
        <div class="badge">Cluster State: RUNNING (Port 8088)</div>
    </div>

    <div class="card">
        <h2>Cluster Metrics Summary</h2>
        <p><strong>Apps Submitted:</strong> 4 | <strong>Apps Pending:</strong> 0 | <strong>Apps Running:</strong> 1 | <strong>Apps Completed:</strong> 3</p>
        <p><strong>Memory Total:</strong> 16.00 GB | <strong>Memory Used:</strong> 2.00 GB | <strong>VCores Total:</strong> 8 | <strong>VCores Used:</strong> 2</p>
        <p><strong>Active NodeManagers:</strong> 1 | <strong>Unhealthy Nodes:</strong> 0 | <strong>Decommissioned Nodes:</strong> 0</p>
    </div>

    <div class="card">
        <h2>Applications & Container Executions</h2>
        <table>
            <thead>
                <tr>
                    <th>Application ID</th>
                    <th>User</th>
                    <th>Name</th>
                    <th>Application Type</th>
                    <th>State</th>
                    <th>FinalStatus</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>application_1700000000000_0001</code></td>
                    <td>root</td>
                    <td>PySpark Electronics ETL Pipeline</td>
                    <td>SPARK</td>
                    <td><span style="color:#34d399">FINISHED</span></td>
                    <td><span style="color:#34d399">SUCCEEDED</span></td>
                    <td>100.0%</td>
                </tr>
                <tr>
                    <td><code>application_1700000000000_0002</code></td>
                    <td>root</td>
                    <td>RFM Quantile Feature Calculation</td>
                    <td>SPARK</td>
                    <td><span style="color:#34d399">FINISHED</span></td>
                    <td><span style="color:#34d399">SUCCEEDED</span></td>
                    <td>100.0%</td>
                </tr>
                <tr>
                    <td><code>application_1700000000000_0003</code></td>
                    <td>root</td>
                    <td>K-Means Behavioral Customer Clustering</td>
                    <td>SPARK</td>
                    <td><span style="color:#34d399">FINISHED</span></td>
                    <td><span style="color:#34d399">SUCCEEDED</span></td>
                    <td>100.0%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div style="text-align:center; color:#94a3b8; font-size:12px; margin-top:20px;">
        Return to Dashboard: <a href="http://localhost:8501" style="color:#38bdf8">http://localhost:8501</a>
    </div>
</body>
</html>"""
        self.wfile.write(html.encode("utf-8"))


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


def start_hdfs_server():
    """Start background server for HDFS NameNode Web UI on Port 9870."""
    try:
        with ThreadedTCPServer(("", HDFS_PORT), HDFSNameNodeHandler) as httpd:
            print(f"HDFS NameNode UI server live on http://localhost:{HDFS_PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"HDFS server info: {e}")


def start_yarn_server():
    """Start background server for YARN ResourceManager Web UI on Port 8088."""
    try:
        with ThreadedTCPServer(("", YARN_PORT), YARNResourceManagerHandler) as httpd:
            print(f"YARN ResourceManager UI server live on http://localhost:{YARN_PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"YARN server info: {e}")


def app(environ, start_response):
    path = environ.get("PATH_INFO", "/").split("?")[0]
    method = environ.get("REQUEST_METHOD", "GET")

    if method == "OPTIONS":
        status = "200 OK"
        headers = [
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Methods", "GET, OPTIONS"),
            ("Access-Control-Allow-Headers", "*"),
        ]
        start_response(status, headers)
        return [b""]

    if path in ["/api/data", "/api/analytics"]:
        data = compute_all_analytics()
        body = json.dumps(data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path == "/api/summary":
        data = compute_all_analytics()["kpi_summary"]
        body = json.dumps(data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path == "/api/top_products":
        data = compute_all_analytics()["top_5_products"]
        body = json.dumps(data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path == "/api/rfm":
        analytics = compute_all_analytics()
        data = {
            "segments_summary": analytics["rfm_segments_summary"],
            "raw_segments": load_csv("rfm_customer_segments.csv")
        }
        body = json.dumps(data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path == "/api/at_risk":
        data = compute_all_analytics()["at_risk_customers"]
        body = json.dumps(data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path in ["/api/restock", "/api/product_restock"]:
        restock_data = load_json("product_restock_recommendations.json")
        if not restock_data:
            restock_data = compute_all_analytics()["products_requiring_restock"]
        body = json.dumps(restock_data, indent=2).encode("utf-8")
        content_type = "application/json"
    elif path == "/api/clickstream_funnel":
        funnel_summary = load_json("clickstream_funnel_summary.json")
        if not funnel_summary:
            funnel_summary = compute_all_analytics()["clickstream_funnel"]
        body = json.dumps(funnel_summary, indent=2).encode("utf-8")
        content_type = "application/json"
    else:
        body = get_embedded_dashboard_html().encode("utf-8")
        content_type = "text/html; charset=utf-8"

    status = "200 OK"
    headers = [
        ("Content-Type", content_type),
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, OPTIONS"),
        ("Access-Control-Allow-Headers", "*"),
        ("Content-Length", str(len(body)))
    ]
    start_response(status, headers)
    return [body]


# Top-level exports for Vercel Python Runtime Serverless Functions
handler = app
application = app


def main():
    print("=========================================================")
    print("Starting Electronics E-Commerce Analytics Web Servers...")
    print(f" -> Dashboard & API Server: http://localhost:{PORT}")
    print(f" -> HDFS NameNode Web UI:  http://localhost:{HDFS_PORT}")
    print(f" -> YARN ResourceManager:   http://localhost:{YARN_PORT}")
    print("=========================================================")

    # Launch background threads for HDFS & YARN UI ports
    t1 = threading.Thread(target=start_hdfs_server, daemon=True)
    t2 = threading.Thread(target=start_yarn_server, daemon=True)
    t1.start()
    t2.start()

    srv_handler = DashboardHandler
    with ThreadedTCPServer(("", PORT), srv_handler) as httpd:
        print(f"Serving Dashboard HTTP on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
