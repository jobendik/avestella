// ⚠️ DEPRECATED FILE - DO NOT USE
// ==========================================
// This is an old refactoring attempt that was never completed.
// The active main file is src/main.ts which uses 100% server-authoritative architecture.
// 
// This file contains legacy patterns (client-side bots, HTTP fallbacks) that violate
// the server-authoritative model. It will be deleted in a future version.
//
// See src/main.ts for the correct implementation.
// ==========================================

throw new Error('main.new.ts is DEPRECATED - use main.ts instead');

// Main entry point for AURA application - Slim orchestration module
import { AudioManager } from './core/audio';
import { CONFIG } from './core/config';
import { Renderer } from './game/renderer';
import { GameLogic } from './game/logic';
import { UIManager } from './ui/manager';
import { NetworkManager } from './network/manager';
import { VoiceChat } from './core/voice';
import { PersistenceManager } from './core/persistence';
import { Star, Echo, Projectile, Particle, FloatingText, Bot } from './game/entities';

// New modular imports
import { EventBus } from './systems/EventBus';
import { GameLoop } from './systems/GameLoop';
import { InputController } from './controllers/InputController';
import { BotController } from './controllers/BotController';
import { NetworkController } from './controllers/NetworkController';
import { UIController } from './controllers/UIController';

import type { Player, Camera, Settings, Stats, DailyProgress, OtherPlayer, RealmId } from './types';

// ============================================
// STATE INITIALIZATION
// ============================================

const settings: Settings = {
    music: true,
    volume: 0.7,
    particles: true,
    shake: true,
    ptt: false,
    vad: true,
    sensitivity: 0.5,
    ...PersistenceManager.loadSettings()
};

const gameState = {
    gameActive: false,
    selectedId: null as string | null,
    showingSocial: false,
    showingAch: false,
    showingSettings: false,
    showingQuests: false,
    msgMode: null as 'whisper' | 'echo' | 'direct' | null,
    directTarget: null as string | null,
    currentRealm: 'genesis' as RealmId,
    voiceOn: false,
    isSpeaking: false
};

const stats: Stats = {
    whispers: 0,
    stars: 0,
    echoes: 0,
    connections: 0,
    maxBond: 0,
    voice: 0,
    level: 1,
    realms: 1,
    ...PersistenceManager.loadStats()
};

let dailyProgress: DailyProgress = PersistenceManager.loadDailyProgress();
const unlocked = PersistenceManager.loadAchievements();

// ============================================
// CANVAS & RENDERER SETUP
// ============================================

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

// ============================================
// GAME ENTITIES
// ============================================

const camera: Camera = { x: 0, y: 0, tx: 0, ty: 0, shake: 0 };
const others = new Map<string, OtherPlayer>();
const bots: Bot[] = [];
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
    hue: settings.hue || Math.random() * 360,
    xp: stats.level ? CONFIG.LEVEL_XP[stats.level - 1] || 0 : 0,
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

// ============================================
// CORE MANAGERS
// ============================================

const audio = new AudioManager(settings);
const network = new NetworkManager();
const voiceChat = new VoiceChat(settings);

// ============================================
// CONTROLLERS
// ============================================

const botController = new BotController({
    getPlayer: () => player,
    getOthers: () => others,
    getBots: () => bots,
    getParticles: () => particles,
    getFloats: () => floats,
    getSettings: () => settings,
    audio
});

const inputController = new InputController({
    canvas,
    getPlayer: () => player,
    getCamera: () => camera,
    getGameActive: () => gameState.gameActive,
    getDimensions: () => ({ width: W, height: H })
});

const networkController = new NetworkController({
    networkManager: network,
    getPlayer: () => player,
    getOthers: () => others,
    getEchoes: () => echoes,
    getCurrentRealm: () => gameState.currentRealm,
    getShowingSocial: () => gameState.showingSocial
});

// ============================================
// GAME LOOP
// ============================================

