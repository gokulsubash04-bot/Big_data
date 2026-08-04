# ==============================================================================
# Script 04: RFM Customer Segmentation & K-Means Clustering (Python)
# Quantile Scoring, K-Means Clustering & Customer Segment Profiling
# ==============================================================================

import os
import csv
import math
from datetime import datetime
from collections import defaultdict

def main():
    print("=========================================================")
    print("Starting RFM Customer Segmentation (Python Engine)...")
    print("=========================================================")

    proc_dir = os.path.join("data", "processed")
    cust_path = os.path.join(proc_dir, "customer_aggregated.csv")

    if not os.path.exists(cust_path):
        raise FileNotFoundError("Customer aggregated dataset missing. Run 02_spark_etl_pipeline.py first!")

    customers = []
    with open(cust_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if float(r["transaction_frequency"]) > 0 and float(r["total_monetary_spend"]) > 0:
                customers.append(r)

    # Reference Analysis Date
    ref_date = datetime(2025, 1, 1, 0, 0, 0)

    # 1. Compute Recency, Frequency, Monetary Values
    for c in customers:
        last_date = datetime.strptime(c["last_purchase"], "%Y-%m-%d %H:%M:%S")
        recency_days = round(max(0.0, (ref_date - last_date).total_seconds() / 86400.0), 1)
        c["recency_days"] = recency_days
        c["frequency"] = int(c["transaction_frequency"])
        c["monetary"] = float(c["total_monetary_spend"])

    # 2. RFM Quantile Scoring (1 to 5 scale)
    def calculate_quantiles(val_list, num_bins=5, reverse=False):
        sorted_vals = sorted(val_list)
        n = len(sorted_vals)
        quantiles = [sorted_vals[int(n * i / num_bins)] for i in range(1, num_bins)]
        
        scores = []
        for val in val_list:
            score = 1
            for q in quantiles:
                if val >= q:
                    score += 1
            scores.append((6 - score) if reverse else score)
        return scores

    r_vals = [c["recency_days"] for c in customers]
    f_vals = [c["frequency"] for c in customers]
    m_vals = [c["monetary"] for c in customers]

    r_scores = calculate_quantiles(r_vals, reverse=True) # Lower recency = higher score
    f_scores = calculate_quantiles(f_vals, reverse=False)
    m_scores = calculate_quantiles(m_vals, reverse=False)

    def assign_segment(r, f, m):
        if r >= 4 and f >= 4 and m >= 4:
            return "Champions"
        elif f >= 3 and m >= 3:
            return "Loyal Customers"
        elif r >= 4 and f <= 2:
            return "New Customers"
        elif r <= 2 and f >= 3:
            return "At Risk"
        elif r <= 2 and f <= 2 and m <= 2:
            return "Lost"
        else:
            return "Potential Loyalists"

    segment_counts = defaultdict(int)
    for i, c in enumerate(customers):
        r, f, m = r_scores[i], f_scores[i], m_scores[i]
        c["r_score"] = r
        c["f_score"] = f
        c["m_score"] = m
        c["rfm_score"] = f"{r}{f}{m}"
        c["rfm_total"] = r + f + m
        seg = assign_segment(r, f, m)
        c["customer_segment"] = seg
        segment_counts[seg] += 1

    print("\nCustomer Segment Distribution:")
    for seg, count in segment_counts.items():
        print(f" - {seg}: {count} customers")

    # 3. K-Means Behavioral Clustering
    # Normalize features and run k-means
    log_rec = [math.log1p(c["recency_days"]) for c in customers]
    log_freq = [math.log1p(c["frequency"]) for c in customers]
    log_mon = [math.log1p(c["monetary"]) for c in customers]

    def standardize(lst):
        mean = sum(lst) / len(lst)
        std = math.sqrt(sum((x - mean) ** 2 for x in lst) / len(lst)) or 1.0
        return [(x - mean) / std for x in lst]

    z_rec = standardize(log_rec)
    z_freq = standardize(log_freq)
    z_mon = standardize(log_mon)

    # Initial centroids (K=4)
    centroids = [[-1.0, 1.0, 1.0], [1.0, -1.0, -1.0], [0.0, 0.0, 0.0], [0.5, 0.5, 0.5]]
    
    for iteration in range(10):
        clusters = defaultdict(list)
        for idx in range(len(customers)):
            pt = [z_rec[idx], z_freq[idx], z_mon[idx]]
            distances = [math.sqrt(sum((pt[d] - c[d]) ** 2 for d in range(3))) for c in centroids]
            best_c = distances.index(min(distances))
            clusters[best_c].append(pt)
            customers[idx]["cluster_id"] = f"Cluster_{best_c + 1}"

        for k in range(4):
            if clusters[k]:
                centroids[k] = [sum(pt[d] for pt in clusters[k]) / len(clusters[k]) for d in range(3)]

    # Save Processed RFM Dataset
    output_path = os.path.join(proc_dir, "rfm_customer_segments.csv")
    fieldnames = list(customers[0].keys())

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(customers)

    print(f"\nSuccessfully exported RFM & Segment data to '{output_path}'.")

if __name__ == "__main__":
    main()
