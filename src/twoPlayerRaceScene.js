const RACE_DEPLOYED_ORIGIN = 'https://agile-brushlands-24267-9cfa491ed233.herokuapp.com';
const RACE_LAPS_TO_WIN_DEFAULT = 3;

class TwoPlayerRaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TwoPlayerRaceScene' });
        this.overlayRoot = null;
        this.lobbyPollTimer = null;
        this.statePollTimer = null;
        this.raceCode = null;
        this.playerId = null;
        this.mySeat = null;
        this.raceActive = false;
        this.lastBoostAt = 0;
        this.raceMode = null;
        this.aiTickMs = 0;
        this.lapsToWin = RACE_LAPS_TO_WIN_DEFAULT;
    }

    create() {
        this.physics.world.gravity.y = 0;
        this.cameras.main.setBackgroundColor('#87ceeb');

        // Mario Kart-style perspective track
        this.trackCenterX = 600;
        this.player1 = { progress: 0, label: null, itemCount: 0, sprite: null, lane: -1 };
        this.player2 = { progress: 0, label: null, itemCount: 0, sprite: null, lane: 1 };
        this.roadScroll = 0;
        this.roadCurve = 0;

        this.drawPerspectiveRoad();
        this.createPlayerKarts();
        this.setupRaceHud();
        this.bindControls();
        this.mountMenuOverlay();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.cleanupNetworkTimers();
            this.unmountOverlay();
        });
    }

    cleanupNetworkTimers() {
        if (this.lobbyPollTimer) {
            clearInterval(this.lobbyPollTimer);
            this.lobbyPollTimer = null;
        }
        if (this.statePollTimer) {
            clearInterval(this.statePollTimer);
            this.statePollTimer = null;
        }
    }

    getStoredName() {
        const fromStorage = localStorage.getItem('playerName');
        if (fromStorage && fromStorage.trim()) {
            return fromStorage.trim();
        }
        return 'Player';
    }

    getApiCandidates(path) {
        const candidates = [path];
        if (typeof window !== 'undefined' && window.location.origin !== RACE_DEPLOYED_ORIGIN) {
            candidates.push(`${RACE_DEPLOYED_ORIGIN}${path}`);
        }
        return [...new Set(candidates)];
    }

    async apiRequest(path, options = {}) {
        let lastError = null;

        for (const url of this.getApiCandidates(path)) {
            try {
                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    mode: url.startsWith('http') ? 'cors' : 'same-origin'
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok || payload.ok === false) {
                    const apiError = payload.error || '';
                    lastError = new Error(apiError || `Race request failed (${response.status}).`);
                    continue;
                }
                return payload;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('Race API request failed.');
    }

    mountMenuOverlay() {
        this.unmountOverlay();
        const parent = document.getElementById('game-page');
        if (!parent) return;

        const root = document.createElement('div');
        root.id = 'race-online-overlay';
        root.style.display = 'flex';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
        root.style.background = 'rgba(7, 24, 45, 0.28)';

        root.innerHTML = `
            <div style="width:min(520px,92vw);background:rgba(255,255,255,0.94);border-radius:20px;padding:20px 22px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;">
                <h2 style="margin:0 0 8px;color:#113c5a;font-size:30px;">🏎️ Mario Kart: Race Forward!</h2>
                <p style="margin:0 0 14px;color:#1f4d66;">Race in 3D perspective! Use SPACE to boost, A/D to switch lanes.</p>

                <div style="display:grid;gap:10px;">
                    <input id="race-name-input" maxlength="20" placeholder="Your name" value="${this.getStoredName()}" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:16px;" />
                    <button id="race-create-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#0f766e;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">Create Room</button>
                    <button id="race-ai-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#7c3aed;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">Play vs AI</button>
                </div>

                <div style="height:1px;background:#d9e7f0;margin:16px 0;"></div>

                <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
                    <input id="race-code-input" maxlength="4" placeholder="Enter code" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:18px;text-transform:uppercase;letter-spacing:0.14em;" />
                    <button id="race-join-btn" style="padding:12px 16px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-size:17px;font-weight:700;cursor:pointer;">Join</button>
                </div>

                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
                    <button id="race-reset-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#e2e8f0;color:#1e293b;font-size:14px;font-weight:700;cursor:pointer;">Clear</button>
                </div>

                <p id="race-menu-msg" style="margin:12px 0 0;color:#204860;font-size:14px;min-height:20px;"></p>
            </div>
        `;

        parent.appendChild(root);
        this.overlayRoot = root;

        const createBtn = root.querySelector('#race-create-btn');
        const aiBtn = root.querySelector('#race-ai-btn');
        const joinBtn = root.querySelector('#race-join-btn');
        const resetBtn = root.querySelector('#race-reset-btn');
        const codeInput = root.querySelector('#race-code-input');
        const nameInput = root.querySelector('#race-name-input');

        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const name = (nameInput?.value || '').trim() || this.getStoredName();
                localStorage.setItem('playerName', name);
                await this.createRoom(name);
            });
        }

        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                const name = (nameInput?.value || '').trim() || this.getStoredName();
                localStorage.setItem('playerName', name);
                this.startAiRace(name);
            });
        }

        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                const name = (nameInput?.value || '').trim() || this.getStoredName();
                const code = String(codeInput?.value || '').toUpperCase().trim();
                localStorage.setItem('playerName', name);
                await this.joinRoom(code, name);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (codeInput) codeInput.value = '';
                this.resetRaceSession();
                this.setMenuMessage('Cleared. Create new or join another room.');
            });
        }
    }

    resetRaceSession() {
        this.cleanupNetworkTimers();
        this.raceCode = null;
        this.playerId = null;
        this.mySeat = null;
        this.raceActive = false;
        this.raceMode = null;
        this.player1.progress = 0;
        this.player2.progress = 0;
        if (this.statusText) {
            this.statusText.setText('Waiting for race...');
        }
    }

    startAiRace(name) {
        this.cleanupNetworkTimers();
        this.raceMode = 'ai';
        this.raceCode = null;
        this.playerId = 'local-player';
        this.mySeat = 0;
        this.raceActive = true;
        this.aiTickMs = 0;

        this.player1.progress = 0;
        this.player2.progress = 0;
        this.player1.lane = -1;
        this.player2.lane = 1;
        this.player1.label = name || 'You';
        this.player2.label = 'AI Cat';

        this.updateRaceHud();
        this.statusText.setText(`🏁 3-Lap Race! Press SPACE to BOOST!`);
        this.unmountOverlay();
    }

    unmountOverlay() {
        if (this.overlayRoot && this.overlayRoot.parentNode) {
            this.overlayRoot.parentNode.removeChild(this.overlayRoot);
        }
        this.overlayRoot = null;
    }

    setMenuMessage(text) {
        if (!this.overlayRoot) return;
        const msg = this.overlayRoot.querySelector('#race-menu-msg');
        if (msg) msg.textContent = text;
    }

    async createRoom(name) {
        try {
            this.raceMode = 'network';
            this.setMenuMessage('Creating room...');
            const data = await this.apiRequest('/api/race/lobbies', {
                method: 'POST',
                body: { hostName: name }
            });

            this.raceCode = data.lobby.code;
            this.playerId = data.playerId;
            this.mySeat = 0;

            this.showLobbyOverlay(`Room code: ${this.raceCode}`);
            this.startLobbyPolling();
        } catch (error) {
            this.setMenuMessage(error.message || 'Unable to create room.');
        }
    }

    async joinRoom(code, name) {
        if (!/^[A-Z0-9]{4}$/.test(code)) {
            this.setMenuMessage('Enter a valid 4-character room code.');
            return;
        }

        try {
            this.raceMode = 'network';
            this.setMenuMessage('Joining room...');
            const data = await this.apiRequest(`/api/race/lobbies/${code}/join`, {
                method: 'POST',
                body: { playerName: name }
            });

            this.raceCode = code;
            this.playerId = data.playerId;
            this.mySeat = 1;

            this.showLobbyOverlay(`Joined room ${this.raceCode}`);
            this.enterRace();
        } catch (error) {
            this.setMenuMessage(error.message || 'Unable to join room.');
        }
    }

    showLobbyOverlay(message) {
        if (!this.overlayRoot) return;
        this.overlayRoot.innerHTML = `
            <div style="width:min(560px,92vw);background:rgba(255,255,255,0.95);border-radius:20px;padding:22px 24px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;text-align:center;">
                <h2 style="margin:0 0 10px;color:#113c5a;font-size:30px;">Race Lobby</h2>
                <p style="margin:0 0 10px;color:#205a77;font-size:18px;">${message}</p>
                <p style="margin:0;color:#37617a;font-size:14px;">Keep open. Race starts when both join.</p>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
                    <button id="race-new-code-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">New Code</button>
                    <button id="race-back-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#e2e8f0;color:#1e293b;font-size:14px;font-weight:700;cursor:pointer;">Back</button>
                </div>
            </div>
        `;

        const newCodeBtn = this.overlayRoot.querySelector('#race-new-code-btn');
        const backBtn = this.overlayRoot.querySelector('#race-back-btn');

        if (newCodeBtn) {
            newCodeBtn.addEventListener('click', async () => {
                const name = this.getStoredName();
                this.mountMenuOverlay();
                await this.createRoom(name);
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.resetRaceSession();
                this.mountMenuOverlay();
            });
        }
    }

    startLobbyPolling() {
        if (!this.raceCode) return;
        this.cleanupNetworkTimers();

        this.lobbyPollTimer = setInterval(async () => {
            try {
                const data = await this.apiRequest(`/api/race/lobbies/${this.raceCode}`);
                if (data.lobby.status === 'in-progress' || data.lobby.status === 'finished') {
                    this.enterRace();
                }
            } catch (error) {
                this.showLobbyOverlay(`Room lost: ${error.message}`);
                this.cleanupNetworkTimers();
            }
        }, 900);
    }

    enterRace() {
        this.raceMode = 'network';
        this.raceActive = true;
        this.unmountOverlay();

        if (this.lobbyPollTimer) {
            clearInterval(this.lobbyPollTimer);
            this.lobbyPollTimer = null;
        }

        this.statePollTimer = setInterval(() => {
            this.refreshRaceState();
        }, 120);

        this.statusText.setText(`🏁 Race Started! Press SPACE to BOOST!`);
    }

    async refreshRaceState() {
        if (!this.raceCode || !this.playerId) return;
        try {
            const data = await this.apiRequest(`/api/race/lobbies/${this.raceCode}/state?playerId=${encodeURIComponent(this.playerId)}`);
            this.applyServerState(data.state);
        } catch (error) {
            this.statusText.setText(`Disconnected: ${error.message}`);
            this.raceActive = false;
            this.cleanupNetworkTimers();
        }
    }

    applyServerState(state) {
        if (!state) return;
        this.raceMode = 'network';
        this.mySeat = Number.isInteger(state.mySeat) ? state.mySeat : this.mySeat;

        this.lapsToWin = Math.max(1, Number(state.lapsToWin || this.lapsToWin || RACE_LAPS_TO_WIN_DEFAULT));
        
        const p1Clamped = Math.max(0, Math.min(this.lapsToWin, Number(state.progress?.[0] || 0)));
        const p2Clamped = Math.max(0, Math.min(this.lapsToWin, Number(state.progress?.[1] || 0)));
        
        this.player1.progress = p1Clamped;
        this.player2.progress = p2Clamped;

        const topName = state.players?.find(player => player.seat === 0)?.name || 'Player 1';
        const bottomName = state.players?.find(player => player.seat === 1)?.name || 'Player 2';

        this.player1.label = topName;
        this.player2.label = bottomName;

        this.updateRaceHud();

        if (typeof state.winner === 'number') {
            const winnerName = state.winner === 0 ? topName : bottomName;
            const youWin = this.mySeat === state.winner;
            this.statusText.setText(`${winnerName} WINS! ${youWin ? '🏆 YOU WIN! 🏆' : 'You lose. Press R for rematch.'}`);
            this.raceActive = false;
        } else if (state.status === 'in-progress') {
            const myLabel = this.mySeat === 0 ? topName : bottomName;
            this.statusText.setText(`🏁 Race to ${this.lapsToWin} laps | Your kart: ${myLabel}`);
            this.raceActive = true;
        }
    }

    async sendBoost() {
        if (this.raceMode === 'ai') {
            this.localBoost();
            return;
        }
        if (!this.raceActive || !this.raceCode || !this.playerId) return;
        const now = Date.now();
        if (now - this.lastBoostAt < 70) return;
        this.lastBoostAt = now;

        try {
            const data = await this.apiRequest(`/api/race/lobbies/${this.raceCode}/boost`, {
                method: 'POST',
                body: { playerId: this.playerId }
            });
            this.applyServerState(data.state);
        } catch (error) {
            this.statusText.setText(error.message || 'Boost failed.');
        }
    }

    async sendRematch() {
        if (this.raceMode === 'ai') {
            const playerName = this.player1.label || 'You';
            this.startAiRace(playerName);
            return;
        }
        if (!this.raceCode || !this.playerId) return;
        try {
            const data = await this.apiRequest(`/api/race/lobbies/${this.raceCode}/rematch`, {
                method: 'POST',
                body: { playerId: this.playerId }
            });
            this.applyServerState(data.state);
            this.raceActive = true;
        } catch (error) {
            this.statusText.setText(error.message || 'Only host can rematch.');
        }
    }

    localBoost() {
        if (!this.raceActive || this.raceMode !== 'ai') return;
        this.player1.progress = Math.min(this.lapsToWin, this.player1.progress + 0.08);
        this.createBoostEffect();
        this.checkAiFinish();
        this.updateRaceHud();
    }

    updateAiRace(delta) {
        if (!this.raceActive || this.raceMode !== 'ai') return;
        this.aiTickMs += delta;
        if (this.aiTickMs < 120) return;
        this.aiTickMs = 0;

        const step = 0.011 + (Math.random() * 0.016);
        this.player2.progress = Math.min(this.lapsToWin, this.player2.progress + step);
        this.checkAiFinish();
        this.updateRaceHud();
    }

    checkAiFinish() {
        if (this.raceMode !== 'ai' || !this.raceActive) return;
        if (this.player1.progress < this.lapsToWin && this.player2.progress < this.lapsToWin) return;

        this.raceActive = false;
        const winnerSeat = this.player1.progress >= this.lapsToWin ? 0 : 1;
        const winnerName = winnerSeat === 0 ? (this.player1.label || 'You') : 'AI Cat';
        const youWin = winnerSeat === 0;
        const message = youWin ? `${winnerName} WINS! 🏆 YOU WIN! 🏆 Press R for rematch.` : `${winnerName} wins. You lose. Press R for rematch.`;
        this.statusText.setText(message);
    }

    drawPerspectiveRoad() {
        this.bgGraphics = this.add.graphics();
        this.roadGraphics = this.add.graphics();
        this.fxGraphics = this.add.graphics();

        // Static sky/ground base.
        this.bgGraphics.fillStyle(0x85d6ff, 1);
        this.bgGraphics.fillRect(0, 0, 1200, 290);
        this.bgGraphics.fillStyle(0x2f9a2f, 1);
        this.bgGraphics.fillRect(0, 290, 1200, 310);

        this.renderRoad(0, 0);
    }

    createPlayerKarts() {
        const makeKart = (x, y, color, textColor, tag) => {
            const body = this.add.rectangle(x, y, 56, 30, color).setStrokeStyle(3, 0x1f2937, 1);
            const spoiler = this.add.rectangle(x, y + 16, 42, 6, 0x111827);
            const label = this.add.text(x, y, tag, {
                fontSize: '12px',
                fontFamily: 'Nunito, Arial, sans-serif',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            return this.add.container(0, 0, [body, spoiler, label]);
        };

        this.player1.sprite = makeKart(520, 468, 0xffc107, '#1f2937', 'P1');
        this.player2.sprite = makeKart(680, 430, 0x4f83cc, '#ffffff', 'P2');
    }

    renderRoad(scroll, curve) {
        if (!this.roadGraphics || !this.fxGraphics) return;

        this.roadGraphics.clear();
        this.fxGraphics.clear();

        const segCount = 42;
        const horizonY = 118;
        const bottomY = 560;
        const band = (bottomY - horizonY) / segCount;

        // Distant hills for depth.
        this.fxGraphics.fillStyle(0x62b15b, 1);
        this.fxGraphics.fillCircle(120, 290, 120);
        this.fxGraphics.fillCircle(360, 292, 155);
        this.fxGraphics.fillCircle(760, 298, 180);
        this.fxGraphics.fillCircle(1040, 296, 145);

        for (let i = 0; i < segCount; i++) {
            const t0 = i / segCount;
            const t1 = (i + 1) / segCount;
            const y0 = bottomY - (i * band);
            const y1 = bottomY - ((i + 1) * band);

            const w0 = Phaser.Math.Linear(520, 130, t0);
            const w1 = Phaser.Math.Linear(520, 130, t1);

            const bend0 = curve * (1 - t0) * (1 - t0) * 260;
            const bend1 = curve * (1 - t1) * (1 - t1) * 260;

            const cx0 = this.trackCenterX + bend0;
            const cx1 = this.trackCenterX + bend1;

            // Main asphalt.
            this.roadGraphics.fillStyle(i % 2 === 0 ? 0x3b3b3b : 0x454545, 1);
            this.roadGraphics.fillTriangle(cx0 - w0, y0, cx0 + w0, y0, cx1 + w1, y1);
            this.roadGraphics.fillTriangle(cx0 - w0, y0, cx1 + w1, y1, cx1 - w1, y1);

            // Curbs.
            this.roadGraphics.fillStyle(i % 2 === 0 ? 0xfff4f4 : 0xe11d48, 1);
            this.roadGraphics.fillRect(cx0 - w0 - 16, y1, 16, Math.max(1, y0 - y1));
            this.roadGraphics.fillRect(cx0 + w0, y1, 16, Math.max(1, y0 - y1));

            // Lane dashes.
            if (((i + Math.floor(scroll * 20)) % 5) === 0) {
                const dashW = Phaser.Math.Linear(16, 5, t0);
                const dashH = Math.max(2, Math.floor((y0 - y1) * 0.7));
                this.roadGraphics.fillStyle(0xffe66d, 1);
                this.roadGraphics.fillRect(cx0 - (dashW / 2), y1 + 1, dashW, dashH);
            }

            // Roadside posts for speed sensation.
            if (i % 4 === 0) {
                const postH = Phaser.Math.Linear(24, 8, t0);
                this.fxGraphics.fillStyle(0x166534, 1);
                this.fxGraphics.fillRect(cx0 - w0 - 48, y1 - postH, 8, postH);
                this.fxGraphics.fillRect(cx0 + w0 + 40, y1 - postH, 8, postH);
            }
        }
    }

    createBoostEffect() {
        const flash = this.add.rectangle(600, 300, 1200, 600, 0xffff00);
        flash.setAlpha(0.15);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    bindControls() {
        this.input.keyboard.addKey('SPACE');
        this.input.keyboard.addKey('R');
        this.input.keyboard.addKey('A');
        this.input.keyboard.addKey('D');
        this.input.keyboard.addKey('LEFT');
        this.input.keyboard.addKey('RIGHT');

        this.input.on('pointerdown', () => {
            this.sendBoost();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.sendBoost();
        });

        this.input.keyboard.on('keydown-R', () => {
            this.sendRematch();
        });

        this.input.keyboard.on('keydown-D', () => {
            this.player1.lane = 1;
        });

        this.input.keyboard.on('keydown-A', () => {
            this.player1.lane = -1;
        });

        this.input.keyboard.on('keydown-LEFT', () => {
            this.player2.lane = -1;
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            this.player2.lane = 1;
        });

        this.input.on('pointermove', pointer => {
            if (!pointer.isDown) return;
            this.player1.lane = pointer.x < 600 ? -1 : 1;
        });
    }

    setupRaceHud() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const speedEl = document.getElementById('speed');
        const livesEl = document.getElementById('lives');

        if (speedEl) speedEl.style.display = 'none';
        if (livesEl) livesEl.style.display = 'none';

        if (scoreEl) scoreEl.innerHTML = '<span id="p1-hud">P1: L1/3</span>';
        if (levelEl) levelEl.innerHTML = '<span id="p2-hud">P2: L1/3</span>';

        this.statusText = this.add.text(600, 540, 'Waiting for race...', {
            fontSize: '20px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            backgroundMargin: { left: 12, right: 12, top: 8, bottom: 8 },
            padding: { left: 12, right: 12, top: 8, bottom: 8 }
        }).setOrigin(0.5);
    }

    updateRaceHud() {
        const p1Lap = Math.floor(this.player1.progress) + 1;
        const p2Lap = Math.floor(this.player2.progress) + 1;
        const p1Progress = this.player1.progress >= this.lapsToWin ? 100 : Math.floor((this.player1.progress % 1) * 100);
        const p2Progress = this.player2.progress >= this.lapsToWin ? 100 : Math.floor((this.player2.progress % 1) * 100);

        const p1Hud = document.getElementById('p1-hud');
        const p2Hud = document.getElementById('p2-hud');

        if (p1Hud) p1Hud.textContent = `P1: L${p1Lap}/${this.lapsToWin} ${p1Progress}%`;
        if (p2Hud) p2Hud.textContent = `P2: L${p2Lap}/${this.lapsToWin} ${p2Progress}%`;
    }

    update(_time, delta) {
        if (this.raceActive) {
            const dt = Math.max(0.001, (delta || 16) / 1000);
            this.roadScroll += dt * (2.5 + (this.player1.progress % 1));
            this.roadCurve = Math.sin(this.player1.progress * Math.PI * 2) * 0.7;

            this.renderRoad(this.roadScroll, this.roadCurve);

            const playerX = this.trackCenterX + (this.player1.lane * 115);
            this.player1.sprite.x += (playerX - this.player1.sprite.x) * 0.2;
            this.player1.sprite.y = 472;

            const lead = Phaser.Math.Clamp(this.player2.progress - this.player1.progress, -0.5, 0.5);
            const oppY = Phaser.Math.Linear(502, 350, (lead + 0.5));
            const oppX = this.trackCenterX + (this.player2.lane * Phaser.Math.Linear(135, 95, (oppY - 350) / 152));
            this.player2.sprite.x += (oppX - this.player2.sprite.x) * 0.2;
            this.player2.sprite.y += (oppY - this.player2.sprite.y) * 0.2;
        }

        this.updateAiRace(delta || 0);
    }
}

window.TwoPlayerRaceScene = TwoPlayerRaceScene;
