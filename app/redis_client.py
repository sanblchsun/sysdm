# app/redis_client.py
import asyncio
import redis.asyncio as aioredis
from app.config import settings
from loguru import logger
from tenacity import retry, wait_exponential, stop_after_attempt, AsyncRetrying

redis_client: aioredis.Redis | None = None
_redis_lock: asyncio.Lock = asyncio.Lock()


async def get_redis() -> aioredis.Redis:
    """Get Redis client with retry logic for connection failures"""
    global redis_client
    if redis_client is None:
        async with _redis_lock:
            if redis_client is None:
                # Retry logic: exponential backoff on connection failure
                async for attempt in AsyncRetrying(
                    wait=wait_exponential(multiplier=1, min=1, max=10),
                    stop=stop_after_attempt(3)
):
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
                        break
                    except Exception as e:
                        logger.warning(f"[redis] Connection attempt {attempt.retry_number} failed: {e}")
                        if attempt.retry_number >= 3:
                            logger.error(f"[redis] Failed to connect after 3 attempts: {e}")
                            raise
                        await asyncio.sleep(1)
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
