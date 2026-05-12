# app/redis_client.py
import asyncio
import redis.asyncio as aioredis
from app.config import settings

redis_client: aioredis.Redis | None = None
_redis_lock: asyncio.Lock = asyncio.Lock()


async def get_redis() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        async with _redis_lock:
            if redis_client is None:
                redis_client = aioredis.from_url(
                    f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                    decode_responses=True,
                )
                await redis_client.ping()
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
