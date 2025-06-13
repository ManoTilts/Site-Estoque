from fastapi import APIRouter, HTTPException, status, Body, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import Any

from app.models.models import UserCreate, User, UserLogin, AuthResponse, TokenRefresh
from app.services.user_service import UserService
from app.utils.jwt import create_token_pair, verify_token

router = APIRouter()
security = HTTPBasic()

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate = Body(...)):
    """
    Create a new user with hashed password
    """
    user_dict = user.model_dump()
    
    # Create the user
    new_user = await UserService.create_user(user_dict)
    
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Convert to response model (excluding hashed password)
    return User(
        id=str(new_user["_id"]),
        email=new_user["email"],
        username=new_user["username"],
        is_active=new_user["is_active"],
        created_at=new_user["created_at"],
        updated_at=new_user.get("updated_at")
    )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin = Body(...)):
    """
    Login with email and password, returns JWT tokens
    """
    user = await UserService.authenticate_user(user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access and refresh tokens
    access_token, refresh_token = create_token_pair(str(user["_id"]))
    
    # Create user response object
    user_response = User(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        updated_at=user.get("updated_at")
    )
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(refresh_data: TokenRefresh = Body(...)):
    """
    Refresh access token using refresh token
    """
    try:
        # Verify the refresh token
        payload = verify_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user from database
        user = await UserService.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new token pair
        access_token, refresh_token = create_token_pair(user_id)
        
        # Create user response object
        user_response = User(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            is_active=user["is_active"],
            created_at=user["created_at"],
            updated_at=user.get("updated_at")
        )
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token"
        )