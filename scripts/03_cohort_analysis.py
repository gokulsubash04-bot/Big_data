# ==============================================================================
# Script 03: Customer Cohort Retention Analysis (Python)
# Multi-Month Retention Percentage Matrix
# ==============================================================================

import os
import csv
from collections import defaultdict

def main():
    print("=========================================================")
    print("Starting Cohort Retention Analysis (Python)...")
    print("=========================================================")

    proc_dir = os.path.join("data", "processed")
    trans_path = os.path.join(proc_dir, "clean_transactions.csv")

    if not os.path.exists(trans_path):
        raise FileNotFoundError("Clean transactions missing. Run 02_spark_etl_pipeline.py first!")

    transactions = []
    with open(trans_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            transactions.append(r)

    # 1. Determine Cohort Month per Customer (First Purchase Month)
    customer_cohort = {}
    for t in transactions:
        cid = t["customer_id"]
        order_month = t["transaction_date"][:7] # YYYY-MM
        if cid not in customer_cohort or order_month < customer_cohort[cid]:
            customer_cohort[cid] = order_month

    # 2. Assign Cohort Index (Months elapsed between first purchase & order month)
    cohort_activity = defaultdict(set) # key: (cohort_month, month_index), value: set of active customer_ids

    for t in transactions:
        cid = t["customer_id"]
        c_month = customer_cohort[cid]
        o_month = t["transaction_date"][:7]

        c_year, c_m = map(int, c_month.split("-"))
        o_year, o_m = map(int, o_month.split("-"))

        month_index = (o_year - c_year) * 12 + (o_m - c_m)
        cohort_activity[(c_month, month_index)].add(cid)

    # 3. Calculate Retention Percentages
    cohort_months = sorted(list(set(customer_cohort.values())))
    max_index = max(idx for _, idx in cohort_activity.keys()) if cohort_activity else 0
    max_index = min(max_index, 6) # Limit to 6 months for clean viewing

    matrix_rows = []
    for c_month in cohort_months:
        m0_count = len(cohort_activity[(c_month, 0)])
        if m0_count == 0:
            continue
        
        row = {"cohort_month": c_month, "cohort_size": m0_count}
        for idx in range(max_index + 1):
            active_count = len(cohort_activity[(c_month, idx)])
            retention_pct = round((active_count / m0_count) * 100, 1)
            row[f"Month_{idx}"] = retention_pct
        matrix_rows.append(row)

    # 4. Save Retention Matrix
    output_path = os.path.join(proc_dir, "cohort_retention_matrix.csv")
    fieldnames = ["cohort_month", "cohort_size"] + [f"Month_{i}" for i in range(max_index + 1)]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matrix_rows)

    print("Cohort Analysis Completed Successfully!")
    print(f"Exported Cohort Matrix to '{output_path}'.")

if __name__ == "__main__":
    main()
