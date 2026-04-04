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
    }

    create() {
        this.physics.world.gravity.y = 0;
        this.cameras.main.setBackgroundColor('#d8f3ff');

        this.trackStartX = 110;
        this.trackFinishX = 1090;
        this.topLaneY = 230;
        this.bottomLaneY = 390;

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

    async apiRequest(path, options = {}) {
        try {
            const response = await fetch(path, {
                method: options.method || 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload.ok === false) {
                const apiError = payload.error || '';
                if (response.status === 404) {
                    throw new Error('Race API not found on this host. Run npm start in cat-game and open from that server URL.');
                }
                throw new Error(apiError || `Race request failed (${response.status}).`);
            }
            return payload;
        } catch (error) {
            const message = String(error && error.message ? error.message : error);
            if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                throw new Error('Cannot reach Race API. Start the Node server with npm start in cat-game, then open that same server URL on both devices.');
            }
            throw error;
        }
    }

    mountMenuOverlay() {
        this.unmountOverlay();
        const parent = document.getElementById('game-page');
        if (!parent) return;

        const root = document.createElement('div');
        root.id = 'race-online-overlay';
        root.style.position = 'absolute';
        root.style.inset = '0';
        root.style.display = 'flex';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
        root.style.zIndex = '320';
        root.style.background = 'rgba(7, 24, 45, 0.28)';

        root.innerHTML = `
            <div style="width:min(520px,92vw);background:rgba(255,255,255,0.94);border-radius:20px;padding:20px 22px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;">
                <h2 style="margin:0 0 8px;color:#113c5a;font-size:30px;">Device-to-Device Race</h2>
                <p style="margin:0 0 14px;color:#1f4d66;">Create a room code on one device, then join from another device.</p>

                <div style="display:grid;gap:10px;">
                    <input id="race-name-input" maxlength="20" placeholder="Your name" value="${this.getStoredName()}" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:16px;" />
                    <button id="race-create-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#0f766e;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">Create Code</button>
                </div>

                <div style="height:1px;background:#d9e7f0;margin:16px 0;"></div>

                <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
                    <input id="race-code-input" maxlength="4" placeholder="Enter code" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:18px;text-transform:uppercase;letter-spacing:0.14em;" />
                    <button id="race-join-btn" style="padding:12px 16px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-size:17px;font-weight:700;cursor:pointer;">Join</button>
                </div>

                <p id="race-menu-msg" style="margin:12px 0 0;color:#204860;font-size:14px;min-height:20px;"></p>
            </div>
        `;

        parent.appendChild(root);
        this.overlayRoot = root;

        const createBtn = root.querySelector('#race-create-btn');
        const joinBtn = root.querySelector('#race-join-btn');
        const codeInput = root.querySelector('#race-code-input');
        const nameInput = root.querySelector('#race-name-input');

        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const name = (nameInput?.value || '').trim() || this.getStoredName();
                localStorage.setItem('playerName', name);
                await this.createRoom(name);
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
            </div>
        `;
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
        this.mySeat = Number.isInteger(state.mySeat) ? state.mySeat : this.mySeat;

        const p1 = Math.max(0, Math.min(1, Number(state.progress?.[0] || 0)));
        const p2 = Math.max(0, Math.min(1, Number(state.progress?.[1] || 0)));
        this.player1.progress = p1;
        this.player2.progress = p2;

        this.player1.sprite.x = Phaser.Math.Linear(this.trackStartX, this.trackFinishX, p1);
        this.player2.sprite.x = Phaser.Math.Linear(this.trackStartX, this.trackFinishX, p2);

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
            this.statusText.setText(`Room ${this.raceCode} | You are ${myLabel}. Tap or press SPACE to sprint.`);
            this.raceActive = true;
        }
    }

    async sendBoost() {
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

    drawBackdrop() {
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x89d8ff, 0x89d8ff, 0xd7f2ff, 0xd7f2ff, 1);
        sky.fillRect(0, 0, 1200, 600);

        const hills = this.add.graphics();
        hills.fillStyle(0x81c784, 1);
        hills.fillCircle(160, 600, 170);
        hills.fillCircle(450, 620, 220);
        hills.fillCircle(840, 610, 180);
        hills.fillCircle(1120, 630, 200);

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

        laneGraphics.fillStyle(0x4f5d75, 1);
        laneGraphics.fillRoundedRect(this.trackStartX - 38, this.topLaneY - 28, this.trackFinishX - this.trackStartX + 76, 56, 18);
        laneGraphics.fillRoundedRect(this.trackStartX - 38, this.bottomLaneY - 28, this.trackFinishX - this.trackStartX + 76, 56, 18);

        laneGraphics.fillStyle(0xf4a261, 1);
        laneGraphics.fillRect(this.trackStartX - 6, this.topLaneY - 31, 12, 62);
        laneGraphics.fillRect(this.trackStartX - 6, this.bottomLaneY - 31, 12, 62);

        laneGraphics.fillStyle(0xe63946, 1);
        laneGraphics.fillRect(this.trackFinishX - 6, this.topLaneY - 31, 12, 62);
        laneGraphics.fillRect(this.trackFinishX - 6, this.bottomLaneY - 31, 12, 62);

        for (let i = this.trackStartX + 30; i < this.trackFinishX - 10; i += 35) {
            laneGraphics.fillStyle(0xffffff, 0.72);
            laneGraphics.fillRect(i, this.topLaneY - 2, 16, 4);
            laneGraphics.fillRect(i, this.bottomLaneY - 2, 16, 4);
        }

        this.player1.label = this.add.text(36, this.topLaneY - 12, 'Player 1', {
            fontSize: '28px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.player2.label = this.add.text(36, this.bottomLaneY - 12, 'Player 2', {
            fontSize: '28px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
    }

    createRacers() {
        this.player1.sprite = this.add.rectangle(this.trackStartX, this.topLaneY, 40, 34, 0xffb703);
        this.player2.sprite = this.add.rectangle(this.trackStartX, this.bottomLaneY, 40, 34, 0x577590);

        this.physics.add.existing(this.player1.sprite);
        this.physics.add.existing(this.player2.sprite);

        this.player1.sprite.body.setAllowGravity(false);
        this.player2.sprite.body.setAllowGravity(false);
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

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.tapKey)) {
            this.sendBoost();
        }

        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.sendRematch();
        }
    }

    updateProgressHud() {
        const p1Value = Math.floor(this.player1.progress * 100);
        const p2Value = Math.floor(this.player2.progress * 100);

        const scoreValue = document.getElementById('score-value');
        const levelValue = document.getElementById('level-value');

        if (scoreValue) scoreValue.textContent = `${p1Value}%`;
        if (levelValue) levelValue.textContent = `${p2Value}%`;
    }
}

window.TwoPlayerRaceScene = TwoPlayerRaceScene;
