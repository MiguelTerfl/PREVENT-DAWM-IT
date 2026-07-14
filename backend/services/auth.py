import os
from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[dict]:
    """
    Validates a Supabase JWT and returns the user payload.
    Returns None when no token is present (allows unauthenticated dev/test access).
    Raises 401 when a token is present but invalid.
    """
    if credentials is None:
        return None

    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return {
            "user_id": payload["sub"],
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


def require_auth(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that requires a valid JWT. Use on endpoints that must be protected."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return current_user
