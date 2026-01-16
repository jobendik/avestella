// Main entry point for AURA application
import { AudioManager } from './core/audio';
import { CONFIG, EMOTES, ACHIEVEMENTS } from './core/config';
import { Renderer } from './game/renderer';
import { GameLogic } from './game/logic';
import { UIManager } from './ui/manager';
// NetworkManager removed - WebSocket is now the exclusive networking solution
import { WebSocketClient } from './network/WebSocketClient';
import { EventBus } from './systems/EventBus';
import { VoiceChat } from './core/voice';
import { PersistenceManager } from './core/persistence';
import { Star, Echo, Projectile, Particle, FloatingText } from './game/entities';
import type { Player, Camera, Settings, GameState, OtherPlayer, Stats, DailyProgress, WeeklyProgress } from './types';

// Initialize game state
const settings: Settings = {
    music: true,
    volume: 0.7,
    particles: true,
    shake: true,
    ptt: false,
    vad: true,
    sensitivity: 0.5,
    ...PersistenceManager.loadSettings()  // Load saved settings
};

const gameState: GameState = {
    gameActive: false,
    selectedId: null,
    showingSocial: false,
    showingAch: false,
    showingSettings: false,
    showingQuests: false,
    msgMode: null,
    directTarget: null,
    currentRealm: 'genesis',
    voiceOn: false,
    isSpeaking: false
};

// Track when we received initial player data vs XP gains (for race condition fix)
// let playerDataLoadedAt = 0;
let lastXpGainAt = 0;

// Voice peer discovery - update every 500ms (30 frames at 60fps)
const VOICE_PEER_UPDATE_INTERVAL = 30;
let voicePeerUpdateCounter = 0;

// Initialize managers
const audio = new AudioManager(settings);
// NOTE: HTTP fallback removed - all networking uses WebSocketClient exclusively
const voiceChat = new VoiceChat(settings);

// Initialize WebSocket client for real-time sync
// Use same host/port for WebSocket (Vite proxy handles routing to backend)
const wsUrl = window.location.protocol === 'https:'
    ? `wss://${window.location.host}/aura/ws`
    : `ws://${window.location.host}/aura/ws`;

const wsClient = new WebSocketClient({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectDelay: 1000,
    heartbeatInterval: 15000
});

// Player stats and progress
const stats: Stats = {
    whispers: 0,
    stars: 0,
    echoes: 0,
    connections: 0,
    maxBond: 0,
    voice: 0,
    level: 1,
    realms: 1,
    friends: 0,
    sings: 0,
    pulses: 0,
    emotes: 0,
    teleports: 0,
    nightOwl: 0,
    marathon: 0,
    constellation: 0,
    ...PersistenceManager.loadStats()
};

let dailyProgress: DailyProgress = PersistenceManager.loadDailyProgress();
let weeklyProgress: WeeklyProgress = PersistenceManager.loadWeeklyProgress();
const unlocked = PersistenceManager.loadAchievements();
const friends: Set<string> = PersistenceManager.loadFriends();
const visitedRealms: Set<string> = PersistenceManager.loadVisitedRealms();
// NOTE: Recent players are loaded on-demand via PersistenceManager.loadRecent()

