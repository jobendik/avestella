<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>VOICES IN THE DARK</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; font-family: 'Courier New', Courier, monospace; }
        canvas { display: block; }
        
        #ui {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 600px;
            text-align: center;
            pointer-events: none; /* Let clicks pass */
        }

        #input-bar {
            background: transparent;
            border: none;
            border-bottom: 2px solid #333;
            color: white;
            font-family: inherit;
            font-size: 1.5rem;
            width: 100%;
            text-align: center;
            padding: 10px;
            outline: none;
            text-shadow: 0 0 10px white;
            pointer-events: auto;
        }
        
        #input-bar::placeholder { color: #444; font-style: italic; }

        #stats {
            position: absolute;
            top: 20px;
            left: 20px;
            color: #444;
            font-size: 0.9rem;
        }
        
        #connection-count {
            color: #fff;
            font-size: 1.2rem;
            text-shadow: 0 0 10px #fff;
        }

        .hint {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #333;
            pointer-events: none;
            transition: opacity 1s;
        }

    </style>
</head>
<body>

    <div id="stats">
        LINKED SOULS: <span id="connection-count">0</span>
    </div>

    <div class="hint" id="start-hint">TYPE TO SEE</div>

    <div id="ui">
        <input type="text" id="input-bar" placeholder="Say something..." autocomplete="off" autofocus>
    </div>

    <canvas id="gameCanvas"></canvas>

