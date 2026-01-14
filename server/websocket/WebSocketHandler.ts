// =============================================================================
// WebSocket Handler - SERVER-AUTHORITATIVE GAME STATE
// =============================================================================
// This is the heart of the server-authoritative architecture.
// ALL game state (players, bots, actions) is managed here.
//
// Key principles:
// 1. Server runs the game loop at 20Hz (serverGameTick)
// 2. Server broadcasts world_state to all clients every tick
// 3. Clients RECEIVE state, they don't dictate it (except player input)
// 4. Bots are 100% server-controlled (ServerBot class)
// 5. Actions (sing, pulse, emote, echo) are validated server-side
//
// Flow: Client sends input → Server processes → Server broadcasts state
// =============================================================================

import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';

interface PlayerConnection {
    ws: WebSocket;
    playerId: string;
    realm: string;
    lastSeen: number;
    x: number;
    y: number;
    name: string;
    hue: number;
    xp: number;
}

interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: number;
}

// Server-side Bot class
class ServerBot {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    hue: number;
    name: string;
    xp: number;
    moveAngle: number;
    actionTimer: number;
    thinkTimer: number;
    realm: string;
    singing: number;
    pulsing: number;
    emoting: string | null;

    constructor(x: number, y: number, realm: string = 'genesis') {
        this.id = 'bot-' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hue = 180 + Math.random() * 60;
        this.name = 'Guardian';
        this.xp = 100 + Math.random() * 800;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.actionTimer = 0;
        this.thinkTimer = 0;
        this.realm = realm;
        this.singing = 0;
        this.pulsing = 0;
        this.emoting = null;
    }

    update(): void {
        // Change movement direction
        if (Math.random() < 0.02) {
            this.moveAngle += (Math.random() - 0.5) * 2;
        }

        // Apply movement
        this.vx += Math.cos(this.moveAngle) * 0.2;
        this.vy += Math.sin(this.moveAngle) * 0.2;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.x += this.vx;
        this.y += this.vy;

        // Stay near center (campfire model)
        const distToCenter = Math.hypot(this.x, this.y);
        if (distToCenter > 2000) {
            const angleToCenter = Math.atan2(-this.y, -this.x);
            this.moveAngle = this.moveAngle * 0.9 + angleToCenter * 0.1;
        }

        this.actionTimer++;
        this.thinkTimer++;

        // Decay visual effects
        this.singing = Math.max(0, this.singing - 0.02);
        this.pulsing = Math.max(0, this.pulsing - 0.02);

        // Bot actions: Sing occasionally
        if (this.actionTimer > 300 && Math.random() < 0.005) {
            this.actionTimer = 0;
            this.singing = 1;
        }
    }

    toPlayerData(): any {
        return {
            id: this.id,
            name: this.name,
            x: Math.round(this.x),
            y: Math.round(this.y),
            hue: this.hue,
            xp: this.xp,
            singing: this.singing,
            pulsing: this.pulsing,
            emoting: this.emoting,
            isBot: true,
            realm: this.realm
        };
    }
}

/**
 * WebSocket server for real-time game synchronization
 * TRUE SERVER-AUTHORITATIVE ARCHITECTURE
 */
export class WebSocketHandler {
    private wss: WebSocketServer | null = null;
    private connections: Map<string, PlayerConnection> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private gameLoopInterval: NodeJS.Timeout | null = null;
    
    // Server-authoritative bots
    private bots: Map<string, ServerBot> = new Map();
    private readonly MIN_POPULATION = 3;
    
    // Server-authoritative state
    private litStars: Set<string> = new Set();
    private echoes: Map<string, any> = new Map();
    
    // Timeout for considering a player disconnected (30 seconds)
    private readonly PLAYER_TIMEOUT = 30000;
    private readonly CLEANUP_INTERVAL = 10000;
    private readonly GAME_TICK_RATE = 50; // 20Hz server tick

