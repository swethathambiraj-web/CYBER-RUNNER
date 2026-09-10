/**
 * GameScene: Core 3-Lane Endless Runner Engine (Phaser 3)
 * Full support for Left/Right Lane switching, Jump (arc & hurdle immunity), and Slide (crouch & laser immunity).
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // 3 Distinct Lanes (Width = 480: Left = 120, Center = 240, Right = 360)
        this.laneX = [120, 240, 360];
        this.currentLane = 1; // Start in Center lane
        this.playerBaseY = 620;

        // Player physics states
        this.isJumping = false;
        this.isSliding = false;
        this.isInvulnerable = false;
        this.isDead = false;
        this.playerJumpObj = { elevation: 0 };
        this.slideTimerEvent = null;

        // Run Metrics
        this.distance = 0;
        this.score = 0;
        this.coinsCollected = 0;
        this.gameSpeed = 380; // px/sec
        this.baseSpeed = 380;
        this.maxSpeed = 960;

        // Active Character Config
        this.activeCharacterSlug = window.runnerApi ? window.runnerApi.getActiveCharacter() : 'retro-dash';
        this.charSpeedMod = 1.0;
        this.charCoinMod = 1.0;

        // Power-Up States
        this.activePowerUps = {
            magnet: 0,
            shield: 0,
            speed_boost: 0,
            multiplier: 0,
        };

        // Spawning intervals & track objects
        this.obstacles = null;
        this.coins = null;
        this.powerupItems = null;
        this.spawnTimer = 0;

        // Touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Ensure fixed static camera alignment (no zooming or horizontal shifting)
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(width / 2, height / 2);

        // Load active character multipliers
        this.applyCharacterStats();

        // 1. Background Environment (Scrolling Neon Track & Skyline)
        this.skyline = this.add.tileSprite(width / 2, 80, width, 160, 'side_buildings');
        this.track = this.add.tileSprite(width / 2, height / 2, width, height, 'track_tile');

        // Track Rail Glow lines
        this.leftGlow = this.add.rectangle(50, height / 2, 4, height, 0xff007f, 0.4);
        this.rightGlow = this.add.rectangle(430, height / 2, 4, height, 0xff007f, 0.4);

        // 2. Physics Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.powerupItems = this.physics.add.group();

        // 3. Player Shadow & Character Sprite
        this.playerShadow = this.add.image(this.laneX[this.currentLane], this.playerBaseY + 28, 'player_shadow')
            .setAlpha(0.6)
            .setDepth(10);

        this.player = this.physics.add.sprite(
            this.laneX[this.currentLane],
            this.playerBaseY,
            `runner_${this.activeCharacterSlug}_run_0`
        ).setDepth(20);

        this.player.setSize(34, 52);
        this.player.setOffset(10, 14);
        this.player.play(`run_${this.activeCharacterSlug}`);

        // Auras & Visual Attachments
        this.shieldAura = this.add.image(this.player.x, this.player.y, 'shield_aura')
            .setDepth(25)
            .setVisible(false)
            .setAlpha(0.85);

        this.magnetAura = this.add.circle(this.player.x, this.player.y, 44, 0x00e5ff, 0.15)
            .setStrokeStyle(2, 0x00e5ff, 0.6)
            .setDepth(15)
            .setVisible(false);

        // Particle Emitter for Nitro Boost & Running Dust
        this.flameParticles = this.add.particles(0, 0, 'p_flame', {
            speed: { min: 80, max: 200 },
            angle: { min: 70, max: 110 },
            scale: { start: 0.8, end: 0.1 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 300,
            emitting: false,
        }).setDepth(18);

        this.sparkParticles = this.add.particles(0, 0, 'p_spark', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0.2 },
            lifespan: 250,
            emitting: false,
        }).setDepth(22);

        // 4. Input Listeners (Keyboard + Swipe)
        if (this.input.keyboard) {
            this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'W', 'A', 'S', 'D']);
            this.input.keyboard.on('keydown', this.handleKeyDown, this);
        }
        this.setupTouchControls();

        // 5. HUD Overlay
        this.createHUD();

        // 6. Audio start
        if (window.soundEngine) {
            window.soundEngine.resume();
        }

        // 7. Initial Safe Run Spawn
        this.time.delayedCall(800, () => {
            this.spawnInitialTrack();
        });

        // Listen for character switches
        window.addEventListener('character-changed', (e) => {
            if (e.detail && e.detail.slug) {
                this.activeCharacterSlug = e.detail.slug;
                this.applyCharacterStats();
                if (!this.isJumping && !this.isSliding && !this.isDead) {
                    this.player.play(`run_${this.activeCharacterSlug}`);
                }
            }
        });
    }

    applyCharacterStats() {
        if (window.runnerApi && window.runnerApi.profile && window.runnerApi.profile.active_character_details) {
            const char = window.runnerApi.profile.active_character_details;
            this.charSpeedMod = char.speed_multiplier || 1.0;
            this.charCoinMod = char.coin_multiplier || 1.0;
        } else {
            this.charSpeedMod = 1.0;
            this.charCoinMod = 1.0;
        }
        this.gameSpeed = this.baseSpeed * this.charSpeedMod;
    }

    setupTouchControls() {
        this.input.on('pointerdown', (pointer) => {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.touchStartTime = pointer.downTime;
            if (window.soundEngine) window.soundEngine.resume();
        });

        this.input.on('pointerup', (pointer) => {
            const deltaX = pointer.x - this.touchStartX;
            const deltaY = pointer.y - this.touchStartY;
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const duration = pointer.upTime - this.touchStartTime;

            // Swipe threshold
            if (dist > 25 && duration < 600) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) this.moveRight();
                    else this.moveLeft();
                } else {
                    if (deltaY < 0) this.jump();
                    else this.slide();
                }
            } else if (dist <= 25) {
                // Direct tap on screen zones
                if (pointer.y < 240) {
                    this.jump();
                } else if (pointer.y > 560) {
                    this.slide();
                } else if (pointer.x < 240) {
                    this.moveLeft();
                } else {
                    this.moveRight();
                }
            }
        });
    }

    handleKeyDown(event) {
        if (this.isDead) return;

        const code = event.code || '';
        const key = (event.key || '').toLowerCase();

        if (code === 'ArrowLeft' || code === 'KeyA' || key === 'arrowleft' || key === 'a') {
            if (event.preventDefault) event.preventDefault();
            this.moveLeft();
        } else if (code === 'ArrowRight' || code === 'KeyD' || key === 'arrowright' || key === 'd') {
            if (event.preventDefault) event.preventDefault();
            this.moveRight();
        } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space' || key === 'arrowup' || key === 'w' || key === ' ') {
            if (event.preventDefault) event.preventDefault();
            this.jump();
        } else if (code === 'ArrowDown' || code === 'KeyS' || key === 'arrowdown' || key === 's') {
            if (event.preventDefault) event.preventDefault();
            this.slide();
        }
    }

    moveLeft() {
        this.switchLane(-1);
    }

    moveRight() {
        this.switchLane(1);
    }

    switchLane(direction) {
        if (this.isDead) return;

        const targetLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
        if (targetLane === this.currentLane) return;

        this.currentLane = targetLane;
        const targetX = this.laneX[this.currentLane];

        if (window.soundEngine) window.soundEngine.playLaneSwitch();

        // Kill existing horizontal tweens
        this.tweens.killTweensOf(this.player, ['x', 'angle']);
        this.tweens.killTweensOf(this.playerShadow, ['x']);

        // Snappy, responsive lane tween with subtle tilt
        this.player.angle = direction * 10;

        this.tweens.add({
            targets: this.player,
            x: targetX,
            angle: 0,
            duration: 110,
            ease: 'Sine.easeOut',
        });

        this.tweens.add({
            targets: this.playerShadow,
            x: targetX,
            duration: 110,
            ease: 'Sine.easeOut',
        });
    }

    jump() {
        if (this.isDead) return;
        if (this.isJumping) return;

        // Cancel slide immediately if currently sliding
        if (this.isSliding) {
            this.stopSlide();
        }

        this.isJumping = true;
        if (window.soundEngine) window.soundEngine.playJump();

        // Switch to jump frame
        this.player.setTexture(`runner_${this.activeCharacterSlug}_jump`);
        this.player.anims.stop();

        // Smooth elevation arc (110px peak)
        const jumpHeight = 110;
        const jumpDuration = 280; // 280ms up, 280ms down

        this.tweens.killTweensOf(this.playerJumpObj);
        this.playerJumpObj = { elevation: 0 };

        this.jumpTween = this.tweens.add({
            targets: this.playerJumpObj,
            elevation: jumpHeight,
            duration: jumpDuration,
            ease: 'Sine.easeOut',
            yoyo: true,
            onUpdate: () => {
                this.player.y = this.playerBaseY - this.playerJumpObj.elevation;
                const shadowScale = Math.max(0.4, 1 - (this.playerJumpObj.elevation / jumpHeight) * 0.5);
                this.playerShadow.setScale(shadowScale);
                this.playerShadow.setAlpha(0.6 * shadowScale);
            },
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.playerBaseY;
                this.playerShadow.setScale(1);
                this.playerShadow.setAlpha(0.6);
                if (!this.isSliding && !this.isDead) {
                    this.player.play(`run_${this.activeCharacterSlug}`);
                }
            },
        });
    }

    slide() {
        if (this.isDead) return;

        // Fast dive if currently airborne in jump
        if (this.isJumping) {
            if (this.jumpTween) this.jumpTween.stop();
            this.isJumping = false;
            this.playerJumpObj.elevation = 0;
            this.player.y = this.playerBaseY;
            this.playerShadow.setScale(1);
            this.playerShadow.setAlpha(0.6);
        }

        this.isSliding = true;
        if (window.soundEngine) window.soundEngine.playSlide();

        // Switch texture to low-profile crouch/slide
        this.player.setTexture(`runner_${this.activeCharacterSlug}_slide`);
        this.player.anims.stop();
        this.player.setSize(48, 26);
        this.player.setOffset(8, 14);
        this.player.y = this.playerBaseY + 8;

        // Emit slide sparks
        this.sparkParticles.emitParticleAt(this.player.x, this.player.y + 14, 8);

        // Reset any existing slide timer
        if (this.slideTimerEvent) {
            this.slideTimerEvent.remove(false);
        }

        // Restore running stance after 550ms
        this.slideTimerEvent = this.time.delayedCall(550, () => {
            if (this.isSliding && !this.isDead) {
                this.stopSlide();
            }
        });
    }

    stopSlide() {
        this.isSliding = false;
        if (this.slideTimerEvent) {
            this.slideTimerEvent.remove(false);
            this.slideTimerEvent = null;
        }
        this.player.setSize(34, 52);
        this.player.setOffset(10, 14);
        this.player.y = this.playerBaseY;
        if (!this.isJumping && !this.isDead) {
            this.player.play(`run_${this.activeCharacterSlug}`);
        }
    }

    createHUD() {
        const width = this.cameras.main.width;

        // Score Panel
        this.scoreText = this.add.text(24, 20, 'SCORE: 0', {
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#00e5ff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setDepth(50);

        // Distance Panel
        this.distText = this.add.text(24, 46, 'DIST: 0m', {
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setDepth(50);

        // Coin Counter
        this.coinIcon = this.add.image(width - 95, 30, 'coin_0')
            .setScale(0.85)
            .setDepth(50);

        this.coinText = this.add.text(width - 76, 20, '0', {
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3,
        }).setDepth(50);

        // Power-Up Status Indicators Container
        this.powerupHudContainer = this.add.container(24, 76).setDepth(50);
    }

    updatePowerUpHUD() {
        this.powerupHudContainer.removeAll(true);
        let yOffset = 0;

        const powerConfigs = [
            { key: 'magnet', icon: '🧲', color: '#00e5ff', label: 'MAGNET' },
            { key: 'shield', icon: '🛡️', color: '#00ffaa', label: 'SHIELD' },
            { key: 'speed_boost', icon: '🚀', color: '#ff9900', label: 'NITRO' },
            { key: 'multiplier', icon: '✨', color: '#ff007f', label: '2X BONUS' },
        ];

        powerConfigs.forEach(item => {
            const timeRemaining = this.activePowerUps[item.key];
            if (timeRemaining > 0) {
                const bg = this.add.rectangle(0, yOffset, 140, 20, 0x000000, 0.7).setOrigin(0, 0);
                const barWidth = Math.max(0, (timeRemaining / 12) * 136);
                const bar = this.add.rectangle(2, yOffset + 2, barWidth, 16, Phaser.Display.Color.HexStringToColor(item.color).color).setOrigin(0, 0);
                const txt = this.add.text(6, yOffset + 2, `${item.icon} ${item.label} ${timeRemaining.toFixed(1)}s`, {
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '11px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                });

                this.powerupHudContainer.add([bg, bar, txt]);
                yOffset += 24;
            }
        });
    }

    spawnInitialTrack() {
        // Starter coins in center lane
        for (let i = 0; i < 3; i++) {
            this.spawnCoin(1, -150 - i * 60);
        }
    }

    update(time, delta) {
        if (this.isDead) return;

        const dt = delta / 1000;

        // 1. Dynamic Speed & Metric Progression
        this.distance += (this.gameSpeed * dt) / 10;
        const scoreMultiplier = (this.activePowerUps.multiplier > 0 ? 2 : 1) * (this.activePowerUps.speed_boost > 0 ? 2 : 1);
        this.score += (this.gameSpeed * dt * 0.15) * scoreMultiplier;

        // Difficulty scaling (game speed accelerates over distance)
        const targetSpeed = Math.min(this.maxSpeed, (this.baseSpeed + Math.sqrt(this.distance) * 8) * this.charSpeedMod);
        if (this.activePowerUps.speed_boost > 0) {
            this.gameSpeed = targetSpeed * 1.7;
        } else {
            this.gameSpeed = targetSpeed;
        }

        // Update HUD
        this.scoreText.setText(`SCORE: ${Math.floor(this.score)}`);
        this.distText.setText(`DIST: ${Math.floor(this.distance)}m`);
        this.coinText.setText(`${this.coinsCollected}`);

        // Pure vertical track scrolling (no horizontal shifting or zooming)
        this.track.tilePositionY -= this.gameSpeed * dt;

        // 2. Manage Active Power-Up Timers
        let hasPowerUpChange = false;
        for (const key in this.activePowerUps) {
            if (this.activePowerUps[key] > 0) {
                this.activePowerUps[key] = Math.max(0, this.activePowerUps[key] - dt);
                hasPowerUpChange = true;
            }
        }
        if (hasPowerUpChange) {
            this.updatePowerUpHUD();
        }

        // Update Auras & Visual Attachments
        this.shieldAura.setPosition(this.player.x, this.player.y);
        this.shieldAura.setVisible(this.activePowerUps.shield > 0);

        this.magnetAura.setPosition(this.player.x, this.player.y);
        this.magnetAura.setVisible(this.activePowerUps.magnet > 0);

        if (this.activePowerUps.speed_boost > 0) {
            this.flameParticles.emitParticleAt(this.player.x, this.player.y + 24, 2);
        }

        // 3. Move and Recycle Obstacles
        this.obstacles.getChildren().forEach(obs => {
            obs.y += this.gameSpeed * dt;
            if (obs.y > 780) {
                obs.destroy();
            }
        });

        // 4. Move and Handle Coins
        this.coins.getChildren().forEach(coin => {
            coin.y += this.gameSpeed * dt;

            // Magnet suction effect
            if (this.activePowerUps.magnet > 0) {
                const distToPlayer = Phaser.Math.Distance.Between(coin.x, coin.y, this.player.x, this.player.y);
                if (distToPlayer < 260) {
                    const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
                    const pullSpeed = 620;
                    coin.x += Math.cos(angle) * pullSpeed * dt;
                    coin.y += Math.sin(angle) * pullSpeed * dt;
                }
            }

            if (coin.y > 780) {
                coin.destroy();
            }
        });

        // 5. Move Power-Up Collectibles
        this.powerupItems.getChildren().forEach(item => {
            item.y += this.gameSpeed * dt;
            if (item.y > 780) {
                item.destroy();
            }
        });

        // 6. Check Collisions & Overlaps
        this.checkCollisions();

        // 7. Procedural Wave Generator
        this.spawnTimer += delta;
        const spawnDelay = Math.max(900, 2200 - Math.sqrt(this.distance) * 45);
        if (this.spawnTimer > spawnDelay) {
            this.spawnTimer = 0;
            this.spawnProceduralWave();
        }
    }

    spawnProceduralWave() {
        const rand = Math.random();
        const availableLanes = [0, 1, 2];
        Phaser.Utils.Array.Shuffle(availableLanes);

        // Pattern 1: Single Obstacle + Coin Line in other lane (40%)
        if (rand < 0.40) {
            const obsLane = availableLanes[0];
            const coinLane = availableLanes[1];
            const obsType = this.pickObstacleType();
            this.spawnObstacle(obsLane, -60, obsType);

            // Spawn 4 coins
            for (let i = 0; i < 4; i++) {
                this.spawnCoin(coinLane, -60 - i * 50);
            }
        }
        // Pattern 2: Double Obstacle with guaranteed safe passage (30%)
        else if (rand < 0.70) {
            const obsLane1 = availableLanes[0];
            const obsLane2 = availableLanes[1];
            const safeLane = availableLanes[2];

            const type1 = this.pickObstacleType();
            const type2 = (type1 === 'train') ? 'hurdle' : this.pickObstacleType();

            this.spawnObstacle(obsLane1, -80, type1);
            this.spawnObstacle(obsLane2, -80, type2);

            // Reward safe lane with coins or powerup
            if (Math.random() < 0.25) {
                this.spawnPowerUp(safeLane, -90);
            } else {
                for (let i = 0; i < 3; i++) {
                    this.spawnCoin(safeLane, -70 - i * 45);
                }
            }
        }
        // Pattern 3: Hurdle with coin arc over it (20%)
        else if (rand < 0.90) {
            const hurdleLane = availableLanes[0];
            this.spawnObstacle(hurdleLane, -80, 'hurdle');
            this.spawnCoin(hurdleLane, -120);
            this.spawnCoin(hurdleLane, -80);
            this.spawnCoin(hurdleLane, -40);

            // Blocker on another lane
            const blockerLane = availableLanes[1];
            this.spawnObstacle(blockerLane, -80, 'laser_high');
        }
        // Pattern 4: Power-Up Bonus Rush (10%)
        else {
            const itemLane = availableLanes[0];
            const obsLane = availableLanes[1];
            this.spawnPowerUp(itemLane, -80);
            this.spawnObstacle(obsLane, -80, 'hurdle');
        }
    }

    pickObstacleType() {
        const r = Math.random();
        if (r < 0.38) return 'hurdle';        // Jump required
        if (r < 0.68) return 'laser_high';    // Slide required
        if (r < 0.88) return 'train';         // Impassable lane switch
        return 'gap';                         // Jump required
    }

    spawnObstacle(laneIdx, yPos, type) {
        const x = this.laneX[laneIdx];
        let textureKey = 'obstacle_hurdle';
        let bodyW = 70;
        let bodyH = 30;

        if (type === 'laser_high') {
            textureKey = 'obstacle_laser_high';
            bodyW = 70;
            bodyH = 32;
        } else if (type === 'train') {
            textureKey = 'obstacle_train';
            bodyW = 70;
            bodyH = 100;
        } else if (type === 'gap') {
            textureKey = 'obstacle_gap';
            bodyW = 70;
            bodyH = 34;
        }

        const obs = this.physics.add.sprite(x, yPos, textureKey);
        obs.obstacleType = type;
        obs.laneIndex = laneIdx;
        obs.setDepth(15);
        obs.setSize(bodyW, bodyH);

        if (type === 'laser_high') {
            obs.setOffset(9, 6);
        } else {
            obs.setOffset(9, 8);
        }

        this.obstacles.add(obs);
        return obs;
    }

    spawnCoin(laneIdx, yPos) {
        const x = this.laneX[laneIdx];
        const coin = this.physics.add.sprite(x, yPos, 'coin_0');
        coin.play('coin_spin');
        coin.setDepth(14);
        coin.setSize(24, 24);
        this.coins.add(coin);
        return coin;
    }

    spawnPowerUp(laneIdx, yPos) {
        const x = this.laneX[laneIdx];
        const types = ['magnet', 'shield', 'speed_boost', 'multiplier'];
        const pType = Phaser.Utils.Array.GetRandom(types);

        const item = this.physics.add.sprite(x, yPos, `powerup_${pType}`);
        item.powerType = pType;
        item.setDepth(16);
        item.setSize(36, 36);

        // Floating hover tween
        this.tweens.add({
            targets: item,
            scale: 1.15,
            duration: 400,
            yoyo: true,
            repeat: -1,
        });

        this.powerupItems.add(item);
        return item;
    }

    checkCollisions() {
        // 1. Coin Pickups
        this.physics.overlap(this.player, this.coins, (player, coin) => {
            coin.destroy();
            const coinMultiplier = (this.activePowerUps.multiplier > 0 ? 2 : 1) * this.charCoinMod;
            const coinGain = Math.round(1 * coinMultiplier);
            this.coinsCollected += coinGain;
            this.score += 25 * (this.activePowerUps.multiplier > 0 ? 2 : 1);

            if (window.soundEngine) window.soundEngine.playCoin();

            // Sparkle Particle
            this.sparkParticles.emitParticleAt(player.x, player.y, 6);

            // Floating coin popup
            this.showFloatingText(`+${coinGain} 🪙`, player.x, player.y - 20, '#ffd700');
        });

        // 2. Power-Up Pickups
        this.physics.overlap(this.player, this.powerupItems, (player, item) => {
            const pType = item.powerType;
            item.destroy();

            const durations = {
                magnet: 10,
                shield: 12,
                speed_boost: 6,
                multiplier: 15,
            };
            this.activePowerUps[pType] = durations[pType] || 10;

            if (window.soundEngine) {
                if (pType === 'speed_boost') window.soundEngine.playBoost();
                else window.soundEngine.playPowerUp();
            }

            this.updatePowerUpHUD();

            const names = {
                magnet: 'MAGNET ACTIVATED! 🧲',
                shield: 'SHIELD CHARGED! 🛡️',
                speed_boost: 'NITRO SPEED BOOST! 🚀',
                multiplier: '2X SCORE & COINS! ✨',
            };
            this.showFloatingText(names[pType], player.x, player.y - 40, '#00e5ff', 18);
        });

        // 3. Obstacle Collisions
        if (!this.isInvulnerable && !this.isDead) {
            this.physics.overlap(this.player, this.obstacles, (player, obs) => {
                this.handleObstacleCollision(obs);
            });
        }
    }

    handleObstacleCollision(obs) {
        // Nitro Speed Boost: Smashes through obstacles
        if (this.activePowerUps.speed_boost > 0) {
            this.destroyObstacleWithExplosion(obs);
            this.score += 150;
            this.showFloatingText('SMASH! +150', obs.x, obs.y, '#ff9900');
            return;
        }

        const type = obs.obstacleType;

        // If obstacle is hurdle or gap AND player is jumping -> completely immune!
        if ((type === 'hurdle' || type === 'gap') && this.isJumping) {
            return;
        }

        // If obstacle is laser_high AND player is sliding -> completely immune!
        if (type === 'laser_high' && this.isSliding) {
            return;
        }

        // Forgiving lane edge check
        const xDiff = Math.abs(this.player.x - obs.x);
        if (xDiff > 42) {
            return;
        }

        // Fatal Hit Handling
        // Check Shield protection
        if (this.activePowerUps.shield > 0) {
            this.activePowerUps.shield = 0;
            this.shieldAura.setVisible(false);
            this.updatePowerUpHUD();

            if (window.soundEngine) window.soundEngine.playShieldBreak();
            this.destroyObstacleWithExplosion(obs);

            // Grant brief invulnerability
            this.isInvulnerable = true;
            this.showFloatingText('SHIELD SAVED YOU! 🛡️', this.player.x, this.player.y - 30, '#00ffaa', 18);

            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 120,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.player.setAlpha(1.0);
                    this.isInvulnerable = false;
                },
            });
            return;
        }

        // Game Over!
        this.triggerGameOver();
    }

    destroyObstacleWithExplosion(obs) {
        this.sparkParticles.emitParticleAt(obs.x, obs.y, 16);
        this.cameras.main.shake(150, 0.015);
        obs.destroy();
    }

    showFloatingText(text, x, y, color = '#ffffff', size = 15) {
        const floatText = this.add.text(x, y, text, {
            fontFamily: 'Outfit, sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
            targets: floatText,
            y: y - 45,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => floatText.destroy(),
        });
    }

    triggerGameOver() {
        if (this.isDead) return;
        this.isDead = true;

        if (window.soundEngine) {
            window.soundEngine.playObstacleHit();
            window.soundEngine.playGameOver();
        }

        // Camera Shake & Crash Debris
        this.cameras.main.shake(350, 0.035);
        this.sparkParticles.emitParticleAt(this.player.x, this.player.y, 25);

        // Player Death Animation
        this.tweens.killTweensOf(this.player);
        this.player.setTint(0xff0055);

        this.tweens.add({
            targets: this.player,
            y: this.player.y + 40,
            angle: 45,
            alpha: 0.8,
            duration: 350,
            ease: 'Bounce.easeOut',
        });

        // Transition to GameOverScene after brief delay
        this.time.delayedCall(750, () => {
            this.scene.start('GameOverScene', {
                score: Math.floor(this.score),
                distance: Math.floor(this.distance),
                coins: this.coinsCollected,
                characterSlug: this.activeCharacterSlug,
            });
        });
    }
}

window.GameScene = GameScene;
