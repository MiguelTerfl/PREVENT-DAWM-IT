from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from backend.services.auth import require_coach
from backend.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/coach", tags=["coach"])


class PhysicianResponse(BaseModel):
    id: str
    full_name: str
    email: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None


class PatientHealthStatusResponse(BaseModel):
    readiness_stage: Optional[str] = None
    risk_level: Optional[str] = None


class BiomarkersResponse(BaseModel):
    a1c: Optional[float] = None
    fbs: Optional[float] = None
    bmi: Optional[float] = None
    recorded_at: Optional[str] = None


class PatientDetailResponse(BaseModel):
    prevent_id: str
    nickname: str
    email: str
    last_active: Optional[str] = None
    health_status: Optional[PatientHealthStatusResponse] = None
    latest_biomarkers: Optional[BiomarkersResponse] = None


class AssignPatientRequest(BaseModel):
    patient_id: str
    physician_id: Optional[str] = None  # If null, use the current coach's ID


class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: Optional[str] = None


@router.post("/me", response_model=PhysicianResponse)
async def sync_coach_profile(current_user: dict = Depends(require_coach)):
    """
    Ensures that the authenticated health coach has a record in the physicians table.
    """
    try:
        supabase = await get_supabase_client()
        user_id = current_user["user_id"]
        
        # Check if record exists
        res = await supabase.table("physicians").select("*").eq("id", user_id).execute()
        if res.data:
            p = res.data[0]
            return PhysicianResponse(
                id=p["id"],
                full_name=p["full_name"],
                email=p["email"],
                specialty=p.get("specialty"),
                license_number=p.get("license_number")
            )
            
        # Create record if it does not exist
        full_name = current_user.get("display_name") or current_user.get("email") or "Health Coach"
        email = current_user.get("email") or f"{user_id}@prevent.health"
        
        new_physician = {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "specialty": "Lifestyle & Diabetes Coaching",
            "license_number": f"LC-{user_id[:8].upper()}"
        }
        res_new = await supabase.table("physicians").insert(new_physician).execute()
        if not res_new.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create physician record."
            )
            
        p = res_new.data[0]
        return PhysicianResponse(
            id=p["id"],
            full_name=p["full_name"],
            email=p["email"],
            specialty=p.get("specialty"),
            license_number=p.get("license_number")
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync coach profile: {e}"
        )


@router.get("/patients", response_model=List[PatientDetailResponse])
async def get_assigned_patients(current_user: dict = Depends(require_coach)):
    """
    Retrieves all patients assigned to the currently logged-in coach.
    """
    try:
        supabase = await get_supabase_client()
        physician_id = current_user["user_id"]
        
        # Ensure physician record exists
        await sync_coach_profile(current_user)
        
        # Fetch assignments
        res_assign = await supabase.table("patient_physician_assignments").select("prevent_id").eq("physician_id", physician_id).execute()
        if not res_assign.data:
            return []
            
        prevent_ids = [row["prevent_id"] for row in res_assign.data]
        
        # Fetch patients details
        patients = []
        for pid in prevent_ids:
            p_res = await supabase.table("patients").select("*").eq("prevent_id", pid).execute()
            if not p_res.data:
                continue
            p_data = p_res.data[0]
            
            # Fetch health status
            hs_res = await supabase.table("patient_health_status").select("readiness_stage, risk_level").eq("prevent_id", pid).execute()
            health_status = None
            if hs_res.data:
                health_status = PatientHealthStatusResponse(
                    readiness_stage=hs_res.data[0].get("readiness_stage"),
                    risk_level=hs_res.data[0].get("risk_level")
                )
                
            # Fetch latest biomarkers
            bio_res = await supabase.table("biomarker_logs").select("a1c, fbs, bmi, recorded_at").eq("prevent_id", pid).order("recorded_at", desc=True).limit(1).execute()
            latest_biomarkers = None
            if bio_res.data:
                latest_biomarkers = BiomarkersResponse(
                    a1c=bio_res.data[0].get("a1c"),
                    fbs=bio_res.data[0].get("fbs"),
                    bmi=bio_res.data[0].get("bmi"),
                    recorded_at=bio_res.data[0].get("recorded_at")
                )
                
            patients.append(PatientDetailResponse(
                prevent_id=pid,
                nickname=p_data["nickname"],
                email=p_data["email"],
                last_active=p_data.get("last_active"),
                health_status=health_status,
                latest_biomarkers=latest_biomarkers
            ))
            
        return patients
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load assigned patients: {e}"
        )


