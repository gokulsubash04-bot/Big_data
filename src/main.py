# ==============================================================================
# Master Core Analytics Pipeline Controller
# Coordinates Synthetic Generation, Cleaning, Cohorts, RFM & Market Basket Analysis
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
from basket_analysis import run_basket_analysis


def main():
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
    print("==================================================================")

    if not all(os.path.exists(path) for path in required_inputs):
        print("\n[Step 1/5] Missing raw CSV files. Generating synthetic datasets...")
        generate_synthetic_data(data_dir)
    else:
        print("\n[Step 1/5] Raw CSV datasets found.")

    print("\n[Step 2/5] Running data cleaning & customer aggregation...")
    run_data_cleaning(data_dir, output_dir)

    print("\n[Step 3/5] Running cohort retention matrix analysis...")
    run_cohort_analysis(output_dir)

    print("\n[Step 4/5] Running RFM segmentation & K-Means clustering...")
    run_rfm_analysis(output_dir)

    print("\n[Step 5/5] Running market basket association rule mining...")
    run_basket_analysis(output_dir)

    print("\n==================================================================")
    print("  PIPELINE COMPLETE: Outputs available in 'output/' and 'data/processed/'")
    print("==================================================================\n")


if __name__ == "__main__":
    main()
