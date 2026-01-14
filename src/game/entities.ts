// Game entity classes for AURA

export class Star {
    x: number;
    y: number;
    lit: boolean;
    burst: number;
    br: number;
    tw: number;
    tws: number;
    realm: string;

    constructor(x: number, y: number, lit: boolean = false, br: number = 1, realm: string = 'genesis') {
        this.x = x;
        this.y = y;
        this.lit = lit;
        this.burst = 0;
        this.br = br;
        this.tw = Math.random() * Math.PI * 2;
        this.tws = 0.015 + Math.random() * 0.025;
        this.realm = realm;
    }
}

export class Echo {
    x: number;
    y: number;
    text: string;
    hue: number;
    name: string;
    r: number;
    pulse: number;
    realm: string;

    constructor(x: number, y: number, text: string, hue: number, name: string = 'Unknown', realm: string = 'genesis') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.hue = hue;
        this.name = name;
        this.r = 9;
        this.pulse = 0;
        this.realm = realm;
    }
}

export class Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    text: string;
    owner: string;
    target: string | null;
    life: number;
    hit: boolean;
    trail: { x: number; y: number }[];

    constructor(x: number, y: number, vx: number, vy: number, text: string, owner: string, target: string | null = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.text = text;
        this.owner = owner;
        this.target = target;
        this.life = 320;
        this.hit = false;
        this.trail = [];
    }

    update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 18) this.trail.shift();
    }
}

export class FloatingText {
    x: number;
    y: number;
    text: string;
    hue: number;
    size: number;
    life: number;
    decay: number;
    vy: number;

    constructor(x: number, y: number, text: string, hue: number = 0, size: number = 14, dur: number = 1.5) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.hue = hue;
        this.size = size;
        this.life = 1;
        this.decay = 1 / (dur * 60);
        this.vy = -0.8;
    }

    update(): void {
        this.y += this.vy;
        this.life -= this.decay;
    }
}

export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    hue: number;

    constructor(x: number, y: number, vx: number, vy: number, hue: number, size: number = 3) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1;
        this.size = size;
        this.hue = hue;
    }

    update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.018;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
}

/**
 * Bot (Guardian) - AI-controlled entity to prevent empty world
 * Maintains minimum population and teaches new players game mechanics
 */
export class Bot {
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
    trail: { x: number; y: number; life: number }[];

    constructor(x: number, y: number) {
        this.id = 'bot-' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        // Bluish tones to subtly distinguish from players
        this.hue = 180 + Math.random() * 60;
        this.name = 'Guardian';
        this.xp = 100 + Math.random() * 800;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.timer = 0;
        this.actionTimer = 0;
        this.thinkTimer = 0;
        this.trail = [];
    }

    getRandomThought(): string {
        const thoughts = [
            "Do you hear the music?",
            "We drift together...",
            "The light is strong here",
            "I'm waiting for more",
            "Do you see the stars?",
            "Welcome, wanderer",
            "The cosmos breathes",
            "Not alone anymore"
        ];
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
}
