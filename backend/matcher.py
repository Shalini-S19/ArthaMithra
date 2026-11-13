"""Scheme matching: plain filtering of schemes.json against a user profile.

user dict keys used: age, gender, monthly_income (or None if unknown),
and any profile flag named in a scheme (e.g. has_insurance, has_bank_account).

Eligibility keys a scheme may use (all optional):
    max_monthly_income : number
    min_age / max_age  : numbers
    gender             : "female" | "male" | "other"
    profile_flags      : {"has_insurance": false, ...}
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_schemes(path=None):
    path = path or os.path.join(BASE_DIR, "schemes.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)["schemes"]


def matches(user, scheme):
    e = scheme.get("eligibility", {})

    # Income rule: if we have no income data yet, do not exclude the scheme.
    if "max_monthly_income" in e and user.get("monthly_income") is not None:
        if user["monthly_income"] > e["max_monthly_income"]:
            return False

    age = user.get("age")
    if age is not None:
        if not (e.get("min_age", 0) <= age <= e.get("max_age", 120)):
            return False

    if "gender" in e and user.get("gender") != e["gender"]:
        return False

    for flag, wanted in e.get("profile_flags", {}).items():
        if bool(user.get(flag)) != bool(wanted):
            return False
    return True


def match_all(user, schemes=None):
    schemes = schemes if schemes is not None else load_schemes()
    return [s for s in schemes if matches(user, s)]
