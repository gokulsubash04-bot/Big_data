# ==============================================================================
# Monthly Customer Cohort Retention Analysis
# Computes multi-month active user retention percentage matrix
# ==============================================================================

import csv
import os
from collections import defaultdict


def run_cohort_analysis(output_dir):
    """Calculate multi-month cohort retention percentage matrix."""
    clean_trans_path = os.path.join(output_dir, "clean_transactions.csv")
    if not os.path.exists(clean_trans_path):
        clean_trans_path = os.path.join(os.path.dirname(output_dir), "data", "processed", "clean_transactions.csv")
        if not os.path.exists(clean_trans_path):
            raise FileNotFoundError("Clean transactions missing. Run data cleaning first.")

    transactions = []
    with open(clean_trans_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("customer_id") and row.get("transaction_date"):
                transactions.append(row)

    if not transactions:
        print("No transactions available for cohort analysis.")
        return

    # 1. Determine Cohort Month per Customer (Month of first order)
    customer_cohort = {}
    for row in transactions:
        cid = row["customer_id"]
        order_month = row["transaction_date"][:7]  # YYYY-MM
        if len(order_month) == 7 and "-" in order_month:
            if cid not in customer_cohort or order_month < customer_cohort[cid]:
                customer_cohort[cid] = order_month

    # 2. Map orders to Month Index relative to acquisition cohort
    cohort_activity = defaultdict(set)
    for row in transactions:
        cid = row["customer_id"]
        if cid not in customer_cohort:
            continue
        c_month = customer_cohort[cid]
        order_month = row["transaction_date"][:7]
        if len(order_month) != 7 or "-" not in order_month:
            continue

        try:
            c_year, c_m = map(int, c_month.split("-"))
            o_year, o_m = map(int, order_month.split("-"))
            month_index = (o_year - c_year) * 12 + (o_m - c_m)
            if month_index >= 0:
                cohort_activity[(c_month, month_index)].add(cid)
        except ValueError:
            continue

    cohort_months = sorted(list(set(customer_cohort.values())))
    max_index = max((idx for _, idx in cohort_activity.keys()), default=0)
    max_index = min(max_index, 6)  # Cap at Month 6 for clean dashboard matrix view

    rows = []
    for c_month in cohort_months:
        cohort_size = len(cohort_activity[(c_month, 0)])
        if cohort_size == 0:
            continue
        row = {"cohort_month": c_month, "cohort_size": cohort_size}
        for idx in range(max_index + 1):
            active = len(cohort_activity[(c_month, idx)])
            row[f"Month_{idx}"] = round((active / cohort_size) * 100, 1)
        rows.append(row)

    fieldnames = ["cohort_month", "cohort_size"] + [f"Month_{i}" for i in range(max_index + 1)]

    # Save to output_dir
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "cohort_retention_matrix.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)

    # Sync to data/processed
    proc_dir = os.path.abspath(os.path.join(output_dir, "..", "data", "processed"))
    os.makedirs(proc_dir, exist_ok=True)
    proc_output_path = os.path.join(proc_dir, "cohort_retention_matrix.csv")
    with open(proc_output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)

    print("Cohort retention analysis complete.")
