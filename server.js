const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8000);
const ROOT_DIR = __dirname;
const LOBBY_TTL_MS = 12 * 60 * 60 * 1000;
const CODE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8'
};

const lobbies = new Map();
const raceLobbies = new Map();

const BIG2 = {
    RANKS: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'],
    SUITS: ['♦', '♣', '♥', '♠'],
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2
};

const FIVE_CARD_RANK = {
    straight: 1,
    flush: 2,
    fullhouse: 3,
    fourkind: 4,
    straightflush: 5
};

function createCard(rank, suit) {
    const rankIdx = BIG2.RANKS.indexOf(rank);
    const suitIdx = BIG2.SUITS.indexOf(suit);
    return {
        rank,
        suit,
        rankIdx,
        suitIdx,
        strength: rankIdx * 4 + suitIdx,
        label: rank + suit,
        isThreeDiamonds: rank === '3' && suit === '♦'
    };
}

function buildDeck() {
    const deck = [];
    for (const rank of BIG2.RANKS) {
        for (const suit of BIG2.SUITS) {
            deck.push(createCard(rank, suit));
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let index = deck.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
}

function sortHand(cards) {
    return [...cards].sort((a, b) => a.strength - b.strength);
}

function classifyPlay(cards) {
    const count = cards.length;
    if (count === 0 || count === 4 || count > 5) return null;

    const sorted = sortHand(cards);

    if (count === 1) {
        return { type: 'single', key: sorted[0].strength };
    }

    if (count === 2) {
        if (sorted[0].rank === sorted[1].rank) {
            return { type: 'pair', key: Math.max(...sorted.map(card => card.strength)) };
        }
        return null;
    }

    if (count === 3) {
        if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) {
            return { type: 'triple', key: Math.max(...sorted.map(card => card.strength)) };
        }
        return null;
    }

    const rankIdxs = sorted.map(card => card.rankIdx);
    const suitIdxs = sorted.map(card => card.suitIdx);
    const maxStrength = Math.max(...sorted.map(card => card.strength));
    const isFlush = suitIdxs.every(value => value === suitIdxs[0]);

    let isStraight = true;
    for (let index = 1; index < rankIdxs.length; index++) {
        if (rankIdxs[index] !== rankIdxs[index - 1] + 1) {
            isStraight = false;
            break;
        }
    }

    if (isFlush && isStraight) return { type: 'straightflush', key: maxStrength };
    if (isStraight) return { type: 'straight', key: maxStrength };
    if (isFlush) return { type: 'flush', key: maxStrength };

    const frequencies = {};
    rankIdxs.forEach(rank => {
        frequencies[rank] = (frequencies[rank] || 0) + 1;
    });
    const counts = Object.values(frequencies).sort((a, b) => b - a);

    if (counts[0] === 4) {
        const quadRank = Number(Object.keys(frequencies).find(key => frequencies[key] === 4));
        return { type: 'fourkind', key: quadRank * 100 };
    }
    if (counts[0] === 3 && counts[1] === 2) {
        const tripleRank = Number(Object.keys(frequencies).find(key => frequencies[key] === 3));
        return { type: 'fullhouse', key: tripleRank * 100 };
    }

    return null;
}

function beats(play, table) {
    if (!play) return false;
    if (!table) return true;

    if (play.type !== table.type) {
        const playIsFive = Object.prototype.hasOwnProperty.call(FIVE_CARD_RANK, play.type);
        const tableIsFive = Object.prototype.hasOwnProperty.call(FIVE_CARD_RANK, table.type);
        if (playIsFive && tableIsFive) {
            return FIVE_CARD_RANK[play.type] > FIVE_CARD_RANK[table.type];
        }
        return false;
    }

    return play.key > table.key;
}

class Big2ServerGame {
    constructor(players) {
        this.numPlayers = Math.max(BIG2.MIN_PLAYERS, Math.min(BIG2.MAX_PLAYERS, players.length));
        this.players = players.slice(0, this.numPlayers).map((player, seat) => ({
            id: player.id,
            seat,
            name: player.name,
            hand: [],
            active: true,
            passed: false,
            finished: false,
            finishRank: null
        }));

        this.table = null;
        this.tableOwner = null;
        this.currentTurn = -1;
        this.gameOver = false;
        this.finishOrder = [];
        this.passCount = 0;
        this.log = [];
        this.drawPile = [];
        this.emotes = [];

        this.dealCards();
        this.findFirstTurn();
    }

    dealCards() {
        const deck = shuffleDeck(buildDeck());
        const initialHandSize = 13;
        let deckIndex = 0;

        for (let round = 0; round < initialHandSize; round++) {
            for (let seat = 0; seat < this.numPlayers; seat++) {
                if (deckIndex < deck.length) {
                    this.players[seat].hand.push(deck[deckIndex++]);
                }
            }
        }

        this.drawPile = deck.slice(deckIndex);

        // Ensure opening card (3♦) is dealt to a player, not stranded in draw pile.
        if (!this.players.some(player => player.hand.some(card => card.isThreeDiamonds))) {
            const pileIndex = this.drawPile.findIndex(card => card.isThreeDiamonds);
            if (pileIndex >= 0) {
                const swapOut = this.players[0].hand.pop();
                const threeDiamond = this.drawPile.splice(pileIndex, 1)[0];
                this.players[0].hand.push(threeDiamond);
                if (swapOut) this.drawPile.push(swapOut);
            }
        }

        this.players.forEach(player => {
            player.hand = sortHand(player.hand);
        });
    }

    findFirstTurn() {
        for (let seat = 0; seat < this.numPlayers; seat++) {
            if (this.players[seat].hand.some(card => card.isThreeDiamonds)) {
                this.currentTurn = seat;
                return;
            }
        }
        this.currentTurn = 0;
    }

    currentPlayer() {
        return this.players[this.currentTurn];
    }

    nextActiveTurn(fromSeat) {
        let next = (fromSeat + 1) % this.numPlayers;
        let attempts = 0;
        while ((this.players[next].finished || !this.players[next].active) && attempts < this.numPlayers) {
            next = (next + 1) % this.numPlayers;
            attempts += 1;
        }
        return next;
    }

    advanceTurn() {
        this.currentTurn = this.nextActiveTurn(this.currentTurn);
    }

    addLog(message) {
        this.log.push(message);
        if (this.log.length > 30) {
            this.log = this.log.slice(-30);
        }
    }

    addEmote(playerSeat, emote) {
        const player = this.players[playerSeat];
        if (!player || !player.active) {
            return { ok: false, error: 'Player is inactive.' };
        }

        const value = String(emote || '').trim().toLowerCase();
        if (!['nice', 'oof', 'gg'].includes(value)) {
            return { ok: false, error: 'Invalid emote.' };
        }

        this.emotes.push({
            seat: player.seat,
            name: player.name,
            emote: value,
            at: Date.now()
        });
        if (this.emotes.length > 24) {
            this.emotes = this.emotes.slice(-24);
        }

        return { ok: true };
    }

    finishPlayer(player) {
        player.finished = true;
        player.finishRank = this.finishOrder.length + 1;
        this.finishOrder.push(player.seat);
        this.addLog(`🎉 ${player.name} finishes #${player.finishRank}!`);

        const remaining = this.players.filter(entry => !entry.finished && entry.active);
        if (remaining.length <= 1) {
            this.players.forEach(entry => {
                if (!entry.finished) {
                    entry.finished = true;
                    entry.finishRank = this.finishOrder.length + 1;
                    this.finishOrder.push(entry.seat);
                }
            });
            this.gameOver = true;
            this.addLog('Game over!');
        }
    }

    playByLabels(playerSeat, labels) {
        if (this.gameOver) {
            return { ok: false, error: 'Game is already over.' };
        }
        if (playerSeat !== this.currentTurn) {
            return { ok: false, error: 'It is not your turn.' };
        }

        const player = this.currentPlayer();
        if (!player.active || player.finished) {
            return { ok: false, error: 'You cannot play right now.' };
        }

        const requestedLabels = Array.isArray(labels) ? labels : [];
        const chosenCards = [];
        const usedIndexes = new Set();

        for (const label of requestedLabels) {
            const handIndex = player.hand.findIndex((card, index) => card.label === label && !usedIndexes.has(index));
            if (handIndex < 0) {
                return { ok: false, error: 'One or more selected cards are invalid.' };
            }
            usedIndexes.add(handIndex);
            chosenCards.push(player.hand[handIndex]);
        }

        const classified = classifyPlay(chosenCards);
        if (!classified) {
            return { ok: false, error: 'Not a valid Big 2 combination.' };
        }

        if (!this.table && this.tableOwner === null) {
            if (!chosenCards.some(card => card.isThreeDiamonds)) {
                return { ok: false, error: 'First play must include 3♦.' };
            }
        }

        if (!beats(classified, this.table ? this.table.classified : null)) {
            return { ok: false, error: 'This play does not beat the current table.' };
        }

        player.hand = player.hand.filter((_, index) => !usedIndexes.has(index));
        this.table = { cards: chosenCards, classified };
        this.tableOwner = player.seat;
        this.passCount = 0;
        this.players.forEach(entry => {
            entry.passed = false;
        });
        this.addLog(`${player.name} played: ${chosenCards.map(card => card.label).join(' ')}`);

        if (player.hand.length === 0) {
            this.finishPlayer(player);
            if (this.gameOver) {
                return { ok: true };
            }
        }

        this.advanceTurn();
        return { ok: true };
    }

    passBySeat(playerSeat) {
        if (this.gameOver) {
            return { ok: false, error: 'Game is already over.' };
        }
        if (playerSeat !== this.currentTurn) {
            return { ok: false, error: 'It is not your turn.' };
        }

        const player = this.currentPlayer();
        if (this.table === null) {
            return { ok: false, error: 'You must play to open the round.' };
        }
        if (this.tableOwner === player.seat) {
            return { ok: false, error: 'You won the last trick. You must open the next round.' };
        }

        player.passed = true;
        this.passCount += 1;

        if (this.drawPile.length > 0) {
            const drawn = this.drawPile.shift();
            player.hand.push(drawn);
            player.hand = sortHand(player.hand);
            this.addLog(`${player.name} passed and drew 1 card.`);
        } else {
            this.addLog(`${player.name} passed.`);
        }

        const activePlayers = this.players.filter(entry => entry.active && !entry.finished);
        const others = activePlayers.filter(entry => entry.seat !== this.tableOwner);
        if (this.passCount >= others.length) {
            this.addLog(`Round over. ${this.players[this.tableOwner]?.name || ''} opens next round.`);
            this.table = null;
            this.passCount = 0;
            this.players.forEach(entry => {
                entry.passed = false;
            });
            this.currentTurn = this.tableOwner;
            return { ok: true };
        }

        this.advanceTurn();
        return { ok: true };
    }

    snapshotForSeat(seat) {
        const self = this.players[seat];
        if (!self) return null;

        return {
            gameOver: this.gameOver,
            currentTurn: this.currentTurn,
            currentTurnName: this.players[this.currentTurn]?.name || '',
            mySeat: seat,
            myTurn: this.currentTurn === seat,
            myHand: self.hand.map(card => ({ rank: card.rank, suit: card.suit, label: card.label, strength: card.strength })),
            table: this.table
                ? {
                    cards: this.table.cards.map(card => ({ rank: card.rank, suit: card.suit, label: card.label })),
                    type: this.table.classified.type
                }
                : null,
            tableOwner: this.tableOwner,
            players: this.players.map(player => ({
                seat: player.seat,
                id: player.id,
                name: player.name,
                cardCount: player.hand.length,
                active: player.active,
                passed: player.passed,
                finished: player.finished,
                finishRank: player.finishRank
            })),
            finishOrder: [...this.finishOrder],
            log: this.log.slice(-8),
            drawPileCount: this.drawPile.length,
            emotes: this.emotes.slice(-8)
        };
    }
}

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { ok: false, error: message });
}

