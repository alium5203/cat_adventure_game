// Navigation system for the game
let gameInstance = null;

const translations = {
    en: {
        btn: { rules: '📖 Rules', play: '▶ Play', back: '← Back', home: '🏠 Home', leaderboard: '🏆 Leaderboard', playerName: 'Name', playerNameHint: ' (click to change)', newAccount: '✚ New Account' },
        title: 'Cat Adventure',
        rules: {
            title: 'Game Rules 📋',
            objective: 'Objective: Guide your cat through increasingly difficult levels to reach the goal door.',
            controls: 'Controls: Use WASD or Arrow Keys to move left/right and jump.',
            platforms: 'Platforms: Jump across platforms to reach higher areas and avoid falling.',
            enemies: 'Enemies: Ground enemies walk back and forth, flying enemies hover in the sky. Touching any enemy costs a life.',
            lives: 'Lives: You start with 3 lives. Lose all 3 and it’s game over! Each new level resets your lives to 3.',
            scoring: 'Scoring: Earn 100 points each level. High score wins!',
            difficulty: 'Difficulty: Each level gets harder with more enemies and narrower platforms.',
            goal: 'Goal: Reach the golden door at the end of each level to advance.'
        },
        leaderboard: { title: '🏆 Leaderboard', rank: 'Rank', player: 'Player', score: 'Score', level: 'Level', you: 'You' }
    },
    'zh-CN': {
        btn: { rules: '📖 规则', play: '▶ 开始', back: '← 返回', home: '🏠 首页', leaderboard: '🏆 排行榜', playerName: '名字', playerNameHint: '（点击更改）', newAccount: '✚ 新账号' },
        title: '猫咪冒险',
        rules: {
            title: '游戏规则 📋',
            objective: '目标：引导您的猫通过越来越困难的关卡，达到终点门。',
            controls: '操作：使用 WASD 或方向键左右移动和跳跃。',
            platforms: '平台：跳过平台以到达更高区域并避免跌落。',
            enemies: '敌人：地面敌人来回移动，飞行敌人悬浮在空中。触碰敌人会失去一条生命。',
            lives: '生命：您开始时有 3 条生命。失去所有生命即游戏结束！每个新关卡生命重置为 3。',
            scoring: '得分：每通过一关获得 100 分。争取最高分！',
            difficulty: '难度：每个关卡难度逐渐增加，敌人更多，平台更狭窄。',
            goal: '目标：达到每个关卡末端的金门以进入下一关。'
        },
        leaderboard: { title: '🏆 排行榜', rank: '排名', player: '玩家', score: '得分', level: '关卡', you: '你' }
    },
    'ko-KR': {
        btn: { rules: '📖 규칙', play: '▶ 플레이', back: '← 뒤로', home: '🏠 홈', leaderboard: '🏆 리더보드', playerName: '이름', playerNameHint: ' (클릭하여 변경)', newAccount: '✚ 새 계정' },
        title: '고양이 모험',
        rules: {
            title: '게임 규칙 📋',
            objective: '목표: 고양이를 어려워지는 단계로 이끌어 골문에 도달하세요.',
            controls: '조작: WASD 또는 방향키로 이동 및 점프하세요.',
            platforms: '플랫폼: 플랫폼을 뛰어넘어 높은 곳으로 이동하고 낙사를 피하세요.',
            enemies: '적: 땅 적은 좌우로 이동하고, 비행 적은 하늘을 떠다닙니다. 접촉 시 목숨을 잃습니다.',
            lives: '생명: 3개의 목숨으로 시작합니다. 모두 잃으면 게임 오버! 매 레벨마다 3으로 초기화됩니다.',
            scoring: '점수: 레벨 당 100점을 얻습니다. 최고 점수를 노리세요!',
            difficulty: '난이도: 레벨이 올라갈수록 적과 플랫폼이 어려워집니다.',
            goal: '목표: 각 레벨의 금문에 도달하여 다음 레벨로 이동하세요.'
        },
        leaderboard: { title: '🏆 리더보드', rank: '순위', player: '플레이어', score: '점수', level: '레벨', you: '당신' }
    }
};

