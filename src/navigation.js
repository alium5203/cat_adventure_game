const GAME_KEYS = {
    CAT: 'cat-adventure',
    CAR: 'turbo-traffic'
};

const GAME_PAGES = {
    [GAME_KEYS.CAT]: 'homepage',
    [GAME_KEYS.CAR]: 'turbo-page'
};

let overlayReturnPage = 'landing-page';
let activeGameKey = GAME_KEYS.CAT;
let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
let isGamePaused = false;
let scoreSyncIntervalId = null;

const touchInputState = {
    enabled: false,
    gameKey: GAME_KEYS.CAT,
    leftPressed: false,
    rightPressed: false,
    jumpQueued: false,
    laneLeftQueued: false,
    laneRightQueued: false
};

const translations = {
    en: {
        btn: {
            rules: '📖 Rules',
            play: '▶ Play',
            back: '← Back',
            home: '🏠 Home',
            pause: '⏸ Pause',
            resume: '▶ Resume',
            restart: '🔄 Restart',
            stop: '⏹ Stop',
            leaderboard: '🏆 Leaderboard',
            playerName: 'Name',
            playerNameHint: ' (click to change)',
            currentRun: 'Current Run',
            bestScore: 'Best Score',
            newAccount: '✚ New Account',
            signOut: '🚪 Sign Out',
            resetData: '🗑 Reset Data',
            resetConfirm: 'This will erase all accounts and scores on this device. Continue?',
            resetDone: 'Data cleared successfully.',
            allGames: '← All Games',
            openGame: 'Open Game'
        },
        hub: {
            kicker: 'Game Portal',
            title: 'Coriander Arcade',
            copy: 'Choose a game from the library. Cat Adventure and Turbo Traffic are both live, with room for more to join the lineup.',
            gamesTitle: 'Available Games',
            gamesCopy: 'Pick a platformer or a lane-dodging racer, then jump in.',
            catCard: {
                status: 'Live Now',
                title: 'Cat Adventure',
                copy: 'Guide a blocky cat through tricky platform levels, dodge enemies, and chase a high score.',
                genre: 'Platformer',
                players: '1 Player'
            },
            carCard: {
                status: 'Live Now',
                title: 'Turbo Traffic',
                copy: 'Switch lanes, dodge incoming traffic, and keep your cool as the road gets faster.',
                genre: 'Endless Runner',
                players: '1 Player'
            },
            comingSoon: {
                status: 'Coming Soon',
                title: 'More Games Incoming',
                copy: 'This slot is ready for the next project. When you add a new game, it can plug straight into this hub.'
            }
        },
        games: {
            'cat-adventure': {
                title: 'Cat Adventure',
                pageKicker: 'Now Playing',
                pageCopy: 'Jump through stacked platforms, avoid enemies, and reach the golden door to clear each level.',
                features: ['Rising Difficulty', 'Door at Every Finish', '100 Pts per Level'],
                rulesTitle: 'Cat Adventure Rules 📋',
                rules: {
                    objective: 'Objective: Guide your cat through increasingly difficult levels to reach the goal door.',
                    controls: 'Controls: Use WASD or Arrow Keys, or the on-screen touch buttons, to move left/right and jump.',
                    platforms: 'Platforms: Jump across platforms to reach higher areas and avoid falling.',
                    enemies: 'Enemies: Ground enemies walk back and forth, flying enemies hover and bob in the sky. Touching any enemy costs a life.',
                    lives: 'Lives: You start with 3 lives. Lose all 3 and it\'s game over. Each new level resets your lives to 3.',
                    scoring: 'Scoring: Earn 100 points for each level you complete. Try to get the highest score.',
                    difficulty: 'Difficulty: Each level gets progressively harder with more platforms, enemies, and flying threats.',
                    goal: 'Goal: Reach the golden door at the end of each level to advance.'
                },
                leaderboardTitle: '🏆 Cat Adventure Leaderboard',
                scoreLabel: 'Score',
                levelLabel: 'Level'
            },
            'turbo-traffic': {
                title: 'Turbo Traffic',
                pageKicker: 'Engines On',
                pageCopy: 'Slide across three lanes, dodge oncoming traffic, and stack up the longest distance you can survive.',
                features: ['3-Lane Dodging', 'Level Progression', 'Distance-Based Score'],
                rulesTitle: 'Turbo Traffic Rules 📋',
                rules: {
                    objective: 'Objective: Stay on the road as long as possible and survive longer than every other driver.',
                    controls: 'Controls: Use A/D or Left/Right Arrow Keys, or tap the on-screen touch buttons, to switch lanes.',
                    platforms: 'Road: The highway has three lanes. Commit to clean lane changes and avoid getting trapped.',
                    enemies: 'Traffic: Incoming cars and trucks pour down the road. Hitting any vehicle ends the run.',
                    lives: 'Lives: You only get one car per run. A crash sends you back to the start.',
                    scoring: 'Scoring: Your score is the distance you survive, and your run level increases over time.',
                    difficulty: 'Difficulty: Higher levels increase traffic speed, density, and obstacle size.',
                    goal: 'Goal: Survive through as many levels as possible and set a top distance.'
                },
                leaderboardTitle: '🏆 Turbo Traffic Leaderboard',
                scoreLabel: 'Score (Distance)',
                levelLabel: 'Level'
            }
        },
        leaderboard: {
            rank: 'Rank',
            player: 'Player',
            points: 'Total Points',
            level: 'Best Level',
            you: 'You',
            empty: 'No scores yet.'
        }
    },
    'zh-CN': {
        btn: {
            rules: '📖 规则',
            play: '▶ 开始',
            back: '← 返回',
            home: '🏠 首页',
            pause: '⏸ 暂停',
            resume: '▶ 继续',
            restart: '🔄 重新开始',
            stop: '⏹ 停止',
            leaderboard: '🏆 排行榜',
            playerName: '名字',
            playerNameHint: '（点击更改）',
            currentRun: '本局分数',
            bestScore: '最高分',
            newAccount: '✚ 新账号',
            signOut: '🚪 退出',
            resetData: '🗑 清除数据',
            resetConfirm: '这将删除此设备上的所有账号和分数。继续吗？',
            resetDone: '数据已清除。',
            allGames: '← 全部游戏',
            openGame: '打开游戏'
        },
        hub: {
            kicker: '游戏入口',
            title: 'Coriander Arcade',
            copy: '从游戏库中选择一个游戏。猫咪冒险和 Turbo Traffic 都已上线，后面还可以继续扩充。',
            gamesTitle: '可用游戏',
            gamesCopy: '选择平台跳跃或躲车竞速，然后直接开始。',
            catCard: {
                status: '现已上线',
                title: '猫咪冒险',
                copy: '操控方块风格的小猫穿越平台、躲避敌人，并冲击更高分数。',
                genre: '平台跳跃',
                players: '单人'
            },
            carCard: {
                status: '现已上线',
                title: '极速车流',
                copy: '快速切换车道、避开来车，并在道路不断加速时坚持更久。',
                genre: '无尽奔跑',
                players: '单人'
            },
            comingSoon: {
                status: '即将推出',
                title: '更多游戏正在路上',
                copy: '这里已经为下一个项目留好了位置。添加新游戏后，可以直接接入这个主页。'
            }
        },
        games: {
            'cat-adventure': {
                title: '猫咪冒险',
                pageKicker: '当前游戏',
                pageCopy: '跳过层层平台、避开敌人，并在每个关卡终点抵达金色大门。',
                features: ['难度逐级提升', '每关终点都有门', '每关 100 分'],
                rulesTitle: '猫咪冒险规则 📋',
                rules: {
                    objective: '目标：引导您的猫通过越来越困难的关卡，达到终点门。',
                    controls: '操作：使用 WASD、方向键，或屏幕上的触控按钮来左右移动和跳跃。',
                    platforms: '平台：跳过平台以到达更高区域并避免跌落。',
                    enemies: '敌人：地面敌人来回移动，飞行敌人在空中上下浮动。触碰敌人会失去一条生命。',
                    lives: '生命：您开始时有 3 条生命。失去所有生命即游戏结束。每个新关卡生命重置为 3。',
                    scoring: '得分：每通过一关获得 100 分。争取最高分。',
                    difficulty: '难度：每个关卡难度逐渐增加，平台、敌人和飞行威胁都会变多。',
                    goal: '目标：达到每个关卡末端的金门以进入下一关。'
                },
                leaderboardTitle: '🏆 猫咪冒险排行榜',
                scoreLabel: '得分',
                levelLabel: '关卡'
            },
            'turbo-traffic': {
                title: '极速车流',
                pageKicker: '引擎启动',
                pageCopy: '在三条车道间来回切换，避开迎面而来的车辆，并尽可能跑出更长距离。',
                features: ['三车道闪避', '关卡递进', '按距离计分'],
                rulesTitle: '极速车流规则 📋',
                rules: {
                    objective: '目标：尽可能长时间保持在道路上，比其他驾驶者坚持得更久。',
                    controls: '操作：使用 A/D、左右方向键，或点击屏幕上的触控按钮来切换车道。',
                    platforms: '道路：高速路有三条车道。要提前判断，避免被堵死。',
                    enemies: '车辆：迎面而来的汽车和卡车会不断出现。撞上任何车辆都会结束本局。',
                    lives: '生命：每局只有一辆车。撞车后就会从头开始。',
                    scoring: '得分：分数取决于你坚持的距离，关卡会随着时间推进不断提升。',
                    difficulty: '难度：更高关卡会提高车流速度、密度和障碍体型。',
                    goal: '目标：尽可能闯过更多关卡，并刷新你的最长距离。'
                },
                leaderboardTitle: '🏆 极速车流排行榜',
                scoreLabel: '分数（距离）',
                levelLabel: '关卡'
            }
        },
        leaderboard: {
            rank: '排名',
            player: '玩家',
            points: '总积分',
            level: '最高关卡',
            you: '你',
            empty: '还没有成绩。'
        }
    },
    'ko-KR': {
        btn: {
            rules: '📖 규칙',
            play: '▶ 플레이',
            back: '← 뒤로',
            home: '🏠 홈',
            pause: '⏸ 일시정지',
            resume: '▶ 계속',
            restart: '🔄 다시 시작',
            stop: '⏹ 중지',
            leaderboard: '🏆 리더보드',
            playerName: '이름',
            playerNameHint: ' (클릭하여 변경)',
            currentRun: '현재 점수',
            bestScore: '최고 점수',
            newAccount: '✚ 새 계정',
            signOut: '🚪 로그아웃',
            resetData: '🗑 데이터 초기화',
            resetConfirm: '이 기기의 모든 계정과 점수가 삭제됩니다. 계속할까요?',
            resetDone: '데이터가 초기화되었습니다.',
            allGames: '← 모든 게임',
            openGame: '게임 열기'
        },
        hub: {
            kicker: '게임 허브',
            title: 'Coriander Arcade',
            copy: '게임 라이브러리에서 원하는 게임을 고르세요. 고양이 모험과 Turbo Traffic이 모두 공개되었고, 이후 더 추가할 수 있습니다.',
            gamesTitle: '플레이 가능한 게임',
            gamesCopy: '플랫폼 액션이나 차선 회피 러너 중 하나를 골라 바로 시작하세요.',
            catCard: {
                status: '지금 플레이 가능',
                title: '고양이 모험',
                copy: '블록 스타일 고양이로 플랫폼을 넘고 적을 피하며 최고 점수를 노리세요.',
                genre: '플랫폼 액션',
                players: '1인용'
            },
            carCard: {
                status: '지금 플레이 가능',
                title: '터보 트래픽',
                copy: '차선을 바꾸며 차량을 피하고, 점점 빨라지는 도로에서 오래 버티세요.',
                genre: '엔들리스 러너',
                players: '1인용'
            },
            comingSoon: {
                status: '출시 예정',
                title: '다음 게임 준비 중',
                copy: '이 자리는 다음 프로젝트를 위해 준비되어 있습니다. 새 게임을 추가하면 이 허브에 바로 연결할 수 있습니다.'
            }
        },
        games: {
            'cat-adventure': {
                title: '고양이 모험',
                pageKicker: '현재 게임',
                pageCopy: '층층이 쌓인 플랫폼을 점프하고 적을 피해서 각 레벨 끝의 황금 문에 도달하세요.',
                features: ['점점 높아지는 난이도', '매 레벨 마지막에 문', '레벨당 100점'],
                rulesTitle: '고양이 모험 규칙 📋',
                rules: {
                    objective: '목표: 고양이를 어려워지는 단계로 이끌어 골문에 도달하세요.',
                    controls: '조작: WASD, 방향키 또는 화면의 터치 버튼으로 이동 및 점프하세요.',
                    platforms: '플랫폼: 플랫폼을 뛰어넘어 높은 곳으로 이동하고 낙사를 피하세요.',
                    enemies: '적: 땅 적은 좌우로 이동하고 비행 적은 위아래로 떠다닙니다. 접촉 시 목숨을 잃습니다.',
                    lives: '생명: 3개의 목숨으로 시작합니다. 모두 잃으면 게임 오버이며, 새 레벨마다 3으로 초기화됩니다.',
                    scoring: '점수: 레벨을 클리어할 때마다 100점을 얻습니다. 최고 점수를 노리세요.',
                    difficulty: '난이도: 레벨이 올라갈수록 플랫폼, 적, 공중 위협이 더 많아집니다.',
                    goal: '목표: 각 레벨 끝의 금문에 도달하여 다음 레벨로 이동하세요.'
                },
                leaderboardTitle: '🏆 고양이 모험 리더보드',
                scoreLabel: '점수',
                levelLabel: '레벨'
            },
            'turbo-traffic': {
                title: '터보 트래픽',
                pageKicker: '엔진 온',
                pageCopy: '세 개 차선을 오가며 차량을 피하고 가능한 한 긴 거리를 기록하세요.',
                features: ['3차선 회피', '레벨 진행', '거리 기반 점수'],
                rulesTitle: '터보 트래픽 규칙 📋',
                rules: {
                    objective: '목표: 가능한 오래 도로 위에 남아 다른 드라이버보다 더 긴 기록을 세우세요.',
                    controls: '조작: A/D, 좌우 방향키 또는 화면의 터치 버튼으로 차선을 변경하세요.',
                    platforms: '도로: 고속도로는 세 개 차선으로 구성됩니다. 막히지 않도록 미리 차선을 선택하세요.',
                    enemies: '교통: 맞은편 차량과 트럭이 계속 내려옵니다. 어떤 차량과 부딪혀도 즉시 종료됩니다.',
                    lives: '생명: 한 번의 주행에 한 대의 차량만 주어집니다. 충돌하면 처음부터 다시 시작합니다.',
                    scoring: '점수: 버틴 거리만큼 점수가 오르고, 주행 시간이 길수록 레벨이 상승합니다.',
                    difficulty: '난이도: 높은 레벨일수록 차량 속도, 밀도, 크기가 함께 증가합니다.',
                    goal: '목표: 최대한 많은 레벨을 버티며 최고 거리 기록을 세우세요.'
                },
                leaderboardTitle: '🏆 터보 트래픽 리더보드',
                scoreLabel: '점수(거리)',
                levelLabel: '레벨'
            }
        },
        leaderboard: {
            rank: '순위',
            player: '플레이어',
            points: '총 포인트',
            level: '최고 레벨',
            you: '당신',
            empty: '아직 점수가 없습니다.'
        }
    }
};

