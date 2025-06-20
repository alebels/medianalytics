from slowapi import Limiter
from slowapi.util import get_remote_address


def get_client_ip(request):
    """
    Get the real client IP, considering Cloudflare headers and proxies.
    Priority: CF-Connecting-IP > X-Forwarded-For > X-Real-IP > remote_addr
    """
    try:
        # Cloudflare's connecting IP (most reliable for your setup)
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip
        
        # Standard forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return get_remote_address(request)
    except Exception:
        # Fallback to remote address if any error occurs
        return get_remote_address(request)


LIMITER = Limiter(key_func=get_client_ip)