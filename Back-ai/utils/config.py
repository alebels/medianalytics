import os
import httpx

API_KEY = os.getenv("API_KEY")
MAX_CONNECTIONS = int(os.getenv("MAX_CONNECTIONS"))
MAX_KEEPALIVE_CONNECTIONS = int(os.getenv("MAX_KEEPALIVE_CONNECTIONS"))
GOOGLE_AI_API_URL = os.getenv("GOOGLE_AI_API_URL")
CONNECTION_TIMEOUT = int(os.getenv("CONNECTION_TIMEOUT"))
READ_TIMEOUT = int(os.getenv("READ_TIMEOUT"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() in ("true", "1", "yes")


def create_secure_client():
    """
    Create a secure HTTP client with proper security settings
    
    Args:
        api_key: Optional API key for authentication
        
    Returns:
        An httpx client configured with security settings
    """
    limits = httpx.Limits(
        max_connections=MAX_CONNECTIONS,
        max_keepalive_connections=MAX_KEEPALIVE_CONNECTIONS
    )
    
    # Use a simpler timeout approach that works with all HTTPX versions
    timeout = CONNECTION_TIMEOUT
    
    headers = {}
    headers["Authorization"] = f"Bearer {API_KEY}"
    
    return httpx.Client(
        base_url=f"{GOOGLE_AI_API_URL}",
        verify=VERIFY_SSL,
        timeout=timeout,
        limits=limits,
        headers=headers,
        follow_redirects=True
    )


def create_async_secure_client(api_key: str = None):
    """
    Create a secure async HTTP client with proper security settings
    
    Args:
        api_key: Optional API key for authentication
        
    Returns:
        An async httpx client configured with security settings
    """
    limits = httpx.Limits(
        max_connections=MAX_CONNECTIONS,
        max_keepalive_connections=MAX_KEEPALIVE_CONNECTIONS
    )
    
    # Use a simpler timeout approach that works with all HTTPX versions
    timeout = CONNECTION_TIMEOUT
    
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    return httpx.AsyncClient(
        base_url=f"{GOOGLE_AI_API_URL}",
        verify=VERIFY_SSL,
        timeout=timeout,
        limits=limits,
        headers=headers,
        follow_redirects=True
    )