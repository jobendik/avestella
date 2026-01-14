// Main entry point for AURA application
import { AudioManager } from './core/audio';
import { CONFIG } from './core/config';
import { Renderer } from './game/renderer';
import { GameLogic } from './game/logic';
import { UIManager } from './ui/manager';
import { NetworkManager } from './network/manager';
import { VoiceChat } from './core/voice';
import { PersistenceManager } from './core/persistence';
import { Star, Echo, Projectile, Particle, FloatingText, Bot } from './game/entities';
import type { Player, Camera, Settings, GameState, OtherPlayer, Stats, DailyProgress } from './types';

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

// Initialize managers
const audio = new AudioManager(settings);
const network = new NetworkManager();
const voiceChat = new VoiceChat(settings);

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
    ...PersistenceManager.loadStats()
};

let dailyProgress: DailyProgress = PersistenceManager.loadDailyProgress();
const unlocked = PersistenceManager.loadAchievements();

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
const bots: Bot[] = []; // Guardian bots to maintain minimum population
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
        
        let clicked: string | null = null;
        let clickedBot: Bot | null = null;
        
        // Check other players first
        for (const [id, other] of others) {
            const dist = Math.hypot(other.x - mx, other.y - my);
            if (dist < other.halo) {
                clicked = id;
                break;
            }
        }
        
        // Check bots if no player was clicked
        if (!clicked) {
            for (const bot of bots) {
                const dist = Math.hypot(bot.x - mx, bot.y - my);
                const botR = 11 + 1.5 * Math.floor(bot.xp / 100);
                if (dist < botR + 10) {
                    clickedBot = bot;
                    break;
                }
            }
        }
        
        if (clicked) {
            gameState.selectedId = clicked;
            UIManager.showProfile(others.get(clicked)!, e.clientX, e.clientY);
            // Don't move when clicking on players
            e.stopPropagation();
        } else if (clickedBot) {
            // Show a simple profile for bots
            const botLevel = Math.floor(clickedBot.xp / 100);
            const botAsPlayer: OtherPlayer = {
                id: clickedBot.id,
                name: clickedBot.name,
                hue: clickedBot.hue,
                xp: clickedBot.xp,
                x: clickedBot.x,
                y: clickedBot.y,
                stars: 0,
                echoes: 0,
                r: 11 + botLevel * 1.5,
                halo: 40 + botLevel * 5,
                singing: 0,
                pulsing: 0,
                emoting: null,
                emoteT: 0,
                trail: clickedBot.trail,
                born: Date.now(),
                speaking: false,
                isBot: true
            };
            gameState.selectedId = clickedBot.id;
            UIManager.showProfile(botAsPlayer, e.clientX, e.clientY);
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
        sanctuary: { icon: '🏛️', name: 'Sanctuary' }
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
            
            // Clear other players and stars from old realm
            others.clear();
            
            setTimeout(() => {
                trans.classList.remove('active');
            }, 800);
        }, 600);
    }
}