// Canvas setup
const canvas = document.getElementById('cosmos') as HTMLCanvasElement;
const mmCanvas = document.getElementById('mm-canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas, mmCanvas);

let W: number, H: number;

function resize(): void {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    renderer.updateDimensions(W, H);
}

window.addEventListener('resize', resize);
resize();

// Game entities
const camera: Camera = { x: 0, y: 0, tx: 0, ty: 0, shake: 0 };
const others = new Map<string, OtherPlayer>();
// NOTE: Bots are 100% SERVER-AUTHORITATIVE - they come through 'others' via world_state
// There is NO local bots array - all entities (players + bots) are managed by the server
const stars = new Map<string, Star[]>();
const echoes: Echo[] = [];
const projectiles: Projectile[] = [];
const particles: Particle[] = [];
const floats: FloatingText[] = [];
const constellations: [Star, Star, Star][] = [];

// Initialize player with Campfire Model spawn
const spawnAngle = Math.random() * Math.PI * 2;
const spawnDist = Math.random() * CONFIG.SPAWN_RADIUS;
const player: Player = {
    x: Math.cos(spawnAngle) * spawnDist,
    y: Math.sin(spawnAngle) * spawnDist,
    tx: Math.cos(spawnAngle) * spawnDist,
    ty: Math.sin(spawnAngle) * spawnDist,
    hue: settings.hue || Math.random() * 360,  // Use saved hue if available
    xp: stats.level ? CONFIG.LEVEL_XP[stats.level - 1] || 0 : 0,  // Restore XP from level
    stars: stats.stars || 0,
    echoes: stats.echoes || 0,
    singing: 0,
    pulsing: 0,
    emoting: null,
    emoteT: 0,
    r: 11,
    halo: 55,
    trail: [],
    name: 'Wanderer',
    id: 'local-' + Math.random().toString(36).substr(2, 9),
    born: Date.now(),
    bonds: new Map()
};

// Mouse state for click-to-move controls
let isMouseDown = false;

// UI initialization
function setupUI(): void {
    const startButton = document.getElementById('start') as HTMLButtonElement;
    const obGoButton = document.getElementById('ob-go') as HTMLButtonElement;
    const nameInput = document.getElementById('name-input') as HTMLInputElement;

    startButton?.addEventListener('click', () => {
        player.name = nameInput.value.trim() || 'Wanderer';
        UIManager.hideLoading();
        document.getElementById('onboard')?.classList.add('show');
    });

    obGoButton?.addEventListener('click', () => {
        document.getElementById('onboard')?.classList.remove('show');
        audio.init();
        audio.startDrone();
        audio.startAmbientLoop(); // Start ambient sparkle sounds for atmosphere
        gameState.gameActive = true;
        startGame();
    });

    // Action buttons
    document.getElementById('btn-whisper')?.addEventListener('click', () => {
        gameState.msgMode = 'whisper';
        UIManager.showMessageBox('Whisper into the void...');
    });

    document.getElementById('btn-sing')?.addEventListener('click', doSing);
    document.getElementById('btn-pulse')?.addEventListener('click', doPulse);

    document.getElementById('btn-echo')?.addEventListener('click', () => {
        gameState.msgMode = 'echo';
        UIManager.showMessageBox('Plant an eternal echo...');
    });

    document.getElementById('btn-emote')?.addEventListener('click', (e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        UIManager.showEmoteWheel(rect.left + rect.width / 2, rect.top - 40);
    });

    document.getElementById('btn-social')?.addEventListener('click', () => {
        closeAllPanels();
        gameState.showingSocial = true;
        document.getElementById('social')?.classList.add('show');
        UIManager.updateNearby(others);
    });

    document.getElementById('voice-btn')?.addEventListener('click', toggleVoice);

    // PTT button
    const pttBtn = document.getElementById('ptt-btn');
    pttBtn?.addEventListener('mousedown', () => {
        if (voiceChat.enabled && settings.ptt) voiceChat.setPTT(true);
    });
    pttBtn?.addEventListener('mouseup', () => {
        if (voiceChat.enabled && settings.ptt) voiceChat.setPTT(false);
    });
    pttBtn?.addEventListener('mouseleave', () => {
        if (voiceChat.enabled && settings.ptt) voiceChat.setPTT(false);
    });

    // Update PTT button visibility
    if (pttBtn) {
        pttBtn.style.display = settings.ptt ? 'flex' : 'none';
    }

    // Quick buttons
    document.getElementById('btn-quests')?.addEventListener('click', () => {
        closeAllPanels();
        gameState.showingQuests = true;
        document.getElementById('quests')?.classList.add('show');
        UIManager.updateQuests();
    });

    document.getElementById('btn-achievements')?.addEventListener('click', () => {
        closeAllPanels();
        gameState.showingAch = true;
        document.getElementById('achievements')?.classList.add('show');
        UIManager.updateAchievements();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
        closeAllPanels();
        gameState.showingSettings = true;
        document.getElementById('settings')?.classList.add('show');
    });

    // Panel close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.close;
            if (id) {
                document.getElementById(id)?.classList.remove('show');
                if (id === 'social') gameState.showingSocial = false;
                if (id === 'achievements') gameState.showingAch = false;
                if (id === 'settings') gameState.showingSettings = false;
                if (id === 'quests') gameState.showingQuests = false;
            }
        });
    });

    // Quest tabs (daily/weekly)
    document.querySelectorAll('#quests .panel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = (tab as HTMLElement).dataset.tab;
            document.querySelectorAll('#quests .panel-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const dailyList = document.getElementById('daily-quest-list');
            const weeklyList = document.getElementById('weekly-quest-list');
            const weeklyTimer = document.getElementById('weekly-reset-timer');

            if (tabType === 'daily') {
                if (dailyList) dailyList.style.display = 'block';
                if (weeklyList) weeklyList.style.display = 'none';
                if (weeklyTimer) weeklyTimer.style.display = 'none';
            } else if (tabType === 'weekly') {
                if (dailyList) dailyList.style.display = 'none';
                if (weeklyList) weeklyList.style.display = 'block';
                if (weeklyTimer) weeklyTimer.style.display = 'block';
            }
        });
    });

    // Achievement tabs (all/social/explore/secret)
    document.querySelectorAll('#achievements .ach-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = (tab as HTMLElement).dataset.achTab;
            document.querySelectorAll('#achievements .ach-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const achCards = document.querySelectorAll('#ach-grid .ach-card');
            const achievements = ACHIEVEMENTS;

            achCards.forEach((card, i) => {
                const ach = achievements[i];
                if (!ach) return;

                if (category === 'all') {
                    (card as HTMLElement).style.display = 'flex';
                } else if (category === 'secret') {
                    (card as HTMLElement).style.display = ach.secret ? 'flex' : 'none';
                } else {
                    (card as HTMLElement).style.display = ach.category === category ? 'flex' : 'none';
                }
            });
        });
    });

    // Realm switching
    document.querySelectorAll('.realm').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('locked')) {
                const realm = (btn as HTMLElement).dataset.realm;
                if (realm) changeRealm(realm);
            }
        });
    });

    // Settings toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const settingName = (toggle as HTMLElement).dataset.setting as keyof Settings;
            toggle.classList.toggle('on');
            if (settingName) {
                (settings as any)[settingName] = toggle.classList.contains('on');
                if (settingName === 'music') {
                    if (settings.music) audio.startDrone();
                    else audio.stopDrone();
                }
            }
        });
    });

    // Volume sliders
    document.querySelectorAll('.slider').forEach(slider => {
        const fill = slider.querySelector('.slider-fill') as HTMLElement;
        const valEl = slider.parentElement?.querySelector('.slider-val') as HTMLElement;
        slider.addEventListener('click', (e) => {
            const rect = slider.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e as MouseEvent).clientX - rect.left) / rect.width * 100));
            if (fill) fill.style.width = `${pct}%`;
            if (valEl) valEl.textContent = `${Math.round(pct)}%`;
            const settingName = (slider as HTMLElement).dataset.setting;
            if (settingName === 'volume') {
                settings.volume = pct / 100;
                audio.setVolume(pct / 100);
            }
        });
    });

    // Message input
    const msgInput = document.getElementById('msg-input') as HTMLInputElement;
    msgInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = msgInput.value.trim();
            if (text) {
                if (gameState.msgMode === 'echo') {
                    createEcho(text);
                } else if (gameState.msgMode === 'direct' && gameState.directTarget) {
                    createWhisper(text, gameState.directTarget);
                    gameState.directTarget = null;
                } else {
                    createWhisper(text);
                }
            }
            msgInput.value = '';
            UIManager.hideMessageBox();
            gameState.msgMode = null;
        } else if (e.key === 'Escape') {
            msgInput.value = '';
            UIManager.hideMessageBox();
            gameState.msgMode = null;
            gameState.directTarget = null;
        }
    });

    // Profile buttons
    document.getElementById('prof-whisper')?.addEventListener('click', () => {
        if (!gameState.selectedId) return;
        gameState.directTarget = gameState.selectedId;
        const other = others.get(gameState.selectedId);
        gameState.msgMode = 'direct';
        UIManager.showMessageBox(`Whisper to ${other?.name || 'soul'}...`, `Whispering to ${other?.name}`);
        UIManager.hideProfile();
    });

    document.getElementById('prof-follow')?.addEventListener('click', () => {
        if (!gameState.selectedId) return;
        const other = others.get(gameState.selectedId);
        if (other) {
            player.tx = other.x;
            player.ty = other.y;
            UIManager.toast(`Following ${other.name}...`);
        }
        UIManager.hideProfile();
    });

    // Friend button
    document.getElementById('prof-friend')?.addEventListener('click', () => {
        if (!gameState.selectedId) return;
        const other = others.get(gameState.selectedId);
        if (!other) return;

        const friendBtn = document.getElementById('prof-friend');
        if (friends.has(gameState.selectedId)) {
            // Remove friend - send to server
            if (wsClient.isConnected()) {
                wsClient.removeFriend(gameState.selectedId);
            }
            friends.delete(gameState.selectedId);
            PersistenceManager.saveFriends(friends);
            if (friendBtn) {
                friendBtn.textContent = '❤️ Add Friend';
                friendBtn.classList.remove('active');
            }
            UIManager.toast(`Removed ${other.name} from friends`);
            stats.friends = friends.size;
        } else {
            // Add friend - send to server
            if (wsClient.isConnected()) {
                wsClient.addFriend(gameState.selectedId, other.name);
            }
            friends.add(gameState.selectedId);
            PersistenceManager.saveFriends(friends);
            if (friendBtn) {
                friendBtn.textContent = '💔 Remove Friend';
                friendBtn.classList.add('active');
            }
            UIManager.toast(`Added ${other.name} as friend! ❤️`, 'success');
            stats.friends = friends.size;
            weeklyProgress.newFriends++;
            PersistenceManager.saveWeeklyProgress(weeklyProgress);
            checkAchievements();
        }
    });

    // Teleport button (server-validated, only works for friends in same realm)
    document.getElementById('prof-teleport')?.addEventListener('click', () => {
        if (!gameState.selectedId) return;
        const other = others.get(gameState.selectedId);
        if (!other || !friends.has(gameState.selectedId)) {
            UIManager.toast('You can only teleport to friends', 'warning');
            return;
        }

        // Request teleport from server (will validate and respond)
        if (wsClient.isConnected()) {
            wsClient.teleportToFriend(gameState.selectedId);
        } else {
            UIManager.toast('⚠️ Not connected to server', 'warning');
        }
    });

    // Click outside to close emotes
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('#emotes') && !target.closest('#btn-emote')) {
            UIManager.hideEmoteWheel();
        }
    });

    // Mouse controls: click or hold to move
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Canvas click - check for player/bot clicks (profile)
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - W / 2) + camera.x;
        const my = (e.clientY - rect.top - H / 2) + camera.y;

        // Check echoes (Ignite interaction)
        for (const echo of echoes) {
            if (echo.realm !== gameState.currentRealm) continue;
            const dist = Math.hypot(echo.x - mx, echo.y - my);
            if (dist < 45) { // Click radius
                // Ignite the echo
                wsClient.igniteEcho(echo.id);

                // Immediate visual/audio feedback
                echo.pulse = 1.0;
                audio.playStarIgnite(echo.ignited || 1);

                // Create particle burst
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(
                        echo.x,
                        echo.y,
                        Math.cos(angle) * 2,
                        Math.sin(angle) * 2,
                        echo.hue
                    ));
                }
                return;
            }
        }

        let clicked: string | null = null;

        // Check all entities (players and bots) - bots are now in 'others' map with isBot=true
        // This is 100% server-authoritative - all entities come from world_state
        for (const [id, other] of others) {
            const dist = Math.hypot(other.x - mx, other.y - my);
            if (dist < other.halo) {
                clicked = id;
                break;
            }
        }

        if (clicked) {
            gameState.selectedId = clicked;
            UIManager.showProfile(others.get(clicked)!, e.clientX, e.clientY);
            // Don't move when clicking on players/bots
            e.stopPropagation();
        } else {
            UIManager.hideProfile();
            UIManager.hideEmoteWheel();
            // Movement is already handled by mousedown event
        }
    });

    // Touch controls - hold and drag to move
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches[0]) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.touches[0].clientX - rect.left;
            const my = e.touches[0].clientY - rect.top;
            const worldX = camera.x + mx;
            const worldY = camera.y + my;
            player.tx = worldX;
            player.ty = worldY;
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches[0]) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.touches[0].clientX - rect.left;
            const my = e.touches[0].clientY - rect.top;
            const worldX = camera.x + mx;
            const worldY = camera.y + my;
            player.tx = worldX;
            player.ty = worldY;
        }
    }, { passive: false });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
}