function generateGameCode() {
    let code = '';
    for (let index = 0; index < 4; index++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

function generatePlayerId() {
    return 'p-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}

function normalizeLobby(lobby) {
    return {
        code: lobby.code,
        hostName: lobby.hostName,
        numPlayers: lobby.numPlayers,
        createdAt: lobby.createdAt,
        status: lobby.status,
        startedAt: lobby.startedAt || null,
        endedAt: lobby.endedAt || null,
        endedReason: lobby.endedReason || null,
        players: lobby.players.map(player => ({
            id: player.id,
            name: player.name,
            isHost: Boolean(player.isHost)
        }))
    };
}

function normalizeRaceLobby(lobby) {
    return {
        code: lobby.code,
        createdAt: lobby.createdAt,
        startedAt: lobby.startedAt || null,
        finishedAt: lobby.finishedAt || null,
        status: lobby.status,
        winner: typeof lobby.winner === 'number' ? lobby.winner : null,
        players: lobby.players.map(player => ({
            id: player.id,
            name: player.name,
            isHost: Boolean(player.isHost),
            seat: player.seat
        })),
        progress: [lobby.progress[0] || 0, lobby.progress[1] || 0]
    };
}

function cleanupExpiredRaceLobbies() {
    const now = Date.now();
    for (const [code, lobby] of raceLobbies.entries()) {
        if (!lobby || now - lobby.createdAt > LOBBY_TTL_MS) {
            raceLobbies.delete(code);
        }
    }
}

function createRaceLobby(hostName) {
    cleanupExpiredRaceLobbies();

    let code;
    do {
        code = generateGameCode();
    } while (raceLobbies.has(code));

    const hostPlayer = {
        id: generatePlayerId(),
        name: hostName,
        isHost: true,
        seat: 0
    };

    const lobby = {
        code,
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null,
        status: 'waiting',
        winner: null,
        players: [hostPlayer],
        progress: [0, 0]
    };

    raceLobbies.set(code, lobby);
    return { lobby, playerId: hostPlayer.id };
}

function joinRaceLobby(code, playerName) {
    cleanupExpiredRaceLobbies();
    const lobby = raceLobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }
    if (lobby.players.length >= 2) {
        return { ok: false, statusCode: 409, error: 'Lobby is full.' };
    }
    if (lobby.status === 'finished') {
        return { ok: false, statusCode: 409, error: 'Game is no longer active.' };
    }

    const player = {
        id: generatePlayerId(),
        name: playerName,
        isHost: false,
        seat: 1
    };
    lobby.players.push(player);

    if (lobby.players.length === 2 && lobby.status === 'waiting') {
        lobby.status = 'in-progress';
        lobby.startedAt = Date.now();
    }

    return { ok: true, lobby, playerId: player.id };
}

function raceStateForPlayer(code, playerId) {
    cleanupExpiredRaceLobbies();
    const lobby = raceLobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }

    const mySeat = lobby.players.findIndex(player => player.id === playerId);
    if (mySeat < 0) {
        return { ok: false, statusCode: 403, error: 'Player is not in this game.' };
    }

    return {
        ok: true,
        lobby,
        state: {
            code: lobby.code,
            status: lobby.status,
            mySeat,
            winner: typeof lobby.winner === 'number' ? lobby.winner : null,
            progress: [lobby.progress[0] || 0, lobby.progress[1] || 0],
            players: lobby.players.map(player => ({
                seat: player.seat,
                name: player.name,
                isHost: player.isHost
            }))
        }
    };
}

function raceBoost(code, playerId) {
    const state = raceStateForPlayer(code, playerId);
    if (!state.ok) return state;

    const { lobby } = state;
    if (lobby.status !== 'in-progress') {
        return { ok: false, statusCode: 409, error: 'Game is not in progress.' };
    }

    const seat = lobby.players.findIndex(player => player.id === playerId);
    if (seat < 0) {
        return { ok: false, statusCode: 403, error: 'Player is not in this game.' };
    }

    if (lobby.winner !== null) {
        return { ok: true, lobby, state: state.state };
    }

    lobby.progress[seat] = Math.min(1, (lobby.progress[seat] || 0) + 0.022);
    if (lobby.progress[seat] >= 1) {
        lobby.winner = seat;
        lobby.status = 'finished';
        lobby.finishedAt = Date.now();
    }

    return raceStateForPlayer(code, playerId);
}

function raceRematch(code, playerId) {
    const state = raceStateForPlayer(code, playerId);
    if (!state.ok) return state;

    const { lobby } = state;
    const player = lobby.players.find(entry => entry.id === playerId);
    if (!player || !player.isHost) {
        return { ok: false, statusCode: 403, error: 'Only the host can restart.' };
    }
    if (lobby.players.length < 2) {
        return { ok: false, statusCode: 409, error: 'Need 2 players to restart.' };
    }

    lobby.progress = [0, 0];
    lobby.winner = null;
    lobby.finishedAt = null;
    lobby.status = 'in-progress';
    lobby.startedAt = Date.now();

    return raceStateForPlayer(code, playerId);
}

function cleanupExpiredLobbies() {
    const now = Date.now();
    for (const [code, lobby] of lobbies.entries()) {
        if (!lobby || now - lobby.createdAt > LOBBY_TTL_MS) {
            lobbies.delete(code);
        }
    }
}

function createLobby(hostName, numPlayers) {
    cleanupExpiredLobbies();

    let code;
    do {
        code = generateGameCode();
    } while (lobbies.has(code));

    const hostPlayer = {
        id: generatePlayerId(),
        name: hostName,
        isHost: true
    };

    const lobby = {
        code,
        hostName,
        numPlayers,
        createdAt: Date.now(),
        status: 'waiting',
        players: [hostPlayer]
    };

    lobbies.set(code, lobby);
    return { lobby, playerId: hostPlayer.id };
}

function joinLobby(code, playerName) {
    cleanupExpiredLobbies();
    const lobby = lobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }
    if (lobby.status !== 'waiting') {
        return { ok: false, statusCode: 409, error: 'Game is no longer accepting players.' };
    }
    if (lobby.players.length >= lobby.numPlayers) {
        return { ok: false, statusCode: 409, error: 'Lobby is full.' };
    }

    const player = {
        id: generatePlayerId(),
        name: playerName,
        isHost: false
    };
    lobby.players.push(player);
    return { ok: true, lobby, playerId: player.id };
}

