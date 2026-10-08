# ==============================================================================
# Electronics E-Commerce Product Demand & Restock Intelligence Engine
# Analyzes sales velocity, clickstream demand, stock depletion, & reorder priorities
# ==============================================================================

import csv
import json
import os
from collections import defaultdict


def load_csv(filepath):
    """Safely load rows from a CSV file."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(filepath, rows, fieldnames):
    """Write rows to CSV format."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        if rows:
            writer.writerows(rows)


def write_json(filepath, data):
    """Write formatted JSON file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def compute_product_restock_analytics(products, clean_transactions, clean_clickstream):
    """
    Compute comprehensive inventory health, sales velocity, and restock recommendations.
    """
    # 1. Base Product Map
    product_map = {}
    # Preset realistic baseline inventory parameters by category/product if not provided
    default_stock_config = {
        "Smartphones": {"initial_stock": 2200, "reorder_point": 350, "lead_days": 10},
        "Laptops": {"initial_stock": 1800, "reorder_point": 250, "lead_days": 14},
        "Headphones": {"initial_stock": 2500, "reorder_point": 400, "lead_days": 7},
        "Keyboards": {"initial_stock": 1200, "reorder_point": 200, "lead_days": 7},
        "Mouse": {"initial_stock": 1100, "reorder_point": 180, "lead_days": 7},
        "Monitors": {"initial_stock": 1600, "reorder_point": 220, "lead_days": 12},
        "Smartwatches": {"initial_stock": 1500, "reorder_point": 250, "lead_days": 10},
        "Tablets": {"initial_stock": 1700, "reorder_point": 280, "lead_days": 10},
        "Chargers": {"initial_stock": 1400, "reorder_point": 300, "lead_days": 5},
    }

    for p in products:
        pid = p.get("product_id") or p.get("stock_code")
        if not pid:
            continue
        category = p.get("category", "Electronics")
        cfg = default_stock_config.get(category, {"initial_stock": 1500, "reorder_point": 250, "lead_days": 7})
        
        try:
            unit_price = float(p.get("unit_price", 0))
        except (ValueError, TypeError):
            unit_price = 0.0

        product_map[pid] = {
            "product_id": pid,
            "product_name": p.get("product_name") or p.get("description", pid),
            "category": category,
            "unit_price": unit_price,
            "initial_stock": int(p.get("initial_stock", cfg["initial_stock"])),
            "reorder_point": int(p.get("reorder_point", cfg["reorder_point"])),
            "lead_time_days": int(p.get("lead_time_days", cfg["lead_days"])),
            "units_sold": 0,
            "orders_count": 0,
            "total_revenue": 0.0,
            "views": 0,
            "cart_adds": 0,
            "searches": 0
        }

    # 2. Aggregate Transactions
    for t in clean_transactions:
        pid = t.get("product_id") or t.get("stock_code")
        if not pid:
            continue
        if pid not in product_map:
            cat = t.get("category", "Electronics")
            pname = t.get("product_name") or t.get("description", pid)
            try:
                price = float(t.get("unit_price", 0))
            except (ValueError, TypeError):
                price = 0.0
            cfg = default_stock_config.get(cat, {"initial_stock": 1500, "reorder_point": 250, "lead_days": 7})
            product_map[pid] = {
                "product_id": pid,
                "product_name": pname,
                "category": cat,
                "unit_price": price,
                "initial_stock": cfg["initial_stock"],
                "reorder_point": cfg["reorder_point"],
                "lead_time_days": cfg["lead_days"],
                "units_sold": 0,
                "orders_count": 0,
                "total_revenue": 0.0,
                "views": 0,
                "cart_adds": 0,
                "searches": 0
            }

        try:
            qty = int(float(t.get("quantity", 0)))
            spend = float(t.get("total_spend", 0))
        except (ValueError, TypeError):
            qty = 0
            spend = 0.0

        product_map[pid]["units_sold"] += qty
        product_map[pid]["orders_count"] += 1
        product_map[pid]["total_revenue"] += spend

    # 3. Aggregate Clickstream Events
    for c in clean_clickstream:
        pid = c.get("product_id")
        if pid and pid in product_map:
            etype = c.get("event_type", "view")
            if etype == "view":
                product_map[pid]["views"] += 1
            elif etype == "add_to_cart":
                product_map[pid]["cart_adds"] += 1
            elif etype == "search":
                product_map[pid]["searches"] += 1

    # 4. Calculate Velocity, Stock Depletion, and Restock Priority
    restock_list = []
    # Assume historical period is 1 year (365 days) for daily velocity calculation
    days_in_period = 365

    for pid, item in product_map.items():
        units_sold = item["units_sold"]
        initial_stock = item["initial_stock"]
        current_stock = max(0, initial_stock - units_sold)
        daily_velocity = round(units_sold / days_in_period, 2)
        
        # Days of stock remaining at current velocity
        if daily_velocity > 0:
            days_remaining = round(current_stock / daily_velocity, 1)
        else:
            days_remaining = 999.0

        reorder_point = item["reorder_point"]
        lead_time = item["lead_time_days"]
        
        # Target stock = 45 days buffer + safety lead stock
        target_buffer_stock = int(daily_velocity * (lead_time + 45)) + reorder_point
        recommended_restock = max(0, target_buffer_stock - current_stock)

        # Restock Urgency Classification
        if current_stock <= reorder_point or days_remaining < 15:
            urgency = "CRITICAL_RESTOCK"
            urgency_label = "🚨 Critical (Restock Immediately)"
            urgency_score = 4
            action = f"Stockout imminent in ~{int(days_remaining)} days! Reorder +{recommended_restock} units immediately to prevent lost sales."
        elif days_remaining < 35:
            urgency = "HIGH_PRIORITY"
            urgency_label = "⚠️ High Priority Reorder"
            urgency_score = 3
            action = f"High sales velocity ({daily_velocity}/day). Order +{recommended_restock} units within next 7 days."
        elif days_remaining < 65:
            urgency = "MODERATE"
            urgency_label = "🟡 Moderate Demand"
            urgency_score = 2
            action = f"Moderate stock level. Plan standard reorder batch (+{recommended_restock} units) for next monthly replenishment."
        else:
            urgency = "ADEQUATE"
            urgency_label = "🟢 Adequate Inventory"
            urgency_score = 1
            action = "Current warehouse inventory levels are healthy and sufficient."

        revenue_at_risk = round(recommended_restock * item["unit_price"], 2)
        conversion_rate = round((units_sold / item["views"] * 100), 2) if item["views"] > 0 else 0.0

        restock_list.append({
            "product_id": pid,
            "product_name": item["product_name"],
            "category": item["category"],
            "unit_price": round(item["unit_price"], 2),
            "units_sold": units_sold,
            "orders_count": item["orders_count"],
            "total_revenue": round(item["total_revenue"], 2),
            "views": item["views"],
            "cart_adds": item["cart_adds"],
            "conversion_rate_pct": conversion_rate,
            "initial_stock": initial_stock,
            "current_stock": current_stock,
            "stock_depletion_pct": round((units_sold / initial_stock * 100), 1) if initial_stock > 0 else 100.0,
            "reorder_point": reorder_point,
            "daily_sales_velocity": daily_velocity,
            "days_of_stock_remaining": days_remaining,
            "restock_urgency": urgency,
            "urgency_label": urgency_label,
            "urgency_score": urgency_score,
            "recommended_restock_units": recommended_restock,
            "revenue_at_risk": revenue_at_risk,
            "recommended_action": action
        })

    # Sort descending by urgency score, then lowest days remaining, then recommended restock units
    restock_list.sort(key=lambda x: (-x["urgency_score"], x["days_of_stock_remaining"], -x["recommended_restock_units"]))

    # Add Rank
    for idx, item in enumerate(restock_list, start=1):
        item["restock_priority_rank"] = idx

    # Compute Summary KPIs
    critical_count = sum(1 for x in restock_list if x["restock_urgency"] == "CRITICAL_RESTOCK")
    high_count = sum(1 for x in restock_list if x["restock_urgency"] == "HIGH_PRIORITY")
    moderate_count = sum(1 for x in restock_list if x["restock_urgency"] == "MODERATE")
    adequate_count = sum(1 for x in restock_list if x["restock_urgency"] == "ADEQUATE")
    
    total_restock_units = sum(x["recommended_restock_units"] for x in restock_list)
    total_revenue_at_risk = sum(x["revenue_at_risk"] for x in restock_list)
    
    top_critical_products = [x for x in restock_list if x["restock_urgency"] in ("CRITICAL_RESTOCK", "HIGH_PRIORITY")][:6]

    # Category Restock breakdown
    category_summary = defaultdict(lambda: {"category": "", "total_units_sold": 0, "total_current_stock": 0, "total_restock_needed": 0, "critical_items": 0})
    for x in restock_list:
        cat = x["category"]
        category_summary[cat]["category"] = cat
        category_summary[cat]["total_units_sold"] += x["units_sold"]
        category_summary[cat]["total_current_stock"] += x["current_stock"]
        category_summary[cat]["total_restock_needed"] += x["recommended_restock_units"]
        if x["restock_urgency"] == "CRITICAL_RESTOCK":
            category_summary[cat]["critical_items"] += 1

    summary_payload = {
        "kpis": {
            "critical_stockout_items": critical_count,
            "high_priority_items": high_count,
            "moderate_items": moderate_count,
            "adequate_items": adequate_count,
            "total_products_monitored": len(restock_list),
            "total_recommended_restock_units": total_restock_units,
            "total_revenue_at_risk": round(total_revenue_at_risk, 2),
            "fastest_moving_product": restock_list[0]["product_name"] if restock_list else "None"
        },
        "top_restock_recommendations": top_critical_products,
        "category_restock_summary": list(category_summary.values()),
        "all_products": restock_list
    }

    return restock_list, summary_payload


def run_inventory_restock_analysis(data_dir, output_dir):
    """Run restock intelligence pipeline step and output artifacts."""
    products = load_csv(os.path.join(data_dir, "products.csv"))
    clean_transactions = load_csv(os.path.join(output_dir, "clean_transactions.csv"))
    clean_clickstream = load_csv(os.path.join(output_dir, "clean_clickstream.csv"))

    if not clean_transactions:
        clean_transactions = load_csv(os.path.join(data_dir, "transactions.csv"))
    if not clean_clickstream:
        clean_clickstream = load_csv(os.path.join(data_dir, "clickstream.csv"))

    restock_list, summary_payload = compute_product_restock_analytics(products, clean_transactions, clean_clickstream)

    fieldnames = [
        "restock_priority_rank", "product_id", "product_name", "category", "unit_price",
        "units_sold", "orders_count", "total_revenue", "views", "cart_adds", "conversion_rate_pct",
        "initial_stock", "current_stock", "stock_depletion_pct", "reorder_point",
        "daily_sales_velocity", "days_of_stock_remaining", "restock_urgency", "urgency_label",
        "urgency_score", "recommended_restock_units", "revenue_at_risk", "recommended_action"
    ]

    # Write to output/
    os.makedirs(output_dir, exist_ok=True)
    write_csv(os.path.join(output_dir, "product_restock_recommendations.csv"), restock_list, fieldnames)
    write_json(os.path.join(output_dir, "product_restock_recommendations.json"), summary_payload)

    # Sync to data/processed/
    proc_dir = os.path.join(data_dir, "processed")
    os.makedirs(proc_dir, exist_ok=True)
    write_csv(os.path.join(proc_dir, "product_restock_recommendations.csv"), restock_list, fieldnames)
    write_json(os.path.join(proc_dir, "product_restock_recommendations.json"), summary_payload)

    print(f"Inventory & Restock Analytics complete: {len(restock_list)} products analyzed.")
    print(f" - Critical items to restock: {summary_payload['kpis']['critical_stockout_items']}")
    print(f" - Total recommended units to order: {summary_payload['kpis']['total_recommended_restock_units']:,}")
    return summary_payload


if __name__ == "__main__":
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    d_dir = os.path.join(base, "data")
    o_dir = os.path.join(base, "output")
    run_inventory_restock_analysis(d_dir, o_dir)
