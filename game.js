const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game state
let gameState = 'playing'; // 'playing', 'gameOver', 'victory'
let level = 1;
let lives = 3;
let energy = 100;
let gameTime = 0;
let lastTime = Date.now();

// Enhanced ball with more properties
let ball = {
  x: 80, y: 80,
  vx: 0, vy: 0,
  radius: 14,
  color: "#e0e0e0",
  trail: [],
  magnetized: false,
  invulnerable: 0,
  metallic: true,
  charge: 0
};

// Enhanced stars with power-ups
let stars = [
  { x: 300, y: 150, collected: false, type: 'speed', color: '#ffff00' },
  { x: 500, y: 300, collected: false, type: 'shield', color: '#00ffff' },
  { x: 700, y: 200, collected: false, type: 'energy', color: '#ff00ff' },
  { x: 400, y: 450, collected: false, type: 'magnet', color: '#ff8800' },
  { x: 600, y: 100, collected: false, type: 'normal', color: '#ffff00' }
];

let goal = { x: 750, y: 450, radius: 25, pulse: 0 };

// Enhanced walls with different types
let walls = [
  { x: 200, y: 100, w: 300, h: 20, type: 'normal' },
  { x: 200, y: 200, w: 20, h: 200, type: 'normal' },
  { x: 300, y: 300, w: 200, h: 20, type: 'normal' },
  { x: 550, y: 150, w: 20, h: 200, type: 'normal' },
  { x: 100, y: 350, w: 150, h: 20, type: 'magnetic' },
  { x: 650, y: 300, w: 20, h: 100, type: 'repulsive' }
];

// Deadly spikes
let spikes = [
  { x: 400, y: 250, radius: 15, damage: 1 },
  { x: 350, y: 400, radius: 15, damage: 1 },
  { x: 600, y: 350, radius: 15, damage: 1 }
];

// Moving obstacles
let movingObstacles = [
  { x: 450, y: 180, vx: 2, vy: 0, w: 80, h: 15, range: 100, startX: 450 }
];

// Particle systems
let particles = [];
let sparks = [];
let energyOrbs = [];

// Mouse/touch control
let mouse = { x: 0, y: 0, active: false, magnetStrength: 1 };
let collectedCount = 0;

// Power-ups
let powerUps = {
  speedBoost: 0,
  shield: 0,
  energyBoost: false,
  superMagnet: 0
};

// Event listeners
document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchend", handleTouchEnd);
document.addEventListener("touchmove", handleTouchMove);

function handleMouseDown(e) {
  if (gameState !== 'playing') return;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
  activateMagnet();
}

function handleMouseUp() {
  mouse.active = false;
}

function handleMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function handleTouchStart(e) {
  e.preventDefault();
  if (gameState !== 'playing') return;
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
  mouse.active = true;
  activateMagnet();
}

function handleTouchEnd(e) {
  e.preventDefault();
  mouse.active = false;
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
}

function activateMagnet() {
  if (energy <= 0) return;
  
  // Create energy orbs around mouse
  for (let i = 0; i < 8; i++) {
    energyOrbs.push({
      x: mouse.x + Math.cos(i * Math.PI / 4) * 30,
      y: mouse.y + Math.sin(i * Math.PI / 4) * 30,
      angle: i * Math.PI / 4,
      life: 20,
      radius: 3
    });
  }
}

function updateGameTime() {
  const now = Date.now();
  if (gameState === 'playing') {
    gameTime += (now - lastTime) / 1000;
    document.getElementById('time').textContent = Math.floor(gameTime);
  }
  lastTime = now;
}

