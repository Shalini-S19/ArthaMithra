"""Financial health score (0-100) from three parts.

TEAM DECISION: agree the weights below together and write them in the report.
They must add up to 100.
"""
WEIGHTS = {"savings": 40, "consistency": 30, "schemes": 30}
SAVINGS_TARGET = 0.20   # saving 20% of weekly income earns full savings points


def compute_score(income_7d, expense_7d, days_logged_7d, applied_matched, matched_total):
    """
    income_7d, expense_7d : totals for the last 7 days
    days_logged_7d        : number of different days (0-7) with at least one entry
    applied_matched       : matched schemes the user marked as applied
    matched_total         : number of schemes currently matched to the user
    """
    # 1. Savings rate (needs some income to count)
    if income_7d > 0:
        rate = max(0.0, (income_7d - expense_7d) / income_7d)
        savings_frac = min(rate / SAVINGS_TARGET, 1.0)
    else:
        rate, savings_frac = 0.0, 0.0

    # 2. Consistency: how many of the last 7 days were logged
    consistency_frac = min(days_logged_7d, 7) / 7

    # 3. Schemes: share of matched schemes applied for (nothing to apply for = full marks)
    schemes_frac = 1.0 if matched_total == 0 else min(applied_matched / matched_total, 1.0)

    parts = {
        "savings": round(WEIGHTS["savings"] * savings_frac, 1),
        "consistency": round(WEIGHTS["consistency"] * consistency_frac, 1),
        "schemes": round(WEIGHTS["schemes"] * schemes_frac, 1),
    }
    total = round(sum(parts.values()))

    # Tip: point the user at the part where they lose the most points
    lost = {k: WEIGHTS[k] - parts[k] for k in parts}
    worst = max(lost, key=lost.get)
    tip = {"savings": "save_more", "consistency": "log_more_days", "schemes": "apply_schemes"}[worst]
    if lost[worst] < 1:
        tip = "great"

    return {
        "score": total,
        "parts": parts,
        "max_parts": WEIGHTS,
        "savings_rate": round(rate, 2),
        "days_logged_7d": days_logged_7d,
        "schemes_applied": applied_matched,
        "schemes_matched": matched_total,
        "tip": tip,          # frontend maps: save_more | log_more_days | apply_schemes | great
    }
