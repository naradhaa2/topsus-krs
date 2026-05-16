import os
import json

_client = None


def _get_client():
    """Lazy singleton — initialised on first call after dotenv is loaded."""
    global _client
    if _client is not None:
        return _client
    url   = os.getenv("UPSTASH_REDIS_REST_URL", "")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
    if url and token:
        try:
            from upstash_redis import Redis
            _client = Redis(url=url, token=token)
        except Exception:
            pass
    return _client


def get_cache(key: str):
    client = _get_client()
    if client is None:
        return None
    try:
        val = client.get(key)
        return json.loads(val) if val is not None else None
    except Exception:
        return None


def set_cache(key: str, value, ttl: int = 300):
    client = _get_client()
    if client is None:
        return
    try:
        client.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass


def delete_cache(key: str):
    client = _get_client()
    if client is None:
        return
    try:
        client.delete(key)
    except Exception:
        pass


def delete_pattern(prefix: str):
    """Delete all keys matching prefix*. Uses KEYS — fine for small datasets."""
    client = _get_client()
    if client is None:
        return
    try:
        keys = client.keys(f"{prefix}*")
        if keys:
            client.delete(*keys)
    except Exception:
        pass