function drawBall() {
  // Ball trail
  ctx.strokeStyle = "rgba(224, 224, 224, 0.3)";
  ctx.lineWidth = ball.radius / 2;
  ctx.beginPath();
  for (let i = 1; i < ball.trail.length; i++) {
    const alpha = i / ball.trail.length;
    ctx.globalAlpha = alpha * 0.5;
    ctx.moveTo(ball.trail[i-1].x, ball.trail[i-1].y);
    ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Ball glow effect
  if (ball.invulnerable > 0) {
    const glowRadius = ball.radius + 10 + Math.sin(Date.now() / 100) * 5;
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, glowRadius);
    gradient.addColorStop(0, "rgba(0, 255, 255, 0.6)");
    gradient.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main ball
  const gradient = ctx.createRadialGradient(
    ball.x - ball.radius/3, ball.y - ball.radius/3, 0,
    ball.x, ball.y, ball.radius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.3, ball.color);
  gradient.addColorStop(1, "#666666");
  
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Metallic rim
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Magnetic field visualization when charged
  if (ball.charge > 0) {
    ctx.strokeStyle = `rgba(0, 255, 255, ${ball.charge})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (Date.now() / 500 + i * Math.PI / 3) % (Math.PI * 2);
      const x1 = ball.x + Math.cos(angle) * (ball.radius + 5);
      const y1 = ball.y + Math.sin(angle) * (ball.radius + 5);
      const x2 = ball.x + Math.cos(angle) * (ball.radius + 15);
      const y2 = ball.y + Math.sin(angle) * (ball.radius + 15);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

function drawGoal() {
  goal.pulse += 0.1;
  const pulseRadius = goal.radius + Math.sin(goal.pulse) * 5;
  
  // Goal glow
  const gradient = ctx.createRadialGradient(goal.x, goal.y, 0, goal.x, goal.y, pulseRadius + 20);
  gradient.addColorStop(0, "rgba(0, 255, 0, 0.8)");
  gradient.addColorStop(0.5, "rgba(0, 255, 0, 0.3)");
  gradient.addColorStop(1, "rgba(0, 255, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, pulseRadius + 20, 0, Math.PI * 2);
  ctx.fill();

  // Main goal
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, pulseRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#00ff00";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Goal particles
  if (Math.random() < 0.3) {
    particles.push({
      x: goal.x + (Math.random() - 0.5) * goal.radius,
      y: goal.y + (Math.random() - 0.5) * goal.radius,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 60,
      color: "#00ff00",
      size: 2
    });
  }
}

function drawWalls() {
  for (let w of walls) {
    switch (w.type) {
      case 'magnetic':
        // Magnetic walls - blue
        const magGradient = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
        magGradient.addColorStop(0, "#0066ff");
        magGradient.addColorStop(1, "#003399");
        ctx.fillStyle = magGradient;
        break;
      case 'repulsive':
        // Repulsive walls - red
        const repGradient = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
        repGradient.addColorStop(0, "#ff6600");
        repGradient.addColorStop(1, "#cc3300");
        ctx.fillStyle = repGradient;
        break;
      default:
        ctx.fillStyle = "#444444";
    }
    
    ctx.fillRect(w.x, w.y, w.w, w.h);
    
    // Wall highlight
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
}

function drawSpikes() {
  for (let spike of spikes) {
    // Spike danger aura
    const gradient = ctx.createRadialGradient(spike.x, spike.y, 0, spike.x, spike.y, spike.radius + 10);
    gradient.addColorStop(0, "rgba(255, 0, 0, 0.6)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(spike.x, spike.y, spike.radius + 10, 0, Math.PI * 2);
    ctx.fill();

    // Spike body
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4);
      const x = spike.x + Math.cos(angle) * spike.radius;
      const y = spike.y + Math.sin(angle) * spike.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawMovingObstacles() {
  for (let obs of movingObstacles) {
    // Moving obstacle with electric effect
    const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
    gradient.addColorStop(0, "#ffff00");
    gradient.addColorStop(0.5, "#ffaa00");
    gradient.addColorStop(1, "#ff6600");
    ctx.fillStyle = gradient;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    
    // Electric sparks
    if (Math.random() < 0.2) {
      sparks.push({
        x: obs.x + Math.random() * obs.w,
        y: obs.y + Math.random() * obs.h,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 15,
        color: "#ffff00"
      });
    }
  }
}

function drawStars() {
  for (let star of stars) {
    if (star.collected) continue;
    
    // Star glow
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 20);
    gradient.addColorStop(0, star.color + "80");
    gradient.addColorStop(1, star.color + "00");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Star shape
    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(Date.now() / 1000);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const x = Math.cos(angle) * (i % 2 === 0 ? 12 : 6);
      const y = Math.sin(angle) * (i % 2 === 0 ? 12 : 6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = star.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Power-up indicator
    if (star.type !== 'normal') {
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      const typeSymbols = {
        'speed': '⚡',
        'shield': '🛡️',
        'energy': '🔋',
        'magnet': '🧲'
      };
      ctx.fillText(typeSymbols[star.type] || '⭐', star.x, star.y - 20);
    }
  }
}

function drawMagnetField() {
  if (!mouse.active || energy <= 0) return;
  
  const fieldStrength = Math.min(energy / 100, 1) * mouse.magnetStrength;
  const pulseSize = 60 + Math.sin(Date.now() / 150) * 15;
  
  // Main magnetic field
  const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, pulseSize);
  gradient.addColorStop(0, `rgba(0, 255, 255, ${0.4 * fieldStrength})`);
  gradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.2 * fieldStrength})`);
  gradient.addColorStop(1, "rgba(0, 255, 255, 0)");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, pulseSize, 0, Math.PI * 2);
  ctx.fill();

  // Magnetic field lines
  ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 * fieldStrength})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (Date.now() / 500 + i * Math.PI / 4) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, pulseSize * 0.7, angle, angle + Math.PI / 6);
    ctx.stroke();
  }
}

