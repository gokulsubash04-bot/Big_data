# ==============================================================================
# RFM Customer Segmentation & K-Means Clustering Analysis
# Calculates Recency, Frequency, Monetary Scores, Rule Segments, and K-Means Clusters
# ==============================================================================

import csv
import math
import os
from datetime import datetime
from collections import defaultdict
from segmentation import assign_segment


def calculate_quantile_scores(values, num_bins=5, reverse=False):
    """Safely divide a list of numerical values into 1-5 quantile scores."""
    n = len(values)
    if n == 0:
        return []
    sorted_values = sorted(values)

    quantiles = [sorted_values[int(n * i / num_bins)] for i in range(1, num_bins)]
    scores = []
    for value in values:
        score = 1
        for threshold in quantiles:
            if value >= threshold:
                score += 1
        scores.append(6 - score if reverse else score)
    return scores


def run_kmeans_clustering(customers, k=4, max_iter=15):
    """Perform 3D K-Means clustering on Log-standardized Recency, Frequency, Monetary metrics."""
    if not customers:
        return customers

    log_rec = [math.log1p(float(c.get("recency_days", 0))) for c in customers]
    log_freq = [math.log1p(float(c.get("transaction_frequency", 0))) for c in customers]
    log_mon = [math.log1p(float(c.get("total_monetary_spend", 0))) for c in customers]

    def standardize(lst):
        n = len(lst)
        if n == 0:
            return []
        mean = sum(lst) / n
        variance = sum((x - mean) ** 2 for x in lst) / n
        std = math.sqrt(variance) if variance > 0 else 1.0
        return [(x - mean) / std for x in lst]

    z_rec = standardize(log_rec)
    z_freq = standardize(log_freq)
    z_mon = standardize(log_mon)

    # Initial centroid seeds
    centroids = [
        [-1.0, 1.0, 1.0],
        [1.0, -1.0, -1.0],
        [0.0, 0.0, 0.0],
        [0.5, 0.5, 0.5]
    ][:k]

    for iteration in range(max_iter):
        clusters = defaultdict(list)
        for idx in range(len(customers)):
            pt = [z_rec[idx], z_freq[idx], z_mon[idx]]
            distances = [math.sqrt(sum((pt[d] - c[d]) ** 2 for d in range(3))) for c in centroids]
            best_c = distances.index(min(distances))
            clusters[best_c].append(pt)
            customers[idx]["cluster_id"] = f"Cluster_{best_c + 1}"

        for cluster_idx in range(k):
            if clusters[cluster_idx]:
                centroids[cluster_idx] = [
                    sum(pt[d] for pt in clusters[cluster_idx]) / len(clusters[cluster_idx])
                    for d in range(3)
                ]

    return customers


def run_rfm_analysis(output_dir):
    """Execute RFM scoring, segment mapping, and K-means behavioral clustering."""
    customer_path = os.path.join(output_dir, "customer_aggregated.csv")
    if not os.path.exists(customer_path):
        # Fallback to data/processed if output directory is empty
        customer_path = os.path.join(os.path.dirname(output_dir), "data", "processed", "customer_aggregated.csv")
        if not os.path.exists(customer_path):
            raise FileNotFoundError("Customer aggregated dataset missing. Run data cleaning first.")

    customers = []
    with open(customer_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            freq = float(row.get("transaction_frequency", 0))
            mon = float(row.get("total_monetary_spend", 0))
            if freq > 0 and mon > 0:
                customers.append(row)

    if not customers:
        print("No valid customers found for RFM analysis.")
        return

    ref_date = datetime(2025, 1, 1, 0, 0, 0)

    for row in customers:
        lp_str = row.get("last_purchase", "")
        if lp_str:
            try:
                last_purchase = datetime.strptime(lp_str, "%Y-%m-%d %H:%M:%S")
                recency_days = round(max(0.0, (ref_date - last_purchase).total_seconds() / 86400.0), 1)
            except ValueError:
                recency_days = 999.0
        else:
            recency_days = 999.0

        row["recency_days"] = recency_days
        row["transaction_frequency"] = int(row.get("transaction_frequency", 0))
        row["frequency"] = row["transaction_frequency"]
        row["total_monetary_spend"] = float(row.get("total_monetary_spend", 0))
        row["monetary"] = row["total_monetary_spend"]

    recencies = [row["recency_days"] for row in customers]
    frequencies = [row["transaction_frequency"] for row in customers]
    monetaries = [row["total_monetary_spend"] for row in customers]

    r_scores = calculate_quantile_scores(recencies, reverse=True)
    f_scores = calculate_quantile_scores(frequencies, reverse=False)
    m_scores = calculate_quantile_scores(monetaries, reverse=False)

    for i, row in enumerate(customers):
        r = r_scores[i]
        f = f_scores[i]
        m = m_scores[i]
        row["r_score"] = r
        row["f_score"] = f
        row["m_score"] = m
        row["rfm_score"] = f"{r}{f}{m}"
        row["customer_segment"] = assign_segment(r, f, m)

    # Perform K-Means Clustering
    customers = run_kmeans_clustering(customers)

    fieldnames = [
        "customer_id", "recency_days", "transaction_frequency", "total_monetary_spend",
        "r_score", "f_score", "m_score", "rfm_score", "customer_segment", "cluster_id",
        "avg_order_value"
    ]

    out_rows = []
    for row in customers:
        out_rows.append({k: row.get(k, "") for k in fieldnames})

    # Save output CSV to output_dir
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "rfm_customer_segments.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    # Sync output CSV to data/processed/
    proc_dir = os.path.abspath(os.path.join(output_dir, "..", "data", "processed"))
    os.makedirs(proc_dir, exist_ok=True)
    proc_output_path = os.path.join(proc_dir, "rfm_customer_segments.csv")
    with open(proc_output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print("RFM analysis and K-Means clustering complete.")
