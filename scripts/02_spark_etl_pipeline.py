# ==============================================================================
# Script 02: PySpark / Python Distributed Batch Processing ETL Pipeline
# Data Cleaning, Sessionization, and Aggregation
# ==============================================================================

import os
import csv
import json
from datetime import datetime
from collections import defaultdict

def main():
    print("=========================================================")
    print("Starting Python / PySpark Batch Processing ETL Pipeline...")
    print("=========================================================")

    raw_trans_path = os.path.join("data", "raw", "raw_transactions.csv")
    raw_click_path = os.path.join("data", "raw", "raw_clickstream.csv")
    proc_dir = os.path.join("data", "processed")
    os.makedirs(proc_dir, exist_ok=True)

    if not os.path.exists(raw_trans_path) or not os.path.exists(raw_click_path):
        raise FileNotFoundError("Raw datasets missing. Run 01_data_generator.py first!")

    # 1. Clean Transactions
    clean_trans = []
    with open(raw_trans_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            qty = float(row["quantity"])
            price = float(row["unit_price"])
            cust = row["customer_id"].strip()
            if qty > 0 and price > 0 and cust:
                total_spend = round(qty * price, 2)
                row["quantity"] = int(qty)
                row["unit_price"] = price
                row["total_spend"] = total_spend
                clean_trans.append(row)

    # 2. Clean Clickstream
    clean_click = []
    with open(raw_click_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["customer_id"].strip():
                clean_click.append(row)

    print(f"Cleaned Records: Transactions={len(clean_trans)}, Clickstream={len(clean_click)}")

    # 3. Sessionization & Clickstream Aggregations
    click_stats = defaultdict(lambda: {"views": 0, "carts": 0, "purchases": 0, "searches": 0, "sessions": set()})
    
    # Detailed Funnel Tracking
    event_counts = {"view": 0, "search": 0, "add_to_cart": 0, "purchase": 0}
    sessions_by_event = {"view": set(), "search": set(), "add_to_cart": set(), "purchase": set()}
    device_stats = defaultdict(lambda: {"view": 0, "search": 0, "add_to_cart": 0, "purchase": 0, "sessions": set()})
    hourly_counts = defaultdict(int)

    for c in clean_click:
        cid = c["customer_id"]
        sid = c["session_id"]
        etype = c["event_type"]
        device = c.get("device_type", "Unknown")

        click_stats[cid]["sessions"].add(sid)
        if etype in event_counts:
            event_counts[etype] += 1
            sessions_by_event[etype].add(sid)
            device_stats[device][etype] += 1
            device_stats[device]["sessions"].add(sid)

        if etype == "view":
            click_stats[cid]["views"] += 1
        elif etype == "add_to_cart":
            click_stats[cid]["carts"] += 1
        elif etype == "purchase":
            click_stats[cid]["purchases"] += 1
        elif etype == "search":
            click_stats[cid]["searches"] += 1

        if "timestamp" in c and c["timestamp"]:
            try:
                dt = datetime.strptime(c["timestamp"], "%Y-%m-%d %H:%M:%S")
                hourly_counts[dt.hour] += 1
            except ValueError:
                pass

    # Funnel Stage Analytics & Session Funnel Calculation
    view_sess = len(sessions_by_event["view"])
    search_sess = len(sessions_by_event["search"])
    cart_sess = len(sessions_by_event["add_to_cart"])
    purch_sess = len(sessions_by_event["purchase"])

    total_sessions_count = len(set.union(*sessions_by_event.values())) if any(sessions_by_event.values()) else 1

    stage_conversions = {
        "view_to_search": round((search_sess / view_sess * 100), 2) if view_sess > 0 else 0.0,
        "view_to_cart": round((cart_sess / view_sess * 100), 2) if view_sess > 0 else 0.0,
        "cart_to_purchase": round((purch_sess / cart_sess * 100), 2) if cart_sess > 0 else 0.0,
        "overall_conversion": round((purch_sess / view_sess * 100), 2) if view_sess > 0 else 0.0
    }

    stage_drop_offs = {
        "view_to_search_drop_pct": round(max(0.0, 100.0 - stage_conversions["view_to_search"]), 2),
        "view_to_cart_drop_pct": round(max(0.0, 100.0 - stage_conversions["view_to_cart"]), 2),
        "cart_to_purchase_drop_pct": round(max(0.0, 100.0 - stage_conversions["cart_to_purchase"]), 2),
        "view_to_search_drop_count": max(0, view_sess - search_sess),
        "view_to_cart_drop_count": max(0, view_sess - cart_sess),
        "cart_to_purchase_drop_count": max(0, cart_sess - purch_sess)
    }

    device_breakdown = {}
    for dev, ddata in device_stats.items():
        dev_views = ddata["view"]
        dev_carts = ddata["add_to_cart"]
        dev_purch = ddata["purchase"]
        dev_sess = len(ddata["sessions"])
        device_breakdown[dev] = {
            "views": dev_views,
            "searches": ddata["search"],
            "add_to_carts": dev_carts,
            "purchases": dev_purch,
            "total_sessions": dev_sess,
            "view_to_cart_pct": round((dev_carts / dev_views * 100), 2) if dev_views > 0 else 0.0,
            "cart_to_purchase_pct": round((dev_purch / dev_carts * 100), 2) if dev_carts > 0 else 0.0,
            "overall_conversion_pct": round((dev_purch / dev_sess * 100), 2) if dev_sess > 0 else 0.0
        }

    funnel_summary = {
        "event_counts": event_counts,
        "session_counts": {
            "view": view_sess,
            "search": search_sess,
            "add_to_cart": cart_sess,
            "purchase": purch_sess,
            "total_sessions": total_sessions_count
        },
        "stage_conversions": stage_conversions,
        "stage_drop_offs": stage_drop_offs,
        "device_breakdown": device_breakdown,
        "hourly_distribution": dict(sorted(hourly_counts.items()))
    }

    # 4. Customer Transaction Aggregations
    cust_stats = defaultdict(lambda: {
        "total_spend": 0.0,
        "invoices": set(),
        "items": 0,
        "first_purchase": None,
        "last_purchase": None
    })

    for t in clean_trans:
        cid = t["customer_id"]
        s = cust_stats[cid]
        s["total_spend"] += t["total_spend"]
        s["invoices"].add(t["invoice_no"])
        s["items"] += t["quantity"]

        t_date = datetime.strptime(t["transaction_date"], "%Y-%m-%d %H:%M:%S")
        if s["first_purchase"] is None or t_date < s["first_purchase"]:
            s["first_purchase"] = t_date
        if s["last_purchase"] is None or t_date > s["last_purchase"]:
            s["last_purchase"] = t_date

    # Master Customer Summary
    all_customers = set(cust_stats.keys()).union(set(click_stats.keys()))
    customer_summary = []

    for cid in all_customers:
        s = cust_stats[cid]
        cs = click_stats[cid]

        freq = len(s["invoices"])
        spend = round(s["total_spend"], 2)
        aov = round(spend / freq, 2) if freq > 0 else 0.0
        views = cs["views"]
        carts = cs["carts"]
        cart_to_view = round(carts / views, 4) if views > 0 else 0.0

        customer_summary.append({
            "customer_id": cid,
            "total_monetary_spend": spend,
            "transaction_frequency": freq,
            "total_items_purchased": s["items"],
            "first_purchase": s["first_purchase"].strftime("%Y-%m-%d %H:%M:%S") if s["first_purchase"] else "",
            "last_purchase": s["last_purchase"].strftime("%Y-%m-%d %H:%M:%S") if s["last_purchase"] else "",
            "views": views,
            "carts": carts,
            "purchases": cs["purchases"],
            "searches": cs["searches"],
            "total_sessions": len(cs["sessions"]),
            "cart_to_view_ratio": cart_to_view,
            "avg_order_value": aov
        })

    # Save Processed Datasets
    with open(os.path.join(proc_dir, "clean_transactions.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=clean_trans[0].keys())
        writer.writeheader()
        writer.writerows(clean_trans)

    with open(os.path.join(proc_dir, "clean_clickstream.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=clean_click[0].keys())
        writer.writeheader()
        writer.writerows(clean_click)

    with open(os.path.join(proc_dir, "customer_aggregated.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=customer_summary[0].keys())
        writer.writeheader()
        writer.writerows(customer_summary)

    with open(os.path.join(proc_dir, "clickstream_funnel_summary.json"), "w", encoding="utf-8") as f:
        json.dump(funnel_summary, f, indent=2)

    print("PySpark / Batch Processing ETL Pipeline completed successfully!")
    print(f"Exported clean datasets and pre-aggregated Clickstream Funnel Summary to '{proc_dir}'.")

if __name__ == "__main__":
    main()

