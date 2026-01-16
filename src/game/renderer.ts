// Rendering system for AURA
import type { Player, OtherPlayer, Camera, Particle, Star, Echo, Projectile } from '../types';
// Bot type removed - bots are now server-authoritative OtherPlayers
import { CONFIG, REALMS } from '../core/config';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private mmCtx: CanvasRenderingContext2D;
    private W: number;
    private H: number;
    private mmCanvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, minimapCanvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.mmCanvas = minimapCanvas;
        this.mmCtx = minimapCanvas.getContext('2d')!;
        this.W = canvas.width;
        this.H = canvas.height;

        // Disable image smoothing for crisp text rendering
        this.ctx.imageSmoothingEnabled = false;
        (this.ctx as any).webkitImageSmoothingEnabled = false;
        (this.ctx as any).mozImageSmoothingEnabled = false;

        // Initialize minimap canvas dimensions
        // Use explicit dimensions since offsetWidth/offsetHeight might be 0 initially
        this.mmCanvas.width = 240;  // 120px CSS * 2 for retina
        this.mmCanvas.height = 240; // 120px CSS * 2 for retina
    }

    updateDimensions(width: number, height: number): void {
        this.W = width;
        this.H = height;
        this.mmCanvas.width = this.mmCanvas.offsetWidth * 2;
        this.mmCanvas.height = this.mmCanvas.offsetHeight * 2;
    }

    renderNebula(camera: Camera, player: Player, currentRealm: string): void {
        const r = REALMS[currentRealm as keyof typeof REALMS] || REALMS.genesis;
        const nx = player.x * 0.015;
        const ny = player.y * 0.015;
        const n1 = r.n1;
        const n2 = r.n2;

        // Campfire Model: Reduce nebula intensity based on distance from center
        const distFromCenter = Math.hypot(player.x, player.y);
        let nebulaIntensity = 1;
        if (distFromCenter > CONFIG.CAMPFIRE_RADIUS) {
            const excessDist = distFromCenter - CONFIG.CAMPFIRE_RADIUS;
            nebulaIntensity = Math.max(0.15, Math.exp(-excessDist / 4000));
        }

        let g = this.ctx.createRadialGradient(
            this.W / 2 + camera.x + Math.sin(nx) * 250,
            this.H / 2 + camera.y + Math.cos(ny) * 250,
            0,
            this.W / 2 + camera.x,
            this.H / 2 + camera.y,
            700
        );
        g.addColorStop(0, `rgba(${n1[0]},${n1[1]},${n1[2]},${0.025 * nebulaIntensity})`);
        g.addColorStop(1, `rgba(${n1[0]},${n1[1]},${n1[2]},0)`);
        this.ctx.fillStyle = g;
        this.ctx.fillRect(camera.x, camera.y, this.W, this.H);

        g = this.ctx.createRadialGradient(
            this.W / 2 + camera.x - Math.cos(nx * 0.8) * 350,
            this.H / 2 + camera.y - Math.sin(ny * 0.8) * 350,
            0,
            this.W / 2 + camera.x,
            this.H / 2 + camera.y,
            550
        );
        g.addColorStop(0, `rgba(${n2[0]},${n2[1]},${n2[2]},${0.02 * nebulaIntensity})`);
        g.addColorStop(1, `rgba(${n2[0]},${n2[1]},${n2[2]},0)`);
        this.ctx.fillStyle = g;
        this.ctx.fillRect(camera.x, camera.y, this.W, this.H);
    }

    renderBgStars(camera: Camera): void {
        this.ctx.fillStyle = 'rgba(200,210,255,0.22)';
        for (let i = 0; i < 90; i++) {
            const x = ((i * 73.1 + camera.x * 0.025) % this.W) + camera.x;
            const y = ((i * 41.7 + camera.y * 0.025) % this.H) + camera.y;
            const sz = ((i * 17) % 3) * 0.35 + 0.25;
            this.ctx.beginPath();
            this.ctx.arc(x, y, sz, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderStars(stars: Map<string, Star[]>, player: Player, viewRadius: number, currentRealm: string): void {
        for (const [k, arr] of stars) {
            if (!k.startsWith(currentRealm + ':')) continue;
            for (const s of arr) {
                const dx = s.x - player.x;
                const dy = s.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > viewRadius + 180) continue;

                const a = Math.max(0, 1 - dist / viewRadius);
                const tw = 0.75 + Math.sin(s.tw) * 0.25;

                if (s.lit) {
                    const p = 1 + s.burst * 0.7;
                    const rad = 5.5 * s.br * p;
                    this.ctx.globalCompositeOperation = 'lighter';
                    const g = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 4.5);
                    g.addColorStop(0, `rgba(232,197,71,${0.65 * a * tw})`);
                    g.addColorStop(0.35, `rgba(232,197,71,${0.2 * a * tw})`);
                    g.addColorStop(1, 'rgba(232,197,71,0)');
                    this.ctx.fillStyle = g;
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, rad * 4.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.globalCompositeOperation = 'source-over';
                    this.ctx.fillStyle = `rgba(255,255,255,${a * tw})`;
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, rad * 0.55, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    this.ctx.fillStyle = `rgba(150,160,180,${0.32 * a * s.br * tw})`;
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, 2.2 * s.br, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }

    renderEchoes(echoes: Echo[], player: Player, viewRadius: number, currentRealm: string): void {
        for (const e of echoes) {
            if (e.realm !== currentRealm) continue;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.hypot(dx, dy);
            if (dist > viewRadius + 180) continue;

            const a = Math.max(0, 1 - dist / viewRadius);

            // "Ignited" state (likes) increases size and brightness
            const ignited = e.ignited || 0;
            const extraSize = Math.min(20, ignited * 2); // Cap growth
            const extraGlow = Math.min(0.5, ignited * 0.05);

            // Pulsating effect for "living" stars
            const ps = 1 + (e.pulse * 0.12) + (Math.sin(Date.now() / 500) * 0.1);
            const rad = (e.r + extraSize) * ps;

            // DRAW GLOW (Star-like)
            this.ctx.globalCompositeOperation = 'lighter';
            const g = this.ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rad * 6.5);
            g.addColorStop(0, `hsla(${e.hue},80%,70%,${(0.6 + extraGlow) * a})`);
            g.addColorStop(0.3, `hsla(${e.hue},70%,50%,${(0.25 + extraGlow) * a})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, rad * 6.5, 0, Math.PI * 2);
            this.ctx.fill();

            // DRAW CORE (White hot center)
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = `rgba(255,255,255,${a * 0.95})`;
            this.ctx.shadowColor = `hsla(${e.hue},80%,60%,1)`;
            this.ctx.shadowBlur = 10 + extraSize;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, rad * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Show text only when close (Hover feel)
            if (dist < 120) {
                const textAlpha = Math.min(1, (120 - dist) / 40) * a;

                // Text outline for readability
                this.ctx.strokeStyle = `rgba(0,0,0,${textAlpha * 0.7})`;
                this.ctx.lineWidth = 2.5;
                this.ctx.font = '500 14px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.strokeText(e.text, e.x, e.y - rad - 20);
                this.ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
                this.ctx.fillText(e.text, e.x, e.y - rad - 20);

                this.ctx.strokeStyle = `rgba(0,0,0,${textAlpha * 0.5})`;
                this.ctx.lineWidth = 2;
                this.ctx.font = '11px Inter, sans-serif';
                this.ctx.strokeText(`— ${e.name} ${ignited > 0 ? `(Ignited x${ignited})` : ''}`, e.x, e.y - rad - 38);
                this.ctx.fillStyle = `rgba(200,220,255,${textAlpha * 0.75})`;
                this.ctx.fillText(`— ${e.name} ${ignited > 0 ? `(Ignited x${ignited})` : ''}`, e.x, e.y - rad - 38);
            }
        }
    }

    renderConstellations(constellations: [Star, Star, Star][]): void {
        if (!constellations.length) return;
        this.ctx.globalCompositeOperation = 'lighter';
        for (const [a, b, c] of constellations) {
            const cx = (a.x + b.x + c.x) / 3;
            const cy = (a.y + b.y + c.y) / 3;
            const g = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 170);
            g.addColorStop(0, 'rgba(125,211,252,0.05)');
            g.addColorStop(1, 'rgba(125,211,252,0)');
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.moveTo(a.x, a.y);
            this.ctx.lineTo(b.x, b.y);
            this.ctx.lineTo(c.x, c.y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(125,211,252,0.22)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        this.ctx.globalCompositeOperation = 'source-over';
    }

    renderTethers(player: Player, others: Map<string, OtherPlayer>): void {
        others.forEach((o) => {
            // Use server-provided bond strength, or fall back to local bonds
            const b = o.bondToViewer ?? (player.bonds.get(o.id) || 0);

            if (b > 0.1) {
                const dist = Math.hypot(player.x - o.x, player.y - o.y);
                if (dist < CONFIG.TETHER) {
                    // Non-linear scaling: bonds become visible quickly
                    // At b=5: ~0.15 opacity. At b=50: ~0.4 opacity. At b=100: ~0.8 opacity
                    const normalizedBond = Math.min(1, b / 100);
                    const baseOpacity = 0.1 + Math.pow(normalizedBond, 0.5) * 0.7;

                    const a = baseOpacity * (1 - dist / CONFIG.TETHER);

                    this.ctx.globalCompositeOperation = 'lighter';
                    const g = this.ctx.createLinearGradient(player.x, player.y, o.x, o.y);
                    g.addColorStop(0, `hsla(${player.hue},72%,58%,${a})`);
                    g.addColorStop(1, `hsla(${o.hue},72%,58%,${a})`);
                    this.ctx.strokeStyle = g;
                    this.ctx.lineWidth = 1 + normalizedBond * 2; // Thicker as bond grows
                    this.ctx.beginPath();
                    this.ctx.moveTo(player.x, player.y);
                    this.ctx.lineTo(o.x, o.y);
                    this.ctx.stroke();
                    this.ctx.globalCompositeOperation = 'source-over';
                }
            }
        });
    }

    renderOthers(others: Map<string, OtherPlayer>, player: Player, viewRadius: number): void {
        others.forEach(o => {
            const dx = o.x - player.x;
            const dy = o.y - player.y;
            const dist = Math.hypot(dx, dy);

            if (dist > viewRadius + 120) return;

            const a = Math.max(0.08, 1 - dist / viewRadius);

            // Use slightly different styling for bots
            const isBot = o.isBot || false;

            // Trail
            if (o.trail && o.trail.length > 1) {
                this.ctx.globalCompositeOperation = 'lighter';
                for (let i = 1; i < o.trail.length; i++) {
                    const t = o.trail[i];
                    const p = o.trail[i - 1];
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(t.x, t.y);
                    this.ctx.strokeStyle = `hsla(${o.hue},68%,55%,${t.life * 0.3 * a})`;
                    this.ctx.lineWidth = 3.5 * t.life;
                    this.ctx.stroke();
                }
                this.ctx.globalCompositeOperation = 'source-over';
            }

            // Pulsing effect
            if (o.pulsing && o.pulsing > 0) {
                this.ctx.beginPath();
                this.ctx.arc(o.x, o.y, (1 - o.pulsing) * 220, 0, Math.PI * 2);
                this.ctx.strokeStyle = `hsla(${o.hue},68%,55%,${o.pulsing * a * 0.5})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            // Singing effect
            if (o.singing && o.singing > 0) {
                this.ctx.beginPath();
                this.ctx.arc(o.x, o.y, (1 - o.singing) * 180, 0, Math.PI * 2);
                this.ctx.strokeStyle = `hsla(${o.hue},62%,52%,${o.singing * a * 0.45})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            // Speaking indicator
            if (o.speaking) {
                this.ctx.beginPath();
                const ph = (Date.now() % 1000) / 1000;
                this.ctx.arc(o.x, o.y, o.halo + 15 + Math.sin(ph * Math.PI * 2) * 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(34,197,94,${0.4 * a})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            // Halo
            this.ctx.globalCompositeOperation = 'lighter';
            const g = this.ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.halo);
            g.addColorStop(0, `hsla(${o.hue},72%,58%,${0.48 * a})`);
            g.addColorStop(0.45, `hsla(${o.hue},68%,48%,${0.18 * a})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.halo, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';

            // Core
            this.ctx.fillStyle = `hsla(${o.hue},68%,72%,${a})`;
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            this.ctx.fill();

            // Emote
            if (o.emoting && o.emoteT && o.emoteT > 0) {
                this.ctx.font = '28px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(o.emoting, o.x, o.y - o.halo - 16);
            }

            // Name with outline - different styling for bots
            if (isBot) {
                // Bot name styling - slightly transparent, different color
                this.ctx.strokeStyle = `rgba(0,0,0,${a * 0.45})`;
                this.ctx.lineWidth = 2;
                this.ctx.font = '10px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.strokeText(o.name, o.x, o.y - o.r - 12);
                this.ctx.fillStyle = `rgba(125,211,252,${a * 0.7})`;
                this.ctx.fillText(o.name, o.x, o.y - o.r - 12);

                // Bot message bubble (when bot is speaking a thought)
                if (o.message && o.messageTimer && o.messageTimer > 0) {
                    const msgAlpha = Math.min(1, o.messageTimer / 60) * a; // Fade in/out
                    const msgY = o.y - o.halo - 35;

                    // Measure text for bubble width
                    this.ctx.font = '12px Outfit';
                    const textWidth = this.ctx.measureText(o.message).width;
                    const padding = 12;
                    const bubbleWidth = textWidth + padding * 2;
                    const bubbleHeight = 22;

                    // Draw bubble background
                    this.ctx.fillStyle = `rgba(30, 40, 60, ${msgAlpha * 0.9})`;
                    this.ctx.beginPath();
                    this.ctx.roundRect(
                        o.x - bubbleWidth / 2,
                        msgY - bubbleHeight / 2,
                        bubbleWidth,
                        bubbleHeight,
                        8
                    );
                    this.ctx.fill();

                    // Draw bubble border
                    this.ctx.strokeStyle = `rgba(150, 180, 255, ${msgAlpha * 0.5})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();

                    // Draw message text
                    this.ctx.font = '12px Inter, sans-serif';
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${msgAlpha * 0.95})`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(o.message, o.x, msgY);
                    this.ctx.textBaseline = 'alphabetic';
                }
            } else {
                // Real player name styling
                this.ctx.strokeStyle = `rgba(0,0,0,${a * 0.55})`;
                this.ctx.lineWidth = 2;
                this.ctx.font = '500 11px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.strokeText(o.name, o.x, o.y - o.r - 14);
                this.ctx.fillStyle = `rgba(255,255,255,${a * 0.92})`;
                this.ctx.fillText(o.name, o.x, o.y - o.r - 14);
            }
        });
    }

    renderBots(bots: OtherPlayer[], player: Player, viewRadius: number): void {
        bots.forEach(bot => {
            const dx = bot.x - player.x;
            const dy = bot.y - player.y;
            const dist = Math.hypot(dx, dy);
            if (dist > viewRadius + 100) return;

            const a = Math.min(1, 1 - dist / (viewRadius + 100));

            // Trail
            if (bot.trail.length > 1) {
                this.ctx.globalCompositeOperation = 'lighter';
                for (let i = 1; i < bot.trail.length; i++) {
                    const t = bot.trail[i];
                    const p = bot.trail[i - 1];
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(t.x, t.y);
                    this.ctx.strokeStyle = `hsla(${bot.hue},70%,60%,${t.life * 0.3 * a})`;
                    this.ctx.lineWidth = 3 * t.life;
                    this.ctx.stroke();
                }
                this.ctx.globalCompositeOperation = 'source-over';
            }

            // Halo/glow
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = `hsla(${bot.hue},75%,50%,${a * 0.12})`;
            this.ctx.beginPath();
            this.ctx.arc(bot.x, bot.y, 50, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';

            // Core
            const botLevel = this.getPlayerLevel(bot.xp);
            const botR = 11 + botLevel * 1.5;
            this.ctx.fillStyle = `hsla(${bot.hue},68%,72%,${a})`;
            this.ctx.beginPath();
            this.ctx.arc(bot.x, bot.y, botR, 0, Math.PI * 2);
            this.ctx.fill();

            // Name (slightly transparent to indicate it's a bot)
            this.ctx.strokeStyle = `rgba(0,0,0,${a * 0.45})`;
            this.ctx.lineWidth = 2;
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(bot.name, bot.x, bot.y - botR - 12);
            this.ctx.fillStyle = `rgba(125,211,252,${a * 0.7})`;
            this.ctx.fillText(bot.name, bot.x, bot.y - botR - 12);
        });
    }

    renderProjectiles(projectiles: Projectile[]): void {
        for (const p of projectiles) {
            const a = Math.min(1, p.life / 70);

            // Trail
            if (p.trail.length > 1) {
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let i = 1; i < p.trail.length; i++) {
                    this.ctx.lineTo(p.trail[i].x, p.trail[i].y);
                }
                this.ctx.strokeStyle = `rgba(180,200,255,${a * 0.22})`;
                this.ctx.lineWidth = 2.5;
                this.ctx.stroke();
                this.ctx.globalCompositeOperation = 'source-over';
            }

            // Glow
            this.ctx.globalCompositeOperation = 'lighter';
            const g = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 35);
            g.addColorStop(0, `rgba(200,220,255,${a * 0.35})`);
            g.addColorStop(1, 'rgba(200,220,255,0)');
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 35, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';

            // Text with outline for readability
            this.ctx.strokeStyle = `rgba(0,0,0,${a * 0.7})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.font = '600 14px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(p.text, p.x, p.y + 5);
            this.ctx.fillStyle = `rgba(255,255,255,${a})`;
            this.ctx.fillText(p.text, p.x, p.y + 5);
        }
    }

    renderPlayer(player: Player, voiceOn: boolean, isSpeaking: boolean): void {
        // Trail
        if (player.trail.length > 1) {
            this.ctx.globalCompositeOperation = 'lighter';
            for (let i = 1; i < player.trail.length; i++) {
                const t = player.trail[i];
                const p = player.trail[i - 1];
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(t.x, t.y);
                this.ctx.strokeStyle = `hsla(${player.hue},70%,60%,${t.life * 0.38})`;
                this.ctx.lineWidth = 4.5 * t.life;
                this.ctx.stroke();
            }
            this.ctx.globalCompositeOperation = 'source-over';
        }

        // Pulsing effect
        if (player.pulsing > 0) {
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, (1 - player.pulsing) * 300, 0, Math.PI * 2);
            this.ctx.strokeStyle = `hsla(${player.hue},72%,58%,${player.pulsing * 0.45})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Singing effect
        if (player.singing > 0) {
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, (1 - player.singing) * 220, 0, Math.PI * 2);
            this.ctx.strokeStyle = `hsla(${player.hue},65%,55%,${player.singing * 0.38})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
        }

        // Voice indicator
        if (voiceOn && isSpeaking) {
            this.ctx.beginPath();
            const ph = (Date.now() % 1000) / 1000;
            this.ctx.arc(player.x, player.y, player.halo + 18 + Math.sin(ph * Math.PI * 2) * 6, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(34,197,94,0.5)';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
        }

        // Outer halo
        this.ctx.globalCompositeOperation = 'lighter';
        let g = this.ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.halo * 1.6);
        g.addColorStop(0, `hsla(${player.hue},78%,62%,0.12)`);
        g.addColorStop(0.45, `hsla(${player.hue},70%,55%,0.05)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.halo * 1.6, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner halo
        g = this.ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.halo);
        g.addColorStop(0, `hsla(${player.hue},88%,68%,0.68)`);
        g.addColorStop(0.38, `hsla(${player.hue},78%,58%,0.32)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.halo, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';

        // Core
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = `hsla(${player.hue},78%,68%,0.75)`;
        this.ctx.shadowBlur = 22;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Emote
        if (player.emoting && player.emoteT > 0) {
            this.ctx.font = '32px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.emoting, player.x, player.y - player.halo - 20);
        }
    }

    renderParticles(particles: Particle[]): void {
        this.ctx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
            this.ctx.fillStyle = `hsla(${p.hue},72%,62%,${p.life * 0.78})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalCompositeOperation = 'source-over';
    }

    renderFloats(floats: { x: number; y: number; text: string; hue: number; size: number; life: number }[]): void {
        for (const f of floats) {
            // Text outline
            this.ctx.strokeStyle = `rgba(0,0,0,${f.life * 0.6})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.font = `600 ${f.size}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(f.text, f.x, f.y);
            // Fill text
            this.ctx.fillStyle = `hsla(${f.hue},65%,72%,${f.life})`;
            this.ctx.fillText(f.text, f.x, f.y);
        }
    }

    renderVignette(): void {
        const g = this.ctx.createRadialGradient(
            this.W / 2,
            this.H / 2,
            0,
            this.W / 2,
            this.H / 2,
            Math.max(this.W, this.H) * 0.62
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.65, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.48)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.W, this.H);
    }



    renderMinimap(
        player: Player,
        others: Map<string, OtherPlayer>,
        echoes: Echo[],
        viewRadius: number,
        currentRealm: string
    ): void {
        const mw = this.mmCanvas.width;
        const mh = this.mmCanvas.height;
        const sc = mw / (CONFIG.MINIMAP_R * 2);
        const r = REALMS[currentRealm as keyof typeof REALMS] || REALMS.genesis;
        const bg = r.bg;

        this.mmCtx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},0.85)`;
        this.mmCtx.fillRect(0, 0, mw, mh);

        const cx = mw / 2;
        const cy = mh / 2;

        // Render other players
        others.forEach((o) => {
            const dx = (o.x - player.x) * sc;
            const dy = (o.y - player.y) * sc;
            if (Math.abs(dx) < mw / 2 && Math.abs(dy) < mh / 2) {
                const b = player.bonds.get(o.id) || 0;
                const a = 0.28 + (b / 100) * 0.72;
                this.mmCtx.fillStyle = `hsla(${o.hue},68%,55%,${a})`;
                this.mmCtx.beginPath();
                this.mmCtx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
                this.mmCtx.fill();
            }
        });

        // Render echoes
        for (const e of echoes) {
            if (e.realm !== currentRealm) continue;
            const dx = (e.x - player.x) * sc;
            const dy = (e.y - player.y) * sc;
            if (Math.abs(dx) < mw / 2 && Math.abs(dy) < mh / 2) {
                this.mmCtx.fillStyle = `hsla(${e.hue},58%,48%,0.38)`;
                this.mmCtx.beginPath();
                this.mmCtx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
                this.mmCtx.fill();
            }
        }

        // Render player
        this.mmCtx.fillStyle = '#fff';
        this.mmCtx.beginPath();
        this.mmCtx.arc(cx, cy, 4, 0, Math.PI * 2);
        this.mmCtx.fill();

        // Render view radius
        this.mmCtx.strokeStyle = 'rgba(125,211,252,0.15)';
        this.mmCtx.lineWidth = 1;
        this.mmCtx.beginPath();
        this.mmCtx.arc(cx, cy, viewRadius * sc, 0, Math.PI * 2);
        this.mmCtx.stroke();
    }

    clear(currentRealm: string): void {
        const r = REALMS[currentRealm as keyof typeof REALMS] || REALMS.genesis;
        const bg = r.bg;
        this.ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},0.14)`;
        this.ctx.fillRect(0, 0, this.W, this.H);
    }

    save(): void {
        this.ctx.save();
    }

    restore(): void {
        this.ctx.restore();
    }

    translate(x: number, y: number): void {
        this.ctx.translate(x, y);
    }

    private getPlayerLevel(xp: number): number {
        let level = 1;
        for (let i = CONFIG.LEVEL_XP.length - 1; i >= 0; i--) {
            if (xp >= CONFIG.LEVEL_XP[i]) {
                level = i + 1;
                break;
            }
        }
        return level;
    }

    /**
     * Render navigation compass when player is far from center (Campfire Model)
     */
    renderCompass(player: Player): void {
        const distToCenter = Math.hypot(player.x, player.y);

        if (distToCenter > CONFIG.COMPASS_DISTANCE) {
            const opacity = Math.min(1, (distToCenter - CONFIG.COMPASS_DISTANCE) / 1000);
            const angle = Math.atan2(-player.y, -player.x);

            // Position on screen (offset from center)
            const radius = 100;
            const arrowX = this.W / 2 + Math.cos(angle) * radius;
            const arrowY = this.H / 2 + Math.sin(angle) * radius;

            this.ctx.save();
            this.ctx.translate(arrowX, arrowY);
            this.ctx.rotate(angle);

            // Arrow pointing to center
            this.ctx.fillStyle = `rgba(125, 211, 252, ${opacity * 0.75})`;
            this.ctx.beginPath();
            this.ctx.moveTo(12, 0);
            this.ctx.lineTo(-8, 6);
            this.ctx.lineTo(-8, -6);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();

            // Distance text with outline
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.7})`;
            this.ctx.lineWidth = 2;
            this.ctx.font = '500 10px "JetBrains Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(
                `${Math.round(distToCenter)} to Campfire`,
                arrowX,
                arrowY + 22
            );
            this.ctx.fillStyle = `rgba(125, 211, 252, ${opacity * 0.85})`;
            this.ctx.fillText(
                `${Math.round(distToCenter)} to Campfire`,
                arrowX,
                arrowY + 22
            );
        }
    }
}
