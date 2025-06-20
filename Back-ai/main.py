from contextlib import asynccontextmanager
from fastapi import FastAPI
from controllers.controller import AI_ROUTER
from utils.config import create_async_secure_client
from services.ai_core import client


# Define lifespan to manage startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AI service")
    
    # For backward compatibility, also keep in app state
    app.state.client = client
    app.state.async_client = create_async_secure_client()
    print("Secure client for Google AI API initialized")
    
    yield
    
    # Shutdown
    if hasattr(app.state, "async_client"):
        await app.state.async_client.aclose()
    print("Shutting down AI service")


# Create the FastAPI app with the lifespan context manager.
app = FastAPI(
    lifespan=lifespan,
    title="Medianalytics AI",
    version="1.0.0"
)


# Include the router from the controller
app.include_router(AI_ROUTER)