function startLobby(code, playerId) {
    cleanupExpiredLobbies();
    const lobby = lobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }

    const player = lobby.players.find(entry => entry.id === playerId);
    if (!player || !player.isHost) {
        return { ok: false, statusCode: 403, error: 'Only the host can start the game.' };
    }

    if (lobby.players.length < 2) {
        return { ok: false, statusCode: 409, error: 'At least 2 players are required to start.' };
    }

    lobby.status = 'in-progress';
    lobby.startedAt = Date.now();
    lobby.game = new Big2ServerGame(lobby.players);
    return { ok: true, lobby };
}

function resolvePlayerSeat(lobby, playerId) {
    return lobby.players.findIndex(player => player.id === playerId);
}

function gameStateForPlayer(code, playerId, options = {}) {
    const requireInProgress = Boolean(options.requireInProgress);
    cleanupExpiredLobbies();
    const lobby = lobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }
    if (!lobby.game) {
        if (lobby.status === 'finished') {
            return { ok: false, statusCode: 410, error: 'Game ended by host.' };
        }
        return { ok: false, statusCode: 409, error: 'Game has not started yet.' };
    }
    if (requireInProgress && lobby.status !== 'in-progress') {
        return { ok: false, statusCode: 409, error: 'Game is no longer active.' };
    }

    const seat = resolvePlayerSeat(lobby, playerId);
    if (seat < 0) {
        return { ok: false, statusCode: 403, error: 'Player is not in this game.' };
    }

    const snapshot = lobby.game.snapshotForSeat(seat);
    if (snapshot) {
        snapshot.lobbyStatus = lobby.status;
        snapshot.endedReason = lobby.endedReason || null;
    }

    return { ok: true, lobby, snapshot };
}

