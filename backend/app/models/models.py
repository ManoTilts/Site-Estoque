from pydantic import BaseModel, Field, EmailStr, field_serializer, field_validator
from typing import Optional, Annotated, Any, List, Dict
from datetime import datetime
from bson import ObjectId
from enum import Enum

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
    low_stock_threshold: Optional[int] = 10  # Threshold personalizado para alerta de estoque baixo
    purchase_price: Optional[float] = None  # Preço de compra
    sell_price: Optional[float] = None      # Preço de venda
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
    low_stock_threshold: Optional[int] = None
    purchase_price: Optional[float] = None
    sell_price: Optional[float] = None
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

# Stock Transaction models for losses, damages, and returns
class StockTransactionType(str, Enum):
    LOSS = "loss"           # Perdas
    DAMAGE = "damage"       # Danos
    RETURN = "return"       # Devoluções

class StockTransactionBase(BaseModel):
    item_id: str
    transaction_type: StockTransactionType
    quantity: int
    reason: str
    notes: Optional[str] = None
    cost_impact: Optional[float] = None  # Impacto financeiro
    reference_number: Optional[str] = None  # Número de referência para devoluções
    associated_user: str

class StockTransactionCreate(StockTransactionBase):
    pass

class StockTransactionUpdate(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None
    cost_impact: Optional[float] = None
    reference_number: Optional[str] = None

class StockTransactionInDB(StockTransactionBase):
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
                    "_id": "64c12e00e55f5aaa5c5e7e01",
                    "item_id": "64c12e00e55f5aaa5c5e7e00",
                    "transaction_type": "loss",
                    "quantity": 5,
                    "reason": "Produto vencido",
                    "notes": "Lote vencido em 15/12/2023",
                    "cost_impact": 25.50,
                    "reference_number": None,
                    "associated_user": "user123",
                    "created_at": "2023-07-26T10:00:00",
                    "updated_at": None
                }
            ]
        },
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

# Activity Log models for tracking user activities
class ActivityType(str, Enum):
    ITEM_CREATED = "item_created"
    ITEM_UPDATED = "item_updated"
    ITEM_DELETED = "item_deleted"
    STOCK_TRANSACTION = "stock_transaction"
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"

class ActivityLogBase(BaseModel):
    user_id: str
    activity_type: ActivityType
    description: str
    entity_id: Optional[str] = None  # ID do produto, transação, etc.
    entity_type: Optional[str] = None  # "item", "transaction", etc.
    metadata: Optional[Dict] = None  # Dados adicionais da atividade
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogInDB(ActivityLogBase):
    id: Annotated[PyObjectId, Field(alias="_id", default_factory=PyObjectId)]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_serializer('id')
    def serialize_id(self, id: PyObjectId) -> str:
        return str(id)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "_id": "64c12e00e55f5aaa5c5e7e02",
                    "user_id": "user123",
                    "activity_type": "item_created",
                    "description": "Produto 'Notebook Dell' foi criado",
                    "entity_id": "64c12e00e55f5aaa5c5e7e00",
                    "entity_type": "item",
                    "metadata": {
                        "item_title": "Notebook Dell",
                        "stock": 10,
                        "price": 2500.00
                    },
                    "ip_address": "192.168.1.1",
                    "user_agent": "Mozilla/5.0...",
                    "created_at": "2023-07-26T10:00:00"
                }
            ]
        },
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }