from fastapi import APIRouter, HTTPException
from app.config.database import supabase

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies the Supabase connection.
    """
    try:
        # Simple query to check if Supabase connection is working
        response = supabase.table('profiles').select('count', count='exact').execute()
        
        return {
            "status": "ok",
            "message": "API is running and connected to Supabase",
            "database": {
                "connected": True,
                "profiles_count": response.count
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )
