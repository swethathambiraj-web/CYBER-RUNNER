/**
 * Procedural Texture Generator for Phaser 3
 * Generates crisp, pixel-perfect, neon cyberpunk sprites and animations.
 */
class TextureGenerator {
    static generateAll(scene) {
        this.generateCharacterTextures(scene);
        this.generateObstacleTextures(scene);
        this.generateCollectibleTextures(scene);
        this.generateEnvironmentTextures(scene);
        this.generateParticleTextures(scene);
    }

    static generateCharacterTextures(scene) {
        const skins = [
            { key: 'retro-dash', primary: '#00e5ff', secondary: '#ff007f', accent: '#ffffff', skin: '#ffccaa' },
            { key: 'neon-cyberpunk', primary: '#ff007f', secondary: '#00ffff', accent: '#ffe600', skin: '#ffb380' },
            { key: 'shadow-ninja', primary: '#2a1b4e', secondary: '#9d4edd', accent: '#e0aaff', skin: '#d4a373' },
            { key: 'golden-king', primary: '#ffd700', secondary: '#ff8800', accent: '#ffffff', skin: '#ffddaa' },
            { key: 'mecha-bot', primary: '#7928ca', secondary: '#00dfd8', accent: '#50e3c2', skin: '#a0aec0' },
        ];

        skins.forEach(skin => {
            // Generate 4 running animation frames
            for (let f = 0; f < 4; f++) {
                const texKey = `runner_${skin.key}_run_${f}`;
                if (scene.textures.exists(texKey)) continue;

                const canvas = scene.textures.createCanvas(texKey, 54, 72);
                const ctx = canvas.getContext();

                // Clear
                ctx.clearRect(0, 0, 54, 72);

                // Running leg offsets
                const legOffsets = [
                    { lY: 48, rY: 54, lX: 18, rX: 36 },
                    { lY: 51, rY: 51, lX: 23, rX: 31 },
                    { lY: 54, rY: 48, lX: 36, rX: 18 },
                    { lY: 51, rY: 51, lX: 31, rX: 23 },
                ][f];

                // Back / Jetpack or Cape
                ctx.fillStyle = skin.secondary;
                ctx.shadowColor = skin.primary;
                ctx.shadowBlur = 8;
                ctx.fillRect(16, 26, 22, 22);

                // Legs
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(legOffsets.lX - 4, 42, 8, legOffsets.lY - 42 + 10);
                ctx.fillRect(legOffsets.rX - 4, 42, 8, legOffsets.rY - 42 + 10);

                // Shoes (Glowing Neon)
                ctx.fillStyle = skin.primary;
                ctx.fillRect(legOffsets.lX - 6, legOffsets.lY + 8, 12, 6);
                ctx.fillRect(legOffsets.rX - 6, legOffsets.rY + 8, 12, 6);

                // Torso / Jacket
                ctx.fillStyle = skin.primary;
                ctx.fillRect(17, 24, 20, 20);

                // Armor / Chest detail
                ctx.fillStyle = skin.accent;
                ctx.fillRect(23, 28, 8, 10);

                // Arms / Shoulders
                ctx.fillStyle = skin.secondary;
                const armOffset = (f === 0 || f === 2) ? 4 : 0;
                ctx.fillRect(10, 26 - armOffset, 7, 14);
                ctx.fillRect(37, 26 + armOffset, 7, 14);

                // Head / Helmet
                ctx.fillStyle = skin.skin;
                ctx.beginPath();
                ctx.arc(27, 15, 10, 0, Math.PI * 2);
                ctx.fill();

                // Cyber Visor / Hair
                ctx.fillStyle = skin.secondary;
                ctx.fillRect(19, 6, 16, 8); // Hair / Helmet top
                ctx.fillStyle = skin.accent;
                ctx.fillRect(21, 14, 12, 5); // Glowing Visor

                canvas.refresh();
            }

            // Jump Frame
            const jumpKey = `runner_${skin.key}_jump`;
            if (!scene.textures.exists(jumpKey)) {
                const canvas = scene.textures.createCanvas(jumpKey, 54, 72);
                const ctx = canvas.getContext();

                ctx.fillStyle = skin.secondary;
                ctx.shadowColor = skin.primary;
                ctx.shadowBlur = 12;
                ctx.fillRect(15, 22, 24, 22);

                // Tucked legs
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(16, 40, 8, 12);
                ctx.fillRect(30, 40, 8, 12);
                ctx.fillStyle = skin.primary;
                ctx.fillRect(14, 50, 12, 6);
                ctx.fillRect(28, 50, 12, 6);

                // Torso
                ctx.fillStyle = skin.primary;
                ctx.fillRect(17, 20, 20, 20);
                ctx.fillStyle = skin.accent;
                ctx.fillRect(23, 24, 8, 10);

                // Raised arms
                ctx.fillStyle = skin.secondary;
                ctx.fillRect(9, 14, 8, 16);
                ctx.fillRect(37, 14, 8, 16);

                // Head & Visor
                ctx.fillStyle = skin.skin;
                ctx.beginPath();
                ctx.arc(27, 12, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = skin.secondary;
                ctx.fillRect(19, 3, 16, 8);
                ctx.fillStyle = skin.accent;
                ctx.fillRect(21, 10, 12, 5);

                canvas.refresh();
            }

            // Slide Frame (Low profile)
            const slideKey = `runner_${skin.key}_slide`;
            if (!scene.textures.exists(slideKey)) {
                const canvas = scene.textures.createCanvas(slideKey, 64, 40);
                const ctx = canvas.getContext();

                // Slid forward horizontal body
                ctx.fillStyle = skin.primary;
                ctx.shadowColor = skin.secondary;
                ctx.shadowBlur = 10;
                ctx.fillRect(14, 16, 36, 16);

                // Head tucked forward
                ctx.fillStyle = skin.skin;
                ctx.beginPath();
                ctx.arc(48, 22, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = skin.accent;
                ctx.fillRect(44, 20, 8, 4); // Visor

                // Legs extended backward
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(2, 20, 16, 8);
                ctx.fillStyle = skin.secondary;
                ctx.fillRect(0, 18, 6, 12); // Shoe

                // Slide sparks
                ctx.fillStyle = '#ffe600';
                ctx.fillRect(10, 32, 4, 3);
                ctx.fillRect(24, 33, 5, 2);
                ctx.fillRect(38, 32, 6, 3);

                canvas.refresh();
            }
        });

        // Player Ground Shadow
        if (!scene.textures.exists('player_shadow')) {
            const canvas = scene.textures.createCanvas('player_shadow', 48, 16);
            const ctx = canvas.getContext();
            const grad = ctx.createRadialGradient(24, 8, 2, 24, 8, 24);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 48, 16);
            canvas.refresh();
        }
    }

    static generateObstacleTextures(scene) {
        // 1. Low Hurdle Barrier (Requires Jump)
        if (!scene.textures.exists('obstacle_hurdle')) {
            const canvas = scene.textures.createCanvas('obstacle_hurdle', 88, 42);
            const ctx = canvas.getContext();

            // Metal support legs
            ctx.fillStyle = '#2b2d42';
            ctx.fillRect(6, 10, 8, 32);
            ctx.fillRect(74, 10, 8, 32);
            ctx.fillStyle = '#8d99ae';
            ctx.fillRect(2, 38, 16, 4);
            ctx.fillRect(70, 38, 16, 4);

            // Hazard striped crossbar
            ctx.fillStyle = '#ffbe0b';
            ctx.fillRect(4, 6, 80, 18);

            // Black stripes
            ctx.fillStyle = '#1a1a1a';
            for (let x = 6; x < 80; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, 6);
                ctx.lineTo(x + 8, 6);
                ctx.lineTo(x + 2, 24);
                ctx.lineTo(x - 6, 24);
                ctx.closePath();
                ctx.fill();
            }

            // Neon warning light on top
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 8;
            ctx.fillRect(38, 0, 12, 6);

            canvas.refresh();
        }

        // 2. High Laser Barrier (Requires Slide)
        if (!scene.textures.exists('obstacle_laser_high')) {
            const canvas = scene.textures.createCanvas('obstacle_laser_high', 88, 96);
            const ctx = canvas.getContext();

            // Tall steel pillars on left & right
            ctx.fillStyle = '#1e1e2f';
            ctx.fillRect(4, 0, 10, 96);
            ctx.fillRect(74, 0, 10, 96);

            // Pillar neon accents
            ctx.fillStyle = '#00e5ff';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(7, 10, 4, 76);
            ctx.fillRect(77, 10, 4, 76);

            // Overhead bridge / emitter
            ctx.fillStyle = '#2a2b4a';
            ctx.fillRect(4, 0, 80, 32);

            // Danger Laser Beam across upper clearance (y=10 to y=36)
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 12;
            ctx.fillRect(8, 12, 72, 14);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(12, 16, 64, 6);

            // Neon Downward Arrows indicating "SLIDE DOWN"
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(44, 28);
            ctx.lineTo(36, 18);
            ctx.lineTo(52, 18);
            ctx.closePath();
            ctx.fill();

            canvas.refresh();
        }

        // 3. Cyber Train / Tall Block Obstacle (Cannot Jump or Slide - Must Switch Lane)
        if (!scene.textures.exists('obstacle_train')) {
            const canvas = scene.textures.createCanvas('obstacle_train', 88, 130);
            const ctx = canvas.getContext();

            // Train Front Body
            ctx.fillStyle = '#16192e';
            ctx.fillRect(4, 8, 80, 120);

            // Roof curve
            ctx.fillStyle = '#222845';
            ctx.beginPath();
            ctx.roundRect(4, 4, 80, 30, [12, 12, 0, 0]);
            ctx.fill();

            // Front Windshield
            ctx.fillStyle = '#0d1326';
            ctx.fillRect(12, 16, 64, 30);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(12, 16, 64, 30);

            // Glowing Headlights
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(22, 60, 8, 0, Math.PI * 2);
            ctx.arc(66, 60, 8, 0, Math.PI * 2);
            ctx.fill();

            // Front Bumper / Grill
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 6;
            ctx.fillRect(8, 80, 72, 10);

            ctx.fillStyle = '#2f354f';
            for (let y = 96; y < 120; y += 6) {
                ctx.fillRect(16, y, 56, 3);
            }

            canvas.refresh();
        }

        // 4. Void Gap / Road Pothole (Requires Jump or lane switch)
        if (!scene.textures.exists('obstacle_gap')) {
            const canvas = scene.textures.createCanvas('obstacle_gap', 88, 48);
            const ctx = canvas.getContext();

            // Deep pit
            ctx.fillStyle = '#030308';
            ctx.beginPath();
            ctx.roundRect(4, 4, 80, 40, [8, 8, 8, 8]);
            ctx.fill();

            // Glowing Danger Edge
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 3;
            ctx.strokeRect(4, 4, 80, 40);

            // Cyber grid lines beneath
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(20, 4); ctx.lineTo(20, 44);
            ctx.moveTo(44, 4); ctx.lineTo(44, 44);
            ctx.moveTo(68, 4); ctx.lineTo(68, 44);
            ctx.stroke();

            canvas.refresh();
        }
    }

