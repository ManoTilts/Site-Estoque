from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database.mongodb import get_database
from typing import List, Dict, Optional
import datetime

class ItemService:
    @staticmethod
    def get_collection() -> AsyncIOMotorCollection:
        """Get items collection"""
        db = get_database()
        return db.items

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all items with pagination"""
        collection = ItemService.get_collection()
        cursor = collection.find({}).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_by_user(user_id: str, skip: int = 0, limit: int = 100) -> List[Dict]:
        """
        Get all items for a specific user (uses associatedUser index)
        This is much more efficient than getting all items and filtering
        """
        collection = ItemService.get_collection()
        cursor = collection.find(
            {"associatedUser": user_id}
        ).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def search_user_items(
        user_id: str, 
        search_term: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Dict]:
        """
        Search within user's items using text index
        """
        collection = ItemService.get_collection()
        
        if search_term.strip():
            # Use text search with user filter (uses compound index)
            cursor = collection.find({
                "$and": [
                    {"associatedUser": user_id},
                    {"$text": {"$search": search_term}}
                ]
            }).skip(skip).limit(limit)
        else:
            # No search term, just get user's items
            cursor = collection.find(
                {"associatedUser": user_id}
            ).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_user_items_sorted(
        user_id: str, 
        sort_field: str = "title", 
        sort_order: int = 1,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Dict]:
        """
        Get user's items with sorting (uses compound indexes)
        sort_order: 1 for ascending, -1 for descending
        """
        collection = ItemService.get_collection()
        cursor = collection.find(
            {"associatedUser": user_id}
        ).sort(sort_field, sort_order).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)

    @staticmethod
    async def filter_user_items(
        user_id: str,
        category: Optional[str] = None,
        distributer: Optional[str] = None,
        min_stock: Optional[int] = None,
        max_stock: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict]:
        """
        Filter user's items with various criteria (uses compound indexes)
        """
        collection = ItemService.get_collection()
        
        # Build filter query
        query = {"associatedUser": user_id}
        
        if category:
            query["category"] = category
        
        if distributer:
            query["distributer"] = distributer
        
        if min_stock is not None or max_stock is not None:
            stock_filter = {}
            if min_stock is not None:
                stock_filter["$gte"] = min_stock
            if max_stock is not None:
                stock_filter["$lte"] = max_stock
            query["stock"] = stock_filter
        
        if min_price is not None or max_price is not None:
            price_filter = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            query["price"] = price_filter
        
        cursor = collection.find(query).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_by_id(item_id: str) -> Optional[Dict]:
        """Get item by ID"""
        if not ObjectId.is_valid(item_id):
            return None
        
        collection = ItemService.get_collection()
        return await collection.find_one({"_id": ObjectId(item_id)})

    @staticmethod
    async def get_by_barcode(barcode: str) -> Optional[Dict]:
        """Get item by barcode (uses unique barcode index)"""
        collection = ItemService.get_collection()
        return await collection.find_one({"barcode": barcode})

    @staticmethod
    async def create(item_data: Dict) -> Dict:
        """Create new item"""
        collection = ItemService.get_collection()
        
        # Add timestamps
        now = datetime.datetime.utcnow()
        item_data["created_at"] = now
        item_data["updated_at"] = now
        
        result = await collection.insert_one(item_data)
        
        # Return the created item
        return await collection.find_one({"_id": result.inserted_id})

    @staticmethod
    async def update(item_id: str, item_data: Dict) -> Optional[Dict]:
        """Update item"""
        if not ObjectId.is_valid(item_id):
            return None
        
        collection = ItemService.get_collection()
        
        # Add update timestamp
        item_data["updated_at"] = datetime.datetime.utcnow()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(item_id)},
            {"$set": item_data},
            return_document=True
        )
        
        return result

    @staticmethod
    async def delete(item_id: str) -> bool:
        """Delete item"""
        if not ObjectId.is_valid(item_id):
            return False
        
        collection = ItemService.get_collection()
        result = await collection.delete_one({"_id": ObjectId(item_id)})
        
        return result.deleted_count > 0

    @staticmethod
    async def get_user_item_count(user_id: str) -> int:
        """Get total count of user's items (uses associatedUser index)"""
        collection = ItemService.get_collection()
        return await collection.count_documents({"associatedUser": user_id})

    @staticmethod
    async def get_low_stock_items(user_id: str, default_threshold: int = 10) -> List[Dict]:
        """
        Get items with low stock for a user based on each item's personal threshold or default
        """
        collection = ItemService.get_collection()
        
        # Use aggregation pipeline to compare stock with each item's threshold
        pipeline = [
            {"$match": {"associatedUser": user_id}},
            {
                "$addFields": {
                    "effective_threshold": {
                        "$ifNull": ["$low_stock_threshold", default_threshold]
                    }
                }
            },
            {
                "$match": {
                    "$expr": {"$lte": ["$stock", "$effective_threshold"]}
                }
            },
            {"$sort": {"stock": 1}}  # Sort by stock ascending
        ]
        
        cursor = collection.aggregate(pipeline)
        return await cursor.to_list(length=None)

    @staticmethod
    async def get_categories_for_user(user_id: str) -> List[str]:
        """Get distinct categories for a user"""
        collection = ItemService.get_collection()
        categories = await collection.distinct("category", {"associatedUser": user_id})
        return [cat for cat in categories if cat]  # Filter out None/empty values

    @staticmethod
    async def get_distributors_for_user(user_id: str) -> List[str]:
        """
        Get unique distributors for a user (uses compound index)
        """
        collection = ItemService.get_collection()
        distributors = await collection.distinct("distributer", {"associatedUser": user_id})
        return distributors