function handleMouseDown(e: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    isMouseDown = true;

    // Convert screen coordinates to world coordinates
    const worldX = camera.x + mx;
    const worldY = camera.y + my;
    player.tx = worldX;
    player.ty = worldY;
}

function handleMouseMove(e: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Only update movement target if mouse is held down
    if (isMouseDown) {
        const worldX = camera.x + mx;
        const worldY = camera.y + my;
        player.tx = worldX;
        player.ty = worldY;
    }
}

function handleMouseUp(): void {
    isMouseDown = false;
}

function handleKeyDown(e: KeyboardEvent): void {
    if (!gameState.gameActive) return;

    // Ignore key commands if user is typing in an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
            // Let Escape through to close the box
        } else {
            return;
        }
    }

    switch (e.key.toLowerCase()) {
        case 'w':
            gameState.msgMode = 'whisper';
            UIManager.showMessageBox('Whisper into the void...');
            break;
        case 's':
            doSing();
            break;
        case ' ':
            e.preventDefault();
            doPulse();
            break;
        case 'e':
            gameState.msgMode = 'echo';
            UIManager.showMessageBox('Plant an eternal echo...');
            break;
        case 'q':
            const emoteBtn = document.getElementById('btn-emote');
            if (emoteBtn) {
                const rect = emoteBtn.getBoundingClientRect();
                UIManager.showEmoteWheel(rect.left + rect.width / 2, rect.top - 40);
            }
            break;
        case 'tab':
            e.preventDefault();
            closeAllPanels();
            gameState.showingSocial = true;
            document.getElementById('social')?.classList.add('show');
            UIManager.updateNearby(others);
            break;
        case 'escape':
            UIManager.hideMessageBox();
            UIManager.hideProfile();
            UIManager.hideEmoteWheel();
            closeAllPanels();
            break;
    }
}

function closeAllPanels(): void {
    document.getElementById('social')?.classList.remove('show');
    document.getElementById('achievements')?.classList.remove('show');
    document.getElementById('settings')?.classList.remove('show');
    document.getElementById('quests')?.classList.remove('show');
    gameState.showingSocial = false;
    gameState.showingAch = false;
    gameState.showingSettings = false;
    gameState.showingQuests = false;
}

function changeRealm(realmId: string): void {
    if (realmId === gameState.currentRealm) return;

    // Show transition
    const trans = document.getElementById('realm-trans');
    const transIcon = document.getElementById('trans-icon');
    const transName = document.getElementById('trans-name');

    const realmData: Record<string, { icon: string; name: string }> = {
        genesis: { icon: '🌌', name: 'Genesis' },
        nebula: { icon: '🌸', name: 'Nebula Gardens' },
        void: { icon: '🌑', name: 'The Void' },
        starforge: { icon: '🔥', name: 'Starforge' },
        abyss: { icon: '🕳️', name: 'The Abyss' },
        crystal: { icon: '💎', name: 'Crystal Caverns' },
        sanctuary: { icon: '🏛️', name: 'Sanctuary' },
        celestial: { icon: '👑', name: 'Celestial Throne' }
    };

    const realm = realmData[realmId];
    if (trans && transIcon && transName && realm) {
        transIcon.textContent = realm.icon;
        transName.textContent = realm.name;
        trans.classList.add('active');

        setTimeout(() => {
            gameState.currentRealm = realmId as import('./types').RealmId;
            document.querySelectorAll('.realm').forEach(r => r.classList.remove('active'));
            document.querySelector(`[data-realm="${realmId}"]`)?.classList.add('active');
            document.getElementById('realm-icon')!.textContent = realm.icon;
            document.getElementById('realm-text')!.textContent = realm.name;

            // Track visited realms
            if (!visitedRealms.has(realmId)) {
                visitedRealms.add(realmId);
                PersistenceManager.saveVisitedRealms(visitedRealms);
                stats.realms = visitedRealms.size;
                weeklyProgress.realmChanges++;
                PersistenceManager.saveWeeklyProgress(weeklyProgress);
                checkAchievements();
            }

            // Disconnect all voice peers from old realm to prevent orphaned connections
            if (voiceChat.enabled) {
                for (const peerId of voiceChat.getConnectedPeers()) {
                    voiceChat.disconnectPeer(peerId);
                }
            }

            // Clear other players and stars from old realm
            others.clear();

            setTimeout(() => {
                trans.classList.remove('active');
            }, 800);
        }, 600);
    }
}

function createEcho(text: string): void {
    // 100% Server-authoritative: Only send request, effects happen on broadcast
    if (wsClient.isConnected()) {
        wsClient.sendEcho(player, text);
    } else {
        // No connection - warn user, don't apply local effects
        UIManager.toast('⚠️ Not connected - echo not sent', 'warning');
        console.warn('Cannot create echo: WebSocket not connected');
    }
}

function createWhisper(text: string, targetId?: string): void {
    // 100% Server-authoritative: Send via WebSocket only
    if (wsClient.isConnected()) {
        wsClient.sendWhisper(player, text, targetId);
        // Show local feedback immediately for whispers (optimistic UI)
        if (targetId) {
            const target = others.get(targetId);
            if (target) {
                floats.push(new FloatingText(target.x, target.y - target.halo - 25, `💬 ${text}`, 90, 12));
                UIManager.toast(`Whispered to ${target.name}`);
            }
        } else {
            floats.push(new FloatingText(player.x, player.y - player.halo - 25, `💬 ${text}`, 90, 12));
        }
        audio.playWhisperSend();
    } else {
        // No connection - warn user
        UIManager.toast('⚠️ Not connected - message not sent', 'warning');
        console.warn('Cannot send whisper: WebSocket not connected');
    }
}

