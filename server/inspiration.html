<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>The Echo Garden</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            background-color: #020205; 
            font-family: 'Georgia', serif; /* Serif for emotional weight */
            color: white;
            cursor: crosshair;
        }

        /* The Canvas */
        canvas { display: block; }

        /* UI Overlay */
        #ui {
            position: absolute;
            top: 20px;
            left: 20px;
            pointer-events: none;
            opacity: 0.7;
        }
        h1 {
            font-weight: normal;
            font-style: italic;
            letter-spacing: 2px;
            margin: 0;
            font-size: 1.5rem;
            text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        p {
            font-size: 0.8rem;
            color: #889;
            margin-top: 5px;
        }

        /* Input Modal */
        #input-modal {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 10, 15, 0.95);
            border: 1px solid #333;
            padding: 30px;
            border-radius: 4px;
            display: none;
            text-align: center;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            z-index: 100;
            min-width: 300px;
        }
        
        input[type="text"] {
            background: transparent;
            border: none;
            border-bottom: 1px solid #555;
            color: white;
            font-family: 'Georgia', serif;
            font-size: 1.2rem;
            width: 100%;
            padding: 10px;
            outline: none;
            text-align: center;
            margin-bottom: 20px;
        }
        
        button {
            background: transparent;
            border: 1px solid #555;
            color: #aaa;
            padding: 8px 20px;
            font-family: sans-serif;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        button:hover {
            border-color: #fff;
            color: #fff;
            box-shadow: 0 0 10px rgba(255,255,255,0.2);
        }

        /* Tooltip for reading messages */
        #tooltip {
            position: absolute;
            pointer-events: none;
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,1);
            max-width: 250px;
            text-align: center;
            transition: opacity 0.3s;
            opacity: 0;
            font-style: italic;
            z-index: 10;
        }
        
        .author-tag {
            display: block;
            font-size: 0.6rem;
            color: #556;
            margin-top: 5px;
            font-family: sans-serif;
            font-style: normal;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        #fader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: black;
            pointer-events: none;
            animation: fadeIn 3s forwards;
            z-index: 999;
        }
        
        @keyframes fadeIn { to { opacity: 0; } }

    </style>
</head>
<body>

    <div id="fader"></div>

    <div id="ui">
        <h1>the echo garden</h1>
        <p>Double-click to leave a thought.<br>Click a star to ignite it.</p>
    </div>

    <div id="tooltip"></div>

    <div id="input-modal">
        <input type="text" id="message-input" placeholder="What is on your mind?" maxlength="60" autocomplete="off">
        <br>
        <button id="send-btn">Whisper to the Void</button>
        <button id="cancel-btn" style="border: none; font-size: 0.7rem;">Cancel</button>
    </div>

    <canvas id="garden"></canvas>

