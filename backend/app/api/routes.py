from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from app.services.ingest import fetch_documents
from app.services.summarize import summarize_text, analyze_impact
from app.vector.store import vector_search, upsert_documents, list_documents
from app.vector.embedding import embed_texts
from app.auth.auth0 import get_current_user, get_current_user_optional
from app.services.relevance import (
    list_companies,
    get_company_profile,
    score_policy_for_company,
    batch_score,
    search_companies,
)

router = APIRouter()

@router.post("/ingest")
async def ingest(industry: Optional[str] = Query(None), limit: int = 10, user=Depends(get_current_user)):
    docs = fetch_documents(industry=industry, limit=limit)
    if not docs:
        return {"ingested": 0}
    texts = [d["text"] for d in docs]
    embeddings = embed_texts(texts)
    upsert_documents(docs, embeddings)
    return {"ingested": len(docs)}

@router.get("/search")
async def search(q: str, k: int = 5, user=Depends(get_current_user)):
    results = vector_search(q, k=k)
    return {"results": results}

@router.post("/summarize")
async def summarize(doc: str, user=Depends(get_current_user)):
    summary = await summarize_text(doc)
    impact = await analyze_impact(doc)
    return {"summary": summary, "impact": impact}

@router.get("/companies")
async def companies(user=Depends(get_current_user_optional)):
    return {"companies": list_companies()}

@router.get("/companies/search")
async def companies_search(q: str, user=Depends(get_current_user_optional)):
    return {"matches": search_companies(q)}

@router.get("/companies/{name}")
async def company_profile(name: str, user=Depends(get_current_user_optional)):
    try:
        profile = get_company_profile(name)
        return profile
    except KeyError:
        raise HTTPException(status_code=404, detail="Company not found")

@router.post("/relevance/{name}")
async def relevance(name: str, text: str, user=Depends(get_current_user_optional)):
    try:
        profile = get_company_profile(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Company not found")
    result = score_policy_for_company(text, profile)
    return {"company": name, "result": result}

@router.get("/docs")
async def docs(user=Depends(get_current_user_optional)):
    return {"count": len(list_documents()), "docs": list_documents()}

@router.get("/relevance_batch/{name}")
async def relevance_batch(name: str, limit: int = Query(25, ge=1, le=200), user=Depends(get_current_user_optional)):
    try:
        profile = get_company_profile(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Company not found")
    docs = list_documents()[:limit]
    scored = batch_score(profile, docs)
    return {"company": name, "total": len(docs), "results": scored}
