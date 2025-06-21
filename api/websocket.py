# websocket.py
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy.future import select

from models import get_async_db_session
from models.user import User
from utils.connection_manager import connection_manager, HEARTBEAT_INTERVAL
from utils.security import get_current_user_from_token

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.on_event("startup")
async def startup_event():
    """Initialize connection manager on startup"""
    await connection_manager.initialize()

@router.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    await connection_manager.close()

@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications with enhanced error handling"""
    user_id = None
    
    try:
        await websocket.accept()
        
        # Get and validate token
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Authentication token missing"
            )
            return
        
        # Verify token and get user
        try:
            user = get_current_user_from_token(token=token)
            if not user:
                await websocket.close(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Invalid authentication token"
                )
                return
                
            user_id = str(user["id"])
            
            async with get_async_db_session() as db:
                # Get essential user info in one query
                result = await db.execute(
                    select(
                        User.role,
                        User.notifications_enabled,
                        User.username,
                        User.email
                    ).where(User.id == user_id)
                )
                user_info = result.first()
                
                if not user_info:
                    await websocket.close(
                        code=status.WS_1008_POLICY_VIOLATION,
                        reason="User not found"
                    )
                    return
                
                role, notifications_enabled, username, email = user_info
                
                # Prepare comprehensive user metadata
                user_data = {
                    "user_id": user_id,
                    "role": role,
                    "username": username,
                    "email": email,
                    "notifications_enabled": notifications_enabled,
                    "status": "online",
                    "connected_at": datetime.utcnow().isoformat(),
                    "muted_conversations": [],
                    "preferences": {}
                }

                # Connect using the connection manager
                success = await connection_manager.connect(websocket, user_id, user_data)
                if not success:
                    await websocket.close(
                        code=status.WS_1011_INTERNAL_ERROR,
                        reason="Connection manager error"
                    )
                    return
                
                # Main message loop
                while True:
                    try:
                        data = await asyncio.wait_for(
                            websocket.receive_text(),
                            timeout=HEARTBEAT_INTERVAL * 5  # Prevent hanging
                        )
                        # Process incoming messages if needed
                        logger.debug(f"Received message from {user_id}: {data}")
                        
                    except asyncio.TimeoutError:
                        # No activity, but connection still alive
                        continue
                        
        except ValueError as ve:
            logger.error(f"Authentication error for user {user_id}: {ve}")
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Authentication failed"
            )
            return
    
    except WebSocketDisconnect as wsd:
        logger.info(f"WebSocket disconnected (user_id: {user_id or 'unknown'}, code: {wsd.code})")
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket for user {user_id or 'unknown'}: {e}")
    finally:
        # Ensure proper cleanup
        if user_id:
            await connection_manager.disconnect(user_id)

@router.get("/ws/livreurs", response_model=Dict[str, Any])
async def get_livreurs() -> Dict[str, Any]:
    """
    Returns a dictionary of connected delivery drivers with enhanced metadata.
    Uses async database operations for consistency.
    """
    try:
        result = {}
        deliver_connections = connection_manager.get_connections_by_role('deliver')

        async with get_async_db_session() as db:
            for user_id in deliver_connections:
                conn = connection_manager.get_connection(user_id)
                if conn:
                    metadata = conn.get("metadata", {})
                    
                    # Get additional user data from database
                    user_result = await db.execute(
                        select(User.email, User.phone).where(User.id == user_id))
                    user_data = user_result.first()
                    
                    result[user_id] = {
                        "user_id": user_id,
                        "username": metadata.get("username"),
                        "email": user_data.email if user_data else None,
                        "phone": user_data.phone if user_data else None,
                        "role": metadata.get("role"),
                        "notifications_enabled": metadata.get("notifications_enabled"),
                        "status": metadata.get("status", "online"),
                        "last_seen": conn.get("last_seen", datetime.utcnow()).isoformat(),
                        "connected_since": conn.get("connected_at").isoformat()
                            if conn.get("connected_at") else None
                    }

        return {
            "success": True,
            "data": result,
            "count": len(result),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in get_livreurs: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }