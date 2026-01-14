// In-memory cache service for ephemeral data (player sessions, positions)
// This handles real-time data that doesn't need persistence

interface CachedPlayer {
    id: string;
    name: string;
    x: number;
    y: number;
    hue: number;
    form: string;
    realm: string;
    level: number;
    mood: string;
    singing: boolean;
    song?: string;
    whisper?: string;
    emote?: string;
    trail: Array<{ x: number; y: number }>;
    lastUpdate: number;
}

interface CacheConfig {
    playerTTL: number;        // How long before player is considered stale
    cleanupInterval: number;  // How often to clean stale entries
}

/**
 * Cache service for ephemeral game state
 * Handles real-time data that doesn't need disk persistence
 */
export class CacheService {
    private config: CacheConfig;
    private players: Map<string, CachedPlayer> = new Map();
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            playerTTL: config.playerTTL || 30000,        // 30 seconds
            cleanupInterval: config.cleanupInterval || 10000  // 10 seconds
        };
    }

    /**
     * Start cache cleanup timer
     */
    start(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
        console.log('🗃️ Cache service started');
    }

    /**
     * Stop cache service
     */
    stop(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        console.log('🗃️ Cache service stopped');
    }

    // ============================================
    // PLAYER CACHE
    // ============================================

    /**
     * Update or add a player to cache
     */
    setPlayer(player: CachedPlayer): void {
        this.players.set(player.id, {
            ...player,
            lastUpdate: Date.now()
        });
    }

    /**
     * Get a player from cache
     */
    getPlayer(playerId: string): CachedPlayer | undefined {
        return this.players.get(playerId);
    }

    /**
     * Remove a player from cache
     */
    removePlayer(playerId: string): void {
        this.players.delete(playerId);
    }

    /**
     * Get all players in a realm
     */
    getPlayersInRealm(realm: string): CachedPlayer[] {
        const result: CachedPlayer[] = [];
        for (const player of this.players.values()) {
            if (player.realm === realm) {
                result.push(player);
            }
        }
        return result;
    }

    /**
     * Get players near a position
     */
    getPlayersNearby(
        realm: string,
        x: number,
        y: number,
        radius: number,
        excludeId?: string
    ): CachedPlayer[] {
        const result: CachedPlayer[] = [];
        const radiusSq = radius * radius;

        for (const player of this.players.values()) {
            if (player.realm !== realm) continue;
            if (excludeId && player.id === excludeId) continue;

            const dx = player.x - x;
            const dy = player.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                result.push(player);
            }
        }

        return result;
    }

    /**
     * Get total player count
     */
    getPlayerCount(): number {
        return this.players.size;
    }

    /**
     * Get player count per realm
     */
    getPlayerCountByRealm(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const player of this.players.values()) {
            const current = counts.get(player.realm) || 0;
            counts.set(player.realm, current + 1);
        }
        return counts;
    }

    // ============================================
    // CLEANUP
    // ============================================

    /**
     * Clean up stale entries
     */
    private cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [id, player] of this.players) {
            if (now - player.lastUpdate > this.config.playerTTL) {
                this.players.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} stale player entries`);
        }
    }

    /**
     * Get all cached data (for debugging)
     */
    getStats(): {
        playerCount: number;
        realmCounts: Record<string, number>;
    } {
        const realmCounts: Record<string, number> = {};
        for (const player of this.players.values()) {
            realmCounts[player.realm] = (realmCounts[player.realm] || 0) + 1;
        }

        return {
            playerCount: this.players.size,
            realmCounts
        };
    }
}

// Export singleton instance
export const cache = new CacheService();
