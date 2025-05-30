from fastapi import APIRouter
from .health import router as health_router

api_router = APIRouter()

# Include routers from different modules
api_router.include_router(health_router, tags=["health"])
