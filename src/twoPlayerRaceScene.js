const RACE_DEPLOYED_ORIGINS = [
    'https://www.cocoabeans.org',
    'https://agile-brushlands-24267-9cfa491ed233.herokuapp.com'
];
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

    getLang() {
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        return ['en', 'zh-CN', 'ko-KR'].includes(lang) ? lang : 'en';
    }

    getText(path, vars = {}) {
        const dict = {
            en: {
                raceTitle: 'Two People Race',
                raceSubtitle: 'Create a room code and join from another device',
                deviceRace: 'Device-to-Device Race',
                deviceRaceHelp: 'Create a room code on one device, then join from another device.',
                yourName: 'Your name',
                createCode: 'Create Code',
                playVsAi: 'Play vs AI',
                enterCode: 'Enter code',
                join: 'Join',
                clear: 'Clear',
                clearedInfo: 'Cleared old room info. You can create a new code or join another one.',
                waitingSetup: 'Waiting for room setup...',
                aiStart: 'AI kart race started. First to {laps} laps wins. Tap or press SPACE to boost.',
                creatingRoom: 'Creating room...',
                joiningRoom: 'Joining room...',
                invalidCode: 'Enter a valid 4-character room code.',
                createFailed: 'Unable to create room.',
                joinFailed: 'Unable to join room.',
                roomCode: 'Room code: {code}. Share this code and wait for player 2.',
                joinedRoom: 'Joined room {code}. Race starting...',
                raceLobby: 'Race Lobby',
                keepOpen: 'Keep this screen open. The race will sync automatically.',
                newCode: 'New Code',
                back: 'Back',
                roomLost: 'Room lost: {error}',
                disconnected: 'Disconnected: {error}',
                boostFailed: 'Boost failed.',
                hostOnlyRematch: 'Only host can rematch.',
                win: '{winner} wins! {result} Host can press R for rematch.',
                winShort: '{winner} wins! {result} Press R for rematch.',
                youWin: 'You win.',
                youLose: 'You lose.',
                roomStatus: 'Room {code} | Kart: {name}. Race to {laps} laps.',
                finish: 'FINISH',
                start: 'START',
                player1: 'Player 1',
                player2: 'Player 2',
                hudP1: 'P1',
                hudP2: 'P2',
                aiName: 'AI Racer'
            },
            'zh-CN': {
                raceTitle: '双人竞速',
                raceSubtitle: '在一台设备创建房间码，另一台设备加入',
                deviceRace: '设备联机竞速',
                deviceRaceHelp: '在一台设备创建房间码，然后在另一台设备加入。',
                yourName: '你的名字',
                createCode: '创建房间码',
                playVsAi: '对战 AI',
                enterCode: '输入房间码',
                join: '加入',
                clear: '清除',
                clearedInfo: '已清除旧房间信息。你可以创建新房间或加入其他房间。',
                waitingSetup: '等待房间设置...',
                aiStart: 'AI 竞速开始。先到 {laps} 圈获胜。点击或按空格加速。',
                creatingRoom: '正在创建房间...',
                joiningRoom: '正在加入房间...',
                invalidCode: '请输入有效的 4 位房间码。',
                createFailed: '无法创建房间。',
                joinFailed: '无法加入房间。',
                roomCode: '房间码：{code}。分享给玩家 2 并等待加入。',
                joinedRoom: '已加入房间 {code}。比赛开始...',
                raceLobby: '竞速大厅',
                keepOpen: '请保持此页面开启，比赛会自动同步。',
                newCode: '新房间码',
                back: '返回',
                roomLost: '房间丢失：{error}',
                disconnected: '连接中断：{error}',
                boostFailed: '加速失败。',
                hostOnlyRematch: '仅房主可发起再来一局。',
                win: '{winner} 获胜！{result} 房主可按 R 再来一局。',
                winShort: '{winner} 获胜！{result} 按 R 再来一局。',
                youWin: '你赢了。',
                youLose: '你输了。',
                roomStatus: '房间 {code} | 你的赛车：{name}。目标 {laps} 圈。',
                finish: '终点',
                start: '起点',
                player1: '玩家 1',
                player2: '玩家 2',
                hudP1: '玩家1',
                hudP2: '玩家2',
                aiName: 'AI 选手'
            },
            'ko-KR': {
                raceTitle: '2인 레이스',
                raceSubtitle: '한 기기에서 방 코드를 만들고 다른 기기에서 참가하세요',
                deviceRace: '기기간 레이스',
                deviceRaceHelp: '한 기기에서 방 코드를 만들고, 다른 기기에서 참가하세요.',
                yourName: '이름',
                createCode: '코드 만들기',
                playVsAi: 'AI와 플레이',
                enterCode: '코드 입력',
                join: '참가',
                clear: '지우기',
                clearedInfo: '이전 방 정보를 지웠습니다. 새 코드를 만들거나 다른 방에 참가하세요.',
                waitingSetup: '방 설정 대기 중...',
                aiStart: 'AI 레이스 시작. {laps}랩 선착순 승리. 탭 또는 SPACE로 부스트.',
                creatingRoom: '방 생성 중...',
                joiningRoom: '방 참가 중...',
                invalidCode: '유효한 4자리 방 코드를 입력하세요.',
                createFailed: '방을 만들 수 없습니다.',
                joinFailed: '방에 참가할 수 없습니다.',
                roomCode: '방 코드: {code}. 코드 공유 후 플레이어 2를 기다리세요.',
                joinedRoom: '{code} 방에 참가했습니다. 레이스 시작...',
                raceLobby: '레이스 로비',
                keepOpen: '이 화면을 유지하세요. 레이스가 자동으로 동기화됩니다.',
                newCode: '새 코드',
                back: '뒤로',
                roomLost: '방 연결 끊김: {error}',
                disconnected: '연결 끊김: {error}',
                boostFailed: '부스트 실패.',
                hostOnlyRematch: '호스트만 재경기를 시작할 수 있습니다.',
                win: '{winner} 승리! {result} 호스트는 R로 재경기 가능.',
                winShort: '{winner} 승리! {result} R로 재경기.',
                youWin: '당신이 이겼습니다.',
                youLose: '당신이 졌습니다.',
                roomStatus: '방 {code} | 내 카트: {name}. {laps}랩 레이스.',
                finish: 'FINISH',
                start: 'START',
                player1: '플레이어 1',
                player2: '플레이어 2',
                hudP1: 'P1',
                hudP2: 'P2',
                aiName: 'AI 레이서'
            }
        };

        const lang = this.getLang();
        const value = (dict[lang] && dict[lang][path]) || dict.en[path] || path;
        return Object.keys(vars).reduce((text, key) => text.replace(`{${key}}`, String(vars[key])), value);
    }

    create() {
        this.physics.world.gravity.y = 0;
        this.cameras.main.setBackgroundColor('#d8f3ff');

        this.removeAllRaceOverlays();

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

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.cleanupNetworkTimers();
            this.unmountOverlay();
        });
    }

    removeAllRaceOverlays() {
        const staleOverlays = document.querySelectorAll('#race-online-overlay, [data-race-overlay="true"]');
        staleOverlays.forEach(node => {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
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
        const activeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        for (const origin of RACE_DEPLOYED_ORIGINS) {
            if (origin && origin !== activeOrigin) {
                candidates.push(`${origin}${path}`);
            }
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
            throw new Error(`Cannot reach Race API. Open the live site at ${RACE_DEPLOYED_ORIGINS[0]} or run npm start locally.`);
        }
        throw lastError || new Error('Race API request failed.');
    }

    mountMenuOverlay() {
        this.unmountOverlay();
        this.removeAllRaceOverlays();
        const parent = document.getElementById('game-page');
        if (!parent) return;

        const root = document.createElement('div');
        root.id = 'race-online-overlay';
        root.dataset.raceOverlay = 'true';
        root.style.display = 'flex';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
        root.style.background = 'rgba(7, 24, 45, 0.28)';

        root.innerHTML = `
            <div style="width:min(520px,92vw);background:rgba(255,255,255,0.94);border-radius:20px;padding:20px 22px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;">
                <h2 style="margin:0 0 8px;color:#113c5a;font-size:30px;">${this.getText('deviceRace')}</h2>
                <p style="margin:0 0 14px;color:#1f4d66;">${this.getText('deviceRaceHelp')}</p>

                <div style="display:grid;gap:10px;">
                    <input id="race-name-input" maxlength="20" placeholder="${this.getText('yourName')}" value="${this.getStoredName()}" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:16px;" />
                    <button id="race-create-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#0f766e;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">${this.getText('createCode')}</button>
                    <button id="race-ai-btn" style="padding:12px 14px;border:none;border-radius:10px;background:#7c3aed;color:#fff;font-size:18px;font-weight:700;cursor:pointer;">${this.getText('playVsAi')}</button>
                </div>

                <div style="height:1px;background:#d9e7f0;margin:16px 0;"></div>

                <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
                    <input id="race-code-input" maxlength="4" placeholder="${this.getText('enterCode')}" style="padding:10px 12px;border-radius:10px;border:1px solid #bfd8ea;font-size:18px;text-transform:uppercase;letter-spacing:0.14em;" />
                    <button id="race-join-btn" style="padding:12px 16px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-size:17px;font-weight:700;cursor:pointer;">${this.getText('join')}</button>
                </div>

                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
                    <button id="race-reset-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#e2e8f0;color:#1e293b;font-size:14px;font-weight:700;cursor:pointer;">${this.getText('clear')}</button>
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
                this.setMenuMessage(this.getText('clearedInfo'));
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
            this.statusText.setText(this.getText('waitingSetup'));
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

        if (this.player1.label) this.player1.label.setText(name || this.getText('player1'));
        if (this.player2.label) this.player2.label.setText(this.getText('aiName'));

        this.updateProgressHud();
        this.statusText.setText(this.getText('aiStart', { laps: this.lapsToWin }));
        this.unmountOverlay();
    }

    unmountOverlay() {
        this.removeAllRaceOverlays();
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
            this.setMenuMessage(this.getText('creatingRoom'));
            const data = await this.apiRequest('/api/race/lobbies', {
                method: 'POST',
                body: { hostName: name }
            });

            this.raceCode = data.lobby.code;
            this.playerId = data.playerId;
            this.mySeat = 0;

            this.showLobbyOverlay(this.getText('roomCode', { code: this.raceCode }));
            this.startLobbyPolling();
        } catch (error) {
            this.setMenuMessage(error.message || this.getText('createFailed'));
        }
    }

    async joinRoom(code, name) {
        if (!/^[A-Z0-9]{4}$/.test(code)) {
            this.setMenuMessage(this.getText('invalidCode'));
            return;
        }

        try {
            this.raceMode = 'network';
            this.setMenuMessage(this.getText('joiningRoom'));
            const data = await this.apiRequest(`/api/race/lobbies/${code}/join`, {
                method: 'POST',
                body: { playerName: name }
            });

            this.raceCode = code;
            this.playerId = data.playerId;
            this.mySeat = 1;

            this.showLobbyOverlay(this.getText('joinedRoom', { code: this.raceCode }));
            this.enterRace();
        } catch (error) {
            this.setMenuMessage(error.message || this.getText('joinFailed'));
        }
    }

    showLobbyOverlay(message) {
        if (!this.overlayRoot) return;
        this.overlayRoot.innerHTML = `
            <div style="width:min(560px,92vw);background:rgba(255,255,255,0.95);border-radius:20px;padding:22px 24px;box-shadow:0 20px 45px rgba(0,0,0,0.22);font-family:Nunito,Arial,sans-serif;text-align:center;">
                <h2 style="margin:0 0 10px;color:#113c5a;font-size:30px;">${this.getText('raceLobby')}</h2>
                <p style="margin:0 0 10px;color:#205a77;font-size:18px;">${message}</p>
                <p style="margin:0;color:#37617a;font-size:14px;">${this.getText('keepOpen')}</p>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
                    <button id="race-new-code-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">${this.getText('newCode')}</button>
                    <button id="race-back-btn" style="padding:10px 14px;border:none;border-radius:10px;background:#e2e8f0;color:#1e293b;font-size:14px;font-weight:700;cursor:pointer;">${this.getText('back')}</button>
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
                this.showLobbyOverlay(this.getText('roomLost', { error: error.message }));
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
            this.statusText.setText(this.getText('disconnected', { error: error.message }));
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

        this.placeRacer(this.player1, 0);
        this.placeRacer(this.player2, 1);

        const topName = state.players?.find(player => player.seat === 0)?.name || this.getText('player1');
        const bottomName = state.players?.find(player => player.seat === 1)?.name || this.getText('player2');

        if (this.player1.label) this.player1.label.setText(topName);
        if (this.player2.label) this.player2.label.setText(bottomName);

        this.updateProgressHud();

        if (typeof state.winner === 'number') {
            const winnerName = state.winner === 0 ? topName : bottomName;
            const youWin = this.mySeat === state.winner;
            const result = youWin ? this.getText('youWin') : this.getText('youLose');
            this.statusText.setText(this.getText('win', { winner: winnerName, result }));
            this.raceActive = false;
        } else if (state.status === 'in-progress') {
            const myLabel = this.mySeat === 0 ? topName : bottomName;
            this.statusText.setText(this.getText('roomStatus', { code: this.raceCode, name: myLabel, laps: this.lapsToWin }));
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
            this.statusText.setText(error.message || this.getText('boostFailed'));
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
            this.statusText.setText(error.message || this.getText('hostOnlyRematch'));
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
        const winnerName = winnerSeat === 0 ? (this.player1.label ? this.player1.label.text : this.getText('player1')) : this.getText('aiName');
        const youWin = winnerSeat === 0;
        const result = youWin ? this.getText('youWin') : this.getText('youLose');
        this.statusText.setText(this.getText('winShort', { winner: winnerName, result }));
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

        this.add.text(600, 62, this.getText('raceTitle'), {
            fontSize: '42px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#114b5f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(600, 103, this.getText('raceSubtitle'), {
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
        this.add.text(this.trackCenterX - 5, 132, this.getText('finish'), {
            fontSize: '14px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.trackCenterX - 128, 130, this.getText('start'), {
            fontSize: '14px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#fff7ed',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.player1.label = this.add.text(88, 198, this.getText('player1'), {
            fontSize: '24px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.player2.label = this.add.text(88, 384, this.getText('player2'), {
            fontSize: '24px',
            fontFamily: 'Nunito, Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
    }

    createRaceCar(x, y, color, accentColor, skinTone = 0xf1c27d, shirtColor = 0x2563eb) {
        const racer = this.add.container(x, y);
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Kart body
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(-20, -11, 40, 22, 7);
        graphics.fillStyle(accentColor, 1);
        graphics.fillTriangle(-20, -9, -28, 0, -20, 9);
        graphics.fillRect(15, -13, 6, 26);

        // Wheels
        graphics.fillStyle(0x111827, 1);
        graphics.fillCircle(-12, -12, 5);
        graphics.fillCircle(-12, 12, 5);
        graphics.fillCircle(12, -12, 5);
        graphics.fillCircle(12, 12, 5);
        graphics.fillStyle(0x94a3b8, 1);
        graphics.fillCircle(-12, -12, 2);
        graphics.fillCircle(-12, 12, 2);
        graphics.fillCircle(12, -12, 2);
        graphics.fillCircle(12, 12, 2);

        // Human driver (head, hair, shirt, arms)
        graphics.fillStyle(skinTone, 1);
        graphics.fillCircle(2, -9, 6);
        graphics.fillStyle(0x3f3f46, 1);
        graphics.fillCircle(2, -11, 5);
        graphics.fillStyle(shirtColor, 1);
        graphics.fillRoundedRect(-3, -5, 12, 10, 3);
        graphics.fillStyle(skinTone, 1);
        graphics.fillRoundedRect(-6, -4, 3, 7, 1);
        graphics.fillRoundedRect(9, -4, 3, 7, 1);

        // Steering wheel
        graphics.lineStyle(2, 0x1f2937, 1);
        graphics.strokeCircle(-1, 0, 4);

        racer.add(graphics);

        this.physics.add.existing(racer);
        racer.body.setAllowGravity(false);

        return racer;
    }

    createRacers() {
        this.player1.sprite = this.createRaceCar(
            this.trackCenterX - this.trackOuterRx,
            this.trackCenterY,
            0xffb703,  // Orange body
            0xff6b35,  // Red accent
            0xf1c27d,
            0x1d4ed8
        );
        this.player2.sprite = this.createRaceCar(
            this.trackCenterX - this.trackOuterRx,
            this.trackCenterY + 20,
            0x577590,  // Dark blue body
            0x00d4ff,  // Cyan accent
            0x8d5524,
            0xdc2626
        );

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

        if (scoreEl) scoreEl.innerHTML = '<span id="score-value">0%</span>';
        if (levelEl) levelEl.innerHTML = '<span id="level-value">0%</span>';

        this.statusText = this.add.text(600, 540, this.getText('waitingSetup'), {
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

        if (scoreValue) scoreValue.textContent = `${this.getText('hudP1')} L${p1Lap}/${this.lapsToWin} ${p1Progress}%`;
        if (levelValue) levelValue.textContent = `${this.getText('hudP2')} L${p2Lap}/${this.lapsToWin} ${p2Progress}%`;
    }
}

window.TwoPlayerRaceScene = TwoPlayerRaceScene;
