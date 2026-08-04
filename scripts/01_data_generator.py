# ==============================================================================
# Script 01: Synthetic E-Commerce Big Data Generator (Python)
# Distributed Analytics Workflow in Python (PySpark / Pandas)
# ==============================================================================

import os
import csv
import random
from datetime import datetime, timedelta

def main():
    print("=========================================================")
    print("Starting Synthetic Big Data Generation (Python)...")
    print("=========================================================")

    random.seed(42)

    output_dir = os.path.join("data", "raw")
    os.makedirs(output_dir, exist_ok=True)

    num_customers = 2500
    num_transactions = 25000
    num_clickstream = 80000

    start_date = datetime(2024, 1, 1, 0, 0, 0)
    end_date = datetime(2024, 12, 31, 23, 59, 59)
    total_seconds = int((end_date - start_date).total_seconds())

    # Products Catalog
    categories = ["Electronics", "Home & Kitchen", "Fashion", "Beauty", "Sports"]
    adjectives = ["Luxury", "Vintage", "Essential", "Modern", "Eco"]
    
    products = []
    for i in range(1, 51):
        code = f"PROD_{i:04d}"
        desc = f"Product {i} {random.choice(adjectives)}"
        cat = random.choice(categories)
        price = round(random.uniform(4.99, 199.99), 2)
        products.append({"code": code, "desc": desc, "category": cat, "price": price})

    print(f"Generated Product Catalog with {len(products)} SKUs.")

    # 1. Generate Transactions Data
    customer_ids = [f"CUST_{i:05d}" for i in range(1, num_customers + 1)]
    countries = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan"]
    country_weights = [0.45, 0.20, 0.12, 0.08, 0.07, 0.05, 0.03]

    num_invoices = 8000
    invoices = []
    for i in range(1, num_invoices + 1):
        inv_no = f"INV_{i:06d}"
        cust = random.choice(customer_ids)
        t_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        country = random.choices(countries, weights=country_weights, k=1)[0]
        invoices.append({"inv_no": inv_no, "cust": cust, "date": t_date, "country": country})

    transactions = []
    qty_options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    qty_weights = [0.5, 0.25, 0.12, 0.06, 0.03, 0.02, 0.01, 0.005, 0.003, 0.002]

    for _ in range(num_transactions):
        inv = random.choice(invoices)
        prod = random.choice(products)
        qty = random.choices(qty_options, weights=qty_weights, k=1)[0]
        
        transactions.append({
            "invoice_no": inv["inv_no"],
            "customer_id": inv["cust"],
            "stock_code": prod["code"],
            "description": prod["desc"],
            "quantity": qty,
            "unit_price": prod["price"],
            "transaction_date": inv["date"].strftime("%Y-%m-%d %H:%M:%S"),
            "country": inv["country"]
        })

    # 2. Generate Clickstream Data
    num_sessions = 15000
    devices = ["Mobile", "Desktop", "Tablet"]
    device_weights = [0.60, 0.32, 0.08]

    sessions = []
    for i in range(1, num_sessions + 1):
        sess_id = f"SESS_{i:07d}"
        cust = random.choice(customer_ids)
        dev = random.choices(devices, weights=device_weights, k=1)[0]
        s_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        sessions.append({"sess_id": sess_id, "cust": cust, "device": dev, "start_time": s_date})

    clickstream = []
    event_types = ["view", "add_to_cart", "search", "purchase"]
    event_weights = [0.65, 0.20, 0.10, 0.05]

    event_counter = 1
    for sess in sessions:
        num_events = random.randint(1, 10)
        for _ in range(num_events):
            if event_counter > num_clickstream:
                break
            e_type = random.choices(event_types, weights=event_weights, k=1)[0]
            prod = random.choice(products)
            e_time = sess["start_time"] + timedelta(seconds=random.randint(0, 1800))
            
            clickstream.append({
                "event_id": f"EVT_{event_counter:08d}",
                "session_id": sess["sess_id"],
                "customer_id": sess["cust"],
                "timestamp": e_time.strftime("%Y-%m-%d %H:%M:%S"),
                "event_type": e_type,
                "product_id": prod["code"],
                "device_type": sess["device"]
            })
            event_counter += 1

    # Export to CSV
    trans_path = os.path.join(output_dir, "raw_transactions.csv")
    click_path = os.path.join(output_dir, "raw_clickstream.csv")

    with open(trans_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=transactions[0].keys())
        writer.writeheader()
        writer.writerows(transactions)

    with open(click_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=clickstream[0].keys())
        writer.writeheader()
        writer.writerows(clickstream)

    print(f"Successfully generated:")
    print(f" - Transactions: {len(transactions)} rows ({trans_path})")
    print(f" - Clickstream: {len(clickstream)} rows ({click_path})")

if __name__ == "__main__":
    main()
