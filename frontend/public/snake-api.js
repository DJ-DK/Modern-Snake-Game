// API Service for Neon Snake Game
class SnakeAPI {
    constructor() {
        // Use the current origin for the API URL in production
        // This allows the app to work when deployed to any domain
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000/api' 
            : `${window.location.origin}/api`;
        this.currentPlayer = null;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Player Management
    async createPlayer(username, email = null) {
        const playerData = { username };
        if (email) playerData.email = email;
        
        const player = await this.request('/game/players', {
            method: 'POST',
            body: playerData
        });
        
        this.currentPlayer = player;
        localStorage.setItem('neonSnakePlayer', JSON.stringify(player));
        return player;
    }

    async getPlayer(playerId) {
        return await this.request(`/game/players/${playerId}`);
    }

    async getPlayerByUsername(username) {
        return await this.request(`/game/players/username/${username}`);
    }

    async updatePlayer(playerId, updateData) {
        const updated = await this.request(`/game/players/${playerId}`, {
            method: 'PUT',
            body: updateData
        });
        
        if (this.currentPlayer && this.currentPlayer.id === playerId) {
            this.currentPlayer = updated;
            localStorage.setItem('neonSnakePlayer', JSON.stringify(updated));
        }
        
        return updated;
    }

    // Game State Management
    async saveGameState(gameStateData) {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        const stateToSave = {
            player_id: this.currentPlayer.id,
            score: gameStateData.score,
            high_score: gameStateData.highScore,
            snake_positions: gameStateData.snake,
            food_position: gameStateData.food,
            direction: gameStateData.direction,
            game_speed: gameStateData.gameSpeed || 150
        };

        return await this.request('/game/save-game', {
            method: 'POST',
            body: stateToSave
        });
    }

    async loadGameState() {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/load-game/${this.currentPlayer.id}`);
    }

    async deleteGameState() {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/game-state/${this.currentPlayer.id}`, {
            method: 'DELETE'
        });
    }

    // Game Session Management
    async recordGameSession(sessionData) {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        const sessionToRecord = {
            player_id: this.currentPlayer.id,
            score: sessionData.score,
            snake_length: sessionData.snakeLength,
            duration_seconds: sessionData.duration || 0,
            food_eaten: sessionData.foodEaten || 0,
            speed_boosts_used: sessionData.speedBoostsUsed || 0,
            game_ended_reason: sessionData.endReason || 'unknown'
        };

        return await this.request('/game/sessions', {
            method: 'POST',
            body: sessionToRecord
        });
    }

    async getPlayerSessions(limit = 10) {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/sessions/${this.currentPlayer.id}?limit=${limit}`);
    }

    // Leaderboard
    async getLeaderboard(limit = 50) {
        return await this.request(`/game/leaderboard?limit=${limit}`);
    }

    async getPlayerLeaderboardPosition() {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/leaderboard/player/${this.currentPlayer.id}`);
    }

    // Statistics
    async getPlayerStatistics() {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/statistics/${this.currentPlayer.id}`);
    }

    // Export/Import
    async exportPlayerData() {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/export/${this.currentPlayer.id}`);
    }

    async importPlayerData(exportData) {
        if (!this.currentPlayer) {
            throw new Error('No active player');
        }

        return await this.request(`/game/import/${this.currentPlayer.id}`, {
            method: 'POST',
            body: { export_data: exportData }
        });
    }

    // Local player management
    getCurrentPlayer() {
        if (!this.currentPlayer) {
            const stored = localStorage.getItem('neonSnakePlayer');
            if (stored) {
                this.currentPlayer = JSON.parse(stored);
            }
        }
        return this.currentPlayer;
    }

    async initializePlayer(username = null) {
        // Try to get existing player from localStorage
        const storedPlayer = localStorage.getItem('neonSnakePlayer');
        if (storedPlayer) {
            this.currentPlayer = JSON.parse(storedPlayer);
            try {
                // Verify player still exists on server
                await this.getPlayer(this.currentPlayer.id);
                return this.currentPlayer;
            } catch (error) {
                // Player doesn't exist on server, remove from localStorage
                localStorage.removeItem('neonSnakePlayer');
                this.currentPlayer = null;
            }
        }

        // Create new player if none exists
        if (!this.currentPlayer) {
            const playerName = username || `Player_${Date.now()}`;
            try {
                return await this.createPlayer(playerName);
            } catch (error) {
                // If username exists, try with a timestamp
                if (error.message.includes('already exists')) {
                    return await this.createPlayer(`${playerName}_${Date.now()}`);
                }
                throw error;
            }
        }

        return this.currentPlayer;
    }

    clearCurrentPlayer() {
        this.currentPlayer = null;
        localStorage.removeItem('neonSnakePlayer');
    }

    // Utility methods for backwards compatibility
    async getHighScore() {
        try {
            const stats = await this.getPlayerStatistics();
            return stats.highest_score || 0;
        } catch (error) {
            console.warn('Could not fetch high score from server:', error);
            return parseInt(localStorage.getItem('neonSnakeHighScore') || '0');
        }
    }

    async setHighScore(score) {
        // This will be handled automatically when recording game sessions
        // But we'll keep local storage as backup
        localStorage.setItem('neonSnakeHighScore', score.toString());
    }
}

// Export for use in main game
window.SnakeAPI = SnakeAPI;