function getTranslation(lang = currentLanguage) {
    return translations[lang] || translations.en;
}

function getGameTranslation(gameKey = activeGameKey, lang = currentLanguage) {
    const translation = getTranslation(lang);
    return translation.games[gameKey] || translation.games[GAME_KEYS.CAT];
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ---- Account system ----

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode('coriander-arcade:' + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAccounts() {
    try { return JSON.parse(localStorage.getItem('accounts') || '[]'); } catch { return []; }
}

function saveAccounts(accounts) {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

function getLoggedInUser() {
    return localStorage.getItem('loggedInUser') || null;
}

async function attemptLogin(username, password) {
    const name = username.trim();
    if (!name || !password) return { ok: false, msg: 'Please enter your name and password.' };
    const hash = await hashPassword(password);
    const accounts = getAccounts();
    const account = accounts.find(a => a.username.toLowerCase() === name.toLowerCase());
    if (!account) return { ok: false, msg: 'Account not found. Click "New Account" to create one.' };
    if (account.passwordHash !== hash) return { ok: false, msg: 'Wrong password. Try again.' };
    localStorage.setItem('loggedInUser', account.username);
    return { ok: true };
}

async function attemptCreateAccount(username, password) {
    const name = username.trim();
    if (!name || !password) return { ok: false, msg: 'Please enter a name and password.' };
    if (name.length < 2) return { ok: false, msg: 'Name must be at least 2 characters.' };
    if (password.length < 3) return { ok: false, msg: 'Password must be at least 3 characters.' };
    const hash = await hashPassword(password);
    const accounts = getAccounts();
    const existing = accounts.find(a => a.username.toLowerCase() === name.toLowerCase());
    if (existing) return { ok: false, msg: 'That name is already taken. Sign in instead.' };
    accounts.push({ username: name, passwordHash: hash });
    saveAccounts(accounts);
    localStorage.setItem('loggedInUser', name);
    return { ok: true };
}

function logoutUser() {
    localStorage.removeItem('loggedInUser');
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';
    updatePlayerNameButton();
    updatePlayerPointsBadge();
}

let toastTimerId = null;

function showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast || !message) {
        return;
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimerId) {
        clearTimeout(toastTimerId);
    }

    toastTimerId = setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

function resetAllData() {
    const translation = getTranslation();
    const confirmed = window.confirm(translation.btn.resetConfirm);
    if (!confirmed) {
        return;
    }

    if (window.stopGame) {
        window.stopGame();
    }

    if (window.GameScene && typeof window.GameScene.resetProgress === 'function') {
        window.GameScene.resetProgress();
    }
    if (window.TrafficRunnerScene && typeof window.TrafficRunnerScene.resetProgress === 'function') {
        window.TrafficRunnerScene.resetProgress();
    }

    localStorage.removeItem('leaderboard');
    localStorage.removeItem('accounts');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');

    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.remove('hidden');
    }

    const loginError = document.getElementById('login-error');
    if (loginError) {
        loginError.textContent = '';
    }

    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    if (loginUsername) {
        loginUsername.value = '';
    }
    if (loginPassword) {
        loginPassword.value = '';
    }

    showPage('landing-page');
    updateLeaderboardTable();
    updatePlayerPointsBadge();
    showToast(translation.btn.resetDone);
}

// ---- End account system ----

function generateRandomName() {
    const adjectives = ['Scruffy', 'Shadow', 'Mittens', 'Cuddly', 'Whisker', 'Paws', 'Fizz'];
    const animal = ['Cat', 'Kitten', 'Purr', 'Neko', 'Feline'];
    const rand = Math.floor(100 + Math.random() * 900);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animal[Math.floor(Math.random() * animal.length)]}${rand}`;
}

function generatePlayerId() {
    return `player-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function getPlayerId() {
    const loggedIn = getLoggedInUser();
    if (loggedIn) return 'user-' + loggedIn.toLowerCase().replace(/\s+/g, '-');
    let id = localStorage.getItem('playerId');
    if (!id) {
        id = generatePlayerId();
        localStorage.setItem('playerId', id);
    }
    return id;
}

function getPlayerName() {
    const loggedIn = getLoggedInUser();
    if (loggedIn) return loggedIn;
    const saved = localStorage.getItem('playerName');
    if (saved && saved.trim()) return saved;
    const randomName = generateRandomName();
    localStorage.setItem('playerName', randomName);
    return randomName;
}

function getPlayerAccount() {
    return {
        id: getPlayerId(),
        name: getPlayerName()
    };
}

function setPlayerName(name) {
    const trimmed = name && name.trim();
    if (!trimmed) {
        return;
    }

    localStorage.setItem('playerName', trimmed);
    updatePlayerNameButton();
}

function updatePlayerNameButton() {
    const btn = document.getElementById('player-name-btn');
    if (btn) {
        const playerName = getPlayerName();
        btn.textContent = `👤 ${playerName}`;
        btn.title = playerName;
        btn.onclick = null;
        btn.style.cursor = 'default';
    }

    const signOutBtn = document.getElementById('new-account-btn');
    if (signOutBtn) {
        const translation = getTranslation();
        signOutBtn.textContent = translation.btn.signOut;
    }

    updatePlayerPointsBadge();
}

function getCurrentPlayerPoints() {
    const currentId = getPlayerId();
    const entry = getAllLeaderboardEntries().find(item => item.playerId === currentId);
    if (!entry) {
        return 0;
    }
    return Number(entry.bestScore) || 0;
}

function getCurrentRunScore() {
    if (!window.currentGameInstance) {
        return 0;
    }

    const runValue = Number(document.getElementById('score-value')?.textContent || 0);
    return Number.isFinite(runValue) ? runValue : 0;
}

function updatePlayerPointsBadge() {
    const translation = getTranslation();
    const currentRun = getCurrentRunScore();
    const bestScore = getCurrentPlayerPoints();

    const currentRunBadge = document.getElementById('player-current-run');
    if (currentRunBadge) {
        currentRunBadge.textContent = `${translation.btn.currentRun}: ${currentRun}`;
    }

    const bestScoreBadge = document.getElementById('player-best-score');
    if (bestScoreBadge) {
        bestScoreBadge.textContent = `${translation.btn.bestScore}: ${bestScore}`;
    }

    const currentRunHud = document.getElementById('current-run-hud');
    if (currentRunHud) {
        currentRunHud.innerHTML = `${translation.btn.currentRun}: <span id="current-run-value">${currentRun}</span>`;
    }

    const bestScoreHud = document.getElementById('best-score-hud');
    if (bestScoreHud) {
        bestScoreHud.innerHTML = `${translation.btn.bestScore}: <span id="best-score-value">${bestScore}</span>`;
    }
}

function getAllLeaderboardEntries() {
    const raw = localStorage.getItem('leaderboard');
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        // Migration: older format stored one best row per game; convert into cumulative-per-player rows.
        const isLegacyFormat = parsed.some(entry => entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'game'));
        if (!isLegacyFormat) {
            return parsed;
        }

        const byPlayer = new Map();
        parsed.forEach(entry => {
            if (!entry || !entry.playerId) {
                return;
            }

            const score = Number(entry.score) || 0;
            const level = Number(entry.level) || 0;
            const existing = byPlayer.get(entry.playerId) || {
                playerId: entry.playerId,
                name: entry.name || 'Player',
                totalPoints: 0,
                bestScore: 0,
                level: 1,
                createdAt: entry.createdAt || Date.now(),
                updatedAt: entry.createdAt || Date.now()
            };

            existing.name = entry.name || existing.name;
            existing.totalPoints += Math.max(0, score);
            existing.bestScore = Math.max(existing.bestScore, score);
            existing.level = Math.max(existing.level, level);
            existing.createdAt = Math.min(existing.createdAt || Date.now(), entry.createdAt || Date.now());
            existing.updatedAt = Math.max(existing.updatedAt || 0, entry.createdAt || Date.now());
            byPlayer.set(entry.playerId, existing);
        });

        const migrated = Array.from(byPlayer.values());
        saveAllLeaderboardEntries(migrated);
        return migrated;
    } catch (error) {
        return [];
    }
}