const gameLoop = new GameLoop({
    renderer,
    botController,
    getPlayer: () => player,
    getCamera: () => camera,
    getOthers: () => others,
    getBots: () => bots,
    getStars: () => stars,
    getEchoes: () => echoes,
    getProjectiles: () => projectiles,
    getParticles: () => particles,
    getFloats: () => floats,
    getConstellations: () => constellations,
    getSettings: () => settings,
    getCurrentRealm: () => gameState.currentRealm,
    getGameActive: () => gameState.gameActive,
    getVoiceState: () => ({ voiceOn: gameState.voiceOn, isSpeaking: gameState.isSpeaking }),
    getDimensions: () => ({ W, H })
});

// ============================================
// ACTION HANDLERS
// ============================================

function doSing(): void {
    player.singing = 1;
    audio.playSing(player.hue);
    GameLogic.spawnParticles(player.x, player.y, player.hue, 30, true, particles);
    if (settings.shake) camera.shake = 0.3;
    network.sendSing(player, gameState.currentRealm);
}

function doPulse(): void {
    player.pulsing = 1;
    audio.playPulse();
    GameLogic.spawnParticles(player.x, player.y, player.hue, 45, true, particles);
    if (settings.shake) camera.shake = 0.5;
    
    const viewRadius = GameLogic.getViewRadius(player);
    let lit = 0;
    
    for (const [k, arr] of stars) {
        if (!k.startsWith(gameState.currentRealm + ':')) continue;
        for (const s of arr) {
            const dist = Math.hypot(s.x - player.x, s.y - player.y);
            if (dist < viewRadius * 1.8 && !s.lit) {
                s.lit = true;
                s.burst = 1;
                lit++;
            }
        }
    }
    
    if (lit > 0) {
        player.stars += lit;
        gainXP(lit * 3);
        UIManager.updateHUD(player);
        EventBus.emit('game:starLit', { starId: '', count: lit });
    }
    
    network.sendPulse(player, gameState.currentRealm);
}

function doEmote(emote: string): void {
    player.emoting = emote;
    player.emoteT = 1;
    floats.push(new FloatingText(player.x, player.y - player.halo - 35, emote, 80, 22));
    network.sendEmote(player, emote, gameState.currentRealm);
}

function createEcho(text: string): void {
    const echo = new Echo(player.x, player.y, text, player.hue, player.name, gameState.currentRealm);
    echoes.push(echo);
    player.echoes++;
    gainXP(5);
    audio.playEcho();
    UIManager.toast('✨ Echo planted');
}

function createWhisper(text: string, targetId?: string): void {
    if (targetId) {
        const target = others.get(targetId);
        if (target) {
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            floats.push(new FloatingText(target.x, target.y - target.halo - 25, `💬 ${text}`, 90, 12));
            network.sendWhisper(player, text, dx, dy, targetId, gameState.currentRealm);
            UIManager.toast(`Whispered to ${target.name}`);
        }
    } else {
        floats.push(new FloatingText(player.x, player.y - player.halo - 25, `💬 ${text}`, 90, 12));
        network.sendWhisper(player, text, 0, 0, undefined, gameState.currentRealm);
    }
    audio.playWhisperSend();
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
        EventBus.emit('player:levelUp', { oldLevel, newLevel });
    }
    
    UIManager.updateHUD(player);
}

function changeRealm(realmId: string): void {
    if (realmId === gameState.currentRealm) return;
    
    const realmData: Record<string, { icon: string; name: string }> = {
        genesis: { icon: '🌌', name: 'Genesis' },
        nebula: { icon: '🌸', name: 'Nebula Gardens' },
        void: { icon: '🌑', name: 'The Void' },
        starforge: { icon: '🔥', name: 'Starforge' },
        sanctuary: { icon: '🏛️', name: 'Sanctuary' }
    };
    
    const realm = realmData[realmId];
    if (!realm) return;
    
    UIManager.showRealmTransition(realm.name, realm.icon, () => {
        gameState.currentRealm = realmId as RealmId;
        document.querySelectorAll('.realm').forEach(r => r.classList.remove('active'));
        document.querySelector(`[data-realm="${realmId}"]`)?.classList.add('active');
        document.getElementById('realm-icon')!.textContent = realm.icon;
        document.getElementById('realm-text')!.textContent = realm.name;
        others.clear();
        audio.setRealmTone(realmId as RealmId);
        EventBus.emit('game:realmChange', { realmId });
    });
}

