# ==============================================================================
# Electronics E-Commerce Data Cleaning & Feature Aggregation Module
# Cleans raw transactions & clickstream data, builds conversion funnels & profile aggregations
# ==============================================================================

import csv
import json
import os
from collections import defaultdict
from datetime import datetime


def load_csv(filepath):
    """Load dictionary rows from a CSV file if it exists."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(filepath, rows, fieldnames):
    """Safely write rows to CSV format."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)


def write_json(filepath, data):
    """Write structured JSON payload with formatting."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def clean_transactions(raw_transactions):
    """Filter and sanitize raw transaction records."""
    clean = []
    for row in raw_transactions:
        try:
            quantity = float(row.get("quantity", 0))
            unit_price = float(row.get("unit_price", 0))
        except (ValueError, KeyError, TypeError):
            continue

        customer_id = row.get("customer_id", "").strip()
        if quantity <= 0 or unit_price <= 0 or not customer_id:
            continue

        product_id = row.get("product_id", "").strip() or row.get("stock_code", "").strip()
        product_name = row.get("product_name", "").strip() or row.get("description", "").strip()
        category = row.get("category", "Electronics").strip() or "Electronics"
        device = row.get("device", "Desktop").strip() or "Desktop"

        clean.append({
            "invoice_no": row.get("invoice_no", "").strip(),
            "customer_id": customer_id,
            "product_id": product_id,
            "stock_code": product_id,
            "product_name": product_name,
            "description": product_name,
            "category": category,
            "quantity": int(quantity),
            "unit_price": round(unit_price, 2),
            "total_spend": round(quantity * unit_price, 2),
            "transaction_date": row.get("transaction_date", "").strip(),
            "country": row.get("country", "").strip(),
            "device": device
        })
    return clean


def clean_clickstream(raw_clickstream):
    """Sanitize raw web clickstream event records."""
    clean = []
    for row in raw_clickstream:
        cid = row.get("customer_id", "").strip()
        if not cid:
            continue
        clean.append({
            "event_id": row.get("event_id", "").strip(),
            "session_id": row.get("session_id", "").strip(),
            "customer_id": cid,
            "timestamp": row.get("timestamp", "").strip(),
            "event_type": row.get("event_type", "").strip(),
            "product_id": row.get("product_id", "").strip(),
            "product_name": row.get("product_name", "").strip(),
            "device": row.get("device", "Desktop").strip()
        })
    return clean


def build_clickstream_funnel(clean_click):
    """Compute conversion rates and stage drop-offs."""
    click_stats = defaultdict(lambda: {"views": 0, "carts": 0, "purchases": 0, "searches": 0, "sessions": set()})
    event_counts = {"view": 0, "search": 0, "add_to_cart": 0, "purchase": 0}
    sessions_by_event = {"view": set(), "search": set(), "add_to_cart": set(), "purchase": set()}
    hourly_counts = defaultdict(int)

    for row in clean_click:
        etype = row.get("event_type", "view")
        event_counts[etype] = event_counts.get(etype, 0) + 1
        sessions_by_event[etype].add(row["session_id"])

        cid = row["customer_id"]
        if etype == "view":
            click_stats[cid]["views"] += 1
        elif etype == "add_to_cart":
            click_stats[cid]["carts"] += 1
        elif etype == "purchase":
            click_stats[cid]["purchases"] += 1
        elif etype == "search":
            click_stats[cid]["searches"] += 1
        click_stats[cid]["sessions"].add(row["session_id"])

        ts = row.get("timestamp", "")
        if ts:
            try:
                dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                hourly_counts[dt.hour] += 1
            except ValueError:
                pass

    view_sessions = len(sessions_by_event["view"])
    search_sessions = len(sessions_by_event["search"])
    cart_sessions = len(sessions_by_event["add_to_cart"])
    purchase_sessions = len(sessions_by_event["purchase"])

    all_sessions = set().union(*sessions_by_event.values())
    total_sessions = len(all_sessions) if all_sessions else 1

    stage_conversions = {
        "view_to_search_pct": round((search_sessions / view_sessions * 100), 2) if view_sessions > 0 else 0.0,
        "search_to_cart_pct": round((cart_sessions / search_sessions * 100), 2) if search_sessions > 0 else 0.0,
        "cart_to_purchase_pct": round((purchase_sessions / cart_sessions * 100), 2) if cart_sessions > 0 else 0.0,
        "overall_conversion_pct": round((purchase_sessions / view_sessions * 100), 2) if view_sessions > 0 else 0.0
    }

    stage_drop_offs = {
        "view_to_search_drop_pct": round((100 - stage_conversions["view_to_search_pct"]), 2),
        "search_to_cart_drop_pct": round((100 - stage_conversions["search_to_cart_pct"]), 2),
        "cart_to_purchase_drop_pct": round((100 - stage_conversions["cart_to_purchase_pct"]), 2),
        "view_to_search_drop_count": max(0, view_sessions - search_sessions),
        "search_to_cart_drop_count": max(0, search_sessions - cart_sessions),
        "cart_to_purchase_drop_count": max(0, cart_sessions - purchase_sessions)
    }

    funnel_summary = {
        "event_counts": event_counts,
        "session_counts": {
            "view": view_sessions,
            "search": search_sessions,
            "add_to_cart": cart_sessions,
            "purchase": purchase_sessions,
            "total_sessions": total_sessions
        },
        "stage_conversions": stage_conversions,
        "stage_drop_offs": stage_drop_offs,
        "hourly_distribution": dict(sorted(hourly_counts.items()))
    }

    return clean_click, click_stats, funnel_summary


def aggregate_customers(clean_transactions, clean_click):
    """Build master customer profile metrics table."""
    customer_map = defaultdict(lambda: {
        "total_spend": 0.0,
        "invoices": set(),
        "items": 0,
        "first_purchase": None,
        "last_purchase": None
    })

    for row in clean_transactions:
        cid = row["customer_id"]
        spend = row["total_spend"]
        qty = row["quantity"]
        inv = row["invoice_no"]
        t_date_str = row["transaction_date"]

        stats = customer_map[cid]
        stats["total_spend"] += spend
        stats["invoices"].add(inv)
        stats["items"] += qty

        try:
            date = datetime.strptime(t_date_str, "%Y-%m-%d %H:%M:%S")
            if stats["first_purchase"] is None or date < stats["first_purchase"]:
                stats["first_purchase"] = date
            if stats["last_purchase"] is None or date > stats["last_purchase"]:
                stats["last_purchase"] = date
        except ValueError:
            pass

    click_stats = defaultdict(lambda: {"views": 0, "carts": 0, "purchases": 0, "searches": 0, "sessions": set()})
    for row in clean_click:
        cid = row["customer_id"]
        etype = row["event_type"]
        if etype == "view":
            click_stats[cid]["views"] += 1
        elif etype == "add_to_cart":
            click_stats[cid]["carts"] += 1
        elif etype == "purchase":
            click_stats[cid]["purchases"] += 1
        elif etype == "search":
            click_stats[cid]["searches"] += 1
        click_stats[cid]["sessions"].add(row["session_id"])

    customers = []
    all_customers = sorted(list(set(customer_map.keys()).union(click_stats.keys())))

    for cid in all_customers:
        stats = customer_map[cid]
        clicks = click_stats[cid]
        frequency = len(stats["invoices"])
        total_spend = round(stats["total_spend"], 2)
        avg_order_value = round(total_spend / frequency, 2) if frequency > 0 else 0.0
        views = clicks["views"]
        carts = clicks["carts"]
        customers.append({
            "customer_id": cid,
            "total_monetary_spend": total_spend,
            "transaction_frequency": frequency,
            "total_items_purchased": stats["items"],
            "first_purchase": stats["first_purchase"].strftime("%Y-%m-%d %H:%M:%S") if stats["first_purchase"] else "",
            "last_purchase": stats["last_purchase"].strftime("%Y-%m-%d %H:%M:%S") if stats["last_purchase"] else "",
            "views": views,
            "carts": carts,
            "purchases": clicks["purchases"],
            "searches": clicks["searches"],
            "total_sessions": len(clicks["sessions"]),
            "cart_to_view_ratio": round(carts / views, 4) if views > 0 else 0.0,
            "avg_order_value": avg_order_value
        })

    return customers


def run_data_cleaning(data_dir, output_dir):
    """Master execution function for cleaning and aggregation."""
    raw_trans_path = os.path.join(data_dir, "transactions.csv")
    raw_click_path = os.path.join(data_dir, "clickstream.csv")

    raw_transactions = load_csv(raw_trans_path)
    raw_clickstream = load_csv(raw_click_path)

    clean_transactions_data = clean_transactions(raw_transactions)
    clean_clickstream_data = clean_clickstream(raw_clickstream)
    _, _, funnel_summary = build_clickstream_funnel(clean_clickstream_data)
    customer_profiles = aggregate_customers(clean_transactions_data, clean_clickstream_data)

    # Save to output_dir
    os.makedirs(output_dir, exist_ok=True)
    write_csv(os.path.join(output_dir, "clean_transactions.csv"), clean_transactions_data,
              ["invoice_no", "customer_id", "product_id", "stock_code", "product_name", "description", "category", "quantity", "unit_price", "total_spend", "transaction_date", "country", "device"])
    write_csv(os.path.join(output_dir, "clean_clickstream.csv"), clean_clickstream_data,
              ["event_id", "session_id", "customer_id", "timestamp", "event_type", "product_id", "product_name", "device"])
    write_csv(os.path.join(output_dir, "customer_aggregated.csv"), customer_profiles, [
        "customer_id", "total_monetary_spend", "transaction_frequency", "total_items_purchased",
        "first_purchase", "last_purchase", "views", "carts", "purchases", "searches",
        "total_sessions", "cart_to_view_ratio", "avg_order_value"
    ])
    write_json(os.path.join(output_dir, "clickstream_funnel_summary.json"), funnel_summary)

    # Sync to data/processed for compatibility
    proc_dir = os.path.join(data_dir, "processed")
    os.makedirs(proc_dir, exist_ok=True)
    write_csv(os.path.join(proc_dir, "clean_transactions.csv"), clean_transactions_data,
              ["invoice_no", "customer_id", "product_id", "stock_code", "product_name", "description", "category", "quantity", "unit_price", "total_spend", "transaction_date", "country", "device"])
    write_csv(os.path.join(proc_dir, "clean_clickstream.csv"), clean_clickstream_data,
              ["event_id", "session_id", "customer_id", "timestamp", "event_type", "product_id", "product_name", "device"])
    write_csv(os.path.join(proc_dir, "customer_aggregated.csv"), customer_profiles, [
        "customer_id", "total_monetary_spend", "transaction_frequency", "total_items_purchased",
        "first_purchase", "last_purchase", "views", "carts", "purchases", "searches",
        "total_sessions", "cart_to_view_ratio", "avg_order_value"
    ])
    write_json(os.path.join(proc_dir, "clickstream_funnel_summary.json"), funnel_summary)

    print("Data cleaning & aggregation completed successfully.")
