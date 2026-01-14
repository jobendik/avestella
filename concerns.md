QUESTION:
Jeg ønsker å snakke litt om potensielle utforminger med Aura. For det første; skal universet være uendelig eller ha rammer? Det råeste er hvis det er ungen genser, men på den andre siden vil potensielt spillere aldri nå hverandre, usnsettt hvor mange de blir.

ANSWER:
Dette er kanskje det mest fundamentale spørsmålet i utviklingen av et MMO ("Massively Multiplayer Online" spill), spesielt et som Aura som fokuserer på følelsen av ensomhet kontra tilhørighet.

Du har helt rett: Uendelighet er romantisk, men tomt. Hvis kartet er uendelig og spillerne spawner tilfeldig, er sannsynligheten for å møte noen (uten et navigasjonssystem) tilnærmet lik null. Det blir en ensom opplevelse, som motvirker målet om å "koble sammen".

Her er tre konsepter for å løse dette dilemmaet uten å miste følelsen av det store "kosmoset":

Konsept 1: "Leirbålet" (Den Sentraliserte Uendeligheten)
Dette er min favorittløsning for Aura.

Hvordan det fungerer: Universet er teknisk sett uendelig (koordinatene har ingen grenser). Du møter ingen usynlig vegg.

Men: Alle nye spillere "fødes" (spawner) innenfor en radius av sentrum (f.eks. x: -1000 til 1000, y: -1000 til 1000).

Effekten: Det skaper et naturlig sentrum hvor det alltid er liv. Spillere kan velge å reise langt ut i det ukjente (for å være alene eller utforske), men de vet at "varmen" og fellesskapet er i midten.

Visuelt: Jo lenger ut man reiser, jo mørkere og kaldere blir bakgrunnen. Musikken blir mer stille. Dette skaper en underbevisst drift tilbake mot sentrum (mot andre spillere).

Konsept 2: "Sosial Tyngdekraft" (Dynamisk Navigasjon)
Hvis du vil beholde det enorme rommet, må du gi spillerne verktøy for å finne hverandre.

Hjerteslag-kompass: En subtil indikator rundt spilleren din (en svak glød eller pil) som alltid peker mot nærmeste andre spiller eller nærmeste store klynge (konstellasjon).

Ekko: Når noen bruker "Sing"-funksjonen, reiser lyden uendelig langt (eller ekstremt langt), men blir veldig svak. Hvis du er helt alene og hører en svak tone fra nord, vil du instinktivt reise dit.

Konsept 3: "Øy-modellen" (Server Instansing)
Hvis målet er å nå massevis av mennesker, kan ikke én nettleser håndtere 10.000 tegninger samtidig.

Løsning: Universet er delt opp i "galakser" (server rom). Når en galakse når 50 spillere, opprettes en ny.

Følelsen: For spilleren virker det sømløst, men du sikrer at det alltid er "akkurat passe" mange folk rundt deg. Ikke for tomt, ikke for kaotisk.

Anbefaling for koden din akkurat nå
Jeg anbefaler Konsept 1 (Leirbålet) kombinert med en visuell navigasjonshjelp. Det bevarer friheten, men garanterer møter.

Her er hvordan vi kan justere koden for å implementere dette (ingen harde vegger, men en "myk" sentrering):

Sentrert Spawn: Endre spawn-logikken slik at nye spillere alltid dukker opp i nærheten av (0,0) eller i nærheten av en tilfeldig eksisterende spiller.

Navigasjonshjelp: Legg til en indikator som viser vei til sentrum eller nærmeste spiller hvis du er langt unna.

Skal jeg lage en oppdatert fil hvor jeg implementerer "Leirbål-modellen"? Da vil jeg legge til:

En spawn-radius (så folk starter sammen).

En visuell "radar" eller kompass-pil når du er ensom.

En funksjon hvor bakgrunnsstjernene blir færre jo lenger ut i "tomrommet" du reiser.

QUESTION:
Hva med release? Når alt er klart, begynner rekrutteringen/markedsføringen. Bør jeg satse på at det vil komme to, tre eller flere spillere på samme tidspunkt før eller siden, og droppe bots, eller bør jeg ha noen bots som kan «ta imot» de første spillerne?

ANSWER:
Dette er "Dødens dal" for flerspillerspill. Det er det aller vanskeligste hinderet.

Her er min brutale ærlige mening basert på erfaring med lansering av slike prosjekter: Du må ha bots.

Å satse på at 3-4 fremmede logger på i nøyaktig samme sekund på dag 1 er en oppskrift på fiasko. Hvis en spiller logger på, ser et tomt sort univers, og ingenting skjer i løpet av 10 sekunder, lukker de fanen. De kommer aldri tilbake.

