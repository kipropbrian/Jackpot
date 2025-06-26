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
        
        # Get user profile with role information
        profile_response = supabase.table("profiles").select("*").eq("id", response.user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile = profile_response.data
        
        # Check if user is active
        if not profile.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Convert User object to dictionary with profile data
        user_dict = {
            "id": response.user.id,
            "email": response.user.email,
            "app_metadata": response.user.app_metadata,
            "user_metadata": response.user.user_metadata,
            "role": profile.get("role", "user"),
            "is_active": profile.get("is_active", True),
            "full_name": profile.get("full_name"),
            "last_login": profile.get("last_login"),
            "created_at": profile.get("created_at")
        }
        
        # Return the user data as a dictionary
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_superadmin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify that the current user is a superadmin.
    """
    if current_user.get("role") != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user

def require_role(required_role: str):
    """
    Factory function to create role-based dependencies.
    """
    async def role_dependency(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_dependency