function setupEmotes(): void {
    const wheel = document.getElementById('emotes');
    if (!wheel) return;

    // Use level-locked emotes from config
    const emotes = EMOTES;
    const playerLevel = GameLogic.getLevel(player.xp);
    const radius = 65;

    // Display up to 12 emotes in the wheel (more can be unlocked)
    const displayEmotes = emotes.slice(0, 12);

    displayEmotes.forEach((emoteData: { emoji: string; unlock: number }, i: number) => {
        const angle = (i / displayEmotes.length) * Math.PI * 2 - Math.PI / 2;
        const x = 95 + Math.cos(angle) * radius - 20;
        const y = 95 + Math.sin(angle) * radius - 20;

        const opt = document.createElement('div');
        opt.className = 'emote';
        const isUnlocked = playerLevel >= emoteData.unlock;

        if (!isUnlocked) {
            opt.classList.add('locked');
            opt.innerHTML = `${emoteData.emoji}<span class="emote-level">Lv${emoteData.unlock}</span>`;
        } else {
            opt.textContent = emoteData.emoji;
        }

        opt.style.left = `${x}px`;
        opt.style.top = `${y}px`;

        opt.addEventListener('click', () => {
            if (!isUnlocked) {
                UIManager.toast(`Unlock at Level ${emoteData.unlock}`, 'warning');
                return;
            }
            doEmote(emoteData.emoji);
            UIManager.hideEmoteWheel();
        });

        wheel.appendChild(opt);
    });
}

function setupColorPicker(): void {
    const picker = document.getElementById('color-picker');
    if (!picker) return;

    const hues = [0, 30, 60, 120, 180, 210, 270, 300, 330];

    hues.forEach(h => {
        const opt = document.createElement('div');
        opt.className = 'color-opt';
        opt.style.background = `linear-gradient(135deg,hsl(${h},70%,55%),hsl(${h + 30},60%,45%))`;
        opt.style.boxShadow = `0 0 10px hsla(${h},70%,50%,0.4)`;

        if (Math.abs(h - player.hue) < 15 || Math.abs(h - player.hue) > 345) {
            opt.classList.add('selected');
        }

        opt.addEventListener('click', () => {
            player.hue = h;
            document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('selected'));
            opt.classList.add('selected');
            UIManager.updateHUD(player);
        });

        picker.appendChild(opt);
    });
}

function doEmote(emote: string): void {
    // 100% Server-authoritative: Only send request, effects happen on broadcast
    if (wsClient.isConnected()) {
        wsClient.sendEmote(player, emote);
    } else {
        // No connection - warn user, don't apply local effects
        UIManager.toast('⚠️ Not connected', 'warning');
        console.warn('Cannot emote: WebSocket not connected');
    }
}

function doSing(): void {
    // 100% Server-authoritative: Only send request, effects happen on broadcast
    if (wsClient.isConnected()) {
        wsClient.sendSing(player);
    } else {
        // No connection - warn user, don't apply local effects
        UIManager.toast('⚠️ Not connected', 'warning');
        console.warn('Cannot sing: WebSocket not connected');
    }
}

function doPulse(): void {
    // 100% Server-authoritative: Only send request, effects happen on broadcast
    if (wsClient.isConnected()) {
        wsClient.sendPulse(player);
    } else {
        // No connection - warn user, don't apply local effects
        UIManager.toast('⚠️ Not connected', 'warning');
        console.warn('Cannot pulse: WebSocket not connected');
    }
}

// === SERVER-AUTHORITATIVE EFFECT HANDLERS ===
// These are called when receiving broadcasts from the server

function applySingEffect(playerId: string, x: number, y: number, hue: number): void {
    const isSelf = playerId === player.id;

    if (isSelf) {
        player.singing = 1;
        if (settings.shake) camera.shake = 0.3;
        // Server handles stats and XP - just update local progress for UI
        dailyProgress.sings++;
        PersistenceManager.saveDailyProgress(dailyProgress);
    } else {
        // Update other player's singing state
        const other = others.get(playerId);
        if (other) other.singing = 1;
    }

    // Play audio and particles for everyone
    audio.playSing(hue);
    if (settings.particles) {
        GameLogic.spawnParticles(x, y, hue, 30, isSelf, particles);
    }
}

function applyPulseEffect(playerId: string, x: number, y: number): void {
    const isSelf = playerId === player.id;
    const pulseHue = isSelf ? player.hue : (others.get(playerId)?.hue || 200);

    if (isSelf) {
        player.pulsing = 1;
        if (settings.shake) camera.shake = 0.5;
        // Server handles stats and XP

        // Light stars for local player
        const viewRadius = GameLogic.getViewRadius(player);
        let lit = 0;
        const litStarIds: string[] = [];

        for (const [k, arr] of stars) {
            if (!k.startsWith(gameState.currentRealm + ':')) continue;
            for (const s of arr) {
                const dist = Math.hypot(s.x - x, s.y - y);
                if (dist < viewRadius * 1.8 && !s.lit) {
                    s.lit = true;
                    s.burst = 1;
                    lit++;
                    litStarIds.push(s.id || k);
                }
            }
        }

        if (lit > 0) {
            // Server will handle stats and XP for star lighting
            player.stars += lit;  // Local counter for UI
            dailyProgress.stars += lit;
            PersistenceManager.saveDailyProgress(dailyProgress);
            weeklyProgress.stars += lit;
            PersistenceManager.saveWeeklyProgress(weeklyProgress);
            UIManager.updateHUD(player);
            // Play star ignition audio with pitch based on count
            audio.playStarIgnite(lit);
            // Broadcast which stars were lit - server will award XP
            if (wsClient.isConnected() && litStarIds.length > 0) {
                wsClient.sendStarLit(player, litStarIds);
            }
        }
    } else {
        // Update other player's pulsing state
        const other = others.get(playerId);
        if (other) other.pulsing = 1;
    }

    // Play audio and particles for everyone
    audio.playPulse();
    if (settings.particles) {
        GameLogic.spawnParticles(x, y, pulseHue, 45, isSelf, particles);
    }
}

function applyEmoteEffect(playerId: string, emoji: string, x: number, y: number): void {
    const isSelf = playerId === player.id;

    if (isSelf) {
        player.emoting = emoji;
        player.emoteT = 0;
        // Server handles stats and XP
        dailyProgress.emotes++;
        PersistenceManager.saveDailyProgress(dailyProgress);
    } else {
        const other = others.get(playerId);
        if (other) {
            other.emoting = emoji;
            other.emoteT = 0;
        }
    }

    // Show floating emote for everyone
    const halo = isSelf ? player.halo : (others.get(playerId)?.halo || 55);
    floats.push(new FloatingText(x, y - halo - 35, emoji, 80, 22));
}

function applyEchoEffect(playerId: string, text: string, x: number, y: number, hue: number, playerName: string, echoId: string, ignited: number = 0): void {
    const isSelf = playerId === player.id;

    // Create echo for everyone
    const echo = new Echo(echoId, x, y, text, hue, playerName, gameState.currentRealm, playerId, ignited);
    echoes.push(echo);

    if (isSelf) {
        // Server handles echo count and XP - just show visual feedback
        UIManager.toast('✨ Echo planted');
    }

    audio.playEcho();
}

function gainXP(amount: number): void {
    const oldLevel = GameLogic.getLevel(player.xp);
    player.xp += amount;
    const newLevel = GameLogic.getLevel(player.xp);

    floats.push(new FloatingText(player.x, player.y - player.halo - 25, `+${amount} XP`, 50, 13));

    if (newLevel > oldLevel) {
        audio.playLevelUp();
        if (settings.particles) {
            GameLogic.spawnParticles(player.x, player.y, player.hue, 55, true, particles);
        }
        player.r = 11 + newLevel * 1.5;
        player.halo = 55 + newLevel * 8;
        UIManager.toast(`✨ Level ${newLevel}! You are now a ${GameLogic.getForm(newLevel)}`, 'level');
        UIManager.updateRealmLocks(player.xp);
    }

    UIManager.updateHUD(player);
}

// NOTE: manageBotPopulation, updateBots, fetchNearbyPlayers, fetchEchoes have been REMOVED
// Bots are now managed entirely by the server (WebSocketHandler.serverGameTick)
// All entities (players + bots + echoes) come through the 'world_state' WebSocket message at 20Hz
// This is the TRUE SERVER-AUTHORITATIVE model - no HTTP polling, no local simulation

