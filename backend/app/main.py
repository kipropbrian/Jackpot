from .config.logging import setup_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import api_router
import os
from typing import List

# Initialize logging before any other operations
logger = setup_logging()

# Get CORS allowed origins from environment variable
def get_allowed_origins() -> List[str]:
    origins_str = os.getenv("CORS_ALLOWED_ORIGINS")
    if not origins_str:
        error_msg = "Required environment variable CORS_ALLOWED_ORIGINS is not set"
        logger.error(error_msg)
        raise ValueError(error_msg)
    return [origin.strip() for origin in origins_str.split(",")]

try:
    app = FastAPI(
        title="Gambling Awareness API",
        description="API for the Gambling Awareness web application",
        version="0.1.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")

except Exception as e:
    logger.error(f"Failed to initialize application: {str(e)}", exc_info=True)
    raise  # Re-raise the exception after logging it

@app.get("/")
async def root():
    return {"message": "Welcome to the Gambling Awareness API"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}
