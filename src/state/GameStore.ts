// Centralized state management for AURA
import type { Player, OtherPlayer, Camera, Settings, Stats, DailyProgress, RealmId } from '../types';
import { Star, Echo, Projectile, Particle, FloatingText } from '../game/entities';
// NOTE: Bot class removed - bots are 100% server-authoritative and come through 'others' with isBot=true

// Application state interface
export interface GameState {
    gameActive: boolean;
    selectedId: string | null;
    showingSocial: boolean;
    showingAch: boolean;
    showingSettings: boolean;
    showingQuests: boolean;
    msgMode: 'whisper' | 'echo' | 'direct' | null;
    directTarget: string | null;
    currentRealm: RealmId;
    voiceOn: boolean;
    isSpeaking: boolean;
}

export interface AppState {
    // Core game state
    gameState: GameState;
    settings: Settings;
    stats: Stats;
    dailyProgress: DailyProgress;
    
    // Player data
    player: Player;
    camera: Camera;
    
    // Entity collections
    // NOTE: 'others' contains ALL entities (players + bots) - bots have isBot=true
    // This is 100% server-authoritative via world_state WebSocket messages
    others: Map<string, OtherPlayer>;
    stars: Map<string, Star[]>;
    echoes: Echo[];
    projectiles: Projectile[];
    particles: Particle[];
    floats: FloatingText[];
    constellations: [Star, Star, Star][];
    
    // Achievements
    unlocked: Set<string>;
    
    // Input state
    isMouseDown: boolean;
}

type StateListener = (state: AppState, changedKeys: (keyof AppState)[]) => void;

/**
 * Centralized state store for AURA
 * Provides reactive state management with subscription support
 */
export class GameStore {
    private state: AppState;
    private listeners: Set<StateListener> = new Set();
    private batchUpdates: boolean = false;
    private pendingChanges: Set<keyof AppState> = new Set();

    constructor(initialState: AppState) {
        this.state = initialState;
    }

    /**
     * Get the current state (read-only)
     */
    getState(): Readonly<AppState> {
        return this.state;
    }

    /**
     * Update state with partial changes
     */
    setState<K extends keyof AppState>(key: K, value: AppState[K]): void {
        this.state[key] = value;
        
        if (this.batchUpdates) {
            this.pendingChanges.add(key);
        } else {
            this.notifyListeners([key]);
        }
    }

    /**
     * Update multiple state properties at once
     */
    setMultiple(updates: Partial<AppState>): void {
        const changedKeys: (keyof AppState)[] = [];
        
        for (const [key, value] of Object.entries(updates)) {
            const k = key as keyof AppState;
            (this.state as any)[k] = value;
            changedKeys.push(k);
        }
        
        if (this.batchUpdates) {
            changedKeys.forEach(k => this.pendingChanges.add(k));
        } else {
            this.notifyListeners(changedKeys);
        }
    }

    /**
     * Batch multiple updates together
     */
    batch(fn: () => void): void {
        this.batchUpdates = true;
        this.pendingChanges.clear();
        
        try {
            fn();
        } finally {
            this.batchUpdates = false;
            if (this.pendingChanges.size > 0) {
                this.notifyListeners(Array.from(this.pendingChanges));
                this.pendingChanges.clear();
            }
        }
    }

    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(changedKeys: (keyof AppState)[]): void {
        for (const listener of this.listeners) {
            listener(this.state, changedKeys);
        }
    }

    // Convenience getters for common state access
    get player(): Player {
        return this.state.player;
    }

    get camera(): Camera {
        return this.state.camera;
    }

    get gameState(): GameState {
        return this.state.gameState;
    }

    get settings(): Settings {
        return this.state.settings;
    }

    get stats(): Stats {
        return this.state.stats;
    }

    get others(): Map<string, OtherPlayer> {
        return this.state.others;
    }

    // NOTE: bots getter removed - bots are in 'others' with isBot=true (server-authoritative)

    get stars(): Map<string, Star[]> {
        return this.state.stars;
    }

    get echoes(): Echo[] {
        return this.state.echoes;
    }

    get particles(): Particle[] {
        return this.state.particles;
    }

    get floats(): FloatingText[] {
        return this.state.floats;
    }

    get projectiles(): Projectile[] {
        return this.state.projectiles;
    }

    get currentRealm(): RealmId {
        return this.state.gameState.currentRealm;
    }
}

// Singleton instance - will be initialized in main.ts
let storeInstance: GameStore | null = null;

export function initializeStore(initialState: AppState): GameStore {
    storeInstance = new GameStore(initialState);
    return storeInstance;
}

export function getStore(): GameStore {
    if (!storeInstance) {
        throw new Error('Store not initialized. Call initializeStore first.');
    }
    return storeInstance;
}
