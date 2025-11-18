"""
Redis caching utilities for Back-API.

Provides async Redis client with graceful fallback, caching decorators,
and cache management functionality.
"""

import logging
import json
import hashlib
from typing import Optional, Callable, Any
from functools import wraps
import asyncio

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool
from redis.exceptions import RedisError, ConnectionError, TimeoutError
from fastapi import Request

logger = logging.getLogger(__name__)

# Global Redis connection pool
_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[redis.Redis] = None

# Cache statistics
_cache_stats = {
    "hits": 0,
    "misses": 0,
    "errors": 0
}


async def init_redis_pool(host: str = "redis", port: int = 6379, max_connections: int = 50) -> None:
    """
    Initialize Redis connection pool with retry logic.
    
    Args:
        host: Redis host (default: "redis" for Docker network)
        port: Redis port (default: 6379)
        max_connections: Maximum pool connections
    """
    global _redis_pool, _redis_client
    
    try:
        _redis_pool = ConnectionPool(
            host=host,
            port=port,
            db=0,
            max_connections=max_connections,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        _redis_client = redis.Redis(connection_pool=_redis_pool)
        
        # Test connection with retry
        for attempt in range(3):
            try:
                await _redis_client.ping()
                logger.info(f"✅ Redis connected successfully at {host}:{port}")
                return
            except (ConnectionError, TimeoutError) as e:
                if attempt < 2:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Redis connection attempt {attempt + 1} failed, retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    raise
                    
    except Exception as e:
        logger.error(f"❌ Failed to initialize Redis: {e}")
        logger.warning("⚠️ API will run without caching (graceful fallback)")
        _redis_client = None


async def close_redis_pool() -> None:
    """Close Redis connection pool gracefully."""
    global _redis_pool, _redis_client
    
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
    
    if _redis_pool:
        try:
            await _redis_pool.disconnect()
            logger.info("Redis pool disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting Redis pool: {e}")
    
    _redis_client = None
    _redis_pool = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance or None if unavailable."""
    return _redis_client


async def is_redis_available() -> bool:
    """Check if Redis is available and responding."""
    if not _redis_client:
        return False
    
    try:
        await _redis_client.ping()
        return True
    except Exception:
        return False


def _generate_cache_key(key_prefix: str, request: Request) -> str:
    """
    Generate cache key from prefix and request parameters.
    
    Args:
        key_prefix: Base key prefix (e.g., "v1:home:generaltable")
        request: FastAPI request object
        
    Returns:
        Complete cache key
    """
    # Include query parameters in cache key
    query_string = str(sorted(request.query_params.items()))
    if query_string:
        # Hash query string to keep keys manageable
        query_hash = hashlib.md5(query_string.encode()).hexdigest()[:8]
        return f"cache:v2:{key_prefix}:{query_hash}"  # v2 to invalidate old bad cache
    
    return f"cache:v2:{key_prefix}"  # v2 to invalidate old bad cache


def cache_response(key_prefix: str, ttl: int = 93600):
    """
    Decorator to cache endpoint responses in Redis with graceful fallback.
    
    Args:
        key_prefix: Cache key prefix (e.g., "v1:home:generaltable")
        ttl: Time-to-live in seconds (default: 93600 = 26 hours)
        
    Usage:
        @cache_response(key_prefix="v1:home:generaltable", ttl=86400)
        async def get_general_table(request: Request, db: AsyncSession):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Extract request from args/kwargs
            request: Optional[Request] = kwargs.get('request')
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            # Early return if no request or Redis unavailable
            if not request:
                logger.warning(f"No Request object found for {func.__name__}, skipping cache")
                return await func(*args, **kwargs)
            
            if not _redis_client:
                logger.debug(f"Redis unavailable for {func.__name__}, executing without cache")
                return await func(*args, **kwargs)
            
            cache_key = _generate_cache_key(key_prefix, request)
            
            try:
                # Try to get from cache with timeout protection
                cached_data = await asyncio.wait_for(
                    _redis_client.get(cache_key),
                    timeout=2.0  # 2 second timeout for cache lookup
                )
                
                if cached_data:
                    _cache_stats["hits"] += 1
                    logger.debug(f"✅ Cache HIT: {cache_key}")
                    return json.loads(cached_data)
                
                # Cache miss - execute function
                _cache_stats["misses"] += 1
                logger.debug(f"❌ Cache MISS: {cache_key}")
                
            except (RedisError, asyncio.TimeoutError, ConnectionError) as e:
                _cache_stats["errors"] += 1
                logger.warning(f"Redis error on GET {cache_key}: {e}, falling back to DB")
            
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # Try to cache the result
            if _redis_client and result is not None:
                try:
                    # Convert Pydantic models to dicts before JSON serialization
                    if isinstance(result, list):
                        serializable = [
                            item.model_dump() if hasattr(item, 'model_dump') else item
                            for item in result
                        ]
                    elif hasattr(result, 'model_dump'):
                        serializable = result.model_dump()
                    else:
                        serializable = result
                    
                    serialized = json.dumps(serializable, default=str)
                    await _redis_client.setex(cache_key, ttl, serialized)
                    logger.debug(f"Cached: {cache_key} (TTL: {ttl}s)")
                except (RedisError, TypeError, ValueError) as e:
                    logger.warning(f"Failed to cache {cache_key}: {e}")
            
            return result
        
        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "cache:v1:home:*")
        
    Returns:
        Number of keys deleted
    """
    if not _redis_client:
        logger.warning("Redis unavailable, cannot invalidate cache")
        return 0
    
    try:
        keys = []
        async for key in _redis_client.scan_iter(match=pattern, count=100):
            keys.append(key)
        
        if keys:
            deleted = await _redis_client.delete(*keys)
            logger.info(f"Invalidated {deleted} cache keys matching '{pattern}'")
            return deleted
        else:
            logger.info(f"No cache keys found matching '{pattern}'")
            return 0
            
    except RedisError as e:
        logger.error(f"Error invalidating cache pattern '{pattern}': {e}")
        return 0


async def get_cache_stats() -> dict:
    """
    Get cache statistics including hit rate and memory usage.
    
    Returns:
        Dictionary with cache statistics
    """
    stats = {
        "available": await is_redis_available(),
        "hits": _cache_stats["hits"],
        "misses": _cache_stats["misses"],
        "errors": _cache_stats["errors"],
        "hit_rate": 0.0,
        "total_requests": 0,
        "keys_count": 0,
        "memory_used_bytes": 0,
        "memory_used_mb": 0.0
    }
    
    total = stats["hits"] + stats["misses"]
    if total > 0:
        stats["hit_rate"] = round((stats["hits"] / total) * 100, 2)
        stats["total_requests"] = total
    
    if _redis_client:
        try:
            # Get number of keys
            stats["keys_count"] = await _redis_client.dbsize()
            
            # Get memory usage
            info = await _redis_client.info("memory")
            stats["memory_used_bytes"] = info.get("used_memory", 0)
            stats["memory_used_mb"] = round(stats["memory_used_bytes"] / (1024 * 1024), 2)
            
        except RedisError as e:
            logger.warning(f"Error getting cache stats: {e}")
    
    return stats


async def flush_all_cache() -> bool:
    """
    Flush all cache (use with caution).
    
    Returns:
        True if successful, False otherwise
    """
    if not _redis_client:
        logger.warning("Redis unavailable, cannot flush cache")
        return False
    
    try:
        await _redis_client.flushdb()
        logger.info("All cache flushed")
        return True
    except RedisError as e:
        logger.error(f"Error flushing cache: {e}")
        return False
