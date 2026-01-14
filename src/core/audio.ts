import type { RealmId } from '../types';
import { SCALES } from '../core/config';

interface AudioSettings {
    music: boolean;
    volume: number;
}

class AudioManager {
    private ctx: AudioContext | null = null;
    private drone: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;
    private master: GainNode | null = null;
    private settings: AudioSettings;
    private currentRealm: RealmId = 'genesis';

    constructor(settings: AudioSettings) {
        this.settings = settings;
    }

    init(): void {
        if (this.ctx) return;
        
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.settings.volume * 0.5;
        this.master.connect(this.ctx.destination);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0;
        this.droneGain.connect(this.master);

        this.drone = this.ctx.createOscillator();
        this.drone.type = 'sine';
        this.drone.frequency.value = 55;
        this.drone.connect(this.droneGain);
        this.drone.start();

        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.06;
        const lg = this.ctx.createGain();
        lg.gain.value = 1.2;
        lfo.connect(lg);
        lg.connect(this.drone.frequency);
        lfo.start();
    }

    setVolume(v: number): void {
        this.settings.volume = v;
        if (this.master) {
            this.master.gain.value = v * 0.5;
        }
    }

    startDrone(): void {
        if (!this.ctx || !this.settings.music || !this.droneGain) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.droneGain.gain.setTargetAtTime(0.02, this.ctx.currentTime, 2);
    }

    stopDrone(): void {
        if (this.droneGain && this.ctx) {
            this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 1);
        }
    }

    setRealmTone(realm: RealmId): void {
        this.currentRealm = realm;
        const frequencies: Record<RealmId, number> = {
            genesis: 55,
            nebula: 62,
            void: 41,
            starforge: 73,
            sanctuary: 49
        };
        const freq = frequencies[realm] || 55;
        if (this.drone && this.ctx) {
            this.drone.frequency.setTargetAtTime(freq, this.ctx.currentTime, 2);
        }
    }

    playNote(freq: number, vol: number = 0.08, dur: number = 2): void {
        if (!this.ctx || !this.settings.music || !this.master) return;
        
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        
        const t = this.ctx.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * this.settings.volume, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + dur);
    }

    playChord(intensity: number = 1): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        const base = scale[Math.floor(Math.random() * scale.length)];
        const v = 0.035 * intensity;
        
        this.playNote(base, v, 1.5);
        setTimeout(() => this.playNote(base * 1.25, v * 0.75, 1.3), 50);
        setTimeout(() => this.playNote(base * 1.5, v * 0.55, 1.1), 100);
    }

    playSing(_hue: number): void {
        this.playChord(1.1);
    }

    playPulse(): void {
        this.playNote(110, 0.06, 2);
        setTimeout(() => this.playNote(165, 0.05, 1.7), 80);
        setTimeout(() => this.playNote(220, 0.04, 1.3), 160);
    }

    playEcho(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        [0, 2, 4, 5].forEach((n, i) => {
            setTimeout(() => this.playNote(scale[n % scale.length], 0.04, 1.2), i * 130);
        });
    }

    playLevelUp(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        [0, 2, 4, 5, 4, 5, 7].forEach((n, i) => {
            setTimeout(() => this.playNote(scale[n % scale.length], 0.045, 1), i * 80);
        });
    }

    playConn(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        this.playNote(scale[4], 0.03, 0.5);
    }

    playWhisperSend(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        this.playNote(scale[4], 0.035, 0.6);
        setTimeout(() => this.playNote(scale[5], 0.03, 0.4), 60);
    }

    playWhisperRecv(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        this.playNote(scale[2], 0.045, 0.8);
        setTimeout(() => this.playNote(scale[4], 0.035, 0.6), 80);
    }

    playRealmTrans(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        [5, 4, 2, 0, 2, 4, 5].forEach((n, i) => {
            setTimeout(() => this.playNote(scale[n % scale.length], 0.04, 1), i * 70);
        });
    }

    playAchievement(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        [0, 2, 4, 7, 4, 5].forEach((n, i) => {
            setTimeout(() => this.playNote(scale[n % scale.length], 0.05, 0.8), i * 90);
        });
    }

    playQuestComplete(): void {
        const scale = SCALES[this.currentRealm] || SCALES.genesis;
        [4, 5, 7].forEach((n, i) => {
            setTimeout(() => this.playNote(scale[n % scale.length], 0.04, 0.6), i * 100);
        });
    }
}

export { AudioManager };
