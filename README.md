# 🛒 Electronics E-Commerce Big Data Analytics Using Hadoop and PySpark

An enterprise-grade, Big Data analytics project built using **Apache Hadoop (HDFS & YARN)**, **PySpark**, **Python**, **Docker**, **Scikit-Learn (RFM & K-Means)**, and a **React Web Visualization Suite**.

---

## 📌 Project Overview & Objective

### 🎯 Main Objective
> **"How can Big Data technologies be used to analyze customer purchasing behaviour in an electronics e-commerce store?"**

This project ingests, stores, processes, and analyzes customer transaction logs and browsing clickstream data for an **Electronics E-Commerce Store** selling products such as:
- **Smartphones** (`iPhone 15 Pro`, `Samsung Galaxy S24 Ultra`, `Google Pixel 8 Pro`)
- **Laptops** (`MacBook Pro 16" M3 Max`, `Dell XPS 15 OLED`, `Lenovo ThinkPad X1`)
- **Headphones** (`Sony WH-1000XM5`, `Apple AirPods Max`, `Bose QuietComfort Ultra`)
- **Keyboards** (`Logitech MX Keys`, `Keychron K2 Mechanical`)
- **Mouse** (`Logitech MX Master 3S`, `Razer DeathAdder V3`)
- **Monitors** (`Dell UltraSharp 27" 4K`, `LG UltraGear 34" Curved Gaming`)
- **Smartwatches** (`Apple Watch Series 9`, `Samsung Galaxy Watch 6`)
- **Tablets** (`iPad Air 5th Gen`, `Samsung Galaxy Tab S9 Ultra`)
- **Chargers** (`Anker 65W GaN Fast Charger`, `Apple 20W USB-C Adapter`)

---

## 🏗️ Simplified Architecture & Data Flow

```text
             Electronics E-Commerce Data
                         ↓
                    Data Loader
                         ↓
                    Hadoop HDFS (/ecommerce/raw/)
                         ↓
                       YARN
                         ↓
                     PySpark
                         ↓
                  Data Cleaning
                         ↓
                    RFM Analysis
                         ↓
                     K-Means
                         ↓
              Customer Segmentation
                         ↓
                  Processed Results (/ecommerce/processed/)
                         ↓
                      app.py
                         ↓
                    API / HTTP
                         ↓
                  React Dashboard
```

---

## 🔑 Technology Stack & Viva Quick Reference

| Technology | Role in Project | Viva-Friendly Simple Explanation |
| :--- | :--- | :--- |
| 🐘 **Hadoop HDFS** | Distributed Block Storage | *HDFS stores large raw and processed datasets across nodes (`/ecommerce/raw/`).* |
| ⚙️ **Hadoop YARN** | Cluster Resource Manager | *YARN allocates RAM and CPU resources to container tasks across the cluster.* |
| ⚡ **PySpark** | Distributed ETL Engine | *PySpark processes, cleans, and aggregates large DataFrames in parallel.* |
| 📊 **RFM Analysis** | Behavioral Scoring | *Measures Recency (days), Frequency (orders), and Monetary ($ spend) on a 1-5 scale.* |
| 🤖 **K-Means ML** | Customer Clustering | *Groups customers into 4 behavioral segments (Champions, Loyal, At Risk, Lost).* |
| 🐍 **app.py Server** | Python REST API | *Multi-threaded Python server exposing JSON analytics endpoints on port 8501.* |
| 🖥️ **React + Vite** | Visual Web Dashboard | *Single-page web dashboard rendering live analytics charts and customer profiles.* |
| 🐳 **Docker Compose**| Container Orchestration| *Spins up containerized Hadoop NameNode, DataNode, YARN, Runner, and UI.* |

---

## 📂 Project Directory Structure

