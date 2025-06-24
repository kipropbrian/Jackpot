from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import api_router
import logging
from pathlib import Path

# Configure logging
log_file = Path(__file__).parent.parent / 'errors.log'
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()  # Also keep console output
    ]
)

app = FastAPI(
    title="Gambling Awareness API",
    description="API for the Gambling Awareness web application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the Gambling Awareness API"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}
