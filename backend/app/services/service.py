from datetime import datetime
from bson import ObjectId
from app.database.mongodb import db

class ItemService:
    collection_name = "items"
    
    @classmethod
    async def get_all(cls, skip: int = 0, limit: int = 100):
        """Get all items from database."""
        collection = db.db[cls.collection_name]
        cursor = collection.find().skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
        return items
    
    @classmethod
    async def get_by_id(cls, id: str):
        """Get item by id."""
        collection = db.db[cls.collection_name]
        item = await collection.find_one({"_id": ObjectId(id)})
        return item
    
    @classmethod
    async def create(cls, item_data: dict):
        """Create new item."""
        collection = db.db[cls.collection_name]
        item = await collection.insert_one(item_data)
        new_item = await collection.find_one({"_id": item.inserted_id})
        return new_item
    
    @classmethod
    async def update(cls, id: str, item_data: dict):
        """Update item."""
        collection = db.db[cls.collection_name]
        item_data["updated_at"] = datetime.utcnow()
        
        updated_item = await collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": item_data},
            return_document=True
        )
        return updated_item
    
    @classmethod
    async def delete(cls, id: str):
        """Delete item."""
        collection = db.db[cls.collection_name]
        result = await collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0