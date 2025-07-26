from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
import os

import sys
sys.path.append('/app/backend')
from models import (
    Player, PlayerCreate, PlayerUpdate,
    GameState, GameStateCreate,
    GameSession, GameSessionCreate,
    LeaderboardEntry, GameStatistics, GameStatisticsUpdate,
    GameExport, GameImport, ApiResponse
)
from database import get_database

router = APIRouter(prefix="/api/game", tags=["game"])


# Player Management
@router.post("/players", response_model=Player)
async def create_player(player_data: PlayerCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Create a new player profile"""
    try:
        # Check if username already exists
        existing_player = await db.players.find_one({"username": player_data.username})
        if existing_player:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        player = Player(**player_data.dict())
        await db.players.insert_one(player.dict())
        
        # Create initial statistics
        stats = GameStatistics(player_id=player.id)
        await db.game_statistics.insert_one(stats.dict())
        
        return player
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get player by ID"""
    try:
        player = await db.players.find_one({"id": player_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return Player(**player)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/players/username/{username}", response_model=Player)
async def get_player_by_username(username: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get player by username"""
    try:
        player = await db.players.find_one({"username": username})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return Player(**player)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player_update: PlayerUpdate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Update player profile"""
    try:
        update_data = {k: v for k, v in player_update.dict().items() if v is not None}
        update_data["last_active"] = datetime.utcnow()
        
        result = await db.players.update_one(
            {"id": player_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Player not found")
        
        updated_player = await db.players.find_one({"id": player_id})
        return Player(**updated_player)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Game State Management
@router.post("/save-game", response_model=ApiResponse)
async def save_game_state(game_state: GameStateCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Save current game state"""
    try:
        # Deactivate previous game states for this player
        await db.game_states.update_many(
            {"player_id": game_state.player_id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        
        # Create new game state
        new_game_state = GameState(**game_state.dict())
        await db.game_states.insert_one(new_game_state.dict())
        
        return ApiResponse(
            success=True,
            message="Game state saved successfully",
            data={"game_state_id": new_game_state.id}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/load-game/{player_id}", response_model=GameState)
async def load_game_state(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Load the most recent game state for a player"""
    try:
        game_state = await db.game_states.find_one(
            {"player_id": player_id, "is_active": True},
            sort=[("timestamp", -1)]
        )
        
        if not game_state:
            raise HTTPException(status_code=404, detail="No saved game found")
        
        return GameState(**game_state)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/game-state/{player_id}")
async def delete_game_state(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Delete active game state for a player"""
    try:
        result = await db.game_states.update_many(
            {"player_id": player_id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        
        return ApiResponse(
            success=True,
            message=f"Deleted {result.modified_count} game states"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Game Session Management
@router.post("/sessions", response_model=ApiResponse)
async def create_game_session(session_data: GameSessionCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Record a completed game session"""
    try:
        session = GameSession(**session_data.dict())
        await db.game_sessions.insert_one(session.dict())
        
        # Update player statistics
        await update_player_statistics(session_data.player_id, session_data, db)
        
        # Update leaderboard if it's a high score
        await update_leaderboard(session_data.player_id, session_data.score, session_data.snake_length, db)
        
        return ApiResponse(
            success=True,
            message="Game session recorded successfully",
            data={"session_id": session.id}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{player_id}", response_model=List[GameSession])
async def get_player_sessions(player_id: str, limit: int = 10, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get recent game sessions for a player"""
    try:
        sessions = await db.game_sessions.find(
            {"player_id": player_id},
            sort=[("timestamp", -1)],
            limit=limit
        ).to_list(limit)
        
        return [GameSession(**session) for session in sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Leaderboard
@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 50, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get top scores leaderboard"""
    try:
        leaderboard = await db.leaderboard.find(
            {},
            sort=[("score", -1), ("timestamp", 1)],
            limit=limit
        ).to_list(limit)
        
        # Add rank numbers
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
        
        return [LeaderboardEntry(**entry) for entry in leaderboard]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard/player/{player_id}")
async def get_player_leaderboard_position(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get player's position in leaderboard"""
    try:
        # Get all scores higher than player's best
        player_best = await db.leaderboard.find_one(
            {"player_id": player_id},
            sort=[("score", -1)]
        )
        
        if not player_best:
            return {"rank": None, "message": "Player not found in leaderboard"}
        
        higher_scores = await db.leaderboard.count_documents(
            {"score": {"$gt": player_best["score"]}}
        )
        
        return {
            "rank": higher_scores + 1,
            "score": player_best["score"],
            "snake_length": player_best["snake_length"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Statistics
@router.get("/statistics/{player_id}", response_model=GameStatistics)
async def get_player_statistics(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get player statistics"""
    try:
        stats = await db.game_statistics.find_one({"player_id": player_id})
        if not stats:
            # Create default statistics if none exist
            stats = GameStatistics(player_id=player_id)
            await db.game_statistics.insert_one(stats.dict())
        
        return GameStatistics(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Export/Import
@router.get("/export/{player_id}", response_model=GameExport)
async def export_player_data(player_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Export all player data"""
    try:
        # Get player info
        player = await db.players.find_one({"id": player_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Get statistics
        stats = await db.game_statistics.find_one({"player_id": player_id})
        if not stats:
            stats = GameStatistics(player_id=player_id).dict()
        
        # Get recent sessions
        sessions = await db.game_sessions.find(
            {"player_id": player_id},
            sort=[("timestamp", -1)],
            limit=50
        ).to_list(50)
        
        # Get saved game state
        saved_game = await db.game_states.find_one(
            {"player_id": player_id, "is_active": True}
        )
        
        export_data = GameExport(
            player_id=player_id,
            username=player["username"],
            statistics=GameStatistics(**stats),
            recent_sessions=[GameSession(**session) for session in sessions],
            saved_game_state=GameState(**saved_game) if saved_game else None
        )
        
        return export_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/{player_id}", response_model=ApiResponse)
async def import_player_data(player_id: str, import_data: GameImport, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Import player data (partial implementation - would need validation)"""
    try:
        # This is a simplified implementation
        # In a real scenario, you'd want to validate the import data structure
        
        record = GameImport(player_id=player_id, export_data=import_data.export_data)
        await db.game_imports.insert_one(record.dict())
        
        return ApiResponse(
            success=True,
            message="Import request recorded successfully",
            data={"import_id": record.import_timestamp}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper Functions
async def update_player_statistics(player_id: str, session_data: GameSessionCreate, db: AsyncIOMotorDatabase):
    """Update player statistics after a game session"""
    stats = await db.game_statistics.find_one({"player_id": player_id})
    
    if not stats:
        stats = GameStatistics(player_id=player_id).dict()
        await db.game_statistics.insert_one(stats)
        stats = await db.game_statistics.find_one({"player_id": player_id})
    
    # Update statistics
    new_total_games = stats["total_games"] + 1
    new_total_score = stats["total_score"] + session_data.score
    new_average_score = new_total_score / new_total_games
    new_highest_score = max(stats["highest_score"], session_data.score)
    new_longest_snake = max(stats["longest_snake"], session_data.snake_length)
    new_food_eaten = stats["total_food_eaten"] + session_data.food_eaten
    new_play_time = stats["total_play_time_seconds"] + session_data.duration_seconds
    new_speed_boosts = stats["speed_boosts_used"] + session_data.speed_boosts_used
    
    await db.game_statistics.update_one(
        {"player_id": player_id},
        {
            "$set": {
                "total_games": new_total_games,
                "total_score": new_total_score,
                "average_score": new_average_score,
                "highest_score": new_highest_score,
                "longest_snake": new_longest_snake,
                "total_food_eaten": new_food_eaten,
                "total_play_time_seconds": new_play_time,
                "speed_boosts_used": new_speed_boosts,
                "last_updated": datetime.utcnow()
            }
        }
    )
    
    # Also update player's highest score
    await db.players.update_one(
        {"id": player_id},
        {
            "$set": {
                "highest_score": new_highest_score,
                "total_games_played": new_total_games,
                "total_score": new_total_score,
                "longest_snake": new_longest_snake,
                "last_active": datetime.utcnow()
            }
        }
    )


async def update_leaderboard(player_id: str, score: int, snake_length: int, db: AsyncIOMotorDatabase):
    """Update leaderboard with new high score"""
    # Get player info
    player = await db.players.find_one({"id": player_id})
    if not player:
        return
    
    # Check if this is a new high score for the leaderboard
    existing_entry = await db.leaderboard.find_one({"player_id": player_id})
    
    if not existing_entry or score > existing_entry["score"]:
        # Remove old entry if exists
        if existing_entry:
            await db.leaderboard.delete_one({"player_id": player_id})
        
        # Add new entry
        leaderboard_entry = LeaderboardEntry(
            player_id=player_id,
            username=player["username"],
            score=score,
            snake_length=snake_length
        )
        await db.leaderboard.insert_one(leaderboard_entry.dict())