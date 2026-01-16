<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>CONSTEL | The Social Sky</title>
    <style>
        :root {
            --bg: #050508;
            --ui-text: #8899aa;
            --accent: #00f0ff;
        }
        body { margin: 0; overflow: hidden; background-color: var(--bg); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        canvas { display: block; }
        
        /* UI Layer */
        #ui-layer {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            padding-bottom: 40px;
        }

        /* Message Input */
        #input-container {
            pointer-events: auto;
            background: rgba(10, 10, 15, 0.8);
            border: 1px solid #334455;
            border-radius: 30px;
            padding: 10px 20px;
            display: flex;
            gap: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            transition: all 0.3s;
            width: 90%;
            max-width: 500px;
        }

        #message-input {
            background: transparent;
            border: none;
            color: white;
            font-size: 1.1rem;
            flex-grow: 1;
            outline: none;
        }

        #send-btn {
            background: var(--accent);
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            color: #000;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Login Screen */
        #login-screen {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--bg);
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 1s;
        }
        
        h1 { color: white; font-weight: 200; letter-spacing: 5px; margin-bottom: 20px; font-size: 3rem; }
        
        #username-input {
            background: transparent;
            border: none;
            border-bottom: 2px solid #333;
            color: white;
            font-size: 2rem;
            text-align: center;
            outline: none;
            width: 300px;
            margin-bottom: 20px;
        }
        
        .start-btn {
            padding: 10px 30px;
            background: transparent;
            color: #555;
            border: 1px solid #333;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: 0.3s;
        }
        .start-btn:hover { color: white; border-color: white; box-shadow: 0 0 15px white; }

        /* HUD */
        #hud {
            position: absolute;
            top: 20px; left: 20px;
            color: var(--ui-text);
            font-size: 0.9rem;
        }
        .hud-val { color: white; font-weight: bold; }

    </style>
</head>
<body>

    <div id="login-screen">
        <h1>CONSTEL</h1>
        <input type="text" id="username-input" placeholder="Who are you?" autocomplete="off">
        <button class="start-btn" id="enter-btn">Ignite</button>
    </div>

    <div id="hud">
        CLUSTER SIZE: <span id="cluster-count" class="hud-val">0</span><br>
        SIGNAL STRENGTH: <span id="signal-val" class="hud-val">100%</span>
    </div>

    <div id="ui-layer">
        <div id="input-container">
            <input type="text" id="message-input" placeholder="Broadcast to the void..." autocomplete="off">
            <button id="send-btn">▲</button>
        </div>
    </div>

    <canvas id="sky"></canvas>

