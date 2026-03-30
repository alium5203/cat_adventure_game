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

## Deploy (GitHub Pages)

This project is static (HTML/CSS/JS), so it is ready for GitHub Pages.

1. Push this project to a GitHub repository.
2. Keep the default branch as `main`.
3. In GitHub: `Settings` -> `Pages` -> `Build and deployment` -> `Source: GitHub Actions`.
4. Push any commit to `main`.
5. GitHub Actions will run `.github/workflows/deploy-pages.yml` and publish the site.

Your live URL will be:

`https://<your-github-username>.github.io/<your-repo-name>/`

## Quick Alternative Deploy Options

- Netlify: drag and drop the project folder.
- Vercel: import the repo as a static site.

If you want Big 2 backend lobbies online for other devices, deploy `server.js` to a Node-capable host instead of a static-only host.
