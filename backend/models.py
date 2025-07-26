from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


class GameState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    score: int
    high_score: int
    snake_positions: List[Dict[str, int]]
    food_position: Dict[str, int]
    direction: Dict[str, int]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    game_speed: int = 150
    is_active: bool = True


class GameStateCreate(BaseModel):
    player_id: str
    score: int
    high_score: int
    snake_positions: List[Dict[str, int]]
    food_position: Dict[str, int]
    direction: Dict[str, int]
    game_speed: int = 150


class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: Optional[str] = None
    total_games_played: int = 0
    highest_score: int = 0
    total_score: int = 0
    longest_snake: int = 3
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)


class PlayerCreate(BaseModel):
    username: str
    email: Optional[str] = None


class PlayerUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    total_games_played: Optional[int] = None
    highest_score: Optional[int] = None
    total_score: Optional[int] = None
    longest_snake: Optional[int] = None


class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    score: int
    snake_length: int
    duration_seconds: int
    food_eaten: int
    speed_boosts_used: int
    game_ended_reason: str  # "wall_collision", "self_collision", "quit"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class GameSessionCreate(BaseModel):
    player_id: str
    score: int
    snake_length: int
    duration_seconds: int
    food_eaten: int
    speed_boosts_used: int
    game_ended_reason: str


class LeaderboardEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    username: str
    score: int
    snake_length: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    rank: Optional[int] = None


class GameStatistics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    total_games: int = 0
    total_score: int = 0
    average_score: float = 0.0
    highest_score: int = 0
    longest_snake: int = 3
    total_food_eaten: int = 0
    total_play_time_seconds: int = 0
    speed_boosts_used: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class GameStatisticsUpdate(BaseModel):
    total_games: Optional[int] = None
    total_score: Optional[int] = None
    average_score: Optional[float] = None
    highest_score: Optional[int] = None
    longest_snake: Optional[int] = None
    total_food_eaten: Optional[int] = None
    total_play_time_seconds: Optional[int] = None
    speed_boosts_used: Optional[int] = None


class GameExport(BaseModel):
    player_id: str
    username: str
    statistics: GameStatistics
    recent_sessions: List[GameSession]
    saved_game_state: Optional[GameState] = None
    export_timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"


class GameImport(BaseModel):
    player_id: str
    export_data: Dict[str, Any]
    import_timestamp: datetime = Field(default_factory=datetime.utcnow)


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None