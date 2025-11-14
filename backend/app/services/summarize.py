import os
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_SUMMARY = "You are a concise assistant summarizing US federal regulations for small businesses. Return 3-5 bullet points."
SYSTEM_IMPACT = "You analyze regulatory text and output potential operational impacts in JSON with keys: affected_departments, required_actions, compliance_deadline (if any), risk_level (low/medium/high)."

async def _openai_chat(messages, temperature=0.2) -> str:
    if not OPENAI_API_KEY:
        return "[Hosted LLM not configured]"
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": MODEL, "messages": messages, "temperature": temperature}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]

async def summarize_text(text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_SUMMARY},
        {"role": "user", "content": text[:6000]}
    ]
    return await _openai_chat(messages)

async def analyze_impact(text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_IMPACT},
        {"role": "user", "content": text[:6000]}
    ]
    return await _openai_chat(messages)