function saveAllLeaderboardEntries(entries) {
    localStorage.setItem('leaderboard', JSON.stringify(entries));
}

function sortEntries(entries) {
    return entries.sort((a, b) => {
        const pointsDiff = (b.totalPoints || 0) - (a.totalPoints || 0);
        if (pointsDiff !== 0) {
            return pointsDiff;
        }

        const bestDiff = (b.bestScore || 0) - (a.bestScore || 0);
        if (bestDiff !== 0) {
            return bestDiff;
        }

        return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

function getLeaderboardEntries() {
    return sortEntries(getAllLeaderboardEntries()).slice(0, 50);
}

function addLeaderboardEntry(name, score, level, playerId = null, gameKey = activeGameKey, pointsEarned = null) {
    const allEntries = getAllLeaderboardEntries();
    const id = playerId || getPlayerId();
    const now = Date.now();
    const normalizedScore = Math.max(0, Number(score) || 0);
    const normalizedLevel = Math.max(1, Number(level) || 1);
    const earned = pointsEarned == null ? normalizedScore : Math.max(0, Number(pointsEarned) || 0);

    const existingIndex = allEntries.findIndex(entry => entry.playerId === id);

    if (existingIndex !== -1) {
        const existing = allEntries[existingIndex];
        allEntries[existingIndex] = {
            ...existing,
            name,
            totalPoints: Math.max(0, Number(existing.totalPoints) || 0) + earned,
            bestScore: Math.max(Number(existing.bestScore) || 0, normalizedScore),
            level: Math.max(Number(existing.level) || 1, normalizedLevel),
            updatedAt: now,
            createdAt: existing.createdAt || now
        };
    } else {
        allEntries.push({
            playerId: id,
            name,
            totalPoints: earned,
            bestScore: normalizedScore,
            level: normalizedLevel,
            createdAt: now,
            updatedAt: now
        });
    }

    saveAllLeaderboardEntries(allEntries);
    updatePlayerPointsBadge();
}

function ensureCurrentPlayerOnLeaderboard() {
    const account = getPlayerAccount();
    const entries = getAllLeaderboardEntries();
    if (entries.some(entry => entry.playerId === account.id)) {
        return;
    }
    addLeaderboardEntry(account.name, 0, 1, account.id, activeGameKey, 0);
}

function seedLeaderboardEntries() {
    ensureCurrentPlayerOnLeaderboard();
}

function setActiveGame(gameKey) {
    if (!GAME_PAGES[gameKey]) {
        return;
    }

    activeGameKey = gameKey;
    window.activeGameKey = gameKey;
    ensureCurrentPlayerOnLeaderboard(gameKey);
    applyLanguage(currentLanguage);
}

function getActiveGameKey() {
    return activeGameKey;
}

function updateLeaderboardTable() {
    const tbody = document.getElementById('leaderboard-list');
    if (!tbody) {
        return;
    }

    const translation = getTranslation();
    const entries = getLeaderboardEntries();
    const currentId = getPlayerId();

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">${translation.leaderboard.empty}</td></tr>`;
        return;
    }

    tbody.innerHTML = entries.map((entry, index) => {
        const highlightClass = entry.playerId === currentId ? 'current-player' : '';
        const rankClass = index < 3 ? ` rank-${index + 1}` : '';
        const displayName = entry.playerId === currentId ? translation.leaderboard.you : entry.name;
        const totalPoints = Number(entry.totalPoints) || 0;
        const bestLevel = Number(entry.level) || 1;
        return `<tr class="${highlightClass}${rankClass}"><td>${index + 1}</td><td>${displayName}</td><td>${totalPoints}</td><td>${bestLevel}</td></tr>`;
    }).join('');

    updatePlayerPointsBadge();
}

function applyGameContent(gameKey, ids, lang = currentLanguage) {
    const game = getGameTranslation(gameKey, lang);
    setText(ids.kicker, game.pageKicker);
    setText(ids.title, game.title);
    setText(ids.copy, game.pageCopy);
    setText(ids.featureOne, game.features[0]);
    setText(ids.featureTwo, game.features[1]);
    setText(ids.featureThree, game.features[2]);
}

function updateRulesAndLeaderboard(lang = currentLanguage) {
    const translation = getTranslation(lang);
    const game = getGameTranslation(activeGameKey, lang);

    setText('rules-header', game.rulesTitle);
    setText('rule-objective', game.rules.objective);
    setText('rule-controls', game.rules.controls);
    setText('rule-platforms', game.rules.platforms);
    setText('rule-enemies', game.rules.enemies);
    setText('rule-lives', game.rules.lives);
    setText('rule-scoring', game.rules.scoring);
    setText('rule-difficulty', game.rules.difficulty);
    setText('rule-goal', game.rules.goal);

    setText('leaderboard-header', game.leaderboardTitle);
    document.querySelectorAll('[data-i18n="leaderboard.rank"]').forEach(el => { el.textContent = translation.leaderboard.rank; });
    document.querySelectorAll('[data-i18n="leaderboard.player"]').forEach(el => { el.textContent = translation.leaderboard.player; });
    document.querySelectorAll('[data-i18n="leaderboard.score"]').forEach(el => { el.textContent = translation.leaderboard.points; });
    document.querySelectorAll('[data-i18n="leaderboard.level"]').forEach(el => { el.textContent = translation.leaderboard.level; });

    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const speedEl = document.getElementById('speed');
    if (scoreEl && !window.currentGameInstance) {
        scoreEl.innerHTML = `${game.scoreLabel}: <span id="score-value">0</span>`;
    }
    if (levelEl && !window.currentGameInstance) {
        levelEl.innerHTML = `${game.levelLabel}: <span id="level-value">1</span>`;
    }
    if (speedEl) {
        const speedLabel = lang === 'zh-CN' ? '速度' : (lang === 'ko-KR' ? '속도' : 'Speed');
        const currentSpeedValue = document.getElementById('speed-value')?.textContent || '0';
        speedEl.innerHTML = `${speedLabel}: <span id="speed-value">${currentSpeedValue}</span>`;
    }
}

function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    const translation = getTranslation(lang);

    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = lang;
    }

    document.title = `${translation.hub.title} | ${getGameTranslation(activeGameKey, lang).title}`;

    setText('hub-kicker', translation.hub.kicker);
    setText('hub-title', translation.hub.title);
    setText('hub-copy', translation.hub.copy);
    setText('games-section-title', translation.hub.gamesTitle);
    setText('games-section-copy', translation.hub.gamesCopy);

    setText('cat-card-status', translation.hub.catCard.status);
    setText('cat-card-title', translation.hub.catCard.title);
    setText('cat-card-copy', translation.hub.catCard.copy);
    setText('cat-card-genre', translation.hub.catCard.genre);
    setText('cat-card-players', translation.hub.catCard.players);

    setText('car-card-status', translation.hub.carCard.status);
    setText('car-card-title', translation.hub.carCard.title);
    setText('car-card-copy', translation.hub.carCard.copy);
    setText('car-card-genre', translation.hub.carCard.genre);
    setText('car-card-players', translation.hub.carCard.players);

    setText('coming-soon-status', translation.hub.comingSoon.status);
    setText('coming-soon-title', translation.hub.comingSoon.title);
    setText('coming-soon-copy', translation.hub.comingSoon.copy);

    applyGameContent(GAME_KEYS.CAT, {
        kicker: 'game-page-kicker',
        title: 'cat-page-title',
        copy: 'cat-page-copy',
        featureOne: 'cat-feature-difficulty',
        featureTwo: 'cat-feature-goal',
        featureThree: 'cat-feature-score'
    }, lang);

    applyGameContent(GAME_KEYS.CAR, {
        kicker: 'car-page-kicker',
        title: 'car-page-title',
        copy: 'car-page-copy',
        featureOne: 'car-feature-lanes',
        featureTwo: 'car-feature-speed',
        featureThree: 'car-feature-score'
    }, lang);

    document.querySelectorAll('[data-i18n="btn.rules"]').forEach(el => { el.textContent = translation.btn.rules; });
    document.querySelectorAll('[data-i18n="btn.play"]').forEach(el => { el.textContent = translation.btn.play; });
    document.querySelectorAll('[data-i18n="btn.back"]').forEach(el => { el.textContent = translation.btn.back; });
    document.querySelectorAll('.open-game-btn').forEach(el => { el.textContent = translation.btn.openGame; });
    document.querySelectorAll('.games-hub-btn').forEach(el => { el.textContent = translation.btn.allGames; });

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.textContent = translation.btn.leaderboard;
    }

    const signOutBtn = document.getElementById('new-account-btn');
    if (signOutBtn) {
        signOutBtn.textContent = translation.btn.signOut;
    }

    const resetDataBtn = document.getElementById('reset-data-btn');
    if (resetDataBtn) {
        resetDataBtn.textContent = translation.btn.resetData;
    }

    updatePlayerPointsBadge();

    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.textContent = translation.btn.home;
    }

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = isGamePaused ? translation.btn.resume : translation.btn.pause;
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.textContent = translation.btn.restart;
    }

    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
        stopBtn.textContent = translation.btn.stop;
    }

    updatePlayerNameButton();
    updateRulesAndLeaderboard(lang);
    updateLeaderboardTable();

    if (window.GameScene && typeof window.GameScene.setLanguage === 'function') {
        window.GameScene.setLanguage(lang);
    }
    if (window.TrafficRunnerScene && typeof window.TrafficRunnerScene.setLanguage === 'function') {
        window.TrafficRunnerScene.setLanguage(lang);
    }

    if (window.currentGameInstance && window.currentGameInstance.scene) {
        const runningKey = window.currentRunningGameKey;
        const sceneName = runningKey === GAME_KEYS.CAR ? 'TrafficRunnerScene' : 'GameScene';
        const scene = window.currentGameInstance.scene.getScene(sceneName);
        if (scene && typeof scene.updateHUD === 'function') {
            scene.updateHUD();
        }
    }
}