function updateBall() {
  // Magnetic attraction
  if (mouse.active && energy > 0) {
    const dx = mouse.x - ball.x;
    const dy = mouse.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 200;
    
    if (dist < maxDist && dist > 0) {
      const basePull = 0.25; // Reduced base pull
      const magnetBonus = powerUps.superMagnet > 0 ? 0.1 : 0; // 10% bonus when active
      const pull = (basePull + magnetBonus) * (1 - dist / maxDist);
      
      ball.vx += pull * dx / dist;
      ball.vy += pull * dy / dist;
      ball.magnetized = true;
      ball.charge = Math.min(ball.charge + 0.02, 1);
      
      // Drain energy
      energy -= 0.3; // Reduced energy drain
      energy = Math.max(0, energy);
      
      // Magnetic particles
      if (Math.random() < 0.4) {
        particles.push({
          x: ball.x + (Math.random() - 0.5) * ball.radius,
          y: ball.y + (Math.random() - 0.5) * ball.radius,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 30,
          color: "cyan",
          size: 2
        });
      }
    }
  } else {
    ball.magnetized = false;
    ball.charge *= 0.95;
  }
  
  // Speed boost effect
  const speedMultiplier = 1 + (powerUps.speedBoost > 0 ? 0.15 : 0); // 15% speed boost when active

  // Physics update
  ball.x += ball.vx * speedMultiplier;
  ball.y += ball.vy * speedMultiplier;
  
  // Friction
  const friction = 0.985;
  ball.vx *= friction;
  ball.vy *= friction;

  // Boundary collision
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > WIDTH) {
    ball.vx *= -0.7;
    ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
  }
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > HEIGHT) {
    ball.vy *= -0.7;
    ball.y = Math.max(ball.radius, Math.min(HEIGHT - ball.radius, ball.y));
  }

  // Wall collisions with enhanced physics
  for (let w of walls) {
    if (ballWallCollision(ball, w)) {
      handleWallCollision(w);
    }
  }

  // Moving obstacle collisions
  for (let obs of movingObstacles) {
    if (ballRectCollision(ball, obs)) {
      takeDamage();
      // Bounce off
      const centerX = obs.x + obs.w / 2;
      const centerY = obs.y + obs.h / 2;
      const dx = ball.x - centerX;
      const dy = ball.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        ball.vx += (dx / dist) * 8;
        ball.vy += (dy / dist) * 8;
      }
    }
  }

  // Spike collisions
  if (ball.invulnerable <= 0) {
    for (let spike of spikes) {
      const dx = ball.x - spike.x;
      const dy = ball.y - spike.y;
      if (Math.hypot(dx, dy) < ball.radius + spike.radius) {
        takeDamage();
        // Knock back
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          ball.vx += (dx / dist) * 10;
          ball.vy += (dy / dist) * 10;
        }
        break;
      }
    }
  }

  // Star collection
  for (let star of stars) {
    if (star.collected) continue;
    const dx = ball.x - star.x;
    const dy = ball.y - star.y;
    if (Math.hypot(dx, dy) < ball.radius + 12) {
      collectStar(star);
    }
  }

  // Goal detection
  const goalDist = Math.hypot(ball.x - goal.x, ball.y - goal.y);
  if (goalDist < ball.radius + goal.radius) {
    if (collectedCount === stars.length) {
      victory();
    }
  }

  // Update ball trail
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 20) {
    ball.trail.shift();
  }

  // Update power-up timers
  if (ball.invulnerable > 0) ball.invulnerable--;
  if (powerUps.speedBoost > 0) powerUps.speedBoost--;
  if (powerUps.shield > 0) powerUps.shield--;
  if (powerUps.superMagnet > 0) {
    powerUps.superMagnet--;
    if (powerUps.superMagnet <= 0) {
      mouse.magnetStrength = 1; // Reset magnet strength when power-up ends
    }
  }
  
  // Energy regeneration
  if (!mouse.active) {
    energy += 0.2;
    energy = Math.min(100, energy);
  }
}

