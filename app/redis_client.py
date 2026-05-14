# app/redis_client.py
import asyncio
import redis.asyncio as aioredis
from app.config import settings
from loguru import logger

redis_client: aioredis.Redis | None = None
_redis_lock: asyncio.Lock = asyncio.Lock()


async def get_redis() -> aioredis.Redis:
    """Get Redis client with retry logic for connection failures"""
    global redis_client
    if redis_client is None:
        async with _redis_lock:
            if redis_client is None:
                # Retry logic: exponential backoff on connection failure
                max_retries = 3
                retry_delay = 1
                
                for attempt in range(1, max_retries + 1):
                    try:
                        redis_client = aioredis.from_url(
                            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                            decode_responses=True,
                            socket_connect_timeout=5,
                            socket_keepalive=True,
                            socket_keepalive_inactivity_timeout=5,
                        )
                        await redis_client.ping()
                        logger.info("[redis] Connected successfully")
                        return redis_client
                    except Exception as e:
                        logger.warning(f"[redis] Connection attempt {attempt}/{max_retries} failed: {e}")
                        if attempt >= max_retries:
                            logger.error(f"[redis] Failed to connect after {max_retries} attempts: {e}")
                            redis_client = None
                            raise
                        # Exponential backoff: 1s, 2s, 4s (min 1, max 10)
                        await asyncio.sleep(min(retry_delay, 10))
                        retry_delay *= 2
    return redis_client


async def close_redis():
    """Close Redis connection gracefully"""
    global redis_client
    if redis_client:
        try:
            await redis_client.close()
            logger.info("[redis] Connection closed")
        except Exception as e:
            logger.error(f"[redis] Error closing connection: {e}")
        finally:
            redis_client = None
