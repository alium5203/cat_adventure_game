class TrafficRunnerScene extends Phaser.Scene {
    static currentDistance = 0;
    static currentLevel = 1;
    static currentMapIndex = 0;
    static currentPlaceIndex = 0;
    static currentLanguage = 'en';

    static translations = {
        en: {
            crash: 'CRASH!\nRestarting Run...',
            distanceValue: 'Score (Distance)',
            levelValue: 'Level',
            speedValue: 'Speed',
            pickerTitle: 'Choose Place',
            pickerHint: 'Pick a place to continue',
            pickerClose: 'Close',
            levelUp: 'Level {level}',
            mapNow: 'Map: {map}',
            powerShield: 'Shield',
            powerSlow: 'Slow Time',
            powerBoost: 'Score Boost',
            powerLabel: 'Power: {power}',
            shieldSaved: 'Shield Block!'
        },
        'zh-CN': {
            crash: '撞车了！\n正在重新开始...',
            distanceValue: '分数（距离）',
            levelValue: '等级',
            speedValue: '速度',
            pickerTitle: '选择地点',
            pickerHint: '选择一个地点继续',
            pickerClose: '关闭',
            levelUp: '第 {level} 关',
            mapNow: '地图：{map}',
            powerShield: '护盾',
            powerSlow: '慢速时间',
            powerBoost: '分数加成',
            powerLabel: '能力：{power}',
            shieldSaved: '护盾抵挡！'
        },
        'ko-KR': {
            crash: '충돌!\n다시 시작합니다...',
            distanceValue: '점수(거리)',
            levelValue: '레벨',
            speedValue: '속도',
            pickerTitle: '장소 선택',
            pickerHint: '계속할 장소를 고르세요',
            pickerClose: '닫기',
            levelUp: '레벨 {level}',
            mapNow: '맵: {map}',
            powerShield: '실드',
            powerSlow: '슬로우 타임',
            powerBoost: '점수 부스트',
            powerLabel: '파워: {power}',
            shieldSaved: '실드 방어!'
        }
    };

    static mapNames = {
        en: ['Africa', 'Americas', 'Asia', 'Europe'],
        'zh-CN': ['非洲', '美洲', '亚洲', '欧洲'],
        'ko-KR': ['아프리카', '아메리카', '아시아', '유럽']
    };

    static placeCatalog = [
        { familyMapIndex: 0, type: 'country', names: { en: 'Egypt', 'zh-CN': '埃及', 'ko-KR': '이집트' } },
        { familyMapIndex: 0, type: 'city', names: { en: 'Cairo', 'zh-CN': '开罗', 'ko-KR': '카이로' } },
        { familyMapIndex: 0, type: 'town', names: { en: 'Aswan', 'zh-CN': '阿斯旺', 'ko-KR': '아스완' } },
        { familyMapIndex: 1, type: 'country', names: { en: 'Brazil', 'zh-CN': '巴西', 'ko-KR': '브라질' } },
        { familyMapIndex: 1, type: 'country', names: { en: 'Canada', 'zh-CN': '加拿大', 'ko-KR': '캐나다' } },
        { familyMapIndex: 1, type: 'city', names: { en: 'New York', 'zh-CN': '纽约', 'ko-KR': '뉴욕' } },
        { familyMapIndex: 1, type: 'town', names: { en: 'Banff', 'zh-CN': '班夫', 'ko-KR': '밴프' } },
        { familyMapIndex: 2, type: 'country', names: { en: 'Japan', 'zh-CN': '日本', 'ko-KR': '일본' } },
        { familyMapIndex: 2, type: 'country', names: { en: 'China', 'zh-CN': '中国', 'ko-KR': '중국' } },
        { familyMapIndex: 2, type: 'city', names: { en: 'Tokyo', 'zh-CN': '东京', 'ko-KR': '도쿄' } },
        { familyMapIndex: 2, type: 'city', names: { en: 'Seoul', 'zh-CN': '首尔', 'ko-KR': '서울' } },
        { familyMapIndex: 2, type: 'town', names: { en: 'Nara', 'zh-CN': '奈良', 'ko-KR': '나라' } },
        { familyMapIndex: 3, type: 'country', names: { en: 'France', 'zh-CN': '法国', 'ko-KR': '프랑스' } },
        { familyMapIndex: 3, type: 'country', names: { en: 'Italy', 'zh-CN': '意大利', 'ko-KR': '이탈리아' } },
        { familyMapIndex: 3, type: 'city', names: { en: 'Paris', 'zh-CN': '巴黎', 'ko-KR': '파리' } },
        { familyMapIndex: 3, type: 'town', names: { en: 'Bruges', 'zh-CN': '布鲁日', 'ko-KR': '브뤼헤' } }
    ];

    static mapThemes = [
        {
            // Africa: sandy browns
            ocean: 0x0369a1,
            continent: 0xc9771f,
            accent: 0xea8c55,
            sky: 0xe0f2fe,
            sun: 0xfbbf24
        },
        {
            // Americas: green lands
            ocean: 0x0369a1,
            continent: 0x16a34a,
            accent: 0x22c55e,
            sky: 0xdcfce7,
            sun: 0xfbbf24
        },
        {
            // Asia: vibrant mixed
            ocean: 0x0369a1,
            continent: 0xdc2626,
            accent: 0xf87171,
            sky: 0xffe4e6,
            sun: 0xfbbf24
        },
        {
            // Europe: cool tones
            ocean: 0x0369a1,
            continent: 0x7c3aed,
            accent: 0xa78bfa,
            sky: 0xf3e8ff,
            sun: 0xfbbf24
        }
    ];

    static mapMechanics = [
        {
            // City: baseline difficulty curve
            obstacleScaleBonus: 1,
            obstacleSpeedMultiplier: 1,
            burstChance: 0,
            maxBurstSpawns: 0,
            laneSwitchDuration: 110,
            laneSwitchCooldownMs: 85
        },
        {
            // Desert: wider/heavier traffic silhouettes
            obstacleScaleBonus: 1.14,
            obstacleSpeedMultiplier: 1.03,
            burstChance: 0.08,
            maxBurstSpawns: 1,
            laneSwitchDuration: 120,
            laneSwitchCooldownMs: 95
        },
        {
            // Neon: denser traffic waves
            obstacleScaleBonus: 1,
            obstacleSpeedMultiplier: 1.08,
            burstChance: 0.32,
            maxBurstSpawns: 2,
            laneSwitchDuration: 105,
            laneSwitchCooldownMs: 80
        },
        {
            // Rain: slippery response and slightly faster cars
            obstacleScaleBonus: 1.05,
            obstacleSpeedMultiplier: 1.1,
            burstChance: 0.15,
            maxBurstSpawns: 1,
            laneSwitchDuration: 190,
            laneSwitchCooldownMs: 170
        }
    ];

    static setLanguage(lang) {
        TrafficRunnerScene.currentLanguage = lang;
    }

    static resetProgress() {
        TrafficRunnerScene.currentDistance = 0;
        TrafficRunnerScene.currentLevel = 1;
        TrafficRunnerScene.currentMapIndex = 0;
        TrafficRunnerScene.currentPlaceIndex = 0;
    }

    constructor() {
        super({ key: 'TrafficRunnerScene' });
    }

    getText(key) {
        const lang = TrafficRunnerScene.currentLanguage || 'en';
        const translation = TrafficRunnerScene.translations[lang] || TrafficRunnerScene.translations.en;
        return translation[key] || TrafficRunnerScene.translations.en[key] || key;
    }

    formatText(key, replacements = {}) {
        let text = this.getText(key);
        Object.keys(replacements).forEach(repKey => {
            text = text.replace(`{${repKey}}`, replacements[repKey]);
        });
        return text;
    }

    create() {
        TrafficRunnerScene.setLanguage(localStorage.getItem('selectedLanguage') || 'en');
        if (window.ArcadeTouchControls && typeof window.ArcadeTouchControls.reset === 'function') {
            window.ArcadeTouchControls.reset();
        }
        this.physics.world.gravity.y = 0;
        this.cameras.main.setBackgroundColor('#89c2ff');

        this.isGameOver = false;
        this.distance = TrafficRunnerScene.currentDistance || 0;
        this.level = TrafficRunnerScene.currentLevel || 1;
        this.currentMapIndex = TrafficRunnerScene.currentMapIndex || 0;
        this.selectedPlaceIndex = TrafficRunnerScene.currentPlaceIndex || 0;
        this.levelDistanceStep = 350;
        this.baseSpeed = 360;
        this.currentSpeed = this.baseSpeed + ((this.level - 1) * 55);
        this.displayedDistance = -1;
        this.displayedLevel = -1;
        this.laneXs = [450, 600, 750];
        this.currentLane = 1;
        this.nextLaneMoveTime = 0;
        this.obstacleGraphics = [];
        this.roadMarks = [];
        this.powerupGraphics = [];
        this.activePowerKey = null;
        this.activePowerUntil = 0;
        this.distanceMultiplier = 1;
        this.speedEffectMultiplier = 1;
        this.hasShield = false;
        this.isEarthVisible = false;
        this.isMapPickerOpen = false;
        if (this.restartTimeoutId) {
            clearTimeout(this.restartTimeoutId);
            this.restartTimeoutId = null;
        }

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.restartTimeoutId) {
                clearTimeout(this.restartTimeoutId);
                this.restartTimeoutId = null;
            }
        });

        this.createBackdrop();
        this.createRoad();
        this.applyMapTheme(this.currentMapIndex, false);

        this.player = this.add.rectangle(this.laneXs[this.currentLane], 485, 54, 92, 0xff595e);
        this.physics.add.existing(this.player);
        this.player.body.setAllowGravity(false);
        this.player.body.setImmovable(true);
        this.player.body.setCollideWorldBounds(true);

        this.playerArt = this.createCarArt(this.player.x, this.player.y, 0xff595e, true);
        this.obstacles = this.physics.add.group();
        this.powerups = this.physics.add.group();

        this.physics.add.overlap(this.player, this.obstacles, this.handleCrash, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            a: this.input.keyboard.addKey('A'),
            d: this.input.keyboard.addKey('D')
        };

        this.spawnTimer = this.time.addEvent({
            delay: 850,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.powerTimer = this.time.addEvent({
            delay: 7000,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });

        this.powerText = this.add.text(1010, 26, '', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#111827',
            padding: { x: 10, y: 5 },
            fontStyle: 'bold'
        }).setOrigin(1, 0).setScrollFactor(0).setAlpha(0.92);

        this.mapText = this.add.text(20, 58, '', {
            fontSize: '18px',
            color: '#e5e7eb',
            backgroundColor: '#111827',
            padding: { x: 10, y: 5 },
            fontStyle: 'bold'
        }).setOrigin(0, 0).setScrollFactor(0).setAlpha(0.92).setInteractive({ useHandCursor: true });

        this.mapText.on('pointerdown', () => {
            this.openMapPicker();
        });

        this.createMapPickerOverlay();

        this.updateHUD();
        this.updateMapLabel();
        this.updatePowerLabel();
    }

    setEarthVisualVisibility(visible) {
        this.isEarthVisible = visible;

        if (this.globeOcean) {
            this.globeOcean.setAlpha(visible ? 0.36 : 0);
        }
        if (this.globeAtmosphere) {
            this.globeAtmosphere.setAlpha(visible ? 0.14 : 0);
            this.globeAtmosphere.setStrokeStyle(4, 0xe0f2fe, visible ? 0.45 : 0);
        }

        if (Array.isArray(this.globeContinents)) {
            this.globeContinents.forEach(entry => {
                if (!visible) {
                    entry.shape.setAlpha(0);
                    return;
                }

                const isActive = entry.mapIndex === this.currentMapIndex;
                entry.shape.setAlpha(isActive ? 0.88 : 0.38);
            });
        }

        if (Array.isArray(this.globeLabels)) {
            this.globeLabels.forEach((label, idx) => {
                if (!visible) {
                    label.setAlpha(0);
                    return;
                }

                label.setAlpha(idx === this.currentMapIndex ? 0.94 : 0.62);
            });
        }
    }

    createMapPickerOverlay() {
        const overlayDepth = 1500;
        this.mapPickerBackdrop = this.add.rectangle(600, 300, 1200, 600, 0x020617, 0.74)
            .setScrollFactor(0)
            .setDepth(overlayDepth)
            .setInteractive();

        this.mapPickerPanel = this.add.rectangle(600, 300, 720, 510, 0x0f172a, 0.92)
            .setScrollFactor(0)
            .setDepth(overlayDepth + 1)
            .setStrokeStyle(3, 0x38bdf8, 0.42);

        this.mapPickerTitle = this.add.text(600, 90, this.getText('pickerTitle'), {
            fontSize: '30px',
            color: '#f8fafc',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 2);

        this.mapPickerHint = this.add.text(600, 124, this.getText('pickerHint'), {
            fontSize: '17px',
            color: '#cbd5e1'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 2);

        this.mapPickerEarth = this.add.circle(600, 305, 190, 0x0369a1, 0.94)
            .setScrollFactor(0)
            .setDepth(overlayDepth + 2);

        this.mapPickerAtmosphere = this.add.circle(600, 305, 203, 0xbfdbfe, 0.16)
            .setScrollFactor(0)
            .setDepth(overlayDepth + 2)
            .setStrokeStyle(3, 0xe0f2fe, 0.5);

        this.mapPickerEntries = [
            {
                mapIndex: 0,
                shape: this.add.polygon(600, 316, [
                    -18, -62,
                    6, -68,
                    20, -44,
                    14, -10,
                    28, 20,
                    8, 60,
                    -10, 70,
                    -28, 24,
                    -22, -12
                ], 0xc9771f, 0.92)
            },
            {
                mapIndex: 1,
                shape: this.add.polygon(536, 284, [
                    -46, -66,
                    -8, -76,
                    8, -50,
                    -4, -26,
                    14, 6,
                    6, 40,
                    -14, 66,
                    -34, 36,
                    -30, 2,
                    -48, -22
                ], 0x16a34a, 0.92)
            },
            {
                mapIndex: 2,
                shape: this.add.polygon(668, 286, [
                    -64, -44,
                    -22, -68,
                    46, -58,
                    72, -24,
                    62, 8,
                    40, 16,
                    28, 44,
                    -8, 56,
                    -40, 36,
                    -68, -8
                ], 0xdc2626, 0.92)
            },
            {
                mapIndex: 3,
                shape: this.add.polygon(620, 248, [
                    -28, -22,
                    8, -30,
                    24, -14,
                    18, 8,
                    -4, 18,
                    -22, 8
                ], 0x7c3aed, 0.92)
            }
        ];

        this.mapPickerEntries.forEach(entry => {
            entry.shape
                .setScrollFactor(0)
                .setDepth(overlayDepth + 3)
                .setStrokeStyle(2, 0xe2e8f0, 0.3)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    const firstPlaceIndex = (TrafficRunnerScene.placeCatalog || []).findIndex(place => place.familyMapIndex === entry.mapIndex);
                    if (firstPlaceIndex >= 0) {
                        this.pickPlace(firstPlaceIndex);
                    }
                });

            entry.label = this.add.text(entry.shape.x, entry.shape.y + 94, this.getMapName(entry.mapIndex), {
                fontSize: '14px',
                color: '#e2e8f0',
                backgroundColor: '#0f172a',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 4);
        });

        this.mapPickerPlaceButtons = [];
        this.mapPickerRegionHeaders = [];

        const catalog = TrafficRunnerScene.placeCatalog || [];
        const groupedPlaces = [0, 1, 2, 3].map(mapIndex => {
            const items = catalog
                .map((place, index) => ({ ...place, index }))
                .filter(place => place.familyMapIndex === mapIndex);
            return { mapIndex, items };
        });

        const regionLayouts = [
            { mapIndex: 0, x: 345, y: 184 },
            { mapIndex: 1, x: 855, y: 184 },
            { mapIndex: 2, x: 345, y: 368 },
            { mapIndex: 3, x: 855, y: 368 }
        ];

        const rowGap = 32;
        regionLayouts.forEach(layout => {
            const group = groupedPlaces.find(item => item.mapIndex === layout.mapIndex);
            if (!group) {
                return;
            }

            const headerBg = this.add.rectangle(layout.x, layout.y - 22, 232, 24, 0x0b1220, 0.95)
                .setStrokeStyle(1, 0x334155, 1)
                .setScrollFactor(0)
                .setDepth(overlayDepth + 4);

            const headerLabel = this.add.text(layout.x, layout.y - 22, this.getMapName(layout.mapIndex), {
                fontSize: '14px',
                color: '#e2e8f0',
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 5);

            this.mapPickerRegionHeaders.push({
                mapIndex: layout.mapIndex,
                bg: headerBg,
                label: headerLabel
            });

            group.items.forEach((place, rowIndex) => {
                const y = layout.y + (rowIndex * rowGap);
                const card = this.add.rectangle(layout.x, y, 232, 28, 0x1e293b, 0.94)
                    .setStrokeStyle(1, 0x334155, 1)
                    .setScrollFactor(0)
                    .setDepth(overlayDepth + 4)
                    .setInteractive({ useHandCursor: true });

                const label = this.add.text(layout.x, y, '', {
                    fontSize: '12px',
                    color: '#e2e8f0',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 5);

                card.on('pointerdown', () => this.pickPlace(place.index));

                this.mapPickerPlaceButtons.push({
                    index: place.index,
                    card,
                    label,
                    familyMapIndex: place.familyMapIndex,
                    type: place.type
                });
            });
        });

        this.mapPickerClose = this.add.text(900, 90, this.getText('pickerClose'), {
            fontSize: '18px',
            color: '#f8fafc',
            backgroundColor: '#334155',
            padding: { x: 8, y: 4 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(overlayDepth + 4).setInteractive({ useHandCursor: true });

        this.mapPickerClose.on('pointerdown', () => {
            this.closeMapPicker();
        });

        this.setMapPickerVisible(false);
    }

    setMapPickerVisible(visible) {
        if (!this.mapPickerBackdrop) {
            return;
        }

        const pickerObjects = [
            this.mapPickerBackdrop,
            this.mapPickerPanel,
            this.mapPickerTitle,
            this.mapPickerHint,
            this.mapPickerEarth,
            this.mapPickerAtmosphere,
            this.mapPickerClose
        ];

        pickerObjects.forEach(obj => {
            if (obj) {
                obj.setVisible(visible);
            }
        });

        if (Array.isArray(this.mapPickerEntries)) {
            this.mapPickerEntries.forEach(entry => {
                entry.shape.setVisible(visible);
                if (entry.label) {
                    entry.label.setVisible(visible);
                }
            });
        }

        if (Array.isArray(this.mapPickerPlaceButtons)) {
            this.mapPickerPlaceButtons.forEach(item => {
                item.card.setVisible(visible);
                item.label.setVisible(visible);
            });
        }

        if (Array.isArray(this.mapPickerRegionHeaders)) {
            this.mapPickerRegionHeaders.forEach(header => {
                header.bg.setVisible(visible);
                header.label.setVisible(visible);
            });
        }
    }

    refreshMapPickerVisuals() {
        if (!Array.isArray(this.mapPickerEntries)) {
            return;
        }

        if (this.mapPickerTitle) {
            this.mapPickerTitle.setText(this.getText('pickerTitle'));
        }
        if (this.mapPickerHint) {
            this.mapPickerHint.setText(this.getText('pickerHint'));
        }
        if (this.mapPickerClose) {
            this.mapPickerClose.setText(this.getText('pickerClose'));
        }

        const activeTheme = TrafficRunnerScene.mapThemes[this.currentMapIndex] || TrafficRunnerScene.mapThemes[0];
        const accentByMap = [0xea8c55, 0x22c55e, 0xf87171, 0xa78bfa];

        this.mapPickerEntries.forEach(entry => {
            const isActive = entry.mapIndex === this.currentMapIndex;
            const color = isActive ? activeTheme.continent : accentByMap[entry.mapIndex];

            entry.shape.fillColor = color;
            entry.shape.setScale(isActive ? 1.08 : 1);
            entry.shape.setAlpha(isActive ? 1 : 0.74);
            entry.shape.setStrokeStyle(2, isActive ? 0xf8fafc : 0xcbd5e1, isActive ? 0.7 : 0.32);

            if (entry.label) {
                entry.label.setText(this.getMapName(entry.mapIndex));
                entry.label.setAlpha(isActive ? 1 : 0.72);
            }
        });

        if (Array.isArray(this.mapPickerPlaceButtons)) {
            this.mapPickerPlaceButtons.forEach(item => {
                const isSelected = item.index === this.selectedPlaceIndex;
                const placeName = this.getPlaceName(item.index);
                const typeLabel = this.getPlaceTypeLabel(item.type);
                item.label.setText(`${typeLabel}: ${placeName}`);
                item.label.setColor(isSelected ? '#f8fafc' : '#cbd5e1');
                item.card.fillColor = isSelected ? 0x2563eb : 0x1e293b;
                item.card.setStrokeStyle(1, isSelected ? 0x93c5fd : 0x334155, 1);
            });
        }

        if (Array.isArray(this.mapPickerRegionHeaders)) {
            this.mapPickerRegionHeaders.forEach(header => {
                const isActive = header.mapIndex === this.currentMapIndex;
                header.label.setText(this.getMapName(header.mapIndex));
                header.label.setColor(isActive ? '#f8fafc' : '#cbd5e1');
                header.bg.fillColor = isActive ? 0x1d4ed8 : 0x0b1220;
                header.bg.setStrokeStyle(1, isActive ? 0x93c5fd : 0x334155, 1);
            });
        }
    }

    openMapPicker() {
        if (this.isGameOver || this.isMapPickerOpen) {
            return;
        }

        this.isMapPickerOpen = true;
        this.setEarthVisualVisibility(true);
        this.setMapPickerVisible(true);
        this.refreshMapPickerVisuals();

        if (this.spawnTimer) {
            this.spawnTimer.paused = true;
        }
        if (this.powerTimer) {
            this.powerTimer.paused = true;
        }
        this.physics.pause();
    }

    closeMapPicker() {
        if (!this.isMapPickerOpen) {
            return;
        }

        this.isMapPickerOpen = false;
        this.setMapPickerVisible(false);
        this.setEarthVisualVisibility(false);

        if (!this.isGameOver) {
            if (this.spawnTimer) {
                this.spawnTimer.paused = false;
            }
            if (this.powerTimer) {
                this.powerTimer.paused = false;
            }
            this.physics.resume();
        }
    }

    pickPlace(placeIndex) {
        if (this.isGameOver) {
            return;
        }

        const catalog = TrafficRunnerScene.placeCatalog || [];
        const normalizedIndex = Phaser.Math.Clamp(placeIndex, 0, Math.max(0, catalog.length - 1));
        this.selectedPlaceIndex = normalizedIndex;
        TrafficRunnerScene.currentPlaceIndex = normalizedIndex;

        const familyMapIndex = this.getPlaceFamilyMapIndex(normalizedIndex);
        this.applyMapTheme(familyMapIndex, true);
        this.closeMapPicker();
    }

    createBackdrop() {
        // Sky layer behind a large globe.
        this.sky = this.add.rectangle(600, 300, 1200, 600, 0xdcfce7);
        this.sun = this.add.circle(1040, 85, 48, 0xfbbf24, 0.95);

        // Big Earth-like shape in the center.
        this.globeOcean = this.add.circle(600, 300, 265, 0x0369a1, 0.36).setAlpha(0);
        this.globeAtmosphere = this.add.circle(600, 300, 286, 0xbfdbfe, 0.14).setStrokeStyle(4, 0xe0f2fe, 0).setAlpha(0);

        // Continent silhouettes placed inside the globe.
        this.globeContinents = [
            {
                mapIndex: 0,
                shape: this.add.polygon(598, 324, [
                    -24, -84,
                    8, -90,
                    24, -56,
                    16, -20,
                    34, 24,
                    8, 78,
                    -16, 92,
                    -36, 34,
                    -28, -16
                ], 0xc9771f, 0.82).setStrokeStyle(2, 0xfef3c7, 0.22).setAlpha(0)
            },
            {
                mapIndex: 1,
                shape: this.add.polygon(514, 280, [
                    -56, -82,
                    -10, -94,
                    10, -60,
                    -4, -30,
                    18, 6,
                    8, 48,
                    -16, 82,
                    -44, 46,
                    -38, 2,
                    -58, -26
                ], 0x16a34a, 0.82).setStrokeStyle(2, 0xdcfce7, 0.22).setAlpha(0)
            },
            {
                mapIndex: 2,
                shape: this.add.polygon(690, 280, [
                    -82, -54,
                    -28, -86,
                    58, -74,
                    90, -34,
                    76, 8,
                    48, 18,
                    34, 54,
                    -8, 70,
                    -54, 44,
                    -90, -8
                ], 0xdc2626, 0.82).setStrokeStyle(2, 0xffedd5, 0.22).setAlpha(0)
            },
            {
                mapIndex: 3,
                shape: this.add.polygon(624, 236, [
                    -34, -28,
                    8, -40,
                    30, -20,
                    22, 8,
                    -6, 20,
                    -26, 10
                ], 0x7c3aed, 0.82).setStrokeStyle(2, 0xf5f3ff, 0.22).setAlpha(0)
            }
        ];

        this.globeLabels = this.globeContinents.map(entry => {
            const positions = [
                { x: 604, y: 426 },
                { x: 508, y: 382 },
                { x: 700, y: 374 },
                { x: 626, y: 202 }
            ];
            return this.add.text(positions[entry.mapIndex].x, positions[entry.mapIndex].y, this.getMapName(entry.mapIndex), {
                fontSize: '14px',
                color: '#e2e8f0',
                fontStyle: 'bold',
                backgroundColor: '#0f172a',
                padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setAlpha(0);
        });

        // Bottom haze keeps readability near fast-moving obstacles.
        this.horizon = this.add.rectangle(600, 565, 1200, 90, 0x0f172a, 0.22);
        this.roadsideDecor = [];
        this.skylineBlocks = [];
        this.road = null;
        this.leftShoulder = null;
        this.rightShoulder = null;
        this.continentLeft = null;
        this.continentCenter = null;
        this.continentRight = null;
    }

    createRoad() {
        // Road marks along the continent lanes
        this.roadMarks = [];
        const dividerXs = [525, 675];
        dividerXs.forEach(x => {
            for (let y = -40; y <= 640; y += 150) {
                const mark = this.add.rectangle(x, y, 12, 84, 0xfbbf24);
                this.roadMarks.push(mark);
            }
        });
    }

    getMapName(mapIndex) {
        const lang = TrafficRunnerScene.currentLanguage || 'en';
        const names = TrafficRunnerScene.mapNames[lang] || TrafficRunnerScene.mapNames.en;
        return names[mapIndex % names.length] || names[0];
    }

    getPlaceName(placeIndex = this.selectedPlaceIndex) {
        const lang = TrafficRunnerScene.currentLanguage || 'en';
        const catalog = TrafficRunnerScene.placeCatalog || [];
        const place = catalog[placeIndex] || catalog[0];
        if (!place || !place.names) {
            return this.getMapName(this.currentMapIndex);
        }
        return place.names[lang] || place.names.en || this.getMapName(this.currentMapIndex);
    }

    getPlaceTypeLabel(type) {
        const lang = TrafficRunnerScene.currentLanguage || 'en';
        if (lang === 'zh-CN') {
            if (type === 'country') return '国家';
            if (type === 'city') return '城市';
            return '城镇';
        }
        if (lang === 'ko-KR') {
            if (type === 'country') return '국가';
            if (type === 'city') return '도시';
            return '마을';
        }

        if (type === 'country') return 'Country';
        if (type === 'city') return 'City';
        return 'Town';
    }

    getPlaceFamilyMapIndex(placeIndex = this.selectedPlaceIndex) {
        const catalog = TrafficRunnerScene.placeCatalog || [];
        const place = catalog[placeIndex] || catalog[0];
        if (!place) {
            return this.currentMapIndex || 0;
        }
        return place.familyMapIndex % TrafficRunnerScene.mapThemes.length;
    }

    getMapMechanics(mapIndex = this.currentMapIndex) {
        return TrafficRunnerScene.mapMechanics[mapIndex] || TrafficRunnerScene.mapMechanics[0];
    }

    applyMapTheme(mapIndex, announce = true) {
        const theme = TrafficRunnerScene.mapThemes[mapIndex] || TrafficRunnerScene.mapThemes[0];
        this.currentMapIndex = mapIndex;
        TrafficRunnerScene.currentMapIndex = mapIndex;

        // Update globe + environment colors.
        if (this.sky) this.sky.fillColor = theme.sky;
        if (this.sun) this.sun.fillColor = theme.sun;
        if (this.globeOcean) this.globeOcean.fillColor = theme.ocean;
        if (this.globeAtmosphere) this.globeAtmosphere.fillColor = theme.sky;
        if (this.horizon) this.horizon.fillColor = 0x0f172a;

        // Highlight selected place on the globe, keep others muted.
        if (Array.isArray(this.globeContinents)) {
            this.globeContinents.forEach(entry => {
                const isActive = entry.mapIndex === mapIndex;
                entry.shape.fillColor = isActive ? theme.continent : 0x94a3b8;
                entry.shape.setAlpha(this.isEarthVisible ? (isActive ? 0.88 : 0.38) : 0);
            });
        }

        if (Array.isArray(this.globeLabels)) {
            this.globeLabels.forEach((label, idx) => {
                label.setText(this.getMapName(idx));
                label.setAlpha(this.isEarthVisible ? (idx === mapIndex ? 0.94 : 0.62) : 0);
            });
        }

        // Update accent colors
        if (Array.isArray(this.roadsideDecor)) {
            this.roadsideDecor.forEach(item => {
                item.fillColor = theme.accent;
            });
        }

        // Update road marks (lane dividers)
        if (Array.isArray(this.roadMarks)) {
            this.roadMarks.forEach(mark => {
                mark.fillColor = theme.accent;
            });
        }

        this.refreshMapPickerVisuals();

        this.updateMapLabel();

        if (announce) {
            const mapToast = this.add.text(this.cameras.main.centerX, 70, this.formatText('mapNow', { map: this.getPlaceName() }), {
                fontSize: '26px',
                color: '#f8fafc',
                backgroundColor: '#0f172a',
                padding: { x: 14, y: 6 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0);

            this.tweens.add({
                targets: mapToast,
                alpha: 0,
                y: 44,
                duration: 1000,
                ease: 'Sine.easeOut',
                onComplete: () => mapToast.destroy()
            });
        }
    }

    createCarArt(x, y, color, isPlayer = false) {
        const container = this.add.container(x, y);
        const body = this.add.rectangle(0, 0, 42, 88, color);
        const cab = this.add.rectangle(0, -10, 28, 32, 0xd9ed92);
        const bumper = this.add.rectangle(0, 36, 34, 10, 0x1f2933);
        const hood = this.add.rectangle(0, -32, 30, 16, 0x1f2933);
        const stripe = this.add.rectangle(0, 0, 8, 88, isPlayer ? 0xffffff : 0xffd166);
        const wheelLeftTop = this.add.rectangle(-24, -22, 8, 18, 0x111111);
        const wheelRightTop = this.add.rectangle(24, -22, 8, 18, 0x111111);
        const wheelLeftBottom = this.add.rectangle(-24, 22, 8, 18, 0x111111);
        const wheelRightBottom = this.add.rectangle(24, 22, 8, 18, 0x111111);
        container.add([body, cab, bumper, hood, stripe, wheelLeftTop, wheelRightTop, wheelLeftBottom, wheelRightBottom]);
        return container;
    }

    spawnSingleObstacle(laneIndex, yOffset = -120) {
        const mechanics = this.getMapMechanics();
        const spawnScale = Math.min(1.34, (0.92 + (this.level * 0.04)) * mechanics.obstacleScaleBonus);
        const type = Phaser.Math.RND.pick([
            { width: 48, height: 90, color: 0x577590 },
            { width: 58, height: 110, color: 0x6d597a },
            { width: 40, height: 72, color: 0xe76f51 }
        ]);

        const obstacle = this.add.rectangle(this.laneXs[laneIndex], yOffset, type.width * spawnScale, type.height * spawnScale, type.color);
        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityY(this.currentSpeed * mechanics.obstacleSpeedMultiplier);
        obstacle.laneIndex = laneIndex;
        this.obstacles.add(obstacle);

        const obstacleArt = this.createCarArt(obstacle.x, obstacle.y, type.color, false);
        obstacleArt.setScale((type.width > 50 ? 1.05 : 0.92) * spawnScale, (type.height > 100 ? 1.08 : 0.95) * spawnScale);
        this.obstacleGraphics.push({ body: obstacle, art: obstacleArt });
    }

    spawnPowerup() {
        if (this.isGameOver) {
            return;
        }

        const laneIndex = Phaser.Math.Between(0, this.laneXs.length - 1);
        const type = Phaser.Math.RND.pick([
            { key: 'shield', color: 0x60a5fa },
            { key: 'slow', color: 0x34d399 },
            { key: 'boost', color: 0xfbbf24 }
        ]);

        const orb = this.add.circle(this.laneXs[laneIndex], -80, 18, type.color, 0.95);
        this.physics.add.existing(orb);
        orb.powerType = type.key;
        orb.body.setAllowGravity(false);
        orb.body.setImmovable(true);
        orb.body.setVelocityY(this.currentSpeed * 0.82);
        this.powerups.add(orb);

        const iconText = this.add.text(orb.x, orb.y, type.key === 'shield' ? 'S' : (type.key === 'slow' ? 'T' : 'B'), {
            fontSize: '18px',
            color: '#111827',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.powerupGraphics.push({ body: orb, icon: iconText });
    }

    getPowerName(powerKey) {
        if (powerKey === 'shield') return this.getText('powerShield');
        if (powerKey === 'slow') return this.getText('powerSlow');
        if (powerKey === 'boost') return this.getText('powerBoost');
        return '-';
    }

    updatePowerLabel() {
        if (!this.powerText) {
            return;
        }

        const now = this.time.now;
        let value = this.getPowerName(this.activePowerKey);
        if (this.activePowerKey && this.activePowerUntil > now) {
            const seconds = Math.max(1, Math.ceil((this.activePowerUntil - now) / 1000));
            value = `${value} ${seconds}s`;
        }
        this.powerText.setText(this.formatText('powerLabel', { power: value }));
    }

    updateMapLabel() {
        if (!this.mapText) {
            return;
        }
        this.mapText.setText(this.formatText('mapNow', { map: this.getPlaceName() }));
    }

    clearPowerEffects() {
        this.activePowerKey = null;
        this.activePowerUntil = 0;
        this.distanceMultiplier = 1;
        this.speedEffectMultiplier = 1;
        this.updatePowerLabel();
    }

    collectPowerup(player, orb) {
        if (!orb || !orb.active || this.isGameOver) {
            return;
        }

        const type = orb.powerType;
        this.destroyPowerupByBody(orb);

        if (type === 'shield') {
            this.hasShield = true;
            this.activePowerKey = 'shield';
            this.activePowerUntil = 0;
            this.distanceMultiplier = 1;
            this.speedEffectMultiplier = 1;
        } else if (type === 'slow') {
            this.activePowerKey = 'slow';
            this.activePowerUntil = this.time.now + 5500;
            this.speedEffectMultiplier = 0.72;
            this.distanceMultiplier = 1;
        } else {
            this.activePowerKey = 'boost';
            this.activePowerUntil = this.time.now + 6000;
            this.distanceMultiplier = 1.8;
            this.speedEffectMultiplier = 1;
        }

        this.updatePowerLabel();
    }

    destroyPowerupByBody(orb) {
        this.powerupGraphics = this.powerupGraphics.filter(entry => {
            if (entry.body === orb) {
                if (entry.icon && entry.icon.destroy) {
                    entry.icon.destroy();
                }
                if (entry.body && entry.body.destroy) {
                    entry.body.destroy();
                }
                return false;
            }
            return true;
        });
    }

    spawnObstacle() {
        if (this.isGameOver) {
            return;
        }

        const mechanics = this.getMapMechanics();
        const primaryLane = Phaser.Math.Between(0, this.laneXs.length - 1);
        this.spawnSingleObstacle(primaryLane, -120);

        if (Math.random() < mechanics.burstChance) {
            const availableLanes = [0, 1, 2].filter(lane => lane !== primaryLane);
            const burstCount = Math.min(mechanics.maxBurstSpawns, availableLanes.length);
            for (let i = 0; i < burstCount; i++) {
                const lanePickIndex = Phaser.Math.Between(0, availableLanes.length - 1);
                const burstLane = availableLanes.splice(lanePickIndex, 1)[0];
                this.spawnSingleObstacle(burstLane, -220 - (i * 80));
            }
        }
    }

    updateHUD() {
        const distanceValue = Math.floor(this.distance);
        const speedValue = Math.round(this.currentSpeed * this.speedEffectMultiplier);
        const scoreLabel = document.getElementById('score');
        const levelLabel = document.getElementById('level');
        const speedLabel = document.getElementById('speed');

        if (scoreLabel) {
            scoreLabel.innerHTML = `${this.getText('distanceValue')}: <span id="score-value">${distanceValue}</span>`;
        }

        if (levelLabel) {
            levelLabel.innerHTML = `${this.getText('levelValue')}: <span id="level-value">${this.level}</span>`;
        }

        if (speedLabel) {
            speedLabel.innerHTML = `${this.getText('speedValue')}: <span id="speed-value">${speedValue}</span>`;
        }

        this.updateMapLabel();
        this.updatePowerLabel();
        this.refreshMapPickerVisuals();
    }

    showLevelToast() {
        const toast = this.add.text(this.cameras.main.centerX, 120, this.formatText('levelUp', { level: this.level }), {
            fontSize: '36px',
            color: '#fef3c7',
            backgroundColor: '#1f2937',
            padding: { x: 16, y: 8 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 80,
            duration: 900,
            ease: 'Sine.easeOut',
            onComplete: () => toast.destroy()
        });
    }

    movePlayerLane(direction) {
        if (this.isGameOver) {
            return;
        }

        if (this.time.now < this.nextLaneMoveTime) {
            return;
        }

        const mechanics = this.getMapMechanics();

        const nextLane = Phaser.Math.Clamp(this.currentLane + direction, 0, this.laneXs.length - 1);
        if (nextLane === this.currentLane) {
            return;
        }

        this.currentLane = nextLane;
        const targetX = this.laneXs[this.currentLane];

        this.tweens.add({
            targets: [this.player, this.playerArt],
            x: targetX,
            duration: mechanics.laneSwitchDuration,
            ease: 'Sine.easeOut'
        });

        this.nextLaneMoveTime = this.time.now + mechanics.laneSwitchCooldownMs;
    }

    handleCrash(player, obstacle) {
        if (this.isGameOver) {
            return;
        }

        if (this.hasShield) {
            this.hasShield = false;
            this.clearPowerEffects();
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 90, this.getText('shieldSaved'), {
                fontSize: '28px',
                color: '#dbeafe',
                backgroundColor: '#1e3a8a',
                padding: { x: 12, y: 6 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

            if (obstacle && obstacle.destroy) {
                this.obstacleGraphics = this.obstacleGraphics.filter(entry => {
                    if (entry.body === obstacle) {
                        if (entry.art && entry.art.destroy) {
                            entry.art.destroy();
                        }
                        if (entry.body && entry.body.destroy) {
                            entry.body.destroy();
                        }
                        return false;
                    }
                    return true;
                });
            }

            this.updatePowerLabel();
            return;
        }

        this.isGameOver = true;
        this.physics.pause();
        if (this.spawnTimer) {
            this.spawnTimer.remove(false);
        }
        if (this.powerTimer) {
            this.powerTimer.remove(false);
        }

        const loggedInUser = localStorage.getItem('loggedInUser');
        const playerName = (loggedInUser && loggedInUser.trim()) || localStorage.getItem('playerName') || 'Player';
        const playerId = loggedInUser
            ? `user-${loggedInUser.toLowerCase().replace(/\s+/g, '-')}`
            : (localStorage.getItem('playerId') || null);
        if (window.addLeaderboardEntry) {
            const runScore = Math.floor(this.distance);
            window.addLeaderboardEntry(playerName, runScore, this.level, playerId, 'turbo-traffic', runScore);
        }

        this.add.circle(this.player.x, this.player.y, 70, 0xffb703, 0.55);
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, this.getText('crash'), {
            fontSize: '34px',
            color: '#ffffff',
            backgroundColor: '#7f1d1d',
            padding: { x: 18, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        this.scheduleAutoRestart(500);
    }

    scheduleAutoRestart(delayMs = 500) {
        if (this.restartTimeoutId) {
            return;
        }

        this.restartTimeoutId = setTimeout(() => {
            this.restartTimeoutId = null;
            TrafficRunnerScene.resetProgress();

            // Primary path: use the same page-level restart flow as the Restart button.
            try {
                if (window.Navigation && typeof window.Navigation.restartCurrentRun === 'function') {
                    window.Navigation.restartCurrentRun();
                    return;
                }
            } catch (error) {
                console.error('Navigation restart failed:', error);
            }

            // Fallback path: direct scene restart.
            try {
                if (this.scene && typeof this.scene.restart === 'function') {
                    this.scene.restart();
                }
            } catch (error) {
                console.error('Direct scene restart failed:', error);
            }
        }, delayMs);
    }

    update(time, delta) {
        if (this.isGameOver) {
            return;
        }

        if (this.isMapPickerOpen) {
            return;
        }

        const touchControls = window.ArcadeTouchControls;

        if (
            Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
            Phaser.Input.Keyboard.JustDown(this.keys.a) ||
            (touchControls && typeof touchControls.consumeLaneLeft === 'function' && touchControls.consumeLaneLeft())
        ) {
            this.movePlayerLane(-1);
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
            Phaser.Input.Keyboard.JustDown(this.keys.d) ||
            (touchControls && typeof touchControls.consumeLaneRight === 'function' && touchControls.consumeLaneRight())
        ) {
            this.movePlayerLane(1);
        }

        if (this.activePowerKey && this.activePowerUntil > 0 && this.time.now > this.activePowerUntil) {
            this.clearPowerEffects();
        }

        this.distance += (delta / 1000) * (this.currentSpeed * 0.22 * this.distanceMultiplier);
        TrafficRunnerScene.currentDistance = this.distance;

        const nextLevel = Math.max(1, Math.floor(this.distance / this.levelDistanceStep) + 1);
        if (nextLevel !== this.level) {
            this.level = nextLevel;
            TrafficRunnerScene.currentLevel = this.level;
            this.currentSpeed = this.baseSpeed + ((this.level - 1) * 55);
            this.showLevelToast();

            const nextMapIndex = Math.floor((this.level - 1) / 3) % TrafficRunnerScene.mapThemes.length;
            if (nextMapIndex !== this.currentMapIndex) {
                const catalog = TrafficRunnerScene.placeCatalog || [];
                const fallbackIndex = catalog.findIndex(place => place.familyMapIndex === nextMapIndex);
                if (fallbackIndex >= 0) {
                    this.selectedPlaceIndex = fallbackIndex;
                    TrafficRunnerScene.currentPlaceIndex = fallbackIndex;
                }
                this.applyMapTheme(nextMapIndex, false);
            }

            if (this.spawnTimer) {
                const nextDelay = Math.max(380, 860 - (this.level * 28));
                this.spawnTimer.delay = nextDelay;
            }
        }

        this.roadMarks.forEach(mark => {
            mark.y += ((this.currentSpeed * this.speedEffectMultiplier) * delta) / 1000;
            if (mark.y > 690) {
                mark.y = -90;
            }
        });

        this.obstacles.children.entries.forEach(obstacle => {
            if (obstacle && obstacle.body) {
                const mechanics = this.getMapMechanics();
                obstacle.body.setVelocityY(this.currentSpeed * mechanics.obstacleSpeedMultiplier * this.speedEffectMultiplier);
            }
        });

        this.powerups.children.entries.forEach(orb => {
            if (orb && orb.body) {
                orb.body.setVelocityY(this.currentSpeed * 0.82 * this.speedEffectMultiplier);
            }
        });

        this.obstacleGraphics = this.obstacleGraphics.filter(entry => {
            if (!entry.body || !entry.art) {
                return false;
            }

            entry.art.setPosition(entry.body.x, entry.body.y);
            if (entry.body.y > 720) {
                entry.art.destroy();
                entry.body.destroy();
                return false;
            }
            return true;
        });

        this.powerupGraphics = this.powerupGraphics.filter(entry => {
            if (!entry.body || !entry.icon) {
                return false;
            }

            entry.icon.setPosition(entry.body.x, entry.body.y);
            if (entry.body.y > 720) {
                if (entry.icon && entry.icon.destroy) {
                    entry.icon.destroy();
                }
                if (entry.body && entry.body.destroy) {
                    entry.body.destroy();
                }
                return false;
            }
            return true;
        });

        if (Math.floor(time / 250) % 2 === 0) {
            this.updatePowerLabel();
        }

        const roundedDistance = Math.floor(this.distance);
        if (roundedDistance !== this.displayedDistance || this.level !== this.displayedLevel) {
            this.displayedDistance = roundedDistance;
            this.displayedLevel = this.level;
            this.updateHUD();
        }
    }
}

window.TrafficRunnerScene = TrafficRunnerScene;