function ballWallCollision(ball, wall) {
  return ball.x + ball.radius > wall.x &&
         ball.x - ball.radius < wall.x + wall.w &&
         ball.y + ball.radius > wall.y &&
         ball.y - ball.radius < wall.y + wall.h;
}

function ballRectCollision(ball, rect) {
  return ball.x + ball.radius > rect.x &&
         ball.x - ball.radius < rect.x + rect.w &&
         ball.y + ball.radius > rect.y &&
         ball.y - ball.radius < rect.y + rect.h;
}

function handleWallCollision(wall) {
  // Enhanced collision response based on wall type
  const bounce = wall.type === 'normal' ? 0.6 : 0.8;
  
  switch (wall.type) {
    case 'magnetic':
      // Magnetic walls attract the ball
      const centerX = wall.x + wall.w / 2;
      const centerY = wall.y + wall.h / 2;
      const dx = centerX - ball.x;
      const dy = centerY - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        ball.vx += (dx / dist) * 0.5;
        ball.vy += (dy / dist) * 0.5;
      }
      break;
      
    case 'repulsive':
      // Repulsive walls push the ball away
      const repCenterX = wall.x + wall.w / 2;
      const repCenterY = wall.y + wall.h / 2;
      const repDx = ball.x - repCenterX;
      const repDy = ball.y - repCenterY;
      const repDist = Math.sqrt(repDx * repDx + repDy * repDy);
      if (repDist > 0) {
        ball.vx += (repDx / repDist) * 3;
        ball.vy += (repDy / repDist) * 3;
      }
      break;
  }

  // Standard bounce physics
  if (ball.x < wall.x || ball.x > wall.x + wall.w) {
    ball.vx *= -bounce;
  }
  if (ball.y < wall.y || ball.y > wall.y + wall.h) {
    ball.vy *= -bounce;
  }

  // Create sparks on collision
  for (let i = 0; i < 5; i++) {
    sparks.push({
      x: ball.x,
      y: ball.y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 20,
      color: wall.type === 'magnetic' ? '#0066ff' : wall.type === 'repulsive' ? '#ff6600' : '#ffffff'
    });
  }
}

function collectStar(star) {
  star.collected = true;
  collectedCount++;
  document.getElementById('stars').textContent = collectedCount;

  // Apply power-up effects with reduced intensity
  switch (star.type) {
    case 'speed':
      powerUps.speedBoost = 120; // 2 seconds at 60fps
      break;
    case 'shield':
      powerUps.shield = 90; // 1.5 seconds
      ball.invulnerable = 90;
      break;
    case 'energy':
      energy = Math.min(energy + 40, 100); // Add 40% energy instead of full restore
      powerUps.energyBoost = true;
      break;
    case 'magnet':
      powerUps.superMagnet = 120; // 2 seconds
      mouse.magnetStrength = 1.3; // 30% boost instead of 100%
      break;
  }

  // Collection effects
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: star.x,
      y: star.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 40,
      color: star.color,
      size: 3
    });
  }
}

function takeDamage() {
  if (ball.invulnerable > 0 || powerUps.shield > 0) return;
  
  lives--;
  document.getElementById('lives').textContent = lives;
  ball.invulnerable = 120; // 2 seconds of invulnerability
  
  // Damage effects
  for (let i = 0; i < 20; i++) {
    sparks.push({
      x: ball.x,
      y: ball.y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 30,
      color: '#ff0000'
    });
  }
  
  if (lives <= 0) {
    gameOver();
  }
}

function updateMovingObstacles() {
  for (let obs of movingObstacles) {
    obs.x += obs.vx;
    obs.y += obs.vy;
    
    // Bounce within range
    if (obs.x <= obs.startX - obs.range || obs.x >= obs.startX + obs.range) {
      obs.vx *= -1;
    }
  }
}

function updateParticles() {
  // Update regular particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // Update sparks
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.95;
    s.vy *= 0.95;
    s.life--;
    
    if (s.life <= 0) {
      sparks.splice(i, 1);
    }
  }
  
  // Update energy orbs
  for (let i = energyOrbs.length - 1; i >= 0; i--) {
    const orb = energyOrbs[i];
    orb.angle += 0.2;
    orb.x = mouse.x + Math.cos(orb.angle) * 30;
    orb.y = mouse.y + Math.sin(orb.angle) * 30;
    orb.life--;
    
    if (orb.life <= 0) {
      energyOrbs.splice(i, 1);
    }
  }
}