<script>
    /**
     * CONSTEL PROTOTYPE
     * Core Mechanics:
     * 1. Spatial Chat (Text is a projectile)
     * 2. Social Gravity (Interaction pulls nodes closer)
     * 3. Decay (Lack of interaction causes drift)
     */

    const canvas = document.getElementById('sky');
    const ctx = canvas.getContext('2d');
    
    // Config
    const WORLD_SIZE = 4000;
    const VIEW_RADIUS = 300; // How far you can see initially
    const MSG_SPEED = 8;
    
    // State
    let width, height;
    let camera = { x: 0, y: 0, zoom: 1 };
    let player = { x: 0, y: 0, name: "Anon", color: "#ffffff" };
    let nodes = []; // Bots/Friends
    let projectiles = []; // Messages
    let particles = [];
    let isActive = false;

    // --- INITIALIZATION ---
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // Create a universe of latent nodes
    function initWorld() {
        for(let i=0; i<50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 1500; // Scattered far
            nodes.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                vx: (Math.random()-0.5) * 0.5,
                vy: (Math.random()-0.5) * 0.5,
                name: "User_" + Math.floor(Math.random()*999),
                color: `hsl(${Math.random()*360}, 70%, 60%)`,
                bondStrength: 0, // 0 = unconnected, 100 = tight orbit
                lastInteraction: 0,
                msg: null,
                msgTimer: 0,
                id: i
            });
        }
    }

    // --- INPUT HANDLING ---
    document.getElementById('enter-btn').addEventListener('click', startGame);
    document.getElementById('username-input').addEventListener('keydown', (e) => {
        if(e.key === 'Enter') startGame();
    });

    function startGame() {
        const name = document.getElementById('username-input').value.trim();
        if(name) player.name = name;
        
        document.getElementById('login-screen').style.opacity = 0;
        setTimeout(() => document.getElementById('login-screen').remove(), 1000);
        
        initWorld();
        isActive = true;
        loop();
        
        // Focus chat
        document.getElementById('message-input').focus();
    }

    const keys = { w:false, a:false, s:false, d:false, ArrowUp:false, ArrowLeft:false, ArrowDown:false, ArrowRight:false };
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    // Chat
    const chatInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;
        
        // Spawn projectile
        // Direction: based on movement or random
        let dx = 0, dy = 0;
        if(keys.w || keys.ArrowUp) dy = -1;
        if(keys.s || keys.ArrowDown) dy = 1;
        if(keys.a || keys.ArrowLeft) dx = -1;
        if(keys.d || keys.ArrowRight) dx = 1;
        
        if(dx === 0 && dy === 0) {
            // If static, shoot towards nearest node (hinting system) or random
            const nearest = getNearestNode();
            if (nearest) {
                const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            } else {
                dy = -1;
            }
        } else {
            // Normalize
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
        }

        projectiles.push({
            x: player.x,
            y: player.y,
            vx: dx * MSG_SPEED,
            vy: dy * MSG_SPEED,
            text: text,
            life: 200,
            owner: 'player'
        });

        chatInput.value = '';
        
        // Recoil
        player.x -= dx * 5;
        player.y -= dy * 5;
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') sendMessage();
    });

    // --- PHYSICS ENGINE ---

    function getNearestNode() {
        let nearest = null;
        let minDst = Infinity;
        nodes.forEach(n => {
            const d = Math.hypot(n.x - player.x, n.y - player.y);
            if(d < minDst) { minDst = d; nearest = n; }
        });
        return nearest;
    }

    function update() {
        // 1. Player Movement
        const speed = 4;
        if(keys.w || keys.ArrowUp) player.y -= speed;
        if(keys.s || keys.ArrowDown) player.y += speed;
        if(keys.a || keys.ArrowLeft) player.x -= speed;
        if(keys.d || keys.ArrowRight) player.x += speed;

        // Camera Follow
        camera.x += (player.x - width/2 - camera.x) * 0.1;
        camera.y += (player.y - height/2 - camera.y) * 0.1;

        // 2. Projectiles
        for(let i=projectiles.length-1; i>=0; i--) {
            let p = projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Interaction Check
            if (p.owner === 'player') {
                nodes.forEach(n => {
                    const d = Math.hypot(p.x - n.x, p.y - n.y);
                    if(d < 30) {
                        // HIT! Connection made.
                        p.life = 0; // Destroy msg
                        hitNode(n);
                        spawnParticles(n.x, n.y, n.color);
                    }
                });
            }

            if(p.life <= 0) projectiles.splice(i,1);
        }

        // 3. Node Physics (The Gravity System)
        let activeCluster = 0;

        nodes.forEach(n => {
            // A. Decay
            if(n.bondStrength > 0) {
                n.bondStrength -= 0.05; // Slowly drift apart
                activeCluster++;
            }

            // B. Gravity (Pull towards player if bonded)
            if(n.bondStrength > 0) {
                const dx = player.x - n.x;
                const dy = player.y - n.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Attraction force increases with bond strength
                // Target distance: closer if bond is high
                const targetDist = 150; 
                if(dist > targetDist) {
                    const force = (n.bondStrength / 100) * 0.05; // Pull factor
                    n.vx += dx * force * 0.01;
                    n.vy += dy * force * 0.01;
                }
            } else {
                // Drift randomly if unconnected
                n.vx += (Math.random()-0.5) * 0.01;
                n.vy += (Math.random()-0.5) * 0.01;
            }

            // C. Apply Velocity & Friction
            n.x += n.vx;
            n.y += n.vy;
            n.vx *= 0.95;
            n.vy *= 0.95;

            // D. Message Timers
            if(n.msgTimer > 0) n.msgTimer--;
        });

        document.getElementById('cluster-count').innerText = activeCluster;
        
        // 4. Particles
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if(p.life <= 0) particles.splice(i,1);
        });
    }

    function hitNode(node) {
        // Increase bond
        node.bondStrength = Math.min(100, node.bondStrength + 40);
        
        // Bot Response (Simulated)
        if(Math.random() > 0.3) {
            const replies = [
                "I see you!", "Hello there.", "Connecting...", 
                "Signal received.", "Stay close.", "Nice to meet you.",
                "Join the cluster.", "Bright light!"
            ];
            node.msg = replies[Math.floor(Math.random() * replies.length)];
            node.msgTimer = 180;
        }
    }

    function spawnParticles(x, y, color) {
        for(let i=0; i<8; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random()-0.5)*5,
                vy: (Math.random()-0.5)*5,
                color: color,
                life: 1
            });
        }
    }

    // --- RENDER ---
    function draw() {
        // Clear
        ctx.fillStyle = "#050508";
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // 1. Draw Grid (faint, to show movement)
        ctx.strokeStyle = "#1a1a25";
        ctx.lineWidth = 1;
        const gridSize = 100;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        
        ctx.beginPath();
        for(let x = startX; x < startX + width + gridSize; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, startY + height + gridSize);
        }
        for(let y = startY; y < startY + height + gridSize; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + width + gridSize, y);
        }
        ctx.stroke();

        // 2. Draw Bonds (Lines)
        nodes.forEach(n => {
            if(n.bondStrength > 10) {
                ctx.beginPath();
                ctx.moveTo(player.x, player.y);
                ctx.lineTo(n.x, n.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${n.bondStrength/200})`;
                ctx.lineWidth = 1 + (n.bondStrength/20);
                ctx.stroke();
            }
        });

        // 3. Draw Nodes (Bots)
        nodes.forEach(n => {
            // Visibility check
            const dist = Math.hypot(player.x - n.x, player.y - n.y);
            let alpha = 0;
            
            // Visible if close OR bonded
            if (dist < VIEW_RADIUS) alpha = 1 - (dist/VIEW_RADIUS);
            if (n.bondStrength > 0) alpha = Math.max(alpha, n.bondStrength/100);
            
            if (alpha > 0.05) {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = n.color;
                
                // Glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = n.color;
                
                ctx.beginPath();
                ctx.arc(n.x, n.y, 6 + (n.bondStrength/10), 0, Math.PI*2);
                ctx.fill();
                
                ctx.shadowBlur = 0;

                // Name
                ctx.fillStyle = "#fff";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(n.name, n.x, n.y - 15);

                // Message Bubble
                if(n.msgTimer > 0) {
                    ctx.font = "14px sans-serif";
                    const width = ctx.measureText(n.msg).width + 20;
                    ctx.fillStyle = "rgba(255,255,255,0.9)";
                    ctx.fillRect(n.x - width/2, n.y - 45, width, 24);
                    
                    ctx.fillStyle = "#000";
                    ctx.fillText(n.msg, n.x, n.y - 28);
                }
            }
        });
        ctx.globalAlpha = 1;

        // 4. Draw Player
        ctx.shadowBlur = 20;
        ctx.shadowColor = "white";
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "#aaa";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(player.name, player.x, player.y - 20);

        // 5. Draw Projectiles
        ctx.fillStyle = "#fff";
        ctx.font = "16px sans-serif";
        projectiles.forEach(p => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00f0ff";
            ctx.fillText(p.text, p.x, p.y);
            ctx.shadowBlur = 0;
        });

        // 6. Draw Particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1;

        ctx.restore();
        requestAnimationFrame(draw);
    }

    function loop() {
        if(!isActive) return;
        update();
        requestAnimationFrame(loop);
    }
    
    // Start render loop immediately for background
    requestAnimationFrame(draw);

</script>
</body>
</html>