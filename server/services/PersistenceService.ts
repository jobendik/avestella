// Data persistence service - abstraction layer for data storage
// Can be swapped for Redis, PostgreSQL, MongoDB, etc.
import * as fs from 'fs';
import * as path from 'path';

interface Echo {
    id: string;
    x: number;
    y: number;
    text: string;
    hue: number;
    name: string;
    realm: string;
    timestamp: number;
}

interface PlayerData {
    id: string;
    name: string;
    hue: number;
    xp: number;
    stars: number;
    echoes: number;
    achievements: string[];
    lastSeen: number;
    createdAt: number;
}

interface PersistenceConfig {
    dataDir: string;
    saveInterval: number;
    maxEchoesPerRealm: number;
}

/**
 * Data persistence service
 * Provides abstraction for storing game data
 */
export class PersistenceService {
    private config: PersistenceConfig;
    private echoes: Map<string, Echo[]> = new Map(); // realm -> echoes
    private litStars: Set<string> = new Set();
    private players: Map<string, PlayerData> = new Map();
    private dirty: boolean = false;
    private saveTimer: NodeJS.Timeout | null = null;

    constructor(config: Partial<PersistenceConfig> = {}) {
        this.config = {
            dataDir: config.dataDir || './data',
            saveInterval: config.saveInterval || 30000, // 30 seconds
            maxEchoesPerRealm: config.maxEchoesPerRealm || 1000
        };
    }

    /**
     * Initialize persistence - load data and start auto-save
     */
    async init(): Promise<void> {
        // Ensure data directory exists
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }

        // Load existing data
        await this.loadAllData();

        // Start auto-save interval
        this.saveTimer = setInterval(() => {
            if (this.dirty) {
                this.saveAllData();
            }
        }, this.config.saveInterval);

        console.log('💾 Persistence service initialized');
    }

    /**
     * Shutdown - save all data and stop timers
     */
    async shutdown(): Promise<void> {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }
        await this.saveAllData();
        console.log('💾 Persistence service shut down');
    }

    // ============================================
    // ECHOES
    // ============================================

    /**
     * Get all echoes for a realm
     */
    getEchoes(realm: string): Echo[] {
        return this.echoes.get(realm) || [];
    }

    /**
     * Add a new echo
     */
    addEcho(echo: Echo): void {
        if (!this.echoes.has(echo.realm)) {
            this.echoes.set(echo.realm, []);
        }

        const realmEchoes = this.echoes.get(echo.realm)!;
        
        // Enforce limit per realm
        if (realmEchoes.length >= this.config.maxEchoesPerRealm) {
            realmEchoes.shift(); // Remove oldest
        }

        realmEchoes.push(echo);
        this.dirty = true;
    }

    /**
     * Get all echoes across all realms
     */
    getAllEchoes(): Echo[] {
        const all: Echo[] = [];
        for (const echoes of this.echoes.values()) {
            all.push(...echoes);
        }
        return all;
    }

    // ============================================
    // LIT STARS
    // ============================================

    /**
     * Mark a star as lit
     */
    litStar(starId: string): void {
        this.litStars.add(starId);
        this.dirty = true;
    }

    /**
     * Check if a star is lit
     */
    isStarLit(starId: string): boolean {
        return this.litStars.has(starId);
    }

    /**
     * Get all lit stars for a realm
     */
    getLitStars(realm?: string): string[] {
        if (realm) {
            return Array.from(this.litStars).filter(id => id.startsWith(realm + ':'));
        }
        return Array.from(this.litStars);
    }

    // ============================================
    // PLAYER DATA
    // ============================================

    /**
     * Get player data
     */
    getPlayer(playerId: string): PlayerData | undefined {
        return this.players.get(playerId);
    }

    /**
     * Save/update player data
     */
    savePlayer(player: PlayerData): void {
        this.players.set(player.id, {
            ...player,
            lastSeen: Date.now()
        });
        this.dirty = true;
    }

    /**
     * Update player stats
     */
    updatePlayerStats(playerId: string, updates: Partial<PlayerData>): void {
        const existing = this.players.get(playerId);
        if (existing) {
            Object.assign(existing, updates, { lastSeen: Date.now() });
            this.dirty = true;
        }
    }

    /**
     * Get all players
     */
    getAllPlayers(): PlayerData[] {
        return Array.from(this.players.values());
    }

    // ============================================
    // FILE OPERATIONS
    // ============================================

    /**
     * Load all data from files
     */
    private async loadAllData(): Promise<void> {
        await Promise.all([
            this.loadEchoes(),
            this.loadLitStars(),
            this.loadPlayers()
        ]);
    }

    /**
     * Save all data to files
     */
    private async saveAllData(): Promise<void> {
        await Promise.all([
            this.saveEchoes(),
            this.saveLitStars(),
            this.savePlayers()
        ]);
        this.dirty = false;
        console.log('💾 Data saved');
    }

    private getFilePath(filename: string): string {
        return path.join(this.config.dataDir, filename);
    }

    private async loadEchoes(): Promise<void> {
        try {
            const filePath = this.getFilePath('echoes.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                for (const [realm, echoes] of Object.entries(data)) {
                    this.echoes.set(realm, echoes as Echo[]);
                }
            }
        } catch (error) {
            console.error('Failed to load echoes:', error);
        }
    }

    private async saveEchoes(): Promise<void> {
        try {
            const data: Record<string, Echo[]> = {};
            for (const [realm, echoes] of this.echoes) {
                data[realm] = echoes;
            }
            fs.writeFileSync(
                this.getFilePath('echoes.json'),
                JSON.stringify(data, null, 2)
            );
        } catch (error) {
            console.error('Failed to save echoes:', error);
        }
    }

    private async loadLitStars(): Promise<void> {
        try {
            const filePath = this.getFilePath('lit_stars.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.litStars = new Set(data);
            }
        } catch (error) {
            console.error('Failed to load lit stars:', error);
        }
    }

    private async saveLitStars(): Promise<void> {
        try {
            fs.writeFileSync(
                this.getFilePath('lit_stars.json'),
                JSON.stringify(Array.from(this.litStars))
            );
        } catch (error) {
            console.error('Failed to save lit stars:', error);
        }
    }

    private async loadPlayers(): Promise<void> {
        try {
            const filePath = this.getFilePath('players.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                for (const [id, player] of Object.entries(data)) {
                    this.players.set(id, player as PlayerData);
                }
            }
        } catch (error) {
            console.error('Failed to load players:', error);
        }
    }

    private async savePlayers(): Promise<void> {
        try {
            const data: Record<string, PlayerData> = {};
            for (const [id, player] of this.players) {
                data[id] = player;
            }
            fs.writeFileSync(
                this.getFilePath('players.json'),
                JSON.stringify(data, null, 2)
            );
        } catch (error) {
            console.error('Failed to save players:', error);
        }
    }
}

// Export singleton instance
export const persistence = new PersistenceService();