// ============================================
// UI CONTROLLER
// ============================================

const uiController = new UIController({
    getPlayer: () => player,
    getOthers: () => others,
    getSettings: () => settings,
    getGameState: () => gameState,
    setGameState: (updates) => Object.assign(gameState, updates),
    audio,
    onRealmChange: changeRealm,
    onCreateEcho: createEcho,
    onCreateWhisper: createWhisper,
    onSing: doSing,
    onPulse: doPulse,
    onEmote: doEmote
});

// ============================================
// VOICE CHAT
// ============================================

async function toggleVoice(): Promise<void> {
    if (voiceChat.enabled) {
        voiceChat.disable();
        gameState.voiceOn = false;
        updateVoiceUI();
        EventBus.emit('voice:disabled');
    } else {
        const success = await voiceChat.init();
        if (success) {
            gameState.voiceOn = true;
            stats.voice = 1;
            PersistenceManager.saveStats(stats);
            
            voiceChat.onSpeakingChange = (speaking) => {
                gameState.isSpeaking = speaking;
                updateVoiceUI();
                EventBus.emit('voice:speaking', { speaking });
            };
            
            voiceChat.onVolumeUpdate = (level) => {
                updateVoiceViz(level);
                EventBus.emit('voice:volumeUpdate', { level });
            };
            
            updateVoiceUI();
            EventBus.emit('voice:enabled');
        }
    }
}

function updateVoiceUI(): void {
    const btn = document.getElementById('voice-btn');
    const status = document.getElementById('voice-status');
    const orb = document.getElementById('my-orb');
    
    if (voiceChat.enabled) {
        btn?.classList.add('on');
        btn?.classList.remove('muted');
        if (btn) btn.textContent = '🎙️';
        if (status) status.textContent = voiceChat.isSpeaking ? 'Talk' : 'On';
        orb?.classList.toggle('speaking', voiceChat.isSpeaking);
    } else {
        btn?.classList.remove('on');
        btn?.classList.add('muted');
        if (btn) btn.textContent = '🔇';
        if (status) status.textContent = 'Off';
        orb?.classList.remove('speaking');
    }
}

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

// Setup voice button
document.getElementById('voice-btn')?.addEventListener('click', toggleVoice);

// ============================================
// PERSISTENCE & QUESTS
// ============================================

function updateQuestTimer(): void {
    const timer = document.getElementById('quest-timer');
    if (timer) {
        const timeLeft = PersistenceManager.getTimeUntilReset();
        timer.textContent = `Resets in ${PersistenceManager.formatTime(timeLeft)}`;
    }
}

function checkDailyReset(): void {
    const newProgress = PersistenceManager.checkDailyReset(dailyProgress);
    if (newProgress !== dailyProgress) {
        dailyProgress = newProgress;
        PersistenceManager.saveDailyProgress(dailyProgress);
        console.log('🌅 Daily quests reset!');
        UIManager.updateQuests();
    }
}

function saveProgress(): void {
    PersistenceManager.saveSettings(settings);
    PersistenceManager.saveStats(stats);
    PersistenceManager.saveDailyProgress(dailyProgress);
    PersistenceManager.saveAchievements(unlocked);
}

// Auto-save progress periodically
setInterval(saveProgress, 30000);
window.addEventListener('beforeunload', saveProgress);

// ============================================
// GAME START
// ============================================

function startGame(): void {
    console.log('🌌 AURA - The Social Cosmos initialized');
    console.log('Player:', player.name, 'ID:', player.id);
    
    resize();
    
    UIManager.updateHUD(player);
    UIManager.updateRealmUI(gameState.currentRealm);
    
    GameLogic.ensureStars(player.x, player.y, gameState.currentRealm, stars);
    
    // Start timers
    setInterval(updateQuestTimer, 1000);
    setInterval(checkDailyReset, 60000);
    
    // Start controllers
    inputController.init();
    networkController.start();
    gameLoop.start();
    
    gameState.gameActive = true;
}

// Listen for game start event from UI
EventBus.on('game:start', () => {
    startGame();
});

// ============================================
// INITIALIZATION
// ============================================

uiController.init();

console.log('✨ AURA TypeScript initialized (Modular Architecture)');
