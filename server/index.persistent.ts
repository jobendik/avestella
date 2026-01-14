// AURA Server v2.0 - with Persistence Layer & Real-time WebSocket
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { z, ZodSchema, ZodError } from 'zod';
import {
    NetworkEventSchema,
    CreateEchoSchema,
    PlayerStateSchema,
    StarsStateSchema,
    formatZodError
} from './middleware/validation';
import { setupWebSocket, WebSocketHandler } from './websocket/WebSocketHandler';
import { persistence } from './services/PersistenceService';
import { cache } from './services/CacheService';

const app = express();
const PORT = process.env.PORT || 3001;
const SYNC_RADIUS = 800;

// ============================================
// Middleware
// ============================================

app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Validation middleware factory
function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: formatZodError(error)
                });
            } else {
                next(error);
            }
        }
    };
}

function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: formatZodError(error)
                });
            } else {
                next(error);
            }
        }
    };
}

// ============================================
// Query Schemas
// ============================================

const PlayerQuerySchema = z.object({
    realm: z.string().min(1),
    x: z.coerce.number().finite(),
    y: z.coerce.number().finite(),
    excludeId: z.string().optional()
});

const EchoQuerySchema = z.object({
    realm: z.string().min(1),
    x: z.coerce.number().finite(),
    y: z.coerce.number().finite()
});

const StarsQuerySchema = z.object({
    realm: z.string().optional()
});

// ============================================
// REST API Routes - Using Persistence & Cache
// ============================================

// Get nearby players (from cache - ephemeral data)
app.get('/api/players', validateQuery(PlayerQuerySchema), (req: Request, res: Response) => {
    const { realm, x, y, excludeId } = req.query as unknown as z.infer<typeof PlayerQuerySchema>;

    const nearbyPlayers = cache.getPlayersNearby(
        realm,
        x,
        y,
        SYNC_RADIUS,
        excludeId
    );

    res.json(nearbyPlayers);
});

// Update player state (cache for real-time, persist for stats)
app.post('/api/players', validateBody(PlayerStateSchema), (req: Request, res: Response) => {
    const playerData = req.body;

    // Update in cache (real-time state)
    cache.setPlayer({
        ...playerData,
        lastUpdate: Date.now()
    });

    // Update persistent player data (stats only)
    const existingPlayer = persistence.getPlayer(playerData.id);
    if (existingPlayer) {
        persistence.updatePlayerStats(playerData.id, {
            lastSeen: Date.now()
        });
    } else {
        persistence.savePlayer({
            id: playerData.id,
            name: playerData.name,
            hue: playerData.hue,
            xp: 0,
            stars: 0,
            echoes: 0,
            achievements: [],
            lastSeen: Date.now(),
            createdAt: Date.now()
        });
    }

    res.json({ success: true });
});

// Get echoes near position (from persistence - permanent data)
app.get('/api/echoes', validateQuery(EchoQuerySchema), (req: Request, res: Response) => {
    const { realm, x, y } = req.query as unknown as z.infer<typeof EchoQuerySchema>;

    const allEchoes = persistence.getEchoes(realm);

    // Filter by distance
    const nearbyEchoes = allEchoes.filter(echo => {
        const dx = echo.x - x;
        const dy = echo.y - y;
        return Math.sqrt(dx * dx + dy * dy) < SYNC_RADIUS;
    });

    res.json(nearbyEchoes);
});

// Create new echo (persist immediately)
app.post('/api/echoes', validateBody(CreateEchoSchema), (req: Request, res: Response) => {
    const echoData = req.body;
    const echo = {
        id: `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...echoData,
        timestamp: Date.now()
    };

    persistence.addEcho(echo);

    // Update player's echo count
    persistence.updatePlayerStats(echoData.playerId || 'unknown', {
        echoes: (persistence.getPlayer(echoData.playerId)?.echoes || 0) + 1
    });

    res.json(echo);
});

// Get lit stars (from persistence)
app.get('/api/stars', validateQuery(StarsQuerySchema), (req: Request, res: Response) => {
    const { realm } = req.query as z.infer<typeof StarsQuerySchema>;
    const litStars = persistence.getLitStars(realm);
    res.json(litStars);
});

// Light a star (persist immediately)
app.post('/api/stars', validateBody(StarsStateSchema), (req: Request, res: Response) => {
    const { starId, playerId } = req.body;

    persistence.litStar(starId);

    // Update player's star count
    if (playerId) {
        const player = persistence.getPlayer(playerId);
        if (player) {
            persistence.updatePlayerStats(playerId, {
                stars: player.stars + 1
            });
        }
    }

    res.json({ success: true });
});

// Get server stats
app.get('/api/stats', (req: Request, res: Response) => {
    const cacheStats = cache.getStats();
    const allPlayers = persistence.getAllPlayers();
    const allEchoes = persistence.getAllEchoes();

    res.json({
        onlinePlayers: cacheStats.playerCount,
        realmCounts: cacheStats.realmCounts,
        registeredPlayers: allPlayers.length,
        totalEchoes: allEchoes.length,
        litStars: persistence.getLitStars().length
    });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// ============================================
// Error Handler
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// Server Startup with Persistence
// ============================================

let wsHandler: WebSocketHandler;

async function startServer(): Promise<void> {
    try {
        // Initialize persistence layer
        await persistence.init();

        // Start cache service
        cache.start();

        // Create HTTP server
        const server = createServer(app);

        // Setup WebSocket
        wsHandler = setupWebSocket(server);

        // Start listening
        server.listen(PORT, () => {
            console.log(`🌟 AURA Server v2.0 running on port ${PORT}`);
            console.log(`📡 WebSocket enabled`);
            console.log(`💾 Data persistence active`);
            console.log(`🗃️ Cache service running`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n🛑 Shutting down server...');

            // Close WebSocket connections
            if (wsHandler) {
                wsHandler.shutdown();
            }

            // Stop cache service
            cache.stop();

            // Save all data and shutdown persistence
            await persistence.shutdown();

            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

export { app };
