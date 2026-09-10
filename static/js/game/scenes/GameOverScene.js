/**
 * GameOverScene: Displays run summary, score submission, and quick replay options.
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.runScore = data.score || 0;
        this.runDistance = data.distance || 0;
        this.runCoins = data.coins || 0;
        this.characterSlug = data.characterSlug || 'retro-dash';
        this.scoreSubmitted = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dark Translucent Backdrop
        this.add.rectangle(width / 2, height / 2, width, height, 0x070714, 0.92)
            .setDepth(1);

        // Neon Glow Frame
        const card = this.add.rectangle(width / 2, height / 2 - 20, width - 40, 480, 0x121429, 0.95)
            .setStrokeStyle(2, 0x00e5ff, 0.8)
            .setDepth(2);

        // Title Header
        this.add.text(width / 2, 130, 'RUN FINISHED', {
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ff007f',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(3);

        // Score Highlight Box
        this.add.rectangle(width / 2, 205, width - 80, 75, 0x1a1c38)
            .setStrokeStyle(1, 0xff007f, 0.6)
            .setDepth(3);

        this.add.text(width / 2, 185, 'FINAL SCORE', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#a0aec0',
        }).setOrigin(0.5).setDepth(4);

        this.finalScoreText = this.add.text(width / 2, 218, `${this.runScore}`, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#00e5ff',
        }).setOrigin(0.5).setDepth(4);

        // Stats Row: Distance & Coins
        const statsY = 275;
        this.add.text(width / 2 - 65, statsY, `🏃 ${this.runDistance}m`, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5).setDepth(4);

        this.add.text(width / 2 + 65, statsY, `🪙 +${this.runCoins}`, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffd700',
        }).setOrigin(0.5).setDepth(4);

        // Status Message Text
        this.statusText = this.add.text(width / 2, 320, '', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#00ffaa',
        }).setOrigin(0.5).setDepth(4);

        // Action Buttons
        this.createButtons(width, height);

        // Auto-submit score in background if logged in
        this.handleAutoSubmission();
    }

    createButtons(width, height) {
        // 1. Play Again Button (Primary Glowing Cyan)
        const playBtn = this.createButton(width / 2, 365, 'PLAY AGAIN 🔁', 0x00e5ff, 0x000000, () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.scene.start('GameScene');
        });

        // 2. Submit Score Button
        this.submitBtn = this.createButton(width / 2, 420, 'SUBMIT TO LEADERBOARD 🏆', 0xff007f, 0xffffff, () => {
            this.submitScoreManually();
        });

        // 3. Shop & Leaderboard Quick Links Row
        const shopBtn = this.createSmallButton(width / 2 - 75, 475, '🛍️ SHOP', 0x7928ca, () => {
            if (window.soundEngine) window.soundEngine.playClick();
            if (window.openShopModal) window.openShopModal();
        });

        const leaderBtn = this.createSmallButton(width / 2 + 75, 475, '📊 RANKS', 0x2a2b4a, () => {
            if (window.soundEngine) window.soundEngine.playClick();
            if (window.openLeaderboardModal) window.openLeaderboardModal();
        });
    }

    createButton(x, y, text, bgColor, textColor, callback) {
        const btnContainer = this.add.container(x, y).setDepth(5);
        const bg = this.add.rectangle(0, 0, 260, 42, bgColor, 1)
            .setStrokeStyle(1, 0xffffff, 0.4)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: Phaser.Display.Color.IntegerToColor(textColor).rgba,
        }).setOrigin(0.5);

        btnContainer.add([bg, label]);

        bg.on('pointerover', () => {
            bg.setScale(1.03);
            label.setScale(1.03);
        });

        bg.on('pointerout', () => {
            bg.setScale(1);
            label.setScale(1);
        });

        bg.on('pointerdown', callback);

        return btnContainer;
    }

    createSmallButton(x, y, text, bgColor, callback) {
        const btnContainer = this.add.container(x, y).setDepth(5);
        const bg = this.add.rectangle(0, 0, 115, 36, bgColor, 1)
            .setStrokeStyle(1, 0x00e5ff, 0.5)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        btnContainer.add([bg, label]);

        bg.on('pointerover', () => bg.setScale(1.05));
        bg.on('pointerout', () => bg.setScale(1));
        bg.on('pointerdown', callback);

        return btnContainer;
    }

    async handleAutoSubmission() {
        if (window.runnerApi && window.runnerApi.isAuthenticated() && !this.scoreSubmitted) {
            this.statusText.setText('Submitting score to cloud...');
            const res = await window.runnerApi.submitScore(
                this.runScore,
                this.runCoins,
                this.runDistance,
                this.characterSlug
            );
            if (res.success) {
                this.scoreSubmitted = true;
                const rankText = res.data.rank ? ` (Rank #${res.data.rank})` : '';
                const highText = res.data.is_new_high_score ? ' 🎉 NEW HIGH SCORE!' : '';
                this.statusText.setText(`Score saved!${rankText}${highText}`);
                this.statusText.setColor('#00ffaa');
                if (this.submitBtn) this.submitBtn.setVisible(false);
            }
        }
    }

    async submitScoreManually() {
        if (this.scoreSubmitted) return;

        let guestName = 'Guest Runner';
        if (!window.runnerApi || !window.runnerApi.isAuthenticated()) {
            guestName = prompt('Enter your Runner Codename for the Leaderboard:', 'Guest Runner') || 'Guest Runner';
        }

        this.statusText.setText('Submitting score...');
        const res = await window.runnerApi.submitScore(
            this.runScore,
            this.runCoins,
            this.runDistance,
            this.characterSlug,
            guestName
        );

        if (res.success) {
            this.scoreSubmitted = true;
            const rankText = res.data.rank ? ` Rank #${res.data.rank}!` : '';
            this.statusText.setText(`Score posted!${rankText}`);
            this.statusText.setColor('#00ffaa');
            if (this.submitBtn) this.submitBtn.setVisible(false);
            if (window.soundEngine) window.soundEngine.playCoin();
        } else {
            this.statusText.setText('Submission failed. Try again.');
            this.statusText.setColor('#ff0055');
        }
    }
}

window.GameOverScene = GameOverScene;
