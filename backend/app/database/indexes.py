"""
MongoDB Indexing Strategy for Product Inventory System

This file defines the recommended indexes to optimize query performance
for the product inventory application.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
import asyncio
from pymongo import IndexModel, TEXT, ASCENDING, DESCENDING

async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Create all recommended indexes for the items and users collections
    """
    items_collection = db.items
    users_collection = db.users
    
    try:
        # Get existing indexes first
        existing_items_indexes = await _get_existing_index_keys(items_collection)
        existing_users_indexes = await _get_existing_index_keys(users_collection)
        
        items_created = 0
        users_created = 0
        
        # ITEMS COLLECTION INDEXES
        items_indexes_to_create = [
            ("associatedUser", {}),
            ([("associatedUser", 1), ("title", 1)], {}),
            ([("title", "text"), ("description", "text")], {}),
            ("barcode", {"unique": True, "sparse": True}),
            ([("associatedUser", 1), ("purchase_price", 1)], {}),
            ([("associatedUser", 1), ("sell_price", 1)], {}),
            ([("associatedUser", 1), ("stock", 1)], {}),
            ([("associatedUser", 1), ("category", 1)], {}),
            ("created_at", {}),
            ([("associatedUser", 1), ("distributer", 1)], {})
        ]
        
        for index_key, options in items_indexes_to_create:
            if not _index_exists(index_key, existing_items_indexes):
                await items_collection.create_index(index_key, **options)
                items_created += 1
        
        # USERS COLLECTION INDEXES  
        users_indexes_to_create = [
            ("email", {"unique": True})
        ]
        
        for index_key, options in users_indexes_to_create:
            if not _index_exists(index_key, existing_users_indexes):
                await users_collection.create_index(index_key, **options)
                users_created += 1
        
        # Only print summary if changes were made
        if items_created > 0 or users_created > 0:
            print(f"✓ Database optimization completed")
            if items_created > 0:
                print(f"  - Items collection: {items_created} indexes created")
            if users_created > 0:
                print(f"  - Users collection: {users_created} indexes created")
            return True  # Return True if indexes were created
        
        return False  # Return False if no indexes were created
        
    except Exception as e:
        print(f"❌ Error optimizing database: {e}")
        raise

async def _get_existing_index_keys(collection):
    """Get existing index keys for a collection"""
    try:
        indexes = await collection.list_indexes().to_list(None)
        return [index.get('key', {}) for index in indexes]
    except:
        return []

def _index_exists(index_key, existing_indexes):
    """Check if an index already exists"""
    # Normalize the index key to the format MongoDB uses internally
    def normalize_index_key(key):
        if isinstance(key, str):
            # Single field index: "field" -> {"field": 1}
            return {key: 1}
        elif isinstance(key, list):
            # Compound index: [("field1", 1), ("field2", -1)] -> {"field1": 1, "field2": -1}
            return dict(key)
        elif isinstance(key, dict):
            # Already normalized
            return key
        else:
            # Fallback: convert to string and use ascending
            return {str(key): 1}
    
    normalized_target = normalize_index_key(index_key)
    
    # Compare with existing indexes
    for existing_index in existing_indexes:
        if normalized_target == existing_index:
            return True
    
    return False

async def list_indexes(db: AsyncIOMotorDatabase):
    """
    List existing indexes count on collections
    """
    collections = [
        ("items", db.items),
        ("users", db.users)
    ]
    
    for collection_name, collection in collections:
        try:
            indexes = await collection.list_indexes().to_list(None)
            print(f"\n📋 Collection '{collection_name}':")
            print(f"  - Total indexes: {len(indexes)}")
            
            index_types = {"unique": 0, "text": 0, "regular": 0, "sparse": 0}
            
            for index in indexes:
                key = index.get('key', {})
                unique = index.get('unique', False)
                sparse = index.get('sparse', False)
                text_index = 'text' in str(key)
                
                if unique:
                    index_types["unique"] += 1
                elif text_index:
                    index_types["text"] += 1
                else:
                    index_types["regular"] += 1
                    
                if sparse:
                    index_types["sparse"] += 1
            
            print(f"  - Unique indexes: {index_types['unique']}")
            print(f"  - Text search indexes: {index_types['text']}")
            print(f"  - Regular indexes: {index_types['regular']}")
            print(f"  - Sparse indexes: {index_types['sparse']}")
                
        except Exception as e:
            print(f"❌ Error analyzing {collection_name} collection")

# Index size monitoring
async def get_index_stats(db: AsyncIOMotorDatabase):
    """
    Get index usage statistics to monitor performance
    """
    collections = [
        ("items", db.items),
        ("users", db.users)
    ]
    
    for collection_name, collection in collections:
        try:
            stats = await collection.index_stats().to_list(None)
            print(f"\n📊 Collection '{collection_name}' performance:")
            
            total_ops = 0
            active_indexes = 0
            
            for stat in stats:
                accesses = stat.get('accesses', {})
                ops = accesses.get('ops', 0)
                total_ops += ops
                if ops > 0:
                    active_indexes += 1
            
            print(f"  - Total index operations: {total_ops}")
            print(f"  - Active indexes: {active_indexes}/{len(stats)}")
            print(f"  - Performance status: {'Optimized' if active_indexes > 0 else 'Needs optimization'}")
                
        except Exception as e:
            print(f"❌ Error analyzing {collection_name} performance")

