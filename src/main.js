let game = null;

const sceneMap = {
    'cat-adventure': () => window.GameScene,
    'turbo-traffic': () => window.TrafficRunnerScene,
    'star-paws-shooter': () => window.ShootingScene,
    'tossing-game': () => window.TossingScene,
    'two-people-race': () => window.TwoPlayerRaceScene
};

function createConfig(sceneClass) {
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
                gravity: { y: 500 },
                debug: false
            }
        },
        scene: sceneClass,
        render: {
            pixelArt: true,
            antialias: false
        }
    };
}

// Start game function called by navigation
function startGame(gameKey = 'cat-adventure') {
    if (game && window.currentRunningGameKey !== gameKey) {
        stopGame();
    }

    if (!game) {
        const sceneFactory = sceneMap[gameKey] || sceneMap['cat-adventure'];
        const sceneClass = sceneFactory ? sceneFactory() : window.GameScene;

        if (!sceneClass) {
            console.error(`Unable to start game: scene for key "${gameKey}" was not found.`);
            return;
        }

        window.currentRunningGameKey = gameKey;
        game = new Phaser.Game(createConfig(sceneClass));

        // Make game accessible globally
        window.currentGameInstance = game;
        window.game = game;
    }
}

// Make startGame available globally
window.startGame = startGame;

// Clean up game instance for restart
function stopGame() {
    if (window.currentGameInstance) {
        try {
            window.currentGameInstance.scene.pause();
            window.currentGameInstance.scene.stop();
        } catch (error) {
            console.warn('Scene pause/stop failed during cleanup:', error);
        }
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
