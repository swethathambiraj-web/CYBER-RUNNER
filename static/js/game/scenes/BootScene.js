/**
 * BootScene: Initializes textures, animations, and transitions to gameplay
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate procedural textures for characters, obstacles, items, and environment
        window.TextureGenerator.generateAll(this);

        // Register running animations for each skin
        const skinKeys = ['retro-dash', 'neon-cyberpunk', 'shadow-ninja', 'golden-king', 'mecha-bot'];
        skinKeys.forEach(skinKey => {
            const animKey = `run_${skinKey}`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: [
                        { key: `runner_${skinKey}_run_0` },
                        { key: `runner_${skinKey}_run_1` },
                        { key: `runner_${skinKey}_run_2` },
                        { key: `runner_${skinKey}_run_3` },
                    ],
                    frameRate: 10,
                    repeat: -1,
                });
            }
        });

        // Register Coin rotation animation
        if (!this.anims.exists('coin_spin')) {
            this.anims.create({
                key: 'coin_spin',
                frames: [
                    { key: 'coin_0' },
                    { key: 'coin_1' },
                    { key: 'coin_2' },
                    { key: 'coin_3' },
                ],
                frameRate: 8,
                repeat: -1,
            });
        }

        // Fetch user profile if logged in
        if (window.runnerApi) {
            window.runnerApi.getProfile();
        }

        // Transition to Title / Ready state or straight into GameScene
        this.scene.start('GameScene');
    }
}

window.BootScene = BootScene;