function getActivePageName() {
    const activePage = document.querySelector('.page.active');
    return activePage ? activePage.id : 'landing-page';
}

function isTouchDevice() {
    if (typeof window === 'undefined') {
        return false;
    }

    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        return true;
    }

    return (navigator.maxTouchPoints || 0) > 0;
}

function resetTouchInputs() {
    touchInputState.leftPressed = false;
    touchInputState.rightPressed = false;
    touchInputState.jumpQueued = false;
    touchInputState.laneLeftQueued = false;
    touchInputState.laneRightQueued = false;

    ['touch-left-btn', 'touch-right-btn', 'touch-jump-btn'].forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.classList.remove('touch-active');
        }
    });
}

function updateTouchControls(gameKey = activeGameKey) {
    const touchControls = document.getElementById('touch-controls');
    const jumpButton = document.getElementById('touch-jump-btn');
    const helperLabel = document.getElementById('touch-helper');
    if (!touchControls || !jumpButton || !helperLabel) {
        return;
    }

    const shouldShow = getActivePageName() === 'game-page';
    touchInputState.enabled = shouldShow;
    touchInputState.gameKey = gameKey;
    touchControls.classList.toggle('hidden', !shouldShow);
    touchControls.dataset.game = gameKey;

    if (gameKey === GAME_KEYS.CAT) {
        jumpButton.hidden = false;
        jumpButton.textContent = 'JUMP';
        jumpButton.setAttribute('aria-label', 'Jump');
        helperLabel.textContent = 'Hold direction to move';
    } else {
        jumpButton.hidden = true;
        helperLabel.textContent = 'Tap left or right to switch lanes';
    }

    if (!shouldShow) {
        resetTouchInputs();
    }
}

