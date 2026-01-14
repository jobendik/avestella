import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Player endpoints
app.get('/api/players', (_req, res) => {
    res.json({ players: [] });
});

// Events endpoint
app.post('/api/events', (req, res) => {
    const event = req.body;
    console.log('Event received:', event);
    res.json({ success: true });
});

// Echoes endpoint
app.get('/api/echoes', (_req, res) => {
    res.json({ echoes: [] });
});

app.post('/api/echoes', (req, res) => {
    const echo = req.body;
    console.log('Echo created:', echo);
    res.json({ success: true, id: Math.random().toString(36).substr(2, 9) });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🌌 AURA Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});

export default app;
