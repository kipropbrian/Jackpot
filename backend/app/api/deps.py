from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError
from app.config.settings import API_SECRET_KEY
from app.config.database import supabase

# Security scheme for JWT authentication
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validate the JWT token and return the current user.
    """
    try:
        # Get the token from the Authorization header
        token = credentials.credentials
        
        # Verify the token with Supabase
        response = supabase.auth.get_user(token)
        
        # Convert User object to dictionary
        user_dict = {
            "id": response.user.id,
            "email": response.user.email,
            "app_metadata": response.user.app_metadata,
            "user_metadata": response.user.user_metadata
        }
        
        # Return the user data as a dictionary
        return user_dict
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