```
Big_Data/
├── Dockerfile                   # Docker container build script (Java 11, Hadoop 3.3.6, Python 3.10)
├── docker-compose.yml           # Container orchestration (NameNode, DataNode, YARN, Runner, UI)
├── entrypoint.sh                # Container entrypoint for HDFS formatting & pipeline launch
├── app.py                       # Multi-threaded Python server & API host (Port 8501)
├── run_pipeline.py              # Master pipeline execution script
├── requirements.txt             # Cleaned Python dependencies
├── README.md                    # Main project documentation
├── EXPLANATION.txt              # High-level architecture explanation
├── FILE_EXPLANATION.txt         # Module-by-module file reference guide
├── hadoop-config/               # Apache Hadoop XML Cluster Configurations
│   ├── core-site.xml            # Default HDFS URI (hdfs://namenode:9000)
│   ├── hdfs-site.xml            # NameNode, DataNode storage paths & replication settings
│   └── yarn-site.xml            # YARN ResourceManager, NodeManager & memory settings
├── src/                         # Python Analytics Engine Modules
│   ├── main.py                  # Master workflow controller
│   ├── data_loader.py           # Electronics synthetic data generator
│   ├── data_cleaning.py         # ETL & clickstream sessionization engine
│   ├── cohort_analysis.py       # Cohort retention matrix engine
│   ├── rfm_analysis.py          # RFM scoring & 3D K-Means clustering model
│   ├── segmentation.py          # Customer segment mapping definitions
│   ├── visualization.py        # Report export helpers
│   └── hadoop_hdfs_helper.py    # HDFS CLI integration & dataset uploader
├── data/                        # Datasets (Generated & Processed)
│   ├── customers.csv            # Customer profile metadata
│   ├── products.csv             # Electronics store catalog
│   ├── transactions.csv         # Raw transactional purchase log
│   ├── clickstream.csv          # Raw web/mobile event log
│   └── processed/               # Processed CSV tables (Cleaned profiles, RFM, Cohorts)
├── output/                      # Analytics Outputs & Dashboard JSON files
│   ├── customer_aggregated.csv  # Master aggregated customer table
│   ├── rfm_customer_segments.csv# RFM scores & K-Means Cluster IDs
│   ├── cohort_retention_matrix.csv# Cohort retention matrix
│   └── clickstream_funnel_summary.json # Conversion funnel JSON metrics
└── frontend/                    # React Web Dashboard (Vite, Chart.js, Lucide icons)
    ├── src/                     # React Components (App, ExecutiveOverview, PipelineFlow, RFMTable, etc.)
    └── dist/                    # Compiled production React bundle
```

---

## 📑 Data Schema Examples

### `transactions.csv` (Electronics Purchase History)
```csv
invoice_no,customer_id,product_id,product_name,category,quantity,unit_price,transaction_date,country,device
INV_10001,C0101,P001,iPhone 15 Pro 256GB,Smartphones,1,999.00,2024-03-21 07:07:02,United States,Desktop
INV_10002,C0102,P005,MacBook Pro 16" M3 Max,Laptops,1,2499.00,2024-07-21 19:54:19,United Kingdom,Mobile
INV_10003,C0101,P009,Sony WH-1000XM5 ANC,Headphones,1,399.00,2024-09-19 22:24:19,Germany,Desktop
```

---

## 🚀 How to Run & Demonstrate the Project

### Option A: Docker Containerized Hadoop Cluster (Recommended)

```powershell
# Build & start Hadoop HDFS cluster and web services
docker-compose up --build -d
```

#### 🌐 Container Web Service Ports:
- 🖥️ **Web Dashboard**: [http://localhost:8501](http://localhost:8501)
- 🐘 **Hadoop NameNode UI**: [http://localhost:9870](http://localhost:9870)
- ⚙️ **Hadoop YARN ResourceManager**: [http://localhost:8088](http://localhost:8088)
- 💾 **Hadoop DataNode UI**: [http://localhost:9864](http://localhost:9864)

---

### Option B: Local Execution

```powershell
# 1. Run full pipeline
python run_pipeline.py

# 2. Launch web server
python app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 🎯 Viva Explanation Script

> *"Our project is an Electronics E-Commerce Big Data analytics system. We generate transaction data for electronics items like smartphones and laptops and store it in Hadoop HDFS. YARN manages the cluster resources, and PySpark cleans and aggregates the dataset. We use RFM analysis to measure customer recency, frequency, and spend, and K-Means clustering to group customers into 4 behavioral segments (Champions, Loyal Customers, At Risk, Lost Customers). The processed outputs are served through a multi-threaded Python backend (`app.py`) and displayed on a React web dashboard. The entire environment runs cleanly using Docker Compose."*
