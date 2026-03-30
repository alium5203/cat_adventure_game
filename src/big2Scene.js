/**
 * big2Scene.js — Multiplayer Big 2 card game (2–4 players, local seats)
 *
 * Rules:
 *  - Standard 52-card deck, no jokers
 *  - Rank order: 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
 *  - Suit order: ♦ < ♣ < ♥ < ♠
 *  - Starting player holds 3♦; they MUST include it in their opening play
 *  - Valid plays: single, pair, triple, 5-card combo (straight, flush, full house, four-of-a-kind+1, straight flush)
 *  - A play must be the same category and beat the current table play
 *  - Pass is allowed unless you are the one who laid the last play (you must play if everyone else passed)
 *  - First player to empty their hand wins
 *  - If a player disconnects / leaves, their seat is locked – cards stay, turn is auto-skipped
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const BIG2 = {
    RANKS: ['3','4','5','6','7','8','9','10','J','Q','K','A','2'],
    SUITS: ['♦','♣','♥','♠'],          // index = suit strength
    SUIT_SYMBOLS: { '♦': '♦', '♣': '♣', '♥': '♥', '♠': '♠' },
    SUIT_COLORS:  { '♦': '#e74c3c', '♣': '#27ae60', '♥': '#e74c3c', '♠': '#2c3e50' },
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2,
};

const BIG2_API_BASE = '/api/big2';
const BIG2_DEPLOYED_ORIGIN = 'https://www.cocoabeans.org';

const BIG2_I18N = {
    en: {
        setupTitle: 'Big 2',
        setupSub: 'Play locally or online with friends!',
        createGame: '➕ Create Game',
        joinGame: '🔗 Join Game',
        rules: '📘 Rules',
        setupHintCreate: 'Create: Be the host, select number of players, share your code.',
        setupHintJoin: 'Join: Enter a friend\'s game code to join their game.',
        rulesTitle: 'Big 2 - Game Rules',
        sectionGameStart: 'Game Start',
        sectionPlayingCards: 'Playing Cards',
        sectionRoundReset: 'Round Reset',
        sectionWinning: 'Winning',
        rules1: 'Each player is dealt an equal number of cards from a 52-card deck.',
        rules2: 'The player with the lowest card, 3♦, goes first.',
        rules3: 'Turns go in clockwise order.',
        rules4: 'On your turn, you can play a single card, a pair, a 3-of-a-kind, or a 5-card combination.',
        rules5: '5-card combinations include straight, flush, full house, four-of-a-kind plus one card, and straight flush.',
        rules6: 'Each play must beat the previous play of the same type.',
        rules7: 'If you cannot play, you may pass.',
        rules8: 'If all other players pass, the last player who played starts a new round.',
        rules9: 'That player can lead with any valid combination.',
        rules10: 'The first player to get rid of all their cards wins the game.',
        back: '← Back',
        createTitle: 'Create Game',
        createSub: 'You\'ll be the host. Select number of players:',
        createConfirm: 'Create ✓',
        creating: 'Creating...',
        playerNamePlaceholder: 'Player {n} name',
        playerDefault: 'Player {n}',
        joinTitle: 'Join Game',
        joinSub: 'Ask your host for their 4-letter game code.',
        yourName: 'Your Name',
        yourNamePlaceholder: 'Your name',
        gameCodeLabel: 'Game Code (e.g., 7A4B)',
        validCodeError: 'Please enter a valid 4-letter code.',
        joinConfirm: 'Join ✓',
        joining: 'Joining...',
        lobbyTitle: 'Game Lobby',
        waitingPlayers: 'Waiting for players...',
        backendOnline: 'Online backend active',
        backendLocal: 'Local-only fallback mode',
        backendRequiredHosted: 'Backend unavailable on this site. Open {url} and try again. Details: {error}',
        lobbyNoticeOnline: 'This lobby is synced through the Big 2 backend.',
        lobbyNoticeLocal: 'Server not reached. This lobby only works on this device/browser.',
        gameCode: 'Game Code',
        playersLabel: 'Players ({current}/{max})',
        hostStartGame: 'Start Host Game 🎮',
        cancel: 'Cancel',
        starting: 'Starting...',
        unableRefreshLobby: 'Unable to refresh lobby.',
        unableStartGame: 'Unable to start game.',
        connectingGame: 'Connecting to game...',
        loadingState: 'Loading state...',
        reconnecting: 'Reconnecting...',
        reconnectingSub: 'Could not resolve your seat yet. Refreshing game state.',
        cardCountSingle: '{count} card',
        cardCountPlural: '{count} cards',
        passBadge: 'PASS',
        tablePlayedBy: '{type} - played by {name}',
        tableClear: 'Table is clear - play to open the round',
        drawPile: 'Draw Pile: {count}',
        yourTurn: 'Your turn',
        waitingFor: 'Waiting for {name}',
        turnOf: '{name}\'s turn',
        play: 'Play',
        pass: 'Pass',
        quitGame: 'Quit Game',
        roomInfo: 'You are {name} - Room {code}',
        gameOver: '🏆 Game Over',
        hostEnded: 'Host ended the game for all players.',
        place: 'Place',
        player: 'Player',
        cardsLeft: 'Cards left',
        backToMenu: '▶ Back to Menu',
        playAgain: '▶ Play Again',
        noSelection: 'Please select card(s) before playing.',
        quitConfirm: 'Quit game for all players? This will end the current match for everyone.',
        gameCodeNotFound: 'Game code not found.',
        gameNoLongerAccepting: 'Game is no longer accepting players.',
        lobbyFull: 'Lobby is full.',
        atLeastTwoToStart: 'At least 2 players are required to start.',
        onlyHostStart: 'Only the host can start the game.',
        needMoreToStart: 'Need {count} more player{suffix} to start.',
        readyToStart: 'All set. You can start the game now.',
        waitingForHost: 'Waiting for host to start the game.',
        needPlayersToStartBtn: 'Need More Players',
        unableLoadState: 'Unable to load game state.',
        unableSubmitPlay: 'Unable to submit play.',
        unablePass: 'Unable to pass.',
        unableQuit: 'Unable to quit game.',
        playerInactive: 'Player is inactive.',
        invalidCardIndex: 'Invalid card index.',
        invalidCombo: 'Not a valid Big 2 combination.',
        firstMust3D: 'First play must include 3♦.',
        notBeatTable: 'This play does not beat the current table.',
        mustPlayOpen: 'You must play to open the round.',
        mustPlayAfterWin: 'You won the last trick - you must play to open the next round.',
        logPlayed: '{name} played: {cards}',
        logPassedDrew: '{name} passed and drew 1 card.',
        logPassed: '{name} passed.',
        logRoundOver: 'Round over. {name} opens next round.',
        logSkipTurn: '{name}\'s turn skipped (player left).',
        logRoundOverInactive: 'Round over (inactive skips). {name} opens.',
        logFinished: '🎉 {name} finishes #{rank}!',
        logGameOver: 'Game over!',
        logPlayerLeft: '⚠️ {name} left the game. Their seat is locked.'
    },
    'zh-CN': {
        setupTitle: '大老二', setupSub: '可本地或在线与朋友一起玩！', createGame: '➕ 创建游戏', joinGame: '🔗 加入游戏', rules: '📘 规则',
        setupHintCreate: '创建：作为房主，选择玩家人数并分享房间码。', setupHintJoin: '加入：输入好友的房间码加入游戏。',
        rulesTitle: '大老二 - 游戏规则', sectionGameStart: '游戏开始', sectionPlayingCards: '出牌规则', sectionRoundReset: '回合重置', sectionWinning: '获胜条件',
        rules1: '每位玩家从52张牌中获得相同数量的手牌。', rules2: '持有最小牌3♦的玩家先出。', rules3: '按顺时针轮流出牌。',
        rules4: '你的回合可出单张、对子、三条或五张组合。', rules5: '五张组合包括顺子、同花、葫芦、四条带一和同花顺。',
        rules6: '每次出牌都必须压过同类型上一手。', rules7: '无法出牌时可以选择过牌。', rules8: '若其他玩家都过牌，上一手出牌者开启新一轮。',
        rules9: '该玩家可任意先手合法组合。', rules10: '最先出完手牌的玩家获胜。', back: '← 返回',
        createTitle: '创建游戏', createSub: '你将成为房主。请选择玩家人数：', createConfirm: '创建 ✓', creating: '创建中...',
        playerNamePlaceholder: '玩家{n}名字', playerDefault: '玩家{n}', joinTitle: '加入游戏', joinSub: '向房主获取4位房间码。',
        yourName: '你的名字', yourNamePlaceholder: '你的名字', gameCodeLabel: '房间码（例如：7A4B）', validCodeError: '请输入有效的4位房间码。',
        joinConfirm: '加入 ✓', joining: '加入中...', lobbyTitle: '游戏大厅', waitingPlayers: '等待玩家中...', backendOnline: '在线后端已连接',
        backendLocal: '仅本地兼容模式', backendRequiredHosted: '当前站点后端不可用。请打开 {url} 后重试。详情：{error}', lobbyNoticeOnline: '此房间通过大老二后端实时同步。', lobbyNoticeLocal: '未连接到服务器。此房间仅在本设备浏览器可用。',
        gameCode: '房间码', playersLabel: '玩家（{current}/{max}）', hostStartGame: '房主开始游戏 🎮', cancel: '取消', starting: '启动中...',
        unableRefreshLobby: '无法刷新大厅。', unableStartGame: '无法开始游戏。', connectingGame: '正在连接游戏...', loadingState: '正在加载状态...',
        reconnecting: '重新连接中...', reconnectingSub: '暂时无法识别你的座位，正在刷新游戏状态。', cardCountSingle: '{count} 张牌', cardCountPlural: '{count} 张牌',
        passBadge: '过牌', tablePlayedBy: '{type} - 出牌者：{name}', tableClear: '牌面已清空 - 请先手开新轮', drawPile: '牌堆：{count}',
        yourTurn: '轮到你', waitingFor: '等待 {name}', turnOf: '{name} 的回合', play: '出牌', pass: '过牌', quitGame: '结束游戏',
        roomInfo: '你是 {name} - 房间 {code}', gameOver: '🏆 游戏结束', hostEnded: '房主已为所有玩家结束本局。',
        place: '名次', player: '玩家', cardsLeft: '剩余手牌', backToMenu: '▶ 返回菜单', playAgain: '▶ 再来一局',
        noSelection: '请先选择要出的牌。', quitConfirm: '要为所有玩家结束游戏吗？这会结束当前整局比赛。',
        gameCodeNotFound: '未找到房间码。', gameNoLongerAccepting: '该房间已不再接受加入。', lobbyFull: '房间已满。', atLeastTwoToStart: '至少需要 2 名玩家才能开始。', onlyHostStart: '只有房主可以开始游戏。',
        needMoreToStart: '还需要 {count} 名玩家才能开始。', readyToStart: '人数已满足，你现在可以开始游戏。', waitingForHost: '等待房主开始游戏。', needPlayersToStartBtn: '人数不足',
        unableLoadState: '无法加载游戏状态。', unableSubmitPlay: '无法提交出牌。', unablePass: '无法过牌。', unableQuit: '无法结束游戏。',
        playerInactive: '该玩家已离开。', invalidCardIndex: '无效的牌索引。', invalidCombo: '不是有效的大老二组合。', firstMust3D: '首手必须包含3♦。',
        notBeatTable: '该出牌无法压过当前牌面。', mustPlayOpen: '你必须出牌来开启本轮。', mustPlayAfterWin: '你是上一墩赢家，必须先手开启下一轮。',
        logPlayed: '{name} 出牌：{cards}', logPassedDrew: '{name} 过牌并摸了1张牌。', logPassed: '{name} 过牌。',
        logRoundOver: '本轮结束。{name} 开启下一轮。', logSkipTurn: '{name} 的回合被跳过（玩家已离开）。', logRoundOverInactive: '本轮结束（含离线跳过）。{name} 开启新轮。',
        logFinished: '🎉 {name} 获得第{rank}名！', logGameOver: '游戏结束！', logPlayerLeft: '⚠️ {name} 离开了游戏，其座位已锁定。'
    },
    'ko-KR': {
        setupTitle: '빅투', setupSub: '로컬 또는 온라인으로 친구들과 플레이하세요!', createGame: '➕ 게임 만들기', joinGame: '🔗 게임 참가', rules: '📘 규칙',
        setupHintCreate: '만들기: 호스트가 되어 인원 수를 고르고 코드를 공유하세요.', setupHintJoin: '참가: 친구의 게임 코드를 입력해 참가하세요.',
        rulesTitle: '빅투 - 게임 규칙', sectionGameStart: '게임 시작', sectionPlayingCards: '카드 내기', sectionRoundReset: '라운드 리셋', sectionWinning: '승리',
        rules1: '각 플레이어는 52장 덱에서 같은 수의 카드를 받습니다.', rules2: '가장 낮은 카드 3♦를 가진 플레이어가 먼저 시작합니다.', rules3: '턴은 시계 방향으로 진행됩니다.',
        rules4: '자신의 턴에 싱글, 페어, 트리플, 또는 5장 조합을 낼 수 있습니다.', rules5: '5장 조합은 스트레이트, 플러시, 풀하우스, 포카드+1장, 스트레이트 플러시입니다.',
        rules6: '같은 유형의 이전 패보다 강해야 합니다.', rules7: '낼 수 없으면 패스할 수 있습니다.', rules8: '다른 플레이어가 모두 패스하면 마지막으로 낸 플레이어가 새 라운드를 시작합니다.',
        rules9: '그 플레이어는 어떤 유효한 조합이든 선공할 수 있습니다.', rules10: '손패를 모두 비우는 첫 번째 플레이어가 승리합니다.', back: '← 뒤로',
        createTitle: '게임 만들기', createSub: '당신이 호스트입니다. 플레이어 수를 선택하세요:', createConfirm: '만들기 ✓', creating: '생성 중...',
        playerNamePlaceholder: '플레이어 {n} 이름', playerDefault: '플레이어 {n}', joinTitle: '게임 참가', joinSub: '호스트에게 4자리 게임 코드를 받으세요.',
        yourName: '내 이름', yourNamePlaceholder: '이름 입력', gameCodeLabel: '게임 코드 (예: 7A4B)', validCodeError: '유효한 4자리 코드를 입력하세요.',
        joinConfirm: '참가 ✓', joining: '참가 중...', lobbyTitle: '게임 로비', waitingPlayers: '플레이어 대기 중...', backendOnline: '온라인 백엔드 연결됨',
        backendLocal: '로컬 전용 대체 모드', backendRequiredHosted: '이 사이트에서는 백엔드를 사용할 수 없습니다. {url}을(를) 열어 다시 시도하세요. 상세: {error}', lobbyNoticeOnline: '이 로비는 빅투 백엔드와 동기화됩니다.', lobbyNoticeLocal: '서버에 연결되지 않았습니다. 이 로비는 현재 기기/브라우저에서만 작동합니다.',
        gameCode: '게임 코드', playersLabel: '플레이어 ({current}/{max})', hostStartGame: '호스트 게임 시작 🎮', cancel: '취소', starting: '시작 중...',
        unableRefreshLobby: '로비를 새로고침할 수 없습니다.', unableStartGame: '게임을 시작할 수 없습니다.', connectingGame: '게임에 연결 중...', loadingState: '상태를 불러오는 중...',
        reconnecting: '재연결 중...', reconnectingSub: '내 좌석을 아직 확인하지 못했습니다. 게임 상태를 새로고침합니다.', cardCountSingle: '{count}장', cardCountPlural: '{count}장',
        passBadge: '패스', tablePlayedBy: '{type} - {name} 플레이', tableClear: '테이블이 비었습니다 - 새 라운드를 시작하세요', drawPile: '드로우 더미: {count}',
        yourTurn: '당신의 턴', waitingFor: '{name} 대기 중', turnOf: '{name}의 턴', play: '내기', pass: '패스', quitGame: '게임 종료',
        roomInfo: '당신은 {name} - 방 {code}', gameOver: '🏆 게임 종료', hostEnded: '호스트가 모든 플레이어의 게임을 종료했습니다.',
        place: '순위', player: '플레이어', cardsLeft: '남은 카드', backToMenu: '▶ 메뉴로', playAgain: '▶ 다시 플레이',
        noSelection: '먼저 낼 카드를 선택하세요.', quitConfirm: '모든 플레이어의 게임을 종료할까요? 현재 매치가 종료됩니다.',
        gameCodeNotFound: '게임 코드를 찾을 수 없습니다.', gameNoLongerAccepting: '더 이상 플레이어를 받을 수 없습니다.', lobbyFull: '로비가 가득 찼습니다.', atLeastTwoToStart: '시작하려면 최소 2명의 플레이어가 필요합니다.', onlyHostStart: '호스트만 게임을 시작할 수 있습니다.',
        needMoreToStart: '시작하려면 플레이어 {count}명 더 필요합니다.', readyToStart: '준비 완료. 지금 게임을 시작할 수 있습니다.', waitingForHost: '호스트가 게임을 시작할 때까지 대기 중입니다.', needPlayersToStartBtn: '플레이어 부족',
        unableLoadState: '게임 상태를 불러올 수 없습니다.', unableSubmitPlay: '카드 제출에 실패했습니다.', unablePass: '패스할 수 없습니다.', unableQuit: '게임을 종료할 수 없습니다.',
        playerInactive: '플레이어가 비활성 상태입니다.', invalidCardIndex: '잘못된 카드 인덱스입니다.', invalidCombo: '유효한 빅투 조합이 아닙니다.', firstMust3D: '첫 패에는 3♦가 포함되어야 합니다.',
        notBeatTable: '현재 테이블 패를 이기지 못했습니다.', mustPlayOpen: '라운드를 시작하려면 카드를 내야 합니다.', mustPlayAfterWin: '마지막 트릭 승자이므로 다음 라운드를 열어야 합니다.',
        logPlayed: '{name} 플레이: {cards}', logPassedDrew: '{name} 패스 후 카드 1장을 뽑았습니다.', logPassed: '{name} 패스.',
        logRoundOver: '라운드 종료. {name}가 다음 라운드를 시작합니다.', logSkipTurn: '{name}의 턴이 건너뛰어졌습니다 (플레이어 이탈).', logRoundOverInactive: '라운드 종료(비활성 스킵). {name}가 시작합니다.',
        logFinished: '🎉 {name} #{rank}등으로 종료!', logGameOver: '게임 오버!', logPlayerLeft: '⚠️ {name}님이 게임을 떠났고 좌석이 잠겼습니다.'
    }
};

function big2Lang() {
    if (typeof window === 'undefined' || !window.localStorage) return 'en';
    return window.localStorage.getItem('selectedLanguage') || 'en';
}

function big2TextPack() {
    return BIG2_I18N[big2Lang()] || BIG2_I18N.en;
}

function b2fmt(template, params = {}) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (params[key] ?? ''));
}

function b2t(key, params = {}) {
    const pack = big2TextPack();
    const fallback = BIG2_I18N.en;
    const value = pack[key] ?? fallback[key] ?? key;
    return b2fmt(value, params);
}

function b2TranslateError(msg) {
    const map = {
        'Game code not found.': 'gameCodeNotFound',
        'Game is no longer accepting players.': 'gameNoLongerAccepting',
        'Lobby is full.': 'lobbyFull',
        'At least 2 players are required to start.': 'atLeastTwoToStart',
        'Only the host can start the game.': 'onlyHostStart',
        'Unable to load game state.': 'unableLoadState',
        'Unable to submit play.': 'unableSubmitPlay',
        'Unable to pass.': 'unablePass',
        'Unable to quit game.': 'unableQuit',
        'Player is inactive.': 'playerInactive',
        'Invalid card index.': 'invalidCardIndex',
        'Not a valid Big 2 combination.': 'invalidCombo',
        'First play must include 3♦.': 'firstMust3D',
        'This play does not beat the current table.': 'notBeatTable',
        'You must play to open the round.': 'mustPlayOpen',
        'You won the last trick - you must play to open the next round.': 'mustPlayAfterWin',
        'You won the last trick — you must play to open the next round.': 'mustPlayAfterWin'
    };
    const key = map[msg];
    return key ? b2t(key) : msg;
}

// ─── Game Code & Registry ────────────────────────────────────────────────────────

/** Generate a random 4-character game code (e.g., "7A4B") */
function generateGameCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

