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
}

export interface RealmData {
    name: string;
    icon: string;
    bg: [number, number, number];
    n1: [number, number, number];
    n2: [number, number, number];
    unlock: number;
}

export type RealmId = 'genesis' | 'nebula' | 'void' | 'starforge' | 'sanctuary';

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    reward: number;
    track: string;
    need: number;
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
    x: number;
    y: number;
    text: string;
    hue: number;
    name: string;
    r: number;
    pulse: number;
    realm: string;
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
}

export interface DailyProgress {
    whispers: number;
    stars: number;
    connections: number;
    sings: number;
    emotes: number;
    [key: string]: number;
}

export interface NetworkEvent {
    type: 'whisper' | 'sing' | 'pulse' | 'echo' | 'emote';
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
}
