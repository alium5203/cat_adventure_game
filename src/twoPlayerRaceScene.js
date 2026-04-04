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
        this.cameras.main.setBackgroundColor('#d8f3ff');

        this.trackStartX = 110;
        this.trackFinishX = 1090;
        this.topLaneY = 230;
        this.bottomLaneY = 390;
        this.trackCenterX = 600;
        this.trackCenterY = 310;
        this.trackOuterRx = 430;
        this.trackOuterRy = 140;
        this.trackInnerRx = 372;
        this.trackInnerRy = 94;

        this.player1 = { progress: 0, sprite: null, label: null };
        this.player2 = { progress: 0, sprite: null, label: null };

        this.drawBackdrop();
        this.drawTrack();
        this.createRacers();
        this.bindControls();
        this.setupHud();
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

        const message = String(lastError && lastError.message ? lastError.message : lastError);
        if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('Load failed')) {
            throw new Error(`Cannot reach Race API. Open the live site at ${RACE_DEPLOYED_ORIGIN} or run npm start locally.`);
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
        const p2Clamped = Math.max(0, Math.min(this.lapsToWin, Number(state.progress?.[1] || 0)));
        root.style.justifyContent = 'center';
        this.player2.progress = p2Clamped;
        root.style.background = 'rgba(7, 24, 45, 0.28)';

        root.innerHTML = `
            <div style="width:min(520px,92vw);background:rgba(255,255,255,0.94);border-radius:20px;padding:20px 22px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;">
                <h2 style="margin:0 0 8px;color:#113c5a;font-size:30px;">Device-to-Device Race</h2>
                <p style="margin:0 0 14px;color:#1f4d66;">Create a room code on one device, then join from another device.</p>

                <div style="display:grid;gap:10px;">
                    <input id="race-name-input" maxlength="20" placeholder="Your name" value="${this.getStoredName()}" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:16px;" />
                    <button id="race-create-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#0f766e;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">Create Code</button>
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
                this.setMenuMessage('Cleared old room info. You can create a new code or join another one.');
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
        this.placeRacer(this.player1, 0);
        this.placeRacer(this.player2, 1);
        this.updateProgressHud();
        if (this.statusText) {
            this.statusText.setText('Waiting for room setup...');
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
        this.placeRacer(this.player1, 0);
        this.placeRacer(this.player2, 1);

        if (this.player1.label) this.player1.label.setText(name || 'You');
        if (this.player2.label) this.player2.label.setText('AI Cat');

        this.updateProgressHud();
        this.statusText.setText(`AI kart race started. First to ${this.lapsToWin} laps wins. Tap or press SPACE to boost.`);
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

            this.showLobbyOverlay(`Room code: ${this.raceCode}. Share this code and wait for player 2.`);
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

            this.showLobbyOverlay(`Joined room ${this.raceCode}. Race starting...`);
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
                <p style="margin:0;color:#37617a;font-size:14px;">Keep this screen open. The race will sync automatically.</p>
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

        if (this.statePollTimer) {
            clearInterval(this.statePollTimer);
        }

        this.statePollTimer = setInterval(async () => {
            await this.refreshRaceState();
        }, 120);

        this.refreshRaceState();
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

        const p1 = Math.max(0, Math.min(1, Number(state.progress?.[0] || 0)));
        const p2 = Math.max(0, Math.min(this.lapsToWin, Number(state.progress?.[1] || 0)));
        this.lapsToWin = Math.max(1, Number(state.lapsToWin || this.lapsToWin || RACE_LAPS_TO_WIN_DEFAULT));
        const p1Clamped = Math.max(0, Math.min(this.lapsToWin, Number(state.progress?.[0] || 0)));
        this.player1.progress = p1;
        this.player1.progress = p1Clamped;
        this.player2.progress = p2;

        this.placeRacer(this.player1, 0);
        this.placeRacer(this.player2, 1);

        const topName = state.players?.find(player => player.seat === 0)?.name || 'Player 1';
        const bottomName = state.players?.find(player => player.seat === 1)?.name || 'Player 2';

        if (this.player1.label) this.player1.label.setText(topName);
        if (this.player2.label) this.player2.label.setText(bottomName);

        this.updateProgressHud();

        if (typeof state.winner === 'number') {
            const winnerName = state.winner === 0 ? topName : bottomName;
            const youWin = this.mySeat === state.winner;
            this.statusText.setText(`${winnerName} wins! ${youWin ? 'You win.' : 'You lose.'} Host can press R for rematch.`);
            this.raceActive = false;
        } else if (state.status === 'in-progress') {
            const myLabel = this.mySeat === 0 ? topName : bottomName;
            this.statusText.setText(`Room ${this.raceCode} | Kart: ${myLabel}. Race to ${this.lapsToWin} laps.`);
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
            const playerName = this.player1.label ? this.player1.label.text : 'You';
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
        this.player1.progress = Math.min(this.lapsToWin, this.player1.progress + 0.05);
        this.placeRacer(this.player1, 0);
        this.checkAiFinish();
        this.updateProgressHud();
    }

    updateAiRace(delta) {
        if (!this.raceActive || this.raceMode !== 'ai') return;
        this.aiTickMs += delta;
        if (this.aiTickMs < 120) return;
        this.aiTickMs = 0;

        const step = 0.011 + (Math.random() * 0.016);
        this.player2.progress = Math.min(this.lapsToWin, this.player2.progress + step);
        this.placeRacer(this.player2, 1);

        this.checkAiFinish();
        this.updateProgressHud();
    }

    checkAiFinish() {
        if (this.raceMode !== 'ai' || !this.raceActive) return;
        if (this.player1.progress < this.lapsToWin && this.player2.progress < this.lapsToWin) return;

        this.raceActive = false;
        const winnerSeat = this.player1.progress >= this.lapsToWin ? 0 : 1;
        const winnerName = winnerSeat === 0 ? (this.player1.label ? this.player1.label.text : 'You') : 'AI Cat';
        const youWin = winnerSeat === 0;
        this.statusText.setText(`${winnerName} wins! ${youWin ? 'You win.' : 'You lose.'} Press R for rematch.`);
    }

    getLanePoint(progress, laneIndex) {
        const laneShift = laneIndex === 0 ? -16 : 16;
        const rx = Phaser.Math.Clamp(this.trackOuterRx + laneShift, 120, 560);
        const ry = Phaser.Math.Clamp(this.trackOuterRy + laneShift * 0.6, 70, 240);
        const normalized = Phaser.Math.Wrap(progress, 0, 1);
        const angle = -Math.PI / 2 + (normalized * Math.PI * 2);
        const x = this.trackCenterX + (Math.cos(angle) * rx);
        const y = this.trackCenterY + (Math.sin(angle) * ry);
        const tangentX = -Math.sin(angle) * rx;
        const tangentY = Math.cos(angle) * ry;
        const rotation = Math.atan2(tangentY, tangentX);
        return { x, y, rotation };
    }

    fillEllipseCompat(graphics, x, y, width, height, color, alpha = 1) {
        graphics.fillStyle(color, alpha);
        if (typeof graphics.fillEllipse === 'function') {
            graphics.fillEllipse(x, y, width, height);
            return;
        }
        if (typeof graphics.fillEllipseShape === 'function') {
            graphics.fillEllipseShape(new Phaser.Geom.Ellipse(x, y, width, height));
            return;
        }
        graphics.fillCircle(x, y, Math.max(8, Math.floor(Math.min(width, height) / 2)));
    }

    strokeEllipseCompat(graphics, x, y, width, height, lineWidth, color, alpha = 1) {
        graphics.lineStyle(lineWidth, color, alpha);
        if (typeof graphics.strokeEllipse === 'function') {
            graphics.strokeEllipse(x, y, width, height);
            return;
        }
        if (typeof graphics.strokeEllipseShape === 'function') {
            graphics.strokeEllipseShape(new Phaser.Geom.Ellipse(x, y, width, height));
            return;
        }
    }

    placeRacer(player, laneIndex) {
        if (!player || !player.sprite) return;
        const point = this.getLanePoint(player.progress, laneIndex);
        player.sprite.x = point.x;
        player.sprite.y = point.y;
        player.sprite.rotation = point.rotation;
    }

    drawBackdrop() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x89d8ff, 0x89d8ff, 0xd7f2ff, 0xd7f2ff, 1);
        sky.fillRect(0, 0, 1200, 600);

        const grandstands = this.add.graphics();
        grandstands.fillStyle(0xcbd5e1, 1);
        grandstands.fillRoundedRect(90, 118, 1020, 54, 18);
        grandstands.fillRoundedRect(90, 438, 1020, 54, 18);
        grandstands.fillStyle(0x94a3b8, 1);
        grandstands.fillRoundedRect(120, 132, 960, 28, 14);
        grandstands.fillRoundedRect(120, 452, 960, 28, 14);

        for (let index = 0; index < 18; index++) {
            const x = 132 + (index * 53);
            const topColor = index % 3 === 0 ? 0xff6b6b : index % 3 === 1 ? 0xffd166 : 0x4ecdc4;
            const bottomColor = index % 2 === 0 ? 0x577590 : 0x43aa8b;
            grandstands.fillStyle(topColor, 0.95);
            grandstands.fillRect(x, 136, 26, 20);
            grandstands.fillStyle(bottomColor, 0.95);
            grandstands.fillRect(x, 456, 26, 20);
        }

        const hills = this.add.graphics();
        hills.fillStyle(0x81c784, 1);
        hills.fillCircle(160, 600, 170);
        hills.fillCircle(450, 620, 220);
        hills.fillCircle(840, 610, 180);
        hills.fillCircle(1120, 630, 200);

        const infield = this.add.graphics();
        infield.fillStyle(0x76c893, 1);
        infield.fillRoundedRect(170, 196, 860, 228, 40);
        infield.fillStyle(0x52b788, 1);
        infield.fillRoundedRect(216, 238, 768, 144, 30);
        infield.fillStyle(0xfef3c7, 1);
        infield.fillCircle(600, 310, 44);
        infield.fillStyle(0xf59e0b, 1);
        infield.fillCircle(600, 310, 28);

        const cones = this.add.graphics();
        [300, 460, 740, 900].forEach(x => {
            cones.fillStyle(0xf97316, 1);
            cones.fillTriangle(x, 208, x - 10, 232, x + 10, 232);
            cones.fillTriangle(x, 388, x - 10, 412, x + 10, 412);
        });

        this.add.text(600, 62, 'Two People Race', {
            fontSize: '42px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#114b5f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(600, 103, 'Create a room code and join from another device', {
            fontSize: '20px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#1d3557'
        }).setOrigin(0.5);
    }

    drawTrack() {
        const laneGraphics = this.add.graphics();

        this.fillEllipseCompat(laneGraphics, this.trackCenterX, this.trackCenterY, this.trackOuterRx * 2 + 76, this.trackOuterRy * 2 + 76, 0x334155, 1);
        this.fillEllipseCompat(laneGraphics, this.trackCenterX, this.trackCenterY, this.trackOuterRx * 2, this.trackOuterRy * 2, 0x4f5d75, 1);
        this.fillEllipseCompat(laneGraphics, this.trackCenterX, this.trackCenterY, this.trackInnerRx * 2, this.trackInnerRy * 2, 0x76c893, 1);

        this.strokeEllipseCompat(laneGraphics, this.trackCenterX, this.trackCenterY, (this.trackOuterRx + this.trackInnerRx), (this.trackOuterRy + this.trackInnerRy), 6, 0xffffff, 0.28);

        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const rx = this.trackOuterRx + 33;
            const ry = this.trackOuterRy + 33;
            const x = this.trackCenterX + Math.cos(angle) * rx;
            const y = this.trackCenterY + Math.sin(angle) * ry;
            laneGraphics.fillStyle(i % 2 === 0 ? 0xef4444 : 0xffffff, 1);
            laneGraphics.fillCircle(x, y, 8);
        }

        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            const rx = (this.trackOuterRx + this.trackInnerRx) / 2;
            const ry = (this.trackOuterRy + this.trackInnerRy) / 2;
            const x = this.trackCenterX + Math.cos(angle) * rx;
            const y = this.trackCenterY + Math.sin(angle) * ry;
            laneGraphics.fillStyle(0xffffff, 0.64);
            laneGraphics.fillCircle(x, y, 5);
        }

        const gantry = this.add.graphics();
        gantry.fillStyle(0x1e293b, 1);
        gantry.fillRect(this.trackCenterX - 40, 144, 10, 54);
        gantry.fillRect(this.trackCenterX + 30, 144, 10, 54);
        gantry.fillRoundedRect(this.trackCenterX - 52, 118, 94, 28, 8);
        this.add.text(this.trackCenterX - 5, 132, 'FINISH', {
            fontSize: '14px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.trackCenterX - 128, 130, 'START', {
            fontSize: '14px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#fff7ed',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.player1.label = this.add.text(88, 198, 'Player 1', {
            fontSize: '24px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.player2.label = this.add.text(88, 384, 'Player 2', {
            fontSize: '24px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
    }

    createRacers() {
        this.player1.sprite = this.add.rectangle(this.trackCenterX - this.trackOuterRx, this.trackCenterY, 40, 22, 0xffb703);
        this.player2.sprite = this.add.rectangle(this.trackCenterX - this.trackOuterRx, this.trackCenterY + 20, 40, 22, 0x577590);

        this.physics.add.existing(this.player1.sprite);
        this.physics.add.existing(this.player2.sprite);

        this.player1.sprite.body.setAllowGravity(false);
        this.player2.sprite.body.setAllowGravity(false);

        this.placeRacer(this.player1, 0);
        this.placeRacer(this.player2, 1);
    }

    bindControls() {
        this.tapKey = this.input.keyboard.addKey('SPACE');
        this.restartKey = this.input.keyboard.addKey('R');

        this.input.on('pointerdown', () => {
            this.sendBoost();
        });
    }

    setupHud() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const speedEl = document.getElementById('speed');
        const livesEl = document.getElementById('lives');

        if (speedEl) speedEl.style.display = 'none';
        if (livesEl) livesEl.style.display = 'none';

        if (scoreEl) scoreEl.innerHTML = 'P1: <span id="score-value">0%</span>';
        if (levelEl) levelEl.innerHTML = 'P2: <span id="level-value">0%</span>';

        this.statusText = this.add.text(600, 540, 'Waiting for room setup...', {
            fontSize: '24px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#0b3d91',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    update(_time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.tapKey)) {
            this.sendBoost();
        }

        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.sendRematch();
        }

        this.updateAiRace(delta || 0);
    }

    updateProgressHud() {
        const p1Lap = Math.min(this.lapsToWin, Math.floor(this.player1.progress) + 1);
        const p2Lap = Math.min(this.lapsToWin, Math.floor(this.player2.progress) + 1);
        const p1Progress = this.player1.progress >= this.lapsToWin ? 100 : Math.floor((this.player1.progress % 1) * 100);
        const p2Progress = this.player2.progress >= this.lapsToWin ? 100 : Math.floor((this.player2.progress % 1) * 100);

        const scoreValue = document.getElementById('score-value');
        const levelValue = document.getElementById('level-value');

        if (scoreValue) scoreValue.textContent = `L${p1Lap}/${this.lapsToWin} ${p1Progress}%`;
        if (levelValue) levelValue.textContent = `L${p2Lap}/${this.lapsToWin} ${p2Progress}%`;
    }
}

window.TwoPlayerRaceScene = TwoPlayerRaceScene;
