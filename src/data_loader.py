# ==============================================================================
# Electronics E-Commerce Data Loader & Synthetic Big Data Generator
# Generates realistic synthetic electronics transactions, products, & clickstream data
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
    """Generate reproducible Electronics E-Commerce datasets for customer analytics."""
    os.makedirs(data_dir, exist_ok=True)
    if seed is not None:
        random.seed(seed)

    start_date = datetime(2024, 1, 1, 0, 0, 0)
    end_date = datetime(2024, 12, 31, 23, 59, 59)
    total_seconds = int((end_date - start_date).total_seconds())

    # 1. Electronics Product Catalog Generation
    electronics_catalog = [
        # Smartphones
        {"product_id": "P001", "product_name": "iPhone 15 Pro 256GB", "category": "Smartphones", "unit_price": 999.00},
        {"product_id": "P002", "product_name": "Samsung Galaxy S24 Ultra", "category": "Smartphones", "unit_price": 1199.00},
        {"product_id": "P003", "product_name": "Google Pixel 8 Pro", "category": "Smartphones", "unit_price": 899.00},
        {"product_id": "P004", "product_name": "OnePlus 12 5G", "category": "Smartphones", "unit_price": 799.00},
        # Laptops
        {"product_id": "P005", "product_name": "MacBook Pro 16\" M3 Max", "category": "Laptops", "unit_price": 2499.00},
        {"product_id": "P006", "product_name": "Dell XPS 15 OLED", "category": "Laptops", "unit_price": 1799.00},
        {"product_id": "P007", "product_name": "HP Spectre x360 2-in-1", "category": "Laptops", "unit_price": 1399.00},
        {"product_id": "P008", "product_name": "Lenovo ThinkPad X1 Carbon", "category": "Laptops", "unit_price": 1599.00},
        # Headphones
        {"product_id": "P009", "product_name": "Sony WH-1000XM5 ANC", "category": "Headphones", "unit_price": 399.00},
        {"product_id": "P010", "product_name": "Apple AirPods Max Wireless", "category": "Headphones", "unit_price": 549.00},
        {"product_id": "P011", "product_name": "Bose QuietComfort Ultra", "category": "Headphones", "unit_price": 429.00},
        {"product_id": "P012", "product_name": "Sennheiser Momentum 4", "category": "Headphones", "unit_price": 349.00},
        # Keyboards
        {"product_id": "P013", "product_name": "Logitech MX Keys Wireless", "category": "Keyboards", "unit_price": 119.00},
        {"product_id": "P014", "product_name": "Keychron K2 Mechanical RGB", "category": "Keyboards", "unit_price": 99.00},
        {"product_id": "P015", "product_name": "Corsair K70 RGB PRO Mechanical", "category": "Keyboards", "unit_price": 149.00},
        # Mouse
        {"product_id": "P016", "product_name": "Logitech MX Master 3S Ergonomic", "category": "Mouse", "unit_price": 99.00},
        {"product_id": "P017", "product_name": "Razer DeathAdder V3 Pro", "category": "Mouse", "unit_price": 129.00},
        # Monitors
        {"product_id": "P018", "product_name": "Dell UltraSharp 27\" 4K USB-C", "category": "Monitors", "unit_price": 599.00},
        {"product_id": "P019", "product_name": "LG UltraGear 34\" Curved Gaming", "category": "Monitors", "unit_price": 799.00},
        {"product_id": "P020", "product_name": "Samsung Odyssey G7 32\"", "category": "Monitors", "unit_price": 649.00},
        # Smartwatches
        {"product_id": "P021", "product_name": "Apple Watch Series 9 GPS", "category": "Smartwatches", "unit_price": 399.00},
        {"product_id": "P022", "product_name": "Samsung Galaxy Watch 6 Classic", "category": "Smartwatches", "unit_price": 349.00},
        {"product_id": "P023", "product_name": "Garmin Fenix 7 Solar Edition", "category": "Smartwatches", "unit_price": 699.00},
        # Tablets
        {"product_id": "P024", "product_name": "iPad Air 5th Gen 256GB", "category": "Tablets", "unit_price": 749.00},
        {"product_id": "P025", "product_name": "Samsung Galaxy Tab S9 Ultra", "category": "Tablets", "unit_price": 1199.00},
        # Chargers
        {"product_id": "P026", "product_name": "Anker 65W GaN Fast Wall Charger", "category": "Chargers", "unit_price": 49.00},
        {"product_id": "P027", "product_name": "Apple 20W USB-C Power Adapter", "category": "Chargers", "unit_price": 19.00},
        {"product_id": "P028", "product_name": "Belkin 3-in-1 Wireless MagSafe", "category": "Chargers", "unit_price": 129.00}
    ]

    products = []
    for item in electronics_catalog:
        products.append({
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "description": item["product_name"],
            "category": item["category"],
            "unit_price": item["unit_price"]
        })

    # 2. Customer Profiles Generation
    customer_ids = [f"C{i:04d}" for i in range(101, 101 + num_customers)]
    countries = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan"]
    country_weights = [0.45, 0.20, 0.12, 0.08, 0.07, 0.05, 0.03]

    customers = []
    for customer_id in customer_ids:
        country = random.choices(countries, weights=country_weights, k=1)[0]
        customers.append({"customer_id": customer_id, "country": country})

    # 3. Transactions Generation
    devices = ["Desktop", "Mobile", "Tablet"]
    device_weights = [0.45, 0.45, 0.10]
    num_invoices = max(1, int(num_transactions * 0.35))
    invoices = []
    for i in range(10001, 10001 + num_invoices):
        inv_no = f"INV_{i}"
        cust = random.choice(customer_ids)
        t_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        country = random.choices(countries, weights=country_weights, k=1)[0]
        dev = random.choices(devices, weights=device_weights, k=1)[0]
        invoices.append({"invoice_no": inv_no, "customer_id": cust, "transaction_date": t_date, "country": country, "device": dev})

    transactions = []
    qty_options = [1, 2, 3, 4, 5]
    qty_weights = [0.70, 0.18, 0.07, 0.03, 0.02]

    for _ in range(num_transactions):
        inv = random.choice(invoices)
        prod = random.choice(products)
        qty = random.choices(qty_options, weights=qty_weights, k=1)[0]
        transactions.append({
            "invoice_no": inv["invoice_no"],
            "customer_id": inv["customer_id"],
            "product_id": prod["product_id"],
            "stock_code": prod["product_id"],
            "product_name": prod["product_name"],
            "description": prod["product_name"],
            "category": prod["category"],
            "quantity": qty,
            "unit_price": prod["unit_price"],
            "transaction_date": inv["transaction_date"].strftime("%Y-%m-%d %H:%M:%S"),
            "country": inv["country"],
            "device": inv["device"]
        })

    # 4. Clickstream Events Generation
    num_sessions = 15000
    sessions = []
    for i in range(1, num_sessions + 1):
        sess_id = f"SESS_{i:07d}"
        cust = random.choice(customer_ids)
        dev = random.choices(devices, weights=device_weights, k=1)[0]
        s_date = start_date + timedelta(seconds=random.randint(0, total_seconds))
        sessions.append({"session_id": sess_id, "customer_id": cust, "device": dev, "start_time": s_date})

    clickstream = []
    event_types = ["view", "add_to_cart", "search", "purchase"]
    event_weights = [0.65, 0.20, 0.10, 0.05]

    event_counter = 1
    for sess in sessions:
        num_events = random.randint(1, 8)
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
                "product_name": prod["product_name"],
                "device": sess["device"]
            })
            event_counter += 1

    write_csv(os.path.join(data_dir, "customers.csv"), ["customer_id", "country"], customers)
    write_csv(os.path.join(data_dir, "products.csv"), ["product_id", "product_name", "description", "category", "unit_price"], products)
    write_csv(os.path.join(data_dir, "transactions.csv"), ["invoice_no", "customer_id", "product_id", "stock_code", "product_name", "description", "category", "quantity", "unit_price", "transaction_date", "country", "device"], transactions)
    write_csv(os.path.join(data_dir, "clickstream.csv"), ["event_id", "session_id", "customer_id", "timestamp", "event_type", "product_id", "product_name", "device"], clickstream)

    print(f"Generated Electronics E-Commerce Datasets in '{data_dir}':")
    print(f" - customers.csv: {len(customers)} rows")
    print(f" - products.csv: {len(products)} rows (Electronics Store Catalog)")
    print(f" - transactions.csv: {len(transactions)} rows")
    print(f" - clickstream.csv: {len(clickstream)} rows")


if __name__ == "__main__":
    data_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    generate_synthetic_data(data_directory)
