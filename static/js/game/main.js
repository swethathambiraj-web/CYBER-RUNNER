/**
 * Main Phaser Game Initializer & Lifecycle Manager
 */
document.addEventListener('DOMContentLoaded', () => {
    const config = {
        type: Phaser.AUTO,
        parent: 'phaser-game-container',
        width: 480,
        height: 720,
        backgroundColor: '#0a0a14',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 480,
            height: 720,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false,
            },
        },
        scene: [BootScene, GameScene, GameOverScene],
    };

    window.game = new Phaser.Game(config);

    // Global helper to restart game
    window.restartGame = () => {
        if (window.game && window.game.scene) {
            window.game.scene.stop('GameOverScene');
            window.game.scene.start('GameScene');
        }
    };
});
