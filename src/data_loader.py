# ==============================================================================
# E-Commerce Data Loader & Synthetic Big Data Generator
# Generates realistic synthetic customer, transaction, and clickstream data
# ==============================================================================

import csv
import os
import random
from datetime import datetime, timedelta


def write_csv(filepath, fieldnames, rows):
    """Safely write rows to a CSV file creating directories if needed."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)


def load_csv(filepath):
    """Load a CSV file as a list of dictionary rows."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def generate_synthetic_data(data_dir, num_customers=2500, num_transactions=25000, num_clickstream=80000, seed=42):
    """Generate reproducible e-commerce datasets for customer analytics."""
    os.makedirs(data_dir, exist_ok=True)
    if seed is not None:
        random.seed(seed)

    start_date = datetime(2024, 1, 1, 0, 0, 0)
    end_date = datetime(2024, 12, 31, 23, 59, 59)
    total_seconds = int((end_date - start_date).total_seconds())

    # 1. Product Catalog Generation
    categories = ["Electronics", "Home & Kitchen", "Fashion", "Beauty", "Sports"]
    adjectives = ["Luxury", "Vintage", "Essential", "Modern", "Eco"]

    products = []
    for i in range(1, 51):
        code = f"PROD_{i:04d}"
        desc = f"Product {i} {random.choice(adjectives)}"
        cat = random.choice(categories)
        price = round(random.uniform(4.99, 199.99), 2)
        products.append({"product_id": code, "description": desc, "category": cat, "unit_price": price})

    # 2. Customer Profiles Generation
    customer_ids = [f"CUST_{i:05d}" for i in range(1, num_customers + 1)]
    countries = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan"]
    country_weights = [0.45, 0.20, 0.12, 0.08, 0.07, 0.05, 0.03]

    customers = []
    for customer_id in customer_ids:
        country = random.choices(countries, weights=country_weights, k=1)[0]
        customers.append({"customer_id": customer_id, "country": country})

    # 3. Transactions & Invoices Generation
    num_invoices = max(1, int(num_transactions * 0.35))
    invoices = []
    for i in range(1, num_invoices + 1):
        inv_no = f"INV_{i:06d}"
        cust = random.choice(customer_ids)
        t_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        country = random.choices(countries, weights=country_weights, k=1)[0]
        invoices.append({"invoice_no": inv_no, "customer_id": cust, "transaction_date": t_date, "country": country})

    transactions = []
    qty_options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    qty_weights = [0.5, 0.25, 0.12, 0.06, 0.03, 0.02, 0.01, 0.005, 0.003, 0.002]

    for _ in range(num_transactions):
        inv = random.choice(invoices)
        prod = random.choice(products)
        qty = random.choices(qty_options, weights=qty_weights, k=1)[0]
        transactions.append({
            "invoice_no": inv["invoice_no"],
            "customer_id": inv["customer_id"],
            "stock_code": prod["product_id"],
            "description": prod["description"],
            "quantity": qty,
            "unit_price": prod["unit_price"],
            "transaction_date": inv["transaction_date"].strftime("%Y-%m-%d %H:%M:%S"),
            "country": inv["country"]
        })

    # 4. Clickstream Events Generation
    num_sessions = 15000
    devices = ["Mobile", "Desktop", "Tablet"]
    device_weights = [0.60, 0.32, 0.08]

    sessions = []
    for i in range(1, num_sessions + 1):
        sess_id = f"SESS_{i:07d}"
        cust = random.choice(customer_ids)
        dev = random.choices(devices, weights=device_weights, k=1)[0]
        s_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        sessions.append({"session_id": sess_id, "customer_id": cust, "device_type": dev, "start_time": s_date})

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
                "session_id": sess["session_id"],
                "customer_id": sess["customer_id"],
                "timestamp": e_time.strftime("%Y-%m-%d %H:%M:%S"),
                "event_type": e_type,
                "product_id": prod["product_id"],
                "device_type": sess["device_type"]
            })
            event_counter += 1

    write_csv(os.path.join(data_dir, "customers.csv"), ["customer_id", "country"], customers)
    write_csv(os.path.join(data_dir, "products.csv"), ["product_id", "description", "category", "unit_price"], products)
    write_csv(os.path.join(data_dir, "transactions.csv"), ["invoice_no", "customer_id", "stock_code", "description", "quantity", "unit_price", "transaction_date", "country"], transactions)
    write_csv(os.path.join(data_dir, "clickstream.csv"), ["event_id", "session_id", "customer_id", "timestamp", "event_type", "product_id", "device_type"], clickstream)

    print(f"Generated synthetic datasets in '{data_dir}':")
    print(f" - customers.csv: {len(customers)} rows")
    print(f" - products.csv: {len(products)} rows")
    print(f" - transactions.csv: {len(transactions)} rows")
    print(f" - clickstream.csv: {len(clickstream)} rows")


if __name__ == "__main__":
    data_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    generate_synthetic_data(data_directory)