function drawParticles() {
  // Draw regular particles
  for (let p of particles) {
    const alpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw sparks
  for (let s of sparks) {
    const alpha = s.life / 30;
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx, s.y - s.vy);
    ctx.stroke();
  }
  
  // Draw energy orbs
  for (let orb of energyOrbs) {
    const alpha = orb.life / 20;
    ctx.fillStyle = "#00ffff";
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
}

function drawBackground() {
  // Animated background
  const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 0, WIDTH/2, HEIGHT/2, Math.max(WIDTH, HEIGHT));
  gradient.addColorStop(0, "#001122");
  gradient.addColorStop(0.5, "#000811");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Background stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  for (let i = 0; i < 100; i++) {
    const x = (i * 37) % WIDTH;
    const y = (i * 73) % HEIGHT;
    const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPowerUpIndicators() {
  const startY = HEIGHT - 60;
  let x = 20;
  
  if (powerUps.speedBoost > 0) {
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(x, startY, 40, 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("⚡", x + 5, startY - 5);
    x += 50;
  }
  
  if (powerUps.shield > 0) {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(x, startY, 40, 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("🛡️", x + 5, startY - 5);
    x += 50;
  }
  
  if (powerUps.superMagnet > 0) {
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(x, startY, 40, 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("🧲", x + 5, startY - 5);
    x += 50;
  }
}

function drawEnergyBar() {
  const barWidth = 200;
  const barHeight = 10;
  const x = WIDTH - barWidth - 20;
  const y = 20;
  
  // Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);
  
  // Energy bar background
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, barWidth, barHeight);
  
  // Energy bar fill
  const energyWidth = (energy / 100) * barWidth;
  const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
  gradient.addColorStop(0, "#ff0000");
  gradient.addColorStop(0.5, "#ffff00");
  gradient.addColorStop(1, "#00ff00");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, energyWidth, barHeight);
  
  // Border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barWidth, barHeight);
  
  // Update UI
  document.getElementById('energy').textContent = Math.floor(energy);
}

function gameOver() {
  gameState = 'gameOver';
  document.getElementById('gameOver').style.display = 'block';
}

function victory() {
  gameState = 'victory';
  document.getElementById('finalTime').textContent = Math.floor(gameTime);
  document.getElementById('victory').style.display = 'block';
}

function restartGame() {
  // Reset game state
  gameState = 'playing';
  lives = 3;
  energy = 100;
  gameTime = 0;
  collectedCount = 0;
  lastTime = Date.now();
  
  // Reset ball
  ball = {
    x: 80, y: 80,
    vx: 0, vy: 0,
    radius: 14,
    color: "#e0e0e0",
    trail: [],
    magnetized: false,
    invulnerable: 0,
    metallic: true,
    charge: 0
  };
  
  // Reset stars
  for (let star of stars) {
    star.collected = false;
  }
  
  // Reset power-ups
  powerUps = {
    speedBoost: 0,
    shield: 0,
    energyBoost: false,
    superMagnet: 0
  };
  
  // Reset mouse
  mouse.magnetStrength = 1;
  
  // Clear particles
  particles = [];
  sparks = [];
  energyOrbs = [];
  
  // Hide UI panels
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('victory').style.display = 'none';
  
  // Update UI
  document.getElementById('stars').textContent = '0';
  document.getElementById('lives').textContent = '3';
  document.getElementById('time').textContent = '0';
  document.getElementById('energy').textContent = '100';
}

function nextLevel() {
  level++;
  
  // Add more challenging elements for next level
  if (level === 2) {
    // Add more spikes
    spikes.push(
      { x: 250, y: 150, radius: 15, damage: 1 },
      { x: 550, y: 250, radius: 15, damage: 1 }
    );
    
    // Add more moving obstacles
    movingObstacles.push(
      { x: 300, y: 100, vx: 0, vy: 3, w: 15, h: 80, range: 150, startY: 100 }
    );
    
    // Move goal
    goal.x = 200;
    goal.y = 500;
  }
  
  restartGame();
}

function gameLoop() {
  if (gameState === 'playing') {
    updateGameTime();
    updateBall();
    updateMovingObstacles();
    updateParticles();
  }
  
  // Draw everything
  drawBackground();
  drawMagnetField();
  drawGoal();
  drawWalls();
  drawSpikes();
  drawMovingObstacles();
  drawStars();
  drawBall();
  drawParticles();
  drawPowerUpIndicators();
  drawEnergyBar();
  
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();