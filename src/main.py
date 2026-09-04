# ==============================================================================
# Master E-Commerce Big Data Pipeline Controller
# Sequence: E-Commerce Data -> HDFS -> PySpark -> Data Cleaning -> RFM Analysis -> K-Means -> Customer Segmentation
# ==============================================================================

import os
import sys

# Ensure src directory is in Python path for module imports
src_dir = os.path.dirname(os.path.abspath(__file__))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from data_loader import generate_synthetic_data
from data_cleaning import run_data_cleaning
from cohort_analysis import run_cohort_analysis
from rfm_analysis import run_rfm_analysis
from hadoop_hdfs_helper import is_hadoop_environment, sync_local_data_to_hdfs


def main():
    use_hadoop = "--use-hadoop" in sys.argv or is_hadoop_environment()
    project_root = os.path.dirname(src_dir)
    data_dir = os.path.join(project_root, "data")
    output_dir = os.path.join(project_root, "output")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    required_inputs = [
        os.path.join(data_dir, "customers.csv"),
        os.path.join(data_dir, "products.csv"),
        os.path.join(data_dir, "transactions.csv"),
        os.path.join(data_dir, "clickstream.csv")
    ]

    print("==================================================================")
    print("  E-COMMERCE BIG DATA CUSTOMER ANALYTICS PIPELINE")
    print("  SEQUENCE: E-Commerce Data -> HDFS -> PySpark -> Cleaning -> RFM -> K-Means -> Segmentation")
    if use_hadoop:
        print("  MODE: Apache Hadoop / PySpark Cluster Execution")
    else:
        print("  MODE: Local Processing Execution")
    print("==================================================================")

    # Step 1: E-Commerce Data
    if not all(os.path.exists(path) for path in required_inputs):
        print("\n[Step 1/7] Ingesting E-Commerce Data (Generating raw datasets)...")
        generate_synthetic_data(data_dir)
    else:
        print("\n[Step 1/7] E-Commerce Raw Datasets verified.")

    # Step 2: HDFS Storage
    if use_hadoop:
        print("\n[Step 2/7] Uploading datasets to HDFS Storage (/ecommerce/raw)...")
        synced = sync_local_data_to_hdfs(data_dir, hdfs_raw_dir="/ecommerce/raw")
        if synced:
            print("[HADOOP HDFS] Datasets successfully stored in HDFS Cluster!")
    else:
        print("\n[Step 2/7] HDFS Step: Storage prepared (hdfs://namenode:9000/ecommerce/raw).")

    # Step 3 & 4: PySpark & Data Cleaning
    print("\n[Step 3-4/7] PySpark Execution & Data Cleaning (Aggregating transactions & sessions)...")
    run_data_cleaning(data_dir, output_dir)
    run_cohort_analysis(output_dir)

    # Step 5, 6 & 7: RFM Analysis, K-Means & Customer Segmentation
    print("\n[Step 5-7/7] Running RFM Analysis, K-Means Clustering & Customer Segmentation...")
    run_rfm_analysis(output_dir)

    print("\n==================================================================")
    print("  PIPELINE COMPLETE: Ready for app.py & React Dashboard")
    print("==================================================================\n")


if __name__ == "__main__":
    main()