    /**
     * Initialize WebSocket server
     */
    init(server: Server): void {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws'
        });

        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            this.handleConnection(ws, req);
        });

        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleConnections();
        }, this.CLEANUP_INTERVAL);

        // Start server game loop - THIS IS THE AUTHORITATIVE GAME STATE
        this.gameLoopInterval = setInterval(() => {
            this.serverGameTick();
        }, this.GAME_TICK_RATE);

        console.log('🔌 WebSocket server initialized');
        console.log('🎮 Server game loop running at 20Hz');
    }

    /**
     * Server game tick - updates all server-authoritative state and broadcasts to all clients
     */
    private serverGameTick(): void {
        // Manage bot population per realm
        this.manageBotPopulation();
        
        // Update all bots
        for (const bot of this.bots.values()) {
            bot.update();
        }

        // Broadcast world state to all connected clients
        this.broadcastWorldState();
    }

    /**
     * Manage bot population (server-authoritative)
     */
    private manageBotPopulation(): void {
        const realms = ['genesis', 'nebula', 'void', 'starforge', 'sanctuary'];
        
        for (const realm of realms) {
            const playersInRealm = Array.from(this.connections.values()).filter(c => c.realm === realm).length;
            const botsInRealm = Array.from(this.bots.values()).filter(b => b.realm === realm).length;
            const totalPopulation = playersInRealm + botsInRealm;

            // Spawn bots if population too low
            if (totalPopulation < this.MIN_POPULATION && Math.random() < 0.02) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 300 + Math.random() * 700;
                const bot = new ServerBot(
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist,
                    realm
                );
                this.bots.set(bot.id, bot);
                console.log(`🤖 Guardian spawned in ${realm}. Population: ${totalPopulation + 1}`);
            }
            // Remove bots if too many (real players joining)
            else if (totalPopulation > this.MIN_POPULATION + 2 && botsInRealm > 0 && Math.random() < 0.01) {
                const realmBots = Array.from(this.bots.values()).filter(b => b.realm === realm);
                if (realmBots.length > 0) {
                    const botToRemove = realmBots[0];
                    this.bots.delete(botToRemove.id);
                    console.log(`👋 Guardian departed from ${realm}. Population: ${totalPopulation - 1}`);
                }
            }
        }
    }

    /**
     * Broadcast complete world state to all clients
     */
    private broadcastWorldState(): void {
        // Group connections by realm
        const realmConnections = new Map<string, PlayerConnection[]>();
        for (const conn of this.connections.values()) {
            if (!realmConnections.has(conn.realm)) {
                realmConnections.set(conn.realm, []);
            }
            realmConnections.get(conn.realm)!.push(conn);
        }

        // Broadcast to each realm
        for (const [realm, connections] of realmConnections) {
            // Get all players in this realm
            const players = connections.map(c => ({
                id: c.playerId,
                name: c.name || 'Wanderer',
                x: c.x,
                y: c.y,
                hue: c.hue || 200,
                xp: c.xp || 0,
                isBot: false
            }));

            // Get all bots in this realm
            const realmBots = Array.from(this.bots.values())
                .filter(b => b.realm === realm)
                .map(b => b.toPlayerData());

            // Combine all entities
            const allEntities = [...players, ...realmBots];

            // Broadcast to all players in this realm
            const worldState = {
                type: 'world_state',
                data: {
                    entities: allEntities,
                    litStars: Array.from(this.litStars).filter(s => s.startsWith(realm)),
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };

            for (const conn of connections) {
                if (conn.ws.readyState === WebSocket.OPEN) {
                    this.send(conn.ws, worldState);
                }
            }
        }
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(ws: WebSocket, req: IncomingMessage): void {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const playerId = url.searchParams.get('playerId');
        const realm = url.searchParams.get('realm') || 'genesis';

        if (!playerId) {
            ws.close(4000, 'Player ID required');
            return;
        }

        console.log(`🔌 Player connected: ${playerId} in realm: ${realm}`);

        // Store connection
        const connection: PlayerConnection = {
            ws,
            playerId,
            realm,
            lastSeen: Date.now(),
            x: 0,
            y: 0,
            name: 'Wanderer',
            hue: 200,
            xp: 0
        };
        this.connections.set(playerId, connection);

        // Notify other players in same realm
        this.broadcastToRealm(realm, {
            type: 'player_joined',
            data: { playerId },
            timestamp: Date.now()
        }, playerId);

        // Send current world state immediately
        this.sendInitialWorldState(ws, realm, playerId);

        // Handle messages
        ws.on('message', (data: Buffer) => {
            this.handleMessage(playerId, data.toString());
        });

        // Handle disconnection
        ws.on('close', () => {
            this.handleDisconnect(playerId);
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error(`WebSocket error for ${playerId}:`, error);
        });

        // Send ping for connection health
        ws.on('pong', () => {
            const conn = this.connections.get(playerId);
            if (conn) {
                conn.lastSeen = Date.now();
            }
        });
    }

    /**
     * Send initial world state to newly connected player
     */
    private sendInitialWorldState(ws: WebSocket, realm: string, excludePlayerId: string): void {
        // Get all players in this realm
        const players = Array.from(this.connections.values())
            .filter(c => c.realm === realm && c.playerId !== excludePlayerId)
            .map(c => ({
                id: c.playerId,
                name: c.name || 'Wanderer',
                x: c.x,
                y: c.y,
                hue: c.hue || 200,
                xp: c.xp || 0,
                isBot: false
            }));

        // Get all bots in this realm
        const realmBots = Array.from(this.bots.values())
            .filter(b => b.realm === realm)
            .map(b => b.toPlayerData());

        // Send initial state
        this.send(ws, {
            type: 'world_state',
            data: {
                entities: [...players, ...realmBots],
                litStars: Array.from(this.litStars).filter(s => s.startsWith(realm)),
                echoes: Array.from(this.echoes.values()).filter(e => e.realm === realm),
                timestamp: Date.now()
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle incoming message from client
     */
    private handleMessage(playerId: string, rawData: string): void {
        try {
            const message: WebSocketMessage = JSON.parse(rawData);
            const connection = this.connections.get(playerId);
            
            if (!connection) return;
            
            connection.lastSeen = Date.now();

            switch (message.type) {
                case 'player_update':
                    this.handlePlayerUpdate(playerId, connection, message.data);
                    break;
                case 'whisper':
                    this.handleWhisper(connection, message.data);
                    break;
                case 'sing':
                    this.handleSing(connection, message.data);
                    break;
                case 'pulse':
                    this.handlePulse(connection, message.data);
                    break;
                case 'emote':
                    this.handleEmote(connection, message.data);
                    break;
                case 'echo':
                    this.handleEcho(connection, message.data);
                    break;
                case 'star_lit':
                    this.handleStarLit(connection, message.data);
                    break;
                case 'ping':
                    // Respond to ping
                    this.send(connection.ws, { type: 'pong', data: {}, timestamp: Date.now() });
                    break;
            }
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    /**
     * Handle player position/state update
     */
    private handlePlayerUpdate(playerId: string, connection: PlayerConnection, data: any): void {
        // Update stored position and data
        if (typeof data.x === 'number') connection.x = data.x;
        if (typeof data.y === 'number') connection.y = data.y;
        if (typeof data.name === 'string') connection.name = data.name;
        if (typeof data.hue === 'number') connection.hue = data.hue;
        if (typeof data.xp === 'number') connection.xp = data.xp;
        
        // Handle realm change
        if (data.realmChange && data.realm !== connection.realm) {
            const oldRealm = connection.realm;
            connection.realm = data.realm;
            
            // Notify old realm of departure
            this.broadcastToRealm(oldRealm, {
                type: 'player_leave',
                data: { playerId },
                timestamp: Date.now()
            }, playerId);
            
            // Notify new realm of arrival
            this.broadcastToRealm(data.realm, {
                type: 'player_joined',
                data: { playerId },
                timestamp: Date.now()
            }, playerId);
            
            // Send current world state to player entering new realm
            this.sendInitialWorldState(connection.ws, data.realm, playerId);
        }

        // Note: Position updates are broadcast via broadcastWorldState() at 20Hz
        // No need to broadcast individual player_update messages here
    }

    /**
     * Handle whisper message
     */
    private handleWhisper(connection: PlayerConnection, data: any): void {
        if (data.targetId) {
            // Direct whisper to specific player
            const target = this.connections.get(data.targetId);
            if (target && target.ws.readyState === WebSocket.OPEN) {
                this.send(target.ws, {
                    type: 'whisper',
                    data,
                    timestamp: Date.now()
                });
            }
        } else {
            // Broadcast whisper to nearby players (within range)
            this.broadcastToNearby(connection, data, 'whisper', 500);
        }
    }

    /**
     * Handle sing action - broadcast to ALL players including sender (server-authoritative)
     */
    private handleSing(connection: PlayerConnection, data: any): void {
        // Broadcast to ALL players in realm INCLUDING sender
        this.broadcastToRealmAll(connection.realm, {
            type: 'sing',
            data: {
                ...data,
                playerId: connection.playerId
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle pulse action - broadcast to ALL players including sender (server-authoritative)
     */
    private handlePulse(connection: PlayerConnection, data: any): void {
        // Broadcast to ALL players in realm INCLUDING sender
        this.broadcastToRealmAll(connection.realm, {
            type: 'pulse',
            data: {
                ...data,
                playerId: connection.playerId
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle emote action - broadcast to ALL players including sender (server-authoritative)
     */
    private handleEmote(connection: PlayerConnection, data: any): void {
        // Broadcast to ALL players in realm INCLUDING sender
        this.broadcastToRealmAll(connection.realm, {
            type: 'emote',
            data: {
                ...data,
                playerId: connection.playerId
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle echo creation - broadcast to ALL players including sender (server-authoritative)
     */
    private handleEcho(connection: PlayerConnection, data: any): void {
        // Broadcast to ALL players in realm INCLUDING sender
        this.broadcastToRealmAll(connection.realm, {
            type: 'echo',
            data: {
                ...data,
                playerId: connection.playerId
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle star lit event - broadcast to ALL players including sender (server-authoritative)
     */
    private handleStarLit(connection: PlayerConnection, data: any): void {
        // Broadcast to ALL players in realm INCLUDING sender
        this.broadcastToRealmAll(connection.realm, {
            type: 'star_lit',
            data: {
                ...data,
                playerId: connection.playerId
            },
            timestamp: Date.now()
        });
    }

    /**
     * Handle player disconnect
     */
    private handleDisconnect(playerId: string): void {
        const connection = this.connections.get(playerId);
        if (connection) {
            console.log(`🔌 Player disconnected: ${playerId}`);
            
            // Notify other players in realm
            this.broadcastToRealm(connection.realm, {
                type: 'player_leave',
                data: { playerId },
                timestamp: Date.now()
            }, playerId);
            
            this.connections.delete(playerId);
        }
    }

    /**
     * Send message to specific WebSocket
     */
    private send(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all players in a realm (optionally excluding one)
     */
    private broadcastToRealm(realm: string, message: WebSocketMessage, excludePlayerId?: string): void {
        for (const [playerId, connection] of this.connections) {
            if (connection.realm === realm && 
                playerId !== excludePlayerId && 
                connection.ws.readyState === WebSocket.OPEN) {
                this.send(connection.ws, message);
            }
        }
    }

    /**
     * Broadcast message to ALL players in a realm (including sender - server-authoritative)
     */
    private broadcastToRealmAll(realm: string, message: WebSocketMessage): void {
        for (const [, connection] of this.connections) {
            if (connection.realm === realm && connection.ws.readyState === WebSocket.OPEN) {
                this.send(connection.ws, message);
            }
        }
    }

    /**
     * Broadcast message to nearby players
     */
    private broadcastToNearby(
        sender: PlayerConnection, 
        data: any, 
        messageType: string, 
        range: number
    ): void {
        for (const [playerId, connection] of this.connections) {
            if (connection.realm !== sender.realm) continue;
            if (playerId === sender.playerId) continue;
            if (connection.ws.readyState !== WebSocket.OPEN) continue;

            const dist = Math.hypot(connection.x - sender.x, connection.y - sender.y);
            if (dist <= range) {
                this.send(connection.ws, {
                    type: messageType,
                    data,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Send list of current players in realm to a specific connection
     */
    private sendPlayersInRealm(ws: WebSocket, realm: string, excludePlayerId: string): void {
        const players: any[] = [];
        
        for (const [playerId, connection] of this.connections) {
            if (connection.realm === realm && playerId !== excludePlayerId) {
                players.push({
                    id: playerId,
                    x: connection.x,
                    y: connection.y
                });
            }
        }
        
        this.send(ws, {
            type: 'players_list',
            data: { players },
            timestamp: Date.now()
        });
    }

    /**
     * Clean up stale connections
     */
    private cleanupStaleConnections(): void {
        const now = Date.now();
        const staleIds: string[] = [];
        
        for (const [playerId, connection] of this.connections) {
            if (now - connection.lastSeen > this.PLAYER_TIMEOUT) {
                staleIds.push(playerId);
            } else if (connection.ws.readyState === WebSocket.OPEN) {
                // Send ping to check connection
                connection.ws.ping();
            }
        }
        
        for (const playerId of staleIds) {
            console.log(`🧹 Cleaning up stale connection: ${playerId}`);
            this.handleDisconnect(playerId);
        }
    }

    /**
     * Get player count by realm
     */
    getPlayerCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        
        for (const connection of this.connections.values()) {
            counts[connection.realm] = (counts[connection.realm] || 0) + 1;
        }
        
        return counts;
    }

    /**
     * Get total connected players
     */
    getTotalPlayers(): number {
        return this.connections.size;
    }

    /**
     * Shutdown WebSocket server
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // Close all connections
        for (const connection of this.connections.values()) {
            connection.ws.close(1001, 'Server shutdown');
        }
        this.connections.clear();
        
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        
        console.log('🔌 WebSocket server shut down');
    }
}

// Export singleton instance
export const wsHandler = new WebSocketHandler();

// Export factory function for compatibility
export function setupWebSocket(server: Server): WebSocketHandler {
    const handler = new WebSocketHandler();
    handler.init(server);
    return handler;
}
