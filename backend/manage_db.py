#!/usr/bin/env python3
"""
Database Management Script for Product Inventory System

This script helps manage MongoDB indexes and provides performance monitoring tools.

Usage:
    python manage_db.py create-indexes    # Create all recommended indexes
    python manage_db.py list-indexes      # List all existing indexes
    python manage_db.py index-stats       # Show index usage statistics
    python manage_db.py explain-indexes   # Explain the purpose of each index
    python manage_db.py drop-index <name> # Drop a specific index
"""

import asyncio
import sys
import argparse
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, DB_NAME
from app.database.indexes import (
    create_indexes, 
    list_indexes, 
    get_index_stats, 
    explain_indexes
)

async def connect_to_database():
    """Connect to MongoDB database"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    return client, db

async def create_all_indexes():
    """Create all recommended indexes"""
    print("🚀 Creating database indexes...")
    client, db = await connect_to_database()
    
    try:
        await create_indexes(db)
        print("\n✅ Index creation completed successfully!")
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        return False
    finally:
        client.close()
    
    return True

async def list_all_indexes():
    """List all existing indexes"""
    print("📋 Listing database indexes...")
    client, db = await connect_to_database()
    
    try:
        await list_indexes(db)
    except Exception as e:
        print(f"❌ Error listing indexes: {e}")
    finally:
        client.close()

async def show_index_stats():
    """Show index usage statistics"""
    print("📊 Fetching index statistics...")
    client, db = await connect_to_database()
    
    try:
        await get_index_stats(db)
    except Exception as e:
        print(f"❌ Error getting index stats: {e}")
    finally:
        client.close()

async def drop_index(index_name: str):
    """Drop a specific index"""
    print(f"🗑️  Dropping index: {index_name}")
    client, db = await connect_to_database()
    
    try:
        items_collection = db.items
        await items_collection.drop_index(index_name)
        print(f"✅ Successfully dropped index: {index_name}")
    except Exception as e:
        print(f"❌ Error dropping index {index_name}: {e}")
    finally:
        client.close()

async def test_query_performance():
    """Test query performance with and without indexes"""
    print("🔍 Testing query performance...")
    client, db = await connect_to_database()
    
    try:
        items_collection = db.items
        
        # Test different query patterns
        test_queries = [
            {"associatedUser": "test_user_id"},
            {"$text": {"$search": "test product"}},
            {"associatedUser": "test_user_id", "category": "Electronics"},
            {"associatedUser": "test_user_id", "stock": {"$lte": 10}},
            {"barcode": "1234567890"}
        ]
        
        print("\n🏃 Running performance tests...")
        for i, query in enumerate(test_queries, 1):
            try:
                # Use explain to see query execution plan
                explain_result = await items_collection.find(query).explain()
                execution_stats = explain_result.get('executionStats', {})
                
                print(f"\nQuery {i}: {query}")
                print(f"Execution time: {execution_stats.get('executionTimeMillis', 'N/A')} ms")
                print(f"Documents examined: {execution_stats.get('totalDocsExamined', 'N/A')}")
                print(f"Index used: {'Yes' if execution_stats.get('totalKeysExamined', 0) > 0 else 'No'}")
                
            except Exception as e:
                print(f"Error testing query {i}: {e}")
                
    except Exception as e:
        print(f"❌ Error testing performance: {e}")
    finally:
        client.close()

def show_performance_tips():
    """Show database performance optimization tips"""
    print("""
🚀 Database Performance Optimization Tips:

📈 INDEX BENEFITS:
• Indexes can speed up queries by 10-100x
• Compound indexes support multiple query patterns
• Text indexes enable full-text search
• Unique indexes prevent duplicate data

📊 MONITORING:
• Use index stats to identify unused indexes
• Monitor query performance with explain()
• Track slow queries in MongoDB logs
• Consider index size vs. query speed trade-offs

⚡ QUERY OPTIMIZATION:
• Always filter by associatedUser first (most selective)
• Use compound indexes in field order of selectivity
• Avoid queries that scan entire collection
• Use projection to return only needed fields

🔧 MAINTENANCE:
• Rebuild indexes periodically for optimal performance
• Drop unused indexes to save storage space
• Monitor index fragmentation
• Consider partial indexes for large collections

💡 ADVANCED TIPS:
• Use aggregation pipeline for complex queries
• Consider read replicas for high-traffic applications
• Implement query result caching where appropriate
• Use connection pooling for better performance
""")

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Database Management Script for Product Inventory System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage_db.py create-indexes     # Create all indexes
  python manage_db.py list-indexes       # List current indexes
  python manage_db.py index-stats        # Show usage statistics
  python manage_db.py test-performance   # Test query performance
  python manage_db.py tips               # Show optimization tips
        """
    )
    
    parser.add_argument(
        'command',
        choices=[
            'create-indexes',
            'list-indexes', 
            'index-stats',
            'explain-indexes',
            'drop-index',
            'test-performance',
            'tips'
        ],
        help='Command to execute'
    )
    
    parser.add_argument(
        'index_name',
        nargs='?',
        help='Index name (required for drop-index command)'
    )
    
    args = parser.parse_args()
    
    if args.command == 'create-indexes':
        await create_all_indexes()
    elif args.command == 'list-indexes':
        await list_all_indexes()
    elif args.command == 'index-stats':
        await show_index_stats()
    elif args.command == 'explain-indexes':
        explain_indexes()
    elif args.command == 'drop-index':
        if not args.index_name:
            print("❌ Error: index_name is required for drop-index command")
            parser.print_help()
            sys.exit(1)
        await drop_index(args.index_name)
    elif args.command == 'test-performance':
        await test_query_performance()
    elif args.command == 'tips':
        show_performance_tips()

if __name__ == "__main__":
    asyncio.run(main()) 