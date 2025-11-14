import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router as api_router
from app.auth.auth0 import get_current_user_optional

load_dotenv()

app = FastAPI(title="PolicyMind API", version="0.1.0")

origins = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/me")
async def me(user = Depends(get_current_user_optional)):
    return {"user": user}

app.include_router(api_router, prefix="/v1")
