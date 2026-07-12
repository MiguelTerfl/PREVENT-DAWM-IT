from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.services.auth import require_auth
from backend.services.persistence import AsyncPersistence

router = APIRouter(prefix="/api/profile", tags=["profile"])
_persistence = AsyncPersistence()


class CompleteOnboardingRequest(BaseModel):
    name: str


@router.get("/onboarding-status")
async def onboarding_status(current_user: dict = Depends(require_auth)):
    completed = await _persistence.get_onboarding_status(current_user["user_id"])
    return {"onboarding_completed": completed}


@router.post("/complete-onboarding")
async def complete_onboarding(body: CompleteOnboardingRequest, current_user: dict = Depends(require_auth)):
    await _persistence.complete_onboarding(current_user["user_id"], body.name)
    return {"status": "ok"}
