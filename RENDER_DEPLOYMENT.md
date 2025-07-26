# Deploying Modern Snake Game on Render

## Prerequisites

- [Render](https://render.com) account
- Git repository with your code
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

## Step 1: Set Up MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Set up a database user
4. Configure network access (0.0.0.0/0)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   ```

## Step 2: Prepare Your Application

1. Update `backend/.env` file:
   ```
   MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   DB_NAME=snake_game_db
   PORT=10000
   ```

2. Create `.env.sample` file:
   ```
   MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   DB_NAME=snake_game_db
   PORT=10000
   ```

3. Create `render.yaml` file:
   ```yaml
   services:
     - type: web
       name: modern-snake-game
       env: python
       buildCommand: |
         cd frontend && yarn install && yarn build && cd .. && 
         cd backend && pip install -r requirements.txt
       startCommand: cd backend && python server.py
       envVars:
         - key: MONGO_URL
           sync: false
         - key: DB_NAME
           value: snake_game_db
       healthCheckPath: /api/status
   ```

4. Create `requirements.txt` file:
   ```
   fastapi==0.95.1
   uvicorn==0.22.0
   motor==3.1.2
   python-dotenv==1.0.0
   pydantic==1.10.7
   ```

5. Create `runtime.txt` file:
   ```
   python-3.9.16
   ```

6. Create `Procfile`:
   ```
   web: cd backend && python server.py
   ```

7. Create `build.sh` script:
   ```bash
   #!/bin/bash
   cd frontend
   yarn install
   yarn build
   cd ..
   cd backend
   pip install -r requirements.txt
   cd ..
   pip install -r requirements.txt
   ```
   Make it executable: `chmod +x build.sh`

## Step 3: Deploy to Render

### Option 1: Blueprint (Recommended)

1. Log in to Render
2. Click "New +" → "Blueprint"
3. Connect Git repository
4. Set environment variables:
   - `MONGO_URL`: MongoDB Atlas connection string
   - `DB_NAME`: snake_game_db
5. Click "Apply"

### Option 2: Web Service

1. Log in to Render
2. Click "New +" → "Web Service"
3. Connect Git repository
4. Configure service:
   - **Name**: modern-snake-game
   - **Environment**: Python
   - **Build Command**: `./build.sh`
   - **Start Command**: `cd backend && python server.py`
5. Add environment variables:
   - `MONGO_URL`: MongoDB Atlas connection string
   - `DB_NAME`: snake_game_db
6. Click "Create Web Service"

## Step 4: Monitor Deployment

1. Monitor build process in Render dashboard
2. Check logs for any issues

## Step 5: Verify Deployment

1. Visit the provided URL (e.g., `https://modern-snake-game.onrender.com`)
2. Test game functionality
3. Check logs for any errors

## Troubleshooting

Refer to [RENDER_TROUBLESHOOTING.md](RENDER_TROUBLESHOOTING.md) for detailed help.

Common steps:
- Check build logs for errors
- Verify MongoDB connection string
- Ensure MongoDB network access is configured
- Test build process locally

## Additional Configuration

### Custom Domain
1. Go to web service → "Settings" → "Custom Domain"

### Auto-Deploy
1. Configure in Render dashboard

### Scaling
1. Upgrade Render plan for more resources

## Conclusion

Your Modern Snake Game is now deployed on Render and accessible worldwide.