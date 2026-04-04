class TossingScene extends Phaser.Scene {
    static currentScore = 0;
    static currentLevel = 1;
    static currentLanguage = 'en';

    static translations = {
        en: {
            scoreValue: 'Score',
            levelValue: 'Level',
            prompt: 'Press and hold, then release to toss',
            chargeLabel: 'Charge',
            windLabel: 'Wind',
            hitText: '+{points}',
            missText: 'Miss!',
            levelUpText: 'Level {level}'
        },
        'zh-CN': {
            scoreValue: '分数',
            levelValue: '关卡',
            prompt: '按住蓄力，松开投掷',
            chargeLabel: '蓄力',
            windLabel: '风力',
            hitText: '+{points}',
            missText: '未命中！',
            levelUpText: '第 {level} 关'
        },
        'ko-KR': {
            scoreValue: '점수',
            levelValue: '레벨',
            prompt: '누르고 유지한 뒤 놓아 던지세요',
            chargeLabel: '차지',
            windLabel: '바람',
            hitText: '+{points}',
            missText: '빗나감!',
            levelUpText: '레벨 {level}'
        }
    };

    static setLanguage(lang) {
        TossingScene.currentLanguage = lang;
    }

    static resetProgress() {
        TossingScene.currentScore = 0;
        TossingScene.currentLevel = 1;
    }

    constructor() {
        super({ key: 'TossingScene' });
    }

    getText(key) {
        const lang = TossingScene.currentLanguage || 'en';
        const dict = TossingScene.translations[lang] || TossingScene.translations.en;
        return dict[key] || TossingScene.translations.en[key] || key;
    }

    formatText(key, replacements = {}) {
        let text = this.getText(key);
        Object.keys(replacements).forEach(repKey => {
            text = text.replace(`{${repKey}}`, replacements[repKey]);
        });
        return text;
    }

    create() {
        TossingScene.setLanguage(localStorage.getItem('selectedLanguage') || 'en');

        this.physics.world.gravity.y = 900;
        this.cameras.main.setBackgroundColor('#8ecae6');

        this.score = TossingScene.currentScore || 0;
        this.level = TossingScene.currentLevel || 1;
        this.isCharging = false;
        this.chargeStartedAt = 0;
        this.maxChargeMs = 1300;
        this.minPower = 360;
        this.maxPower = 920;
        this.launchX = 130;
        this.launchY = 520;
        this.hitsInLevel = 0;
        this.hitsToLevelUp = 4;
        this.wind = 0;

        this.createBackdrop();
        this.createLauncher();
        this.createTargets();
        this.setWind();

        this.promptText = this.add.text(24, 16, this.getText('prompt'), {
            fontSize: '24px',
            color: '#0b2545',
            fontStyle: '700'
        }).setDepth(20).setScrollFactor(0);

        this.chargeText = this.add.text(24, 52, `${this.getText('chargeLabel')}: 0%`, {
            fontSize: '20px',
            color: '#1b4332'
        }).setDepth(20).setScrollFactor(0);

        this.windText = this.add.text(24, 78, '', {
            fontSize: '20px',
            color: '#1d3557'
        }).setDepth(20).setScrollFactor(0);

        this.updateWindLabel();
        this.updateHUD();

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointerup', this.onPointerUp, this);
    }

    createBackdrop() {
        this.add.rectangle(600, 560, 1200, 140, 0x588157);
        this.add.rectangle(940, 455, 340, 14, 0x6d4c41);
        this.add.circle(1020, 110, 44, 0xffb703, 0.95);
        this.add.ellipse(270, 95, 170, 58, 0xffffff, 0.68);
        this.add.ellipse(370, 125, 130, 46, 0xffffff, 0.62);
    }

    createLauncher() {
        this.add.rectangle(this.launchX - 20, this.launchY + 14, 84, 52, 0xf4a261);
        this.add.rectangle(this.launchX + 24, this.launchY - 30, 26, 26, 0xe76f51);
        this.add.rectangle(this.launchX + 52, this.launchY - 12, 52, 10, 0x264653);

        this.aimGuide = this.add.line(
            0,
            0,
            this.launchX,
            this.launchY - 22,
            this.launchX + 130,
            this.launchY - 112,
            0x264653,
            0.7
        ).setLineWidth(5).setDepth(15);
    }

    createTargets() {
        this.targets = [];
        const baseY = 412;
        const targetData = [
            { x: 870, width: 86, height: 76, points: 10, color: 0xe63946, phase: 0 },
            { x: 980, width: 70, height: 100, points: 18, color: 0xffb703, phase: 1.4 },
            { x: 1090, width: 56, height: 126, points: 30, color: 0x3a86ff, phase: 2.2 }
        ];

        targetData.forEach(data => {
            const rim = this.add.rectangle(data.x, baseY - data.height / 2, data.width + 6, 10, 0x1d3557);
            const body = this.add.rectangle(data.x, baseY, data.width, data.height, data.color);
            const label = this.add.text(data.x, baseY - data.height - 24, `${data.points}`, {
                fontSize: '18px',
                fontStyle: '700',
                color: '#102a43'
            }).setOrigin(0.5);

            this.physics.add.existing(body, true);
            this.targets.push({
                body,
                rim,
                label,
                baseX: data.x,
                baseY,
                phase: data.phase,
                points: data.points,
                width: data.width,
                height: data.height
            });
        });
    }

    onPointerDown() {
        if (this.projectile && this.projectile.active) {
            return;
        }
        this.isCharging = true;
        this.chargeStartedAt = this.time.now;
    }

    onPointerUp(pointer) {
        if (!this.isCharging || (this.projectile && this.projectile.active)) {
            return;
        }

        this.isCharging = false;
        const heldFor = Math.min(this.maxChargeMs, this.time.now - this.chargeStartedAt);
        const chargeRatio = Phaser.Math.Clamp(heldFor / this.maxChargeMs, 0.15, 1);
        const power = Phaser.Math.Linear(this.minPower, this.maxPower, chargeRatio);

        const angle = this.getThrowAngle(pointer);
        const fish = this.add.ellipse(this.launchX, this.launchY - 20, 34, 18, 0xff8fab);
        this.physics.add.existing(fish);
        fish.body.setBounce(0.2);
        fish.body.setCollideWorldBounds(false);
        fish.body.setCircle(9);

        const vx = Math.cos(angle) * power + this.wind;
        const vy = Math.sin(angle) * power;
        fish.body.setVelocity(vx, vy);
        this.projectile = fish;
        this.chargeText.setText(`${this.getText('chargeLabel')}: 0%`);
    }

    getThrowAngle(pointer) {
        const fallbackAngle = -Math.PI / 4;
        if (!pointer) {
            return fallbackAngle;
        }

        const rawAngle = Phaser.Math.Angle.Between(this.launchX, this.launchY, pointer.worldX, pointer.worldY);
        return Phaser.Math.Clamp(rawAngle, -2.45, -0.25);
    }

    setWind() {
        const levelFactor = 1 + ((this.level - 1) * 0.18);
        this.wind = Math.round(Phaser.Math.Between(-90, 90) * levelFactor);
    }

    updateWindLabel() {
        const sign = this.wind > 0 ? '+' : '';
        this.windText.setText(`${this.getText('windLabel')}: ${sign}${this.wind}`);
    }

    updateHUD() {
        const scoreLabel = document.getElementById('score');
        const levelLabel = document.getElementById('level');
        const scoreValue = document.getElementById('score-value');
        const levelValue = document.getElementById('level-value');

        if (scoreLabel) {
            scoreLabel.innerHTML = `${this.getText('scoreValue')}: <span id="score-value">${this.score}</span>`;
        } else if (scoreValue) {
            scoreValue.innerText = String(this.score);
        }

        if (levelLabel) {
            levelLabel.innerHTML = `${this.getText('levelValue')}: <span id="level-value">${this.level}</span>`;
        } else if (levelValue) {
            levelValue.innerText = String(this.level);
        }
    }

    handleHit(target, x, y) {
        const gained = Math.round(target.points * (1 + ((this.level - 1) * 0.15)));
        this.score += gained;
        TossingScene.currentScore = this.score;

        this.hitsInLevel += 1;
        const floatText = this.add.text(x, y - 26, this.formatText('hitText', { points: gained }), {
            fontSize: '24px',
            fontStyle: '700',
            color: '#2a9d8f'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: floatText.y - 40,
            alpha: 0,
            duration: 520,
            onComplete: () => floatText.destroy()
        });

        if (this.hitsInLevel >= this.hitsToLevelUp) {
            this.level += 1;
            this.hitsInLevel = 0;
            TossingScene.currentLevel = this.level;
            this.setWind();
            this.updateWindLabel();

            const upText = this.add.text(600, 180, this.formatText('levelUpText', { level: this.level }), {
                fontSize: '40px',
                fontStyle: '700',
                color: '#ffb703',
                stroke: '#1d3557',
                strokeThickness: 6
            }).setOrigin(0.5);

            this.tweens.add({
                targets: upText,
                scale: 1.2,
                alpha: 0,
                duration: 900,
                onComplete: () => upText.destroy()
            });
        }

        this.updateHUD();
    }

    handleMiss(x, y) {
        const missText = this.add.text(x, y, this.getText('missText'), {
            fontSize: '20px',
            fontStyle: '700',
            color: '#d00000'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: missText,
            alpha: 0,
            duration: 380,
            onComplete: () => missText.destroy()
        });

        this.setWind();
        this.updateWindLabel();
    }

    checkProjectileState() {
        if (!this.projectile || !this.projectile.active) {
            return;
        }

        const px = this.projectile.x;
        const py = this.projectile.y;

        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            const left = target.body.x - target.width / 2;
            const right = target.body.x + target.width / 2;
            const rimY = target.rim.y;
            const bottomY = target.body.y + target.height / 2;

            const isInside = px >= left && px <= right && py >= rimY && py <= bottomY;
            if (isInside) {
                this.handleHit(target, px, py);
                this.projectile.destroy();
                this.projectile = null;
                return;
            }
        }

        const missed = px < -60 || px > 1260 || py > 680;
        if (missed) {
            this.handleMiss(Phaser.Math.Clamp(px, 80, 1120), Phaser.Math.Clamp(py, 120, 560));
            this.projectile.destroy();
            this.projectile = null;
        }
    }

    updateAimGuide(pointer) {
        if (!this.isCharging) {
            return;
        }

        const targetX = pointer ? pointer.worldX : this.launchX + 140;
        const targetY = pointer ? pointer.worldY : this.launchY - 90;
        const angle = this.getThrowAngle({ worldX: targetX, worldY: targetY });
        const length = 170;

        this.aimGuide.setTo(
            this.launchX,
            this.launchY - 22,
            this.launchX + Math.cos(angle) * length,
            this.launchY - 22 + Math.sin(angle) * length
        );

        const heldFor = Math.min(this.maxChargeMs, this.time.now - this.chargeStartedAt);
        const chargeRatio = Math.round((heldFor / this.maxChargeMs) * 100);
        this.chargeText.setText(`${this.getText('chargeLabel')}: ${chargeRatio}%`);
    }

    update(time) {
        const swaySpeed = 0.0011 + (this.level * 0.00015);
        const swayAmp = Math.min(34, 18 + (this.level * 2));

        this.targets.forEach((target, index) => {
            const offset = Math.sin((time * swaySpeed) + target.phase + index) * swayAmp;
            target.body.x = target.baseX + offset;
            target.rim.x = target.body.x;
            target.label.x = target.body.x;

            if (target.body.body) {
                target.body.body.updateFromGameObject();
            }
        });

        const pointer = this.input.activePointer;
        this.updateAimGuide(pointer);
        this.checkProjectileState();
    }
}

window.TossingScene = TossingScene;