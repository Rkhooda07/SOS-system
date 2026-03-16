from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# What the hardware/bridge sends to POST /api/sos/signal
class SignalCreate(BaseModel):
    device_id:  str
    latitude:   float = Field(..., ge=-90,  le=90)
    longitude:  float = Field(..., ge=-180, le=180)
    battery:    Optional[int] = Field(None, ge=0, le=100)

# What we send back in responses
class SignalResponse(BaseModel):
    id:          int
    device_id:   str
    latitude:    float
    longitude:   float
    status:      str
    battery:     Optional[int]
    received_at: datetime

    class Config:
        from_attributes = True

# Minimal payload pushed over WebSocket
class SignalWSPayload(BaseModel):
    id:          int
    device_id:   str
    latitude:    float
    longitude:   float
    status:      str
    received_at: str   # ISO string for JSON serialization
