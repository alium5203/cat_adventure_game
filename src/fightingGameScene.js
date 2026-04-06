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
        this.weaponShots = null;
        this.touchOverlay = null;
        this.touchState = {
            left: false,
            right: false,
            jump: false,
            attack: false,
            blast: false
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
                subtitle: 'Punch, kick and blast your way to victory!',
                controls: 'Move: A/D or ←/→ | Jump: W/↑ | Punch/Kick: SPACE | Blast: F',
                ready: 'Round Start! Fight!',
                youWin: 'You Win! Press R for rematch.',
                youLose: 'You Lose! Press R for rematch.',
                hudPlayer: 'P1 HP',
                hudAi: 'P2 HP'
            },
            'zh-CN': {
                title: '猫咪格斗场',
                subtitle: '拳打脚踢，全力出手取得胜利！',
                controls: '移动: A/D 或 左右键 | 跳跃: W/上键 | 出拳/踢: 空格 | 远程: F',
                ready: '回合开始！开打！',
                youWin: '你赢了！按 R 再来一局。',
                youLose: '你输了！按 R 再来一局。',
                hudPlayer: '玩家血量',
                hudAi: 'AI 血量'
            },
            'ko-KR': {
                title: '고양이 격투 아레나',
                subtitle: '주먹과 발차기로 상대를 쓰러뜨려라!',
                controls: '이동: A/D 또는 ←/→ | 점프: W/↑ | 주먹/발차기: SPACE | 원거리: F',
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
        this.createWeaponProjectiles();
        this.bindControls();
        this.setupHud();
        this.drawHealthBars();
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

    createWeaponProjectiles() {
        this.weaponShots = this.physics.add.group({
            maxSize: 20,
            allowGravity: false
        });
    }

    createFighter(x, y, bodyColor, labelText) {
        const container = this.add.container(x, y);

        // Individual body parts — each can be tweened for punch/kick animations
        const shin1  = this.add.rectangle(-11, 30, 11, 28, 0x374151);
        const shin2  = this.add.rectangle( 11, 30, 11, 28, 0x374151);
        const foot1  = this.add.ellipse(-11, 45, 22, 11, 0x1f2937);
        const foot2  = this.add.ellipse( 11, 45, 22, 11, 0x1f2937);
        const shorts = this.add.rectangle(0, 16, 38, 16, 0x1e293b);
        const torso  = this.add.rectangle(0, -2, 36, 42, bodyColor);
        const armL   = this.add.rectangle(-22, 5, 11, 30, 0xf1c27d);
        const fistL  = this.add.circle(-22, 20, 9, 0xfde68a);
        const armR   = this.add.rectangle(22, 5, 11, 30, 0xf1c27d);
        const fistR  = this.add.circle(22, 20, 9, 0xfde68a);
        const neck   = this.add.rectangle(0, -22, 12, 10, 0xf1c27d);
        const head   = this.add.circle(0, -34, 18, 0xf1c27d);
        const hair   = this.add.ellipse(0, -42, 34, 15, 0x1f2937);
        const eyeL   = this.add.circle(-6, -34, 3, 0x111827);
        const eyeR   = this.add.circle( 6, -34, 3, 0x111827);

        container.add([shin1, shin2, foot1, foot2, shorts,
                       armL, fistL, torso, armR, fistR,
                       neck, head, hair, eyeL, eyeR]);

        const label = this.add.text(0, -64, labelText, {
            fontSize: '16px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(label);

        this.physics.add.existing(container);
        container.body.setSize(40, 90);
        container.body.setOffset(-20, -50);
        container.body.setCollideWorldBounds(true);
        container.body.setDragX(1800);

        return {
            sprite: container,
            label,
            parts: { shin1, shin2, foot1, foot2, armL, fistL, armR, fistR, torso },
            bodyColor,
            nextAttackAt: 0,
            nextBlastAt: 0,
            facing: 1,
            attackMode: 0
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
        this.blastKey = this.input.keyboard.addKey('F');
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
                <button data-touch="attack" style="width:84px;height:64px;border:none;border-radius:14px;background:rgba(220,38,38,0.82);color:#fff;font-size:18px;font-weight:700;">SWIPE</button>
                <button data-touch="blast" style="width:84px;height:64px;border:none;border-radius:14px;background:rgba(124,58,237,0.84);color:#fff;font-size:18px;font-weight:700;">BLAST</button>
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
        this.touchState.blast = false;
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
        attacker.sprite.scaleX = facingDir;

        // Alternate punch and kick each attack
        attacker.attackMode = (attacker.attackMode || 0) + 1;
        if (attacker.attackMode % 2 === 0) {
            this.animatePunch(attacker);
        } else {
            this.animateKick(attacker);
        }

        if (Math.abs(xGap) <= reach && yGap < 85) {
            if (defender === this.ai) {
                this.aiHealth = Math.max(0, this.aiHealth - damage);
            } else {
                this.playerHealth = Math.max(0, this.playerHealth - damage);
            }

            defender.sprite.body.setVelocityX(knockback * facingDir);
            defender.sprite.body.setVelocityY(-270);

            this.animateHitReaction(defender);
            this.spawnHitSpark(defender.sprite.x, defender.sprite.y - 28, 0xfef08a);
            this.cameras.main.shake(100, 0.007);
            this.updateHudValues();
            this.checkRoundEnd();
        }
    }

    fireToyBlast(attacker, defender, damage, speed, cooldownMs) {
        if (this.roundOver || !this.weaponShots) return;
        const now = this.time.now;
        if (now < attacker.nextBlastAt) return;

        attacker.nextBlastAt = now + cooldownMs;

        const attackerX = attacker.sprite.x;
        const attackerY = attacker.sprite.y - 48;
        const dir = attackerX <= defender.sprite.x ? 1 : -1;
        attacker.facing = dir;

        const blast = this.add.circle(attackerX + (dir * 26), attackerY, 8, 0x22d3ee, 0.95);
        this.physics.add.existing(blast);
        blast.body.setAllowGravity(false);
        blast.body.setVelocityX(dir * speed);
        blast.body.setCircle(8);

        blast._target = defender;
        blast._damage = damage;
        blast._bornAt = now;

        this.weaponShots.add(blast);
    }

    updateToyBlasts() {
        if (!this.weaponShots) return;
        const now = this.time.now;
        const blasts = this.weaponShots.getChildren();

        blasts.forEach(blast => {
            if (!blast || !blast.body) return;

            if (now - (blast._bornAt || 0) > 1100 || blast.x < -20 || blast.x > 1220) {
                blast.destroy();
                return;
            }

            const target = blast._target;
            if (!target || !target.sprite || !target.sprite.active) return;

            const hit = Phaser.Geom.Intersects.RectangleToRectangle(
                blast.getBounds(),
                target.sprite.getBounds()
            );

            if (!hit) return;

            if (target === this.ai) {
                this.aiHealth = Math.max(0, this.aiHealth - (blast._damage || 0));
            } else {
                this.playerHealth = Math.max(0, this.playerHealth - (blast._damage || 0));
            }

            const blastDir = blast.body.velocity.x >= 0 ? 1 : -1;
            target.sprite.body.setVelocityX(220 * blastDir);
            target.sprite.body.setVelocityY(-170);

            this.spawnHitSpark(blast.x, blast.y, 0x67e8f9);
            this.cameras.main.shake(65, 0.003);
            this.updateHudValues();
            this.checkRoundEnd();
            blast.destroy();
        });
    }

    spawnHitSpark(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const spark = this.add.circle(
                x + Phaser.Math.Between(-16, 16),
                y + Phaser.Math.Between(-16, 16),
                Phaser.Math.Between(5, 12),
                color, 1
            );
            this.tweens.add({
                targets: spark,
                alpha: 0,
                scaleX: 3,
                scaleY: 3,
                x: spark.x + Phaser.Math.Between(-32, 32),
                y: spark.y + Phaser.Math.Between(-32, 8),
                duration: 250,
                onComplete: () => spark.destroy()
            });
        }
    }

    animatePunch(fighter) {
        if (!fighter || !fighter.parts) return;
        const { armR, fistR } = fighter.parts;
        // Extend the forward arm outward — looks correct on both facing directions
        // because scaleX=-1 mirrors the container, so armR is always the leading arm.
        this.tweens.add({ targets: armR,  x: 46, duration: 68, yoyo: true, ease: 'Power3' });
        this.tweens.add({ targets: fistR, x: 46, duration: 72, yoyo: true, ease: 'Power3' });
    }

    animateKick(fighter) {
        if (!fighter || !fighter.parts) return;
        const { shin2, foot2 } = fighter.parts;
        this.tweens.add({ targets: shin2, x: 28, y: 14, rotation: 0.45, duration: 88, yoyo: true, ease: 'Power2' });
        this.tweens.add({ targets: foot2, x: 36, y: 22, duration: 92, yoyo: true, ease: 'Power2' });
    }

    animateHitReaction(fighter) {
        if (!fighter || !fighter.parts || !fighter.parts.torso) return;
        const torso = fighter.parts.torso;
        torso.setFillColor(0xff3333);
        this.time.delayedCall(140, () => {
            if (torso && torso.active) torso.setFillColor(fighter.bodyColor);
        });
    }

    drawHealthBars() {
        this.hpGraphics = this.add.graphics().setDepth(10);
        this.redrawHealthBars();

        // Labels
        this.add.text(180, 136, 'P1', {
            fontSize: '14px', fontFamily: 'Nunito,Arial,sans-serif',
            color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        this.add.text(1020, 136, 'AI', {
            fontSize: '14px', fontFamily: 'Nunito,Arial,sans-serif',
            color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
    }

    redrawHealthBars() {
        if (!this.hpGraphics || !this.hpGraphics.active) return;
        const g = this.hpGraphics;
        g.clear();
        const W = 250, H = 20, Y = 127;

        // P1 — left bar, fills right
        g.fillStyle(0x0f172a, 0.85);
        g.fillRoundedRect(60, Y, W, H, 6);
        const p1w = Math.max(0, (this.playerHealth / 100) * W);
        if (p1w > 0) { g.fillStyle(0x22c55e, 1); g.fillRoundedRect(60, Y, p1w, H, 6); }

        // P2 — right bar, depletes from right to left
        g.fillStyle(0x0f172a, 0.85);
        g.fillRoundedRect(890, Y, W, H, 6);
        const p2w = Math.max(0, (this.aiHealth / 100) * W);
        if (p2w > 0) { g.fillStyle(0xf87171, 1); g.fillRoundedRect(890 + W - p2w, Y, p2w, H, 6); }
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
        this.redrawHealthBars();
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
        const wantBlast = Phaser.Input.Keyboard.JustDown(this.blastKey) || this.touchState.blast;

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

        if (wantBlast) {
            this.fireToyBlast(this.player, this.ai, 8, 560, 480);
        }

        this.runAi(delta || 0);
        this.updateToyBlasts();

        this.player.facing = this.player.sprite.x <= this.ai.sprite.x ? 1 : -1;
        this.ai.facing = this.ai.sprite.x <= this.player.sprite.x ? 1 : -1;

        this.player.sprite.scaleX = this.player.facing;
        this.ai.sprite.scaleX = this.ai.facing;
    }

    runAi(delta) {
        this.aiThinkMs += delta;
        if (this.aiThinkMs < 80) return;
        this.aiThinkMs = 0;

        const dx = this.player.sprite.x - this.ai.sprite.x;
        const distance = Math.abs(dx);

        if (distance > 95) {
            // Chase the player
            this.ai.sprite.body.setVelocityX(dx > 0 ? 235 : -235);
        } else if (distance < 40) {
            // Too close — back up to create punch space
            this.ai.sprite.body.setVelocityX(dx > 0 ? -90 : 90);
        } else {
            // In striking range — punch or kick!
            this.ai.sprite.body.setVelocityX(0);
            if (Math.random() < 0.72) {
                this.tryAttack(this.ai, this.player, 10, 100, 310, 320);
            }
        }

        // Long-range blast
        if (distance > 190 && Math.random() < 0.28) {
            this.fireToyBlast(this.ai, this.player, 7, 520, 600);
        }

        // Occasional jump to dodge or reposition
        if (this.ai.sprite.body.blocked.down && Math.random() < 0.05 && distance > 140) {
            this.ai.sprite.body.setVelocityY(-660);
        }
    }
}

window.FightingGameScene = FightingGameScene;
