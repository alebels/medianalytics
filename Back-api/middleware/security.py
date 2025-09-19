"""
Security middleware for additional protection
"""
import time
import logging
from typing import Set
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Custom security middleware for additional protection:
    - Request size limits
    - Request timeout protection
    - Suspicious pattern detection
    - Request ID generation
    """
    
    def __init__(self, app, max_request_size: int = 10 * 1024 * 1024):  # 10MB
        super().__init__(app)
        self.max_request_size = max_request_size
        self.suspicious_patterns: Set[str] = {
            'union', 'select', 'drop', 'delete', 'insert', 'update',
            '<script', 'javascript:', 'eval(', 'alert(',
            '../', '..\\', '/etc/', '/proc/', '/var/',
            'cmd', 'powershell', 'bash', 'sh'
        }
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Generate request ID
        request_id = f"{int(time.time())}-{hash(str(request.url))}"
        
        try:
            # Check request size
            if hasattr(request, 'content_length') and request.content_length:
                if request.content_length > self.max_request_size:
                    logger.warning(f"Request too large: {request.content_length} bytes from {request.client.host}")
                    return JSONResponse(
                        content={"error": "Request too large"}, 
                        status_code=413
                    )
            
            # Check for suspicious patterns in URL and query params
            url_str = str(request.url).lower()
            if any(pattern in url_str for pattern in self.suspicious_patterns):
                logger.warning(f"Suspicious request pattern detected: {request.url} from {request.client.host}")
                return JSONResponse(
                    content={"error": "Invalid request"}, 
                    status_code=400
                )
              # Process request
            response = await call_next(request)
            
            # Add comprehensive security headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = str(round((time.time() - start_time) * 1000, 2))
            
            # Rate limiting feedback
            if hasattr(request.state, 'rate_limit_remaining'):
                response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
            
            # Log slow requests
            processing_time = time.time() - start_time
            if processing_time > 6.0:  # 6 seconds
                logger.warning(f"Slow request: {processing_time:.2f}s for {request.url}")
            
            return response
            
        except Exception as e:
            logger.error(f"Security middleware error: {e}", exc_info=True)
            return JSONResponse(
                content={"error": "Internal server error"}, 
                status_code=500
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests for monitoring and security analysis
    """
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log incoming request
        logger.info(f"Request: {request.method} {request.url} from {request.client.host}")
        
        response = await call_next(request)
        
        # Log response
        processing_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} in {processing_time:.2f}s")
        
        return response