@router.get("/patients/all", response_model=List[PatientDetailResponse])
async def get_all_patients(current_user: dict = Depends(require_coach)):
    """
    Lists all patients in the system to enable self-assignment.
    """
    try:
        supabase = await get_supabase_client()
        res_patients = await supabase.table("patients").select("*").execute()
        
        patients = []
        for p_data in res_patients.data or []:
            pid = p_data["prevent_id"]
            
            # Fetch health status
            hs_res = await supabase.table("patient_health_status").select("readiness_stage, risk_level").eq("prevent_id", pid).execute()
            health_status = None
            if hs_res.data:
                health_status = PatientHealthStatusResponse(
                    readiness_stage=hs_res.data[0].get("readiness_stage"),
                    risk_level=hs_res.data[0].get("risk_level")
                )
                
            # Fetch latest biomarkers
            bio_res = await supabase.table("biomarker_logs").select("a1c, fbs, bmi, recorded_at").eq("prevent_id", pid).order("recorded_at", desc=True).limit(1).execute()
            latest_biomarkers = None
            if bio_res.data:
                latest_biomarkers = BiomarkersResponse(
                    a1c=bio_res.data[0].get("a1c"),
                    fbs=bio_res.data[0].get("fbs"),
                    bmi=bio_res.data[0].get("bmi"),
                    recorded_at=bio_res.data[0].get("recorded_at")
                )
                
            patients.append(PatientDetailResponse(
                prevent_id=pid,
                nickname=p_data["nickname"],
                email=p_data["email"],
                last_active=p_data.get("last_active"),
                health_status=health_status,
                latest_biomarkers=latest_biomarkers
            ))
            
        return patients
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load patient registry: {e}"
        )


@router.post("/assign")
async def assign_patient_to_coach(body: AssignPatientRequest, current_user: dict = Depends(require_coach)):
    """
    Assigns a patient to a coach's care roster.
    """
    try:
        supabase = await get_supabase_client()
        physician_id = body.physician_id or current_user["user_id"]
        
        # Verify physician exists
        p_chk = await supabase.table("physicians").select("id").eq("id", physician_id).execute()
        if not p_chk.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Physician with ID {physician_id} does not exist."
            )
            
        # Verify patient exists
        pat_chk = await supabase.table("patients").select("prevent_id").eq("prevent_id", body.patient_id).execute()
        if not pat_chk.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {body.patient_id} does not exist."
            )
            
        # Check if already assigned
        chk = await supabase.table("patient_physician_assignments") \
            .select("id") \
            .eq("prevent_id", body.patient_id) \
            .eq("physician_id", physician_id) \
            .execute()
            
        if chk.data:
            return {"status": "success", "message": "Patient is already assigned to this coach."}
            
        # Create assignment
        new_assignment = {
            "prevent_id": body.patient_id,
            "physician_id": physician_id,
            "role": "Primary"
        }
        res = await supabase.table("patient_physician_assignments").insert(new_assignment).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create assignment record."
            )
            
        return {"status": "success", "message": "Patient successfully assigned to health coach roster."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign patient: {e}"
        )


@router.get("/patient/{prevent_id}/history", response_model=List[MessageResponse])
async def get_patient_chat_history(prevent_id: str, current_user: dict = Depends(require_coach)):
    """
    Retrieves conversational message history for a specific patient.
    """
    try:
        supabase = await get_supabase_client()
        res = await supabase.table("messages").select("role, content, created_at").eq("prevent_id", prevent_id).order("created_at").execute()
        
        messages = []
        for m in res.data or []:
            messages.append(MessageResponse(
                role=m["role"],
                content=m["content"],
                created_at=m.get("created_at")
            ))
        return messages
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load patient history: {e}"
        )


@router.get("/patient/{prevent_id}/vitals", response_model=List[BiomarkersResponse])
async def get_patient_vitals_history(prevent_id: str, current_user: dict = Depends(require_coach)):
    """
    Retrieves full biomarker logs history for a specific patient.
    """
    try:
        supabase = await get_supabase_client()
        res = await supabase.table("biomarker_logs").select("a1c, fbs, bmi, recorded_at").eq("prevent_id", prevent_id).order("recorded_at", desc=True).execute()
        
        logs = []
        for r in res.data or []:
            logs.append(BiomarkersResponse(
                a1c=r.get("a1c"),
                fbs=r.get("fbs"),
                bmi=r.get("bmi"),
                recorded_at=r.get("recorded_at")
            ))
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load patient vitals history: {e}"
        )
