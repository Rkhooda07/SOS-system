from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
import app.models.signal # Ensure models are loaded for init_db

from app.routes.signals import router as signals_router
from app.routes.websocket import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables if they don't exist
    await init_db()
    yield

app = FastAPI(
    title="Lifeline SOS API",
    description="Real-time SOS signal tracking backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals_router)
app.include_router(ws_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Lifeline SOS Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.app_host, port=settings.app_port)