/**
 * Setup EventBus listeners for server-authoritative network events
 * All game effects are triggered by these broadcasts from the server
 */
function setupNetworkEventListeners(): void {
    // Handle player updates from server
    EventBus.on('network:playerUpdate', ({ player: p, isSelf }) => {
        if (isSelf) {
            // We can optionally reconcile server state with local
            // For now, we trust local movement for responsiveness
        } else {
            // Update or add other player
            const existing = others.get(p.id);
            if (existing) {
                existing.x = p.x;
                existing.y = p.y;
                existing.name = p.name;
                existing.hue = p.hue;
                existing.xp = p.xp;
                existing.singing = p.singing || 0;
                existing.pulsing = p.pulsing || 0;
                existing.emoting = p.emoting;
            } else {
                const level = Math.floor(p.xp / 100);
                others.set(p.id, {
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    name: p.name,
                    hue: p.hue,
                    xp: p.xp || 0,
                    stars: p.stars || 0,
                    echoes: p.echoes || 0,
                    r: 11 + level * 1.5,
                    halo: 40 + level * 5,
                    singing: p.singing || 0,
                    pulsing: p.pulsing || 0,
                    emoting: p.emoting || null,
                    emoteT: 0,
                    trail: [],
                    born: p.born || Date.now(),
                    speaking: false,
                    isBot: false
                });
            }
        }
    });

    // Handle player join (new player in realm)
    EventBus.on('network:playerJoined', ({ player: p }) => {
        if (p.id === player.id) return;

        const level = Math.floor((p.xp || 0) / 100);
        others.set(p.id, {
            id: p.id,
            x: p.x || 0,
            y: p.y || 0,
            name: p.name || 'Wanderer',
            hue: p.hue || 200,
            xp: p.xp || 0,
            stars: p.stars || 0,
            echoes: p.echoes || 0,
            r: 11 + level * 1.5,
            halo: 40 + level * 5,
            singing: 0,
            pulsing: 0,
            emoting: null,
            emoteT: 0,
            trail: [],
            born: Date.now(),
            speaking: false,
            isBot: false
        });
        console.log(`🌟 ${p.name || 'Wanderer'} joined the realm`);
    });

    // Handle player leave
    EventBus.on('network:playerLeft', ({ playerId }) => {
        const leaving = others.get(playerId);
        if (leaving) {
            console.log(`👋 ${leaving.name} left the realm`);
            others.delete(playerId);
        }
    });

    // === SERVER-AUTHORITATIVE ACTION HANDLERS ===
    // These trigger effects when the server broadcasts them

    EventBus.on('network:sing', (data) => {
        console.log(`🎵 Server broadcast: ${data.playerName} is singing`);
        applySingEffect(data.playerId, data.x, data.y, data.hue);
    });

    EventBus.on('network:pulse', (data) => {
        console.log(`💫 Server broadcast: ${data.playerName} pulsed`);
        applyPulseEffect(data.playerId, data.x, data.y);
    });

    EventBus.on('network:emote', (data) => {
        console.log(`${data.emoji} Server broadcast: ${data.playerName} emoted`);
        applyEmoteEffect(data.playerId, data.emoji, data.x, data.y);
    });

    EventBus.on('network:echo', (data) => {
        console.log(`📢 Server broadcast: ${data.playerName} created echo`);
        applyEchoEffect(data.playerId, data.text, data.x, data.y, data.hue, data.playerName, data.echoId, data.ignited);
    });

    EventBus.on('network:echoIgnited', (data) => {
        const echo = echoes.find(e => e.id === data.echoId);
        if (echo) {
            echo.ignited = data.ignited;
            echo.pulse = 1.0; // Visual pulse
            // Play ignition sound
            audio.playStarIgnite(echo.ignited);
        }
    });

    EventBus.on('network:whisper', (data) => {
        // Show incoming whisper
        UIManager.toast(`💬 ${data.fromName}: ${data.text}`, 'whisper');
        audio.playWhisperRecv();

        // Show floating text at sender position
        floats.push(new FloatingText(data.x, data.y - 50, `💬 ${data.text}`, 90, 12));
    });

    EventBus.on('network:starLit', (data) => {
        // Another player lit stars - update visuals
        if (!data.isSelf && data.starIds) {
            let starsLit = 0;
            for (const starId of data.starIds) {
                for (const [k, arr] of stars) {
                    for (const s of arr) {
                        if ((s.id || k) === starId && !s.lit) {
                            s.lit = true;
                            s.burst = 1;
                            starsLit++;
                        }
                    }
                }
            }
            // Play star ignition audio with pitch based on count
            if (starsLit > 0) {
                audio.playStarIgnite(starsLit);
            }
        }
    });

    // Handle significant connection event
    EventBus.on('network:connectionMade', (data) => {
        const otherName = data.player1Id === player.id ? data.player2Name : data.player1Name;
        UIManager.toast(`🔗 Connected with ${otherName}!`, 'conn');
        audio.playConn();
        // Add visual particle burst at player position? (handled locally by update loop maybe)
    });

    // === SERVER-AUTHORITATIVE WORLD STATE ===
    // This is the PRIMARY way we receive all entities (players + bots)
    // The server broadcasts this at 20Hz to all clients
    EventBus.on('network:worldState', (data) => {
        const { entities, litStars: _litStars, echoes: serverEchoes, linkedCount } = data;

        // Update local player stats
        if (linkedCount !== undefined) {
            player.linkedCount = linkedCount;
            stats.connections = linkedCount; // Keep stats in sync
            UIManager.updateHUD(player);
        }

        // Clear and rebuild others map from server entities
        // Keep track of IDs we've seen to remove stale entries
        const seenIds = new Set<string>();

        for (const entity of entities) {
            if (entity.id === player.id) {
                // Skip self - we control our own position locally for responsiveness
                continue;
            }

            seenIds.add(entity.id);

            const existing = others.get(entity.id);
            const level = Math.floor((entity.xp || 0) / 100);

            if (existing) {
                // Smooth interpolation for existing entities
                existing.x = existing.x * 0.7 + entity.x * 0.3;
                existing.y = existing.y * 0.7 + entity.y * 0.3;
                existing.name = entity.name || existing.name;
                existing.hue = entity.hue;
                existing.xp = entity.xp || 0;
                existing.singing = entity.singing || 0;
                existing.pulsing = entity.pulsing || 0;
                existing.emoting = entity.emoting || null;
                existing.isBot = entity.isBot || false;
                // Bot message system
                existing.message = entity.message || undefined;
                existing.messageTimer = entity.messageTimer || undefined;
                // Update bond strength from server
                if (entity.bondToViewer !== undefined) {
                    existing.bondToViewer = entity.bondToViewer;
                }
            } else {
                // New entity
                others.set(entity.id, {
                    id: entity.id,
                    x: entity.x,
                    y: entity.y,
                    name: entity.name || 'Wanderer',
                    hue: entity.hue || 200,
                    xp: entity.xp || 0,
                    stars: entity.stars || 0,
                    echoes: entity.echoes || 0,
                    r: 11 + level * 1.5,
                    halo: 40 + level * 5,
                    singing: entity.singing || 0,
                    pulsing: entity.pulsing || 0,
                    emoting: entity.emoting || null,
                    emoteT: 0,
                    trail: [],
                    born: entity.born || Date.now(),
                    speaking: false,
                    isBot: entity.isBot || false,
                    // Bot message system
                    message: entity.message,
                    messageTimer: entity.messageTimer,
                    // Bond system
                    bondToViewer: entity.bondToViewer
                });
            }
        }

        // Remove entities no longer in server state
        for (const [id] of others) {
            if (!seenIds.has(id)) {
                others.delete(id);
            }
        }

        // Update lit stars from server (commented out for now - stars handled separately)
        // TODO: Server-authoritative stars

        // Update echoes from server
        if (serverEchoes && serverEchoes.length > 0) {
            for (const e of serverEchoes) {
                const exists = echoes.some(local =>
                    (Math.abs(local.x - e.x) < 5 && Math.abs(local.y - e.y) < 5)
                );
                if (!exists && echoes.length < 100) {
                    echoes.push(new Echo(e.id, e.x, e.y, e.text, e.hue || 200, e.name || 'Unknown', e.realm || gameState.currentRealm, e.authorId || '', e.ignited || 0));
                }
            }
        }
    });

    // Connection status
    EventBus.on('network:connected', () => {
        UIManager.toast('🔌 Connected to server', 'success');
    });

    EventBus.on('network:disconnected', () => {
        UIManager.toast('⚠️ Disconnected from server', 'warning');
    });

    EventBus.on('network:error', ({ error }) => {
        console.error('Network error:', error);
    });

    // === SERVER-AUTHORITATIVE PLAYER DATA ===
    // Loaded from database when connecting
    EventBus.on('network:playerData', (data) => {
        const now = Date.now();
        console.log(`📂 Loaded player data from server: ${data.name} (Level ${data.level})`);

        // Sync player state with server
        player.name = data.name;
        player.hue = data.hue;

        // Only update XP if we haven't received any xpGain messages yet
        // This prevents race conditions where playerData arrives after xpGain
        if (lastXpGainAt === 0 || now < lastXpGainAt) {
            player.xp = data.xp;
            player.stars = data.stars;
            player.echoes = data.echoes;
            stats.level = data.level;
            stats.stars = data.stars;
            stats.echoes = data.echoes;
        }

        // Always update action stats from server (these don't change during XP gain)
        stats.sings = data.sings || 0;
        stats.pulses = data.pulses || 0;
        stats.emotes = data.emotes || 0;
        stats.teleports = data.teleports || 0;

        // Update visual size based on level
        const currentLevel = stats.level || data.level;
        player.r = 11 + currentLevel * 1.5;
        player.halo = 55 + currentLevel * 8;

        // Restore position if available
        if (data.lastPosition && data.lastRealm === gameState.currentRealm) {
            player.x = data.lastPosition.x;
            player.y = data.lastPosition.y;
            player.tx = data.lastPosition.x;
            player.ty = data.lastPosition.y;
            console.log(`📍 Restored position: ${player.x.toFixed(0)}, ${player.y.toFixed(0)}`);
        }

        // Sync friends from server
        friends.clear();
        for (const friend of data.friends) {
            friends.add(friend.id);
        }

        // Sync achievements from server
        for (const achId of data.achievements) {
            unlocked.add(achId);
        }

        // Update UI
        UIManager.updateHUD(player);
        UIManager.updateRealmLocks(player.xp);

        // Check achievements with restored stats
        checkAchievements();

        // playerDataLoadedAt = now;
        console.log(`✅ Synced ${friends.size} friends and ${unlocked.size} achievements from server`);
    });

    // === SERVER-AUTHORITATIVE XP GAINS ===
    // XP is now calculated server-side only
    EventBus.on('network:xpGain', (data) => {
        const { amount, reason, newXp, newLevel, leveledUp } = data;
        lastXpGainAt = Date.now();

        // Update local state with server-authoritative values
        const oldLevel = GameLogic.getLevel(player.xp);
        player.xp = newXp;

        // Show XP gain floating text
        floats.push(new FloatingText(player.x, player.y - player.halo - 25, `+${amount} XP`, 50, 13));

        // Update action stats based on reason
        if (reason === 'sing') stats.sings++;
        else if (reason === 'pulse') stats.pulses++;
        else if (reason === 'emote') stats.emotes++;

        // Handle level up
        if (leveledUp && newLevel > oldLevel) {
            audio.playLevelUp();
            if (settings.particles) {
                GameLogic.spawnParticles(player.x, player.y, player.hue, 55, true, particles);
            }
            player.r = 11 + newLevel * 1.5;
            player.halo = 55 + newLevel * 8;
            stats.level = newLevel;
            UIManager.toast(`✨ Level ${newLevel}! You are now a ${GameLogic.getForm(newLevel)}`, 'level');
            UIManager.updateRealmLocks(player.xp);
        }

        UIManager.updateHUD(player);
        checkAchievements();
        console.log(`⭐ XP gained: +${amount} (${reason}) - Total: ${newXp}`);
    });

    // === COOLDOWN FEEDBACK ===
    EventBus.on('network:cooldown', (data) => {
        const seconds = (data.remainingMs / 1000).toFixed(1);
        UIManager.toast(`⏳ ${data.action} on cooldown (${seconds}s)`, 'warning');
    });

    // === FRIENDS SYSTEM (Server-Synced) ===
    EventBus.on('network:friendAdded', (data) => {
        friends.add(data.friendId);
        stats.friends = friends.size;
        weeklyProgress.newFriends++;
        PersistenceManager.saveWeeklyProgress(weeklyProgress);
        UIManager.toast(`Added ${data.friendName} as friend! ❤️`, 'success');
        checkAchievements();
    });

    EventBus.on('network:friendRemoved', (data) => {
        friends.delete(data.friendId);
        stats.friends = friends.size;
    });

    // === TELEPORT (Server-Validated) ===
    EventBus.on('network:teleportSuccess', (data) => {
        // Update player position from server
        player.x = data.x;
        player.y = data.y;
        player.tx = data.x;
        player.ty = data.y;

        stats.teleports++;
        UIManager.toast(`Teleported to ${data.friendName}! 🌀`);
        UIManager.hideProfile();

        // Visual effect
        if (settings.particles) {
            GameLogic.spawnParticles(player.x, player.y, player.hue, 40, true, particles);
        }

        checkAchievements();
    });

    // === VOICE SIGNALING ===
    EventBus.on('network:voiceSignal', (data) => {
        // Forward to voice chat system
        voiceChat.handleSignal({
            from: data.fromId,
            signalType: data.signalType,
            data: data.signalData
        });
    });
}

