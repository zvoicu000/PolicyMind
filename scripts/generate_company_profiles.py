#!/usr/bin/env python3
"""Generate extended company_profiles.json from company_list.txt.
Each company is assigned heuristic domains based on keyword matching.
Manual review recommended to refine data categories and domains.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
LIST_FILE = DATA / "company_list.txt"
OUT_FILE = DATA / "company_profiles_extended.json"

DOMAIN_KEYWORDS = {
    "Privacy": ["data", "cloud", "analytics", "platform"],
    "Cybersecurity": [
        "security", "secure", "trust", "darktrace", "bitdefender", "avast"
    ],
    "FinTech": [
        "bank", "pay", "fin", "wise", "revolut", "klarna", "mollie", "mambu"
    ],
    "AIRegulation": [
        "ai", "graphcore", "deepmind", "peak", "tractable", "dataiku"
    ],
    "ECommerce": [
        "shop", "market", "commerce", "back market", "presta",
        "farfetch", "zalando"
    ],
}

DEFAULT_DATA_CATEGORIES = ["PII", "UsageMetrics"]

profiles = []
raw = LIST_FILE.read_text().strip().splitlines()
for name in raw:
    n_lower = name.lower()
    domains = []
    for dom, kws in DOMAIN_KEYWORDS.items():
        if any(k in n_lower for k in kws):
            domains.append(dom)
    if not domains:
        domains.append("GeneralTech")
    profile = {
        "name": name.strip(),
        "jurisdictions": ["EU"],
        "industry": ["Technology"],
        "data_categories": DEFAULT_DATA_CATEGORIES,
        "domains": domains,
        "description": (
            f"Placeholder profile for {name.strip()} auto-generated; "
            "please refine domains and data categories."
        ),
    }
    profiles.append(profile)

with open(OUT_FILE, "w") as f:
    json.dump(profiles, f, indent=2)

print(f"Wrote {len(profiles)} profiles to {OUT_FILE}")
