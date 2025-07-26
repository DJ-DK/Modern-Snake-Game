// Neon Snake Game - Cyberpunk Edition with Backend Integration
class NeonSnakeGame {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'gameContainer',
            backgroundColor: '#0a0a0f',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [LoadingScene, GameScene]
        };

        // Game state
        this.gameData = {
            score: 0,
            highScore: 0,
            snake: [],
            food: null,
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            gameRunning: false,
            isPaused: false,
            speedBoost: false,
            gameSpeed: 150,
            normalSpeed: 150,
            boostSpeed: 75,
            gameStartTime: null,
            foodEaten: 0,
            speedBoostsUsed: 0
        };

        // Initialize API
        this.api = new SnakeAPI();
        this.currentPlayer = null;

        this.init();
    }

    async init() {
        // Initialize Phaser game
        this.game = new Phaser.Game(this.config);
        
        // Initialize player
        await this.initializePlayer();
        
        // Setup loading screen
        this.setupLoadingScreen();
        
        // Setup UI events
        this.setupUIEvents();
        
        // Setup keyboard controls
        this.setupControls();
    }

    async initializePlayer() {
        try {
            this.currentPlayer = await this.api.initializePlayer();
            console.log('Player initialized:', this.currentPlayer);
            
            // Load high score from server
            const stats = await this.api.getPlayerStatistics();
            this.gameData.highScore = stats.highest_score || 0;
            
        } catch (error) {
            console.error('Failed to initialize player:', error);
            // Fallback to local storage
            this.gameData.highScore = this.loadHighScore();
        }
    }

    setupLoadingScreen() {
        const loadingSteps = [
            "Initializing quantum grid...",
            "Loading neon particles...",
            "Calibrating snake AI...",
            "Syncing cyberpunk aesthetics...",
            "Ready to play!"
        ];

        let currentStep = 0;
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        const startButton = document.getElementById('startButton');

        const loadingInterval = setInterval(() => {
            const progress = (currentStep + 1) * 20;
            loadingBar.style.width = progress + '%';
            
            if (currentStep < loadingSteps.length - 1) {
                loadingText.textContent = loadingSteps[currentStep + 1];
                currentStep++;
            } else {
                clearInterval(loadingInterval);
                loadingText.textContent = "System ready!";
                startButton.style.display = 'block';
                startButton.onclick = () => this.startGame();
            }
        }, 800);
    }

    setupUIEvents() {
        // Game Over Screen
        document.getElementById('playAgainBtn').onclick = () => this.restartGame();
        document.getElementById('saveGameBtn').onclick = () => this.saveGame();
        document.getElementById('loadGameBtn').onclick = () => this.loadGame();

        // Pause Menu
        document.getElementById('resumeBtn').onclick = () => this.resumeGame();
        document.getElementById('saveBtn').onclick = () => this.saveAndQuit();
        document.getElementById('exportBtn').onclick = () => this.exportGameData();

        // Speed boost indicators
        this.speedBoostIndicator = document.getElementById('speedBoostIndicator');
        this.scoreDisplay = document.getElementById('currentScore');
        this.highScoreDisplay = document.getElementById('highScore');
        
        // Update high score display
        this.highScoreDisplay.textContent = this.gameData.highScore;
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (!this.gameData.gameRunning && event.code !== 'KeyP') return;

            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    if (this.gameData.direction.y !== 1) {
                        this.gameData.nextDirection = { x: 0, y: -1 };
                    }
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    if (this.gameData.direction.y !== -1) {
                        this.gameData.nextDirection = { x: 0, y: 1 };
                    }
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    if (this.gameData.direction.x !== 1) {
                        this.gameData.nextDirection = { x: -1, y: 0 };
                    }
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    if (this.gameData.direction.x !== -1) {
                        this.gameData.nextDirection = { x: 1, y: 0 };
                    }
                    break;
                case 'Space':
                    event.preventDefault();
                    this.activateSpeedBoost();
                    break;
                case 'KeyP':
                    this.togglePause();
                    break;
            }
        });

        // Release speed boost
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                this.deactivateSpeedBoost();
            }
        });

        // Mouse controls for speed boost
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.gameData.gameRunning) {
                this.activateSpeedBoost();
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.deactivateSpeedBoost();
            }
        });
    }

    startGame() {
        document.getElementById('loadingScreen').classList.add('hidden');
        this.resetGame();
        this.gameData.gameRunning = true;
    }

    resetGame() {
        this.gameData.score = 0;
        this.gameData.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.gameData.direction = { x: 1, y: 0 };
        this.gameData.nextDirection = { x: 1, y: 0 };
        this.gameData.gameRunning = true;
        this.gameData.isPaused = false;
        this.gameData.speedBoost = false;
        this.gameData.gameSpeed = this.gameData.normalSpeed;
        this.gameData.gameStartTime = Date.now();
        this.gameData.foodEaten = 0;
        this.gameData.speedBoostsUsed = 0;
        
        this.updateScore();
        this.spawnFood();
        this.hideGameOver();
    }

    restartGame() {
        this.hideGameOver();
        this.resetGame();
    }

    updateScore() {
        this.scoreDisplay.textContent = this.gameData.score;
        if (this.gameData.score > this.gameData.highScore) {
            this.gameData.highScore = this.gameData.score;
            this.highScoreDisplay.textContent = this.gameData.highScore;
            this.saveHighScore();
        }
    }

    spawnFood() {
        const gridWidth = Math.floor(window.innerWidth / 20);
        const gridHeight = Math.floor(window.innerHeight / 20);
        
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
        } while (this.isPositionOccupied(foodPosition));

        this.gameData.food = foodPosition;
    }

    isPositionOccupied(position) {
        return this.gameData.snake.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    activateSpeedBoost() {
        if (!this.gameData.gameRunning || this.gameData.isPaused) return;
        
        this.gameData.speedBoost = true;
        this.gameData.gameSpeed = this.gameData.boostSpeed;
        this.gameData.speedBoostsUsed++;
        this.speedBoostIndicator.classList.add('active');
    }

    deactivateSpeedBoost() {
        this.gameData.speedBoost = false;
        this.gameData.gameSpeed = this.gameData.normalSpeed;
        this.speedBoostIndicator.classList.remove('active');
    }

    togglePause() {
        if (!this.gameData.gameRunning) return;
        
        this.gameData.isPaused = !this.gameData.isPaused;
        document.getElementById('pauseMenu').classList.toggle('visible', this.gameData.isPaused);
    }

    resumeGame() {
        this.gameData.isPaused = false;
        document.getElementById('pauseMenu').classList.remove('visible');
    }

    async gameOver() {
        this.gameData.gameRunning = false;
        this.gameData.isPaused = false;
        document.getElementById('finalScore').textContent = this.gameData.score;
        document.getElementById('gameOverScreen').classList.add('visible');
        this.deactivateSpeedBoost();

        // Record game session on server
        await this.recordGameSession('game_over');
    }

    hideGameOver() {
        document.getElementById('gameOverScreen').classList.remove('visible');
    }

    // Save/Load System (Backend Integration)
    async saveGame() {
        if (!this.currentPlayer) {
            this.showNotification('Please wait, initializing player...', '#ff006f');
            return;
        }

        try {
            const gameStateData = {
                score: this.gameData.score,
                highScore: this.gameData.highScore,
                snake: this.gameData.snake,
                food: this.gameData.food,
                direction: this.gameData.direction,
                gameSpeed: this.gameData.gameSpeed
            };

            await this.api.saveGameState(gameStateData);
            this.showNotification('Game saved successfully!', '#00ffff');
        } catch (error) {
            console.error('Save game error:', error);
            this.showNotification('Failed to save game!', '#ff006f');
        }
    }

    async loadGame() {
        if (!this.currentPlayer) {
            this.showNotification('Please wait, initializing player...', '#ff006f');
            return;
        }

        try {
            const gameState = await this.api.loadGameState();
            
            this.gameData.score = gameState.score;
            this.gameData.highScore = gameState.high_score;
            this.gameData.snake = gameState.snake_positions;
            this.gameData.food = gameState.food_position;
            this.gameData.direction = gameState.direction;
            this.gameData.nextDirection = { ...gameState.direction };
            this.gameData.gameSpeed = gameState.game_speed || 150;
            
            this.updateScore();
            this.hideGameOver();
            this.gameData.gameRunning = true;
            this.showNotification('Game loaded successfully!', '#00ffff');
        } catch (error) {
            console.error('Load game error:', error);
            this.showNotification('No saved game found!', '#ff006f');
        }
    }

    async saveAndQuit() {
        await this.saveGame();
        await this.recordGameSession('quit');
        this.gameData.gameRunning = false;
        this.gameData.isPaused = false;
        document.getElementById('pauseMenu').classList.remove('visible');
        this.gameOver();
    }

    async exportGameData() {
        if (!this.currentPlayer) {
            this.showNotification('Please wait, initializing player...', '#ff006f');
            return;
        }

        try {
            const exportData = await this.api.exportPlayerData();
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type:'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `neon-snake-data-${this.currentPlayer.username}-${new Date().getTime()}.json`;
            link.click();

            this.showNotification('Game data exported!', '#00ffff');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export data!', '#ff006f');
        }
    }

    async recordGameSession(endReason = 'unknown') {
        if (!this.currentPlayer) return;

        try {
            const duration = this.gameData.gameStartTime ? 
                Math.floor((Date.now() - this.gameData.gameStartTime) / 1000) : 0;

            const sessionData = {
                score: this.gameData.score,
                snakeLength: this.gameData.snake.length,
                duration: duration,
                foodEaten: this.gameData.foodEaten,
                speedBoostsUsed: this.gameData.speedBoostsUsed,
                endReason: endReason
            };

            await this.api.recordGameSession(sessionData);
            
            // Update high score from statistics
            const stats = await this.api.getPlayerStatistics();
            this.gameData.highScore = stats.highest_score || 0;
            this.highScoreDisplay.textContent = this.gameData.highScore;
            
        } catch (error) {
            console.error('Failed to record game session:', error);
        }
    }

    // Mock statistics methods (now backed by server)
    async getTotalGamesPlayed() {
        try {
            const stats = await this.api.getPlayerStatistics();
            return stats.total_games || 0;
        } catch (error) {
            return parseInt(localStorage.getItem('neonSnakeTotalGames') || '0');
        }
    }

    async getAverageScore() {
        try {
            const stats = await this.api.getPlayerStatistics();
            return Math.round(stats.average_score || 0);
        } catch (error) {
            const totalGames = parseInt(localStorage.getItem('neonSnakeTotalGames') || '0');
            const totalScore = parseInt(localStorage.getItem('neonSnakeTotalScore') || '0');
            return totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
        }
    }

    async getLongestSnake() {
        try {
            const stats = await this.api.getPlayerStatistics();
            return stats.longest_snake || 3;
        } catch (error) {
            return parseInt(localStorage.getItem('neonSnakeLongestSnake') || '3');
        }
    }

    saveHighScore() {
        // High scores are now automatically managed by the backend
        // Keep local storage as fallback
        localStorage.setItem('neonSnakeHighScore', this.gameData.highScore.toString());
    }

    loadHighScore() {
        return parseInt(localStorage.getItem('neonSnakeHighScore') || '0');
    }

    showNotification(message, color = '#00ffff') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${color};
            padding: 20px 30px;
            border: 2px solid ${color};
            border-radius: 5px;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            font-size: 1.2rem;
            text-shadow: 0 0 10px ${color};
            box-shadow: 0 0 20px ${color}40;
            z-index: 2000;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Loading Scene
class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Create loading graphics
        this.cameras.main.setBackgroundColor('#0a0a0f');
    }

    create() {
        // Transition to game scene after a short delay
        this.time.delayedCall(100, () => {
            this.scene.start('GameScene');
        });
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.snake = [];
        this.food = null;
        this.cursors = null;
        this.gameLoop = null;
        this.particleEmitters = [];
    }

    create() {
        // Get reference to main game instance
        this.neonGame = window.neonSnakeGame;
        
        // Setup graphics
        this.setupGraphics();
        
        // Create particle systems
        this.createParticleEffects();
        
        // Start game loop
        this.startGameLoop();
        
        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    }

    setupGraphics() {
        // Create grid background effect
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x003333, 0.3);
        
        for (let x = 0; x < this.cameras.main.width; x += 20) {
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, this.cameras.main.height);
        }
        
        for (let y = 0; y < this.cameras.main.height; y += 20) {
            gridGraphics.moveTo(0, y);
            gridGraphics.lineTo(this.cameras.main.width, y);
        }
        
        gridGraphics.strokePath();
    }

    createParticleEffects() {
        // Food particle effect
        this.foodParticles = this.add.particles(0, 0, 'foodParticle', {
            scale: { start: 0.3, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            quantity: 3,
            emitting: false
        });
    }

    startGameLoop() {
        if (this.gameLoop) {
            this.gameLoop.destroy();
        }
        
        this.gameLoop = this.time.addEvent({
            delay: () => this.neonGame.gameData.gameSpeed,
            callback: this.updateGame,
            callbackScope: this,
            loop: true
        });
    }

    updateGame() {
        if (!this.neonGame.gameData.gameRunning || this.neonGame.gameData.isPaused) {
            return;
        }

        // Update direction
        this.neonGame.gameData.direction = { ...this.neonGame.gameData.nextDirection };
        
        // Move snake
        const head = { ...this.neonGame.gameData.snake[0] };
        head.x += this.neonGame.gameData.direction.x;
        head.y += this.neonGame.gameData.direction.y;
        
        // Check wall collision
        const gridWidth = Math.floor(this.cameras.main.width / 20);
        const gridHeight = Math.floor(this.cameras.main.height / 20);
        
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            this.handleGameOver();
            return;
        }
        
        // Check self collision
        if (this.neonGame.gameData.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.handleGameOver();
            return;
        }
        
        this.neonGame.gameData.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.neonGame.gameData.food.x && head.y === this.neonGame.gameData.food.y) {
            this.neonGame.gameData.score += 10;
            this.neonGame.gameData.foodEaten++;
            if (this.neonGame.gameData.speedBoost) {
                this.neonGame.gameData.score += 5; // Bonus for eating while boosting
            }
            this.neonGame.updateScore();
            this.neonGame.spawnFood();
            this.createFoodEffect(head.x * 20, head.y * 20);
        } else {
            this.neonGame.gameData.snake.pop();
        }
        
        // Render game
        this.renderGame();
    }

    renderGame() {
        // Clear previous graphics
        if (this.gameGraphics) {
            this.gameGraphics.clear();
        } else {
            this.gameGraphics = this.add.graphics();
        }
        
        // Draw snake with neon glow
        const glowIntensity = this.neonGame.gameData.speedBoost ? 0.8 : 0.4;
        
        this.neonGame.gameData.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const color = isHead ? 0x00ffff : 0x0099cc;
            const size = isHead ? 18 : 16;
            
            // Outer glow
            this.gameGraphics.fillStyle(color, glowIntensity);
            this.gameGraphics.fillRoundedRect(
                segment.x * 20 - 2, 
                segment.y * 20 - 2, 
                size + 4, 
                size + 4, 
                4
            );
            
            // Inner core
            this.gameGraphics.fillStyle(color, 1);
            this.gameGraphics.fillRoundedRect(
                segment.x * 20, 
                segment.y * 20, 
                size, 
                size, 
                2
            );
        });
        
        // Draw food with pulsing effect
        if (this.neonGame.gameData.food) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            const foodColor = 0xff006f;
            
            // Outer glow
            this.gameGraphics.fillStyle(foodColor, pulse * 0.6);
            this.gameGraphics.fillCircle(
                this.neonGame.gameData.food.x * 20 + 10,
                this.neonGame.gameData.food.y * 20 + 10,
                12
            );
            
            // Inner core
            this.gameGraphics.fillStyle(foodColor, 1);
            this.gameGraphics.fillCircle(
                this.neonGame.gameData.food.x * 20 + 10,
                this.neonGame.gameData.food.y * 20 + 10,
                8
            );
        }
    }

    createFoodEffect(x, y) {
        // Create particle burst effect when food is eaten
        const particles = this.add.particles(x + 10, y + 10);
        
        particles.createEmitter({
            scale: { start: 0.5, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 300,
            quantity: 8,
            tint: [0xff006f, 0x00ffff]
        });
        
        // Remove particles after effect
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    handleGameOver() {
        this.neonGame.gameOver();
        
        // Create explosion effect
        if (this.neonGame.gameData.snake.length > 0) {
            const head = this.neonGame.gameData.snake[0];
            this.createExplosionEffect(head.x * 20 + 10, head.y * 20 + 10);
        }
    }

    createExplosionEffect(x, y) {
        const particles = this.add.particles(x, y);
        
        particles.createEmitter({
            scale: { start: 0.8, end: 0 },
            speed: { min: 200, max: 400 },
            lifespan: 600,
            quantity: 15,
            tint: [0xff006f, 0x00ffff, 0xffffff]
        });
        
        this.time.delayedCall(800, () => {
            particles.destroy();
        });
    }
}

// CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.neonSnakeGame = new NeonSnakeGame();
});