class StockTransactionService:
    @staticmethod
    def get_collection() -> AsyncIOMotorCollection:
        """Get stock transactions collection"""
        db = get_database()
        return db.stock_transactions

    @staticmethod
    async def create_transaction(transaction_data: Dict) -> Dict:
        """Create new stock transaction and update item stock"""
        collection = StockTransactionService.get_collection()
        item_collection = ItemService.get_collection()
        
        # Add timestamps
        now = datetime.datetime.utcnow()
        transaction_data["created_at"] = now
        transaction_data["updated_at"] = now
        
        # Insert transaction
        result = await collection.insert_one(transaction_data)
        
        # Update item stock (subtract quantity for loss, damage, return)
        item_id = transaction_data["item_id"]
        quantity = transaction_data["quantity"]
        
        await item_collection.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$inc": {"stock": -quantity},
                "$set": {"updated_at": now}
            }
        )
        
        # Return the created transaction
        return await collection.find_one({"_id": result.inserted_id})

    @staticmethod
    async def get_transactions(
        user_id: str,
        transaction_type: Optional[str] = None,
        item_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict]:
        """Get transactions for a user with optional filters"""
        collection = StockTransactionService.get_collection()
        
        # Build query
        query = {"associated_user": user_id}
        
        if transaction_type:
            query["transaction_type"] = transaction_type
            
        if item_id:
            query["item_id"] = item_id
        
        cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_transaction_count(
        user_id: str,
        transaction_type: Optional[str] = None,
        item_id: Optional[str] = None
    ) -> int:
        """Get count of transactions for a user with optional filters"""
        collection = StockTransactionService.get_collection()
        
        # Build query
        query = {"associated_user": user_id}
        
        if transaction_type:
            query["transaction_type"] = transaction_type
            
        if item_id:
            query["item_id"] = item_id
        
        return await collection.count_documents(query)

    @staticmethod
    async def get_transaction_by_id(transaction_id: str) -> Optional[Dict]:
        """Get transaction by ID"""
        if not ObjectId.is_valid(transaction_id):
            return None
        
        collection = StockTransactionService.get_collection()
        return await collection.find_one({"_id": ObjectId(transaction_id)})

    @staticmethod
    async def update_transaction(transaction_id: str, transaction_data: Dict) -> Optional[Dict]:
        """Update transaction (only certain fields can be updated)"""
        if not ObjectId.is_valid(transaction_id):
            return None
        
        collection = StockTransactionService.get_collection()
        
        # Add update timestamp
        transaction_data["updated_at"] = datetime.datetime.utcnow()
        
        result = await collection.find_one_and_update(
            {"_id": ObjectId(transaction_id)},
            {"$set": transaction_data},
            return_document=True
        )
        
        return result

    @staticmethod
    async def get_transaction_stats(user_id: str) -> Dict:
        """Get transaction statistics for a user"""
        collection = StockTransactionService.get_collection()
        
        # Aggregate statistics
        pipeline = [
            {"$match": {"associated_user": user_id}},
            {
                "$group": {
                    "_id": "$transaction_type",
                    "total_quantity": {"$sum": "$quantity"},
                    "total_cost_impact": {"$sum": "$cost_impact"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await collection.aggregate(pipeline).to_list(length=None)
        
        # Format results
        stats = {
            "loss": {"quantity": 0, "cost": 0, "count": 0},
            "damage": {"quantity": 0, "cost": 0, "count": 0},
            "return": {"quantity": 0, "cost": 0, "count": 0},
            "total": {"quantity": 0, "cost": 0, "count": 0}
        }
        
        for result in results:
            transaction_type = result["_id"]
            if transaction_type in stats:
                stats[transaction_type] = {
                    "quantity": result["total_quantity"],
                    "cost": result["total_cost_impact"] or 0,
                    "count": result["count"]
                }
                # Add to total
                stats["total"]["quantity"] += result["total_quantity"]
                stats["total"]["cost"] += result["total_cost_impact"] or 0
                stats["total"]["count"] += result["count"]
        
        return stats