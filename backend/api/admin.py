from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from pydantic import BaseModel
from backend.services.auth import require_admin
from backend.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AgentConfig(BaseModel):
    name: str
    description: str
    status: str


class ConversationLog(BaseModel):
    user_id: str
    message_count: int
    last_active: str


class UserProfileResponse(BaseModel):
    id: str
    role: str
    prevent_id: Optional[str] = None
    display_name: Optional[str] = None
    created_at: Optional[str] = None
    email: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str


@router.get("/agents", response_model=List[AgentConfig])
async def get_agents(current_user: dict = Depends(require_admin)):
    """
    Returns list of AI agents configured in the system.
    """
    return [
        AgentConfig(name="Intake Agent", description="Handles patient onboarding and profile creation", status="Active"),
        AgentConfig(name="Motivation Agent", description="Assesses readiness for change and intrinsic motivators", status="Active"),
        AgentConfig(name="Education Agent", description="Delivers clinical diabetes prevention info", status="Active"),
        AgentConfig(name="Coaching Agent", description="Assists with setting behavior goals and lifestyle changes", status="Active"),
    ]


@router.get("/conversations", response_model=List[ConversationLog])
async def get_conversations(current_user: dict = Depends(require_admin)):
    """
    Queries actual patients and message logs from Supabase.
    """
    try:
        supabase = await get_supabase_client()
        
        # 1. Fetch patients
        res_patients = await supabase.table("patients").select("prevent_id, nickname, last_active").execute()
        if not res_patients.data:
            return []
            
        logs = []
        for p in res_patients.data:
            prevent_id = p["prevent_id"]
            
            # 2. Count messages for this patient
            res_msgs = await supabase.table("messages").select("id", count="exact").eq("prevent_id", prevent_id).execute()
            message_count = res_msgs.count if res_msgs.count is not None else len(res_msgs.data or [])
            
            logs.append(ConversationLog(
                user_id=p["nickname"] or str(prevent_id),
                message_count=message_count,
                last_active=p.get("last_active") or "Unknown"
            ))
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation logs: {e}"
        )


@router.get("/users", response_model=List[UserProfileResponse])
async def get_users(current_user: dict = Depends(require_admin)):
    """
    Returns all registered user profiles.
    """
    try:
        supabase = await get_supabase_client()
        res = await supabase.table("profiles").select("*").execute()
        
        # For simplicity in this demo environment, we assume emails can be fetched
        # from profiles or fallback placeholders.
        users = []
        for row in res.data or []:
            users.append(UserProfileResponse(
                id=row["id"],
                role=row["role"],
                prevent_id=row.get("prevent_id"),
                display_name=row.get("display_name"),
                created_at=row.get("created_at"),
                email=f"{row.get('display_name', 'user').lower()}@prevent.health"  # Fallback format
            ))
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {e}"
        )


@router.post("/users/{user_id}/role")
async def update_user_role(user_id: str, body: UpdateRoleRequest, current_user: dict = Depends(require_admin)):
    """
    Updates the role of a specific user.
    Allowed roles: 'patient', 'health_coach', 'admin'
    """
    allowed_roles = ["patient", "health_coach", "admin"]
    if body.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {allowed_roles}"
        )
        
    try:
        supabase = await get_supabase_client()
        res = await supabase.table("profiles").update({"role": body.role}).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found."
            )
        return {"status": "success", "message": f"User role updated to {body.role}."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user role: {e}"
        )

