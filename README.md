# Modern Snake Game - Cyberpunk Edition

A modern take on the classic Snake game with a cyberpunk aesthetic, built with Phaser.js for the game engine and FastAPI for the backend. The game features neon visuals, particle effects, and a MongoDB database for storing player data and high scores.

## Features

- Cyberpunk-themed snake game with neon visuals and particle effects
- Player account system with username creation
- Save and load game progress
- High score leaderboard
- Game statistics tracking
- Export and import player data
- Responsive design that works on various screen sizes

## Project Structure

- `frontend/`: React application and static game files
  - `public/`: Contains the main game files
    - `snake-game.js`: The Phaser.js game implementation
    - `snake-api.js`: API client for communicating with the backend
    - `snake-game.html`: Standalone HTML for the game
  - `src/`: React application files

- `backend/`: FastAPI server and MongoDB integration
  - `server.py`: Main FastAPI application
  - `game_routes.py`: API endpoints for the game
  - `models.py`: Pydantic models for data validation
  - `database.py`: MongoDB connection and initialization

## Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB

You can check if you have all the required dependencies installed by running:

- On Windows:
  ```
  check_dependencies.bat
  ```

- On Linux/Mac:
  ```
  chmod +x check_dependencies.sh
  ./check_dependencies.sh
  ```

## Setup and Running

### Quick Start with Development Scripts

For convenience, development scripts are provided to set up the entire environment with a single command:

- On Windows:
  ```
  dev.bat
  ```

- On Linux/Mac:
  ```
  chmod +x dev.sh
  ./dev.sh
  ```

These scripts will start MongoDB, the backend server, and the frontend development server simultaneously.

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Make sure MongoDB is running on your system or update the `.env` file with your MongoDB connection string.

4. Start the backend server:
   ```
   python server.py
   ```
   The server will run on http://localhost:8000 by default.

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. For development, start the development server:
   ```
   yarn start
   ```
   The development server will run on http://localhost:3000 by default.

4. For production, build the frontend:
   ```
   yarn build
   ```

## Deployment

### Local Deployment

#### Standard Deployment

The application is designed to be deployed as a single unit, with the backend serving the frontend static files.

1. Build the frontend as described above.

2. Start the backend server, which will serve both the API and the frontend:
   ```
   cd backend
   python server.py
   ```

3. Access the application at http://localhost:8000

#### Quick Run (After Deployment)

To quickly run the application after it has been deployed:

- On Windows:
  ```
  run.bat
  ```

- On Linux/Mac:
  ```
  chmod +x run.sh
  ./run.sh
  ```

This will start MongoDB, the backend server, and open the application in your default browser.

#### Using Deployment Scripts

For convenience, deployment scripts are provided:

- On Linux/Mac:
  ```
  chmod +x deploy.sh
  ./deploy.sh
  ```

- On Windows:
  ```
  deploy.bat
  ```

#### Docker Deployment

The easiest way to deploy the application is using Docker and Docker Compose:

1. Make sure Docker and Docker Compose are installed on your system.

2. Build and start the containers:
   ```
   docker-compose up -d
   ```

3. Access the application at http://localhost:8000

4. To stop the containers:
   ```
   docker-compose down
   ```

### Cloud Deployment

#### Render Deployment

This project can be easily deployed to [Render](https://render.com), a cloud platform that offers free hosting for web applications.

For detailed instructions, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

We've included several files to make Render deployment easier:
- `render.yaml` - Blueprint configuration for Render
- `.env.sample` - Template for required environment variables
- `Procfile` - Process file for web service
- `runtime.txt` - Specifies Python version
- `requirements.txt` - Python dependencies
- `build.sh` - Build script for deployment
- `render_deploy.sh` - Helper script to prepare your repository
- `RENDER_DEPLOYMENT.md` - Detailed deployment instructions
- `RENDER_TROUBLESHOOTING.md` - Solutions for common deployment issues

Key deployment steps:
1. Create a MongoDB Atlas cluster
2. Update environment variables
3. Push your code to a Git repository
4. Deploy using Render's Blueprint feature or Web Service option
5. Configure environment variables in the Render dashboard

## Maintenance

### Cleaning the Project

To clean up the project (remove node_modules, build directories, etc.) for a fresh start:

- On Windows:
  ```
  clean.bat
  ```

- On Linux/Mac:
  ```
  chmod +x clean.sh
  ./clean.sh
  ```

This will remove:
- Frontend node_modules and build directories
- Backend __pycache__ directories
- MongoDB data directories
- Python cache files

## Environment Variables

### Backend (.env)

- `MONGO_URL`: MongoDB connection string (default: "mongodb://localhost:27017")
- `DB_NAME`: Database name (default: "snake_game_db")
- `PORT`: Port for the API server (default: 8000)

### Frontend (.env)

- `REACT_APP_BACKEND_URL`: URL for the backend API (empty by default, will use the current origin)

## Game Controls

- **WASD / Arrow Keys**: Move the snake
- **Space / Click**: Activate speed boost
- **P**: Pause the game

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.