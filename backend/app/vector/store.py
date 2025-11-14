from typing import List, Dict, Any
import numpy as np
from .embedding import embed_query

# Simple in-memory store; in production move to persistent DB
_documents: List[Dict[str, Any]] = []
_embeddings: List[List[float]] = []

try:
    import faiss  # type: ignore
    _use_faiss = True
except Exception:
    faiss = None
    _use_faiss = False
    _faiss_index = None

_faiss_index = None

def _ensure_faiss():
    global _faiss_index
    if not _use_faiss:
        return
    if _faiss_index is None and _embeddings:
        dim = len(_embeddings[0])
        _faiss_index = faiss.IndexFlatL2(dim)
        _faiss_index.add(np.array(_embeddings).astype('float32'))


def upsert_documents(docs: List[Dict[str, Any]], embeddings: List[List[float]]):
    for d, e in zip(docs, embeddings):
        _documents.append(d)
        _embeddings.append(e)
    if _use_faiss:
        global _faiss_index
        dim = len(_embeddings[0]) if _embeddings else 384
        if _faiss_index is None:
            _faiss_index = faiss.IndexFlatL2(dim)
            _faiss_index.add(np.array(_embeddings).astype('float32'))
        else:
            _faiss_index.add(np.array(embeddings).astype('float32'))


def vector_search(query: str, k: int = 5):
    if not _documents:
        return []
    q_emb = embed_query(query)
    if _use_faiss and _faiss_index is not None:
        D, I = _faiss_index.search(np.array([q_emb]).astype('float32'), k)
        results = []
        for dist, idx in zip(D[0], I[0]):
            if idx < len(_documents):
                doc = _documents[idx]
                results.append({"score": float(dist), "doc": doc})
        return results
    # Fallback cosine similarity
    q = np.array(q_emb)
    scores = []
    for emb, doc in zip(_embeddings, _documents):
        v = np.array(emb)
        sim = float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-9))
        scores.append((sim, doc))
    scores.sort(key=lambda x: x[0], reverse=True)
    return [{"score": s, "doc": d} for s, d in scores[:k]]


def list_documents() -> List[Dict[str, Any]]:
    return _documents
