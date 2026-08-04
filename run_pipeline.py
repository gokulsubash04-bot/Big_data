# ==============================================================================
# Master Python Pipeline Execution Script
# Big Data Analytics Workflow: Ingestion, PySpark/ETL, Cohorts, RFM & Basket Rules
# ==============================================================================

import time
import subprocess
import sys

def run_script(script_path):
    print(f"\n---> Executing {script_path}...")
    res = subprocess.run([sys.executable, script_path], check=True)
    return res.returncode == 0

def main():
    print("******************************************************************")
    print("  E-COMMERCE BIG DATA ANALYTICS PIPELINE (Python Workflow)")
    print("******************************************************************\n")

    start_time = time.time()

    run_script("scripts/01_data_generator.py")
    run_script("scripts/02_spark_etl_pipeline.py")
    run_script("scripts/03_cohort_analysis.py")
    run_script("scripts/04_rfm_segmentation.py")
    run_script("scripts/05_basket_analysis.py")

    elapsed = time.time() - start_time
    print("\n******************************************************************")
    print(f"  ALL PYTHON PIPELINE STAGES COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS!")
    print("******************************************************************\n")

if __name__ == "__main__":
    main()
