from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from fastapi import Depends
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'neon_snake_db')]


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database instance"""
    return db


async def init_database():
    """Initialize database with indexes and collections"""
    try:
        # Create indexes for better performance
        
        # Players collection indexes
        await db.players.create_index("username", unique=True)
        await db.players.create_index("email", unique=True, sparse=True)
        await db.players.create_index("highest_score")
        await db.players.create_index("created_at")
        
        # Game states collection indexes
        await db.game_states.create_index([("player_id", 1), ("is_active", 1)])
        await db.game_states.create_index("timestamp")
        
        # Game sessions collection indexes
        await db.game_sessions.create_index("player_id")
        await db.game_sessions.create_index("score")
        await db.game_sessions.create_index("timestamp")
        
        # Leaderboard collection indexes
        await db.leaderboard.create_index("player_id", unique=True)
        await db.leaderboard.create_index([("score", -1), ("timestamp", 1)])
        
        # Game statistics collection indexes
        await db.game_statistics.create_index("player_id", unique=True)
        await db.game_statistics.create_index("highest_score")
        
        # Game imports collection indexes
        await db.game_imports.create_index("player_id")
        await db.game_imports.create_index("import_timestamp")
        
        print("Database initialized successfully with indexes")
        
    except Exception as e:
        print(f"Database initialization error: {e}")


async def close_database():
    """Close database connection"""
    client.close()