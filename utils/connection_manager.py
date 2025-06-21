# connection_manager.py
import asyncio
import logging
import pickle
from datetime import datetime
from os import getenv
from typing import Any, Dict, List, Optional, Set

import redis.asyncio as redis
from fastapi import WebSocket
from fastapi.websockets import WebSocketState
from models import SessionLocal, UserConnection
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = getenv("REDIS_URL", "redis://localhost:6379")
CONNECTION_TTL = 3600 * 24  # 24 hours in seconds
HEARTBEAT_INTERVAL = 30  # Seconds between heartbeats
MAX_RECONNECT_DELAY = 300  # Maximum backoff delay for reconnecting in seconds
STALE_CONNECTION_THRESHOLD = HEARTBEAT_INTERVAL * 3  # Consider stale after 3 missed heartbeats

class ConnectionManager:
    """Enhanced connection manager with persistent storage, automatic reconnection, and failover."""
    
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        self.redis: Optional[redis.Redis] = None
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}
        self._redis_initialized = False
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize the connection manager and start background tasks"""
        await self.init_redis()
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        
    async def close(self):
        """Clean up resources and stop background tasks"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        if self.redis:
            await self.redis.close()
        
        # Cancel all heartbeat tasks
        for task in self.heartbeat_tasks.values():
            task.cancel()
        
    async def init_redis(self):
        """Initialize Redis connection asynchronously with retry logic"""
        if not self._redis_initialized:
            async with self._lock:
                if not self._redis_initialized:
                    try:
                        self.redis = redis.from_url(
                            REDIS_URL,
                            decode_responses=False,
                            socket_connect_timeout=5,
                            socket_keepalive=True
                        )
                        await self.redis.ping()
                        logger.info("✅ Redis connection established")
                        self._redis_initialized = True
                    except (RedisConnectionError, Exception) as e:
                        logger.error(f"❌ Redis connection failed: {e}")
                        self.redis = None
                        self._redis_initialized = True  # Prevent repeated attempts

    async def connect(self, websocket: WebSocket, user_id: str, user_data: dict) -> bool:
        """
        Register new connection with the manager.
        Returns True if connection successful, False otherwise.
        """
        try:
            async with self._lock:
                # Check if user is already connected
                if user_id in self.active_connections:
                    old_conn = self.active_connections[user_id]
                    logger.info(f"⚠️ User {user_id} already has an active connection, replacing it")
                    
                    # Stop existing heartbeat 
                    await self.stop_heartbeat(user_id)
                    
                    # Try to close old connection gracefully
                    try:
                        await old_conn["ws"].close(
                            code=1000,
                            reason="User connected from another device"
                        )
                    except Exception as e:
                        logger.debug(f"Error closing old connection: {e}")
                
                # Store connection in memory
                self.active_connections[user_id] = {
                    "ws": websocket,
                    "connected_at": datetime.utcnow(),
                    "last_seen": datetime.utcnow(),
                    "metadata": user_data,
                }
                
                # Store connection metadata in persistent storage
                await self.save_connection_metadata(user_id, user_data)
                
                # Start heartbeat task
                await self.start_heartbeat(user_id)
                
                logger.info(f"✅ User {user_id} connected")
                return True
                
        except Exception as e:
            logger.error(f"❌ Connection error for user {user_id}: {e}", exc_info=True)
            return False
    
    async def disconnect(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Disconnect and remove user connection but keep metadata for reconnection
        """
        async with self._lock:
            if user_id in self.active_connections:
                # Stop heartbeat task
                await self.stop_heartbeat(user_id)
                
                # Update disconnection time in persistent storage
                await self.update_disconnection_time(user_id)
                
                # Remove from active connections
                conn = self.active_connections.pop(user_id, None)
                logger.info(f"🔌 User {user_id} disconnected")
                
                return conn
            return None
    
    def is_connected(self, user_id: str) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.active_connections
        
    def get_connection(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get connection data for a user if connected"""
        return self.active_connections.get(user_id)
    
    def get_all_connections(self) -> Dict[str, Dict[str, Any]]:
        """Get all active connections"""
        return self.active_connections.copy()
        
    def get_connections_by_role(self, role: str) -> List[str]:
        """Get all user_ids with the specified role"""
        if not role:
            return []
            
        normalized_role = role.lower()
        return [
            user_id for user_id, conn in self.active_connections.items()
            if conn["metadata"].get("role", "").lower() == normalized_role
        ]
    
    async def start_heartbeat(self, user_id: str):
        """Start a heartbeat task for this connection"""
        async with self._lock:
            # Cancel any existing task first
            await self.stop_heartbeat(user_id)
                
            # Create new task
            self.heartbeat_tasks[user_id] = asyncio.create_task(
                self._heartbeat_worker(user_id)
            )
        
    async def stop_heartbeat(self, user_id: str):
        """Stop the heartbeat task for this connection"""
        async with self._lock:
            if user_id in self.heartbeat_tasks:
                task = self.heartbeat_tasks.pop(user_id)
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                    except Exception as e:
                        logger.error(f"Error in heartbeat task cancellation: {e}")
    
    async def _heartbeat_worker(self, user_id: str):
        """Background task to send periodic heartbeats"""
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)
                
                # Only send heartbeat if connection is still active
                if not self.is_connected(user_id):
                    break
                    
                success = await self.send_heartbeat(user_id)
                if not success:
                    break
                    
        except asyncio.CancelledError:
            logger.debug(f"🛑 Heartbeat task cancelled for user {user_id}")
        except Exception as e:
            logger.error(f"❌ Error in heartbeat task for user {user_id}: {e}", exc_info=True)
    
    async def send_heartbeat(self, user_id: str) -> bool:
        """
        Send a heartbeat to check if the connection is still alive
        Returns True if heartbeat successful, False otherwise
        """
        conn = self.get_connection(user_id)
        if not conn:
            return False
            
        try:
            # Send ping message
            await conn["ws"].send_json({
                "type": "ping",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Update last seen timestamp
            async with self._lock:
                if user_id in self.active_connections:
                    self.active_connections[user_id]["last_seen"] = datetime.utcnow()
            return True
            
        except Exception as e:
            logger.warning(f"💔 Heartbeat failed for user {user_id}: {e}")
            await self.disconnect(user_id)
            return False
    
    async def send_message(self, user_id: str, message: dict) -> bool:
        """
        Send a message to a specific user.
        Returns True if sent successfully, False otherwise.
        """
        conn = self.get_connection(user_id)
        if not conn:
            logger.debug(f"⚠️ Cannot send message to disconnected user {user_id}")
            return False

        websocket = conn["ws"]
        
        if websocket.application_state != WebSocketState.CONNECTED:
            logger.warning(f"⚠️ WebSocket for user {user_id} is not connected (state: {websocket.application_state})")
            await self.disconnect(user_id)
            return False

        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send message to user {user_id}: {e}")
            await self.disconnect(user_id)
            return False
    
    async def broadcast(
        self,
        message: dict,
        role: Optional[str] = None,
        user_ids: Optional[List[str]] = None,
        exclude_ids: Optional[List[str]] = None
    ) -> Dict[str, bool]:
        """
        Broadcast a message to multiple users filtered by role and/or user_ids
        Returns a dict of {user_id: success} to track delivery status
        """
        target_users: Set[str] = set()
        results: Dict[str, bool] = {}
        
        # Apply filters
        if role:
            role_users = self.get_connections_by_role(role)
            target_users.update(role_users)
            
        if user_ids:
            target_users.update(str(uid) for uid in user_ids)
        
        if not role and not user_ids:
            # If no filters provided, broadcast to all
            target_users = set(self.active_connections.keys())
        
        # Remove excluded users
        if exclude_ids:
            exclude_set = set(str(uid) for uid in exclude_ids)
            target_users -= exclude_set
        
        # Send messages concurrently
        send_tasks = []
        for user_id in target_users:
            send_tasks.append(self.send_message(user_id, message))
        
        # Gather all results
        success_list = await asyncio.gather(*send_tasks, return_exceptions=True)
        
        # Process results
        for user_id, success in zip(target_users, success_list):
            if isinstance(success, Exception):
                logger.error(f"Error sending to {user_id}: {success}")
                results[user_id] = False
            else:
                results[user_id] = success
        
        return results
    
    async def save_connection_metadata(self, user_id: str, metadata: dict):
        """Save connection metadata to persistent storage"""
        try:
            await self.init_redis()
            
            metadata_copy = {
                k: v for k, v in metadata.items()
                if isinstance(v, (str, int, float, bool, list, dict)) or v is None
            }
            metadata_copy["last_connected"] = datetime.utcnow().isoformat()
            
            if self.redis:
                # Serialize and store with TTL
                await self.redis.setex(
                    f"ws:user:{user_id}",
                    CONNECTION_TTL,
                    pickle.dumps(metadata_copy)
                )
            
            # Save to database
            await self.save_to_database(user_id, metadata_copy)
                
        except Exception as e:
            logger.error(f"❌ Failed to save connection metadata: {e}", exc_info=True)
    
    async def update_disconnection_time(self, user_id: str):
        """Update the disconnection time in persistent storage"""
        try:
            await self.init_redis()
            
            if self.redis:
                # Get existing metadata
                raw_data = await self.redis.get(f"ws:user:{user_id}")
                if raw_data:
                    try:
                        metadata = pickle.loads(raw_data)
                        metadata["last_disconnected"] = datetime.utcnow().isoformat()
                        
                        # Update Redis with new TTL
                        await self.redis.setex(
                            f"ws:user:{user_id}",
                            CONNECTION_TTL,
                            pickle.dumps(metadata)
                        )
                    except (pickle.PickleError, Exception) as e:
                        logger.error(f"❌ Failed to unpickle user metadata: {e}")
            
            # Update in database
            await self.update_disconnection_in_db(user_id)
                
        except Exception as e:
            logger.error(f"❌ Failed to update disconnection time: {e}", exc_info=True)
    
    async def save_to_database(self, user_id: str, metadata: dict):
        """Save connection info to database for long-term persistence"""
        try:
            async with AsyncSession(SessionLocal) as db:
                try:
                    # Check if connection record exists
                    result = await db.execute(
                        select(UserConnection).where(UserConnection.user_id == user_id)
                    conn = result.scalars().first()
                    
                    if conn:
                        # Update existing record
                        conn.last_connected = datetime.utcnow()
                        conn.connection_data = json.dumps(metadata)
                    else:
                        # Create new record
                        conn = UserConnection(
                            user_id=user_id,
                            last_connected=datetime.utcnow(),
                            connection_data=json.dumps(metadata)
                        )
                        db.add(conn)
                    
                    await db.commit()
                except Exception as e:
                    await db.rollback()
                    raise e                
        except Exception as e:
            logger.error(f"❌ Failed to save connection to database: {e}", exc_info=True)
    
    async def update_disconnection_in_db(self, user_id: str):
        """Update disconnection time in database"""
        try:
            async with AsyncSession(SessionLocal) as db:
                try:
                    result = await db.execute(
                        select(UserConnection).where(UserConnection.user_id == user_id))
                    conn = result.scalars().first()
                    
                    if conn:
                        conn.last_disconnected = datetime.utcnow()
                        await db.commit()
                except Exception as e:
                    await db.rollback()
                    raise e
                
        except Exception as e:
            logger.error(f"❌ Failed to update disconnection in database: {e}", exc_info=True)
    
    async def cleanup_stale_connections(self) -> int:
        """Remove connections that haven't had successful heartbeats"""
        stale_threshold = datetime.utcnow() - timedelta(seconds=STALE_CONNECTION_THRESHOLD)
        stale_connections = [
            user_id for user_id, conn in self.active_connections.items()
            if conn.get("last_seen", datetime.min) < stale_threshold
        ]
        
        for user_id in stale_connections:
            logger.warning(f"🧹 Cleaning up stale connection for user {user_id}")
            await self.disconnect(user_id)
            
        return len(stale_connections)

    async def _periodic_cleanup(self):
        """Periodic task to clean up stale connections"""
        while True:
            try:
                num_cleaned = await self.cleanup_stale_connections()
                if num_cleaned > 0:
                    logger.info(f"🧹 Cleaned up {num_cleaned} stale connections")
            except Exception as e:
                logger.error(f"❌ Error in periodic cleanup: {e}", exc_info=True)
            
            await asyncio.sleep(HEARTBEAT_INTERVAL * 2)

# Global instance with initialization
connection_manager = ConnectionManager()