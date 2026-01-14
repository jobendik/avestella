// WebRTC Voice Chat System
import type { Settings } from '../types';

export class VoiceChat {
    enabled: boolean = false;
    localStream: MediaStream | null = null;
    audioContext: AudioContext | null = null;
    analyser: AnalyserNode | null = null;
    peers: Map<string, RTCPeerConnection> = new Map();
    gains: Map<string, GainNode> = new Map();
    isSpeaking: boolean = false;
    isPTTActive: boolean = false;
    vadThreshold: number = 0.02;
    
    constructor(private settings: Settings) {}

    async init(): Promise<boolean> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.localStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);

            // Enable/disable audio based on PTT setting
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !(this.settings as any).ptt;
            });

            this.enabled = true;
            this.startVAD();
            return true;
        } catch (e) {
            console.error('Voice init failed:', e);
            return false;
        }
    }

    startVAD(): void {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const check = () => {
            if (!this.enabled || !this.analyser) return;

            this.analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
            const threshold = this.vadThreshold * (1 + (1 - ((this.settings as any).sensitivity || 0.5)));

            const wasSpeaking = this.isSpeaking;

            if ((this.settings as any).ptt) {
                this.isSpeaking = this.isPTTActive && avg > threshold * 0.5;
            } else if ((this.settings as any).vad !== false) {
                this.isSpeaking = avg > threshold;
            }

            if (this.isSpeaking !== wasSpeaking) {
                this.onSpeakingChange?.(this.isSpeaking);
            }

            this.onVolumeUpdate?.(avg);
            requestAnimationFrame(check);
        };
        check();
    }

    setPTT(active: boolean): void {
        this.isPTTActive = active;
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = active;
            });
        }
    }

    async connectToPeer(peerId: string, db: any, userId: string): Promise<RTCPeerConnection | null> {
        if (!this.enabled || this.peers.has(peerId)) return null;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
        }

        pc.ontrack = (event) => {
            const audio = document.createElement('audio');
            audio.srcObject = event.streams[0];
            audio.autoplay = true;

            if (this.audioContext) {
                const source = this.audioContext.createMediaStreamSource(event.streams[0]);
                const gain = this.audioContext.createGain();
                gain.gain.value = 1;
                source.connect(gain);
                gain.connect(this.audioContext.destination);
                this.gains.set(peerId, gain);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && db && userId) {
                db.collection('artifacts').doc('aura-ultimate-v1').collection('public').doc('data')
                    .collection('signals').add({
                        from: userId,
                        to: peerId,
                        type: 'ice',
                        candidate: event.candidate.toJSON(),
                        t: Date.now()
                    });
            }
        };

        this.peers.set(peerId, pc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (db && userId) {
            db.collection('artifacts').doc('aura-ultimate-v1').collection('public').doc('data')
                .collection('signals').add({
                    from: userId,
                    to: peerId,
                    type: 'offer',
                    sdp: offer.sdp,
                    t: Date.now()
                });
        }

        return pc;
    }

    async handleSignal(signal: any, db: any, userId: string): Promise<void> {
        if (!this.enabled) return;

        const { from, type, sdp, candidate } = signal;

        if (type === 'offer') {
            let pc = this.peers.get(from);
            if (!pc) {
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                if (this.localStream) {
                    this.localStream.getTracks().forEach(track => pc!.addTrack(track, this.localStream!));
                }

                pc.ontrack = (event) => {
                    const audio = document.createElement('audio');
                    audio.srcObject = event.streams[0];
                    audio.autoplay = true;

                    if (this.audioContext) {
                        const source = this.audioContext.createMediaStreamSource(event.streams[0]);
                        const gain = this.audioContext.createGain();
                        source.connect(gain);
                        gain.connect(this.audioContext.destination);
                        this.gains.set(from, gain);
                    }
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate && db && userId) {
                        db.collection('artifacts').doc('aura-ultimate-v1').collection('public').doc('data')
                            .collection('signals').add({
                                from: userId,
                                to: from,
                                type: 'ice',
                                candidate: event.candidate.toJSON(),
                                t: Date.now()
                            });
                    }
                };

                this.peers.set(from, pc);
            }

            await pc.setRemoteDescription({ type: 'offer', sdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (db && userId) {
                db.collection('artifacts').doc('aura-ultimate-v1').collection('public').doc('data')
                    .collection('signals').add({
                        from: userId,
                        to: from,
                        type: 'answer',
                        sdp: answer.sdp,
                        t: Date.now()
                    });
            }
        } else if (type === 'answer') {
            const pc = this.peers.get(from);
            if (pc && pc.signalingState !== 'stable') {
                await pc.setRemoteDescription({ type: 'answer', sdp });
            }
        } else if (type === 'ice' && candidate) {
            const pc = this.peers.get(from);
            if (pc) {
                try {
                    await pc.addIceCandidate(candidate);
                } catch (e) {
                    console.warn('ICE candidate error:', e);
                }
            }
        }
    }

    updateSpatialAudio(peerId: string, distance: number, maxDistance: number): void {
        const gain = this.gains.get(peerId);
        if (!gain || !this.audioContext) return;

        let volume = Math.max(0, 1 - Math.pow(distance / maxDistance, 0.8));
        volume *= this.settings.volume || 0.7;

        gain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
    }

    disconnectPeer(peerId: string): void {
        const pc = this.peers.get(peerId);
        if (pc) {
            pc.close();
            this.peers.delete(peerId);
        }
        this.gains.delete(peerId);
    }

    disable(): void {
        this.enabled = false;
        this.isSpeaking = false;

        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }

        this.peers.forEach(pc => pc.close());
        this.peers.clear();
        this.gains.clear();
    }

    // Event callbacks
    onSpeakingChange?: (speaking: boolean) => void;
    onVolumeUpdate?: (level: number) => void;
}
