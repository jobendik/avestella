import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { z } from 'zod';

// Validation schemas
import {
    NetworkEventSchema,
    CreateEchoSchema,
    GetPlayersQuerySchema,
    GetEchoesQuerySchema,
    GetLitStarsQuerySchema,
    formatZodError,
    safeValidate
} from './middleware/validation';

// WebSocket handler
import { wsHandler } from './websocket/WebSocketHandler';

// Shared code
import { createBot, updateBot, shouldBotSing, SHARED_CONFIG } from '../common';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size for security

// ============================================
// IN-MEMORY STATE
// ============================================

interface PlayerState {
    id: string;
    name: string;
    x: number;
    y: number;
    realm: string;
    hue: number;
    xp: number;
    lastSeen: number;
    singing?: number;
    pulsing?: number;
    emoting?: string | null;
    isBot?: boolean;
}

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

const players = new Map<string, PlayerState>();
const echoes: Echo[] = [];
const litStars = new Set<string>();

// ============================================
// BOT SYSTEM (using shared logic)
// ============================================

import type { BotState } from '../common';

const bots: BotState[] = [];

// Server loop for bots (20Hz)
setInterval(() => {
    // Manage population
    if (players.size + bots.length < SHARED_CONFIG.MIN_POPULATION) {
        if (Math.random() < SHARED_CONFIG.BOT_SPAWN_CHANCE * 2) { // Higher spawn rate on server
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 500;
            bots.push(createBot(Math.cos(angle) * dist, Math.sin(angle) * dist));
        }
    } else if (players.size + bots.length > SHARED_CONFIG.MIN_POPULATION && bots.length > 0) {
        if (Math.random() < SHARED_CONFIG.BOT_REMOVE_CHANCE) {
            bots.pop();
        }
    }

    // Update bots
    bots.forEach(bot => {
        updateBot(bot);
        if (shouldBotSing(bot)) {
            bot.actionTimer = 0;
        }
    });
}, 50);

// ============================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================

function validateBody<T>(schema: z.ZodSchema<T>) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const result = safeValidate(schema, req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatZodError(result.error)
            });
        }
        req.body = result.data;
        next();
    };
}

function validateQuery<T>(schema: z.ZodSchema<T>) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const result = safeValidate(schema, req.query);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatZodError(result.error)
            });
        }
        (req as any).validatedQuery = result.data;
        next();
    };
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        players: players.size,
        bots: bots.length,
        echoes: echoes.length,
        wsConnections: wsHandler.getTotalPlayers()
    });
});

// Get WebSocket connection info
app.get('/api/ws-info', (_req, res) => {
    res.json({
        url: `ws://${_req.headers.host}/ws`,
        playerCounts: wsHandler.getPlayerCounts()
    });
});

// Player endpoints
app.get('/api/players', validateQuery(GetPlayersQuerySchema), (req, res) => {
    const query = (req as any).validatedQuery;
    const now = Date.now();

    // Cleanup stale players
    const toRemove: string[] = [];
    for (const [id, p] of players.entries()) {
        if (now - p.lastSeen > SHARED_CONFIG.PLAYER_TIMEOUT) {
            toRemove.push(id);
        }
    }
    toRemove.forEach(id => players.delete(id));

    // Filter by realm
    let activePlayers = Array.from(players.values());
    if (query.realm) {
        activePlayers = activePlayers.filter(p => p.realm === query.realm);
    }

    // Filter by distance if coordinates provided
    if (query.x !== undefined && query.y !== undefined) {
        activePlayers = activePlayers.filter(p => {
            const dist = Math.hypot(p.x - query.x!, p.y - query.y!);
            return dist <= query.radius;
        });
    }

    // Add bots to valid players list
    let activeBots = bots.map(b => ({
        id: b.id,
        name: b.name,
        x: b.x,
        y: b.y,
        realm: b.realm,
        hue: b.hue,
        xp: b.xp,
        lastSeen: Date.now(),
        isBot: true,
        singing: shouldBotSing(b) ? 1 : 0,
        pulsing: 0,
        emoting: null
    }));

    if (query.realm) {
        activeBots = activeBots.filter(b => b.realm === query.realm);
    }

    res.json([...activePlayers, ...activeBots]);
});

// Events endpoint - updates player state from client heartbeats/actions
app.post('/api/events', validateBody(NetworkEventSchema), (req, res) => {
    const event = req.body;

    // Handle star lighting
    if (event.type === 'star_lit' && event.starId) {
        litStars.add(event.starId);
        res.json({ success: true });
        return;
    }

    if (event.uid) {
        const existing = players.get(event.uid);
        const p: PlayerState = existing || {
            id: event.uid,
            name: event.name || 'Wanderer',
            x: event.x || 0,
            y: event.y || 0,
            realm: event.realm || 'genesis',
            hue: event.hue || 0,
            xp: event.xp || 0,
            lastSeen: Date.now()
        };

        p.lastSeen = Date.now();
        if (typeof event.x === 'number') p.x = event.x;
        if (typeof event.y === 'number') p.y = event.y;
        if (event.name) p.name = event.name;
        if (event.realm) p.realm = event.realm;
        if (typeof event.hue === 'number') p.hue = event.hue;
        if (typeof event.xp === 'number') p.xp = event.xp;

        // Handle transient actions
        if (event.type === 'whisper' && 'singing' in event) p.singing = event.singing;
        if (event.type === 'whisper' && 'pulsing' in event) p.pulsing = event.pulsing;
        if (event.type === 'emote') p.emoting = event.emoji;
        if (event.type === 'sing') p.singing = 1;
        if (event.type === 'pulse') p.pulsing = 1;

        players.set(event.uid, p);
    }

    res.json({ success: true });
});

// Lit Stars endpoint
app.get('/api/stars/lit', validateQuery(GetLitStarsQuerySchema), (req, res) => {
    const query = (req as any).validatedQuery;
    
    if (query.realm) {
        const filtered = Array.from(litStars).filter(id => id.startsWith(query.realm + ':'));
        res.json(filtered);
    } else {
        res.json(Array.from(litStars));
    }
});

// Echoes endpoints
app.get('/api/echoes', validateQuery(GetEchoesQuerySchema), (req, res) => {
    const query = (req as any).validatedQuery;
    
    const filtered = query.realm
        ? echoes.filter(e => e.realm === query.realm)
        : echoes;
    
    // Limit response size
    res.json(filtered.slice(-100));
});

app.post('/api/echoes', validateBody(CreateEchoSchema), (req, res) => {
    const echoData = req.body;
    
    // Limit echoes per realm
    const realmEchoes = echoes.filter(e => e.realm === echoData.realm);
    if (realmEchoes.length >= SHARED_CONFIG.MAX_ECHOES_PER_REALM) {
        // Remove oldest echo in realm
        const oldestIndex = echoes.findIndex(e => e.realm === echoData.realm);
        if (oldestIndex !== -1) {
            echoes.splice(oldestIndex, 1);
        }
    }
    
    const newEcho: Echo = {
        id: Math.random().toString(36).substr(2, 9),
        x: echoData.x,
        y: echoData.y,
        text: echoData.text,
        hue: echoData.hue,
        name: echoData.name,
        realm: echoData.realm,
        timestamp: echoData.timestamp || Date.now()
    };

    echoes.push(newEcho);
    res.json({ success: true, id: newEcho.id });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: formatZodError(err)
        });
    }
    
    // Handle JSON parse errors
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// SERVER STARTUP
// ============================================

// Initialize WebSocket server
wsHandler.init(server);

server.listen(PORT, () => {
    console.log(`🌌 AURA Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 REST API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    wsHandler.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