const BIG2_LOBBY_STORAGE_KEY = 'big2-lobby-registry-v1';
const BIG2_LOBBY_TTL_MS = 12 * 60 * 60 * 1000;

function loadGameRegistry() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(BIG2_LOBBY_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function syncGameRegistryFromStorage() {
    const latest = loadGameRegistry();

    Object.keys(gameRegistry).forEach(code => {
        if (!latest[code]) {
            delete gameRegistry[code];
        }
    });

    Object.entries(latest).forEach(([code, lobby]) => {
        gameRegistry[code] = lobby;
    });
}

function saveGameRegistry() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        window.localStorage.setItem(BIG2_LOBBY_STORAGE_KEY, JSON.stringify(gameRegistry));
    } catch {
        // Ignore storage failures and fall back to in-memory behavior.
    }
}

function cleanupExpiredLobbies() {
    syncGameRegistryFromStorage();
    const now = Date.now();
    let changed = false;

    Object.keys(gameRegistry).forEach(code => {
        const lobby = gameRegistry[code];
        if (!lobby || !lobby.createdAt || now - lobby.createdAt > BIG2_LOBBY_TTL_MS) {
            delete gameRegistry[code];
            changed = true;
        }
    });

    if (changed) {
        saveGameRegistry();
    }
}

function getLobbyByCode(code) {
    syncGameRegistryFromStorage();
    cleanupExpiredLobbies();
    return gameRegistry[code] || null;
}

