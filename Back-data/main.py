import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from services.main_service import main_service_main


# Configure logging at the application entry point.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Instantiate AsyncIOScheduler (ideal for async tasks)
scheduler = AsyncIOScheduler()


# --- APScheduler Task ---
async def scheduled_task():
    """Run the async main() method from main_service.py inside the event loop."""
    logger.info("🚀 Starting scheduled task: running main_service.main()")
    try:
        await main_service_main()
        logger.info("✅ Scheduled task completed successfully")
    except Exception as e:
        logger.exception("❌ Error occurred while executing main_service.main(): %s", e)


# Define lifespan to manage startup and shutdown events
@asynccontextmanager
async def lifespan(_: FastAPI):
    # Schedule the task (adjust hour and minute to your intended schedule)
    try:
        if not scheduler.running:  # Prevent double-starting APScheduler
            # Schedule daily task
            scheduler.add_job(
                scheduled_task,
                CronTrigger(hour=16, minute=37, timezone='Europe/Paris'),
                id="daily_main_service_task",
                replace_existing=True,
            )
            
            scheduler.start()
            logger.info("📅 APScheduler started: daily task scheduled at 17:40 Paris time")
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)  # Prevent blocking shutdown
            logger.info("🛑 APScheduler shutdown.")


# Create the FastAPI app with the lifespan context manager.
app = FastAPI(
    lifespan=lifespan,
    title="Medianalytics Data Service",
    version="1.0.0",
)