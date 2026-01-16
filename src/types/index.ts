// Type definitions for AURA

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface GameConfig {
    FORMS: string[];
    LEVEL_XP: number[];
    TETHER: number;
    VIEW_BASE: number;
    VIEW_BOND: number;
    BOND_DECAY: number;
    BOND_GAIN: number;
    STAR_CELL: number;
    WHISPER_SPEED: number;
    DRIFT: number;
    MINIMAP_R: number;
    SPAWN_RADIUS: number;
    CAMPFIRE_RADIUS: number;
    MIN_POPULATION: number;
    BOT_SPAWN_CHANCE: number;
    BOT_REMOVE_CHANCE: number;
    COMPASS_DISTANCE: number;

    // Animation & Physics Constants
    UPDATE_INTERVAL: number;
    MAX_TRAIL_LENGTH: number;
    TRAIL_DECAY_RATE_NEAR: number;
    TRAIL_DECAY_RATE_FAR: number;
    PROJECTILE_TRAIL_LENGTH: number;
    CAMERA_LERP: number;
    SHAKE_DECAY: number;
    SHAKE_INTENSITY: number;
    SINGING_DECAY: number;
    PULSING_DECAY: number;
    EMOTE_DECAY: number;
    TOAST_DURATION: number;
    PLAYER_SYNC_INTERVAL: number;
    ECHO_SYNC_INTERVAL: number;
    POSITION_SYNC_INTERVAL: number;
    PLAYER_TIMEOUT: number;
    MAX_ECHOES: number;
    MAX_PARTICLES: number;

    // Content arrays (exported separately but typed here for reference)
    [key: string]: any;  // Allow additional properties like ACHIEVEMENTS, EMOTES, etc.
}

export interface RealmData {
    name: string;
    icon: string;
    bg: [number, number, number];
    n1: [number, number, number];
    n2: [number, number, number];
    unlock: number;
    desc?: string;
    drone?: number;
}

export type RealmId = 'genesis' | 'nebula' | 'void' | 'starforge' | 'sanctuary' | 'abyss' | 'crystal' | 'celestial';

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    reward: number;
    track: string;
    need: number;
    category?: 'social' | 'explore' | 'secret';
    secret?: boolean;
}

export interface Quest {
    id: string;
    name: string;
    desc: string;
    icon: string;
    reward: number;
    track: string;
    need: number;
}

export interface WeeklyQuest extends Quest {
    // Weekly quests use same structure but are tracked separately
}

export interface Emote {
    emoji: string;
    unlock: number;  // Level required to unlock
}

// Local player state
export interface Player {
    x: number;
    y: number;
    tx: number;
    ty: number;
    hue: number;
    xp: number;
    stars: number;
    echoes: number;
    singing: number;
    pulsing: number;
    emoting: string | null;
    emoteT: number;
    r: number;
    halo: number;
    trail: TrailPoint[];
    name: string;
    id: string;
    born: number;
    bonds: Map<string, number>;
    linkedCount?: number;  // NEW: Number of significant bonds (server-provided)
}

export interface OtherPlayer {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    hue: number;
    name: string;
    xp: number;
    stars: number;
    echoes: number;
    r: number;
    halo: number;
    singing: number;
    pulsing: number;
    emoting: string | null;
    emoteT: number;
    trail: TrailPoint[];
    id: string;
    born: number;
    speaking: boolean;
    isBot: boolean;
    // Bot message system
    message?: string;
    messageTimer?: number;
    // Bond system - server-provided bond strength to local player
    bondToViewer?: number;
}

export interface TrailPoint {
    x: number;
    y: number;
    life: number;
}

export interface Camera {
    x: number;
    y: number;
    tx: number;
    ty: number;
    shake: number;
}

export interface Star {
    id: string;
    x: number;
    y: number;
    lit: boolean;
    burst: number;
    br: number;
    tw: number;
    tws: number;
    realm: string;
}

export interface Echo {
    id: string; // Added ID for referencing
    x: number;
    y: number;
    text: string;
    hue: number;
    name: string;
    r: number;
    pulse: number;
    realm: string;
    ignited: number; // For "likes" visual
    playerId: string; // To identify own echoes
}

export interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    text: string;
    owner: string;
    target: string | null;
    life: number;
    hit: boolean;
    trail: { x: number; y: number }[];
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    hue: number;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    hue: number;
    size: number;
    life: number;
    decay: number;
    vy: number;
}

export interface GameState {
    gameActive: boolean;
    selectedId: string | null;
    showingSocial: boolean;
    showingAch: boolean;
    showingSettings: boolean;
    showingQuests: boolean;
    msgMode: string | null;
    directTarget: string | null;
    currentRealm: RealmId;
    voiceOn: boolean;
    isSpeaking: boolean;
}

export interface Settings {
    music: boolean;
    volume: number;
    particles: boolean;
    shake: boolean;
    ptt?: boolean;  // Push-to-talk mode
    vad?: boolean;  // Voice activity detection
    sensitivity?: number;  // Mic sensitivity (0-1)
    hue?: number;  // Player color hue
}

export interface Stats {
    whispers: number;
    stars: number;
    echoes: number;
    connections: number;
    maxBond: number;
    voice: number;
    level: number;
    realms: number;
    friends: number;
    sings: number;
    pulses: number;
    emotes: number;
    teleports: number;
    nightOwl: number;
    marathon: number;
    constellation: number;
}

export interface DailyProgress {
    date: string;  // Date string for reset tracking
    whispers: number;
    stars: number;
    connections: number;
    sings: number;
    emotes: number;
    [key: string]: string | number;  // Allow quest completion flags
}

export interface WeeklyProgress {
    week: number;  // Week number for reset tracking
    whispers: number;
    stars: number;
    newFriends: number;
    realmChanges: number;
    [key: string]: string | number;  // Allow quest completion flags
}

export interface NetworkEvent {
    type: 'whisper' | 'sing' | 'pulse' | 'echo' | 'emote' | 'star_lit';
    x: number;
    y: number;
    uid: string;
    name: string;
    realm: string;
    t: number;
    hue?: number;
    dx?: number;
    dy?: number;
    text?: string;
    target?: string;
    emoji?: string;
    xp?: number;
    singing?: number;
    pulsing?: number;
    emoting?: string | null;
    starId?: string;
}
