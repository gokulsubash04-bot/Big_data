# ==============================================================================
# Customer Segmentation Rule Engine
# Assigns behavioral segments based on RFM scores
# ==============================================================================

def assign_segment(r_score, f_score, m_score):
    """Map Recency, Frequency, and Monetary scores (1-5 scale) to customer segments."""
    if r_score >= 4 and f_score >= 4 and m_score >= 4:
        return "Champions"
    if f_score >= 3 and m_score >= 3:
        return "Loyal Customers"
    if r_score >= 4 and f_score <= 2:
        return "New Customers"
    if r_score <= 2 and f_score >= 3:
        return "At Risk"
    if r_score <= 2 and f_score <= 2 and m_score <= 2:
        return "Lost"
    return "Potential Loyalists"
