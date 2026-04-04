// Navigation system for the game
let gameInstance = null;

const translations = {
    en: {
        btn: { rules: '📖 Rules', play: '▶ Play', big2: '🃏 Big 2', openGame: 'Open Game', back: '← Back', home: '🏠 Home', leaderboard: '🏆 Leaderboard', playerName: 'Name', playerNameHint: ' (click to change)', newAccount: '✚ New Account' },
        hub: {
            kicker: 'Game Portal',
            title: 'Coriander Arcade',
            copy: 'Five games, one hub. Pick your challenge.',
            cards: {
                cat: {
                    status: 'Live Now',
                    title: 'Cat Adventure',
                    copy: 'Jump through stacked platforms, dodge enemies, and reach the golden door to clear each level.',
                    genre: 'Platformer',
                    players: '1 Player'
                },
                car: {
                    status: 'Live Now',
                    title: 'Turbo Traffic',
                    copy: 'Slide across three lanes, dodge oncoming traffic, and stack up the longest distance you can survive.',
                    genre: 'Endless Runner',
                    players: '1 Player'
                },
                shooter: {
                    status: 'Live Now',
                    title: 'Star Paws Shooter',
                    copy: 'Blast waves of alien enemies, level up, and see how long your crew can hold the line.',
                    genre: 'Space Shooter',
                    players: '1 Player'
                },
                big2: {
                    status: 'Live Now',
                    title: 'Big 2',
                    copy: 'The classic Chinese card game - play combos, beat the table, and be the first to empty your hand.',
                    genre: 'Card Game',
                    players: '2-4 Players'
                },
                tossing: {
                    status: 'Live Now',
                    title: 'Sky Toss',
                    copy: 'Charge your throw, fight the wind, and land tosses into moving buckets for big points.',
                    genre: 'Arcade Toss',
                    players: '1 Player'
                },
                race: {
                    status: 'Live Now',
                    title: 'Two People Race',
                    copy: 'Two players race side by side. Mash your key or tap your side to sprint to the finish first.',
                    genre: 'Head-to-Head',
                    players: '2 Players'
                }
            }
        },
        big2: { pageTitle: '🃏 Big 2' },
        common: { noScoresYet: 'No scores yet.', enterPlayerName: 'Enter your player name:' },
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
        btn: { rules: '📖 规则', play: '▶ 开始', big2: '🃏 大老二', openGame: '开始游戏', back: '← 返回', home: '🏠 首页', leaderboard: '🏆 排行榜', playerName: '名字', playerNameHint: '（点击更改）', newAccount: '✚ 新账号' },
        hub: {
            kicker: '游戏大厅',
            title: 'Coriander Arcade',
            copy: '五款游戏，一个中心。选择你的挑战。',
            cards: {
                cat: {
                    status: '正在开放',
                    title: '猫咪冒险',
                    copy: '在层层平台间跳跃，躲避敌人，到达金色大门通关每一关。',
                    genre: '平台跳跃',
                    players: '1 名玩家'
                },
                car: {
                    status: '正在开放',
                    title: '极速车流',
                    copy: '在三条车道间切换，躲开迎面车辆，尽可能坚持更远距离。',
                    genre: '无尽奔跑',
                    players: '1 名玩家'
                },
                shooter: {
                    status: '正在开放',
                    title: '星爪射手',
                    copy: '击退一波波外星敌人，提升等级，看看你能坚持多久。',
                    genre: '太空射击',
                    players: '1 名玩家'
                },
                big2: {
                    status: '正在开放',
                    title: '大老二',
                    copy: '经典中文纸牌游戏，出组合压制牌面，最先出完手牌获胜。',
                    genre: '纸牌游戏',
                    players: '2-4 名玩家'
                },
                tossing: {
                    status: '正在开放',
                    title: '天空投掷',
                    copy: '按住蓄力，对抗风力，把投掷物投进移动桶中获得高分。',
                    genre: '街机投掷',
                    players: '1 名玩家'
                },
                race: {
                    status: '正在开放',
                    title: '双人竞速',
                    copy: '两位玩家并排竞速。狂按按键或点击自己一侧，率先冲线获胜。',
                    genre: '对战竞速',
                    players: '2 名玩家'
                }
            }
        },
        big2: { pageTitle: '🃏 大老二' },
        common: { noScoresYet: '还没有分数记录。', enterPlayerName: '请输入你的玩家名字：' },
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
        btn: { rules: '📖 규칙', play: '▶ 플레이', big2: '🃏 빅투', openGame: '게임 열기', back: '← 뒤로', home: '🏠 홈', leaderboard: '🏆 리더보드', playerName: '이름', playerNameHint: ' (클릭하여 변경)', newAccount: '✚ 새 계정' },
        hub: {
            kicker: '게임 포털',
            title: 'Coriander Arcade',
            copy: '다섯 가지 게임, 하나의 허브. 도전을 선택하세요.',
            cards: {
                cat: {
                    status: '지금 플레이',
                    title: '고양이 모험',
                    copy: '겹겹의 발판을 점프하고 적을 피하며 황금 문에 도달해 스테이지를 클리어하세요.',
                    genre: '플랫포머',
                    players: '1인 플레이'
                },
                car: {
                    status: '지금 플레이',
                    title: '터보 트래픽',
                    copy: '세 개 차선을 오가며 차량을 피하고, 가능한 한 오래 생존 거리를 늘리세요.',
                    genre: '엔드리스 러너',
                    players: '1인 플레이'
                },
                shooter: {
                    status: '지금 플레이',
                    title: '스타 포즈 슈터',
                    copy: '외계 적 물결을 격파하고 레벨업하며, 팀이 얼마나 오래 버티는지 도전하세요.',
                    genre: '우주 슈팅',
                    players: '1인 플레이'
                },
                big2: {
                    status: '지금 플레이',
                    title: '빅투',
                    copy: '클래식 카드 게임에서 조합을 내고 판을 이기며, 가장 먼저 손패를 비우세요.',
                    genre: '카드 게임',
                    players: '2-4인 플레이'
                },
                tossing: {
                    status: '지금 플레이',
                    title: '스카이 토스',
                    copy: '차지 후 바람을 이겨 움직이는 버킷에 던져 높은 점수를 얻으세요.',
                    genre: '아케이드 토스',
                    players: '1인 플레이'
                },
                race: {
                    status: '지금 플레이',
                    title: '2인 레이스',
                    copy: '두 플레이어가 나란히 달립니다. 각자 키를 연타하거나 화면 한쪽을 터치해 먼저 결승선에 도착하세요.',
                    genre: '대전 레이싱',
                    players: '2인 플레이'
                }
            }
        },
        big2: { pageTitle: '🃏 빅투' },
        common: { noScoresYet: '아직 점수 기록이 없습니다.', enterPlayerName: '플레이어 이름을 입력하세요:' },
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
        const newName = prompt(translation.common?.enterPlayerName || 'Enter your player name:', playerName);
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
        html = `<tr><td colspan="4">${translation.common?.noScoresYet || 'No scores yet.'}</td></tr>`;
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

    // Hub elements
    const hubKicker = document.getElementById('hub-kicker');
    if (hubKicker) hubKicker.textContent = translation.hub?.kicker ?? 'Game Portal';
    const hubTitle  = document.getElementById('hub-title');
    if (hubTitle)  hubTitle.textContent  = translation.hub?.title  ?? 'Coriander Arcade';
    const hubCopy   = document.getElementById('hub-copy');
    if (hubCopy)   hubCopy.textContent   = translation.hub?.copy   ?? 'Five games, one hub. Pick your challenge.';

    const hubCardMap = {
        'cat-card-status': translation.hub?.cards?.cat?.status,
        'cat-card-title': translation.hub?.cards?.cat?.title,
        'cat-card-copy': translation.hub?.cards?.cat?.copy,
        'cat-card-genre': translation.hub?.cards?.cat?.genre,
        'cat-card-players': translation.hub?.cards?.cat?.players,
        'car-card-status': translation.hub?.cards?.car?.status,
        'car-card-title': translation.hub?.cards?.car?.title,
        'car-card-copy': translation.hub?.cards?.car?.copy,
        'car-card-genre': translation.hub?.cards?.car?.genre,
        'car-card-players': translation.hub?.cards?.car?.players,
        'shooter-card-status': translation.hub?.cards?.shooter?.status,
        'shooter-card-title': translation.hub?.cards?.shooter?.title,
        'shooter-card-copy': translation.hub?.cards?.shooter?.copy,
        'shooter-card-genre': translation.hub?.cards?.shooter?.genre,
        'shooter-card-players': translation.hub?.cards?.shooter?.players,
        'big2-card-status': translation.hub?.cards?.big2?.status,
        'big2-card-title': translation.hub?.cards?.big2?.title,
        'big2-card-copy': translation.hub?.cards?.big2?.copy,
        'big2-card-genre': translation.hub?.cards?.big2?.genre,
        'big2-card-players': translation.hub?.cards?.big2?.players,
        'toss-card-status': translation.hub?.cards?.tossing?.status,
        'toss-card-title': translation.hub?.cards?.tossing?.title,
        'toss-card-copy': translation.hub?.cards?.tossing?.copy,
        'toss-card-genre': translation.hub?.cards?.tossing?.genre,
        'toss-card-players': translation.hub?.cards?.tossing?.players,
        'race-card-status': translation.hub?.cards?.race?.status,
        'race-card-title': translation.hub?.cards?.race?.title,
        'race-card-copy': translation.hub?.cards?.race?.copy,
        'race-card-genre': translation.hub?.cards?.race?.genre,
        'race-card-players': translation.hub?.cards?.race?.players
    };
    Object.keys(hubCardMap).forEach(id => {
        const el = document.getElementById(id);
        if (el && hubCardMap[id]) {
            el.textContent = hubCardMap[id];
        }
    });

    const big2PageTitle = document.getElementById('big2-page-title');
    if (big2PageTitle) {
        big2PageTitle.textContent = translation.big2?.pageTitle || '🃏 Big 2';
    }

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

    const big2Btn = document.getElementById('big2-btn');
    if (big2Btn) big2Btn.textContent = translation.btn.big2;

    const big2HomeBtn = document.getElementById('big2-home-btn');
    if (big2HomeBtn) big2HomeBtn.textContent = translation.btn.home;

    document.querySelectorAll('[data-i18n="btn.openGame"]').forEach(el => {
        el.textContent = translation.btn.openGame;
    });

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
    const leavingBig2 = pageName !== 'big2-page' && document.getElementById('big2-page')?.classList.contains('active');
    if (leavingBig2 && window.stopBig2) {
        window.stopBig2();
    }

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
    // \u2500\u2500 Game hub: open-game-btn cards ──────────────────────────────────────
    document.querySelectorAll('.open-game-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameKey = this.dataset.game;
            if (gameKey === 'big-2') {
                showPage('big2-page');
                if (window.startBig2) window.startBig2('b2-game-container');
            } else {
                // Show speed HUD for Turbo Traffic, lives HUD for Star Paws
                const speedEl = document.getElementById('speed');
                const livesEl = document.getElementById('lives');
                if (speedEl) speedEl.style.display = (gameKey === 'turbo-traffic') ? '' : 'none';
                if (livesEl) livesEl.style.display = (gameKey === 'star-paws-shooter') ? '' : 'none';
                showPage('game-page');
                if (window.startGame) window.startGame(gameKey);
            }
        });
    });

    // Rules button (kept for back-compat; now on rules page only)
    const rulesBtn = document.getElementById('rules-btn');
    if (rulesBtn) {
        rulesBtn.addEventListener('click', function() {
            showPage('rules');
        });
    }

    // Big 2 home button
    const big2HomeBtn = document.getElementById('big2-home-btn');
    if (big2HomeBtn) {
        big2HomeBtn.addEventListener('click', function() {
            if (window.stopBig2) window.stopBig2();
            showPage('homepage');
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

/** Restart the current running game without leaving the page */
function restartCurrentRun() {
    const gameKey = window.currentRunningGameKey || 'cat-adventure';
    
    // Stop and restart the game
    if (window.stopGame) {
        window.stopGame();
    }
    
    if (window.startGame) {
        window.startGame(gameKey);
    }
}

// Export for use in other scripts
window.Navigation = {
    showPage,
    returnHome,
    restartCurrentRun
};
