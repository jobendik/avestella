// Persistence system for settings and progress
import type { Settings, Stats, DailyProgress } from '../types';

export class PersistenceManager {
    private static readonly SETTINGS_KEY = 'aura_settings';
    private static readonly STATS_KEY = 'aura_stats';
    private static readonly DAILY_KEY = 'aura_daily';
    private static readonly ACHIEVEMENTS_KEY = 'aura_achievements';

    /**
     * Save settings to localStorage
     */
    static saveSettings(settings: Settings): void {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    /**
     * Load settings from localStorage
     */
    static loadSettings(): Partial<Settings> {
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return {};
    }

    /**
     * Save player stats
     */
    static saveStats(stats: Stats): void {
        try {
            localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }

    /**
     * Load player stats
     */
    static loadStats(): Partial<Stats> {
        try {
            const saved = localStorage.getItem(this.STATS_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
        return {};
    }

    /**
     * Save daily progress
     */
    static saveDailyProgress(progress: DailyProgress): void {
        try {
            localStorage.setItem(this.DAILY_KEY, JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save daily progress:', e);
        }
    }

    /**
     * Load daily progress (with auto-reset if new day)
     */
    static loadDailyProgress(): DailyProgress {
        try {
            const saved = localStorage.getItem(this.DAILY_KEY);
            if (saved) {
                const progress = JSON.parse(saved);
                const today = new Date().toDateString();

                // Auto-reset if it's a new day
                if (progress.date === today) {
                    return progress;
                }
            }
        } catch (e) {
            console.error('Failed to load daily progress:', e);
        }

        // Return fresh daily progress
        return {
            date: new Date().toDateString(),
            whispers: 0,
            stars: 0,
            connections: 0,
            sings: 0,
            emotes: 0
        };
    }

    /**
     * Save unlocked achievements
     */
    static saveAchievements(achievements: Set<string>): void {
        try {
            localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify([...achievements]));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }

    /**
     * Load unlocked achievements
     */
    static loadAchievements(): Set<string> {
        try {
            const saved = localStorage.getItem(this.ACHIEVEMENTS_KEY);
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load achievements:', e);
        }
        return new Set();
    }

    /**
     * Get time until daily quest reset (milliseconds until midnight)
     */
    static getTimeUntilReset(): number {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime() - now.getTime();
    }

    /**
     * Format time as HH:MM:SS
     */
    static formatTime(ms: number): string {
        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if daily reset is needed and return fresh progress if so
     */
    static checkDailyReset(currentProgress: DailyProgress): DailyProgress {
        const today = new Date().toDateString();
        if (currentProgress.date !== today) {
            return {
                date: today,
                whispers: 0,
                stars: 0,
                connections: 0,
                sings: 0,
                emotes: 0
            };
        }
        return currentProgress;
    }
}
