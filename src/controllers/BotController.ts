// ⚠️ DEPRECATED: Client-side BotController
// ==========================================
// Bots are now 100% SERVER-AUTHORITATIVE
// All bot logic runs on the server in server/websocket/WebSocketHandler.ts
// Bots are received through 'world_state' WebSocket messages as entities with isBot=true
// They are stored in the 'others' Map alongside real players
//
// DO NOT USE THIS CLASS - it exists only for backwards compatibility
// and will be removed in a future version

import type { OtherPlayer } from '../types';

/**
 * @deprecated Bots are now 100% server-authoritative
 * This class is kept for backwards compatibility but does nothing
 * All bot logic has moved to server/websocket/WebSocketHandler.ts
 */
export class BotController {
    constructor(_config: any) {
        console.warn('⚠️ BotController is DEPRECATED - bots are server-authoritative');
    }

    /**
     * @deprecated No-op - bots managed by server
     */
    managePopulation(): void {
        // No-op: Server manages bot population
    }

    /**
     * @deprecated No-op - bots updated by server
     */
    update(): void {
        // No-op: Server updates bots and sends via world_state
    }

    /**
     * @deprecated Bots are in 'others' map with isBot=true
     */
    getBotsAsPlayers(): OtherPlayer[] {
        console.warn('⚠️ getBotsAsPlayers is DEPRECATED - bots are in others map');
        return [];
    }
}