function initializeTouchControls() {
    const leftButton = document.getElementById('touch-left-btn');
    const rightButton = document.getElementById('touch-right-btn');
    const jumpButton = document.getElementById('touch-jump-btn');

    if (!leftButton || !rightButton || !jumpButton) {
        return;
    }

    const setHoldState = (direction, pressed) => {
        if (!touchInputState.enabled || touchInputState.gameKey !== GAME_KEYS.CAT) {
            return;
        }

        if (direction === 'left') {
            touchInputState.leftPressed = pressed;
            leftButton.classList.toggle('touch-active', pressed);
        } else {
            touchInputState.rightPressed = pressed;
            rightButton.classList.toggle('touch-active', pressed);
        }
    };

    const queueLaneMove = direction => {
        if (!touchInputState.enabled || touchInputState.gameKey !== GAME_KEYS.CAR) {
            return;
        }

        if (direction === 'left') {
            touchInputState.laneLeftQueued = true;
            leftButton.classList.add('touch-active');
            window.setTimeout(() => leftButton.classList.remove('touch-active'), 110);
        } else {
            touchInputState.laneRightQueued = true;
            rightButton.classList.add('touch-active');
            window.setTimeout(() => rightButton.classList.remove('touch-active'), 110);
        }
    };

    const bindPressableButton = (button, handlers) => {
        const cancel = () => handlers.onCancel();

        const onPress = event => {
            event.preventDefault();
            handlers.onPress();
        };

        const onRelease = event => {
            event.preventDefault();
            handlers.onRelease();
        };

        if (window.PointerEvent) {
            button.addEventListener('pointerdown', onPress);
            button.addEventListener('pointerup', onRelease);
            button.addEventListener('pointercancel', cancel);
            button.addEventListener('pointerleave', cancel);
            return;
        }

        // Legacy fallback for browsers without Pointer Events.
        button.addEventListener('touchstart', onPress, { passive: false });
        button.addEventListener('touchend', onRelease, { passive: false });
        button.addEventListener('touchcancel', cancel, { passive: false });
        button.addEventListener('mousedown', onPress);
        button.addEventListener('mouseup', onRelease);
        button.addEventListener('mouseleave', cancel);
    };

    bindPressableButton(leftButton, {
        onPress: () => {
            if (touchInputState.gameKey === GAME_KEYS.CAT) {
                setHoldState('left', true);
                return;
            }

            queueLaneMove('left');
        },
        onRelease: () => setHoldState('left', false),
        onCancel: () => setHoldState('left', false)
    });

    bindPressableButton(rightButton, {
        onPress: () => {
            if (touchInputState.gameKey === GAME_KEYS.CAT) {
                setHoldState('right', true);
                return;
            }

            queueLaneMove('right');
        },
        onRelease: () => setHoldState('right', false),
        onCancel: () => setHoldState('right', false)
    });

    bindPressableButton(jumpButton, {
        onPress: () => {
            if (!touchInputState.enabled || touchInputState.gameKey !== GAME_KEYS.CAT) {
                return;
            }

            touchInputState.jumpQueued = true;
            jumpButton.classList.add('touch-active');
        },
        onRelease: () => jumpButton.classList.remove('touch-active'),
        onCancel: () => jumpButton.classList.remove('touch-active')
    });

    window.ArcadeTouchControls = {
        isLeftActive: () => touchInputState.enabled && touchInputState.gameKey === GAME_KEYS.CAT && touchInputState.leftPressed,
        isRightActive: () => touchInputState.enabled && touchInputState.gameKey === GAME_KEYS.CAT && touchInputState.rightPressed,
        consumeJump: () => {
            const shouldJump = touchInputState.enabled && touchInputState.gameKey === GAME_KEYS.CAT && touchInputState.jumpQueued;
            touchInputState.jumpQueued = false;
            return shouldJump;
        },
        consumeLaneLeft: () => {
            const shouldMove = touchInputState.enabled && touchInputState.gameKey === GAME_KEYS.CAR && touchInputState.laneLeftQueued;
            touchInputState.laneLeftQueued = false;
            return shouldMove;
        },
        consumeLaneRight: () => {
            const shouldMove = touchInputState.enabled && touchInputState.gameKey === GAME_KEYS.CAR && touchInputState.laneRightQueued;
            touchInputState.laneRightQueued = false;
            return shouldMove;
        },
        reset: resetTouchInputs,
        updateForGame: updateTouchControls
    };
}

