import json
import os
from pathlib import Path
from typing import List, Dict, Any
import math
from app.vector.embedding import embed_query


def _find_data_dir() -> Path:
    # Ordered candidates: env var, project root data, backend sibling data.
    env_dir = os.getenv("DATA_DIR")
    if env_dir:
        p = Path(env_dir)
        if (p / "company_profiles.json").exists():
            return p
    candidates = [
        Path(__file__).resolve().parents[3] / "data",  # root
        Path(__file__).resolve().parents[2] / "data",  # backend fallback
    ]
    for c in candidates:
        if (c / "company_profiles.json").exists():
            return c
    return candidates[0]

 
DATA_DIR = _find_data_dir()
EXTENDED_FILE = DATA_DIR / "company_profiles_extended.json"
COMPANY_FILE = DATA_DIR / "company_profiles.json"  # legacy fallback
TAXONOMY_FILE = DATA_DIR / "taxonomy.json"

if EXTENDED_FILE.exists():
    _companies: List[Dict[str, Any]] = json.loads(EXTENDED_FILE.read_text())
elif COMPANY_FILE.exists():
    _companies = json.loads(COMPANY_FILE.read_text())
else:
    _companies = []

if TAXONOMY_FILE.exists():
    _taxonomy = json.loads(TAXONOMY_FILE.read_text())
else:
    _taxonomy = {"domains": {}}

_domain_keywords = {
    d: set(info.get("keywords", []))
    for d, info in _taxonomy.get("domains", {}).items()
}

# Synonym / expansion mapping for placeholder company domain labels.
# "FinTech" maps to compliance/fraud/privacy domains; "GeneralTech" maps
# to broad tech governance domains.
DOMAIN_SYNONYMS: Dict[str, List[str]] = {
    "FinTech": ["FinancialCompliance", "AntiFraud", "Privacy"],
    "GeneralTech": ["AIRegulation", "Cybersecurity", "Privacy"],
}

 
def _expand_company_domains(domains: List[str]) -> set:
    expanded = set()
    for d in domains:
        expanded.add(d)
        for mapped in DOMAIN_SYNONYMS.get(d, []):
            expanded.add(mapped)
    return expanded


def list_companies() -> List[str]:
    return [c["name"] for c in _companies]

 
def search_companies(term: str) -> List[str]:
    t = term.lower().strip()
    return [c["name"] for c in _companies if t in c["name"].lower()]


def get_company_profile(name: str) -> Dict[str, Any]:
    for c in _companies:
        if c["name"].lower() == name.lower():
            return c
    raise KeyError(name)


def score_policy_for_company(
    policy_text: str,
    company: Dict[str, Any],
    date_str: str | None = None,
) -> Dict[str, Any]:
    text_lower = policy_text.lower()
    domain_hits: Dict[str, list] = {}
    for domain, kws in _domain_keywords.items():
        hits = [k for k in kws if k in text_lower]
        if hits:
            domain_hits[domain] = hits
    keyword_hits = sum(len(v) for v in domain_hits.values())
    keyword_norm = min(keyword_hits, 6) / 6.0
    company_desc = company.get("description", "")
    sim_raw = 0.0
    try:
        policy_vec = embed_query(policy_text[:500])
        company_vec = embed_query(company_desc[:500])
        # cosine manually
        import numpy as np
        p = np.array(policy_vec)
        c = np.array(company_vec)
        # Cosine similarity manual computation (split for lint).
        numerator = (p @ c)
        denom = (np.linalg.norm(p) * np.linalg.norm(c) + 1e-9)
        sim_raw = float(numerator / denom)
    except Exception:
        sim_raw = 0.0
    sim_norm = max(0.0, min(1.0, (sim_raw + 1.0) / 2.0))
    company_domains = _expand_company_domains(company.get("domains", []))
    overlap = len(set(domain_hits.keys()) & company_domains)
    domain_overlap_norm = overlap / max(1, len(company_domains))
    recency = 1.0
    if date_str:
        try:
            from datetime import datetime, date
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            days = (date.today() - d).days
            if days < 0:
                days = 0
            recency = math.exp(-days / 30.0)
        except Exception:
            recency = 1.0
    # Adjust similarity scaling to penalize very weak raw similarity.
    if sim_raw < 0.05:
        sim_norm *= 0.5
    elif sim_raw < 0.10:
        sim_norm *= 0.8

    # Weight mix: emphasize domain overlap more once synonyms expand coverage.
    score = (
        0.35 * keyword_norm +
        0.30 * sim_norm +
        0.25 * domain_overlap_norm +
        0.10 * recency
    )

    # Penalty: no domain overlap and minimal keyword evidence.
    if domain_overlap_norm == 0 and keyword_norm < 0.2:
        score *= 0.9
    return {
        "score": round(score, 4),
        "keyword_hits": keyword_hits,
        "keyword_norm": round(keyword_norm, 4),
        "raw_similarity": round(sim_raw, 4),
        "similarity_norm": round(sim_norm, 4),
        "domain_overlap_norm": round(domain_overlap_norm, 4),
        "recency": round(recency, 4),
        "domains": list(domain_hits.keys()),
        "domain_hits": domain_hits,
    }


def batch_score(
    company: Dict[str, Any],
    docs: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    results = []
    for d in docs:
        text = (d.get("text") or d.get("title") or "")[:4000]
        r = score_policy_for_company(text, company, d.get("date"))
        score = r["score"]
        if score >= 0.7:
            risk = "high"
        elif score >= 0.5:
            risk = "medium"
        else:
            risk = "low"
        results.append({
            "id": d.get("id"),
            "title": d.get("title"),
            "score": score,
            "risk": risk,
            "domains": r.get("domains"),
            "keyword_hits": r.get("keyword_hits"),
            "keyword_norm": r.get("keyword_norm"),
            "similarity_norm": r.get("similarity_norm"),
            "domain_overlap_norm": r.get("domain_overlap_norm"),
            "recency": r.get("recency"),
            "url": d.get("url"),
        })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
