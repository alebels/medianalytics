import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY
from pydantic import ValidationError

from services.filters import get_sentiments_ideologies_categorized
from utils.limiter import LIMITER
from utils.redis_cache import init_redis_pool, close_redis_pool, get_cache_stats
from controllers.home import HOME_ROUTER
from controllers.filters import FILTERS_ROUTER
from middleware.security import SecurityMiddleware, RequestLoggingMiddleware


# Configure logging at the application entry point.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Define lifespan to manage startup and shutdown events
@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    logger.info("Starting API service")
    get_sentiments_ideologies_categorized()  # Preload sentiments and ideologies categorized
    await init_redis_pool()  # Initialize Redis connection pool
    yield
    # Shutdown
    logger.info("Shutting down API service")
    await close_redis_pool()  # Close Redis connections gracefully


# Create the FastAPI app with the lifespan context manager.
# SECURITY: Disable documentation in production
app = FastAPI(
    lifespan=lifespan,
    title="Medianalytics API",
    version="1.0.5"
)

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Local development
        "https://medianalytics.org",  # Production domain
        "https://www.medianalytics.org"  # Production domain with www
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Added OPTIONS for preflight
    allow_headers=[
        "Accept",
        "Cache-Control",   # Caching control
        "Content-Type",     # Content type
        "X-Requested-With",  # AJAX requests
    ],
    max_age=3600,  # Cache preflight for 1 hour
    expose_headers=["X-Request-ID", "X-Response-Time", "X-RateLimit-Remaining"]
)

# SECURITY: Trusted Host Middleware - only allow specific hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "medianalytics.org", 
        "www.medianalytics.org", 
        "localhost",
        "back-api"
    ]
)

# SECURITY: Custom security middleware
app.add_middleware(SecurityMiddleware)

# REQUEST: Logging middleware for monitoring
app.add_middleware(RequestLoggingMiddleware)

# 1. Compression
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)


app.state.limiter = LIMITER


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    client_host = request.client.host if request.client else "unknown"
    logger.warning(f"Rate limit exceeded for {client_host}: {exc}")
    return JSONResponse(
        content={"error": "Too many requests. Please try again later."},
        status_code=429,
        headers={"Retry-After": "60"}
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    client_host = request.client.host if request.client else "unknown"
    logger.warning(f"Validation error for {client_host}: {exc}")
    return JSONResponse(
        content={"error": "Invalid request data", "details": exc.errors()},
        status_code=HTTP_422_UNPROCESSABLE_ENTITY
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Don't log 404s as they're expected
    if exc.status_code != 404:
        client_host = request.client.host if request.client else "unknown"
        logger.warning(f"HTTP exception for {client_host}: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        content={"error": exc.detail},
        status_code=exc.status_code
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    client_host = request.client.host if request.client else "unknown"
    logger.error(f"Unhandled exception for {client_host}: {exc}", exc_info=True)
    return JSONResponse(
        content={"error": "Internal server error"},
        status_code=500
    )


# Include the router from the controllers.
app.include_router(HOME_ROUTER)
app.include_router(FILTERS_ROUTER)


# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    cache_stats = await get_cache_stats()
    return {
        "status": "healthy",
        "service": "back-api",
        "cache": cache_stats
    }
