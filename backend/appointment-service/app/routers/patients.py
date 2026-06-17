from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import CurrentUser, get_current_user
from ..schemas import PatientProfileCreate, PatientProfileOut

router = APIRouter(tags=["patients"])

_NOT_IMPLEMENTED = "Not implemented in scaffold"


@router.post("/patients", response_model=PatientProfileOut, status_code=status.HTTP_201_CREATED)
async def create_patient_profile(
    payload: PatientProfileCreate,
    user: CurrentUser = Depends(get_current_user),
) -> PatientProfileOut:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.get("/patients", response_model=list[PatientProfileOut])
async def list_patient_profiles(
    user: CurrentUser = Depends(get_current_user),
) -> list[PatientProfileOut]:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)