Løsningen: "The Alive World Illusion"
Du bør implementere bots, men du trenger ikke "lure" spilleren til å tro at de er ekte mennesker (det kan føles uærlig). I stedet kan du ramme dem inn som en del av universet.

Her er strategien jeg har kodet inn i den oppdaterte versjonen under:

"Voktere" (Bots): Hvis serveren har færre enn 5 spillere, vil spillet automatisk generere "Voktere" (bots).

De oppfører seg som spillere (beveger seg, synger, lager stier).

Dette lærer spilleren hvordan spillet fungerer (å, hvis jeg synger, svarer de!).

Når ekte spillere kommer inn, kan du gradvis fase ut botsene.

Sentralisert Spawn (Leirbålet):

Jeg har endret koden slik at alle alltid spawner innenfor en rimelig radius av sentrum.

Dette garanterer at hvis det er to personer pålogget, vil de finne hverandre raskt.

Navigasjon (Kompasset):

Hvis du beveger deg for langt ut i tomrommet, dukker det opp en diskret pil som peker tilbake mot "Sentrum/Sjelen" av universet. Dette hindrer at folk går seg vill i uendeligheten.

Her er den oppdaterte koden med Smarte Bots, Sentralisert Spawn, og Navigasjonspil:




Her er min brutale ærlige mening basert på erfaring med lansering av slike prosjekter: Du må ha bots.

Å satse på at 3-4 fremmede logger på i nøyaktig samme sekund på dag 1 er en oppskrift på fiasko. Hvis en spiller logger på, ser et tomt sort univers, og ingenting skjer i løpet av 10 sekunder, lukker de fanen. De kommer aldri tilbake.

Løsningen: "The Alive World Illusion"
Du bør implementere bots, men du trenger ikke "lure" spilleren til å tro at de er ekte mennesker (det kan føles uærlig). I stedet kan du ramme dem inn som en del av universet.

Her er strategien jeg har kodet inn i den oppdaterte versjonen under:

"Voktere" (Bots): Hvis serveren har færre enn 5 spillere, vil spillet automatisk generere "Voktere" (bots).

De oppfører seg som spillere (beveger seg, synger, lager stier).

Dette lærer spilleren hvordan spillet fungerer (å, hvis jeg synger, svarer de!).

Når ekte spillere kommer inn, kan du gradvis fase ut botsene.

Sentralisert Spawn (Leirbålet):

Jeg har endret koden slik at alle alltid spawner innenfor en rimelig radius av sentrum.

Dette garanterer at hvis det er to personer pålogget, vil de finne hverandre raskt.

Navigasjon (Kompasset):

Hvis du beveger deg for langt ut i tomrommet, dukker det opp en diskret pil som peker tilbake mot "Sentrum/Sjelen" av universet. Dette hindrer at folk går seg vill i uendeligheten.

Her er den oppdaterte koden med Smarte Bots, Sentralisert Spawn, og Navigasjonspil:

