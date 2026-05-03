from contextlib import asynccontextmanager
from fastapi import FastAPI
from controllers.controller import AI_ROUTER


# Define lifespan to manage startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AI service")
    yield
    # Shutdown
    print("Shutting down AI service")


# Create the FastAPI app with the lifespan context manager.
app = FastAPI(
    lifespan=lifespan,
    title="Medianalytics AI",
    version="1.0.0"
)


# Include the router from the controller
app.include_router(AI_ROUTER)