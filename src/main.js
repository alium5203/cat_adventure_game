const config = {
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
    scene: GameScene,
    render: {
        pixelArt: true,
        antialias: false
    }
};

let game = null;

// Start game function called by navigation
function startGame() {
    if (!game) {
        game = new Phaser.Game(config);
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
}

window.stopGame = stopGame;