# Performance impact explanation
INDEX_BENEFITS = {
    # Items collection indexes
    "associatedUser": "Speeds up fetching user's products (most common query)",
    "associatedUser + title": "Optimizes search within user's inventory",
    "text search": "Enables fast full-text search across title and description",
    "barcode unique": "Ensures barcode uniqueness and fast barcode lookups",
    "associatedUser + purchase_price": "Optimizes purchase price-based sorting for users",
    "associatedUser + sell_price": "Optimizes sell price-based sorting for users",
    "associatedUser + stock": "Optimizes stock-based sorting and low-stock alerts",
    "associatedUser + category": "Speeds up category filtering within user inventory",
    "created_at (items)": "Optimizes date-based queries and recent products",
    "associatedUser + distributer": "Speeds up distributor-based filtering",
    
    # Users collection indexes
    "email unique": "Ensures email uniqueness and speeds up authentication",
    "username": "Optimizes username-based queries and searches",
    "created_at (users)": "Optimizes user registration date queries",
    "is_active": "Speeds up filtering active/inactive users"
}

def explain_indexes():
    """
    Explain the purpose and benefits of each index
    """
    print("\n📚 Index Explanation:")
    print("=" * 60)
    
    for index_name, benefit in INDEX_BENEFITS.items():
        print(f"• {index_name}: {benefit}")
    
    print(f"\n💡 Performance Tips:")
    print("• Compound indexes are used left-to-right")
    print("• Text indexes enable $text search queries")
    print("• Sparse indexes ignore null values")
    print("• Monitor index usage with index stats")
    print("• Consider index size vs query performance trade-offs")

async def create_indexes(db: AsyncIOMotorDatabase):
    """Create database indexes for better performance"""
    
    # Items collection indexes
    items_collection = db.items
    
    # Create indexes for items collection
    items_indexes = [
        # Basic indexes
        IndexModel([("associatedUser", ASCENDING)], name="associatedUser_1"),
        IndexModel([("barcode", ASCENDING)], unique=True, name="barcode_1_unique"),
        IndexModel([("created_at", DESCENDING)], name="created_at_-1"),
        
        # Compound indexes for efficient queries
        IndexModel([("associatedUser", ASCENDING), ("category", ASCENDING)], name="user_category_1"),
        IndexModel([("associatedUser", ASCENDING), ("distributer", ASCENDING)], name="user_distributer_1"),
        IndexModel([("associatedUser", ASCENDING), ("stock", ASCENDING)], name="user_stock_1"),
        IndexModel([("associatedUser", ASCENDING), ("title", ASCENDING)], name="user_title_1"),
        IndexModel([("associatedUser", ASCENDING), ("created_at", DESCENDING)], name="user_created_-1"),
        
        # For low stock queries
        IndexModel([("associatedUser", ASCENDING), ("stock", ASCENDING), ("low_stock_threshold", ASCENDING)], name="user_low_stock"),
        
        # Text search index
        IndexModel([("title", TEXT), ("description", TEXT)], name="text_search")
    ]
    
    await items_collection.create_indexes(items_indexes)
    
    # Stock transactions collection indexes
    stock_transactions_collection = db.stock_transactions
    
    # Create indexes for stock transactions collection
    stock_transactions_indexes = [
        # Basic indexes
        IndexModel([("associated_user", ASCENDING)], name="associated_user_1"),
        IndexModel([("item_id", ASCENDING)], name="item_id_1"),
        IndexModel([("transaction_type", ASCENDING)], name="transaction_type_1"),
        IndexModel([("created_at", DESCENDING)], name="created_at_-1"),
        
        # Compound indexes for efficient queries
        IndexModel([("associated_user", ASCENDING), ("transaction_type", ASCENDING)], name="user_type_1"),
        IndexModel([("associated_user", ASCENDING), ("item_id", ASCENDING)], name="user_item_1"),
        IndexModel([("associated_user", ASCENDING), ("created_at", DESCENDING)], name="user_created_-1"),
        IndexModel([("item_id", ASCENDING), ("created_at", DESCENDING)], name="item_created_-1"),
        
        # For transaction statistics
        IndexModel([("associated_user", ASCENDING), ("transaction_type", ASCENDING), ("created_at", DESCENDING)], name="user_type_created_-1"),
    ]
    
    await stock_transactions_collection.create_indexes(stock_transactions_indexes)
    
    print("All database indexes created successfully!")

async def drop_indexes(db: AsyncIOMotorDatabase):
    """Drop all custom indexes (useful for development)"""
    
    # Drop items indexes
    items_collection = db.items
    await items_collection.drop_indexes()
    
    # Drop stock transactions indexes  
    stock_transactions_collection = db.stock_transactions
    await stock_transactions_collection.drop_indexes()
    
    print("All custom indexes dropped!")

async def list_indexes(db: AsyncIOMotorDatabase):
    """List all indexes for debugging"""
    
    print("Items collection indexes:")
    items_collection = db.items
    items_indexes = await items_collection.list_indexes().to_list(length=None)
    for index in items_indexes:
        print(f"  {index}")
    
    print("\nStock transactions collection indexes:")
    stock_transactions_collection = db.stock_transactions
    st_indexes = await stock_transactions_collection.list_indexes().to_list(length=None)
    for index in st_indexes:
        print(f"  {index}") 