function playTurn(code, playerId, cardLabels) {
    const state = gameStateForPlayer(code, playerId, { requireInProgress: true });
    if (!state.ok) return state;

    const seat = resolvePlayerSeat(state.lobby, playerId);
    const result = state.lobby.game.playByLabels(seat, cardLabels);
    if (!result.ok) {
        return { ok: false, statusCode: 409, error: result.error };
    }

    return {
        ok: true,
        lobby: state.lobby,
        snapshot: state.lobby.game.snapshotForSeat(seat)
    };
}

function passTurn(code, playerId) {
    const state = gameStateForPlayer(code, playerId, { requireInProgress: true });
    if (!state.ok) return state;

    const seat = resolvePlayerSeat(state.lobby, playerId);
    const result = state.lobby.game.passBySeat(seat);
    if (!result.ok) {
        return { ok: false, statusCode: 409, error: result.error };
    }

    return {
        ok: true,
        lobby: state.lobby,
        snapshot: state.lobby.game.snapshotForSeat(seat)
    };
}

function sendEmote(code, playerId, emote) {
    const state = gameStateForPlayer(code, playerId, { requireInProgress: true });
    if (!state.ok) return state;

    const seat = resolvePlayerSeat(state.lobby, playerId);
    const result = state.lobby.game.addEmote(seat, emote);
    if (!result.ok) {
        return { ok: false, statusCode: 409, error: result.error };
    }

    return {
        ok: true,
        lobby: state.lobby,
        snapshot: state.lobby.game.snapshotForSeat(seat)
    };
}

