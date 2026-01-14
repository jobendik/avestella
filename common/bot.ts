// Shared Bot/Guardian logic between client and server
import { SHARED_CONFIG } from './constants';

/**
 * Bot thoughts - messages bots say occasionally
 */
export const BOT_THOUGHTS = [
    "Do you hear the music?",
    "We drift together...",
    "The light is strong here",
    "I'm waiting for more",
    "Do you see the stars?",
    "Welcome, wanderer",
    "The cosmos breathes",
    "Not alone anymore",
    "Time flows differently here",
    "Every connection matters",
    "The void listens",
    "Stars remember us"
] as const;

/**
 * Bot state interface
 */
export interface BotState {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    hue: number;
    name: string;
    xp: number;
    moveAngle: number;
    timer: number;
    actionTimer: number;
    thinkTimer: number;
    realm: string;
}

/**
 * Create a new bot with default values
 */
export function createBot(x: number, y: number, realm: string = 'genesis'): BotState {
    return {
        id: 'bot-' + Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: 0,
        vy: 0,
        hue: 180 + Math.random() * 60, // Bluish tones
        name: 'Guardian',
        xp: 100 + Math.random() * 800,
        moveAngle: Math.random() * Math.PI * 2,
        timer: 0,
        actionTimer: 0,
        thinkTimer: 0,
        realm
    };
}

/**
 * Update bot position and timers
 */
export function updateBot(bot: BotState, targetX?: number, targetY?: number): void {
    bot.timer++;
    bot.actionTimer++;
    bot.thinkTimer++;

    // Change movement direction
    if (Math.random() < 0.02) {
        bot.moveAngle += (Math.random() - 0.5) * 2;
    }

    // Move toward target if provided (Social Gravity)
    if (targetX !== undefined && targetY !== undefined) {
        const distToTarget = Math.hypot(bot.x - targetX, bot.y - targetY);
        if (distToTarget < 400 && distToTarget > 100) {
            const angleToTarget = Math.atan2(targetY - bot.y, targetX - bot.x);
            bot.moveAngle = bot.moveAngle * 0.95 + angleToTarget * 0.05;
        }
    }

    // Stay near campfire (center)
    const distToCenter = Math.hypot(bot.x, bot.y);
    if (distToCenter > SHARED_CONFIG.CAMPFIRE_RADIUS) {
        const angleToCenter = Math.atan2(-bot.y, -bot.x);
        bot.moveAngle = bot.moveAngle * 0.9 + angleToCenter * 0.1;
    }

    // Apply movement with friction
    bot.vx += Math.cos(bot.moveAngle) * 0.2;
    bot.vy += Math.sin(bot.moveAngle) * 0.2;
    bot.vx *= 0.94;
    bot.vy *= 0.94;
    bot.x += bot.vx;
    bot.y += bot.vy;
}

/**
 * Check if bot should sing
 */
export function shouldBotSing(bot: BotState): boolean {
    return bot.actionTimer > 300 && Math.random() < 0.005;
}

/**
 * Check if bot should speak a thought
 */
export function shouldBotSpeak(bot: BotState): boolean {
    return bot.thinkTimer > 500 && Math.random() < 0.002;
}

/**
 * Get a random bot thought
 */
export function getRandomBotThought(): string {
    return BOT_THOUGHTS[Math.floor(Math.random() * BOT_THOUGHTS.length)];
}

/**
 * Reset bot action timer after performing action
 */
export function resetBotActionTimer(bot: BotState): void {
    bot.actionTimer = 0;
}

/**
 * Reset bot think timer after speaking
 */
export function resetBotThinkTimer(bot: BotState): void {
    bot.thinkTimer = 0;
}
