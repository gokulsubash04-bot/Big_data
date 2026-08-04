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
            # Serve React built static assets from frontend/dist if available
            dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
            req_path = self.path.lstrip("/")
            target_file = os.path.join(dist_dir, req_path)

            if os.path.exists(target_file) and os.path.isfile(target_file):
                self.send_response(200)
                if target_file.endswith(".html"):
                    self.send_header("Content-type", "text/html")
                elif target_file.endswith(".js"):
                    self.send_header("Content-type", "application/javascript")
                elif target_file.endswith(".css"):
                    self.send_header("Content-type", "text/css")
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

def main():
    print("=========================================================")
    print(f"Starting Python E-Commerce Analytics Web Dashboard...")
    print(f"API Server & React Frontend URL: http://localhost:{PORT}")
    print("=========================================================")

    handler = DashboardHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving HTTP on port {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
