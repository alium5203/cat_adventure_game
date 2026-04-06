class ShootingScene extends Phaser.Scene {
    static currentScore = 0;
    static currentLevel = 1;
    static currentLives = 5;
    static currentLanguage = 'en';

    static translations = {
        en: {
            hit: 'PILOT HIT!',
            gameOver: 'MISSION FAILED',
            levelUp: 'LEVEL {level}'
        },
        'zh-CN': {
            hit: '飞行员受伤！',
            gameOver: '任务失败',
            levelUp: '第 {level} 关'
        },
        'ko-KR': {
            hit: '파일럿 피격!',
            gameOver: '미션 실패',
            levelUp: '레벨 {level}'
        }
    };

    static setLanguage(lang) {
        ShootingScene.currentLanguage = lang;
    }

    static resetProgress() {
        ShootingScene.currentScore = 0;
        ShootingScene.currentLevel = 1;
        ShootingScene.currentLives = 5;
    }

    constructor() {
        super({ key: 'ShootingScene' });
    }

    getText(key) {
        const lang = ShootingScene.currentLanguage || 'en';
        const dict = ShootingScene.translations[lang] || ShootingScene.translations.en;
        return dict[key] || ShootingScene.translations.en[key] || key;
    }

    formatText(key, replacements = {}) {
        let text = this.getText(key);
        Object.keys(replacements).forEach(repKey => {
            text = text.replace(`{${repKey}}`, replacements[repKey]);
        });
        return text;
    }

    setupAudio() {
        this.audioCtx = null;
        this.audioEnabled = true;
        this.themeTimer = null;
        this.themeStepIndex = 0;
        this.themeStarted = false;
        this.themeMelody = [392, 440, 523, 440, 392, 330, 349, 330];
        this.themeBass = [98, 98, 131, 131, 110, 110, 82, 82];
    }

    unlockAudio() {
        if (!this.audioEnabled) {
            return null;
        }

        if (!this.audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                this.audioEnabled = false;
                return null;
            }
            this.audioCtx = new AudioCtx();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {
                this.audioEnabled = false;
            });
        }

        if (this.audioCtx && this.audioEnabled && !this.themeStarted) {
            this.startThemeMusic();
        }

        return this.audioCtx;
    }

    startThemeMusic() {
        if (this.themeStarted || !this.audioEnabled) {
            return;
        }

        this.themeStarted = true;
        this.themeStepIndex = 0;

        this.themeTimer = this.time.addEvent({
            delay: 240,
            loop: true,
            callback: () => {
                if (this.isGameOver) {
                    return;
                }

                const idx = this.themeStepIndex % this.themeMelody.length;
                const melodyFreq = this.themeMelody[idx];
                const bassFreq = this.themeBass[idx % this.themeBass.length];

                this.playTone({
                    frequency: melodyFreq,
                    duration: 0.17,
                    volume: 0.022,
                    type: 'triangle'
                });

                this.playTone({
                    frequency: bassFreq,
                    duration: 0.2,
                    volume: 0.015,
                    type: 'sine'
                });

                this.themeStepIndex += 1;
            }
        });
    }

    stopThemeMusic() {
        if (this.themeTimer) {
            this.themeTimer.remove(false);
            this.themeTimer = null;
        }
        this.themeStarted = false;
    }

    playTone({ frequency = 440, duration = 0.08, volume = 0.06, type = 'square', slideTo = null }) {
        const ctx = this.unlockAudio();
        if (!ctx || !this.audioEnabled) {
            return;
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);
        if (slideTo != null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    playLaserSound() {
        // Sharp "pop" attack + quick descending tail for a bullet-like shot.
        this.playTone({ frequency: 1700, slideTo: 820, duration: 0.028, volume: 0.075, type: 'square' });
        this.time.delayedCall(10, () => {
            this.playTone({ frequency: 950, slideTo: 260, duration: 0.055, volume: 0.045, type: 'sawtooth' });
        });
        this.time.delayedCall(18, () => {
            this.playTone({ frequency: 240, slideTo: 120, duration: 0.07, volume: 0.018, type: 'triangle' });
        });
    }

    playHitSound() {
        this.playTone({ frequency: 300, slideTo: 180, duration: 0.1, volume: 0.05, type: 'triangle' });
    }

    playBossSound() {
        this.playTone({ frequency: 220, slideTo: 140, duration: 0.25, volume: 0.08, type: 'sawtooth' });
    }

    playBossDownSound() {
        // Bomb-style impact: deep boom + short crack.
        this.playTone({ frequency: 170, slideTo: 60, duration: 0.34, volume: 0.12, type: 'sawtooth' });
        this.time.delayedCall(38, () => {
            this.playTone({ frequency: 120, slideTo: 48, duration: 0.45, volume: 0.085, type: 'triangle' });
        });
        this.time.delayedCall(60, () => {
            this.playTone({ frequency: 920, slideTo: 220, duration: 0.12, volume: 0.05, type: 'square' });
        });
    }

    create() {
        ShootingScene.setLanguage(localStorage.getItem('selectedLanguage') || 'en');
        if (window.ArcadeTouchControls && typeof window.ArcadeTouchControls.reset === 'function') {
            window.ArcadeTouchControls.reset();
        }

        this.physics.world.gravity.y = 0;
        this.cameras.main.setBackgroundColor('#070b1a');
        this.setupAudio();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopThemeMusic();
        });

        this.score = ShootingScene.currentScore || 0;
        this.level = ShootingScene.currentLevel || 1;
        this.lives = ShootingScene.currentLives || 3;
        this.isGameOver = false;
        this.moveSpeed = 460;
        this.baseEnemySpeed = 80;
        this.baseSpawnDelay = 1600;
        this.enemyBaseSpeed = this.baseEnemySpeed;
        this.enemySpawnDelay = this.baseSpawnDelay;
        this.lastShotAt = 0;
        this.shotCooldownMs = 150;
        this.nextEnemySpawnAt = 0;
        this.maxEnemiesOnScreen = 1;
        this.nextBossScore = 60;
        this.bossHitsToDefeat = 5;
        this.bossActive = false;
        this.updateDifficultyForLevel();

        this.drawBackdrop();

        // Keep a simple invisible hitbox for physics; visuals are handled by custom fighter art.
        this.player = this.add.rectangle(600, 535, 78, 68, 0xffffff, 0);
        this.physics.add.existing(this.player);
        this.player.body.setAllowGravity(false);
        this.player.body.setImmovable(true);
        this.player.body.setCollideWorldBounds(true);
        this.playerVisual = this.createPlayerVisual(this.player.x, this.player.y);

        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D'),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        this.input.on('pointerdown', () => {
            this.unlockAudio();
            this.tryShoot();
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            this.unlockAudio();
            this.tryShoot();
        });

        // Spawn one enemy immediately so the game starts with action.
        this.spawnEnemy();
        this.nextEnemySpawnAt = this.time.now + this.enemySpawnDelay;

        this.updateHUD();
    }

    createPlayerVisual(x, y) {
        const pilot = this.add.container(x, y);
        const body = this.add.rectangle(0, 14, 34, 46, 0x22c55e);
        const jacket = this.add.rectangle(0, 12, 24, 34, 0x15803d);
        const neck = this.add.rectangle(0, -8, 12, 8, 0xf1c27d);
        const head = this.add.circle(0, -24, 16, 0xf1c27d);
        const hair = this.add.ellipse(0, -30, 28, 12, 0x1f2937);
        const eyeLeft = this.add.circle(-5, -24, 2, 0x111827);
        const eyeRight = this.add.circle(5, -24, 2, 0x111827);
        const armLeft = this.add.rectangle(-20, 12, 10, 28, 0xf1c27d);
        const armRight = this.add.rectangle(20, 12, 10, 28, 0xf1c27d);
        const blaster = this.add.rectangle(30, 10, 12, 28, 0x334155);
        const legLeft = this.add.rectangle(-8, 38, 10, 18, 0x14532d);
        const legRight = this.add.rectangle(8, 38, 10, 18, 0x14532d);

        pilot.add([body, jacket, neck, head, hair, eyeLeft, eyeRight, armLeft, armRight, blaster, legLeft, legRight]);
        return pilot;
    }

    createEnemyVisual(x, y, color, isBoss = false) {
        const enemy = this.add.container(x, y);

        if (isBoss) {
            const coat = this.add.rectangle(0, 14, 74, 96, 0x7e22ce);
            const armor = this.add.rectangle(0, 12, 54, 62, 0x6d28d9);
            const neck = this.add.rectangle(0, -30, 16, 10, 0xf1c27d);
            const head = this.add.circle(0, -52, 23, 0xf1c27d);
            const helmet = this.add.ellipse(0, -58, 44, 16, 0x312e81);
            const eyeLeft = this.add.circle(-8, -52, 3, 0x111827);
            const eyeRight = this.add.circle(8, -52, 3, 0x111827);
            const armLeft = this.add.rectangle(-42, 12, 16, 44, 0xf1c27d);
            const armRight = this.add.rectangle(42, 12, 16, 44, 0xf1c27d);
            const cannon = this.add.rectangle(58, 16, 14, 44, 0xfef08a);
            enemy.add([coat, armor, neck, head, helmet, eyeLeft, eyeRight, armLeft, armRight, cannon]);
            return enemy;
        }

        const body = this.add.rectangle(0, 10, 34, 46, color);
        const neck = this.add.rectangle(0, -8, 10, 8, 0xe0ac69);
        const head = this.add.circle(0, -24, 15, 0xe0ac69);
        const helmet = this.add.ellipse(0, -30, 28, 10, 0x0f172a);
        const eyeLeft = this.add.circle(-5, -24, 2, 0x111827);
        const eyeRight = this.add.circle(5, -24, 2, 0x111827);
        const armLeft = this.add.rectangle(-20, 10, 9, 26, 0xe0ac69);
        const armRight = this.add.rectangle(20, 10, 9, 26, 0xe0ac69);
        const blaster = this.add.rectangle(28, 10, 9, 22, 0x1f2937);
        enemy.add([body, neck, head, helmet, eyeLeft, eyeRight, armLeft, armRight, blaster]);
        return enemy;
    }

    updateDifficultyForLevel() {
        const lvl = Math.max(1, this.level || 1);
        this.enemyBaseSpeed = Math.min(240, this.baseEnemySpeed + ((lvl - 1) * 14));
        this.enemySpawnDelay = Math.max(420, this.baseSpawnDelay - ((lvl - 1) * 120));
        this.maxEnemiesOnScreen = Math.min(4, 1 + Math.floor((lvl - 1) / 2));
        this.bossHitsToDefeat = Math.min(20, 8 + Math.floor((lvl - 1) / 2));
    }

    drawBackdrop() {
        this.add.rectangle(600, 300, 1200, 600, 0x081226);
        this.add.circle(180, 140, 170, 0x1d4ed8, 0.22);
        this.add.circle(980, 170, 150, 0x9333ea, 0.2);
        this.add.circle(760, 430, 210, 0x0ea5e9, 0.16);
        this.add.circle(300, 470, 140, 0xf43f5e, 0.14);

        const stars = this.add.group();
        const starColors = [0xf8fafc, 0xfef08a, 0x93c5fd, 0xf9a8d4, 0x86efac];
        for (let i = 0; i < 90; i++) {
            const x = Phaser.Math.Between(20, 1180);
            const y = Phaser.Math.Between(10, 590);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.35, 0.95);
            const color = starColors[Phaser.Math.Between(0, starColors.length - 1)];
            const star = this.add.rectangle(x, y, size, size, color, alpha);
            stars.add(star);
        }

        this.tweens.add({
            targets: stars.getChildren(),
            alpha: { from: 0.25, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            stagger: 30
        });
    }

    spawnEnemy() {
        if (this.isGameOver) {
            return;
        }

        if (this.enemies.countActive(true) >= this.maxEnemiesOnScreen) {
            return;
        }

        if (this.score >= this.nextBossScore) {
            this.spawnBossEnemy();
            this.nextBossScore += 80;
            return;
        }

        const x = Phaser.Math.Between(40, 1160);
        const size = Phaser.Math.Between(26, 48);
        const palette = [0xff4d6d, 0xff7b00, 0xfb7185, 0xf97316, 0xf43f5e];
        const color = palette[Phaser.Math.Between(0, palette.length - 1)];
        const enemy = this.add.rectangle(x, -30, size, size, 0xffffff, 0);
        this.physics.add.existing(enemy);
        enemy.body.setAllowGravity(false);
        const speed = this.enemyBaseSpeed + Phaser.Math.Between(-8, 12);
        enemy.body.setVelocityY(speed);
        enemy.fallSpeed = speed;
        enemy.flyBaseX = x;
        enemy.visual = this.createEnemyVisual(x, -30, color, false);
        this.enemies.add(enemy);
    }

    spawnBossEnemy() {
        const boss = this.add.rectangle(600, -70, 150, 110, 0xffffff, 0);
        this.physics.add.existing(boss);
        boss.body.setAllowGravity(false);
        boss.body.setVelocityY(this.enemyBaseSpeed * 0.95);
        boss.fallSpeed = this.enemyBaseSpeed * 0.95;
        boss.flyBaseX = 600;
        boss.isBoss = true;
        boss.hp = this.bossHitsToDefeat + Math.floor(this.level / 2);
        boss.baseColor = 0xa855f7;
        boss.visual = this.createEnemyVisual(600, -70, 0xa855f7, true);
        this.enemies.add(boss);
        this.bossActive = true;
        this.maxEnemiesOnScreen = Math.max(this.maxEnemiesOnScreen, 2);
        this.enemySpawnDelay = Math.max(300, this.enemySpawnDelay - 120);
        this.playBossSound();

        const bossText = this.add.text(this.cameras.main.centerX, 120, 'BOSS!', {
            fontSize: '34px',
            color: '#ffffff',
            backgroundColor: '#7e22ce',
            padding: { x: 16, y: 8 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
            targets: bossText,
            alpha: 0,
            y: 84,
            duration: 1200,
            onComplete: () => bossText.destroy()
        });
    }

    tryShoot() {
        if (this.isGameOver || !this.player) {
            return;
        }

        const now = this.time.now;
        if ((now - this.lastShotAt) < this.shotCooldownMs) {
            return;
        }

        this.lastShotAt = now;
        this.fireBullet();
        this.playLaserSound();
    }

    fireBullet() {
        if (this.isGameOver || !this.player) {
            return;
        }

        const bullet = this.add.ellipse(this.player.x, this.player.y - 34, 14, 42, 0xfef08a);
        bullet.setStrokeStyle(2, 0xffffff, 0.9);
        bullet.trail = this.add.circle(bullet.x, bullet.y + 20, 5, 0xf97316, 0.9);
        this.physics.add.existing(bullet);
        bullet.body.setAllowGravity(false);
        bullet.body.setVelocityY(-760);
        bullet.flySpeed = 760;
        this.bullets.add(bullet);
    }

    destroyBullet(bullet) {
        if (!bullet) {
            return;
        }

        if (bullet.trail) {
            bullet.trail.destroy();
            bullet.trail = null;
        }

        if (bullet.active) {
            bullet.destroy();
        }
    }

    intersects(a, b) {
        if (!a || !b || !a.active || !b.active) {
            return false;
        }
        return Phaser.Geom.Intersects.RectangleToRectangle(a.getBounds(), b.getBounds());
    }

    checkManualHits() {
        if (this.isGameOver) {
            return;
        }

        this.bullets.children.each(bullet => {
            if (!bullet || !bullet.active) {
                return;
            }

            this.enemies.children.each(enemy => {
                if (!enemy || !enemy.active || !bullet.active) {
                    return;
                }

                if (this.intersects(bullet, enemy)) {
                    this.hitEnemy(bullet, enemy);
                }
            });
        });

        this.enemies.children.each(enemy => {
            if (!enemy || !enemy.active || !this.player || !this.player.active) {
                return;
            }

            if (this.intersects(this.player, enemy)) {
                this.hitPlayer(this.player, enemy);
            }
        });
    }

    hitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active || this.isGameOver) {
            return;
        }

        this.destroyBullet(bullet);
        const defeatedBoss = !!enemy.isBoss && enemy.hp <= 1;

        if (enemy.isBoss) {
            enemy.hp -= 1;
            // Each boss hit enrages the battle: faster boss + faster enemy waves.
            enemy.fallSpeed = Math.min(360, (enemy.fallSpeed || this.enemyBaseSpeed) + 40);
            this.enemySpawnDelay = Math.max(220, this.enemySpawnDelay - 80);
            this.maxEnemiesOnScreen = Math.min(5, this.maxEnemiesOnScreen + 1);

            if (enemy.hp > 0 && enemy.hp % 2 === 0) {
                this.spawnEnemy();
            }
            if (enemy.visual) {
                enemy.visual.setScale(1.06);
                this.time.delayedCall(120, () => {
                    if (enemy && enemy.active && enemy.visual) {
                        enemy.visual.setScale(1);
                    }
                });
            }

            if (enemy.hp > 0) {
                this.playHitSound();
                return;
            }
        }

        if (enemy.visual) {
            enemy.visual.destroy();
            enemy.visual = null;
        }
        enemy.destroy();

        this.score += enemy.isBoss ? 50 : 10;
        ShootingScene.currentScore = this.score;

        if (defeatedBoss) {
            this.playBossDownSound();
            this.bossActive = false;
            this.level += 1;
            ShootingScene.currentLevel = this.level;
            this.updateDifficultyForLevel();
            this.nextEnemySpawnAt = Math.min(this.nextEnemySpawnAt, this.time.now + this.enemySpawnDelay);

            const bossToast = this.add.text(this.cameras.main.centerX, 108, `BOSS DOWN! LEVEL ${this.level}`, {
                fontSize: '30px',
                color: '#ffffff',
                backgroundColor: '#2563eb',
                padding: { x: 14, y: 7 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0);

            this.tweens.add({
                targets: bossToast,
                alpha: 0,
                y: 70,
                duration: 1200,
                onComplete: () => bossToast.destroy()
            });
        }

        const nextLevel = Math.floor(this.score / 220) + 1;
        if (nextLevel > this.level) {
            this.level = nextLevel;
            ShootingScene.currentLevel = this.level;
            this.updateDifficultyForLevel();
            this.nextEnemySpawnAt = Math.min(this.nextEnemySpawnAt, this.time.now + this.enemySpawnDelay);

            const levelToast = this.add.text(this.cameras.main.centerX, 72, this.formatText('levelUp', { level: this.level }), {
                fontSize: '28px',
                color: '#fef08a',
                backgroundColor: '#111827',
                padding: { x: 12, y: 6 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0);

            this.tweens.add({
                targets: levelToast,
                alpha: 0,
                y: 38,
                duration: 900,
                onComplete: () => levelToast.destroy()
            });
        }

        this.updateHUD();
    }

    hitPlayer(player, enemy) {
        if (this.isGameOver || !enemy.active) {
            return;
        }

        if (enemy.visual) {
            enemy.visual.destroy();
            enemy.visual = null;
        }
        enemy.destroy();
        this.playHitSound();
        this.loseLife();
    }

    loseLife() {
        if (this.isGameOver) {
            return;
        }

        this.lives -= 1;
        ShootingScene.currentLives = this.lives;
        this.updateHUD();

        const hitText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('hit'), {
            fontSize: '32px',
            color: '#fb7185',
            backgroundColor: '#111827',
            padding: { x: 14, y: 8 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.time.delayedCall(320, () => hitText.destroy());

        if (this.lives <= 0) {
            this.endRun();
        }
    }

    endRun() {
        this.isGameOver = true;
        this.physics.pause();
        this.stopThemeMusic();

        this.enemies.children.each(enemy => {
            if (enemy && enemy.visual) {
                enemy.visual.destroy();
                enemy.visual = null;
            }
        });

        if (this.playerVisual) {
            this.playerVisual.destroy();
            this.playerVisual = null;
        }

        this.enemies.clear(true, true);
        this.bullets.children.each(bullet => {
            this.destroyBullet(bullet);
        });
        this.bullets.clear(true, true);

        const gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('gameOver'), {
            fontSize: '40px',
            color: '#f87171',
            backgroundColor: '#111827',
            padding: { x: 18, y: 10 },
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        const loggedInUser = localStorage.getItem('loggedInUser');
        const playerName = (loggedInUser && loggedInUser.trim()) || localStorage.getItem('playerName') || 'Player';
        const playerId = loggedInUser
            ? `user-${loggedInUser.toLowerCase().replace(/\s+/g, '-')}`
            : (localStorage.getItem('playerId') || null);
        if (window.addLeaderboardEntry) {
            window.addLeaderboardEntry(playerName, this.score, this.level, playerId, 'star-paws-shooter', this.score);
        }

        this.time.delayedCall(1200, () => {
            gameOverText.destroy();
            ShootingScene.resetProgress();
            this.scene.restart();
        });
    }

    updateHUD() {
        const scoreElement = document.getElementById('score-value');
        const levelElement = document.getElementById('level-value');
        const livesElement = document.getElementById('lives-value');

        if (scoreElement) {
            scoreElement.textContent = String(this.score);
        }
        if (levelElement) {
            levelElement.textContent = String(this.level);
        }
        if (livesElement) {
            livesElement.textContent = String(Math.max(0, this.lives));
        }
    }

    update(time, delta) {
        if (this.isGameOver || !this.player) {
            return;
        }

        let direction = 0;
        let verticalDirection = 0;
        const touchControls = window.ArcadeTouchControls;
        const touchLeft = !!(touchControls && typeof touchControls.isLeftActive === 'function' && touchControls.isLeftActive());
        const touchRight = !!(touchControls && typeof touchControls.isRightActive === 'function' && touchControls.isRightActive());
        const touchShoot = !!(touchControls && typeof touchControls.consumeJump === 'function' && touchControls.consumeJump());

        if (this.keys.w.isDown || this.cursors.up.isDown) {
            verticalDirection -= 1;
        }
        if (this.keys.s.isDown || this.cursors.down.isDown) {
            verticalDirection += 1;
        }

        if (this.keys.a.isDown || this.cursors.left.isDown || touchLeft) {
            direction -= 1;
        }
        if (this.keys.d.isDown || this.cursors.right.isDown || touchRight) {
            direction += 1;
        }

        this.player.body.setVelocityX(direction * this.moveSpeed);
        this.player.body.setVelocityY(verticalDirection * this.moveSpeed);
        this.player.y = Phaser.Math.Clamp(this.player.y, 100, 560);
        if (this.playerVisual) {
            this.playerVisual.setPosition(this.player.x, this.player.y);
        }

        if (this.time.now >= this.nextEnemySpawnAt) {
            this.spawnEnemy();
            this.nextEnemySpawnAt = this.time.now + this.enemySpawnDelay;
        }

        if (this.keys.space.isDown || touchShoot) {
            this.tryShoot();
        }

        this.enemies.children.each(enemy => {
            if (enemy && enemy.active) {
                enemy.y += (enemy.fallSpeed || this.enemyBaseSpeed) * (delta / 1000);
            }

            if (enemy && enemy.active && enemy.y > 650) {
                enemy.destroy();
                this.loseLife();
                return;
            }

            if (enemy && enemy.active) {
                enemy.x = Phaser.Math.Clamp(enemy.flyBaseX, 30, 1170);
                if (enemy.visual) {
                    enemy.visual.setPosition(enemy.x, enemy.y);
                }
            }
        });

        this.bullets.children.each(bullet => {
            if (bullet && bullet.active) {
                bullet.y -= (bullet.flySpeed || 560) * (delta / 1000);
                if (bullet.trail && bullet.trail.active) {
                    bullet.trail.x = bullet.x;
                    bullet.trail.y = bullet.y + 20;
                    bullet.trail.setScale(Phaser.Math.FloatBetween(0.75, 1.1));
                    bullet.trail.fillColor = Phaser.Math.Between(0xf97316, 0xfbbf24);
                    bullet.trail.setAlpha(Phaser.Math.FloatBetween(0.55, 0.95));
                }
            }

            if (bullet && bullet.active && bullet.y < -20) {
                this.destroyBullet(bullet);
            }
        });

        this.checkManualHits();
    }
}

window.ShootingScene = ShootingScene;