<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AURA: Det Levende Universet</title>
    
    <!-- Firebase Compat Libraries -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;700&family=Space+Mono&display=swap" rel="stylesheet">

    <style>
        :root {
            --bg-color: #030305;
            --ui-color: rgba(255, 255, 255, 0.1);
            --ui-border: rgba(255, 255, 255, 0.15);
            --accent: #ffd700;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        body, html {
            width: 100%; height: 100%;
            background-color: var(--bg-color);
            overflow: hidden;
            font-family: 'Outfit', sans-serif;
            color: white;
            touch-action: none;
            user-select: none;
        }

        #canvas-container {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 1;
        }

        /* UI Layer */
        #ui-layer {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 10;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
        }

        /* Top Bar */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            pointer-events: auto;
        }

        .status-pill {
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
            border: 1px solid var(--ui-border);
            padding: 8px 16px;
            border-radius: 30px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .level-badge {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--accent);
            font-weight: 700;
        }

        .xp-container {
            width: 120px;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 4px;
        }

        .xp-bar {
            height: 100%;
            background: var(--accent);
            width: 0%;
            transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .stats-grid {
            text-align: right;
            font-family: 'Space Mono', monospace;
            font-size: 0.7rem;
            color: rgba(255,255,255,0.6);
            line-height: 1.6;
        }

        .stats-grid b { color: white; }

        /* Center Message Area */
        #center-message {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s;
        }

        #center-message.visible { opacity: 1; }
        
        .big-text {
            font-size: 3rem;
            font-weight: 200;
            letter-spacing: 5px;
            text-shadow: 0 0 30px rgba(255,255,255,0.3);
        }

        /* Bottom Controls */
        .bottom-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            pointer-events: none;
            padding-bottom: 20px;
        }

        .chat-input-container {
            pointer-events: auto;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
            border: 1px solid var(--ui-border);
            border-radius: 30px;
            padding: 5px 20px;
            display: flex;
            align-items: center;
            width: min(400px, 90vw);
            transition: all 0.3s;
        }

        .chat-input-container:focus-within {
            border-color: var(--accent);
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
            transform: translateY(-5px);
        }

        #chat-input {
            background: transparent;
            border: none;
            color: white;
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            width: 100%;
            padding: 10px 0;
            outline: none;
        }

        #chat-input::placeholder { color: rgba(255,255,255,0.3); }

        .actions-row {
            display: flex;
            gap: 15px;
            pointer-events: auto;
        }

        .action-btn {
            width: 50px; height: 50px;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--ui-border);
            backdrop-filter: blur(5px);
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: grid;
            place-items: center;
        }

        .action-btn:hover {
            background: rgba(255,255,255,0.15);
            transform: scale(1.1);
        }

        .action-btn:active { transform: scale(0.9); }

        /* Intro Overlay */
        #intro-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: #030305;
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 1s;
        }

        .logo {
            font-size: 4rem;
            font-weight: 200;
            letter-spacing: 15px;
            margin-bottom: 20px;
            background: linear-gradient(to bottom, #fff, #888);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: rgba(255,255,255,0.5);
            font-size: 1rem;
            max-width: 400px;
            text-align: center;
            line-height: 1.6;
            margin-bottom: 40px;
        }

        .start-btn {
            padding: 15px 40px;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            font-family: 'Space Mono', monospace;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .start-btn:hover {
            background: white;
            color: black;
            box-shadow: 0 0 30px rgba(255,255,255,0.4);
        }

        .hidden { opacity: 0; pointer-events: none; }
    </style>
</head>
<body>

    <!-- Intro -->
    <div id="intro-overlay">
        <div class="logo">AURA</div>
        <div class="subtitle">
            Du er aldri alene i mørket.<br>
            Drift. Resoner. Koble sammen.<br>
            <span style="font-size: 0.8em; opacity: 0.7; margin-top: 10px; display: block;">Bruk hodetelefoner for best opplevelse.</span>
        </div>
        <button class="start-btn" id="btn-start">Gå inn i Universet</button>
    </div>

    <!-- Canvas -->
    <div id="canvas-container">
        <canvas id="game-canvas"></canvas>
    </div>

    <!-- UI -->
    <div id="ui-layer">
        <div class="top-bar">
            <div class="status-pill">
                <div class="level-badge" id="hud-form">Gnist</div>
                <div class="xp-container"><div class="xp-bar" id="hud-xp"></div></div>
            </div>
            <div class="stats-pill">
                <div class="stats-grid">
                    <div>NÆRMESTE <b><span id="hud-nearby">0</span></b></div>
                    <div>STJERNER <b><span id="hud-stars">0</span></b></div>
                </div>
            </div>
        </div>

        <div id="center-message">
            <div class="big-text" id="msg-text">TILKOBLET</div>
        </div>

        <div class="bottom-bar">
            <div class="chat-input-container">
                <input type="text" id="chat-input" placeholder="Hvisk en tanke..." maxlength="60" autocomplete="off">
            </div>
            <div class="actions-row">
                <button class="action-btn" id="btn-sing" title="Syng (Harmoni)">🎵</button>
                <button class="action-btn" id="btn-pulse" title="Puls (Avslør)">✨</button>
                <button class="action-btn" id="btn-orbit" title="Orbit (Stopp)">⚓</button>
            </div>
        </div>
    </div>

    <script>
        /**
         * AURA: Levende Univers
         * Implementerer Bots (Voktere), Sentral Spawn og Navigasjonshjelp.
         */

        // --- KONFIGURASJON ---
        const CONFIG = {
            APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'aura-ethereal-dev',
            FIREBASE_CONFIG: typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null,
            INIT_TOKEN: typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null,
            
            // Balanse
            XP_THRESHOLDS: [0, 100, 300, 600, 1000, 2000, 5000],
            // Norske navn på formene
            FORMS: ['Gnist', 'Skår', 'Prisme', 'Utstråling', 'Nova', 'Himmelsk', 'Eterisk'],
            FRICTION: 0.94,
            VIEW_DISTANCE: 1400,
            
            // Sentralisert Spawn (Leirbål-modellen)
            SPAWN_RADIUS: 800, // Alle starter innenfor denne radiusen av 0,0
            
            // Bot Innstillinger
            MIN_POPULATION: 5, // Fyll opp med bots hvis færre enn dette
            
            // Nettverk
            SYNC_RATE_MS: 1000,
            AFK_TIMEOUT_MS: 60000,
        };

        const SCALE = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00];

        // --- HJELPEFUNKSJONER ---
        const rnd = (min, max) => Math.random() * (max - min) + min;
        const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
        const lerp = (a, b, t) => a + (b - a) * t;
        const hsl = (h, s, l, a=1) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

        // --- LYDMOTOR ---
        class AudioEngine {
            constructor() {
                this.ctx = null;
                this.masterGain = null;
                this.reverbNode = null;
            }

            init() {
                if (this.ctx) return;
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.4;
                this.masterGain.connect(this.ctx.destination);
                this.setupReverb();
                this.startDrone();
            }

            setupReverb() {
                const rate = this.ctx.sampleRate;
                const length = rate * 3;
                const impulse = this.ctx.createBuffer(2, length, rate);
                const left = impulse.getChannelData(0);
                const right = impulse.getChannelData(1);
                for (let i = 0; i < length; i++) {
                    const n = i;
                    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, 2);
                    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, 2);
                }
                this.reverbNode = this.ctx.createConvolver();
                this.reverbNode.buffer = impulse;
                this.reverbNode.connect(this.masterGain);
            }

            startDrone() {
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 55;
                const gain = this.ctx.createGain();
                gain.gain.value = 0.1;
                osc.connect(gain);
                gain.connect(this.reverbNode);
                osc.start();
            }

            playTone(noteIndex, intensity = 0.5, pan = 0) {
                if (!this.ctx || this.ctx.state === 'suspended') this.ctx?.resume();
                const freq = SCALE[noteIndex % SCALE.length] * (Math.floor(noteIndex / SCALE.length) + 1);
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(intensity * 0.3, this.ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
                const panner = this.ctx.createStereoPanner();
                panner.pan.value = Math.max(-1, Math.min(1, pan));
                osc.connect(gain);
                gain.connect(panner);
                panner.connect(this.reverbNode);
                panner.connect(this.masterGain);
                osc.start();
                osc.stop(this.ctx.currentTime + 3);
            }
        }

        // --- SPILL KJERNE ---
        const Game = {
            width: 0, height: 0,
            cam: { x: 0, y: 0, zoom: 1 },
            localPlayer: null,
            otherPlayers: new Map(),
            bots: [], // Array av Bot-objekter
            stars: [],
            thoughts: [],
            particles: [],
            input: { x: 0, y: 0, active: false },
            audio: new AudioEngine(),
            
            init() {
                this.canvas = document.getElementById('game-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.resize();
                window.addEventListener('resize', () => this.resize());
                
                // Input logic
                const handleInput = (x, y, active) => {
                    if (active) {
                        const cx = this.width / 2;
                        const cy = this.height / 2;
                        const angle = Math.atan2(y - cy, x - cx);
                        this.input.x = Math.cos(angle);
                        this.input.y = Math.sin(angle);
                    }
                    this.input.active = active;
                };

                this.canvas.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY, true));
                window.addEventListener('mousemove', e => handleInput(e.clientX, e.clientY, e.buttons === 1));
                window.addEventListener('mouseup', () => this.input.active = false);
                this.canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY, true); }, {passive: false});
                this.canvas.addEventListener('touchmove', e => { e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY, true); }, {passive: false});
                this.canvas.addEventListener('touchend', () => this.input.active = false);

                // Buttons
                document.getElementById('btn-sing').onclick = () => this.localPlayer.action('sing');
                document.getElementById('btn-pulse').onclick = () => this.localPlayer.action('pulse');
                document.getElementById('btn-orbit').onclick = () => this.localPlayer.action('orbit');
                
                const chatInput = document.getElementById('chat-input');
                chatInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && chatInput.value.trim()) {
                        this.localPlayer.speak(chatInput.value.trim());
                        chatInput.value = '';
                        chatInput.blur();
                    }
                });

                this.generateStars();
                this.loop();
            },

            resize() {
                this.width = this.canvas.width = window.innerWidth;
                this.height = this.canvas.height = window.innerHeight;
            },

            generateStars() {
                // Generer stjerner som blir færre jo lenger ut fra sentrum man kommer
                for(let i=0; i<400; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    // Bias mot sentrum: Bruker kvadrat for å samle flere stjerner i midten
                    const r = (Math.random() * Math.random()) * 4000; 
                    this.stars.push({
                        x: Math.cos(angle) * r,
                        y: Math.sin(angle) * r,
                        z: rnd(0.2, 1.5),
                        size: rnd(0.5, 2.5),
                        alpha: rnd(0.3, 0.9)
                    });
                }
            },

            loop() {
                requestAnimationFrame(() => this.loop());
                this.update();
                this.render();
            },

            update() {
                if (!this.localPlayer) return;

                this.localPlayer.update(this.input);
                
                // Kamera følger spiller med smoothing
                this.cam.x = lerp(this.cam.x, this.localPlayer.pos.x, 0.05);
                this.cam.y = lerp(this.cam.y, this.localPlayer.pos.y, 0.05);

                // Oppdater andre spillere
                this.otherPlayers.forEach(p => p.updateInterp());
                
                // Oppdater Bots (Voktere)
                this.manageBots();
                this.bots.forEach(b => b.update());

                // Partikler
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;
                    if (p.life <= 0) this.particles.splice(i, 1);
                }

                // Tanker
                for (let i = this.thoughts.length - 1; i >= 0; i--) {
                    const t = this.thoughts[i];
                    t.y -= 0.3; 
                    t.life -= 0.005;
                    if (t.life <= 0) this.thoughts.splice(i, 1);
                }
            },

            manageBots() {
                // Sjekk om vi trenger bots for å fylle verden
                const totalPop = 1 + this.otherPlayers.size + this.bots.length; // 1 = meg selv
                if (totalPop < CONFIG.MIN_POPULATION) {
                    if (Math.random() < 0.01) { // Ikke spawn alle på en gang
                        const angle = Math.random() * Math.PI * 2;
                        const dist = rnd(200, 1000);
                        this.bots.push(new Bot({
                            x: this.localPlayer.pos.x + Math.cos(angle) * dist,
                            y: this.localPlayer.pos.y + Math.sin(angle) * dist
                        }));
                    }
                } else if (totalPop > CONFIG.MIN_POPULATION && this.bots.length > 0) {
                    // Fjern bots hvis ekte spillere kommer (gradvis)
                    if (Math.random() < 0.005) this.bots.pop();
                }
            },

            render() {
                const ctx = this.ctx;
                
                // Mørkere bakgrunn
                ctx.fillStyle = '#030305';
                ctx.fillRect(0, 0, this.width, this.height);

                ctx.save();
                ctx.translate(this.width / 2, this.height / 2);
                ctx.scale(this.cam.zoom, this.cam.zoom);
                ctx.translate(-this.cam.x, -this.cam.y);

                // 1. Tegn Stjerner (Parallakse)
                this.stars.forEach(s => {
                    // Enkel culling
                    const screenX = (s.x - this.cam.x) * s.z + this.cam.x;
                    const screenY = (s.y - this.cam.y) * s.z + this.cam.y;
                    
                    if (Math.abs(screenX - this.cam.x) > this.width && Math.abs(screenY - this.cam.y) > this.height) return;

                    const parallaxX = s.x - (this.cam.x * (1 - s.z));
                    const parallaxY = s.y - (this.cam.y * (1 - s.z));

                    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
                    ctx.beginPath();
                    ctx.arc(parallaxX, parallaxY, s.size * s.z, 0, Math.PI * 2);
                    ctx.fill();
                });

                // 2. Tegn Koblinger
                this.drawConnections(ctx);

                // 3. Tegn Entiteter
                this.bots.forEach(b => b.draw(ctx));
                this.otherPlayers.forEach(p => p.draw(ctx));
                if (this.localPlayer) this.localPlayer.draw(ctx);

                // 4. Partikler & Tanker
                this.particles.forEach(p => {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = p.color || `rgba(255, 255, 255, ${p.life})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                });

                ctx.font = '16px "Outfit"';
                ctx.textAlign = 'center';
                this.thoughts.forEach(t => {
                    ctx.fillStyle = `rgba(255, 255, 255, ${t.life})`;
                    ctx.fillText(t.text, t.x, t.y);
                });

                ctx.restore();

                // 5. NAVIGASJONSPIL (Overlay UI)
                this.drawCompass(ctx);
            },

            drawConnections(ctx) {
                const nodes = [this.localPlayer, ...this.otherPlayers.values(), ...this.bots];
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const a = nodes[i];
                        const b = nodes[j];
                        if (!a || !b) continue;
                        const d = dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
                        if (d < 350) {
                            const alpha = (1 - d / 350) * 0.4;
                            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
                            ctx.lineWidth = 1 + alpha * 2;
                            ctx.beginPath();
                            ctx.moveTo(a.pos.x, a.pos.y);
                            ctx.lineTo(b.pos.x, b.pos.y);
                            ctx.stroke();
                        }
                    }
                }
            },

            drawCompass(ctx) {
                if (!this.localPlayer) return;
                const dToCenter = dist(0, 0, this.localPlayer.pos.x, this.localPlayer.pos.y);
                
                // Vis kompass hvis langt fra sentrum (> 2000 enheter)
                if (dToCenter > 2000) {
                    const angle = Math.atan2(-this.localPlayer.pos.y, -this.localPlayer.pos.x);
                    const cx = this.width / 2;
                    const cy = this.height / 2;
                    const radius = 100;
                    
                    const arrowX = cx + Math.cos(angle) * radius;
                    const arrowY = cy + Math.sin(angle) * radius;

                    ctx.save();
                    ctx.translate(arrowX, arrowY);
                    ctx.rotate(angle);
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, (dToCenter - 2000) / 1000)})`;
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(-10, 5);
                    ctx.lineTo(-10, -5);
                    ctx.fill();
                    ctx.restore();

                    // Avstandstekst
                    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
                    ctx.font = '10px "Space Mono"';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.round(dToCenter)} til Kjernen`, arrowX, arrowY + 20);
                }
            }
        };

        // --- ENTITETER ---
        
        class Player {
            constructor(id, isLocal = false, data = {}) {
                this.id = id;
                this.isLocal = isLocal;
                
                // Leirbål-Spawn: Start nær (0,0) hvis ny
                if (isLocal && !data.x) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * CONFIG.SPAWN_RADIUS;
                    this.pos = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
                } else {
                    this.pos = { x: data.x || 0, y: data.y || 0 };
                }
                
                this.vel = { x: 0, y: 0 };
                this.targetPos = { x: this.pos.x, y: this.pos.y };
                this.hue = data.hue || Math.floor(Math.random() * 360);
                this.xp = data.xp || 0;
                this.name = data.name || "Vandrer";
                this.trail = [];
            }

            get level() { return CONFIG.XP_THRESHOLDS.findIndex(t => this.xp < t) || CONFIG.XP_THRESHOLDS.length; }
            get form() { return CONFIG.FORMS[Math.min(this.level - 1, CONFIG.FORMS.length - 1)]; }
            get size() { return 10 + (this.level * 2); }

            update(input) {
                if (input && input.active) {
                    this.vel.x += input.x * 0.5;
                    this.vel.y += input.y * 0.5;
                }
                this.vel.x *= CONFIG.FRICTION;
                this.vel.y *= CONFIG.FRICTION;
                this.pos.x += this.vel.x;
                this.pos.y += this.vel.y;

                // Trail
                if (Math.random() < 0.3 && (Math.abs(this.vel.x) > 0.1 || Math.abs(this.vel.y) > 0.1)) {
                    this.trail.push({ x: this.pos.x, y: this.pos.y, life: 1.0 });
                }
                for (let i = this.trail.length - 1; i >= 0; i--) {
                    this.trail[i].life -= 0.02;
                    if (this.trail[i].life <= 0) this.trail.shift();
                }

                if (this.isLocal) {
                    const now = Date.now();
                    if (now - (this.lastUpdate || 0) > CONFIG.SYNC_RATE_MS || (input.active && now - (this.lastUpdate || 0) > 200)) {
                        Network.sendUpdate(this);
                        this.lastUpdate = now;
                    }
                }
            }

            updateInterp() {
                this.pos.x = lerp(this.pos.x, this.targetPos.x, 0.1);
                this.pos.y = lerp(this.pos.y, this.targetPos.y, 0.1);
            }

            draw(ctx) {
                // Trail
                if (this.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(this.trail[0].x, this.trail[0].y);
                    for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
                    ctx.strokeStyle = hsl(this.hue, 70, 50, 0.3);
                    ctx.lineWidth = this.size * 0.5;
                    ctx.stroke();
                }
                
                // Kropp
                ctx.save();
                ctx.translate(this.pos.x, this.pos.y);
                ctx.rotate(Date.now() * 0.001 + this.hue);
                ctx.fillStyle = 'white';
                ctx.shadowColor = hsl(this.hue, 100, 50);
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                const s = this.size;
                const formIdx = this.level - 1;
                
                if (formIdx === 0) ctx.arc(0, 0, s, 0, Math.PI * 2);
                else if (formIdx === 1) { ctx.moveTo(0, -s); ctx.lineTo(s, s); ctx.lineTo(-s, s); }
                else {
                    const sides = 4 + (formIdx - 2);
                    for (let i = 0; i < sides; i++) {
                        const ang = (Math.PI * 2 / sides) * i;
                        if (i===0) ctx.moveTo(Math.cos(ang)*s, Math.sin(ang)*s);
                        else ctx.lineTo(Math.cos(ang)*s, Math.sin(ang)*s);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Navn
                if (!this.isLocal) {
                    ctx.rotate(-(Date.now() * 0.001 + this.hue));
                    ctx.shadowBlur = 0;
                    ctx.font = '12px "Space Mono"';
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.fillText(this.name, 0, s + 15);
                }
                ctx.restore();
            }

            action(type) {
                if (type === 'sing') {
                    const note = Math.floor((this.hue / 360) * SCALE.length);
                    Game.audio.playTone(note, 0.8, 0);
                    this.spawnShockwave(hsl(this.hue, 80, 60));
                    if (this.isLocal) Network.broadcastEvent('sing', { note, x: Math.round(this.pos.x), y: Math.round(this.pos.y) });
                    this.gainXP(5);
                } else if (type === 'pulse') {
                    this.spawnShockwave('white');
                    if (this.isLocal) Network.broadcastEvent('pulse', { x: Math.round(this.pos.x), y: Math.round(this.pos.y) });
                    this.gainXP(2);
                }
            }

            spawnShockwave(color) {
                for(let i=0; i<15; i++) {
                    const a = (Math.PI*2/15)*i;
                    Game.particles.push({
                        x: this.pos.x, y: this.pos.y,
                        vx: Math.cos(a)*4, vy: Math.sin(a)*4,
                        life: 1, decay: 0.04, size: 2, color: color
                    });
                }
            }

            speak(text) {
                Game.thoughts.push({ text, x: this.pos.x, y: this.pos.y - 40, life: 1.5 });
                if (this.isLocal) Network.broadcastEvent('speak', { text, x: Math.round(this.pos.x), y: Math.round(this.pos.y) });
            }

            gainXP(amount) {
                const oldLvl = this.level;
                this.xp += amount;
                if (this.level > oldLvl) {
                    document.getElementById('hud-form').innerText = this.form;
                    this.spawnShockwave('#ffd700');
                }
                const t1 = CONFIG.XP_THRESHOLDS[this.level-1], t2 = CONFIG.XP_THRESHOLDS[this.level] || t1*2;
                document.getElementById('hud-xp').style.width = `${((this.xp-t1)/(t2-t1))*100}%`;
            }
        }

        // --- BOT AI (VOKTERE) ---
        class Bot extends Player {
            constructor(data) {
                super('bot-'+Math.random(), false, data);
                this.name = "Vokter";
                this.hue = rnd(180, 240); // Blålige toner for å skille dem litt
                this.xp = rnd(100, 900);
                this.timer = 0;
                this.moveAngle = Math.random() * Math.PI * 2;
            }

            update() {
                // Enkel AI
                this.timer++;
                
                // Endre retning mykt
                if (Math.random() < 0.02) this.moveAngle += rnd(-1, 1);
                
                // Sosial Tyngdekraft: Hvis spiller er nær, trekk mot dem
                if (Game.localPlayer) {
                    const d = dist(this.pos.x, this.pos.y, Game.localPlayer.pos.x, Game.localPlayer.pos.y);
                    if (d < 400 && d > 100) {
                        const angleToPlayer = Math.atan2(Game.localPlayer.pos.y - this.pos.y, Game.localPlayer.pos.x - this.pos.x);
                        this.moveAngle = lerp(this.moveAngle, angleToPlayer, 0.05);
                    }
                }

                // Hold seg nær sentrum (Leirbålet)
                const distCenter = dist(0,0, this.pos.x, this.pos.y);
                if (distCenter > CONFIG.SPAWN_RADIUS * 1.5) {
                    const angleToCenter = Math.atan2(-this.pos.y, -this.pos.x);
                    this.moveAngle = lerp(this.moveAngle, angleToCenter, 0.1);
                }

                this.vel.x += Math.cos(this.moveAngle) * 0.2;
                this.vel.y += Math.sin(this.moveAngle) * 0.2;
                
                super.update({ active: false }); // Kjører fysikk oppdatering

                // Handlinger
                if (Math.random() < 0.005) this.action('sing');
                if (Math.random() < 0.002) this.speak(this.getRandomThought());
            }

            getRandomThought() {
                const thoughts = ["Hører du musikken?", "Vi driver sammen...", "Lyset er sterkt her", "Jeg venter på flere", "Ser du stjernene?"];
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            }
        }

        // --- NETTVERK ---
        const Network = {
            db: null, user: null,
            init() {
                if (!CONFIG.FIREBASE_CONFIG) { this.startOffline(); return; }
                try {
                    firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
                    const auth = firebase.auth();
                    this.db = firebase.firestore();
                    (CONFIG.INIT_TOKEN ? auth.signInWithCustomToken(CONFIG.INIT_TOKEN) : auth.signInAnonymously())
                        .then(() => auth.onAuthStateChanged(u => { if(u) { this.user = u; this.setupListeners(); } }));
                } catch(e) { this.startOffline(); }
            },
            setupListeners() {
                Game.localPlayer = new Player(this.user.uid, true, { name: 'Deg' });
                const ref = this.db.collection('artifacts').doc(CONFIG.APP_ID).collection('public').doc('data');
                
                ref.collection('players').onSnapshot(snap => {
                    snap.docChanges().forEach(c => {
                        if (c.doc.id === this.user.uid) return;
                        if (c.type === 'removed') Game.otherPlayers.delete(c.doc.id);
                        else {
                            const d = c.doc.data();
                            if (Date.now() - d.t > CONFIG.AFK_TIMEOUT_MS) return;
                            let p = Game.otherPlayers.get(c.doc.id);
                            if (!p) { p = new Player(c.doc.id, false, d); Game.otherPlayers.set(c.doc.id, p); }
                            p.targetPos = { x: d.x, y: d.y }; p.xp = d.xp || p.xp;
                        }
                    });
                    document.getElementById('hud-nearby').innerText = Game.otherPlayers.size + Game.bots.length;
                });

                ref.collection('events').orderBy('t', 'desc').limit(5).onSnapshot(snap => {
                    snap.docChanges().forEach(c => {
                        if (c.type === 'added') {
                            const d = c.doc.data();
                            if (Date.now() - d.t > 5000 || d.uid === this.user.uid) return;
                            const distToLocal = dist(d.x, d.y, Game.localPlayer.pos.x, Game.localPlayer.pos.y);
                            const vol = Math.max(0, 1 - distToLocal / CONFIG.VIEW_DISTANCE);
                            if (vol > 0) {
                                if (d.type === 'sing') { Game.audio.playTone(d.note, vol); new Player(null).spawnShockwave.call({pos:{x:d.x, y:d.y}}, 'cyan'); }
                                else if (d.type === 'speak') Game.thoughts.push({text:d.text, x:d.x, y:d.y-40, life:1.5});
                                else if (d.type === 'pulse') new Player(null).spawnShockwave.call({pos:{x:d.x, y:d.y}}, 'white');
                            }
                        }
                    });
                });
            },
            sendUpdate(p) {
                if(!this.db) return;
                this.db.collection('artifacts').doc(CONFIG.APP_ID).collection('public').doc('data').collection('players').doc(this.user.uid)
                    .set({ x: Math.round(p.pos.x), y: Math.round(p.pos.y), hue: p.hue, xp: p.xp, name: p.name, t: Date.now() });
            },
            broadcastEvent(type, payload) {
                if(!this.db) return;
                this.db.collection('artifacts').doc(CONFIG.APP_ID).collection('public').doc('data').collection('events')
                    .add({ type, uid: this.user.uid, t: Date.now(), ...payload });
            },
            startOffline() {
                Game.localPlayer = new Player('local', true);
                document.getElementById('msg-text').innerText = "OFFLINE MODUS";
            }
        };

        // --- START ---
        document.getElementById('btn-start').onclick = () => {
            document.getElementById('intro-overlay').style.opacity = 0;
            setTimeout(() => document.getElementById('intro-overlay').remove(), 1000);
            Game.init(); Game.audio.init(); Network.init();
        };

    </script>
</body>
</html>

Endringer i denne versjonen for "Release":
Voktere (Bots): Jeg har lagt til en manageBots()-funksjon og en Bot-klasse.

Logikken sjekker: Er det færre enn 5 spillere her?

Hvis ja: Det spawnes gradvis "Voktere".

Vokterne har en enkel AI som gjør at de trekkes litt mot deg hvis du er i nærheten (sosial gravitasjon), men ellers vandrer de rundt. De kan også synge og si korte setninger for å vise at verdenen lever.

Leirbål-Spawn: Alle nye spillere starter nå innenfor en radius på 800 enheter fra sentrum. Dette betyr at sannsynligheten for å møtes er høy.

Kompasset: Hvis du reiser mer enn 2000 enheter vekk fra sentrum, dukker det opp en pil og en avstandsmåler som viser vei tilbake til "Kjernen". Dette gjør det trygt å utforske, fordi du alltid finner veien hjem.

Lykke til med Aura! Dette rammeverket gir deg en mye tryggere lansering.