/** Global registry of active games indexed by code */
const gameRegistry = loadGameRegistry();
cleanupExpiredLobbies();

/** 
 * Create a new game lobby with a unique code.
 * @param {string} hostName
 * @param {number} numPlayers
 * @returns {{ code: string, hostName: string, numPlayers: number, players: {playerId, name}[] }}
 */
function createGameLobby(hostName, numPlayers) {
    syncGameRegistryFromStorage();
    let code;
    do {
        code = generateGameCode();
    } while (gameRegistry[code]);

    const lobby = {
        code,
        hostName,
        numPlayers,
        createdAt: Date.now(),
        players: [{ id: generatePlayerId(), name: hostName, isHost: true }],
        status: 'waiting' // 'waiting' | 'in-progress' | 'finished'
    };

    gameRegistry[code] = lobby;
    saveGameRegistry();
    return lobby;
}

/**
 * Join an existing game lobby.
 * @param {string} code
 * @param {string} playerName
 * @returns {{ ok: boolean, error?: string, lobby?: object }}
 */
function joinGameLobby(code, playerName) {
    const normalizedCode = (code || '').toUpperCase().trim();
    const lobby = getLobbyByCode(normalizedCode);
    if (!lobby) return { ok: false, error: b2t('gameCodeNotFound') };
    if (lobby.status !== 'waiting') return { ok: false, error: b2t('gameNoLongerAccepting') };
    if (lobby.players.length >= lobby.numPlayers) return { ok: false, error: b2t('lobbyFull') };

    const newPlayer = { id: generatePlayerId(), name: playerName, isHost: false };
    lobby.players.push(newPlayer);
    saveGameRegistry();
    return { ok: true, lobby };
}

/** Generate a unique player ID */
function generatePlayerId() {
    return 'p-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}

async function big2ApiRequest(path, options = {}) {
    if (typeof fetch !== 'function') {
        throw new Error('Fetch is not available in this browser.');
    }

    const response = await fetch(`${BIG2_API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
    }

    return data;
}

function canUseLocalFallback() {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
}

function hostedBackendError(error) {
    return b2t('backendRequiredHosted', {
        url: BIG2_DEPLOYED_ORIGIN,
        error: b2TranslateError(error?.message || '')
    });
}

async function createGameLobbySession(hostName, numPlayers) {
    try {
        const data = await big2ApiRequest('/lobbies', {
            method: 'POST',
            body: { hostName, numPlayers }
        });
        return { ok: true, lobby: data.lobby, playerId: data.playerId, backend: true };
    } catch (error) {
        if (!canUseLocalFallback()) {
            return { ok: false, error: hostedBackendError(error) };
        }
        const lobby = createGameLobby(hostName, numPlayers);
        return {
            ok: true,
            lobby,
            playerId: lobby.players[0]?.id || null,
            backend: false,
            notice: `Backend unavailable. Using local-only lobby mode. ${b2TranslateError(error.message)}`
        };
    }
}

async function joinGameLobbySession(code, playerName) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/join`, {
            method: 'POST',
            body: { playerName }
        });
        return { ok: true, lobby: data.lobby, playerId: data.playerId, backend: true };
    } catch (error) {
        if (!canUseLocalFallback()) {
            return { ok: false, error: hostedBackendError(error) };
        }
        const result = joinGameLobby(code, playerName);
        if (!result.ok) {
            return result;
        }
        const playerId = result.lobby.players[result.lobby.players.length - 1]?.id || null;
        return {
            ok: true,
            lobby: result.lobby,
            playerId,
            backend: false,
            notice: `Backend unavailable. Using local-only lobby mode. ${b2TranslateError(error.message)}`
        };
    }
}

async function getGameLobbySession(code) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}`);
        return { ok: true, lobby: data.lobby, backend: true };
    } catch (error) {
        if (!canUseLocalFallback()) {
            return { ok: false, error: hostedBackendError(error) };
        }
        const lobby = getLobbyByCode((code || '').toUpperCase().trim());
        if (!lobby) {
            return { ok: false, error: b2t('gameCodeNotFound') };
        }
        return {
            ok: true,
            lobby,
            backend: false,
            notice: `Backend unavailable. Using local-only lobby mode. ${b2TranslateError(error.message)}`
        };
    }
}

async function startGameLobbySession(code, playerId) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/start`, {
            method: 'POST',
            body: { playerId }
        });
        return { ok: true, lobby: data.lobby, backend: true };
    } catch (error) {
        if (!canUseLocalFallback()) {
            return { ok: false, error: hostedBackendError(error) };
        }
        const lobby = getLobbyByCode((code || '').toUpperCase().trim());
        if (!lobby) {
            return { ok: false, error: b2t('gameCodeNotFound') };
        }
        const player = lobby.players.find(entry => entry.id === playerId);
        if (!player || !player.isHost) {
            return { ok: false, error: b2t('onlyHostStart') };
        }
        lobby.status = 'in-progress';
        saveGameRegistry();
        return {
            ok: true,
            lobby,
            backend: false,
            notice: `Backend unavailable. Using local-only lobby mode. ${b2TranslateError(error.message)}`
        };
    }
}

async function getOnlineGameStateSession(code, playerId) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/state?playerId=${encodeURIComponent(playerId || '')}`);
        return { ok: true, state: data.state, lobby: data.lobby };
    } catch (error) {
        return { ok: false, error: b2TranslateError(error.message || b2t('unableLoadState')) };
    }
}

async function playOnlineTurnSession(code, playerId, cardLabels) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/play`, {
            method: 'POST',
            body: { playerId, cardLabels }
        });
        return { ok: true, state: data.state, lobby: data.lobby };
    } catch (error) {
        return { ok: false, error: b2TranslateError(error.message || b2t('unableSubmitPlay')) };
    }
}

