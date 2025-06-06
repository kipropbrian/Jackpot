from fastapi import APIRouter
from .health import router as health_router
from .simulations import router as simulations_router
from .scraping import router as scraping_router # Added import

api_router = APIRouter()

# Include routers from different modules
api_router.include_router(health_router, tags=["health"])
api_router.include_router(simulations_router, prefix="/simulations", tags=["simulations"])
api_router.include_router(scraping_router, prefix="/scrape", tags=["scraping"]) # Added router
