# ==============================================================================
# Python Web Dashboard Application
# Big Data Customer Analytics Dashboard Server
# ==============================================================================

import os
import sys
import json
import csv
import http.server
import socketserver
import webbrowser

PORT = 8501

def load_csv(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            with open("index.html", "rb") as f:
                self.wfile.write(f.read())
        elif self.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            funnel_summary = {}
            if os.path.exists("data/processed/clickstream_funnel_summary.json"):
                with open("data/processed/clickstream_funnel_summary.json", "r", encoding="utf-8") as f:
                    funnel_summary = json.load(f)
            data = {
                "customer_summary": load_csv("data/processed/customer_aggregated.csv"),
                "rfm_segments": load_csv("data/processed/rfm_customer_segments.csv"),
                "cohort_matrix": load_csv("data/processed/cohort_retention_matrix.csv"),
                "market_basket_rules": load_csv("data/processed/market_basket_rules.csv"),
                "clickstream_funnel": funnel_summary
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))
        elif self.path == "/api/clickstream_funnel":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            funnel_summary = {}
            if os.path.exists("data/processed/clickstream_funnel_summary.json"):
                with open("data/processed/clickstream_funnel_summary.json", "r", encoding="utf-8") as f:
                    funnel_summary = json.load(f)
            self.wfile.write(json.dumps(funnel_summary).encode("utf-8"))
        else:
            super().do_GET()

def main():
    print("=========================================================")
    print(f"Starting Python E-Commerce Analytics Web Dashboard...")
    print(f"URL: http://localhost:{PORT}")
    print("=========================================================")

    # Ensure index.html exists
    if not os.path.exists("index.html"):
        print("Generating index.html...")
        import subprocess
        subprocess.run([sys.executable, "scripts/node_pipeline_runner.js"], check=False)

    handler = DashboardHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving HTTP on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
