import os
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from jose import jwt
from jose.exceptions import JWTError

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

# In production cache JWKS
import requests

def _get_jwks():
    if not AUTH0_DOMAIN:
        return None
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    try:
        jwks = requests.get(url, timeout=5).json()
        return jwks
    except Exception:
        return None

JWKS = _get_jwks()

class Auth0User(Dict[str, Any]):
    pass

def _verify_token(token: str) -> Optional[Auth0User]:
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE or not JWKS:
        return {"sub": "dev-user", "dev": True}
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        key = None
        for k in JWKS.get("keys", []):
            if k.get("kid") == kid:
                key = k
                break
        if key is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Key not found")
        public_key = jwt.construct_rsa_public_key(key)
        payload = jwt.decode(token, public_key, algorithms=ALGORITHMS, audience=AUTH0_AUDIENCE, issuer=f"https://{AUTH0_DOMAIN}/")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(request: Request) -> Auth0User:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = auth.split(" ")[1]
    return _verify_token(token)

async def get_current_user_optional(request: Request) -> Optional[Auth0User]:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        return _verify_token(token)
    except Exception:
        return None
