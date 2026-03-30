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

## Deploy (Heroku)

This app runs best as a Node web dyno so the Big 2 backend routes stay online.

Prerequisites:

- Heroku CLI installed
- Logged in with `heroku login`

Deploy steps:

1. From project root (`cat-game`), create app:
   - `heroku create <your-app-name>`
2. Push main branch:
   - `git push heroku main`
3. Open app:
   - `heroku open`

Public URL:

- `https://<your-app-name>.herokuapp.com`
- Health check: `https://<your-app-name>.herokuapp.com/api/big2/health`

Live logs:

- Stream logs: `heroku logs --tail -a <your-app-name>`

Notes:

- `Procfile` is included (`web: npm start`).
- Server listens on `process.env.PORT`, which Heroku injects.

## Other Hosts

- Render, Railway, Fly.io, and AWS Lightsail are also good Node hosting options.
- GitHub Pages, Netlify, and Vercel static mode do not run the Big 2 backend routes.
