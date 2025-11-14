#!/usr/bin/env python3
"""Prepare a fine-tuning dataset from ingested policy documents.
Generates instruction-style JSONL with prompt + response pairs for LoRA.
"""
import json, os, re
from pathlib import Path

SOURCE_DIR = Path(os.getenv("DATA_SOURCE_DIR", "data/raw"))
OUT_PATH = Path(os.getenv("FT_OUT_FILE", "data/fine_tune/instructions.jsonl"))
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

SYSTEM_PROMPT = "You are a compliance analyst generating concise business impact summaries."  # stored for reference

# Very naive HTML cleanup
TAG_RE = re.compile(r"<[^>]+>")

def clean(text: str) -> str:
    text = TAG_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()

examples = []
for fp in SOURCE_DIR.glob("*.json"):
    with open(fp) as f:
        doc = json.load(f)
    body = clean(doc.get("text", ""))
    title = doc.get("title", "Untitled")
    prompt = f"Summarize the following regulation for a small {doc.get('industry','general')} business and list potential operational impacts.\nTitle: {title}\nText: {body[:5000]}"
    # Placeholder synthetic answer; in real workflow you'd curate or use expert review.
    answer = "Summary: (to fill) Impacts: (to fill)"
    examples.append({"instruction": prompt, "output": answer})

with open(OUT_PATH, "w") as out:
    for ex in examples:
        out.write(json.dumps(ex) + "\n")

print(f"Wrote {len(examples)} examples to {OUT_PATH}")