function startGame(): void {
    console.log('🌌 AURA - The Social Cosmos initialized (Server-Authoritative)');
    console.log('Player:', player.name, 'ID:', player.id);

    // Ensure canvas dimensions are set properly (including minimap)
    resize();

    // Initialize UI
    UIManager.updateHUD(player);
    UIManager.updateRealmUI(gameState.currentRealm);

    // Ensure stars around player
    GameLogic.ensureStars(player.x, player.y, gameState.currentRealm, stars);

    // Quest timer and daily reset
    setInterval(updateQuestTimer, 1000);
    setInterval(checkDailyReset, 60000);
    checkWeeklyQuests(); // Check on startup

    // === WEBSOCKET CONNECTION (Primary - Real-time sync) ===
    setupNetworkEventListeners();
    wsClient.connect(player.id, gameState.currentRealm as import('./types').RealmId).then((connected) => {
        if (connected) {
            console.log('✅ WebSocket connected - Real-time sync active');
            // Start sending position updates via WebSocket
            setInterval(() => {
                if (wsClient.isConnected()) {
                    wsClient.sendPlayerUpdate(player);
                }
            }, 100); // 10Hz position updates for smooth sync
        } else {
            console.warn('⚠️ WebSocket failed - no connection to server');
        }
    });

    // NOTE: HTTP polling has been REMOVED - we are now fully server-authoritative via WebSocket
    // All entities (players + bots) come through the 'world_state' message at 20Hz
    // No more fetchNearbyPlayers, fetchEchoes, or startPositionSync

    // Start game loops
    requestAnimationFrame(render);
    setInterval(update, 16);
}