<script>
    /**
     * THE ECHO GARDEN
     * A prototype focusing on "Legacy" and "Atmosphere".
     */

    // --- CONFIG ---
    const MOCK_MESSAGES = [
        "I still think about you.",
        "The coffee was good today.",
        "Is this all there is?",
        "I'm finally happy.",
        "Forgive yourself.",
        "It's quiet uptown.",
        "I saw a cat today.",
        "Coding is poetry.",
        "Don't forget to breathe.",
        "I wish I had said sorry.",
        "Space is cold, but beautiful.",
        "404: Sleep not found.",
        "Just keep swimming.",
        "I love the rain.",
        "Do they know?",
        "Everything is temporary.",
        "You are enough.",
        "Static in my head.",
        "Looking for a sign.",
        "Hello, world."
    ];

    // --- SETUP ---
    const canvas = document.getElementById('garden');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');
    const modal = document.getElementById('input-modal');
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    let width, height;
    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let stars = [];
    let backgroundStars = [];
    
    // Time
    let time = 0;

    // --- AUDIO SYSTEM (Web Audio API) ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Keep it subtle
    masterGain.connect(audioCtx.destination);
    
    // Reverb buffer (Simulated Impulse)
    const convolver = audioCtx.createConvolver();
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.8;
    
    // Create simple noise buffer for reverb
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const nowBuff = buffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
            nowBuff[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
    }
    convolver.buffer = buffer;
    convolver.connect(masterGain);

    function playTone(freq, type = 'sine', duration = 2) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Envelope
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); // Release

        osc.connect(gain);
        gain.connect(convolver); // Send to reverb
        gain.connect(masterGain); // Send to dry output
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }
    
    // Ambient drone logic
    setInterval(() => {
        if (Math.random() > 0.7) {
            const freq = 100 + Math.random() * 200;
            playTone(freq, 'triangle', 4);
        }
    }, 3000);

    // --- ENTITIES ---

    class Star {
        constructor(x, y, text, isNew = false) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.birthTime = time;
            this.ignited = 0; // "Likes"
            this.radius = Math.random() * 2 + 1;
            this.phase = Math.random() * Math.PI * 2;
            
            // For animation
            this.currentRadius = isNew ? 0 : this.radius;
            this.targetRadius = this.radius;
        }

        draw(ctx, viewX, viewY) {
            // Pulse effect
            const pulse = Math.sin(time * 2 + this.phase) * 0.5 + 1;
            let r = this.currentRadius + (this.ignited * 2); // Grow if ignited
            
            // Draw Glow
            const screenX = this.x - viewX;
            const screenY = this.y - viewY;

            // Frustum culling (simple)
            if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) return;

            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r * 4 * pulse);
            gradient.addColorStop(0, `rgba(200, 220, 255, ${0.8 + (this.ignited * 0.1)})`);
            gradient.addColorStop(0.4, `rgba(100, 150, 255, ${0.2 + (this.ignited * 0.05)})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r * 4 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ignite() {
            this.ignited += 1;
            playTone(400 + (this.ignited * 50), 'sine', 1.5); // Higher pitch for more popular stars
            
            // Visual feedback
            this.currentRadius += 5; // Pop effect
        }
    }

    // --- INIT ---

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    window.addEventListener('resize', resize);
    resize();

    function init() {
        // Generate background static stars
        for(let i=0; i<200; i++) {
            backgroundStars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5,
                alpha: Math.random()
            });
        }

        // Generate fake echoes around the center
        for(let i=0; i<40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 800; // Scatter
            const x = width/2 + Math.cos(angle) * dist;
            const y = height/2 + Math.sin(angle) * dist;
            const txt = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
            stars.push(new Star(x, y, txt));
        }
        
        // Center camera roughly
        camera.x = 0;
        camera.y = 0;
        
        loop();
    }

    // --- INPUT HANDLING ---

    // Panning
    window.addEventListener('mousedown', e => {
        if(e.target !== canvas) return;
        isDragging = true;
        dragStart.x = e.clientX + camera.x;
        dragStart.y = e.clientY + camera.y;
    });

    window.addEventListener('mousemove', e => {
        if (isDragging) {
            camera.x = dragStart.x - e.clientX;
            camera.y = dragStart.y - e.clientY;
            tooltip.style.opacity = 0; // Hide text while moving
        } else {
            handleHover(e.clientX, e.clientY);
        }
    });

    window.addEventListener('mouseup', () => isDragging = false);

    // Planting (Double Click)
    window.addEventListener('dblclick', e => {
        if(e.target !== canvas) return;
        
        // Store click location in world space
        modal.dataset.x = e.clientX + camera.x;
        modal.dataset.y = e.clientY + camera.y;
        
        openModal();
    });

    // Clicking a Star (Ignite)
    window.addEventListener('click', e => {
        if (isDragging || e.target !== canvas) return;
        
        const worldX = e.clientX + camera.x;
        const worldY = e.clientY + camera.y;
        
        // Find clicked star
        // Sort by distance to find closest
        let closest = null;
        let minDst = 20; // Hit radius

        for(let s of stars) {
            const dx = s.x - worldX;
            const dy = s.y - worldY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDst) {
                closest = s;
                minDst = dist;
            }
        }

        if (closest) {
            closest.ignite();
        }
    });

    // Hover logic
    function handleHover(mx, my) {
        const worldX = mx + camera.x;
        const worldY = my + camera.y;
        
        let hovered = null;
        let minDst = 30; // Hover radius

        for(let s of stars) {
            const dx = s.x - worldX;
            const dy = s.y - worldY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDst) {
                hovered = s;
                minDst = dist;
            }
        }

        if (hovered) {
            // Position tooltip near the star, not the mouse
            const screenX = hovered.x - camera.x;
            const screenY = hovered.y - camera.y;
            
            tooltip.innerHTML = `"${hovered.text}"<span class="author-tag">Echo #${Math.floor(Math.random()*9000)+1000}</span>`;
            tooltip.style.left = (screenX + 15) + 'px';
            tooltip.style.top = (screenY + 15) + 'px';
            tooltip.style.opacity = 1;
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.style.opacity = 0;
            canvas.style.cursor = 'crosshair';
        }
    }

    // Modal Logic
    function openModal() {
        modal.style.display = 'block';
        input.value = '';
        input.focus();
        // Pause interaction
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            const x = parseFloat(modal.dataset.x);
            const y = parseFloat(modal.dataset.y);
            
            const newStar = new Star(x, y, text, true);
            stars.push(newStar);
            
            playTone(600, 'sine', 3); // Special birth sound
        }
        closeModal();
    });
    
    cancelBtn.addEventListener('click', closeModal);
    
    // Enter key to submit
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') sendBtn.click();
    });


    // --- RENDER LOOP ---

    function loop() {
        requestAnimationFrame(loop);
        time += 0.01;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(1, '#101025');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw Background Stars (Parallax)
        ctx.fillStyle = '#ffffff';
        backgroundStars.forEach(s => {
            // Wrap around logic for infinite feel
            // We use modulo with the camera position to make them tile
            let px = (s.x - camera.x * 0.1) % width;
            let py = (s.y - camera.y * 0.1) % height;
            
            if (px < 0) px += width;
            if (py < 0) py += height;

            ctx.globalAlpha = s.alpha * (Math.sin(time + s.x) * 0.5 + 0.5); // Twinkle
            ctx.beginPath();
            ctx.arc(px, py, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Message Stars
        stars.forEach(s => {
            // Animation smoothing
            if (s.currentRadius < s.radius) s.currentRadius += 0.1;
            if (s.currentRadius > s.radius) s.currentRadius -= 0.1; // Shrink back after ignite
            
            s.draw(ctx, camera.x, camera.y);
        });

        // Debug center cross (optional, good for knowing where you are)
        // ctx.fillStyle = 'red';
        // ctx.fillRect(width/2 - 2, height/2 - 2, 4, 4);
    }

    init();

</script>
</body>
</html>