# ==============================================================================
# Python Web Dashboard Application & Analytics API Server
# Serves JSON analytics endpoints and builds static React frontend assets
# ==============================================================================

import os
import sys
import json
import csv
import http.server
import socketserver

PORT = 8501
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
                "market_basket_rules": load_csv("market_basket_rules.csv"),
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