    static generateCollectibleTextures(scene) {
        // Gold Coin Animation Frames (Rotating 3D effect)
        const coinWidths = [28, 22, 10, 22];
        for (let i = 0; i < 4; i++) {
            const texKey = `coin_${i}`;
            if (scene.textures.exists(texKey)) continue;

            const canvas = scene.textures.createCanvas(texKey, 32, 32);
            const ctx = canvas.getContext();
            const w = coinWidths[i];
            const x = (32 - w) / 2;

            // Outer gold glow
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffb703';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(16, 16, w / 2, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner rim
            ctx.fillStyle = '#ffea75';
            ctx.beginPath();
            ctx.ellipse(16, 16, Math.max(1, (w / 2) - 3), 11, 0, 0, Math.PI * 2);
            ctx.fill();

            // Center star / symbol (visible when front-facing)
            if (i === 0 || i === 1 || i === 3) {
                ctx.fillStyle = '#d48b00';
                ctx.fillRect(15, 10, 2, 12);
                ctx.fillRect(11, 15, 10, 2);
            }

            canvas.refresh();
        }

        // Power-Up: 🧲 Magnet
        if (!scene.textures.exists('powerup_magnet')) {
            const canvas = scene.textures.createCanvas('powerup_magnet', 44, 44);
            const ctx = canvas.getContext();

            // Outer floating crystal circle
            ctx.fillStyle = 'rgba(0, 180, 255, 0.25)';
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(22, 22, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Magnet Horseshoe
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(22, 22, 10, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();

            // Silver tips
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(10, 22, 5, 5);
            ctx.fillRect(29, 22, 5, 5);

            canvas.refresh();
        }

        // Power-Up: 🛡️ Shield
        if (!scene.textures.exists('powerup_shield')) {
            const canvas = scene.textures.createCanvas('powerup_shield', 44, 44);
            const ctx = canvas.getContext();

            // Hexagon aura
            ctx.fillStyle = 'rgba(0, 255, 180, 0.25)';
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(22, 22, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Shield Emblem
            ctx.fillStyle = '#00ffaa';
            ctx.beginPath();
            ctx.moveTo(22, 9);
            ctx.lineTo(33, 14);
            ctx.lineTo(33, 25);
            ctx.lineTo(22, 35);
            ctx.lineTo(11, 25);
            ctx.lineTo(11, 14);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(22, 21, 5, 0, Math.PI * 2);
            ctx.fill();

            canvas.refresh();
        }

        // Power-Up: 🚀 Speed Nitro Boost
        if (!scene.textures.exists('powerup_speed_boost')) {
            const canvas = scene.textures.createCanvas('powerup_speed_boost', 44, 44);
            const ctx = canvas.getContext();

            ctx.fillStyle = 'rgba(255, 120, 0, 0.25)';
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(22, 22, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Lightning Bolt
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(24, 8);
            ctx.lineTo(13, 23);
            ctx.lineTo(22, 23);
            ctx.lineTo(18, 36);
            ctx.lineTo(31, 20);
            ctx.lineTo(22, 20);
            ctx.closePath();
            ctx.fill();

            canvas.refresh();
        }

        // Power-Up: ✨ 2X Multiplier
        if (!scene.textures.exists('powerup_multiplier')) {
            const canvas = scene.textures.createCanvas('powerup_multiplier', 44, 44);
            const ctx = canvas.getContext();

            ctx.fillStyle = 'rgba(180, 0, 255, 0.25)';
            ctx.strokeStyle = '#b5179e';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#f72585';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(22, 22, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Diamond Crystal & "2X"
            ctx.fillStyle = '#f72585';
            ctx.beginPath();
            ctx.moveTo(22, 10);
            ctx.lineTo(32, 22);
            ctx.lineTo(22, 34);
            ctx.lineTo(12, 22);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2X', 22, 22);

            canvas.refresh();
        }

        // Shield Bubble Aura around player
        if (!scene.textures.exists('shield_aura')) {
            const canvas = scene.textures.createCanvas('shield_aura', 80, 90);
            const ctx = canvas.getContext();

            const grad = ctx.createRadialGradient(40, 45, 10, 40, 45, 38);
            grad.addColorStop(0, 'rgba(0, 255, 200, 0.05)');
            grad.addColorStop(0.7, 'rgba(0, 255, 200, 0.25)');
            grad.addColorStop(1, 'rgba(0, 255, 200, 0.8)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(40, 45, 36, 42, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            canvas.refresh();
        }
    }

    static generateEnvironmentTextures(scene) {
        // Track Floor Tile (3-lane road with neon rails)
        if (!scene.textures.exists('track_tile')) {
            const canvas = scene.textures.createCanvas('track_tile', 480, 120);
            const ctx = canvas.getContext();

            // Dark Asphalt background
            ctx.fillStyle = '#0a0a14';
            ctx.fillRect(0, 0, 480, 120);

            // 3-lane track bed (Lanes centered around X=120, X=240, X=360)
            ctx.fillStyle = '#101222';
            ctx.fillRect(50, 0, 380, 120);

            // Outer neon rails
            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 8;
            ctx.fillRect(48, 0, 4, 120);
            ctx.fillRect(428, 0, 4, 120);

            // Lane dividing dashes (between Left/Center at X=180, and Center/Right at X=300)
            ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 4;
            for (let y = 10; y < 120; y += 40) {
                ctx.fillRect(178, y, 4, 20);
                ctx.fillRect(298, y, 4, 20);
            }

            // Speed ties across the track
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            for (let y = 0; y < 120; y += 30) {
                ctx.fillRect(52, y, 376, 2);
            }

            canvas.refresh();
        }

        // Side city skyline / neon towers
        if (!scene.textures.exists('side_buildings')) {
            const canvas = scene.textures.createCanvas('side_buildings', 480, 200);
            const ctx = canvas.getContext();

            // Distant towers Left
            ctx.fillStyle = '#060611';
            ctx.fillRect(0, 40, 50, 160);
            ctx.fillRect(0, 10, 35, 190);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
            for (let y = 60; y < 180; y += 15) {
                ctx.fillRect(6, y, 6, 6);
                ctx.fillRect(18, y, 6, 6);
            }

            // Distant towers Right
            ctx.fillStyle = '#060611';
            ctx.fillRect(430, 30, 50, 170);
            ctx.fillRect(445, 10, 35, 190);
            ctx.fillStyle = 'rgba(255, 0, 127, 0.6)';
            for (let y = 50; y < 180; y += 15) {
                ctx.fillRect(440, y, 6, 6);
                ctx.fillRect(455, y, 6, 6);
            }

            canvas.refresh();
        }
    }

    static generateParticleTextures(scene) {
        // Spark
        if (!scene.textures.exists('p_spark')) {
            const canvas = scene.textures.createCanvas('p_spark', 8, 8);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(4, 4, 3, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        // Gold Shimmer
        if (!scene.textures.exists('p_gold')) {
            const canvas = scene.textures.createCanvas('p_gold', 10, 10);
            const ctx = canvas.getContext();
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(5, 5, 4, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        // Nitro Flame
        if (!scene.textures.exists('p_flame')) {
            const canvas = scene.textures.createCanvas('p_flame', 12, 12);
            const ctx = canvas.getContext();
            const grad = ctx.createRadialGradient(6, 6, 1, 6, 6, 6);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#ff9900');
            grad.addColorStop(1, 'rgba(255, 0, 100, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 12, 12);
            canvas.refresh();
        }
    }
}

window.TextureGenerator = TextureGenerator;
