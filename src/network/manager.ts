// Network and multiplayer functionality for AURA
// ⚠️ DEPRECATED: This HTTP-based NetworkManager is legacy code
// All real-time communication should go through WebSocketClient
// This file is kept only for potential fallback scenarios but should NOT be used
import type { Player, OtherPlayer, NetworkEvent } from '../types';

/**
 * @deprecated Use WebSocketClient instead for all networking
 * HTTP-based networking is NOT server-authoritative
 */
export class NetworkManager {
    private apiEndpoint: string = '/api';

    constructor() {
        // Initialize network manager
    }

    // Send event to backend
    async sendEvent(event: NetworkEvent): Promise<void> {
        try {
            await fetch(`${this.apiEndpoint}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send event:', error);
        }
    }

    // Get nearby players
    async getNearbyPlayers(x: number, y: number, realm: string): Promise<OtherPlayer[]> {
        try {
            const response = await fetch(
                `${this.apiEndpoint}/players?x=${x}&y=${y}&realm=${realm}&radius=3000`
            );
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch players:', error);
        }
        return [];
    }

    // Update player position
    async updatePosition(player: Player, realm: string): Promise<void> {
        try {
            await this.sendEvent({
                type: 'whisper',
                x: Math.round(player.x),
                y: Math.round(player.y),
                text: '',
                dx: 0,
                dy: 0,
                uid: player.id,
                name: player.name,
                hue: player.hue,
                xp: player.xp,
                singing: player.singing,
                pulsing: player.pulsing,
                emoting: player.emoting,
                realm: realm || 'genesis',
                t: Date.now()
            });
        } catch (error) {
            console.error('Failed to update position:', error);
        }
    }

    // Send whisper/message
    async sendWhisper(
        from: Player,
        text: string,
        dx: number,
        dy: number,
        target?: string,
        realm?: string
    ): Promise<void> {
        await this.sendEvent({
            type: 'whisper',
            x: Math.round(from.x),
            y: Math.round(from.y),
            text,
            dx,
            dy,
            target,
            uid: from.id,
            name: from.name,
            realm: realm || 'genesis',
            t: Date.now()
        });
    }

    // Send pulse event
    async sendPulse(player: Player, realm: string): Promise<void> {
        await this.sendEvent({
            type: 'pulse',
            x: Math.round(player.x),
            y: Math.round(player.y),
            uid: player.id,
            name: player.name,
            realm: realm || 'genesis',
            t: Date.now()
        });
    }

    // Send sing event
    async sendSing(player: Player, realm: string): Promise<void> {
        await this.sendEvent({
            type: 'sing',
            x: Math.round(player.x),
            y: Math.round(player.y),
            hue: player.hue,
            uid: player.id,
            name: player.name,
            realm: realm || 'genesis',
            t: Date.now()
        });
    }

    // Send emote event
    async sendEmote(player: Player, emoji: string, realm: string): Promise<void> {
        await this.sendEvent({
            type: 'emote',
            x: Math.round(player.x),
            y: Math.round(player.y),
            emoji,
            uid: player.id,
            name: player.name,
            realm: realm || 'genesis',
            t: Date.now()
        });
    }

    // Create echo
    async createEcho(
        player: Player,
        text: string,
        realm: string
    ): Promise<void> {
        await this.sendEvent({
            type: 'echo',
            x: Math.round(player.x),
            y: Math.round(player.y),
            text,
            hue: player.hue,
            uid: player.id,
            name: player.name,
            realm: realm || 'genesis',
            t: Date.now()
        });

        // Also save to backend echoes endpoint
        try {
            await fetch(`${this.apiEndpoint}/echoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: Math.round(player.x),
                    y: Math.round(player.y),
                    text,
                    hue: player.hue,
                    name: player.name,
                    realm,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Failed to save echo:', error);
        }
    }

    // Get echoes in realm
    async getEchoes(realm: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiEndpoint}/echoes?realm=${realm}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch echoes:', error);
        }
        return [];
    }

    // Send lit star event
    async sendLitStar(starId: string, realm: string): Promise<void> {
        await this.sendEvent({
            type: 'star_lit',
            x: 0,
            y: 0,
            uid: 'system', // or player id
            name: '',
            realm: realm,
            starId: starId,
            t: Date.now()
        });
    }

    // Get lit stars
    async getLitStars(realm: string): Promise<string[]> {
        try {
            const response = await fetch(`${this.apiEndpoint}/stars/lit?realm=${realm}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch lit stars:', error);
        }
        return [];
    }

    // Periodic position sync (call every few seconds)
    startPositionSync(player: Player, getCurrentRealm: () => string, intervalMs: number = 3000): number {
        return window.setInterval(() => {
            this.updatePosition(player, getCurrentRealm());
        }, intervalMs);
    }

    // Stop position sync
    stopPositionSync(intervalId: number): void {
        clearInterval(intervalId);
    }
}