function createEcho(text: string): void {
    const echo = new Echo(player.x, player.y, text, player.hue, player.name, player.id);
    echoes.push(echo);
    player.echoes++;
    gainXP(5);
    audio.playEcho();
    UIManager.toast('✨ Echo planted');
    // TODO: Implement network.sendEcho when backend supports it
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

function setupEmotes(): void {
    const wheel = document.getElementById('emotes');
    if (!wheel) return;

    const EMOTES = ['😊', '❤️', '👋', '✨', '🌟', '🔥', '💫', '🎵'];
    const radius = 65;

    EMOTES.forEach((emote, i) => {
        const angle = (i / EMOTES.length) * Math.PI * 2 - Math.PI / 2;
        const x = 95 + Math.cos(angle) * radius - 20;
        const y = 95 + Math.sin(angle) * radius - 20;

        const opt = document.createElement('div');
        opt.className = 'emote';
        opt.textContent = emote;
        opt.style.left = `${x}px`;
        opt.style.top = `${y}px`;
        opt.addEventListener('click', () => {
            doEmote(emote);
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
    player.emoting = emote;
    player.emoteT = 0;
    floats.push(new FloatingText(player.x, player.y - player.halo - 35, emote, 80, 22));
    network.sendEmote(player, emote, gameState.currentRealm);
}

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
    }
    
    network.sendPulse(player, gameState.currentRealm);
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

/**
 * Manage bot population to maintain minimum population (Campfire Model)
 * Prevents the "empty world" problem at launch
 */
function manageBotPopulation(): void {
    const totalPopulation = 1 + others.size + bots.length; // 1 = local player
    
    // Spawn bots if population too low
    if (totalPopulation < CONFIG.MIN_POPULATION) {
        if (Math.random() < CONFIG.BOT_SPAWN_CHANCE) {
            // Spawn bot near player but not too close
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 800;
            const botX = player.x + Math.cos(angle) * dist;
            const botY = player.y + Math.sin(angle) * dist;
            bots.push(new Bot(botX, botY));
            console.log('🤖 Guardian spawned. Population:', totalPopulation + 1);
        }
    }
    // Remove bots if too many entities (real players joining)
    else if (totalPopulation > CONFIG.MIN_POPULATION && bots.length > 0) {
        if (Math.random() < CONFIG.BOT_REMOVE_CHANCE) {
            bots.pop();
            console.log('👋 Guardian departed. Population:', totalPopulation - 1);
        }
    }
}

/**
 * Update bot AI and behavior
 */
function updateBots(): void {
    for (const bot of bots) {
        bot.timer++;
        bot.actionTimer++;
        bot.thinkTimer++;
        
        // Change movement direction smoothly
        if (Math.random() < 0.02) {
            bot.moveAngle += (Math.random() - 0.5) * 2;
        }
        
        // Social Gravity: Move toward player if nearby but not too close
        const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (distToPlayer < 400 && distToPlayer > 100) {
            const angleToPlayer = Math.atan2(player.y - bot.y, player.x - bot.x);
            bot.moveAngle = bot.moveAngle * 0.95 + angleToPlayer * 0.05;
        }
        
        // Stay near campfire (center)
        const distToCenter = Math.hypot(bot.x, bot.y);
        if (distToCenter > CONFIG.CAMPFIRE_RADIUS) {
            const angleToCenter = Math.atan2(-bot.y, -bot.x);
            bot.moveAngle = bot.moveAngle * 0.9 + angleToCenter * 0.1;
        }
        
        // Apply movement
        bot.vx += Math.cos(bot.moveAngle) * 0.2;
        bot.vy += Math.sin(bot.moveAngle) * 0.2;
        bot.vx *= 0.94; // Friction
        bot.vy *= 0.94;
        bot.x += bot.vx;
        bot.y += bot.vy;
        
        // Trail effect
        if (Math.random() < 0.3 && (Math.abs(bot.vx) > 0.1 || Math.abs(bot.vy) > 0.1)) {
            bot.trail.push({ x: bot.x, y: bot.y, life: 1.0 });
        }
        for (let i = bot.trail.length - 1; i >= 0; i--) {
            bot.trail[i].life -= 0.02;
            if (bot.trail[i].life <= 0) {
                bot.trail.splice(i, 1);
            }
        }
        
        // Actions: Sing occasionally
        if (bot.actionTimer > 300 && Math.random() < 0.005) {
            bot.actionTimer = 0;
            const note = Math.floor((bot.hue / 360) * 6);
            audio.playSing(note);
            if (settings.particles) {
                GameLogic.spawnParticles(bot.x, bot.y, bot.hue, 15, false, particles);
            }
        }
        
        // Thoughts: Speak occasionally
        if (bot.thinkTimer > 500 && Math.random() < 0.002) {
            bot.thinkTimer = 0;
            floats.push(new FloatingText(bot.x, bot.y - 40, bot.getRandomThought(), bot.hue, 11));
        }
    }
}

/**
 * Fetch nearby players from backend and update the others map
 */
async function fetchNearbyPlayers(): Promise<void> {
    try {
        const nearbyPlayers = await network.getNearbyPlayers(player.x, player.y, gameState.currentRealm);
        
        // Clear stale entries (tracking with a separate timestamp map)
        const staleIds: string[] = [];
        for (const [id] of others.entries()) {
            // Simple staleness check - if we didn't get them in the latest fetch
            const found = nearbyPlayers.find(p => p.id === id);
            if (!found) {
                staleIds.push(id);
            }
        }
        staleIds.forEach(id => others.delete(id));
        
        // Update or add players
        for (const p of nearbyPlayers) {
            if (p.id !== player.id) { // Don't add self
                const existing = others.get(p.id);
                if (existing) {
                    // Update existing player
                    existing.x = p.x;
                    existing.y = p.y;
                    existing.name = p.name;
                    existing.hue = p.hue;
                    existing.xp = p.xp;
                    existing.stars = p.stars || 0;
                    existing.echoes = p.echoes || 0;
                } else {
                    // Add new player - match OtherPlayer interface
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
                        singing: 0,
                        pulsing: 0,
                        emoting: null,
                        emoteT: 0,
                        trail: [],
                        born: p.born || Date.now(),
                        speaking: false,
                        isBot: false
                    });
                }
            }
        }
        
        // Update nearby list if social panel is open
        if (gameState.showingSocial) {
            UIManager.updateNearby(others);
        }
    } catch (error) {
        console.error('Failed to fetch nearby players:', error);
    }
}

/**
 * Fetch echoes from backend for current realm
 */
async function fetchEchoes(): Promise<void> {
    try {
        const serverEchoes = await network.getEchoes(gameState.currentRealm);
        
        // Add new echoes that we don't have locally
        for (const e of serverEchoes) {
            const exists = echoes.some(local => 
                Math.abs(local.x - e.x) < 5 && 
                Math.abs(local.y - e.y) < 5 && 
                local.text === e.text
            );
            if (!exists && echoes.length < 100) { // Limit total echoes
                echoes.push(new Echo(e.x, e.y, e.text, e.hue || 200, e.name || 'Unknown', e.realm || gameState.currentRealm));
            }
        }
    } catch (error) {
        console.error('Failed to fetch echoes:', error);
    }
}

function startGame(): void {
    console.log('🌌 AURA - The Social Cosmos initialized (Campfire Model)');
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
    
    // Network sync: Poll for nearby players and echoes
    setInterval(fetchNearbyPlayers, 2000); // Every 2 seconds
    setInterval(fetchEchoes, 10000); // Every 10 seconds
    
    // Send player position to backend
    network.startPositionSync(player, () => gameState.currentRealm, 3000);
    
    // Initial fetch
    fetchNearbyPlayers();
    fetchEchoes();
    
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
    
    // Update effects
    player.singing = Math.max(0, player.singing - 0.016);
    player.pulsing = Math.max(0, player.pulsing - 0.01);
    
    if (player.emoteT > 0) {
        player.emoteT -= 0.016;
        if (player.emoteT <= 0) player.emoting = null;
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
    
    // Manage bot population (Campfire Model - prevent empty world)
    manageBotPopulation();
    
    // Update bots
    updateBots();
    
    // Ensure stars around player
    GameLogic.ensureStars(player.x, player.y, gameState.currentRealm, stars);
}

function render(): void {
    const viewRadius = GameLogic.getViewRadius(player);
    
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
    renderer.renderBots(bots, player, viewRadius); // Render guardian bots
    renderer.renderProjectiles(projectiles);
    renderer.renderPlayer(player, gameState.voiceOn, gameState.isSpeaking);
    renderer.renderParticles(particles);
    renderer.renderFloats(floats);
    
    renderer.restore();
    
    // Render UI overlays (screen space)
    renderer.renderCompass(player); // Navigation compass for distant players
    
    // Render UI overlays
    renderer.renderVignette();
    renderer.renderMinimap(player, others, bots, echoes, viewRadius, gameState.currentRealm);
    
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
    if (voiceChat.enabled) {
        voiceChat.disable();
        gameState.voiceOn = false;
        updateVoiceUI();
        console.log('🔇 Voice disabled');
    } else {
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
            
            updateVoiceUI();
            console.log('🎙️ Voice enabled');
        }
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
        if (btn) btn.textContent = '🎙️';
        if (status) status.textContent = voiceChat.isSpeaking ? 'Talk' : 'On';
        if (voiceChat.isSpeaking) {
            orb?.classList.add('speaking');
        } else {
            orb?.classList.remove('speaking');
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
 * Save all game progress
 */
function saveProgress(): void {
    PersistenceManager.saveSettings(settings);
    PersistenceManager.saveStats(stats);
    PersistenceManager.saveDailyProgress(dailyProgress);
    PersistenceManager.saveAchievements(unlocked);
}

// Auto-save progress periodically
setInterval(saveProgress, 30000); // Every 30 seconds

// Save on page unload
window.addEventListener('beforeunload', saveProgress);
