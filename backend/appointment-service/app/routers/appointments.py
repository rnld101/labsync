import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import CurrentUser, get_current_user, require_roles
from ..redis_client import acquire_slot_lock, release_slot_lock
from ..schemas import AppointmentCreate, AppointmentOut

router = APIRouter(tags=["appointments"])

_NOT_IMPLEMENTED = "Not implemented in scaffold"
require_staff = require_roles("LAB_STAFF", "LAB_ADMIN")


@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: AppointmentCreate,
    user: CurrentUser = Depends(get_current_user),
) -> AppointmentOut:
    """Book a slot. Demonstrates the Redis slot-lock; persistence is filled in later."""
    slot_key = f"{payload.appointment_date}T{payload.time_slot}"
    if not await acquire_slot_lock(slot_key):
        raise HTTPException(status.HTTP_409_CONFLICT, "Slot is being booked by another request")
    try:
        # TODO(impl): insert appointment + appointment_test_mapping rows (snapshot
        # price_at_booking from lab_tests.base_cost), then publish an 'appointment.booked'
        # event to SQS for notification-service.
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)
    finally:
        await release_slot_lock(slot_key)


@router.get("/appointments", response_model=list[AppointmentOut])
async def list_my_appointments(
    user: CurrentUser = Depends(get_current_user),
) -> list[AppointmentOut]:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.patch("/appointments/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: uuid.UUID,
    _staff: CurrentUser = Depends(require_staff),
) -> dict[str, str]:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)
