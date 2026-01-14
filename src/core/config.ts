import type { GameConfig, RealmData, Achievement, Quest, RealmId } from '../types';

export const CONFIG: GameConfig = {
    // Player progression
    FORMS: ['Spark', 'Ember', 'Flame', 'Prism', 'Nova', 'Celestial', 'Eternal', 'Infinite'],
    LEVEL_XP: [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000],
    
    // Visual/gameplay
    TETHER: 380,
    VIEW_BASE: 520,
    VIEW_BOND: 40,
    BOND_DECAY: 0.06,
    BOND_GAIN: 11,
    STAR_CELL: 180,
    WHISPER_SPEED: 5.5,
    DRIFT: 0.032,
    MINIMAP_R: 2200,
    
    // Campfire Model: Centralized spawn system
    SPAWN_RADIUS: 200,  // All players spawn within this radius of center (0,0)
    CAMPFIRE_RADIUS: 1200,  // The "warm" zone where most activity happens
    
    // Bot/Guardian System
    MIN_POPULATION: 5,  // Minimum number of entities (players + bots) to maintain
    BOT_SPAWN_CHANCE: 0.01,  // Chance per frame to spawn a bot when below min population
    BOT_REMOVE_CHANCE: 0.005,  // Chance per frame to remove a bot when above min population
    
    // Navigation
    COMPASS_DISTANCE: 2000,  // Show compass when this far from center
    
    // === Animation & Physics Constants (formerly magic numbers) ===
    
    // Game loop
    UPDATE_INTERVAL: 16,  // ~60fps fixed timestep
    
    // Player trail
    MAX_TRAIL_LENGTH: 45,
    TRAIL_DECAY_RATE_NEAR: 0.022,  // Decay rate within campfire
    TRAIL_DECAY_RATE_FAR: 0.04,    // Faster decay outside campfire
    
    // Projectile trail
    PROJECTILE_TRAIL_LENGTH: 18,
    
    // Camera
    CAMERA_LERP: 0.075,
    SHAKE_DECAY: 0.03,
    SHAKE_INTENSITY: 12,
    
    // Effect decay rates
    SINGING_DECAY: 0.016,
    PULSING_DECAY: 0.01,
    EMOTE_DECAY: 0.016,
    
    // UI timing
    TOAST_DURATION: 4300,
    
    // Network
    PLAYER_SYNC_INTERVAL: 2000,
    ECHO_SYNC_INTERVAL: 10000,
    POSITION_SYNC_INTERVAL: 3000,
    PLAYER_TIMEOUT: 10000,
    
    // Limits
    MAX_ECHOES: 100,
    MAX_PARTICLES: 500,
};

export const SCALES: Record<RealmId, number[]> = {
    genesis: [261.63, 293.66, 329.63, 392, 440, 523.25],
    nebula: [277.18, 311.13, 369.99, 415.3, 466.16, 554.37],
    void: [130.81, 146.83, 164.81, 196, 220, 261.63],
    starforge: [293.66, 329.63, 369.99, 440, 493.88, 587.33],
    sanctuary: [246.94, 293.66, 329.63, 392, 440, 493.88],
};

export const REALMS: Record<RealmId, RealmData> = {
    genesis: { name: 'Genesis', icon: '🌌', bg: [5, 5, 12], n1: [78, 205, 196], n2: [255, 107, 157], unlock: 1 },
    nebula: { name: 'Nebula Gardens', icon: '🌸', bg: [15, 5, 20], n1: [255, 107, 157], n2: [168, 85, 247], unlock: 1 },
    void: { name: 'The Void', icon: '🌑', bg: [2, 2, 5], n1: [30, 30, 60], n2: [20, 20, 40], unlock: 1 },
    starforge: { name: 'Starforge', icon: '🔥', bg: [15, 8, 5], n1: [255, 140, 0], n2: [255, 69, 0], unlock: 5 },
    sanctuary: { name: 'Sanctuary', icon: '🏛️', bg: [8, 12, 18], n1: [100, 149, 237], n2: [135, 206, 250], unlock: 10 },
};

export const EMOTES: string[] = ['👋', '💫', '❤️', '🎉', '🌟', '✨', '🔥', '💭', '😊', '🤝', '👀', '💕'];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_whisper', name: 'First Words', desc: 'Send your first whisper', icon: '💬', reward: 10, track: 'whispers', need: 1 },
    { id: 'chatterbox', name: 'Chatterbox', desc: 'Send 50 whispers', icon: '🗣️', reward: 50, track: 'whispers', need: 50 },
    { id: 'first_conn', name: 'Kindred Spirit', desc: 'Form your first connection', icon: '💫', reward: 25, track: 'connections', need: 1 },
    { id: 'social', name: 'Social Butterfly', desc: 'Connect with 10 souls', icon: '🦋', reward: 75, track: 'connections', need: 10 },
    { id: 'star10', name: 'Star Lighter', desc: 'Light 10 stars', icon: '⭐', reward: 20, track: 'stars', need: 10 },
    { id: 'star100', name: 'Star Collector', desc: 'Light 100 stars', icon: '🌌', reward: 100, track: 'stars', need: 100 },
    { id: 'echo5', name: 'Echo Planter', desc: 'Plant 5 echoes', icon: '🌱', reward: 30, track: 'echoes', need: 5 },
    { id: 'realm3', name: 'Realm Explorer', desc: 'Visit 3 realms', icon: '🗺️', reward: 40, track: 'realms', need: 3 },
    { id: 'voice', name: 'Voice Pioneer', desc: 'Use voice chat', icon: '🎙️', reward: 15, track: 'voice', need: 1 },
    { id: 'lv5', name: 'Nova', desc: 'Reach Level 5', icon: '💥', reward: 50, track: 'level', need: 5 },
    { id: 'lv10', name: 'Celestial', desc: 'Reach Level 10', icon: '🌠', reward: 100, track: 'level', need: 10 },
    { id: 'bond100', name: 'Deep Bond', desc: '100% bond with someone', icon: '💞', reward: 60, track: 'maxBond', need: 100 },
];

export const QUESTS: Quest[] = [
    { id: 'whisper3', name: 'Cosmic Messenger', desc: 'Send 3 whispers today', icon: '💬', reward: 15, track: 'whispers', need: 3 },
    { id: 'star5', name: 'Illuminate', desc: 'Light 5 stars', icon: '⭐', reward: 10, track: 'stars', need: 5 },
    { id: 'connect1', name: 'Make a Friend', desc: 'Form a new connection', icon: '💫', reward: 20, track: 'connections', need: 1 },
    { id: 'sing2', name: 'Cosmic Harmony', desc: 'Sing 2 times', icon: '🎵', reward: 10, track: 'sings', need: 2 },
    { id: 'emote3', name: 'Express Yourself', desc: 'Use 3 emotes', icon: '😊', reward: 10, track: 'emotes', need: 3 },
];

export const APP_ID = 'aura-ultimate-v1';
