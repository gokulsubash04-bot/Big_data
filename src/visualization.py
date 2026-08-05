# ==============================================================================
# Visualization & Executive Summary Reporting Module
# Prepares high-level report payloads and dashboard exports
# ==============================================================================

import json
import os


def summary_report(customer_profiles, cohort_matrix, basket_rules):
    """Generate executive summary analytics counters."""
    return {
        "customer_count": len(customer_profiles),
        "cohort_count": len(cohort_matrix),
        "basket_rule_count": len(basket_rules)
    }


def export_dashboard_data(output_path, payload):
    """Export structured dashboard payload as JSON."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
