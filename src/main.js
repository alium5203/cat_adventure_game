const gameConfigs = {
    'cat-adventure': {
        scene: GameScene,
        gravityY: 500
    },
    'turbo-traffic': {
        scene: TrafficRunnerScene,
        gravityY: 0
    }
};

let game = null;

function createConfig(gameKey) {
    const selectedConfig = gameConfigs[gameKey] || gameConfigs['cat-adventure'];

    return {
        type: Phaser.AUTO,
        parent: 'game-container',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1200,
            height: 600
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: selectedConfig.gravityY },
                debug: false
            }
        },
        scene: selectedConfig.scene,
        render: {
            pixelArt: true,
            antialias: false
        }
    };
}

// Start game function called by navigation
function startGame(gameKey = null) {
    const selectedGameKey = gameKey || (window.getActiveGameKey ? window.getActiveGameKey() : 'cat-adventure');

    if (game && window.currentRunningGameKey === selectedGameKey) {
        return;
    }

    if (game) {
        stopGame();
    }

    const config = createConfig(selectedGameKey);
    game = new Phaser.Game(config);
    window.currentRunningGameKey = selectedGameKey;
    window.currentGameInstance = game;
    window.game = game;
}

// Make startGame available globally
window.startGame = startGame;

// Clean up game instance for restart
function stopGame() {
    if (window.currentGameInstance) {
        window.currentGameInstance.scene.pause();
        window.currentGameInstance.scene.stop();
        window.currentGameInstance.destroy(true);
        window.currentGameInstance = null;
    }
    if (window.game) {
        window.game.destroy(true);
        window.game = null;
    }
    game = null;
    window.currentRunningGameKey = null;
}

window.stopGame = stopGame;
