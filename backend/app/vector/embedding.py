from sentence_transformers import SentenceTransformer
from typing import List

_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_texts(texts: List[str]):
    return _model.encode(texts).tolist()

def embed_query(q: str):
    return _model.encode([q])[0].tolist()
