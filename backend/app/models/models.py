from pydantic import BaseModel, Field, field_serializer, field_validator
from typing import Optional, Annotated, Any
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
    unit: Optional[str] = None
    stock: int
    price: float
    barcode: str
    image: Optional[str] = None
    
class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    distributer: Optional[str] = None
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