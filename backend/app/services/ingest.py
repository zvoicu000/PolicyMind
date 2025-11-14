import datetime
import requests
from typing import List, Dict, Optional

# Reuse domain keyword mapping from relevance service for doc domain tagging.
try:
    from app.services.relevance import _domain_keywords  # type: ignore
except Exception:  # Fallback empty mapping if relevance not yet initialized.
    _domain_keywords = {}

BASE_URL = "https://www.federalregister.gov/api/v1/documents"

INDUSTRY_KEYWORDS = {
    "finance": ["SEC", "investment", "bank"],
    "healthcare": ["Medicare", "Medicaid", "FDA", "health"],
    "energy": ["energy", "oil", "gas", "solar", "wind"],
    "technology": ["cybersecurity", "data", "software", "AI"],
}


def _today() -> str:
    return datetime.date.today().isoformat()


def fetch_documents(
    industry: Optional[str] = None,
    limit: int = 10,
) -> List[Dict]:
    params = {
        "conditions[publication_date][is]": _today(),
        "per_page": limit,
        "order": "newest"
    }
    try:
        resp = requests.get(BASE_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return []
    docs = []
    keywords = INDUSTRY_KEYWORDS.get(industry, []) if industry else []
    for item in data.get("results", [])[:limit]:
        title = item.get("title", "")
        body = item.get("body_html", "") or item.get("abstract", "") or ""
        if (
            industry
            and keywords
            and not any(k.lower() in (title + body).lower() for k in keywords)
        ):
            continue
        # Domain tagging: simple keyword presence scan per taxonomy domain.
        doc_domains = []
        combined_lower = (title + " " + body).lower()
        for domain, kws in _domain_keywords.items():
            for k in kws:
                if k.lower() in combined_lower:
                    doc_domains.append(domain)
                    break
        docs.append({
            "id": item.get("document_number"),
            "title": title,
            "text": body,
            "url": item.get("html_url"),
            "date": item.get("publication_date") or _today(),
            "domains": doc_domains,
        })
    return docs
