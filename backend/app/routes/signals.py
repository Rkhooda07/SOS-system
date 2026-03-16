from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.signal import SignalCreate, SignalResponse, SignalUpdate
from app.services.signal_service import (
    save_signal, broadcast_signal, get_signals, get_latest_signal, update_signal_status
)

router = APIRouter(prefix="/api/sos", tags=["SOS Signals"])

@router.patch("/signal/{signal_id}", response_model=SignalResponse)
async def patch_signal(signal_id: int, payload: SignalUpdate, db: AsyncSession = Depends(get_db)):
    """Mark a signal as resolved or dismissed."""
    signal = await update_signal_status(db, signal_id, payload)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal

@router.post("/signal", response_model=SignalResponse, status_code=201)
async def receive_signal(payload: SignalCreate, db: AsyncSession = Depends(get_db)):
    """
    Called by the LoRa bridge script whenever the hardware button is pressed.
    Saves the GPS coordinates and broadcasts to all WebSocket clients.
    """
    signal = await save_signal(db, payload)
    await broadcast_signal(signal)       # ← real-time push to frontend
    return signal

@router.get("/signals", response_model=list[SignalResponse])
async def list_signals(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Return the last N signals (for history panel in the frontend)."""
    return await get_signals(db, limit)

@router.get("/latest/{device_id}", response_model=SignalResponse)
async def latest_signal(device_id: str, db: AsyncSession = Depends(get_db)):
    """Return the most recent signal for a specific device."""
    signal = await get_latest_signal(db, device_id)
    if not signal:
        raise HTTPException(status_code=404, detail="No signal found for device")
    return signal