function quitLobby(code, playerId) {
    cleanupExpiredLobbies();
    const lobby = lobbies.get(code);
    if (!lobby) {
        return { ok: false, statusCode: 404, error: 'Game code not found.' };
    }

    const player = lobby.players.find(entry => entry.id === playerId);
    if (!player || !player.isHost) {
        return { ok: false, statusCode: 403, error: 'Only the host can quit the game for everyone.' };
    }

    lobby.status = 'finished';
    lobby.endedAt = Date.now();
    lobby.endedReason = 'host-quit';

    if (lobby.game) {
        lobby.game.gameOver = true;
        lobby.game.addLog(`⚠️ Host ${player.name} ended the game.`);
    }

    const seat = resolvePlayerSeat(lobby, playerId);
    const snapshot = seat >= 0 && lobby.game ? lobby.game.snapshotForSeat(seat) : null;
    if (snapshot) {
        snapshot.lobbyStatus = lobby.status;
        snapshot.endedReason = lobby.endedReason;
    }

    return { ok: true, lobby, snapshot };
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
            if (data.length > 1024 * 1024) {
                reject(new Error('Request body too large.'));
            }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

async function parseJsonBody(req) {
    const raw = await readRequestBody(req);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error('Invalid JSON body.');
    }
}

async function handleApi(req, res, parsedUrl) {
    const pathname = parsedUrl.pathname;
    if (pathname === '/api/race/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, service: 'race', status: 'online' });
        return true;
    }

    if (pathname === '/api/race/lobbies' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const hostName = String(body.hostName || '').trim() || 'Player 1';
        const result = createRaceLobby(hostName);
        sendJson(res, 201, {
            ok: true,
            lobby: normalizeRaceLobby(result.lobby),
            playerId: result.playerId
        });
        return true;
    }

    const raceLobbyMatch = pathname.match(/^\/api\/race\/lobbies\/([A-Z0-9]{4})(?:\/(join|state|boost|rematch))?$/);
    if (raceLobbyMatch) {
        const code = raceLobbyMatch[1];
        const action = raceLobbyMatch[2] || 'read';

        if (action === 'read' && req.method === 'GET') {
            cleanupExpiredRaceLobbies();
            const lobby = raceLobbies.get(code);
            if (!lobby) {
                sendError(res, 404, 'Game code not found.');
                return true;
            }
            sendJson(res, 200, { ok: true, lobby: normalizeRaceLobby(lobby) });
            return true;
        }

        if (action === 'join' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const playerName = String(body.playerName || '').trim() || 'Player 2';
            const result = joinRaceLobby(code, playerName);
            if (!result.ok) {
                sendError(res, result.statusCode, result.error);
                return true;
            }
            sendJson(res, 200, {
                ok: true,
                lobby: normalizeRaceLobby(result.lobby),
                playerId: result.playerId
            });
            return true;
        }

        if (action === 'state' && req.method === 'GET') {
            const playerId = String(parsedUrl.searchParams.get('playerId') || '');
            const result = raceStateForPlayer(code, playerId);
            if (!result.ok) {
                sendError(res, result.statusCode, result.error);
                return true;
            }
            sendJson(res, 200, {
                ok: true,
                lobby: normalizeRaceLobby(result.lobby),
                state: result.state
            });
            return true;
        }

        if (action === 'boost' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const result = raceBoost(code, String(body.playerId || ''));
            if (!result.ok) {
                sendError(res, result.statusCode, result.error);
                return true;
            }
            sendJson(res, 200, {
                ok: true,
                lobby: normalizeRaceLobby(result.lobby),
                state: result.state
            });
            return true;
        }

        if (action === 'rematch' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const result = raceRematch(code, String(body.playerId || ''));
            if (!result.ok) {
                sendError(res, result.statusCode, result.error);
                return true;
            }
            sendJson(res, 200, {
                ok: true,
                lobby: normalizeRaceLobby(result.lobby),
                state: result.state
            });
            return true;
        }

        sendError(res, 405, 'Method not allowed.');
        return true;
    }

    if (pathname === '/api/big2/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, service: 'big2', status: 'online' });
        return true;
    }

    if (pathname === '/api/big2/lobbies' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const hostName = String(body.hostName || '').trim() || 'Player 1';
        const numPlayers = Math.max(2, Math.min(4, Number(body.numPlayers) || 2));
        const result = createLobby(hostName, numPlayers);
        sendJson(res, 201, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            playerId: result.playerId
        });
        return true;
    }

    const lobbyMatch = pathname.match(/^\/api\/big2\/lobbies\/([A-Z0-9]{4})(?:\/(join|start|state|play|pass|quit|emote))?$/);
    if (!lobbyMatch) {
        return false;
    }

    const code = lobbyMatch[1];
    const action = lobbyMatch[2] || 'read';

    if (action === 'read' && req.method === 'GET') {
        cleanupExpiredLobbies();
        const lobby = lobbies.get(code);
        if (!lobby) {
            sendError(res, 404, 'Game code not found.');
            return true;
        }
        sendJson(res, 200, { ok: true, lobby: normalizeLobby(lobby) });
        return true;
    }

    if (action === 'join' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const playerName = String(body.playerName || '').trim() || 'Player';
        const result = joinLobby(code, playerName);
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            playerId: result.playerId
        });
        return true;
    }

    if (action === 'start' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = startLobby(code, String(body.playerId || ''));
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, { ok: true, lobby: normalizeLobby(result.lobby) });
        return true;
    }

    if (action === 'state' && req.method === 'GET') {
        const playerId = String(parsedUrl.searchParams.get('playerId') || '');
        const result = gameStateForPlayer(code, playerId);
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            state: result.snapshot
        });
        return true;
    }

    if (action === 'quit' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = quitLobby(code, String(body.playerId || ''));
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            state: result.snapshot
        });
        return true;
    }

    if (action === 'play' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = playTurn(code, String(body.playerId || ''), Array.isArray(body.cardLabels) ? body.cardLabels : []);
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            state: result.snapshot
        });
        return true;
    }

    if (action === 'pass' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = passTurn(code, String(body.playerId || ''));
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            state: result.snapshot
        });
        return true;
    }

    if (action === 'emote' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = sendEmote(code, String(body.playerId || ''), String(body.emote || ''));
        if (!result.ok) {
            sendError(res, result.statusCode, result.error);
            return true;
        }
        sendJson(res, 200, {
            ok: true,
            lobby: normalizeLobby(result.lobby),
            state: result.snapshot
        });
        return true;
    }

    sendError(res, 405, 'Method not allowed.');
    return true;
}

function safeFilePath(urlPath) {
    const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
    const resolvedPath = path.normalize(path.join(ROOT_DIR, cleanPath));
    if (!resolvedPath.startsWith(ROOT_DIR)) {
        return null;
    }
    return resolvedPath;
}

function serveStatic(req, res, pathname) {
    let filePath = safeFilePath(pathname);
    if (!filePath) {
        sendError(res, 403, 'Forbidden');
        return;
    }

    try {
        const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
        if (stats && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch {
        sendError(res, 500, 'Unable to read file.');
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            if (error.code === 'ENOENT') {
                sendError(res, 404, 'Not found');
                return;
            }
            sendError(res, 500, 'Unable to load resource.');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600'
        });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/api/')) {
            const handled = await handleApi(req, res, parsedUrl);
            if (!handled) {
                sendError(res, 404, 'API route not found.');
            }
            return;
        }

        serveStatic(req, res, pathname);
    } catch (error) {
        sendError(res, 500, error.message || 'Unexpected server error.');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Cat Game server listening on http://0.0.0.0:${PORT}`);
    console.log('Big 2 lobby API available at /api/big2');
    console.log('Race lobby API available at /api/race');
});