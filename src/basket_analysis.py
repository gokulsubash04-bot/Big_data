# ==============================================================================
# Market Basket Analysis (Association Rule Mining)
# Product Co-occurrence, Support, Confidence, and Lift Multipliers
# ==============================================================================

import csv
import os
from collections import defaultdict


def run_basket_analysis(output_dir):
    """Mines product association rules based on transaction co-occurrence."""
    clean_trans_path = os.path.join(output_dir, "clean_transactions.csv")
    if not os.path.exists(clean_trans_path):
        clean_trans_path = os.path.join(os.path.dirname(output_dir), "data", "processed", "clean_transactions.csv")
        if not os.path.exists(clean_trans_path):
            raise FileNotFoundError("Clean transactions missing. Run data cleaning first.")

    invoice_baskets = defaultdict(set)
    stock_desc = {}

    with open(clean_trans_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inv = row.get("invoice_no")
            code = row.get("stock_code")
            desc = row.get("description", code)
            if inv and code:
                invoice_baskets[inv].add(code)
                stock_desc[code] = desc

    total_invoices = len(invoice_baskets)
    pair_counts = defaultdict(int)
    item_counts = defaultdict(int)

    for items in invoice_baskets.values():
        for item in items:
            item_counts[item] += 1
        item_list = list(items)
        n = len(item_list)
        for i in range(n):
            for j in range(n):
                if i != j:
                    pair_counts[(item_list[i], item_list[j])] += 1

    rules = []
    if total_invoices > 0:
        for (item_a, item_b), pair_count in pair_counts.items():
            support = pair_count / total_invoices
            support_a = item_counts[item_a] / total_invoices
            support_b = item_counts[item_b] / total_invoices
            confidence = support / support_a if support_a > 0 else 0.0
            lift = support / (support_a * support_b) if (support_a > 0 and support_b > 0) else 0.0

            if support >= 0.002 and confidence >= 0.05 and lift > 1.1:
                rules.append({
                    "stock_code_A": item_a,
                    "stock_code_B": item_b,
                    "item_A_name": stock_desc.get(item_a, item_a),
                    "item_B_name": stock_desc.get(item_b, item_b),
                    "support": round(support, 5),
                    "confidence": round(confidence, 4),
                    "lift": round(lift, 2)
                })

    rules.sort(key=lambda row: row["lift"], reverse=True)

    fieldnames = ["stock_code_A", "stock_code_B", "item_A_name", "item_B_name", "support", "confidence", "lift"]

    # Save to output_dir
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "market_basket_rules.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rules:
            writer.writerows(rules)

    # Sync to data/processed
    proc_dir = os.path.abspath(os.path.join(output_dir, "..", "data", "processed"))
    os.makedirs(proc_dir, exist_ok=True)
    proc_output_path = os.path.join(proc_dir, "market_basket_rules.csv")
    with open(proc_output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rules:
            writer.writerows(rules)

    print(f"Market basket analysis complete. Mined {len(rules)} association rules.")
