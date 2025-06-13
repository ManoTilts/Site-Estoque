import bcrypt
from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict, Any, List

from app.database.mongodb import get_database

class UserService:
    collection_name = "users"
    
    @classmethod
    async def get_user_by_email(cls, email: str):
        db = get_database()
        return await db[cls.collection_name].find_one({"email": email})
    
    @classmethod
    async def get_user_by_id(cls, user_id: str):
        db = get_database()
        if not ObjectId.is_valid(user_id):
            return None
        return await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
    
    @classmethod
    async def get_users(cls, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get a list of users with pagination"""
        db = get_database()
        cursor = db[cls.collection_name].find().skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    
    @classmethod
    async def create_user(cls, user_data: Dict[str, Any]):
        db = get_database()
        
        # Check if user already exists
        existing_user = await cls.get_user_by_email(user_data["email"])
        if existing_user:
            return None
            
        # Hash the password
        hashed_password = cls.get_password_hash(user_data["password"])
        
        # Replace password with hashed version
        user_data.pop("password")
        user_data["hashed_password"] = hashed_password
        user_data["created_at"] = datetime.utcnow()
        user_data["is_active"] = True
        
        result = await db[cls.collection_name].insert_one(user_data)
        
        # Get and return the newly created user
        if result.inserted_id:
            return await cls.get_user_by_id(str(result.inserted_id))
        return None
    
    @classmethod
    def get_password_hash(cls, password: str) -> str:
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed_password.decode('utf-8')
    
    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    
    @classmethod
    async def authenticate_user(cls, email: str, password: str):
        user = await cls.get_user_by_email(email)
        if not user:
            return None
        
        if not cls.verify_password(password, user["hashed_password"]):
            return None
            
        return user