function update(): void {
    if (!gameState.gameActive) return;

    // Update player movement
    const oldX = player.x;
    const oldY = player.y;
    player.x += (player.tx - player.x) * CONFIG.DRIFT;
    player.y += (player.ty - player.y) * CONFIG.DRIFT;

    // Update trail (decay faster when far from center - Campfire Model)
    if (Math.hypot(player.x - oldX, player.y - oldY) > 1.5) {
        player.trail.push({ x: player.x, y: player.y, life: 1 });
        if (player.trail.length > 45) player.trail.shift();
    }
    const distFromCenter = Math.hypot(player.x, player.y);
    const trailDecayRate = distFromCenter > CONFIG.CAMPFIRE_RADIUS ? 0.04 : 0.022;
    for (const t of player.trail) {
        t.life -= trailDecayRate;
    }

    // Update camera
    camera.tx = player.x - W / 2;
    camera.ty = player.y - H / 2;
    camera.x += (camera.tx - camera.x) * 0.075;
    camera.y += (camera.ty - camera.y) * 0.075;

    if (camera.shake > 0) {
        camera.shake -= 0.03;
        camera.x += (Math.random() - 0.5) * camera.shake * 12;
        camera.y += (Math.random() - 0.5) * camera.shake * 12;
    }

    // Update effects for local player
    player.singing = Math.max(0, player.singing - 0.016);
    player.pulsing = Math.max(0, player.pulsing - 0.01);

    if (player.emoteT > 0) {
        player.emoteT -= 0.016;
        if (player.emoteT <= 0) player.emoting = null;
    }

    // Update effects for other players (decay their visual states)
    for (const other of others.values()) {
        other.singing = Math.max(0, (other.singing || 0) - 0.016);
        other.pulsing = Math.max(0, (other.pulsing || 0) - 0.01);
        if (other.emoteT !== undefined && other.emoteT > 0) {
            other.emoteT -= 0.016;
            if (other.emoteT <= 0) other.emoting = null;
        }
    }

    // Voice peer discovery - check nearby players for voice connections (throttled)
    voicePeerUpdateCounter++;
    if (voicePeerUpdateCounter >= VOICE_PEER_UPDATE_INTERVAL) {
        voicePeerUpdateCounter = 0;
        if (voiceChat.enabled) {
            const nearbyVoicePeers = new Set<string>();
            const VOICE_RANGE = 500; // Same as spatial audio range

            for (const [id, other] of others.entries()) {
                // Skip bots - they don't have voice
                if (other.isBot) continue;

                const dist = Math.hypot(other.x - player.x, other.y - player.y);
                if (dist <= VOICE_RANGE) {
                    nearbyVoicePeers.add(id);
                }
            }

            // Update voice connections and spatial audio
            voiceChat.updateNearbyPeers(nearbyVoicePeers);

            // Update spatial audio volumes for connected peers
            for (const id of voiceChat.getConnectedPeers()) {
                const other = others.get(id);
                if (other) {
                    const dist = Math.hypot(other.x - player.x, other.y - player.y);
                    voiceChat.updateSpatialAudio(id, dist, VOICE_RANGE);
                }
            }
        }
    }

    // Update particles
    GameLogic.updateParticles(particles);

    // Update floating text
    for (let i = floats.length - 1; i >= 0; i--) {
        floats[i].update();
        if (floats[i].life <= 0) {
            floats.splice(i, 1);
        }
    }

    // Update stars
    GameLogic.updateStars(stars);

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (projectiles[i].life <= 0) {
            projectiles.splice(i, 1);
        }
    }

    // NOTE: Bot management removed - bots are now server-authoritative
    // They come through the 'world_state' WebSocket message every 50ms (20Hz)

    // Ensure stars around player
    GameLogic.ensureStars(player.x, player.y, gameState.currentRealm, stars);
}

function render(): void {
    const viewRadius = GameLogic.getViewRadius(player);

    // Debug: Log others count periodically
    if (Math.random() < 0.01) { // 1% of frames
        console.log(`🎨 Render: ${others.size} others in map, viewRadius: ${viewRadius}, player at (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`);
        if (others.size > 0) {
            others.forEach((o, _id) => {
                const dist = Math.hypot(o.x - player.x, o.y - player.y);
                console.log(`   - ${o.name} at (${o.x.toFixed(0)}, ${o.y.toFixed(0)}), dist: ${dist.toFixed(0)}, visible: ${dist <= viewRadius + 120}`);
            });
        }
    }

    // Clear with fade
    renderer.clear(gameState.currentRealm);

    renderer.save();
    renderer.translate(-camera.x, -camera.y);

    // Render world
    renderer.renderNebula(camera, player, gameState.currentRealm);
    renderer.renderBgStars(camera);
    renderer.renderStars(stars, player, viewRadius, gameState.currentRealm);
    renderer.renderEchoes(echoes, player, viewRadius, gameState.currentRealm);
    renderer.renderConstellations(constellations);
    renderer.renderTethers(player, others);
    renderer.renderOthers(others, player, viewRadius);
    // NOTE: Bots are now rendered as part of 'others' - they come from server with isBot=true
    renderer.renderProjectiles(projectiles);
    renderer.renderPlayer(player, gameState.voiceOn, gameState.isSpeaking);
    renderer.renderParticles(particles);
    renderer.renderFloats(floats);

    renderer.restore();

    // Render UI overlays (screen space)
    renderer.renderCompass(player); // Navigation compass for distant players

    // Render UI overlays
    renderer.renderVignette();
    renderer.renderMinimap(player, others, echoes, viewRadius, gameState.currentRealm);

    requestAnimationFrame(render);
}

// Initialize on load
setupUI();
setupEmotes();
setupColorPicker();

// Cursor tracking
window.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('cursor');
    if (cursor) {
        cursor.style.left = `${e.clientX - 14}px`;
        cursor.style.top = `${e.clientY - 14}px`;
    }
});
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const cursor = document.getElementById('cursor');
    if (cursor && e.touches[0]) {
        cursor.style.left = `${e.touches[0].clientX - 14}px`;
        cursor.style.top = `${e.touches[0].clientY - 14}px`;
    }
}, { passive: false });

console.log('✨ AURA TypeScript initialized');

// === HELPER FUNCTIONS FOR NEW FEATURES ===

/**
 * Toggle voice chat on/off
 */
async function toggleVoice(): Promise<void> {
    // State 1: Disabled -> Enabled (Mic On)
    if (!voiceChat.enabled) {
        // Init logic...
        voiceChat.setUserId(player.id);
        voiceChat.setSignalSender((targetId, signalType, data) => {
            if (wsClient.isConnected()) {
                wsClient.sendVoiceSignal(targetId, signalType, data);
            }
        });

        const success = await voiceChat.init();
        if (success) {
            gameState.voiceOn = true;
            stats.voice = 1;
            PersistenceManager.saveStats(stats);

            // Setup callbacks
            voiceChat.onSpeakingChange = (speaking) => {
                gameState.isSpeaking = speaking;
                updateVoiceUI();
            };

            voiceChat.onVolumeUpdate = (level) => {
                updateVoiceViz(level);
            };

            voiceChat.onConnectionStateChange = (peerId, state) => {
                if (state === 'connected') {
                    UIManager.toast(`🔗 Connected to peer`, 'success');
                } else if (state === 'failed') {
                    UIManager.toast(`❌ Connection failed`, 'error');
                } else if (state === 'disconnected') {
                    console.log(`🔌 Voice disconnected from ${peerId}`);
                }
            };

            updateVoiceUI();

            if (voiceChat.canSpeak) {
                console.log('🎙️ Voice enabled');
                UIManager.toast('🎙️ Voice Active', 'success');
            } else {
                UIManager.toast('🎧 Listen Only Mode', 'warning');
                console.log('🎧 Voice enabled (Listen Only)');
            }
        }
    }
    // State 2: Enabled (Mic On) -> Enabled (Muted)
    else if (!voiceChat.isMuted && voiceChat.canSpeak) {
        voiceChat.setMuted(true);
        UIManager.toast('🔇 Microphone Muted', 'info');
        updateVoiceUI();
    }
    // State 3: Enabled (Muted/Listen Only) -> Disabled
    else {
        voiceChat.disable();
        gameState.voiceOn = false;
        voiceChat.setMuted(false); // Reset state
        updateVoiceUI();
        UIManager.toast('🔌 Voice Disconnected', 'info');
        console.log('🔇 Voice disabled');
    }
}

