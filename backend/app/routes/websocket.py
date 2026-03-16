from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.ws_manager import ws_manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/sos/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    Frontend connects here. Backend pushes every SOS signal as JSON.
    Connection stays alive until browser closes or disconnects.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive — we don't expect messages FROM the client
            # but we listen so we detect disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
