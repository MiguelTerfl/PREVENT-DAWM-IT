import os
import json
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.services.supabase_client import get_supabase_client

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[dict]:
    """
    Validates a Supabase JWT and retrieves the user profile details from the database.
    Returns None when no token is present (allows unauthenticated dev/test access).
    Raises 401 when a token is present but invalid.
    """
    if credentials is None:
        return None

    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        return None

    # Resolve signing key (handles standard secrets, PEM public keys, or JWKs)
    key = jwt_secret
    if jwt_secret.strip().startswith("{"):
        try:
            jwk_data = json.loads(jwt_secret)
            if "keys" in jwk_data and isinstance(jwk_data["keys"], list) and len(jwk_data["keys"]) > 0:
                key = jwk_data["keys"][0]
            else:
                key = jwk_data
        except Exception as e:
            print(f"Auth Service: Failed to parse JWK JSON: {e}")

    try:
        payload = jwt.decode(
            credentials.credentials,
            key,
            algorithms=["HS256", "ES256"],
            audience="authenticated",
        )


        user_id = payload["sub"]
        
        # Query profiles table in Supabase to fetch user role and details
        supabase = await get_supabase_client()
        res = await supabase.table("profiles").select("role, prevent_id, display_name").eq("id", user_id).execute()
        
        role = "patient"
        prevent_id = None
        display_name = None
        
        if res.data:
            role = res.data[0].get("role") or "patient"
            prevent_id = res.data[0].get("prevent_id")
            display_name = res.data[0].get("display_name")
            
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": role,
            "prevent_id": prevent_id,
            "display_name": display_name,
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )


def require_auth(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that requires a valid JWT. Use on endpoints that must be protected."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    return current_user


def require_role(allowed_roles: List[str]):
    """
    Dependency generator to restrict access to specific database roles.
    Raises 403 Forbidden if user does not have an allowed role.
    """
    def dependency(current_user: dict = Depends(require_auth)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Insufficient permissions."
            )
        return current_user
    return dependency

# Common RBAC dependencies
require_admin = require_role(["admin"])
require_coach = require_role(["health_coach", "admin"])

