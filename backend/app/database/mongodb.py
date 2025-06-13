import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from app.config import MONGODB_URL, DB_NAME
from .indexes import create_indexes

client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DB_NAME]  # Use environment variable instead of hardcoded name
    
    # Create indexes for optimal performance
    try:
        indexes_created = await create_indexes(database)
        if indexes_created:
            print("Database indexes initialized")
    except Exception as e:
        print(f"Warning: Could not create indexes: {e}")

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return database