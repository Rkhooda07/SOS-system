from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base

class Signal(Base):
    __tablename__ = "signals"

    id          = Column(Integer, primary_key=True, index=True)
    device_id   = Column(String, index=True, nullable=False)
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)
    status      = Column(String, default="active")   # active | resolved | dismissed
    battery     = Column(Integer, nullable=True)     # battery % from device
    received_at = Column(DateTime(timezone=True), server_default=func.now())
