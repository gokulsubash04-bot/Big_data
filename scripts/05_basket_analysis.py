# ==============================================================================
# Script 05: Market Basket Analysis (Association Rule Mining in Python)
# Product Co-occurrence, Support, Confidence, and Lift Metrics
# ==============================================================================

import os
import csv
from collections import defaultdict

def main():
    print("=========================================================")
    print("Starting Market Basket Analysis (Association Rules - Python)...")
    print("=========================================================")

    proc_dir = os.path.join("data", "processed")
    trans_path = os.path.join(proc_dir, "clean_transactions.csv")

    if not os.path.exists(trans_path):
        raise FileNotFoundError("Clean transactions missing. Run 02_spark_etl_pipeline.py first!")

    invoice_baskets = defaultdict(set)
    stock_desc = {}

    with open(trans_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            inv = r["invoice_no"]
            code = r["stock_code"]
            desc = r["description"]
            invoice_baskets[inv].add(code)
            stock_desc[code] = desc

    total_invoices = len(invoice_baskets)
    print(f"Analyzing {total_invoices} unique transaction baskets...")

    # Single item support count
    item_counts = defaultdict(int)
    for items in invoice_baskets.values():
        for item in items:
            item_counts[item] += 1

    # Pairwise co-occurrence
    pair_counts = defaultdict(int)
    for items in invoice_baskets.values():
        item_list = list(items)
        n = len(item_list)
        for i in range(n):
            for j in range(n):
                if i != j:
                    pair_counts[(item_list[i], item_list[j])] += 1

    # Compute Support, Confidence, Lift
    rules = []
    for (item_A, item_B), pair_count in pair_counts.items():
        support = round(pair_count / total_invoices, 5)
        support_A = item_counts[item_A] / total_invoices
        support_B = item_counts[item_B] / total_invoices
        confidence = round(support / support_A, 4)
        lift = round(support / (support_A * support_B), 2)

        if support >= 0.002 and confidence >= 0.05 and lift > 1.1:
            rules.append({
                "stock_code_A": item_A,
                "stock_code_B": item_B,
                "item_A_name": stock_desc.get(item_A, item_A),
                "item_B_name": stock_desc.get(item_B, item_B),
                "support": support,
                "confidence": confidence,
                "lift": lift
            })

    # Sort by Lift descending
    rules.sort(key=lambda x: x["lift"], reverse=True)

    print(f"\nMined {len(rules)} significant association rules.")
    print("\nTop 5 Association Rules by Lift:")
    for r in rules[:5]:
        print(f" - {r['item_A_name']} -> {r['item_B_name']} | Support: {r['support']}, Conf: {r['confidence']}, Lift: {r['lift']}x")

    # Export to CSV
    output_path = os.path.join(proc_dir, "market_basket_rules.csv")
    if rules:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=rules[0].keys())
            writer.writeheader()
            writer.writerows(rules)

    print(f"\nSuccessfully exported Association Rules to '{output_path}'.")

if __name__ == "__main__":
    main()
