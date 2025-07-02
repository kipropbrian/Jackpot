import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# API settings
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "development_secret_key")

# Environment settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000", "https://jackpot.brianmaiyo.dev" # Frontend URL
]

# Email settings
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "notifications@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