async function passOnlineTurnSession(code, playerId) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/pass`, {
            method: 'POST',
            body: { playerId }
        });
        return { ok: true, state: data.state, lobby: data.lobby };
    } catch (error) {
        return { ok: false, error: b2TranslateError(error.message || b2t('unablePass')) };
    }
}

async function quitOnlineGameSession(code, playerId) {
    try {
        const data = await big2ApiRequest(`/lobbies/${code}/quit`, {
            method: 'POST',
            body: { playerId }
        });
        return { ok: true, state: data.state, lobby: data.lobby };
    } catch (error) {
        return { ok: false, error: b2TranslateError(error.message || b2t('unableQuit')) };
    }
}
// ─── Card Model ───────────────────────────────────────────────────────────────

class Card {
    constructor(rank, suit) {
        this.rank  = rank;                               // '3' … '2'
        this.suit  = suit;                               // '♦' '♣' '♥' '♠'
        this.rankIdx = BIG2.RANKS.indexOf(rank);         // 0–12
        this.suitIdx = BIG2.SUITS.indexOf(suit);         // 0–3
    }

    /** Combined strength: higher = stronger */
    get strength() { return this.rankIdx * 4 + this.suitIdx; }

    get label() { return this.rank + this.suit; }

    /** True when this is the 3 of diamonds (starting card) */
    get isThreeDiamonds() { return this.rank === '3' && this.suit === '♦'; }
}

// ─── Deck ─────────────────────────────────────────────────────────────────────

function buildDeck() {
    const deck = [];
    for (const rank of BIG2.RANKS) {
        for (const suit of BIG2.SUITS) {
            deck.push(new Card(rank, suit));
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    // Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ─── Hand Sorting ─────────────────────────────────────────────────────────────

function sortHand(cards) {
    return [...cards].sort((a, b) => a.strength - b.strength);
}

// ─── Play Validation ──────────────────────────────────────────────────────────

/**
 * Classify a set of selected cards into { type, key } or null if invalid.
 *
 * Types:
 *  'single'      – 1 card;   key = card.strength
 *  'pair'        – 2 cards same rank; key = max strength
 *  'triple'      – 3 cards same rank; key = max strength
 *  'straight'    – 5 consecutive ranks; key = max card strength
 *  'flush'       – 5 same suit; key = max strength
 *  'fullhouse'   – 3+2; key = triple rank index * 100
 *  'fourkind'    – 4+1; key = quad rank index * 100
 *  'straightflush' – 5 consecutive same suit; key = max strength
 */
function classifyPlay(cards) {
    const n = cards.length;
    if (n === 0 || n === 4 || n > 5) return null;

    const sorted = sortHand(cards);

    if (n === 1) return { type: 'single', key: sorted[0].strength };

    if (n === 2) {
        if (sorted[0].rank === sorted[1].rank)
            return { type: 'pair', key: Math.max(...sorted.map(c => c.strength)) };
        return null;
    }

    if (n === 3) {
        if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank)
            return { type: 'triple', key: Math.max(...sorted.map(c => c.strength)) };
        return null;
    }

    // --- 5-card combos ---
    const rankIdxs = sorted.map(c => c.rankIdx);
    const suitIdxs = sorted.map(c => c.suitIdx);
    const maxStrength = Math.max(...sorted.map(c => c.strength));

    const isFlush    = suitIdxs.every(s => s === suitIdxs[0]);
    const isStraight = (function() {
        // All consecutive ranks (wrap-around not allowed in Big 2)
        for (let i = 1; i < rankIdxs.length; i++) {
            if (rankIdxs[i] !== rankIdxs[i-1] + 1) return false;
        }
        return true;
    })();

    if (isFlush && isStraight) return { type: 'straightflush', key: maxStrength };
    if (isStraight)            return { type: 'straight',      key: maxStrength };
    if (isFlush)               return { type: 'flush',          key: maxStrength };

    // Count rank frequencies
    const freq = {};
    rankIdxs.forEach(r => { freq[r] = (freq[r] || 0) + 1; });
    const counts = Object.values(freq).sort((a,b) => b - a); // e.g. [4,1] or [3,2]

    if (counts[0] === 4) {
        const quadRank = parseInt(Object.keys(freq).find(k => freq[k] === 4));
        return { type: 'fourkind', key: quadRank * 100 };
    }
    if (counts[0] === 3 && counts[1] === 2) {
        const tripleRank = parseInt(Object.keys(freq).find(k => freq[k] === 3));
        return { type: 'fullhouse', key: tripleRank * 100 };
    }

    return null;
}

/** Five-card type rank: higher category beats lower */
const FIVE_CARD_RANK = {
    straight: 1, flush: 2, fullhouse: 3, fourkind: 4, straightflush: 5
};

/**
 * Returns true when `play` beats `table`.
 * `play` and `table` are { type, key } objects from classifyPlay().
 * Pass null for `table` to indicate an open table (any valid play is accepted).
 */
function beats(play, table) {
    if (!play) return false;
    if (!table) return true;          // open/new round

    if (play.type !== table.type) {
        // 5-card hands can replace each other by rank
        const isFive = t => t in FIVE_CARD_RANK;
        if (isFive(play.type) && isFive(table.type)) {
            return FIVE_CARD_RANK[play.type] > FIVE_CARD_RANK[table.type];
        }
        return false;               // different non-five types never beat each other
    }

    return play.key > table.key;
}

// ─── Game State ───────────────────────────────────────────────────────────────

class Big2Game {
    /**
     * @param {number} numPlayers 2–4
     * @param {string[]} names    player display names
     */
    constructor(numPlayers, names) {
        numPlayers = Math.max(BIG2.MIN_PLAYERS, Math.min(BIG2.MAX_PLAYERS, numPlayers));
        this.numPlayers = numPlayers;

        this.players = Array.from({ length: numPlayers }, (_, i) => ({
            id:          i,
            name:        names[i] || `Player ${i + 1}`,
            hand:        [],   // Card[]
            active:      true, // false = left the game (seat locked, turn skipped)
            passed:      false,
            finished:    false,
            finishRank:  null,
        }));

        this.table       = null;   // last play: { cards, classified } | null
        this.tableOwner  = null;   // player index who owns the current table
        this.currentTurn = -1;
        this.started     = false;
        this.gameOver    = false;
        this.finishOrder = [];     // player indices in finish order
        this.passCount   = 0;      // consecutive passes since last play
        this.log         = [];     // string[]
        this.passWaitsForOriginalPlayer = false; // everyone passed back to owner
        this.drawPile    = [];     // face-down pile from undealt cards

        this._deal();
        this._findFirstTurn();
        this.started = true;
    }

    _deal() {
        const deck = shuffleDeck(buildDeck());
        const initialHandSize = 13;
        let deckIndex = 0;

        for (let round = 0; round < initialHandSize; round++) {
            for (let playerIdx = 0; playerIdx < this.numPlayers; playerIdx++) {
                if (deckIndex < deck.length) {
                    this.players[playerIdx].hand.push(deck[deckIndex++]);
                }
            }
        }

        this.drawPile = deck.slice(deckIndex);

        // Ensure opening card (3♦) is in a player's hand, not the draw pile.
        if (!this.players.some(p => p.hand.some(c => c.isThreeDiamonds))) {
            const drawIdx = this.drawPile.findIndex(c => c.isThreeDiamonds);
            if (drawIdx >= 0) {
                const swapOut = this.players[0].hand.pop();
                const threeDiamond = this.drawPile.splice(drawIdx, 1)[0];
                this.players[0].hand.push(threeDiamond);
                if (swapOut) this.drawPile.push(swapOut);
            }
        }

        // Sort each hand
        this.players.forEach(p => { p.hand = sortHand(p.hand); });
    }

    _findFirstTurn() {
        // Player holding 3♦ goes first
        for (let i = 0; i < this.numPlayers; i++) {
            if (this.players[i].hand.some(c => c.isThreeDiamonds)) {
                this.currentTurn = i;
                return;
            }
        }
        this.currentTurn = 0;
    }

    get currentPlayer() { return this.players[this.currentTurn]; }

    /**
     * Attempt a play from currentPlayer.
     * @param {number[]} cardIndices  indices into player's hand
     * @returns {{ ok: boolean, error?: string }}
     */
    play(cardIndices) {
        const player = this.currentPlayer;
        if (!player.active) return { ok: false, error: b2t('playerInactive') };

        const selected = cardIndices.map(i => player.hand[i]);
        if (selected.some(c => !c)) return { ok: false, error: b2t('invalidCardIndex') };

        const classified = classifyPlay(selected);
        if (!classified) return { ok: false, error: b2t('invalidCombo') };

        // First play of the game must contain 3♦
        if (!this.table && this.tableOwner === null) {
            if (!selected.some(c => c.isThreeDiamonds)) {
                return { ok: false, error: b2t('firstMust3D') };
            }
        }

        if (!beats(classified, this.table?.classified ?? null)) {
            return { ok: false, error: b2t('notBeatTable') };
        }

        // Remove played cards from hand
        const remaining = player.hand.filter((_, i) => !cardIndices.includes(i));
        player.hand = remaining;

        this.table = { cards: selected, classified };
        this.tableOwner = player.id;
        this.passCount = 0;
        player.passed = false;

        this._log(b2t('logPlayed', { name: player.name, cards: selected.map(c => c.label).join(' ') }));

        if (player.hand.length === 0) {
            this._playerFinished(player);
            if (this.gameOver) return { ok: true };
        }

        // Reset pass flags for everyone after a real play
        this.players.forEach(p => { p.passed = false; });

        this._advanceTurn();
        return { ok: true };
    }

    /**
     * Current player passes.
     * @returns {{ ok: boolean, error?: string }}
     */
    pass() {
        const player = this.currentPlayer;
        if (!player.active) return this._skipInactive();

        // Cannot pass if you are the table owner and everyone else has passed
        // (or if the table is null — you must play to open)
        if (this.table === null) {
            return { ok: false, error: b2t('mustPlayOpen') };
        }
        if (this.tableOwner === player.id) {
            return { ok: false, error: b2t('mustPlayAfterWin') };
        }

        player.passed = true;
        this.passCount++;

        if (this.drawPile.length > 0) {
            const drawn = this.drawPile.shift();
            player.hand.push(drawn);
            player.hand = sortHand(player.hand);
            this._log(b2t('logPassedDrew', { name: player.name }));
        } else {
            this._log(b2t('logPassed', { name: player.name }));
        }

        // Check if everyone else has passed back to the table owner
        const activePlayers = this.players.filter(p => p.active && !p.finished);
        const otherActive = activePlayers.filter(p => p.id !== this.tableOwner);

        if (this.passCount >= otherActive.length) {
            // Round complete — table owner opens next round
            this._log(b2t('logRoundOver', { name: this.players[this.tableOwner]?.name ?? '' }));
            this.table = null;
            this.passCount = 0;
            this.players.forEach(p => { p.passed = false; });
            this.currentTurn = this.tableOwner;
            return { ok: true };
        }

        this._advanceTurn();
        return { ok: true };
    }

    /** Force-skip an inactive player's turn. */
    _skipInactive() {
        this._log(b2t('logSkipTurn', { name: this.currentPlayer.name }));
        this.passCount++;

        const activePlayers = this.players.filter(p => p.active && !p.finished);
        const otherActive = activePlayers.filter(p => p.id !== this.tableOwner);

        if (this.table !== null && this.passCount >= otherActive.length) {
            this._log(b2t('logRoundOverInactive', { name: this.players[this.tableOwner]?.name ?? '' }));
            this.table = null;
            this.passCount = 0;
            this.players.forEach(p => { p.passed = false; });
            this.currentTurn = this.tableOwner;
            return { ok: true };
        }

        this._advanceTurn();
        return { ok: true };
    }

    _playerFinished(player) {
        player.finished = true;
        player.finishRank = this.finishOrder.length + 1;
        this.finishOrder.push(player.id);
        this._log(b2t('logFinished', { name: player.name, rank: player.finishRank }));

        const remainingActive = this.players.filter(p => !p.finished && p.active);
        if (remainingActive.length <= 1) {
            // Auto-finish remaining players
            this.players.forEach(p => {
                if (!p.finished) {
                    p.finished = true;
                    p.finishRank = this.finishOrder.length + 1;
                    this.finishOrder.push(p.id);
                }
            });
            this.gameOver = true;
            this._log(b2t('logGameOver'));
        }
    }

    /**
     * Mark a player as having left. Their seat is locked and turns are auto-skipped.
     * Cards are NOT redistributed.
     */
    playerLeft(playerIdx) {
        const p = this.players[playerIdx];
        if (!p || !p.active) return;
        p.active = false;
        this._log(b2t('logPlayerLeft', { name: p.name }));

        const remaining = this.players.filter(pl => pl.active && !pl.finished);
        if (remaining.length === 0) {
            this.gameOver = true;
            return;
        }
        if (remaining.length === 1) {
            this._playerFinished(remaining[0]);
            return;
        }

        // If it was their turn, advance
        if (this.currentTurn === playerIdx) {
            // If they owned the table, re-assign to next active player
            if (this.tableOwner === playerIdx) {
                const next = this._nextActiveTurn(playerIdx);
                this.tableOwner = next;
                this.table = null;
                this.passCount = 0;
            }
            this._advanceTurn();
        }
    }

    _advanceTurn() {
        let next = (this.currentTurn + 1) % this.numPlayers;
        let attempts = 0;
        while ((this.players[next].finished || !this.players[next].active) && attempts < this.numPlayers) {
            next = (next + 1) % this.numPlayers;
            attempts++;
        }
        this.currentTurn = next;

        // Auto-skip if the next player is also inactive
        if (!this.players[next].active) {
            this._skipInactive();
        }
    }

    _nextActiveTurn(fromIdx) {
        let next = (fromIdx + 1) % this.numPlayers;
        let attempts = 0;
        while ((this.players[next].finished || !this.players[next].active) && attempts < this.numPlayers) {
            next = (next + 1) % this.numPlayers;
            attempts++;
        }
        return next;
    }

    _log(msg) { this.log.push(msg); }

    /** Serialisable snapshot for the UI */
    snapshot() {
        return {
            players: this.players.map(p => ({
                id: p.id, name: p.name,
                cardCount: p.hand.length,
                hand: p.hand.map(c => ({ rank: c.rank, suit: c.suit, strength: c.strength })),
                active: p.active, finished: p.finished, finishRank: p.finishRank, passed: p.passed,
            })),
            table: this.table ? {
                cards: this.table.cards.map(c => ({ rank: c.rank, suit: c.suit })),
                type: this.table.classified.type,
            } : null,
            tableOwner: this.tableOwner,
            currentTurn: this.currentTurn,
            gameOver: this.gameOver,
            finishOrder: this.finishOrder,
            log: this.log.slice(-6),
            drawPileCount: this.drawPile.length,
        };
    }
}

// ─── UI Controller ────────────────────────────────────────────────────────────

class Big2UI {
    constructor(containerId) {
        this.containerId = containerId;
        this.game = null;
        this.selectedIndices = new Set(); // selected card indices of current player
        this.localSeat = 0;               // which seat is "local" (rotating per turn for local-pass-and-play)
        this.setupScreen = true;
        this.lobbyPollTimer = null;
        this.currentLobbyCode = null;
        this.currentPlayerId = null;
        this.currentLobbyIsHost = false;
        this.currentLobbyNotice = '';
        this.currentLobbyBackend = false;
        this.networkMode = false;
        this.networkState = null;
        this.networkPollTimer = null;
        this.networkError = '';
        this.lastNetworkHandSignature = '';
    }

    _clearLobbyPolling() {
        if (this.lobbyPollTimer) {
            clearInterval(this.lobbyPollTimer);
            this.lobbyPollTimer = null;
        }
    }

    _clearNetworkPolling() {
        if (this.networkPollTimer) {
            clearInterval(this.networkPollTimer);
            this.networkPollTimer = null;
        }
    }

    _resetLobbyState() {
        this._clearLobbyPolling();
        this._clearNetworkPolling();
        this.currentLobbyCode = null;
        this.currentPlayerId = null;
        this.currentLobbyIsHost = false;
        this.currentLobbyNotice = '';
        this.currentLobbyBackend = false;
        this.networkMode = false;
        this.networkState = null;
        this.networkError = '';
        this.lastNetworkHandSignature = '';
    }

    destroy() {
        this._resetLobbyState();
        this.game = null;
        this.networkState = null;
        this.networkMode = false;
        this.selectedIndices = new Set();
        this.setupScreen = true;

        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    _handSignatureFromState(state) {
        if (!state || !Array.isArray(state.myHand)) return '';
        return state.myHand.map(card => card.label).join('|');
    }

    /** Mount the UI into the container */
    mount() {
        this._resetLobbyState();
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this._buildSetupForm());
    }

    _buildSetupForm() {
        const wrapper = document.createElement('div');
        wrapper.className = 'b2-setup';
        wrapper.innerHTML = `
            <div class="b2-setup-card">
                <div class="b2-logo">🃏</div>
                <h2 class="b2-setup-title">${b2t('setupTitle')}</h2>
                <p class="b2-setup-sub">${b2t('setupSub')}</p>
                <div style="display:flex; flex-direction:column; gap:12px; margin-top:24px;">
                    <button class="b2-start-btn" id="b2-create-btn">${b2t('createGame')}</button>
                    <button class="b2-start-btn" id="b2-join-btn">${b2t('joinGame')}</button>
                    <button class="b2-start-btn" id="b2-rules-btn" style="background: rgba(255,255,255,0.15); color:#eee;">${b2t('rules')}</button>
                </div>
                <p class="b2-rules-hint" style="margin-top:20px; font-size:12px;">
                    ${b2t('setupHintCreate')}<br>
                    ${b2t('setupHintJoin')}
                </p>
            </div>`;

        let chosenCount = 2;
        const renderNameInputs = (n) => {
            const div = document.getElementById('b2-name-inputs');
            if (!div) return;
            div.innerHTML = Array.from({ length: n }, (_, i) =>
                `<input class="b2-name-input" id="b2-name-${i}" type="text" maxlength="18"
                    placeholder="${b2t('playerNamePlaceholder', { n: i + 1 })}" value="${b2t('playerDefault', { n: i + 1 })}" />`
            ).join('');
        };

        // Attach after a tick so DOM is ready
        setTimeout(() => {
            const createBtn = wrapper.querySelector('#b2-create-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => this._showCreateGameScreen());
            }

            const joinBtn = wrapper.querySelector('#b2-join-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', () => this._showJoinGameScreen());
            }

            const rulesBtn = wrapper.querySelector('#b2-rules-btn');
            if (rulesBtn) {
                rulesBtn.addEventListener('click', () => this._showRulesScreen());
            }
        }, 0);

        return wrapper;
    }

    _showRulesScreen() {
        this._clearLobbyPolling();
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this._buildRulesScreen());
    }

    _buildRulesScreen() {
        const wrapper = document.createElement('div');
        wrapper.className = 'b2-setup';
        wrapper.innerHTML = `
            <div class="b2-setup-card" style="max-width: 760px; text-align:left;">
                <div class="b2-logo" style="text-align:center;">🃏</div>
                <h2 class="b2-setup-title" style="text-align:center;">${b2t('rulesTitle')}</h2>
                <div style="display:flex; flex-direction:column; gap:16px; margin-top:24px; color:#f3f6fb; line-height:1.6;">
                    <div>
                        <div style="font-size:20px; font-weight:800; margin-bottom:6px;">${b2t('sectionGameStart')}</div>
                        <div>${b2t('rules1')}</div>
                        <div>${b2t('rules2')}</div>
                        <div>${b2t('rules3')}</div>
                    </div>
                    <div>
                        <div style="font-size:20px; font-weight:800; margin-bottom:6px;">${b2t('sectionPlayingCards')}</div>
                        <div>${b2t('rules4')}</div>
                        <div>${b2t('rules5')}</div>
                        <div>${b2t('rules6')}</div>
                        <div>${b2t('rules7')}</div>
                    </div>
                    <div>
                        <div style="font-size:20px; font-weight:800; margin-bottom:6px;">${b2t('sectionRoundReset')}</div>
                        <div>${b2t('rules8')}</div>
                        <div>${b2t('rules9')}</div>
                    </div>
                    <div>
                        <div style="font-size:20px; font-weight:800; margin-bottom:6px;">${b2t('sectionWinning')}</div>
                        <div>${b2t('rules10')}</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; margin-top:24px;">
                    <button class="b2-start-btn" id="b2-rules-back-btn" style="min-width:220px;">${b2t('back')}</button>
                </div>
            </div>`;

        setTimeout(() => {
            const backBtn = wrapper.querySelector('#b2-rules-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.mount());
            }
        }, 0);

        return wrapper;
    }

    _showCreateGameScreen() {
        this._clearLobbyPolling();
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this._buildCreateGameScreen());
    }

    _buildCreateGameScreen() {
        const wrapper = document.createElement('div');
        wrapper.className = 'b2-setup';
        wrapper.innerHTML = `
            <div class="b2-setup-card">
                <div class="b2-logo">🃏</div>
                <h2 class="b2-setup-title">${b2t('createTitle')}</h2>
                <p class="b2-setup-sub">${b2t('createSub')}</p>
                <div class="b2-setup-row">
                    <div class="b2-player-count" id="b2-player-count-btns">
                        ${[2,3,4].map(n => `<button class="b2-count-btn${n===2?' selected':''}" data-n="${n}">${n}</button>`).join('')}
                    </div>
                </div>
                <div id="b2-name-inputs"></div>
                <div id="b2-create-error" style="color:#ff6b6b; font-weight:700; margin:10px 0 0; text-align:center;"></div>
                <div style="display:flex; gap:10px; margin-top:16px;">
                    <button class="b2-start-btn" id="b2-create-game-btn" style="flex:1;">${b2t('createConfirm')}</button>
                    <button class="b2-start-btn" id="b2-back-btn" style="flex:1; background: rgba(255,255,255,0.15); color:#eee;">${b2t('back')}</button>
                </div>
            </div>`;

        setTimeout(() => {
            let chosenCount = 2;
            const renderNameInputs = (n) => {
                const div = document.getElementById('b2-name-inputs');
                if (!div) return;
                div.innerHTML = Array.from({ length: n }, (_, i) =>
                    `<input class="b2-name-input" id="b2-name-${i}" type="text" maxlength="18"
                        placeholder="${b2t('playerNamePlaceholder', { n: i + 1 })}" value="${b2t('playerDefault', { n: i + 1 })}" />`
                ).join('');
            };
            renderNameInputs(2);

            const btns = wrapper.querySelectorAll('.b2-count-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    chosenCount = parseInt(btn.dataset.n, 10);
                    renderNameInputs(chosenCount);
                });
            });

            const createGameBtn = wrapper.querySelector('#b2-create-game-btn');
            if (createGameBtn) {
                createGameBtn.addEventListener('click', async () => {
                    const errorEl = document.getElementById('b2-create-error');
                    if (errorEl) errorEl.textContent = '';
                    createGameBtn.disabled = true;
                    createGameBtn.textContent = b2t('creating');
                    const names = Array.from({ length: chosenCount }, (_, i) => {
                        const inp = document.getElementById(`b2-name-${i}`);
                        return (inp?.value?.trim()) || b2t('playerDefault', { n: i + 1 });
                    });
                    const hostName = names[0];
                    const session = await createGameLobbySession(hostName, chosenCount);
                    if (!session.ok) {
                        if (errorEl) errorEl.textContent = b2TranslateError(session.error || b2t('unableStartGame'));
                        createGameBtn.disabled = false;
                        createGameBtn.textContent = b2t('createConfirm');
                        return;
                    }
                    this._showLobbyScreen(session.lobby, session.playerId, true, session.notice || '', session.backend);
                });
            }

            const backBtn = wrapper.querySelector('#b2-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.mount());
            }
        }, 0);

        return wrapper;
    }

    _showJoinGameScreen() {
        this._clearLobbyPolling();
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this._buildJoinGameScreen());
    }

    _buildJoinGameScreen() {
        const wrapper = document.createElement('div');
        wrapper.className = 'b2-setup';
        wrapper.innerHTML = `
                <div class="b2-setup-card">
                    <div class="b2-logo">🔗</div>
                    <h2 class="b2-setup-title">${b2t('joinTitle')}</h2>
                    <p class="b2-setup-sub">${b2t('joinSub')}</p>
                    <div class="b2-setup-row" style="margin-top:20px;">
                        <label style="text-align:left; width:100%;">${b2t('yourName')}</label>
                        <input class="b2-name-input" id="b2-join-name" type="text" maxlength="18" placeholder="${b2t('yourNamePlaceholder')}" value="${b2t('playerDefault', { n: 1 })}" />
                    </div>
                    <div class="b2-setup-row">
                        <label style="text-align:left; width:100%;">${b2t('gameCodeLabel')}</label>
                        <input class="b2-name-input" id="b2-join-code" type="text" maxlength="4" placeholder="XXXX" style="text-transform:uppercase; text-align:center; font-size:24px; font-weight:800; letter-spacing:8px;" />
                    </div>
                    <div id="b2-join-error" style="color:#ff6b6b; font-weight:700; margin:8px 0; text-align:center;"></div>
                    <div style="display:flex; gap:10px;">
                        <button class="b2-start-btn" id="b2-join-game-btn" style="flex:1;">${b2t('joinConfirm')}</button>
                        <button class="b2-start-btn" id="b2-back-btn2" style="flex:1; background: rgba(255,255,255,0.15); color:#eee;">${b2t('back')}</button>
                    </div>
                </div>`;

        setTimeout(() => {
            const joinBtn = wrapper.querySelector('#b2-join-game-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', async () => {
                    const nameInput = document.getElementById('b2-join-name');
                    const codeInput = document.getElementById('b2-join-code');
                    const errorEl = document.getElementById('b2-join-error');
                    const playerName = nameInput?.value?.trim() || b2t('playerDefault', { n: 1 });
                    const code = codeInput?.value?.toUpperCase()?.trim() || '';
                    if (!code || code.length !== 4) {
                        errorEl.textContent = b2t('validCodeError');
                        return;
                    }
                    joinBtn.disabled = true;
                    joinBtn.textContent = b2t('joining');
                    errorEl.textContent = '';
                    const result = await joinGameLobbySession(code, playerName);
                    if (!result.ok) {
                        errorEl.textContent = b2TranslateError(result.error);
                        joinBtn.disabled = false;
                        joinBtn.textContent = b2t('joinConfirm');
                        return;
                    }
                    this._showLobbyScreen(result.lobby, result.playerId, false, result.notice || '', result.backend);
                });
            }

            const backBtn = wrapper.querySelector('#b2-back-btn2');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.mount());
            }
        }, 0);

        return wrapper;
    }

    _showLobbyScreen(lobby, playerId, isHost, notice = '', backend = true) {
        this._clearLobbyPolling();
        this.currentLobbyCode = lobby.code;
        this.currentPlayerId = playerId;
        this.currentLobbyIsHost = isHost;
        this.currentLobbyNotice = notice;
        this.currentLobbyBackend = backend;
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this._buildLobbyScreen(lobby, isHost));
        this._beginLobbyPolling();
    }

    _renderLobbyScreen(lobby) {
        const container = document.getElementById(this.containerId);
        if (!container || !this.currentLobbyCode || this.game) return;
        container.innerHTML = '';
        container.appendChild(this._buildLobbyScreen(lobby, this.currentLobbyIsHost));
    }

    _beginLobbyPolling() {
        if (!this.currentLobbyCode) return;
        this.lobbyPollTimer = setInterval(async () => {
            if (!this.currentLobbyCode || this.game) return;
            const result = await getGameLobbySession(this.currentLobbyCode);
            if (!result.ok) {
                this.currentLobbyNotice = b2TranslateError(result.error || b2t('unableRefreshLobby'));
                return;
            }
            this.currentLobbyBackend = result.backend;
            if (result.notice) {
                this.currentLobbyNotice = result.notice;
            }
            if (result.lobby.status === 'in-progress' && this.currentPlayerId) {
                this._startNetworkGame();
                return;
            }
            this._renderLobbyScreen(result.lobby);
        }, 2000);
    }

    _buildLobbyScreen(lobby, isHost) {
        const playerNames = lobby.players.map(player => player.name);
        const missingPlayers = Math.max(0, 2 - lobby.players.length);
        const canHostStart = isHost && missingPlayers === 0;
        const lobbyStateHint = isHost
            ? (canHostStart
                ? b2t('readyToStart')
                : b2t('needMoreToStart', { count: missingPlayers, suffix: missingPlayers === 1 ? '' : 's' }))
            : b2t('waitingForHost');
        const backendStatus = this.currentLobbyBackend ? b2t('backendOnline') : b2t('backendLocal');
        const notice = this.currentLobbyNotice || (this.currentLobbyBackend
            ? b2t('lobbyNoticeOnline')
            : b2t('lobbyNoticeLocal'));
        const wrapper = document.createElement('div');
        wrapper.className = 'b2-setup';
        wrapper.innerHTML = `
                <div class="b2-setup-card">
                    <div class="b2-logo">⏳</div>
                    <h2 class="b2-setup-title">${b2t('lobbyTitle')}</h2>
                    <p class="b2-setup-sub">${b2t('waitingPlayers')}</p>
                    <div style="margin-top:8px; text-align:center; color:#dbeafe; font-size:13px; font-weight:700;">${backendStatus}</div>
                    <div style="background:rgba(255,255,255,0.1); border-radius:14px; padding:16px; margin:20px 0; text-align:center;">
                        <div style="font-size:14px; color:#aaa; margin-bottom:8px;">${b2t('gameCode')}</div>
                        <div style="font-size:32px; font-weight:800; color:#f9ca24; letter-spacing:6px;">${lobby.code}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:12px; padding:14px;">
                        <div style="font-size:14px; font-weight:700; color:#ccc; margin-bottom:10px;">${b2t('playersLabel', { current: lobby.players.length, max: lobby.numPlayers })}</div>
                        ${playerNames.map((name, i) => `
                            <div style="padding:8px 12px; background:rgba(255,255,255,0.08); border-radius:8px; margin-bottom:6px; font-size:14px;">
                                ${i === 0 ? '👑 ' : ''}${name}
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top:14px; padding:12px; border-radius:10px; background:rgba(255,255,255,0.08); color:#f3f6fb; font-size:13px; line-height:1.5;">
                        <div style="font-weight:800; margin-bottom:8px; color:#f9ca24;">${lobbyStateHint}</div>
                        ${notice}
                    </div>
                    <div style="display:flex; gap:10px; margin-top:16px;">
                        ${isHost ? `<button class="b2-start-btn" id="b2-start-game-btn" style="flex:1; ${canHostStart ? '' : 'opacity:0.65; cursor:not-allowed;'}" ${canHostStart ? '' : 'disabled'}>${canHostStart ? b2t('hostStartGame') : b2t('needPlayersToStartBtn')}</button>` : ''}
                        <button class="b2-start-btn" id="b2-lobby-back-btn" style="flex:1; background: rgba(255,255,255,0.15); color:#eee;">${b2t('cancel')}</button>
                    </div>
                </div>`;

        setTimeout(() => {
            const startBtn = wrapper.querySelector('#b2-start-game-btn');
            if (startBtn && isHost) {
                startBtn.addEventListener('click', async () => {
                    if (!canHostStart) {
                        this.currentLobbyNotice = b2t('atLeastTwoToStart');
                        this._renderLobbyScreen(lobby);
                        return;
                    }
                    startBtn.disabled = true;
                    startBtn.textContent = b2t('starting');
                    const result = await startGameLobbySession(lobby.code, this.currentPlayerId);
                    if (!result.ok) {
                        this.currentLobbyNotice = b2TranslateError(result.error || b2t('unableStartGame'));
                        this._renderLobbyScreen(lobby);
                        return;
                    }
                    if (result.notice) {
                        this.currentLobbyNotice = result.notice;
                    }
                    this._startNetworkGame();
                });
            }

            const backBtn = wrapper.querySelector('#b2-lobby-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.mount());
            }
        }, 0);

        return wrapper;
    }

    _startGame(numPlayers, names) {
        this._clearLobbyPolling();
        this._clearNetworkPolling();
        this.networkMode = false;
        this.networkState = null;
        this.game = new Big2Game(numPlayers, names);
        this.localSeat = this.game.currentTurn;
        this.selectedIndices = new Set();
        this.setupScreen = false;
        this._render();
    }

    async _startNetworkGame() {
        if (!this.currentLobbyCode || !this.currentPlayerId) return;
        this._clearLobbyPolling();
        this._clearNetworkPolling();
        this.game = null;
        this.networkMode = true;
        this.networkError = '';
        this.selectedIndices = new Set();

        const first = await getOnlineGameStateSession(this.currentLobbyCode, this.currentPlayerId);
        if (!first.ok) {
            this.networkError = first.error;
            this._render();
            return;
        }
        this.networkState = first.state;
        this.lastNetworkHandSignature = this._handSignatureFromState(first.state);
        this._render();

        this.networkPollTimer = setInterval(async () => {
            if (!this.networkMode || !this.currentLobbyCode || !this.currentPlayerId) return;
            const next = await getOnlineGameStateSession(this.currentLobbyCode, this.currentPlayerId);
            if (!next.ok) {
                this.networkError = next.error;
                this._render();
                return;
            }
            this.networkError = '';
            const nextHandSignature = this._handSignatureFromState(next.state);
            if (nextHandSignature !== this.lastNetworkHandSignature) {
                this.selectedIndices = new Set();
            }
            this.lastNetworkHandSignature = nextHandSignature;
            this.networkState = next.state;
            this._render();
        }, 1800);
    }

    _render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';

        if (this.networkMode) {
            if (!this.networkState) {
                const loading = document.createElement('div');
                loading.className = 'b2-setup';
                loading.innerHTML = `<div class="b2-setup-card"><h2 class="b2-setup-title">${b2t('connectingGame')}</h2><p class="b2-setup-sub">${this.networkError || b2t('loadingState')}</p></div>`;
                container.appendChild(loading);
                return;
            }
            if (this.networkState.gameOver) {
                container.appendChild(this._buildNetworkResultScreen(this.networkState));
                return;
            }
            container.appendChild(this._buildNetworkGameBoard(this.networkState));
            return;
        }

        const snap = this.game.snapshot();

        if (snap.gameOver) {
            container.appendChild(this._buildResultScreen(snap));
            return;
        }

        container.appendChild(this._buildGameBoard(snap));
    }

    _opponentSlots(count) {
        if (count <= 1) return ['top'];
        if (count === 2) return ['left', 'right'];
        return ['top', 'left', 'right'];
    }

    _buildOpponentSeat(player, slot, isTurn) {
        const seat = document.createElement('div');
        seat.className = `b2-opponent-seat b2-seat-${slot}${isTurn ? ' is-turn' : ''}${player.finished ? ' finished' : ''}${!player.active ? ' inactive' : ''}`;

        const meta = document.createElement('div');
        meta.className = 'b2-opponent-meta';
        meta.innerHTML = `
            <div class="b2-opponent-name">${player.name}${!player.active ? ' 🔒' : ''}</div>
            <div class="b2-opponent-cards">${player.cardCount === 1 ? b2t('cardCountSingle', { count: player.cardCount }) : b2t('cardCountPlural', { count: player.cardCount })}</div>
        `;

        const flags = document.createElement('div');
        flags.className = 'b2-seat-flags';
        if (player.passed) {
            const pass = document.createElement('span');
            pass.className = 'b2-pill pass';
            pass.textContent = b2t('passBadge');
            flags.appendChild(pass);
        }
        if (player.finished) {
            const rank = document.createElement('span');
            rank.className = 'b2-pill rank';
            rank.textContent = `#${player.finishRank}`;
            flags.appendChild(rank);
        }
        meta.appendChild(flags);

        const stack = document.createElement('div');
        stack.className = `b2-opponent-stack ${slot === 'top' ? 'horizontal' : 'vertical'}`;
        const backCount = Math.max(1, Math.min(player.cardCount, 13));
        for (let i = 0; i < backCount; i++) {
            const back = document.createElement('div');
            back.className = 'b2-card-back';
            back.style.setProperty('--i', String(i));
            stack.appendChild(back);
        }

        seat.appendChild(meta);
        seat.appendChild(stack);
        return seat;
    }

    _buildTableArea(table, tableOwnerName, drawPileCount = 0) {
        const tableArea = document.createElement('div');
        tableArea.className = 'b2-table-area';

        if (table) {
            const label = document.createElement('div');
            label.className = 'b2-table-label';
            label.textContent = b2t('tablePlayedBy', { type: table.type.toUpperCase(), name: tableOwnerName || '' });
            tableArea.appendChild(label);

            const tableCards = document.createElement('div');
            tableCards.className = 'b2-card-row';
            table.cards.forEach(card => {
                tableCards.appendChild(this._cardEl(card, false, false));
            });
            tableArea.appendChild(tableCards);
        } else {
            const hint = document.createElement('div');
            hint.className = 'b2-table-hint';
            hint.textContent = b2t('tableClear');
            tableArea.appendChild(hint);
        }

        if (drawPileCount > 0) {
            const pile = document.createElement('div');
            pile.className = 'b2-draw-pile';
            pile.innerHTML = `
                <div class="b2-draw-pile-stack">
                    <div class="b2-draw-back"></div>
                    <div class="b2-draw-back"></div>
                    <div class="b2-draw-back"></div>
                </div>
                <div class="b2-draw-pile-label">${b2t('drawPile', { count: drawPileCount })}</div>
            `;
            tableArea.appendChild(pile);
        }

        return tableArea;
    }

    _buildBoardStage(opponents, currentTurnId, table, tableOwnerName, drawPileCount = 0) {
        const stage = document.createElement('div');
        stage.className = 'b2-stage';
        const slots = this._opponentSlots(opponents.length);
        opponents.forEach((player, index) => {
            const slot = slots[index] || 'top';
            stage.appendChild(this._buildOpponentSeat(player, slot, player.id === currentTurnId));
        });
        stage.appendChild(this._buildTableArea(table, tableOwnerName, drawPileCount));
        return stage;
    }

    _buildNetworkGameBoard(state) {
        const board = document.createElement('div');
        board.className = 'b2-board';

        let mySeat = Number.isInteger(state.mySeat) ? state.mySeat : -1;
        if (mySeat < 0 && Array.isArray(state.players)) {
            mySeat = state.players.findIndex(player => player.id === this.currentPlayerId);
        }
        if (mySeat < 0) {
            const msg = document.createElement('div');
            msg.className = 'b2-setup';
            msg.innerHTML = `<div class="b2-setup-card"><h2 class="b2-setup-title">${b2t('reconnecting')}</h2><p class="b2-setup-sub">${b2t('reconnectingSub')}</p></div>`;
            board.appendChild(msg);
            return board;
        }

        const opponents = state.players
            .filter(player => player.seat !== mySeat)
            .map(player => ({
                id: player.seat,
                name: player.name,
                cardCount: player.cardCount,
                active: player.active,
                passed: player.passed,
                finished: player.finished,
                finishRank: player.finishRank
            }));
        opponents.sort((a, b) => a.id - b.id);
        const tableOwnerName = state.tableOwner !== null ? state.players[state.tableOwner]?.name : '';
        board.appendChild(this._buildBoardStage(opponents, state.currentTurn, state.table, tableOwnerName, state.drawPileCount || 0));

        const logEl = document.createElement('div');
        logEl.className = 'b2-log';
        state.log.slice().reverse().forEach(line => {
            const row = document.createElement('div');
            row.textContent = line;
            logEl.appendChild(row);
        });
        board.appendChild(logEl);

        const me = state.players[mySeat];
        const handSection = document.createElement('div');
        handSection.className = 'b2-hand-section';

        const turnLabel = document.createElement('div');
        turnLabel.className = 'b2-turn-label';
        const myTurn = state.currentTurn === mySeat;
        turnLabel.textContent = myTurn ? b2t('yourTurn') : b2t('waitingFor', { name: state.currentTurnName });
        handSection.appendChild(turnLabel);

        const handRow = document.createElement('div');
        handRow.className = 'b2-hand-row';
        const myHand = Array.isArray(state.myHand) ? state.myHand : [];
        myHand.forEach((card, index) => {
            const el = this._cardEl(card, myTurn, this.selectedIndices.has(index));
            if (myTurn) {
                el.addEventListener('click', () => {
                    if (this.selectedIndices.has(index)) this.selectedIndices.delete(index);
                    else this.selectedIndices.add(index);
                    this._render();
                });
            }
            handRow.appendChild(el);
        });
        handSection.appendChild(handRow);

        const actionRow = document.createElement('div');
        actionRow.className = 'b2-action-row';

        const playBtn = document.createElement('button');
        playBtn.className = 'b2-btn b2-btn-play';
        playBtn.textContent = b2t('play');
        playBtn.addEventListener('click', () => this._onNetworkPlay());

        const passBtn = document.createElement('button');
        passBtn.className = 'b2-btn b2-btn-pass';
        passBtn.textContent = b2t('pass');
        passBtn.disabled = !myTurn;
        passBtn.addEventListener('click', () => this._onNetworkPass());

        actionRow.appendChild(playBtn);
        actionRow.appendChild(passBtn);

        if (this.currentLobbyIsHost) {
            const quitBtn = document.createElement('button');
            quitBtn.className = 'b2-btn b2-btn-quit';
            quitBtn.textContent = b2t('quitGame');
            quitBtn.addEventListener('click', () => this._onNetworkQuit());
            actionRow.appendChild(quitBtn);
        }
        handSection.appendChild(actionRow);

        const info = document.createElement('div');
        info.className = 'b2-error';
        info.style.display = 'block';
        info.style.color = '#dbeafe';
        info.textContent = b2t('roomInfo', { name: me?.name || b2t('playerDefault', { n: 1 }), code: this.currentLobbyCode });
        handSection.appendChild(info);

        const errEl = document.createElement('div');
        errEl.className = 'b2-error';
        errEl.id = 'b2-error-msg';
        if (this.networkError) {
            errEl.style.display = 'block';
            errEl.textContent = `⚠️ ${this.networkError}`;
        }
        handSection.appendChild(errEl);

        board.appendChild(handSection);
        return board;
    }

    _buildNetworkResultScreen(state) {
        const screen = document.createElement('div');
        screen.className = 'b2-result';

        const title = document.createElement('h2');
        title.className = 'b2-result-title';
        title.textContent = b2t('gameOver');
        screen.appendChild(title);

        if (state.endedReason === 'host-quit') {
            const note = document.createElement('div');
            note.className = 'b2-setup-sub';
            note.style.marginBottom = '0';
            note.style.color = '#fca5a5';
            note.textContent = b2t('hostEnded');
            screen.appendChild(note);
        }

        const table = document.createElement('table');
        table.className = 'b2-result-table';
        table.innerHTML = `<thead><tr><th>${b2t('place')}</th><th>${b2t('player')}</th><th>${b2t('cardsLeft')}</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        state.finishOrder.forEach((seat, index) => {
            const player = state.players[seat];
            const tr = document.createElement('tr');
            if (index === 0) tr.classList.add('winner');
            tr.innerHTML = `<td>#${index + 1}</td><td>${player?.name || '-'}</td><td>${player?.cardCount ?? '-'}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        screen.appendChild(table);

        const logEl = document.createElement('div');
        logEl.className = 'b2-log b2-result-log';
        state.log.slice().reverse().forEach(line => {
            const row = document.createElement('div');
            row.textContent = line;
            logEl.appendChild(row);
        });
        screen.appendChild(logEl);

        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'b2-btn b2-btn-play';
        newGameBtn.textContent = b2t('backToMenu');
        newGameBtn.addEventListener('click', () => {
            this.mount();
        });
        screen.appendChild(newGameBtn);

        return screen;
    }

    _buildGameBoard(snap) {
        const board = document.createElement('div');
        board.className = 'b2-board';

        const opponents = snap.players
            .filter(player => player.id !== snap.currentTurn)
            .map(player => ({
                id: player.id,
                name: player.name,
                cardCount: player.cardCount,
                active: player.active,
                passed: player.passed,
                finished: player.finished,
                finishRank: player.finishRank
            }));
        const tableOwnerName = snap.tableOwner !== null ? snap.players[snap.tableOwner]?.name : '';
        board.appendChild(this._buildBoardStage(opponents, snap.currentTurn, snap.table, tableOwnerName, snap.drawPileCount || 0));

        // ── Log ──────────────────────────────────────────────────────────────
        const logEl = document.createElement('div');
        logEl.className = 'b2-log';
        snap.log.slice().reverse().forEach(line => {
            const row = document.createElement('div');
            row.textContent = line;
            logEl.appendChild(row);
        });
        board.appendChild(logEl);

        // ── Bottom: current player hand ─────────────────────────────────────
        const cur = snap.players[snap.currentTurn];
        const handSection = document.createElement('div');
        handSection.className = 'b2-hand-section';

        const turnLabel = document.createElement('div');
        turnLabel.className = 'b2-turn-label';
        turnLabel.textContent = b2t('turnOf', { name: cur.name });
        handSection.appendChild(turnLabel);

        const handRow = document.createElement('div');
        handRow.className = 'b2-hand-row';

        cur.hand.forEach((c, i) => {
            const el = this._cardEl(c, true, this.selectedIndices.has(i));
            el.addEventListener('click', () => {
                if (this.selectedIndices.has(i)) {
                    this.selectedIndices.delete(i);
                } else {
                    this.selectedIndices.add(i);
                }
                this._render();
            });
            handRow.appendChild(el);
        });
        handSection.appendChild(handRow);

        // Action buttons
        const actionRow = document.createElement('div');
        actionRow.className = 'b2-action-row';

        const playBtn = document.createElement('button');
        playBtn.className = 'b2-btn b2-btn-play';
        playBtn.textContent = b2t('play');
        playBtn.addEventListener('click', () => this._onPlay());

        const passBtn = document.createElement('button');
        passBtn.className = 'b2-btn b2-btn-pass';
        passBtn.textContent = b2t('pass');
        passBtn.addEventListener('click', () => this._onPass());

        actionRow.appendChild(playBtn);
        actionRow.appendChild(passBtn);
        handSection.appendChild(actionRow);

        // Error message area
        const errEl = document.createElement('div');
        errEl.className = 'b2-error';
        errEl.id = 'b2-error-msg';
        handSection.appendChild(errEl);

        board.appendChild(handSection);

        return board;
    }

    _buildResultScreen(snap) {
        const screen = document.createElement('div');
        screen.className = 'b2-result';

        const title = document.createElement('h2');
        title.className = 'b2-result-title';
        title.textContent = b2t('gameOver');
        screen.appendChild(title);

        const table = document.createElement('table');
        table.className = 'b2-result-table';
        table.innerHTML = `<thead><tr><th>${b2t('place')}</th><th>${b2t('player')}</th><th>${b2t('cardsLeft')}</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        snap.finishOrder.forEach((pid, idx) => {
            const p = snap.players[pid];
            const tr = document.createElement('tr');
            if (idx === 0) tr.classList.add('winner');
            tr.innerHTML = `<td>#${idx+1}</td><td>${p.name}</td><td>${p.cardCount}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        screen.appendChild(table);

        // Log
        const logEl = document.createElement('div');
        logEl.className = 'b2-log b2-result-log';
        snap.log.slice().reverse().forEach(line => {
            const row = document.createElement('div');
            row.textContent = line;
            logEl.appendChild(row);
        });
        screen.appendChild(logEl);

        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'b2-btn b2-btn-play';
        newGameBtn.textContent = b2t('playAgain');
        newGameBtn.addEventListener('click', () => {
            this.game = null;
            this.setupScreen = true;
            this.selectedIndices = new Set();
            this.mount();
        });
        screen.appendChild(newGameBtn);

        return screen;
    }

    _onPlay() {
        if (this.selectedIndices.size === 0) {
            this._showError(b2t('noSelection'));
            return;
        }
        const indices = [...this.selectedIndices];
        const result = this.game.play(indices);
        if (!result.ok) {
            this._showError(b2TranslateError(result.error));
            return;
        }
        this.selectedIndices = new Set();
        this._render();
    }

    async _onNetworkPlay() {
        if (this.selectedIndices.size === 0) {
            this.networkError = b2t('noSelection');
            this._render();
            return;
        }
        const selected = [...this.selectedIndices].sort((a, b) => a - b);
        const labels = selected.map(index => this.networkState.myHand[index]?.label).filter(Boolean);
        const result = await playOnlineTurnSession(this.currentLobbyCode, this.currentPlayerId, labels);
        if (!result.ok) {
            this.networkError = b2TranslateError(result.error);
            this._render();
            return;
        }
        this.networkError = '';
        this.selectedIndices = new Set();
        this.networkState = result.state;
        this.lastNetworkHandSignature = this._handSignatureFromState(result.state);
        this._render();
    }

    _onPass() {
        const result = this.game.pass();
        if (!result.ok) {
            this._showError(b2TranslateError(result.error));
            return;
        }
        this.selectedIndices = new Set();
        this._render();
    }

    async _onNetworkPass() {
        if (!this.networkState?.myTurn) return;
        const result = await passOnlineTurnSession(this.currentLobbyCode, this.currentPlayerId);
        if (!result.ok) {
            this.networkError = b2TranslateError(result.error);
            this._render();
            return;
        }
        this.networkError = '';
        this.selectedIndices = new Set();
        this.networkState = result.state;
        this.lastNetworkHandSignature = this._handSignatureFromState(result.state);
        this._render();
    }

    async _onNetworkQuit() {
        if (!this.currentLobbyIsHost) return;
        const confirmed = window.confirm(b2t('quitConfirm'));
        if (!confirmed) return;

        const result = await quitOnlineGameSession(this.currentLobbyCode, this.currentPlayerId);
        if (!result.ok) {
            this.networkError = b2TranslateError(result.error);
            this._render();
            return;
        }

        this.networkError = '';
        if (result.state) {
            this.networkState = result.state;
            this.lastNetworkHandSignature = this._handSignatureFromState(result.state);
        }
        this._render();
    }

    _showError(msg) {
        // Re-render to ensure the DOM is fresh, then inject the error
        this._render();
        const el = document.getElementById('b2-error-msg');
        if (el) {
            el.textContent = '⚠️ ' + b2TranslateError(msg);
            el.style.display = 'block';
        }
    }

    _cardEl(card, interactive, selected) {
        const el = document.createElement('div');
        el.className = `b2-card${interactive ? ' interactive' : ''}${selected ? ' selected' : ''}`;
        const color = BIG2.SUIT_COLORS[card.suit] || '#222';
        el.style.color = color;
        el.innerHTML = `<span class="b2-card-rank">${card.rank}</span><span class="b2-card-suit">${card.suit}</span>`;
        return el;
    }
}

// ─── Global API ───────────────────────────────────────────────────────────────

window.Big2UI = Big2UI;

/** Called by navigation.js when Big 2 page is shown */
window.startBig2 = function(containerId) {
    if (window._big2UI && typeof window._big2UI.destroy === 'function') {
        window._big2UI.destroy();
    }
    const ui = new Big2UI(containerId || 'b2-game-container');
    ui.mount();
    window._big2UI = ui;
};

/** Called by navigation.js when leaving Big 2 page */
window.stopBig2 = function() {
    if (window._big2UI && typeof window._big2UI.destroy === 'function') {
        window._big2UI.destroy();
    }
    window._big2UI = null;
};
