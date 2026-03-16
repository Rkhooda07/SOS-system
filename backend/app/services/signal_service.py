from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.signal import Signal
from app.schemas.signal import SignalCreate
from app.core.ws_manager import ws_manager

async def save_signal(db: AsyncSession, payload: SignalCreate) -> Signal:
    signal = Signal(**payload.model_dump())
    db.add(signal)
    await db.commit()
    await db.refresh(signal)
    return signal

async def broadcast_signal(signal: Signal):
    """After saving, push to all WebSocket clients."""
    await ws_manager.broadcast({
        "event":      "sos_signal",
        "id":         signal.id,
        "device_id":  signal.device_id,
        "latitude":   signal.latitude,
        "longitude":  signal.longitude,
        "status":     signal.status,
        "battery":    signal.battery,
        "received_at": signal.received_at.isoformat(),
    })

async def get_signals(db: AsyncSession, limit: int = 50) -> list[Signal]:
    result = await db.execute(
        select(Signal).order_by(desc(Signal.received_at)).limit(limit)
    )
    return result.scalars().all()

async def get_latest_signal(db: AsyncSession, device_id: str) -> Signal | None:
    result = await db.execute(
        select(Signal)
        .where(Signal.device_id == device_id)
        .order_by(desc(Signal.received_at))
        .limit(1)
    )
    return result.scalar_one_or_none()