function showPage(pageName) {
    const currentPage = getActivePageName();
    if ((pageName === 'rules' || pageName === 'leaderboard') && currentPage !== pageName) {
        overlayReturnPage = currentPage;
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
    }

    if (pageName === 'leaderboard') {
        updateRulesAndLeaderboard();
        updateLeaderboardTable();
    }

    updateTouchControls(window.currentRunningGameKey || activeGameKey);
}

function resetGameState(gameKey) {
    if (gameKey === GAME_KEYS.CAT && window.GameScene && typeof window.GameScene.resetProgress === 'function') {
        window.GameScene.resetProgress();
    }
    if (gameKey === GAME_KEYS.CAR && window.TrafficRunnerScene && typeof window.TrafficRunnerScene.resetProgress === 'function') {
        window.TrafficRunnerScene.resetProgress();
    }
}

function returnHome() {
    const runningGameKey = window.currentRunningGameKey || activeGameKey;
    resetGameState(runningGameKey);

    if (window.stopGame) {
        window.stopGame();
    }

    isGamePaused = false;
    resetTouchInputs();

    updateRulesAndLeaderboard();
    showPage('landing-page');
}

function getRunningSceneName() {
    const runningGameKey = window.currentRunningGameKey || activeGameKey;
    return runningGameKey === GAME_KEYS.CAR ? 'TrafficRunnerScene' : 'GameScene';
}

