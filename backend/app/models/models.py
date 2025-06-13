from pydantic import BaseModel, Field, EmailStr, field_serializer, field_validator
from typing import Optional, Annotated, Any, List
from datetime import datetime
from bson import ObjectId

# Fix for PyObjectId to work with Pydantic v2
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> dict[str, Any]:
        return {
            "type": "str",
            "validator_function": cls.validate,
        }
    
    @classmethod
    def validate(cls, value: Any) -> str:
        if not isinstance(value, ObjectId) and not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")
        return str(value)

class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    distributer: str
    unit: Optional[str] = None  #unidade de medida
    stock: int
    price: float
    barcode: Optional[str] = None  # Made optional so it can be auto-generated
    image: Optional[str] = None
    associatedUser: str
    
class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    distributer: Optional[str] = None
    unit: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None

class ItemInDB(ItemBase):
    id: Annotated[PyObjectId, Field(alias="_id", default_factory=PyObjectId)]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    @field_serializer('id')
    def serialize_id(self, id: PyObjectId) -> str:
        return str(id)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "_id": "64c12e00e55f5aaa5c5e7e00",
                    "title": "Sample Item",
                    "description": "This is a sample item",
                    "created_at": "2023-07-26T10:00:00",
                    "updated_at": None
                }
            ]
        },
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

# User models
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    exp: int

class TokenRefresh(BaseModel):
    refresh_token: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User