<script>
    // --- SETUP ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const input = document.getElementById('input-bar');
    const hint = document.getElementById('start-hint');

    let width, height;
    
    // Game State
    const player = { x: 0, y: 0, vx: 0, vy: 0, radius: 100 };
    let projectiles = []; // Text waves
    let others = []; // Other "players"
    let particles = [];
    let camera = { x: 0, y: 0 };
    let linkedCount = 0;
    
    // Phrases bots say when found
    const BOT_RESPONSES = [
        "Is someone there?",
        "I see you!",
        "Don't leave me.",
        "It's so dark.",
        "Hello?",
        "Wait for me!",
        "I'm scared.",
        "Connection found."
    ];

    // --- INIT ---
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        player.x = width / 2;
        player.y = height / 2;
    }
    window.addEventListener('resize', resize);
    resize();

    // Spawn Bots randomly in a large area
    for (let i = 0; i < 30; i++) {
        spawnBot(i); // FIXED: Pass i here
    }

    function spawnBot(id) { // FIXED: Accept id parameter
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 2000; // Far away
        others.push({
            x: (width/2) + Math.cos(angle) * dist,
            y: (height/2) + Math.sin(angle) * dist,
            linked: false,
            visibleTimer: 0,
            text: "",
            textTimer: 0,
            id: id // FIXED: Use the parameter id
        });
    }

    // --- INPUT ---
    const keys = { w:false, a:false, s:false, d:false, ArrowUp:false, ArrowLeft:false, ArrowDown:false, ArrowRight:false };
    
    window.addEventListener('keydown', e => {
        if(keys.hasOwnProperty(e.key)) keys[e.key] = true;
        if(e.key === 'Enter') fireText();
    });
    
    window.addEventListener('keyup', e => {
        if(keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });

    function fireText() {
        const text = input.value.trim();
        if (!text) return;

        // Determine direction based on movement or random
        let dx = 0, dy = 0;
        if (keys.w || keys.ArrowUp) dy = -1;
        if (keys.s || keys.ArrowDown) dy = 1;
        if (keys.a || keys.ArrowLeft) dx = -1;
        if (keys.d || keys.ArrowRight) dx = 1;
        
        // Default to facing right if standing still
        if (dx === 0 && dy === 0) dy = -1;

        // Normalize
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: dx * 8, // Speed
            vy: dy * 8,
            text: text,
            life: 150, // Frames
            hasHit: false
        });

        input.value = '';
        hint.style.opacity = 0;
        
        // Recoil effect
        player.x -= dx * 5;
        player.y -= dy * 5;
    }

    // --- UPDATE LOOP ---
    function update() {
        // Player Movement
        let dx = 0, dy = 0;
        if (keys.w || keys.ArrowUp) dy = -1;
        if (keys.s || keys.ArrowDown) dy = 1;
        if (keys.a || keys.ArrowLeft) dx = -1;
        if (keys.d || keys.ArrowRight) dx = 1;

        // Normalize speed
        if (dx !== 0 || dy !== 0) {
            const speed = 3;
            const len = Math.sqrt(dx*dx + dy*dy);
            player.x += (dx / len) * speed;
            player.y += (dy / len) * speed;
        }

        // Camera Follow
        camera.x = player.x - width / 2;
        camera.y = player.y - height / 2;

        // Update Projectiles (The Words)
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            // Check Collision with Bots
            if (!p.hasHit) {
                others.forEach(bot => {
                    const dist = Math.hypot(p.x - bot.x, p.y - bot.y);
                    if (dist < 40) {
                        // HIT!
                        p.hasHit = true;
                        p.vx *= 0.1; // Slow down text on impact
                        p.vy *= 0.1;
                        bot.visibleTimer = 200; // Reveal bot
                        spawnParticles(bot.x, bot.y, '#fff');
                        
                        // Bot speaks back
                        if (!bot.linked && Math.random() > 0.5) {
                            bot.text = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
                            bot.textTimer = 180;
                        }
                    }
                });
            }

            if (p.life <= 0) projectiles.splice(i, 1);
        }

        // Update Bots
        let linkRadiusBase = 150; // Base vision
        
        others.forEach(bot => {
            // Logic
            if (bot.linked) {
                // Follow player loosely
                const dx = player.x - bot.x;
                const dy = player.y - bot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Keep a distance
                if (dist > 100) {
                    bot.x += dx * 0.02;
                    bot.y += dy * 0.02;
                }
                
                // Add to player's light power
                linkRadiusBase += 30; 
                bot.visibleTimer = 2; // Always visible
            } 
            else {
                // Check if close enough to LINK
                const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
                if (dist < 60 && bot.visibleTimer > 0) {
                    bot.linked = true;
                    linkedCount++;
                    document.getElementById('connection-count').innerText = linkedCount;
                    bot.text = "I'm with you.";
                    bot.textTimer = 120;
                    spawnParticles(bot.x, bot.y, '#00ff88');
                }
            }
            
            if (bot.visibleTimer > 0) bot.visibleTimer--;
            if (bot.textTimer > 0) bot.textTimer--;
        });
        
        // Smooth radius growth
        player.radius += (linkRadiusBase - player.radius) * 0.05;

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function spawnParticles(x, y, color) {
        for(let i=0; i<10; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                color: color
            });
        }
    }

    // --- RENDER LOOP ---
    function draw() {
        // Clear background to black
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // 1. Draw "Light" (Vision)
        // We use a radial gradient to reveal the floor
        const grad = ctx.createRadialGradient(player.x, player.y, 20, player.x, player.y, player.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Links (Lines between player and linked bots)
        if (linkedCount > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            others.forEach(bot => {
                if(bot.linked) {
                    ctx.moveTo(player.x, player.y);
                    ctx.lineTo(bot.x, bot.y);
                }
            });
            ctx.stroke();
        }

        // 2. Draw Player
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(player.x, player.y, 5, 0, Math.PI*2);
        ctx.fill();

        // 3. Draw Projectiles (Text)
        ctx.font = "20px monospace";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        
        projectiles.forEach(p => {
            // Fade out
            ctx.globalAlpha = Math.min(1, p.life / 50);
            ctx.fillText(p.text, p.x, p.y);
            
            // "Sonar" wave effect around text
            if (p.life % 20 < 2) {
                ctx.strokeStyle = `rgba(255,255,255,${p.life/150})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 30, 0, Math.PI*2);
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;

        // 4. Draw Others (Bots)
        others.forEach(bot => {
            // Only draw if visible (hit by text) or linked
            if (bot.visibleTimer > 0 || bot.linked) {
                // Fade based on timer
                const alpha = bot.linked ? 1 : Math.min(1, bot.visibleTimer / 50);
                
                ctx.fillStyle = bot.linked ? '#00ff88' : '#ff0055'; // Green if friend, Red if unknown
                ctx.globalAlpha = alpha;
                
                // Body
                ctx.beginPath();
                ctx.arc(bot.x, bot.y, 5, 0, Math.PI*2);
                ctx.fill();
                
                // Ring
                ctx.strokeStyle = bot.linked ? '#00ff88' : '#ff0055';
                ctx.beginPath();
                ctx.arc(bot.x, bot.y, 10, 0, Math.PI*2);
                ctx.stroke();
                
                // Text bubble
                if (bot.textTimer > 0) {
                    ctx.fillStyle = "#fff";
                    ctx.fillText(bot.text, bot.x, bot.y - 20);
                }
            }
        });
        ctx.globalAlpha = 1;

        // 5. Particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1;

        ctx.restore();
        
        // Scanlines Overlay
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        for(let i=0; i<height; i+=4) {
            ctx.fillRect(0, i, width, 1);
        }
        
        requestAnimationFrame(draw);
    }

    // Start
    setInterval(update, 1000/60); // Logic at 60fps
    requestAnimationFrame(draw);  // Draw as fast as possible

</script>
</body>
</html>