function pauseOrResumeGame() {
    if (!window.currentGameInstance || !window.currentGameInstance.scene) {
        return;
    }

    const sceneName = getRunningSceneName();

    if (!isGamePaused) {
        window.currentGameInstance.scene.pause(sceneName);
        isGamePaused = true;
    } else {
        window.currentGameInstance.scene.resume(sceneName);
        isGamePaused = false;
    }

    applyLanguage(currentLanguage);
}

function stopCurrentRun() {
    const runningGameKey = window.currentRunningGameKey || activeGameKey;
    resetGameState(runningGameKey);

    if (window.stopGame) {
        window.stopGame();
    }

    isGamePaused = false;
    resetTouchInputs();
    showPage(GAME_PAGES[runningGameKey] || 'landing-page');
    applyLanguage(currentLanguage);
}

function restartCurrentRun() {
    const runningGameKey = window.currentRunningGameKey || activeGameKey;
    resetGameState(runningGameKey);

    if (window.stopGame) {
        window.stopGame();
    }

    isGamePaused = false;
    resetTouchInputs();
    showPage('game-page');

    if (window.startGame) {
        window.startGame(runningGameKey);
    }

    applyLanguage(currentLanguage);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTouchControls();

    document.querySelectorAll('.open-game-btn').forEach(button => {
        button.addEventListener('click', () => {
            const gameKey = button.dataset.game;
            setActiveGame(gameKey);
            showPage(GAME_PAGES[gameKey]);
        });
    });

    document.querySelectorAll('.games-hub-btn').forEach(button => {
        button.addEventListener('click', () => {
            showPage('landing-page');
        });
    });

    document.querySelectorAll('.play-game-btn').forEach(button => {
        button.addEventListener('click', () => {
            const gameKey = button.dataset.game;
            setActiveGame(gameKey);
            showPage('game-page');
            isGamePaused = false;
            if (window.startGame) {
                window.startGame(gameKey);
            }
            applyLanguage(currentLanguage);
        });
    });

    document.querySelectorAll('.rules-btn').forEach(button => {
        button.addEventListener('click', () => {
            const gameKey = button.dataset.game;
            setActiveGame(gameKey);
            showPage('rules');
        });
    });

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            showPage('leaderboard');
        });
    }

    document.querySelectorAll('#rules .back-btn, #leaderboard .back-btn').forEach(button => {
        button.addEventListener('click', () => {
            showPage(overlayReturnPage || 'landing-page');
        });
    });

    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLanguage;
        languageSelector.addEventListener('change', () => {
            applyLanguage(languageSelector.value);
        });
    }

    // Login overlay wiring
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginCreateBtn = document.getElementById('login-create-btn');
    const loginOverlay = document.getElementById('login-overlay');

    async function handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        const result = await attemptLogin(username, password);
        if (result.ok) {
            loginOverlay.classList.add('hidden');
            updatePlayerNameButton();
            seedLeaderboardEntries();
            updateLeaderboardTable();
        } else {
            errorEl.textContent = result.msg;
        }
    }

    async function handleCreateAccount() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        const result = await attemptCreateAccount(username, password);
        if (result.ok) {
            loginOverlay.classList.add('hidden');
            updatePlayerNameButton();
            seedLeaderboardEntries();
            updateLeaderboardTable();
        } else {
            errorEl.textContent = result.msg;
        }
    }

    if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', handleLogin);
    if (loginCreateBtn) loginCreateBtn.addEventListener('click', handleCreateAccount);

    // Allow Enter key to submit
    document.getElementById('login-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('login-username').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });

    // Check if already logged in
    if (!getLoggedInUser()) {
        loginOverlay.classList.remove('hidden');
    } else {
        loginOverlay.classList.add('hidden');
    }

    updatePlayerNameButton();
    seedLeaderboardEntries();
    updatePlayerPointsBadge();

    if (scoreSyncIntervalId) {
        clearInterval(scoreSyncIntervalId);
    }
    scoreSyncIntervalId = setInterval(() => {
        updatePlayerPointsBadge();
    }, 200);

    const signOutBtn = document.getElementById('new-account-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            logoutUser();
        });
    }

    const resetDataBtn = document.getElementById('reset-data-btn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            resetAllData();
        });
    }

    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            returnHome();
        });
    }

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            pauseOrResumeGame();
        });
    }

    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            stopCurrentRun();
        });
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            restartCurrentRun();
        });
    }

    applyLanguage(currentLanguage);
});

window.addLeaderboardEntry = addLeaderboardEntry;
window.getActiveGameKey = getActiveGameKey;
window.Navigation = {
    showPage,
    returnHome,
    setActiveGame,
    getActiveGameKey,
    pauseOrResumeGame,
    stopCurrentRun,
    restartCurrentRun
};