function generateRandomName() {
    const adjectives = ['Scruffy', 'Shadow', 'Mittens', 'Cuddly', 'Whisker', 'Paws', 'Fizz'];
    const animal = ['Cat', 'Kitten', 'Purr', 'Neko', 'Feline'];
    const rand = Math.floor(100 + Math.random() * 900);
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animal[Math.floor(Math.random() * animal.length)]}${rand}`;
    return name;
}

function generatePlayerId() {
    return 'player-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}

function getPlayerId() {
    let id = localStorage.getItem('playerId');
    if (!id) {
        id = generatePlayerId();
        localStorage.setItem('playerId', id);
    }
    return id;
}

function getPlayerAccount() {
    return {
        id: getPlayerId(),
        name: getPlayerName()
    };
}

function getPlayerName() {
    const saved = localStorage.getItem('playerName');
    if (saved && saved.trim().length > 0) {
        return saved;
    }
    const randomName = generateRandomName();
    localStorage.setItem('playerName', randomName);
    return randomName;
}

function setPlayerName(name) {
    const trimmed = name && name.trim();
    if (!trimmed) return;
    localStorage.setItem('playerName', trimmed);
    const btn = document.getElementById('player-name-btn');
    const translation = translations[localStorage.getItem('selectedLanguage')] || translations.en;
    if (btn) {
        btn.textContent = `${translation.btn.playerName}: ${trimmed}${translation.btn.playerNameHint}`;
        btn.title = `${translation.btn.playerName} ${trimmed}. ${translation.btn.playerNameHint}`;
    }
}

function updatePlayerNameButton() {
    const btn = document.getElementById('player-name-btn');
    if (!btn) return;
    const playerName = getPlayerName();
    const translation = translations[localStorage.getItem('selectedLanguage')] || translations.en;
    btn.textContent = `${translation.btn.playerName}: ${playerName}${translation.btn.playerNameHint}`;
    btn.title = `${translation.btn.playerName} ${playerName}. ${translation.btn.playerNameHint}`;
    btn.addEventListener('click', () => {
        const newName = prompt('Enter your player name:', playerName);
        if (newName && newName.trim().length > 0) {
            setPlayerName(newName);
            updateLeaderboardTable();
        }
    });
}

function getLeaderboardEntries() {
    const raw = localStorage.getItem('leaderboard');
    let entries = [];
    if (raw) {
        try { entries = JSON.parse(raw); } catch (e) { entries = []; }
    }
    if (!Array.isArray(entries)) entries = [];
    return entries;
}

function saveLeaderboardEntries(entries) {
    localStorage.setItem('leaderboard', JSON.stringify(entries));
}

function addLeaderboardEntry(name, score, level, playerId = null) {
    const entries = getLeaderboardEntries();
    const id = playerId || getPlayerId();
    const now = Date.now();

    // Update existing player entry if present
    const existingIndex = entries.findIndex(entry => entry.playerId === id);
    if (existingIndex !== -1) {
        const existing = entries[existingIndex];
        const updated = {
            playerId: id,
            name,
            score: existing.score,
            level: existing.level,
            createdAt: existing.createdAt || now
        };

        if (score > existing.score || (score === existing.score && level > existing.level)) {
            updated.score = score;
            updated.level = level;
        }

        entries[existingIndex] = updated;
    } else {
        entries.push({ playerId: id, name, score, level, createdAt: now });
    }

    entries.sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;

        const levelDiff = (b.level || 0) - (a.level || 0);
        if (levelDiff !== 0) return levelDiff;

        return (a.createdAt || 0) - (b.createdAt || 0);
    });
    const top = entries.slice(0, 10); // keep top 10 for leaderboard
    saveLeaderboardEntries(top);
}

function ensureCurrentPlayerOnLeaderboard() {
    const account = getPlayerAccount();
    addLeaderboardEntry(account.name, 0, 1, account.id);
}

function updateLeaderboardTable() {
    const entries = getLeaderboardEntries();
    const tbody = document.getElementById('leaderboard-list');
    if (!tbody) return;
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const translation = translations[lang] || translations.en;
    let html = '';
    if (entries.length === 0) {
        html = '<tr><td colspan="4">No scores yet.</td></tr>';
    } else {
        const currentId = getPlayerId();
        entries.forEach((entry, index) => {
            const highlightClass = entry.playerId === currentId ? 'current-player' : '';
            const rankClass = index < 3 ? ` rank-${index + 1}` : '';
            const displayName = entry.playerId === currentId ? translation.leaderboard.you : entry.name;
            html += `<tr class="${highlightClass}${rankClass}"><td>${index+1}</td><td>${displayName}</td><td>${entry.score}</td><td>${entry.level}</td></tr>`;
        });
    }
    tbody.innerHTML = html;
}

function applyLanguage(lang) {
    const translation = translations[lang] || translations.en;

    // Save language to localStorage
    localStorage.setItem('selectedLanguage', lang);

    // Update the language selector to reflect the current language
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = lang;
    }

    document.title = translation.title;
    const pageTitle = document.querySelector('.game-title');
    if (pageTitle) pageTitle.innerText = translation.title;

    const tl = selector => document.querySelectorAll(`[data-i18n="${selector}"]`);

    tl('btn.rules').forEach(el => { if (el.textContent !== undefined) el.textContent = translation.btn.rules; });
    tl('btn.play').forEach(el => { if (el.textContent !== undefined) el.textContent = translation.btn.play; });
    tl('btn.back').forEach(el => { if (el.textContent !== undefined) el.textContent = translation.btn.back; });
    const homeBtnEl = document.getElementById('home-btn');
    if (homeBtnEl) homeBtnEl.textContent = translation.btn.home;

    const rulesHeader = document.getElementById('rules-header');
    if (rulesHeader) rulesHeader.textContent = translation.rules.title;
    const ruleMap = {
        'rule-objective': translation.rules.objective,
        'rule-controls': translation.rules.controls,
        'rule-platforms': translation.rules.platforms,
        'rule-enemies': translation.rules.enemies,
        'rule-lives': translation.rules.lives,
        'rule-scoring': translation.rules.scoring,
        'rule-difficulty': translation.rules.difficulty,
        'rule-goal': translation.rules.goal
    };
    Object.keys(ruleMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = ruleMap[id];
    });

    const lb = translation.leaderboard;
    const lbHeader = document.getElementById('leaderboard-header');
    if (lbHeader) lbHeader.textContent = lb.title;
    document.querySelectorAll('[data-i18n="leaderboard.rank"]').forEach(el => el.textContent = lb.rank);
    document.querySelectorAll('[data-i18n="leaderboard.player"]').forEach(el => el.textContent = lb.player);
    document.querySelectorAll('[data-i18n="leaderboard.score"]').forEach(el => el.textContent = lb.score);
    document.querySelectorAll('[data-i18n="leaderboard.level"]').forEach(el => el.textContent = lb.level);

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) leaderboardBtn.textContent = translation.btn.leaderboard;

    const newAccountBtn = document.getElementById('new-account-btn');
    if (newAccountBtn) newAccountBtn.textContent = translation.btn.newAccount;

    const playerNameBtn = document.getElementById('player-name-btn');
    const playerName = getPlayerName();
    if (playerNameBtn) {
        playerNameBtn.textContent = `${translation.btn.playerName}: ${playerName}${translation.btn.playerNameHint}`;
        playerNameBtn.title = `${translation.btn.playerName} ${playerName}. ${translation.btn.playerNameHint}`;
    }

    if (window.GameScene && typeof GameScene.setLanguage === 'function') {
        GameScene.setLanguage(lang);
        // If game is running, update the HUD immediately
        if (window.currentGameInstance && window.currentGameInstance.scene) {
            const gameScene = window.currentGameInstance.scene.getScene('GameScene');
            if (gameScene && typeof gameScene.updateHUD === 'function') {
                gameScene.updateHUD();
            }
        }
    }
}

// Show a specific page and hide others
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');

        if (pageName === 'leaderboard') {
            updateLeaderboardTable();
        }
    }
}

// Initialize navigation buttons
document.addEventListener('DOMContentLoaded', function() {
    // Play button
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            showPage('game-page');
            // Start the game
            if (window.startGame) {
                window.startGame();
            }
        });
    }
    
    // Rules button
    const rulesBtn = document.getElementById('rules-btn');
    if (rulesBtn) {
        rulesBtn.addEventListener('click', function() {
            showPage('rules');
        });
    }
    
    // Leaderboard button
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', function() {
            showPage('leaderboard');
        });
    }
    
    // Back buttons
    const backBtns = document.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showPage('homepage');
        });
    });
    
    // Language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        // Load language from localStorage, default to 'en'
        window.selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        languageSelector.value = window.selectedLanguage;
        applyLanguage(window.selectedLanguage);

        languageSelector.addEventListener('change', function() {
            window.selectedLanguage = languageSelector.value;
            applyLanguage(window.selectedLanguage);
            console.log('Selected language:', window.selectedLanguage);
        });
    }

    // Player name button
    updatePlayerNameButton();
    ensureCurrentPlayerOnLeaderboard();

    const newAccountBtn = document.getElementById('new-account-btn');
    if (newAccountBtn) {
        newAccountBtn.addEventListener('click', () => {
            localStorage.removeItem('playerId');
            localStorage.removeItem('playerName');
            updatePlayerNameButton();
            ensureCurrentPlayerOnLeaderboard();
            updateLeaderboardTable();
        });
    }

    // Ensure leaderboard table is always up to date whenever user visits the leaderboard page
    updateLeaderboardTable();

    // Home button in game
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            returnHome();
        });
    }
});

// Function to return home from game
function returnHome() {
    // Pause and reset game
    if (window.stopGame) {
        window.stopGame();
    }

    // Reset game state
    GameScene.currentLevel = 1;
    GameScene.currentScore = 0;
    GameScene.currentLives = 3;

    // Update UI
    const scoreEl = document.getElementById('score-value');
    const levelEl = document.getElementById('level-value');
    if (scoreEl) scoreEl.innerText = '0';
    if (levelEl) levelEl.innerText = '1';

    // Show homepage
    showPage('homepage');
}

// Export for use in other scripts
window.Navigation = {
    showPage,
    returnHome
};
