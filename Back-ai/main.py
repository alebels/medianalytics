import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from controllers.controller import AI_ROUTER
from services.shared_data import SHARED_STORE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI service")
    await SHARED_STORE.load()
    yield
    logger.info("Shutting down AI service")


# Create the FastAPI app with the lifespan context manager.
app = FastAPI(
    lifespan=lifespan,
    title="Medianalytics AI",
    version="1.0.0"
)


# Include the router from the controller
app.include_router(AI_ROUTER)