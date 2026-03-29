class GameScene extends Phaser.Scene {
    static currentLevel = 1;  // Track level across scene restarts
    static currentScore = 0;  // Track score across scene restarts
    static currentLives = 3;  // Track lives across scene restarts
    static currentLanguage = 'en';

    static translation = {
        en: {
            hit: 'HIT!\nRetrying Level...',
            gameOver: 'GAME OVER!\nAll Lives Lost!',
            levelComplete: 'LEVEL COMPLETE!',
            reachDoor: 'LEVEL COMPLETE!',
            fallGameOver: 'FELL OFF!\nGame Over!',
            fallRetry: 'FELL OFF!\nRetrying Level...',
            scoreValue: 'Score',
            levelValue: 'Level'
        },
        'zh-CN': {
            hit: '被击中！\n重试关卡...',
            gameOver: '游戏结束！\n所有生命已失去！',
            levelComplete: '关卡完成！',
            reachDoor: '关卡完成！',
            fallGameOver: '掉下去了！\n游戏结束！',
            fallRetry: '掉下去了！\n重试关卡...',
            scoreValue: '分数',
            levelValue: '关卡'
        },
        'ko-KR': {
            hit: '피격!\n레벨 다시 시도 중...',
            gameOver: '게임 오버!\n모든 목숨을 잃음!',
            levelComplete: '레벨 완료!',
            reachDoor: '레벨 완료!',
            fallGameOver: '떨어짐!\n게임 오버!',
            fallRetry: '떨어짐!\n레벨 다시 시도 중...',
            scoreValue: '점수',
            levelValue: '레벨'
        }
    };

    static setLanguage(lang) {
        GameScene.currentLanguage = lang;
    }

    static resetProgress() {
        GameScene.currentLevel = 1;
        GameScene.currentScore = 0;
        GameScene.currentLives = 3;
    }

    getText(key) {
        const lang = GameScene.currentLanguage || 'en';
        const translation = GameScene.translation[lang] || GameScene.translation.en;
        return translation[key] || GameScene.translation.en[key] || key;
    }

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        try {
            if (window.ArcadeTouchControls && typeof window.ArcadeTouchControls.reset === 'function') {
                window.ArcadeTouchControls.reset();
            }

            // Use static variables to persist state across scene restarts
            this.currentLevel = GameScene.currentLevel;
            this.score = GameScene.currentScore;
            this.lives = GameScene.currentLives;

            // Ensure language context is initialized
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
            GameScene.setLanguage(selectedLanguage);
            
            // Set background color to bright sky blue to debug
            this.cameras.main.setBackgroundColor('#87CEEB');

            // Create blocky clouds
            this.createClouds();

            // Create player using graphics - Minecraft-style blocky cat
            this.player = this.add.rectangle(80, 500, 25, 35, 0xFFA500);
            this.physics.add.existing(this.player);
            this.player.body.setBounce(0.1);
            this.player.body.setCollideWorldBounds(true);
            
            // Create cat features container (Minecraft style)
            this.catFeatures = this.createMinecraftCat(80, 500);

            // Input setup
            this.cursors = this.input.keyboard.createCursorKeys();
            
            this.keys = {
                w: this.input.keyboard.addKey('W'),
                a: this.input.keyboard.addKey('A'),
                d: this.input.keyboard.addKey('D')
            };
            
            this.input.keyboard.on('keydown-SPACE', () => {
                if (this.player.body.touching.down) {
                    this.player.body.setVelocityY(-350);
                }
            });

            this.input.keyboard.on('keydown-W', () => {
                if (this.player.body.touching.down) {
                    this.player.body.setVelocityY(-350);
                }
            });

            this.input.keyboard.on('keydown-UP', () => {
                if (this.player.body.touching.down) {
                    this.player.body.setVelocityY(-350);
                }
            });

            // Camera setup
            this.cameras.main.setBounds(0, 0, 1200, 600);
            this.cameras.main.startFollow(this.player);
            this.physics.world.setBounds(0, 0, 1200, 600);

            // Initialize enemies and door
            this.enemies = this.physics.add.group();
            this.enemyDetails = [];
            this.hearts = []; // Array to track heart objects
            this.hitInProgress = false; // Flag to prevent double hits

            // Setup the level
            this.setupLevel(this.currentLevel);

            // Update UI
            this.updateHUD();

            const scoreLabel = document.getElementById('score');
            const levelLabel = document.getElementById('level');
            if (scoreLabel) scoreLabel.innerHTML = `${this.getText('scoreValue')}: <span id="score-value">${this.score}</span>`;
            if (levelLabel) levelLabel.innerHTML = `${this.getText('levelValue')}: <span id="level-value">${this.currentLevel}</span>`;



        } catch (error) {
            console.error('Error in create():', error);
        }
    }

    tryJump() {
        if (this.player && this.player.body && this.player.body.touching.down) {
            this.player.body.setVelocityY(-350);
        }
    }

    updateHUD() {
        const scoreLabel = document.getElementById('score');
        const levelLabel = document.getElementById('level');

        if (scoreLabel) {
            scoreLabel.innerHTML = `${this.getText('scoreValue')}: <span id="score-value">${this.score}</span>`;
        }

        if (levelLabel) {
            levelLabel.innerHTML = `${this.getText('levelValue')}: <span id="level-value">${this.currentLevel}</span>`;
        }
    }

    setupLevel(levelNumber) {
        try {
            // Clear previous level entities
            this.platforms = this.physics.add.staticGroup();
            if (this.enemies) {
                this.enemies.clear(true, true);
            }
            this.enemyDetails = [];
            if (this.door && this.door.destroy) {
                this.door.destroy();
            }

            // Reset player position
            this.player.x = 80;
            this.player.y = 500;
            this.player.body.setVelocity(0, 0);

            // Add ground platform
            this.addPlatform(600, 570, 1200, 60, 0x8B4513);

            let levelConfig = this.getLevelConfig(levelNumber);

            if (!levelConfig) {
                console.error('Level config undefined for level', levelNumber);
                return;
            }

            // Create platforms based on level config
            if (levelConfig.platforms && Array.isArray(levelConfig.platforms)) {
                levelConfig.platforms.forEach(p => {
                    this.addPlatform(p.x, p.y, p.width, p.height, p.color);
                });
            }

            // Add collider between player and platforms
            this.physics.add.collider(this.player, this.platforms);

            // Create enemies based on level config
            this.createEnemiesForLevel(levelConfig);

            // Create hearts display
            this.createHearts();

            // Reset hit flag for new level
            this.hitInProgress = false;

            // Create door using graphics
            const doorPos = levelConfig.doorPosition;
            if (doorPos) {
                this.door = this.add.rectangle(doorPos.x, doorPos.y, 30, 50, 0x8B4513);
                this.add.rectangle(doorPos.x, doorPos.y - 15, 12, 12, 0x87CEEB);
                this.physics.add.existing(this.door, true);

                // Collisions
                this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
                this.physics.add.overlap(this.player, this.door, this.reachDoor, null, this);
            }
        } catch (error) {
            console.error('Error in setupLevel:', error);
        }
    }

    getLevelConfig(levelNumber) {
        const configs = {
            1: {
                platforms: [
                    { x: 150, y: 490, width: 140, height: 20, color: 0x228B22 },
                    { x: 320, y: 410, width: 140, height: 20, color: 0x228B22 },
                    { x: 480, y: 330, width: 140, height: 20, color: 0x228B22 },
                    { x: 700, y: 270, width: 180, height: 20, color: 0x4169E1 },
                    { x: 900, y: 330, width: 140, height: 20, color: 0x228B22 },
                    { x: 1100, y: 270, width: 140, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 700, y: 235, velocityX: 100, isFlying: false },
                    { x: 480, y: 295, velocityX: -80, isFlying: false },
                    { x: 900, y: 295, velocityX: 90, isFlying: false }
                ],
                doorPosition: { x: 1100, y: 230 }
            },
            2: {
                platforms: [
                    { x: 120, y: 480, width: 100, height: 20, color: 0x228B22 },
                    { x: 280, y: 400, width: 100, height: 20, color: 0x228B22 },
                    { x: 450, y: 340, width: 100, height: 20, color: 0x228B22 },
                    { x: 620, y: 280, width: 100, height: 20, color: 0x4169E1 },
                    { x: 800, y: 340, width: 100, height: 20, color: 0x228B22 },
                    { x: 970, y: 280, width: 100, height: 20, color: 0x228B22 },
                    { x: 1100, y: 270, width: 140, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 620, y: 245, velocityX: 120, isFlying: false },
                    { x: 280, y: 365, velocityX: -100, isFlying: false },
                    { x: 800, y: 305, velocityX: 110, isFlying: false },
                    { x: 970, y: 245, velocityX: -95, isFlying: false }
                ],
                doorPosition: { x: 1100, y: 230 }
            },
            3: {
                platforms: [
                    { x: 100, y: 470, width: 80, height: 20, color: 0x228B22 },
                    { x: 250, y: 390, width: 80, height: 20, color: 0x228B22 },
                    { x: 400, y: 350, width: 80, height: 20, color: 0x228B22 },
                    { x: 550, y: 290, width: 100, height: 20, color: 0x4169E1 },
                    { x: 720, y: 350, width: 80, height: 20, color: 0x228B22 },
                    { x: 870, y: 290, width: 80, height: 20, color: 0x228B22 },
                    { x: 1000, y: 350, width: 80, height: 20, color: 0x228B22 },
                    { x: 1100, y: 270, width: 140, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 550, y: 255, velocityX: 140, isFlying: false },
                    { x: 250, y: 355, velocityX: -120, isFlying: false },
                    { x: 720, y: 315, velocityX: 130, isFlying: false },
                    { x: 870, y: 255, velocityX: -125, isFlying: false },
                    { x: 1000, y: 315, velocityX: 135, isFlying: false },
                    { x: 400, y: 160, velocityX: 100, isFlying: true }
                ],
                doorPosition: { x: 1100, y: 230 }
            },
            4: {
                platforms: [
                    { x: 80, y: 460, width: 70, height: 20, color: 0x228B22 },
                    { x: 220, y: 380, width: 70, height: 20, color: 0x228B22 },
                    { x: 360, y: 360, width: 70, height: 20, color: 0x228B22 },
                    { x: 500, y: 300, width: 90, height: 20, color: 0x4169E1 },
                    { x: 650, y: 360, width: 70, height: 20, color: 0x228B22 },
                    { x: 800, y: 300, width: 70, height: 20, color: 0x228B22 },
                    { x: 950, y: 360, width: 70, height: 20, color: 0x228B22 },
                    { x: 1050, y: 300, width: 70, height: 20, color: 0x228B22 },
                    { x: 1100, y: 270, width: 140, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 500, y: 265, velocityX: 150, isFlying: false },
                    { x: 220, y: 345, velocityX: -140, isFlying: false },
                    { x: 650, y: 325, velocityX: 145, isFlying: false },
                    { x: 800, y: 265, velocityX: -150, isFlying: false },
                    { x: 950, y: 325, velocityX: 155, isFlying: false },
                    { x: 1050, y: 265, velocityX: -145, isFlying: false },
                    { x: 300, y: 200, velocityX: 120, isFlying: true },
                    { x: 750, y: 180, velocityX: -130, isFlying: true }
                ],
                doorPosition: { x: 1100, y: 230 }
            },
            5: {
                platforms: [
                    { x: 100, y: 480, width: 60, height: 20, color: 0x228B22 },
                    { x: 220, y: 400, width: 60, height: 20, color: 0x228B22 },
                    { x: 340, y: 380, width: 60, height: 20, color: 0x228B22 },
                    { x: 480, y: 320, width: 80, height: 20, color: 0x4169E1 },
                    { x: 620, y: 380, width: 60, height: 20, color: 0x228B22 },
                    { x: 740, y: 320, width: 60, height: 20, color: 0x228B22 },
                    { x: 880, y: 380, width: 60, height: 20, color: 0x228B22 },
                    { x: 1000, y: 320, width: 60, height: 20, color: 0x228B22 },
                    { x: 1100, y: 270, width: 140, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 480, y: 285, velocityX: 160, isFlying: false },
                    { x: 220, y: 365, velocityX: -155, isFlying: false },
                    { x: 620, y: 345, velocityX: 165, isFlying: false },
                    { x: 740, y: 285, velocityX: -160, isFlying: false },
                    { x: 880, y: 345, velocityX: 170, isFlying: false },
                    { x: 1000, y: 285, velocityX: -165, isFlying: false },
                    { x: 200, y: 250, velocityX: 140, isFlying: true },
                    { x: 600, y: 220, velocityX: -150, isFlying: true },
                    { x: 950, y: 200, velocityX: 145, isFlying: true }
                ],
                doorPosition: { x: 1100, y: 230 }
            },
            6: {
                platforms: [
                    { x: 80, y: 490, width: 50, height: 20, color: 0x228B22 },
                    { x: 160, y: 430, width: 60, height: 20, color: 0x228B22 },
                    { x: 260, y: 380, width: 70, height: 20, color: 0x228B22 },
                    { x: 360, y: 340, width: 80, height: 20, color: 0x4169E1 },
                    { x: 470, y: 300, width: 90, height: 20, color: 0x228B22 },
                    { x: 600, y: 360, width: 70, height: 20, color: 0x228B22 },
                    { x: 720, y: 320, width: 70, height: 20, color: 0x228B22 },
                    { x: 840, y: 280, width: 80, height: 20, color: 0x228B22 },
                    { x: 960, y: 310, width: 110, height: 20, color: 0x228B22 },
                    { x: 1040, y: 270, width: 80, height: 20, color: 0x228B22 },
                    { x: 1080, y: 230, width: 80, height: 20, color: 0xFFD700 }
                ],
                enemies: [
                    { x: 460, y: 295, velocityX: 130, isFlying: false },
                    { x: 200, y: 375, velocityX: -125, isFlying: false },
                    { x: 600, y: 355, velocityX: 130, isFlying: false },
                    { x: 720, y: 295, velocityX: -130, isFlying: false },
                    { x: 860, y: 355, velocityX: 135, isFlying: false },
                    { x: 220, y: 310, velocityX: 90, isFlying: true },
                    { x: 560, y: 260, velocityX: -100, isFlying: true }
                ],
                doorPosition: { x: 1080, y: 210 }
            }
        };

        // If level doesn't exist, create a progressively harder version
        if (!configs[levelNumber]) {
            const baseConfig = configs[4]; // Use level 4 as base
            const speedMultiplier = 1 + (levelNumber - 4) * 0.1;
            const enemyCount = 6 + (levelNumber - 4);
            
            return {
                platforms: baseConfig.platforms,
                enemies: baseConfig.enemies.map((e, i) => ({
                    ...e,
                    velocityX: e.velocityX > 0 ? Math.abs(e.velocityX) * speedMultiplier : -Math.abs(e.velocityX) * speedMultiplier
                })).concat(
                    Array(Math.min(enemyCount - baseConfig.enemies.length, 3)).fill(null).map((_, i) => ({
                        x: 300 + i * 300,
                        y: 320,
                        velocityX: 150 * speedMultiplier * (i % 2 === 0 ? 1 : -1),
                        isFlying: i === 2 // Make some new enemies flying for variety
                    }))
                ),
                doorPosition: baseConfig.doorPosition
            };
        }

        return configs[levelNumber];
    }

    createEnemiesForLevel(levelConfig) {
        this.enemies = this.physics.add.group();
        this.enemyDetails = [];

        if (!levelConfig || !levelConfig.enemies || !Array.isArray(levelConfig.enemies)) {
            return; // Safety check - no enemies for this level
        }

        levelConfig.enemies.forEach(enemyConfig => {
            const enemy = this.add.rectangle(enemyConfig.x, enemyConfig.y, 25, 30, 0xFF0000);
            this.physics.add.existing(enemy);
            
            if (enemyConfig.isFlying) {
                // Flying enemy: moves horizontally and bobs up/down
                enemy.body.setVelocityX(enemyConfig.velocityX * 0.8);
                enemy.body.setVelocityY(0);
                enemy.body.setBounce(1, 1);
                enemy.body.setCollideWorldBounds(true);
                enemy.body.setAllowGravity(false); // Flying enemies don't fall
                enemy.isFlying = true;
                enemy.startY = enemyConfig.y;
                enemy.flyingOffset = 0;
                // Flying enemies don't collide with platforms
            } else {
                // Ground enemy: bounces on platforms
                enemy.body.setVelocityX(enemyConfig.velocityX);
                enemy.body.setBounce(1, 0);
                enemy.body.setCollideWorldBounds(true);
                this.physics.add.collider(enemy, this.platforms);
            }
            
            this.enemies.add(enemy);

            const enemyDetails = enemyConfig.isFlying 
                ? this.createFlyingEnemy(enemyConfig.x, enemyConfig.y)
                : this.createDetailedEnemy(enemyConfig.x, enemyConfig.y);
            this.enemyDetails.push({ graphics: enemyDetails, physics: enemy });
        });
    }

    addPlatform(x, y, width, height, color) {
        // Main platform block
        const platform = this.add.rectangle(x, y, width, height, color);
        this.physics.add.existing(platform, true);
        this.platforms.add(platform);
        
        // Add darker top edge for Minecraft grass block effect
        const darkerColor = this.darkenColor(color);
        this.add.rectangle(x, y - height/2 + 3, width, 4, darkerColor);
    }

    darkenColor(color) {
        // Darken a hex color by reducing RGB values
        const r = Math.max(0, ((color >> 16) & 255) - 40);
        const g = Math.max(0, ((color >> 8) & 255) - 40);
        const b = Math.max(0, (color & 255) - 40);
        return (r << 16) | (g << 8) | b;
    }

    createMinecraftCat(x, y) {
        // Create a container for the cat
        const container = this.add.container(x, y);
        
        // Main body (orange rectangle)
        const body = this.add.rectangle(0, 2, 16, 12, 0xFFA500);
        container.add(body);
        
        // Head (orange square, slightly higher)
        const head = this.add.rectangle(0, -10, 12, 12, 0xFFA500);
        container.add(head);
        
        // Left ear
        const leftEar = this.add.rectangle(-4, -18, 4, 5, 0xFFA500);
        container.add(leftEar);
        
        // Right ear
        const rightEar = this.add.rectangle(4, -18, 4, 5, 0xFFA500);
        container.add(rightEar);
        
        // Inner left ear (pink)
        const leftEarInner = this.add.rectangle(-4, -17, 2, 2, 0xFF69B4);
        container.add(leftEarInner);
        
        // Inner right ear (pink)
        const rightEarInner = this.add.rectangle(4, -17, 2, 2, 0xFF69B4);
        container.add(rightEarInner);
        
        // Left eye (black square)
        const leftEye = this.add.rectangle(-3, -12, 2, 2, 0x000000);
        container.add(leftEye);
        
        // Right eye (black square)
        const rightEye = this.add.rectangle(3, -12, 2, 2, 0x000000);
        container.add(rightEye);
        
        // Left eye white highlight
        const leftHighlight = this.add.rectangle(-2, -13, 1, 1, 0xFFFFFF);
        container.add(leftHighlight);
        
        // Right eye white highlight
        const rightHighlight = this.add.rectangle(4, -13, 1, 1, 0xFFFFFF);
        container.add(rightHighlight);
        
        // Nose (pink triangle - small square)
        const nose = this.add.rectangle(0, -8, 2, 2, 0xFF69B4);
        container.add(nose);
        
        // Mouth (black line represented as thin rectangles)
        const mouthLeft = this.add.rectangle(-2, -6, 1, 1, 0x000000);
        container.add(mouthLeft);
        
        const mouthRight = this.add.rectangle(2, -6, 1, 1, 0x000000);
        container.add(mouthRight);
        
        // Front left leg (white)
        const frontLeftLeg = this.add.rectangle(-5, 12, 3, 8, 0xFFFFFF);
        container.add(frontLeftLeg);
        
        // Front right leg (white)
        const frontRightLeg = this.add.rectangle(5, 12, 3, 8, 0xFFFFFF);
        container.add(frontRightLeg);
        
        // Back left leg (white)
        const backLeftLeg = this.add.rectangle(-6, 12, 2, 6, 0xFFFFFF);
        container.add(backLeftLeg);
        
        // Back right leg (white)
        const backRightLeg = this.add.rectangle(6, 12, 2, 6, 0xFFFFFF);
        container.add(backRightLeg);
        
        // Tail (orange, extends to the right and curves down)
        const tailBase = this.add.rectangle(9, -2, 4, 3, 0xFFA500);
        container.add(tailBase);
        
        const tailMid = this.add.rectangle(12, 3, 3, 3, 0xFFA500);
        container.add(tailMid);
        
        const tailTip = this.add.rectangle(13, 8, 2, 3, 0xFFA500);
        container.add(tailTip);
        
        return container;
    }

    createDetailedEnemy(x, y) {
        // Create a container for the detailed enemy
        const container = this.add.container(x, y);
        
        // Main body (red rectangle)
        const body = this.add.rectangle(0, 0, 20, 24, 0xCC0000);
        container.add(body);
        
        // Left eye (black square)
        const leftEye = this.add.rectangle(-5, -6, 3, 3, 0x000000);
        container.add(leftEye);
        
        // Right eye (black square)
        const rightEye = this.add.rectangle(5, -6, 3, 3, 0x000000);
        container.add(rightEye);
        
        // Left eye white highlight
        const leftHighlight = this.add.rectangle(-4, -7, 1, 1, 0xFFFFFF);
        container.add(leftHighlight);
        
        // Right eye white highlight
        const rightHighlight = this.add.rectangle(6, -7, 1, 1, 0xFFFFFF);
        container.add(rightHighlight);
        
        // Top spikes (menacing look)
        const spike1 = this.add.rectangle(-6, -14, 2, 4, 0xFF3333);
        container.add(spike1);
        
        const spike2 = this.add.rectangle(0, -14, 2, 4, 0xFF3333);
        container.add(spike2);
        
        const spike3 = this.add.rectangle(6, -14, 2, 4, 0xFF3333);
        container.add(spike3);
        
        // Mouth opening (dark red)
        const mouth = this.add.rectangle(0, 4, 10, 3, 0x990000);
        container.add(mouth);
        
        // Top teeth (white squares)
        const tooth1 = this.add.rectangle(-6, 2, 2, 2, 0xFFFFFF);
        container.add(tooth1);
        
        const tooth2 = this.add.rectangle(-2, 2, 2, 2, 0xFFFFFF);
        container.add(tooth2);
        
        const tooth3 = this.add.rectangle(2, 2, 2, 2, 0xFFFFFF);
        container.add(tooth3);
        
        const tooth4 = this.add.rectangle(6, 2, 2, 2, 0xFFFFFF);
        container.add(tooth4);
        
        // Bottom teeth (white squares)
        const btooth1 = this.add.rectangle(-6, 6, 2, 2, 0xFFFFFF);
        container.add(btooth1);
        
        const btooth2 = this.add.rectangle(-2, 6, 2, 2, 0xFFFFFF);
        container.add(btooth2);
        
        const btooth3 = this.add.rectangle(2, 6, 2, 2, 0xFFFFFF);
        container.add(btooth3);
        
        const btooth4 = this.add.rectangle(6, 6, 2, 2, 0xFFFFFF);
        container.add(btooth4);
        
        // Left arm (darker red)
        const leftArm = this.add.rectangle(-12, 2, 4, 12, 0xCC0000);
        container.add(leftArm);
        
        // Right arm (darker red)
        const rightArm = this.add.rectangle(12, 2, 4, 12, 0xCC0000);
        container.add(rightArm);
        
        return container;
    }

    createFlyingEnemy(x, y) {
        // Create a container for the flying enemy (same as ground enemy but with wings)
        const container = this.add.container(x, y);
        
        // Main body (red rectangle)
        const body = this.add.rectangle(0, 0, 20, 24, 0xCC0000);
        container.add(body);
        
        // Left wing (dark gray/brown)
        const leftWing = this.add.rectangle(-14, -2, 5, 14, 0x555555);
        container.add(leftWing);
        
        // Right wing (dark gray/brown)
        const rightWing = this.add.rectangle(14, -2, 5, 14, 0x555555);
        container.add(rightWing);
        
        // Wing highlights (lighter color for 3D effect)
        const leftWingHi = this.add.rectangle(-14, -4, 2, 8, 0x888888);
        container.add(leftWingHi);
        
        const rightWingHi = this.add.rectangle(14, -4, 2, 8, 0x888888);
        container.add(rightWingHi);
        
        // Left eye (black square)
        const leftEye = this.add.rectangle(-5, -6, 3, 3, 0x000000);
        container.add(leftEye);
        
        // Right eye (black square)
        const rightEye = this.add.rectangle(5, -6, 3, 3, 0x000000);
        container.add(rightEye);
        
        // Left eye white highlight
        const leftHighlight = this.add.rectangle(-4, -7, 1, 1, 0xFFFFFF);
        container.add(leftHighlight);
        
        // Right eye white highlight
        const rightHighlight = this.add.rectangle(6, -7, 1, 1, 0xFFFFFF);
        container.add(rightHighlight);
        
        // Top spikes (menacing look)
        const spike1 = this.add.rectangle(-6, -14, 2, 4, 0xFF3333);
        container.add(spike1);
        
        const spike2 = this.add.rectangle(0, -14, 2, 4, 0xFF3333);
        container.add(spike2);
        
        const spike3 = this.add.rectangle(6, -14, 2, 4, 0xFF3333);
        container.add(spike3);
        
        // Mouth opening (dark red)
        const mouth = this.add.rectangle(0, 4, 10, 3, 0x990000);
        container.add(mouth);
        
        // Top teeth (white squares)
        const tooth1 = this.add.rectangle(-6, 2, 2, 2, 0xFFFFFF);
        container.add(tooth1);
        
        const tooth2 = this.add.rectangle(-2, 2, 2, 2, 0xFFFFFF);
        container.add(tooth2);
        
        const tooth3 = this.add.rectangle(2, 2, 2, 2, 0xFFFFFF);
        container.add(tooth3);
        
        const tooth4 = this.add.rectangle(6, 2, 2, 2, 0xFFFFFF);
        container.add(tooth4);
        
        // Bottom teeth (white squares)
        const btooth1 = this.add.rectangle(-6, 6, 2, 2, 0xFFFFFF);
        container.add(btooth1);
        
        const btooth2 = this.add.rectangle(-2, 6, 2, 2, 0xFFFFFF);
        container.add(btooth2);
        
        const btooth3 = this.add.rectangle(2, 6, 2, 2, 0xFFFFFF);
        container.add(btooth3);
        
        const btooth4 = this.add.rectangle(6, 6, 2, 2, 0xFFFFFF);
        container.add(btooth4);
        
        return container;
    }

    createHearts() {
        // Destroy old hearts if they exist
        if (this.hearts && Array.isArray(this.hearts)) {
            this.hearts.forEach(heart => {
                if (heart && heart.destroy) {
                    heart.destroy();
                }
            });
        }
        this.hearts = [];

        // Create 3 red hearts
        const heartSize = 16;
        const spacing = 25;
        const startX = 20;
        const startY = 70;

        for (let i = 0; i < this.lives; i++) {
            // Create a simple red heart shape (red circle for now, easy to see)
            const heart = this.add.circle(startX + (i * spacing), startY, heartSize / 2, 0xFF0000);
            heart.setScrollFactor(0); // Fix to camera
            heart.setDepth(100); // Render on top
            this.hearts.push(heart);
        }

        // If there is a lives display, update it (but the main life indicators are hearts)
        const livesElement = document.getElementById('lives-value');
        if (livesElement) {
            livesElement.innerText = this.lives;
        }
    }

    createClouds() {
        // Create blocky clouds scattered across the sky
        const cloudData = [
            { x: 150, y: 80 },
            { x: 450, y: 60 },
            { x: 750, y: 100 },
            { x: 1050, y: 70 }
        ];

        cloudData.forEach(cloudPos => {
            this.createBlockyCloud(cloudPos.x, cloudPos.y);
        });
    }

    createBlockyCloud(x, y) {
        // Create a cloud made of white blocky squares
        const cloudSize = 12;
        const spacing = 2;
        
        // Cloud left block
        this.add.rectangle(x - cloudSize - spacing, y, cloudSize, cloudSize, 0xFFFFFF);
        
        // Cloud main block (larger)
        this.add.rectangle(x, y, cloudSize + 8, cloudSize, 0xFFFFFF);
        
        // Cloud right block
        this.add.rectangle(x + cloudSize + spacing, y, cloudSize, cloudSize, 0xFFFFFF);
        
        // Cloud top block (for fluffy effect)
        this.add.rectangle(x, y - cloudSize/2 - spacing, cloudSize + 4, cloudSize - 4, 0xFFFFFF);
    }

    update() {
        try {
            if (!this.player || !this.catFeatures || !this.enemyDetails) {
                return;
            }

            // Player movement with both WASD and arrow keys
            let isMoving = false;
            const touchControls = window.ArcadeTouchControls;
            const touchLeft = !!(touchControls && typeof touchControls.isLeftActive === 'function' && touchControls.isLeftActive());
            const touchRight = !!(touchControls && typeof touchControls.isRightActive === 'function' && touchControls.isRightActive());

            if (touchControls && typeof touchControls.consumeJump === 'function' && touchControls.consumeJump()) {
                this.tryJump();
            }
            
            // Check WASD keys
            if ((this.keys.a.isDown || this.cursors.left.isDown || touchLeft) && !touchRight) {
                this.player.body.setVelocityX(-200);
                isMoving = true;
            } else if ((this.keys.d.isDown || this.cursors.right.isDown || touchRight) && !touchLeft) {
                this.player.body.setVelocityX(200);
                isMoving = true;
            }
            
            // If not moving, stop horizontal velocity
            if (!isMoving) {
                this.player.body.setVelocityX(0);
            }
            
            // Update cat features position to follow player
            if (this.catFeatures && this.catFeatures.setPosition) {
                this.catFeatures.setPosition(this.player.x, this.player.y);
            }

            // Update flying enemy vertical bob pattern
            if (this.enemies) {
                this.enemies.children.entries.forEach(enemy => {
                    if (enemy.isFlying) {
                        // Bob up and down with sine-wave pattern, staying in place
                        enemy.flyingOffset += 0.08;
                        const bobAmount = Math.sin(enemy.flyingOffset) * 30; // 30px up/down range
                        const targetY = enemy.startY + bobAmount;
                        enemy.y = targetY;
                        // Keep horizontal velocity, but no vertical velocity
                        enemy.body.setVelocityY(0);
                    }
                });
            }

            // Update enemy details positions to follow their physics bodies
            if (Array.isArray(this.enemyDetails)) {
                this.enemyDetails.forEach(enemy => {
                    if (enemy && enemy.graphics && enemy.physics) {
                        enemy.graphics.setPosition(enemy.physics.x, enemy.physics.y);
                    }
                });
            }

            // Game over if player falls
            if (this.player.y > 650 && !this.hitInProgress) {
                this.hitInProgress = true;
                this.physics.pause();

                // Decrement lives
                this.lives--;
                GameScene.currentLives = this.lives;
                
                // Remove a heart
                if (this.hearts && this.hearts.length > 0) {
                    const heart = this.hearts.pop();
                    if (heart && heart.destroy) {
                        heart.destroy();
                    }
                }
                
                if (this.lives <= 0) {
                    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'FELL OFF!\\nGame Over!', {
                        fontSize: '32px',
                        color: '#FF0000',
                        backgroundColor: '#000000',
                        padding: { x: 20, y: 10 },
                        align: 'center'
                    }).setOrigin(0.5).setScrollFactor(0);
                    
                    this.time.delayedCall(500, () => {
                        // All lives lost - reset to level 1
                        GameScene.currentLevel = 1;
                        GameScene.currentScore = 0;
                        GameScene.currentLives = 3;
                        this.scene.restart();
                    });
                } else {
                    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('fallRetry'), {
                        fontSize: '32px',
                        color: '#FF6600',
                        backgroundColor: '#000000',
                        padding: { x: 20, y: 10 },
                        align: 'center'
                    }).setOrigin(0.5).setScrollFactor(0);
                    
                    this.time.delayedCall(500, () => {
                        // Retry the same level
                        this.scene.restart();
                    });
                }
            }
        } catch (error) {
            console.error('Error in update():', error);
        }
    }

    hitEnemy(player, enemy) {
        // Prevent multiple hits from registering at once
        if (this.hitInProgress) {
            return;
        }
        this.hitInProgress = true;
        this.physics.pause();

        // Decrement lives
        this.lives--;
        GameScene.currentLives = this.lives;
        
        // Remove a heart
        if (this.hearts && this.hearts.length > 0) {
            const heart = this.hearts.pop();
            if (heart && heart.destroy) {
                heart.destroy();
            }
        }
        
        if (this.lives <= 0) {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('gameOver'), {
                fontSize: '32px',
                color: '#FF0000',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.time.delayedCall(500, () => {
                // All lives lost - reset to level 1
                GameScene.currentLevel = 1;
                GameScene.currentScore = 0;
                GameScene.currentLives = 3;
                this.scene.restart();
            });
        } else {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('hit'), {
                fontSize: '32px',
                color: '#FF6600',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.time.delayedCall(500, () => {
                // Retry the same level
                this.scene.restart();
            });
        }
    }

    reachDoor(player, door) {
        this.physics.pause();
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('levelComplete'), {
            fontSize: '40px',
            color: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Award points for level completion and advance level so score and level stay in sync
        this.score += 100;
        GameScene.currentScore = this.score;

        // Register leaderboard entry for completed level (current player account)
        const loggedInUser = localStorage.getItem('loggedInUser');
        const playerName = (loggedInUser && loggedInUser.trim()) || localStorage.getItem('playerName') || 'Player';
        const playerId = loggedInUser
            ? `user-${loggedInUser.toLowerCase().replace(/\s+/g, '-')}`
            : (localStorage.getItem('playerId') || null);
        if (window.addLeaderboardEntry) {
            // Cat awards 100 points per cleared level.
            window.addLeaderboardEntry(playerName, this.score, this.currentLevel, playerId, 'cat-adventure', 100);
        }

        this.currentLevel++;
        GameScene.currentLevel = this.currentLevel;

        GameScene.currentLives = 3;
        this.lives = 3;

        this.updateHUD();
        
        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }
}

window.GameScene = GameScene;
