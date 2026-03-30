# Cat Adventure Game 🐱

A fun 2D platformer game where you control a cat trying to reach the door at the end of the level while avoiding enemies!

## How to Play

1. **Open `index.html` in your web browser**
2. **Controls:**
   - **← →** (Arrow Keys): Move left and right
   - **SPACE**: Jump

## Game Mechanics

- **Goal**: Reach the golden door at the end of the level
- **Obstacles**: Red enemy creatures patrol platforms - touch them and it's game over!
- **Difficulty**: The level has multiple platforms at different heights and enemies strategically placed
- **Score**: Complete the level to earn 100 points

## Level Design

The level features:
- A starting platform with a staircase of platforms leading upward
- A mid-level blue platform with the first enemy
- Upper platforms with additional enemies to avoid
- A bridge section with a third enemy
- A final golden door platform to reach the goal

## Game Rules

- Fall off the bottom of the screen = Game Over
- Touch an enemy = Game Over
- Reach the door = Level Complete!
- After winning or losing, the game restarts automatically

## Features

- Smooth controls with responsive jumping mechanics
- Camera follows the player as they progress
- Simple but engaging level layout
- Multiple enemies with different movement patterns
- Visual feedback with cat and enemy character designs

Enjoy! 🎮

## Run Locally

Static-only mode:

1. Open `index.html` directly, or serve the folder with a static server.
2. Cat Adventure, Turbo Traffic, Star Paws Shooter, and local Big 2 all work.

Big 2 backend mode:

1. Run `npm start`
2. Open `http://localhost:8000`
3. The Node server serves the existing site and adds Big 2 lobby APIs at `/api/big2`

Notes:

- The backend powers Big 2 lobby create/join/start and turn-by-turn play sync.
- The other games remain frontend-only and are just served as static files.
- Big 2 now supports server-authoritative turn-by-turn gameplay for remote players sharing the same backend URL.

## Deploy (Recommended: Render Web Service)

This app is most reliable when deployed as a single Node service, because Big 2 needs backend APIs.

Why Render is recommended:

- Runs both static files and Big 2 backend in one service.
- Automatic deploy on push to main.
- Built-in live logs and restart controls.
- Free TLS and stable public URL.

Setup:

1. Push this project to GitHub.
2. Go to Render and click New +, then Web Service.
3. Select repo: alium5203/cat_adventure_game.
4. Render will auto-detect render.yaml in this project.
5. Confirm settings:
   - Build command: npm install
   - Start command: npm start
6. Deploy.

After deploy:

- App URL: https://<your-render-service>.onrender.com
- Health check: https://<your-render-service>.onrender.com/api/big2/health

Live logs:

1. Render Dashboard -> your service -> Logs
2. Tail logs in real time while players create/join/play Big 2 lobbies.

## Other Hosts

- Railway and Fly.io are also good for Node hosting.
- GitHub Pages, Netlify, and Vercel static mode do not run the Big 2 backend routes.