/**
 * Update voice UI elements
 */
function updateVoiceUI(): void {
    const btn = document.getElementById('voice-btn');
    const status = document.getElementById('voice-status');
    const orb = document.getElementById('my-orb');

    if (voiceChat.enabled) {
        btn?.classList.add('on');
        btn?.classList.remove('muted');

        if (voiceChat.isMuted) {
            if (btn) btn.textContent = '🎧'; // Muted -> Headphones (Listen Mode)
            if (status) status.innerHTML = 'Muted<br><span style="font-size:0.7em;opacity:0.7">Click to disconnect</span>';
            orb?.classList.remove('speaking');
        } else if (!voiceChat.canSpeak) {
            if (btn) btn.textContent = '🎧'; // Forced Listen Only
            if (status) status.innerHTML = 'Listen Only<br><span style="font-size:0.7em;opacity:0.7">Click to disconnect</span>';
        } else {
            if (btn) btn.textContent = '🎙️'; // Active Mic
            if (status) status.innerHTML = 'Talk<br><span style="font-size:0.7em;opacity:0.7">Click to mute</span>';
            if (voiceChat.isSpeaking) {
                orb?.classList.add('speaking');
            } else {
                orb?.classList.remove('speaking');
            }
        }
    } else {
        btn?.classList.remove('on');
        btn?.classList.add('muted');
        if (btn) btn.textContent = '🔇';
        if (status) status.textContent = 'Off';
        orb?.classList.remove('speaking');
    }
}

/**
 * Update voice visualization bars
 */
function updateVoiceViz(level: number): void {
    const bars = document.querySelectorAll('#voice-viz .vbar');
    const heights = [4, 6, 10, 6, 4];

    if (voiceChat.enabled && voiceChat.isSpeaking) {
        bars.forEach((bar, i) => {
            (bar as HTMLElement).style.height = `${heights[i] + Math.random() * level * 15}px`;
            (bar as HTMLElement).style.background = 'var(--success)';
        });
    } else if (voiceChat.enabled) {
        bars.forEach((bar, i) => {
            (bar as HTMLElement).style.height = `${heights[i]}px`;
            (bar as HTMLElement).style.background = 'var(--blue)';
        });
    } else {
        bars.forEach((bar, i) => {
            (bar as HTMLElement).style.height = `${heights[i]}px`;
            (bar as HTMLElement).style.background = 'var(--text-dim)';
        });
    }
}

/**
 * Update quest timer display
 */
function updateQuestTimer(): void {
    const timer = document.getElementById('quest-timer');
    if (timer) {
        const timeLeft = PersistenceManager.getTimeUntilReset();
        timer.textContent = `Resets in ${PersistenceManager.formatTime(timeLeft)}`;
    }
}

/**
 * Check if daily quests should reset
 */
function checkDailyReset(): void {
    const newProgress = PersistenceManager.checkDailyReset(dailyProgress);
    if (newProgress !== dailyProgress) {
        dailyProgress = newProgress;
        PersistenceManager.saveDailyProgress(dailyProgress);
        console.log('🌅 Daily quests reset!');
        UIManager.updateQuests();
    }
}

/**
 * Check weekly quests progress
 */
function checkWeeklyQuests(): void {
    const weekly = PersistenceManager.loadWeeklyProgress();
    const currentWeek = PersistenceManager.getWeekNumber();

    if (weekly.week !== currentWeek) {
        // Reset weekly progress
        weeklyProgress = {
            week: currentWeek,
            whispers: 0,
            stars: 0,
            newFriends: 0,
            realmChanges: 0
        };
        PersistenceManager.saveWeeklyProgress(weeklyProgress);
        console.log('📆 Weekly quests reset!');
    }
}

/**
 * Check for newly unlocked achievements
 */
function checkAchievements(): void {
    const achievements = ACHIEVEMENTS;
    let newUnlocks = 0;

    for (const ach of achievements) {
        if (unlocked.has(ach.id)) continue;

        let earned = false;

        // Check requirement based on achievement type
        switch (ach.id) {
            case 'firstStar': earned = stats.stars >= 1; break;
            case 'stargazer': earned = stats.stars >= 25; break;
            case 'starlight': earned = stats.stars >= 100; break;
            case 'firstWord': earned = stats.whispers >= 1; break;
            case 'chatter': earned = stats.whispers >= 50; break;
            case 'connector': earned = stats.connections >= 10; break;
            case 'socialite': earned = stats.connections >= 50; break;
            case 'echomaker': earned = stats.echoes >= 10; break;
            case 'eternal': earned = stats.echoes >= 50; break;
            case 'singer': earned = stats.sings >= 25; break;
            case 'chorus': earned = stats.sings >= 100; break;
            case 'voyager': earned = visitedRealms.size >= 3; break;
            case 'explorer': earned = visitedRealms.size >= 5; break;
            case 'worldWalker': earned = visitedRealms.size >= 8; break;
            case 'ancient': {
                const hoursPlayed = (Date.now() - player.born) / (1000 * 60 * 60);
                earned = hoursPlayed >= 10;
                break;
            }
            case 'level5': earned = GameLogic.getLevel(player.xp) >= 5; break;
            case 'level10': earned = GameLogic.getLevel(player.xp) >= 10; break;
            case 'ascended': earned = GameLogic.getLevel(player.xp) >= 11; break;
            case 'friendMaker': earned = friends.size >= 5; break;
            case 'popular': earned = friends.size >= 15; break;
            case 'beloved': earned = friends.size >= 30; break;
            // Secret achievements
            case 'nightOwl': {
                const hour = new Date().getHours();
                earned = hour >= 2 && hour <= 5;
                break;
            }
            case 'marathon': earned = stats.marathon >= 60; break; // 60 mins continuous
            case 'constellation': earned = stats.constellation >= 3; break;
            case 'teleporter': earned = stats.teleports >= 10; break;
        }

        if (earned) {
            unlocked.add(ach.id);
            newUnlocks++;
            UIManager.toast(`🏆 Achievement: ${ach.name}!`, 'achievement');
            gainXP(ach.reward || 10);
        }
    }

    if (newUnlocks > 0) {
        PersistenceManager.saveAchievements(unlocked);
        UIManager.updateAchievements();
    }
}

/**
 * Save all game progress
 */
function saveProgress(): void {
    PersistenceManager.saveSettings(settings);
    PersistenceManager.saveStats(stats);
    PersistenceManager.saveDailyProgress(dailyProgress);
    PersistenceManager.saveWeeklyProgress(weeklyProgress);
    PersistenceManager.saveAchievements(unlocked);
    PersistenceManager.saveFriends(friends);
    PersistenceManager.saveVisitedRealms(visitedRealms);
    PersistenceManager.savePlayerData({
        name: player.name,
        xp: player.xp,
        stars: player.stars,
        echoes: player.echoes
    });
}

// Auto-save progress periodically
setInterval(saveProgress, 30000); // Every 30 seconds

// Save on page unload
window.addEventListener('beforeunload', saveProgress);
