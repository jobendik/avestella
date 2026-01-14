// Network controller for orchestrating multiplayer sync
import { NetworkManager } from '../network/manager';
import { EventBus } from '../systems/EventBus';
import { Echo } from '../game/entities';
import type { Player, OtherPlayer, RealmId } from '../types';

interface NetworkControllerConfig {
    networkManager: NetworkManager;
    getPlayer: () => Player;
    getOthers: () => Map<string, OtherPlayer>;
    getEchoes: () => Echo[];
    getCurrentRealm: () => RealmId;
    getShowingSocial: () => boolean;
}

/**
 * Orchestrates network synchronization
 * Handles player sync, echo fetching, and network events
 */
export class NetworkController {
    private networkManager: NetworkManager;
    private getPlayer: () => Player;
    private getOthers: () => Map<string, OtherPlayer>;
    private getEchoes: () => Echo[];
    private getCurrentRealm: () => RealmId;
    private getShowingSocial: () => boolean;
    
    private syncIntervals: number[] = [];
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;

    constructor(config: NetworkControllerConfig) {
        this.networkManager = config.networkManager;
        this.getPlayer = config.getPlayer;
        this.getOthers = config.getOthers;
        this.getEchoes = config.getEchoes;
        this.getCurrentRealm = config.getCurrentRealm;
        this.getShowingSocial = config.getShowingSocial;
    }

    /**
     * Start network synchronization
     */
    start(): void {
        console.log('📡 Starting network sync...');
        
        // Poll for nearby players every 2 seconds
        const playerSyncId = window.setInterval(() => this.fetchNearbyPlayers(), 2000);
        this.syncIntervals.push(playerSyncId);
        
        // Poll for echoes every 10 seconds
        const echoSyncId = window.setInterval(() => this.fetchEchoes(), 10000);
        this.syncIntervals.push(echoSyncId);
        
        // Send player position every 3 seconds
        const positionSyncId = window.setInterval(() => this.syncPosition(), 3000);
        this.syncIntervals.push(positionSyncId);
        
        // Initial fetch
        this.fetchNearbyPlayers();
        this.fetchEchoes();
        
        this.isConnected = true;
        EventBus.emit('network:connected');
    }

    /**
     * Stop network synchronization
     */
    stop(): void {
        this.syncIntervals.forEach(id => clearInterval(id));
        this.syncIntervals = [];
        this.isConnected = false;
        EventBus.emit('network:disconnected');
    }

    /**
     * Fetch nearby players from backend
     */
    async fetchNearbyPlayers(): Promise<void> {
        try {
            const player = this.getPlayer();
            const others = this.getOthers();
            const currentRealm = this.getCurrentRealm();
            
            const nearbyPlayers = await this.networkManager.getNearbyPlayers(
                player.x, 
                player.y, 
                currentRealm
            );

            // Reset reconnect attempts on success
            this.reconnectAttempts = 0;

            // Clear stale entries
            const staleIds: string[] = [];
            for (const [id] of others.entries()) {
                const found = nearbyPlayers.find(p => p.id === id);
                if (!found) {
                    staleIds.push(id);
                }
            }
            staleIds.forEach(id => {
                others.delete(id);
                EventBus.emit('network:playerLeft', { playerId: id });
            });

            // Update or add players
            for (const p of nearbyPlayers) {
                if (p.id !== player.id) {
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
                        // Add new player
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
                        EventBus.emit('network:playerJoined', { player: p });
                    }
                }
            }

            // Update nearby list if social panel is open
            if (this.getShowingSocial()) {
                EventBus.emit('network:syncComplete');
            }
        } catch (error) {
            this.handleNetworkError(error as Error);
        }
    }

    /**
     * Fetch echoes from backend for current realm
     */
    async fetchEchoes(): Promise<void> {
        try {
            const echoes = this.getEchoes();
            const currentRealm = this.getCurrentRealm();
            
            const serverEchoes = await this.networkManager.getEchoes(currentRealm);

            // Add new echoes that we don't have locally
            for (const e of serverEchoes) {
                const exists = echoes.some(local =>
                    Math.abs(local.x - e.x) < 5 &&
                    Math.abs(local.y - e.y) < 5 &&
                    local.text === e.text
                );
                if (!exists && echoes.length < 100) {
                    echoes.push(new Echo(
                        e.x, 
                        e.y, 
                        e.text, 
                        e.hue || 200, 
                        e.name || 'Unknown', 
                        e.realm || currentRealm
                    ));
                }
            }
        } catch (error) {
            console.error('Failed to fetch echoes:', error);
        }
    }

    /**
     * Sync player position to backend
     */
    async syncPosition(): Promise<void> {
        try {
            const player = this.getPlayer();
            const currentRealm = this.getCurrentRealm();
            await this.networkManager.updatePosition(player, currentRealm);
        } catch (error) {
            this.handleNetworkError(error as Error);
        }
    }

    /**
     * Handle network errors with retry logic
     */
    private handleNetworkError(error: Error): void {
        console.error('Network error:', error);
        EventBus.emit('network:error', { error });
        
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached. Network sync disabled.');
            EventBus.emit('network:disconnected');
            this.isConnected = false;
        } else {
            // Exponential backoff
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Retrying in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.fetchNearbyPlayers();
                }
            }, delay);
        }
    }

    /**
     * Check if connected to network
     */
    getIsConnected(): boolean {
        return this.isConnected;
    }
}
