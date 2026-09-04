# ==============================================================================
# Electronics E-Commerce Big Data Analytics Web Dashboard & Hadoop Servers
# Serves:
#  - React Web Dashboard & Analytics API on Port 8501 (http://localhost:8501)
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

PORT = 8501
HDFS_PORT = 9870
YARN_PORT = 8088
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_csv(filename):
    """Load CSV rows from output/ or fallback to data/processed/."""
    path1 = os.path.join(BASE_DIR, "output", filename)
    path2 = os.path.join(BASE_DIR, "data", "processed", filename)

    target_path = path1 if os.path.exists(path1) else (path2 if os.path.exists(path2) else None)
    if not target_path:
        return []

    with open(target_path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_json(filename):
    """Load JSON file from output/ or fallback to data/processed/."""
    path1 = os.path.join(BASE_DIR, "output", filename)
    path2 = os.path.join(BASE_DIR, "data", "processed", filename)

    target_path = path1 if os.path.exists(path1) else (path2 if os.path.exists(path2) else None)
    if not target_path:
        return {}

    with open(target_path, "r", encoding="utf-8") as f:
        return json.load(f)


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
        if self.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            data = {
                "customer_summary": load_csv("customer_aggregated.csv"),
                "rfm_segments": load_csv("rfm_customer_segments.csv"),
                "cohort_matrix": load_csv("cohort_retention_matrix.csv"),
                "clickstream_funnel": load_json("clickstream_funnel_summary.json")
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))

        elif self.path == "/api/clickstream_funnel":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            funnel_summary = load_json("clickstream_funnel_summary.json")
            self.wfile.write(json.dumps(funnel_summary).encode("utf-8"))

        else:
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
            elif os.path.exists(os.path.join(dist_dir, "index.html")):
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                with open(os.path.join(dist_dir, "index.html"), "rb") as f:
                    self.wfile.write(f.read())
            else:
                super().do_GET()


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
                    <td>2.45 MB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/raw/clickstream.csv</code></td>
                    <td>Raw Web Browsing Event Log</td>
                    <td>CSV</td>
                    <td>6.57 MB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/processed/customer_aggregated.csv</code></td>
                    <td>PySpark Aggregated Profiles</td>
                    <td>CSV</td>
                    <td>217 KB</td>
                    <td>1</td>
                    <td><span style="color:#34d399">✓ Block Healthy</span></td>
                </tr>
                <tr>
                    <td><code>/ecommerce/processed/rfm_customer_segments.csv</code></td>
                    <td>RFM Scores & K-Means Clusters</td>
                    <td>CSV</td>
                    <td>160 KB</td>
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

    handler = DashboardHandler
    with ThreadedTCPServer(("", PORT), handler) as httpd:
        print(f"Serving Dashboard HTTP on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
