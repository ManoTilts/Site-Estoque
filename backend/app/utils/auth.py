from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt  # Disabled for now
from datetime import datetime
from typing import Optional, Union

# from app.config import JWT_SECRET_KEY, JWT_ALGORITHM  # Disabled for now
from app.models.models import User
from app.services.user_service import UserService

# Make authentication optional for development
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[User]:
    """
    Simplified user authentication without JWT validation.
    If a token is provided, tries to fetch user directly by ID,
    otherwise uses a default user ID for development.
    """
    try:
        # For development: if no token, use a default user ID
        user_id = token if token else "default_dev_user_id"
        
        # Still interact with MongoDB to get the actual user
        user = await UserService.get_user_by_id(user_id)
        
        # If user doesn't exist in DB, return the first user found for development
        if user is None:
            # Try to get any user from the database for development purposes
            users = await UserService.get_users(limit=1)
            if users and len(users) > 0:
                user = users[0]
            else:
                # If no users exist, return None which will be handled by endpoints
                return None
        
        return User(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            is_active=user["is_active"],
            created_at=user["created_at"],
            updated_at=user.get("updated_at")
        )
    except Exception as e:
        # For development: fail gracefully without throwing errors
        print(f"Authentication error: {e}")
        return None

async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> Optional[User]:
    if current_user is None:
        return None
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user