class FightingGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightingGameScene' });
        this.player = null;
        this.ai = null;
        this.ground = null;
        this.playerHealth = 100;
        this.aiHealth = 100;
        this.roundOver = false;
        this.aiThinkMs = 0;
        this.touchOverlay = null;
        this.touchState = {
            left: false,
            right: false,
            jump: false,
            attack: false
        };
    }

    getLang() {
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        return ['en', 'zh-CN', 'ko-KR'].includes(lang) ? lang : 'en';
    }

    getText(path) {
        const dict = {
            en: {
                title: 'Cat Fight Arena',
                subtitle: 'Beat the rival cat first!',
                controls: 'Move: A/D or Left/Right | Jump: W/Up | Attack: SPACE',
                ready: 'Round Start! Fight!',
                youWin: 'You Win! Press R for rematch.',
                youLose: 'You Lose! Press R for rematch.',
                hudPlayer: 'P1 HP',
                hudAi: 'P2 HP'
            },
            'zh-CN': {
                title: '猫咪格斗场',
                subtitle: '先击败对手猫咪！',
                controls: '移动: A/D 或 左右键 | 跳跃: W/上键 | 攻击: 空格',
                ready: '回合开始！开打！',
                youWin: '你赢了！按 R 再来一局。',
                youLose: '你输了！按 R 再来一局。',
                hudPlayer: '玩家血量',
                hudAi: 'AI 血量'
            },
            'ko-KR': {
                title: '고양이 격투 아레나',
                subtitle: '상대 고양이를 먼저 쓰러뜨리세요!',
                controls: '이동: A/D 또는 좌/우 | 점프: W/위 | 공격: SPACE',
                ready: '라운드 시작! 파이트!',
                youWin: '승리! R로 재시작.',
                youLose: '패배! R로 재시작.',
                hudPlayer: 'P1 HP',
                hudAi: 'P2 HP'
            }
        };
        const lang = this.getLang();
        return (dict[lang] && dict[lang][path]) || dict.en[path] || path;
    }

    create() {
        this.playerHealth = 100;
        this.aiHealth = 100;
        this.roundOver = false;
        this.aiThinkMs = 0;

        this.physics.world.gravity.y = 1500;
        this.cameras.main.setBackgroundColor('#1f2937');

        this.drawArena();
        this.createFighters();
        this.bindControls();
        this.setupHud();
        this.mountTouchControls();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.unmountTouchControls();
        });

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.unmountTouchControls();
        });
    }

    drawArena() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x334155, 0x334155, 1);
        bg.fillRect(0, 0, 1200, 600);

        const moon = this.add.graphics();
        moon.fillStyle(0xfef08a, 0.9);
        moon.fillCircle(1020, 95, 44);

        const skyline = this.add.graphics();
        skyline.fillStyle(0x111827, 1);
        skyline.fillRect(0, 250, 1200, 220);
        for (let i = 0; i < 24; i++) {
            const x = 20 + i * 50;
            const h = 40 + ((i * 19) % 120);
            skyline.fillStyle(0x0b1220, 1);
            skyline.fillRect(x, 250 - h, 36, h + 220);
        }

        this.ground = this.add.rectangle(600, 540, 1200, 120, 0x374151);
        this.physics.add.existing(this.ground, true);

        this.add.text(600, 48, this.getText('title'), {
            fontSize: '44px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#f9fafb',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(600, 90, this.getText('subtitle'), {
            fontSize: '22px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#cbd5e1'
        }).setOrigin(0.5);
    }

    createFighters() {
        this.player = this.createFighter(300, 430, 0xf59e0b, 'YOU');
        this.ai = this.createFighter(900, 430, 0x60a5fa, 'AI');

        this.player.facing = 1;
        this.ai.facing = -1;

        this.physics.add.collider(this.player.sprite, this.ground);
        this.physics.add.collider(this.ai.sprite, this.ground);
    }

    createFighter(x, y, bodyColor, labelText) {
        const container = this.add.container(x, y);
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        graphics.fillStyle(bodyColor, 1);
        graphics.fillRoundedRect(-24, -42, 48, 60, 12);
        graphics.fillStyle(0xf8fafc, 1);
        graphics.fillCircle(0, -58, 16);
        graphics.fillStyle(0x111827, 1);
        graphics.fillCircle(-6, -60, 3);
        graphics.fillCircle(6, -60, 3);
        graphics.fillStyle(0x0f172a, 0.8);
        graphics.fillRect(-18, 16, 14, 34);
        graphics.fillRect(4, 16, 14, 34);

        container.add(graphics);

        const label = this.add.text(0, -92, labelText, {
            fontSize: '16px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        this.physics.add.existing(container);
        container.body.setSize(40, 88);
        container.body.setOffset(-20, -44);
        container.body.setCollideWorldBounds(true);
        container.body.setDragX(1800);

        return {
            sprite: container,
            label,
            nextAttackAt: 0,
            facing: 1,
            attackFlash: false
        };
    }

    bindControls() {
        this.leftKey = this.input.keyboard.addKey('A');
        this.rightKey = this.input.keyboard.addKey('D');
        this.jumpKey = this.input.keyboard.addKey('W');
        this.altLeft = this.input.keyboard.addKey('LEFT');
        this.altRight = this.input.keyboard.addKey('RIGHT');
        this.altJump = this.input.keyboard.addKey('UP');
        this.attackKey = this.input.keyboard.addKey('SPACE');
        this.restartKey = this.input.keyboard.addKey('R');
    }

    setupHud() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const speedEl = document.getElementById('speed');
        const livesEl = document.getElementById('lives');

        if (speedEl) speedEl.style.display = 'none';
        if (livesEl) livesEl.style.display = 'none';

        if (scoreEl) scoreEl.innerHTML = `<span id="score-value">${this.getText('hudPlayer')}: 100</span>`;
        if (levelEl) levelEl.innerHTML = `<span id="level-value">${this.getText('hudAi')}: 100</span>`;

        this.statusText = this.add.text(600, 575, this.getText('controls'), {
            fontSize: '18px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#e5e7eb',
            align: 'center'
        }).setOrigin(0.5, 1);

        this.roundText = this.add.text(600, 130, this.getText('ready'), {
            fontSize: '26px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#facc15',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.roundText,
            alpha: 0,
            delay: 900,
            duration: 700
        });
    }

    mountTouchControls() {
        this.unmountTouchControls();

        const host = document.getElementById('game-page');
        if (!host) return;

        const root = document.createElement('div');
        root.dataset.fightTouch = 'true';
        root.style.position = 'absolute';
        root.style.left = '0';
        root.style.right = '0';
        root.style.bottom = '12px';
        root.style.display = 'flex';
        root.style.justifyContent = 'space-between';
        root.style.pointerEvents = 'none';
        root.style.padding = '0 16px';
        root.style.zIndex = '280';

        root.innerHTML = `
            <div style="display:flex;gap:10px;pointer-events:auto;">
                <button data-touch="left" style="width:64px;height:64px;border:none;border-radius:14px;background:rgba(15,23,42,0.72);color:#fff;font-size:24px;">◀</button>
                <button data-touch="right" style="width:64px;height:64px;border:none;border-radius:14px;background:rgba(15,23,42,0.72);color:#fff;font-size:24px;">▶</button>
            </div>
            <div style="display:flex;gap:10px;pointer-events:auto;">
                <button data-touch="jump" style="width:84px;height:64px;border:none;border-radius:14px;background:rgba(2,132,199,0.78);color:#fff;font-size:18px;font-weight:700;">JUMP</button>
                <button data-touch="attack" style="width:84px;height:64px;border:none;border-radius:14px;background:rgba(220,38,38,0.82);color:#fff;font-size:18px;font-weight:700;">HIT</button>
            </div>
        `;

        const setTouch = (key, active) => {
            this.touchState[key] = active;
        };

        root.querySelectorAll('button[data-touch]').forEach(btn => {
            const key = btn.getAttribute('data-touch');
            const start = event => {
                event.preventDefault();
                setTouch(key, true);
            };
            const end = event => {
                event.preventDefault();
                setTouch(key, false);
            };
            btn.addEventListener('pointerdown', start);
            btn.addEventListener('pointerup', end);
            btn.addEventListener('pointerleave', end);
            btn.addEventListener('pointercancel', end);
        });

        host.appendChild(root);
        this.touchOverlay = root;
    }

    unmountTouchControls() {
        const stale = document.querySelectorAll('[data-fight-touch="true"]');
        stale.forEach(node => {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        this.touchOverlay = null;
        this.touchState.left = false;
        this.touchState.right = false;
        this.touchState.jump = false;
        this.touchState.attack = false;
    }

    tryAttack(attacker, defender, damage, reach, knockback, cooldownMs) {
        if (this.roundOver) return;
        const now = this.time.now;
        if (now < attacker.nextAttackAt) return;

        attacker.nextAttackAt = now + cooldownMs;

        const ax = attacker.sprite.x;
        const ay = attacker.sprite.y;
        const dx = defender.sprite.x;
        const dy = defender.sprite.y;

        const xGap = dx - ax;
        const yGap = Math.abs(dy - ay);
        const facingDir = xGap >= 0 ? 1 : -1;
        attacker.facing = facingDir;

        this.tweens.add({
            targets: attacker.sprite,
            scaleX: 1.06,
            scaleY: 0.96,
            yoyo: true,
            duration: 80
        });

        if (Math.abs(xGap) <= reach && yGap < 85) {
            if (defender === this.ai) {
                this.aiHealth = Math.max(0, this.aiHealth - damage);
            } else {
                this.playerHealth = Math.max(0, this.playerHealth - damage);
            }

            defender.sprite.body.setVelocityX(knockback * facingDir);
            defender.sprite.body.setVelocityY(-240);

            this.cameras.main.shake(90, 0.004);
            this.updateHudValues();
            this.checkRoundEnd();
        }
    }

    checkRoundEnd() {
        if (this.roundOver) return;
        if (this.playerHealth <= 0 || this.aiHealth <= 0) {
            this.roundOver = true;
            const playerWon = this.aiHealth <= 0;
            this.roundText.setText(playerWon ? this.getText('youWin') : this.getText('youLose'));
            this.roundText.setAlpha(1);
            this.roundText.setColor(playerWon ? '#34d399' : '#f87171');
        }
    }

    updateHudValues() {
        const scoreValue = document.getElementById('score-value');
        const levelValue = document.getElementById('level-value');
        if (scoreValue) scoreValue.textContent = `${this.getText('hudPlayer')}: ${this.playerHealth}`;
        if (levelValue) levelValue.textContent = `${this.getText('hudAi')}: ${this.aiHealth}`;
    }

    restartRound() {
        this.scene.restart();
    }

    update(_time, delta) {
        if (!this.player || !this.ai) return;

        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.restartRound();
            return;
        }

        if (this.roundOver) {
            this.player.sprite.body.setVelocityX(0);
            this.ai.sprite.body.setVelocityX(0);
            return;
        }

        const moveLeft = this.leftKey.isDown || this.altLeft.isDown || this.touchState.left;
        const moveRight = this.rightKey.isDown || this.altRight.isDown || this.touchState.right;
        const wantJump = Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.altJump) || this.touchState.jump;
        const wantAttack = Phaser.Input.Keyboard.JustDown(this.attackKey) || this.touchState.attack;

        if (moveLeft && !moveRight) {
            this.player.sprite.body.setVelocityX(-280);
        } else if (moveRight && !moveLeft) {
            this.player.sprite.body.setVelocityX(280);
        } else {
            this.player.sprite.body.setVelocityX(0);
        }

        if (wantJump && this.player.sprite.body.blocked.down) {
            this.player.sprite.body.setVelocityY(-700);
        }

        if (wantAttack) {
            this.tryAttack(this.player, this.ai, 12, 110, 360, 290);
        }

        this.runAi(delta || 0);

        this.player.facing = this.player.sprite.x <= this.ai.sprite.x ? 1 : -1;
        this.ai.facing = this.ai.sprite.x <= this.player.sprite.x ? 1 : -1;

        this.player.sprite.scaleX = this.player.facing;
        this.ai.sprite.scaleX = this.ai.facing;
    }

    runAi(delta) {
        this.aiThinkMs += delta;
        if (this.aiThinkMs < 90) return;
        this.aiThinkMs = 0;

        const dx = this.player.sprite.x - this.ai.sprite.x;
        const distance = Math.abs(dx);

        if (distance > 105) {
            this.ai.sprite.body.setVelocityX(dx > 0 ? 210 : -210);
        } else {
            this.ai.sprite.body.setVelocityX(0);
            if (Math.random() < 0.55) {
                this.tryAttack(this.ai, this.player, 10, 105, 300, 360);
            }
        }

        if (this.ai.sprite.body.blocked.down && Math.random() < 0.06 && distance > 170) {
            this.ai.sprite.body.setVelocityY(-630);
        }
    }
}

window.FightingGameScene = FightingGameScene;
