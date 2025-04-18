from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, DB_NAME

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db = MongoDB()

async def connect_to_mongo():
    """Connect to MongoDB."""
    db.client = AsyncIOMotorClient(MONGODB_URL)
    db.db = db.client[DB_NAME]
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")