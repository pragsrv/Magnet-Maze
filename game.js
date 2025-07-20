// Panel Management System
class PanelManager {
  constructor() {
    this.panels = {};
    this.dragging = null;
    this.offset = { x: 0, y: 0 };
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleMouseDown(e) {
    const panel = e.target.closest('.popup-panel');
    if (!panel || !e.target.closest('.popup-header')) return;
    
    if (e.target.closest('.control-btn')) return; // Don't drag when clicking control buttons
    
    this.startDrag(panel, e.clientX, e.clientY);
  }

  handleTouchStart(e) {
    const panel = e.target.closest('.popup-panel');
    if (!panel || !e.target.closest('.popup-header')) return;
    
    if (e.target.closest('.control-btn')) return;
    
    const touch = e.touches[0];
    this.startDrag(panel, touch.clientX, touch.clientY);
    e.preventDefault();
  }

  startDrag(panel, x, y) {
    this.dragging = panel;
    const rect = panel.getBoundingClientRect();
    this.offset.x = x - rect.left;
    this.offset.y = y - rect.top;
    
    panel.classList.add('dragging');
    panel.style.zIndex = '150';
  }

  handleMouseMove(e) {
    if (!this.dragging) return;
    this.updatePosition(e.clientX, e.clientY);
  }

  handleTouchMove(e) {
    if (!this.dragging) return;
    const touch = e.touches[0];
    this.updatePosition(touch.clientX, touch.clientY);
    e.preventDefault();
  }

  updatePosition(x, y) {
    const newX = Math.max(0, Math.min(window.innerWidth - this.dragging.offsetWidth, x - this.offset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - this.dragging.offsetHeight, y - this.offset.y));
    
    this.dragging.style.left = newX + 'px';
    this.dragging.style.top = newY + 'px';
  }

  handleMouseUp() {
    this.endDrag();
  }

  handleTouchEnd() {
    this.endDrag();
  }

  endDrag() {
    if (!this.dragging) return;
    
    this.dragging.classList.remove('dragging');
    this.dragging.style.zIndex = '100';
    this.dragging = null;
  }
}

// Panel control functions
function minimizePanel(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.toggle('minimized');
}

function closePanel(panelId) {
  const panel = document.getElementById(panelId);
  const toggleBtn = document.getElementById(panelId === 'gameUI' ? 'toggleUI' : 'toggleInstructions');
  
  panel.classList.add('hidden');
  toggleBtn.style.display = 'block';
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const toggleBtn = document.getElementById(panelId === 'gameUI' ? 'toggleUI' : 'toggleInstructions');
  
  panel.classList.remove('hidden');
  panel.classList.remove('minimized');
  toggleBtn.style.display = 'none';
}

// Initialize panel manager
const panelManager = new PanelManager();

// Game Core System (keeping the same game logic)
class CosmicGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.initializeGame();
    this.setupEventListeners();
    this.audioContext = null;
    this.initAudio();
  }

  setupCanvas() {
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.WIDTH = this.canvas.width;
      this.HEIGHT = this.canvas.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  initializeGame() {
    this.currentLevel = 1;
    this.score = 0;
    this.lives = 3;
    this.energy = 100;
    this.maxEnergy = 100;
    this.gameState = 'playing';
    this.powerUp = null;
    this.mouse = { x: 0, y: 0, active: false };
    this.particles = [];
    this.backgroundStars = this.generateBackgroundStars();
    this.loadLevel(this.currentLevel);
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  // Enhanced Ball Physics (Zero Gravity)
  initializeBall() {
    this.ball = {
      x: 80,
      y: 80,
      vx: 0,
      vy: 0,
      radius: 14,
      mass: 1,
      trail: [],
      maxTrailLength: 25,
      magnetized: false,
      invulnerable: 0,
      color: '#00ccff',
      glowIntensity: 0
    };
  }

  // Advanced Level System
  generateLevel(levelNum) {
    const difficulty = Math.min(levelNum * 0.3, 3);
    const starCount = Math.min(5 + Math.floor(levelNum / 3), 8);
    
    const level = {
      stars: [],
      goal: { 
        x: this.WIDTH - 100, 
        y: this.HEIGHT - 100, 
        radius: 35,
        active: false,
        pulsePhase: 0
      },
      walls: [],
      spikes: [],
      blackHoles: [],
      movingPlatforms: [],
      teleporters: [],
      powerUps: [],
      magneticFields: []
    };

    // Generate stars in safe positions
    for (let i = 0; i < starCount; i++) {
      let attempts = 0;
      let validPosition = false;
      let star;
      
      while (!validPosition && attempts < 50) {
        star = {
          x: 150 + Math.random() * (this.WIDTH - 300),
          y: 150 + Math.random() * (this.HEIGHT - 300),
          collected: false,
          rotation: Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2
        };
        
        validPosition = this.isValidPosition(star.x, star.y, 50);
        attempts++;
      }
      
      if (validPosition) level.stars.push(star);
    }

    // Generate walls with improved layouts
    this.generateWalls(level, difficulty);
    
    // Generate hazards
    this.generateHazards(level, difficulty);
    
    // Generate power-ups
    this.generatePowerUps(level, levelNum);
    
    // Add special features for higher levels
    if (levelNum > 3) {
      this.generateTeleporters(level);
    }
    
    if (levelNum > 5) {
      this.generateBlackHoles(level, difficulty);
    }

    return level;
  }

  generateWalls(level, difficulty) {
    const wallCount = 4 + Math.floor(difficulty * 2);
    
    for (let i = 0; i < wallCount; i++) {
      const isVertical = Math.random() > 0.5;
      const wall = {
        x: 100 + Math.random() * (this.WIDTH - 400),
        y: 100 + Math.random() * (this.HEIGHT - 400),
        w: isVertical ? 25 : 80 + Math.random() * 120,
        h: isVertical ? 80 + Math.random() * 120 : 25,
        type: Math.random() > 0.7 ? 'magnetic' : 'normal'
      };
      
      if (this.isValidPosition(wall.x + wall.w/2, wall.y + wall.h/2, 60)) {
        level.walls.push(wall);
      }
    }
  }

  generateHazards(level, difficulty) {
    const spikeCount = Math.floor(2 + difficulty * 2);
    
    for (let i = 0; i < spikeCount; i++) {
      const spike = {
        x: 200 + Math.random() * (this.WIDTH - 400),
        y: 200 + Math.random() * (this.HEIGHT - 400),
        size: 18 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2
      };
      
      if (this.isValidPosition(spike.x, spike.y, 80)) {
        level.spikes.push(spike);
      }
    }
  }

  generatePowerUps(level, levelNum) {
    const powerUpTypes = ['energy', 'speed', 'shield', 'magnet_boost'];
    const count = Math.min(1 + Math.floor(levelNum / 4), 3);
    
    for (let i = 0; i < count; i++) {
      const powerUp = {
        x: 150 + Math.random() * (this.WIDTH - 300),
        y: 150 + Math.random() * (this.HEIGHT - 300),
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
        active: true,
        rotation: 0,
        pulsePhase: Math.random() * Math.PI * 2
      };
      
      if (this.isValidPosition(powerUp.x, powerUp.y, 60)) {
        level.powerUps.push(powerUp);
      }
    }
  }

  generateTeleporters(level) {
    if (Math.random() > 0.6) {
      const teleporter1 = {
        x: 120 + Math.random() * 200,
        y: 120 + Math.random() * 200,
        radius: 25,
        targetX: this.WIDTH - 320 + Math.random() * 200,
        targetY: this.HEIGHT - 320 + Math.random() * 200,
        color: '#ff00ff',
        pulsePhase: 0
      };
      
      const teleporter2 = {
        x: teleporter1.targetX,
        y: teleporter1.targetY,
        radius: 25,
        targetX: teleporter1.x,
        targetY: teleporter1.y,
        color: '#ff00ff',
        pulsePhase: Math.PI
      };
      
      level.teleporters.push(teleporter1, teleporter2);
    }
  }

  generateBlackHoles(level, difficulty) {
    const count = Math.floor(difficulty / 2);
    
    for (let i = 0; i < count; i++) {
      const blackHole = {
        x: 250 + Math.random() * (this.WIDTH - 500),
        y: 250 + Math.random() * (this.HEIGHT - 500),
        radius: 40,
        strength: 0.3 + difficulty * 0.1,
        rotation: 0
      };
      
      if (this.isValidPosition(blackHole.x, blackHole.y, 120)) {
        level.blackHoles.push(blackHole);
      }
    }
  }

  generateBackgroundStars() {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * this.WIDTH,
        y: Math.random() * this.HEIGHT,
        size: Math.random() * 3 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: 0.5 + Math.random() * 2
      });
    }
    return stars;
  }

  isValidPosition(x, y, minDistance) {
    const startDistance = Math.hypot(x - 80, y - 80);
    const goalDistance = Math.hypot(x - (this.WIDTH - 100), y - (this.HEIGHT - 100));
    
    return startDistance > minDistance && goalDistance > minDistance;
  }

  loadLevel(levelNum) {
    this.currentLevel = levelNum;
    this.level = this.generateLevel(levelNum);
    this.initializeBall();
    this.collectedStars = 0;
    this.gameState = 'playing';
    this.updateUI();
    this.playSound(1000, 0.3, 'sine');
  }

  // Enhanced Physics System
  updateBall() {
    if (this.gameState !== 'playing') return;

    // Magnetic field interaction (replaces gravity)
    if (this.mouse.active && this.energy > 0) {
      const dx = this.mouse.x - this.ball.x;
      const dy = this.mouse.y - this.ball.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance > 5) {
        const magneticForce = Math.min(0.6 / (distance * 0.01 + 1), 3.0);
        const powerMultiplier = this.powerUp?.type === 'magnet_boost' ? 1.8 : 1;
        
        this.ball.vx += (dx / distance) * magneticForce * powerMultiplier;
        this.ball.vy += (dy / distance) * magneticForce * powerMultiplier;
        
        this.ball.magnetized = true;
        this.ball.glowIntensity = Math.min(this.ball.glowIntensity + 0.1, 1);
        
        const energyDrain = (this.powerUp?.type === 'energy' ? 0.4 : 0.8);
        this.energy -= energyDrain;
        
        this.createMagnetParticles();
      }
    } else {
      this.ball.magnetized = false;
      this.ball.glowIntensity = Math.max(this.ball.glowIntensity - 0.05, 0);
      this.energy = Math.min(this.energy + 0.5, this.maxEnergy);
    }

    // Black hole gravitational effects
    for (let blackHole of this.level.blackHoles) {
      const dx = blackHole.x - this.ball.x;
      const dy = blackHole.y - this.ball.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < 200) {
        const force = blackHole.strength / (distance * 0.01 + 1);
        this.ball.vx += (dx / distance) * force * 0.3;
        this.ball.vy += (dy / distance) * force * 0.3;
      }
    }

    // Space friction and velocity limiting
    const maxVelocity = this.powerUp?.type === 'speed' ? 15 : 10;
    const friction = 0.994; // Very low friction for space
    
    this.ball.vx *= friction;
    this.ball.vy *= friction;
    
    const velocity = Math.hypot(this.ball.vx, this.ball.vy);
    if (velocity > maxVelocity) {
      this.ball.vx = (this.ball.vx / velocity) * maxVelocity;
      this.ball.vy = (this.ball.vy / velocity) * maxVelocity;
    }

    // Position update
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Boundary collisions with energy loss
    this.handleBoundaryCollisions();
    
    // Game object interactions
    this.checkCollisions();
    
    // Update trail
    this.updateTrail();
    
    // Update invulnerability
    if (this.ball.invulnerable > 0) this.ball.invulnerable--;
    
    // Update power-up duration
    if (this.powerUp) {
      this.powerUp.duration--;
      if (this.powerUp.duration <= 0) {
        this.powerUp = null;
        this.updateUI();
      }
    }
  }

  handleBoundaryCollisions() {
    const restitution = 0.7;
    
    if (this.ball.x <= this.ball.radius) {
      this.ball.x = this.ball.radius;
      this.ball.vx = Math.abs(this.ball.vx) * restitution;
      this.createImpactParticles(this.ball.x, this.ball.y, '#00ccff');
    }
    if (this.ball.x >= this.WIDTH - this.ball.radius) {
      this.ball.x = this.WIDTH - this.ball.radius;
      this.ball.vx = -Math.abs(this.ball.vx) * restitution;
      this.createImpactParticles(this.ball.x, this.ball.y, '#00ccff');
    }
    if (this.ball.y <= this.ball.radius) {
      this.ball.y = this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy) * restitution;
      this.createImpactParticles(this.ball.x, this.ball.y, '#00ccff');
    }
    if (this.ball.y >= this.HEIGHT - this.ball.radius) {
      this.ball.y = this.HEIGHT - this.ball.radius;
      this.ball.vy = -Math.abs(this.ball.vy) * restitution;
      this.createImpactParticles(this.ball.x, this.ball.y, '#00ccff');
    }
  }

  updateTrail() {
    this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ball.trail.length > this.ball.maxTrailLength) {
      this.ball.trail.shift();
    }
  }

  // Enhanced Collision System
  checkCollisions() {
    this.checkWallCollisions();
    this.checkSpikeCollisions();
    this.checkBlackHoleCollisions();
    this.checkTeleporterCollisions();
    this.checkStarCollisions();
    this.checkGoalCollision();
    this.checkPowerUpCollisions();
  }

  checkWallCollisions() {
    for (let wall of this.level.walls) {
      if (this.ball.x + this.ball.radius > wall.x &&
          this.ball.x - this.ball.radius < wall.x + wall.w &&
          this.ball.y + this.ball.radius > wall.y &&
          this.ball.y - this.ball.radius < wall.y + wall.h) {
        
        const centerX = wall.x + wall.w / 2;
        const centerY = wall.y + wall.h / 2;
        const dx = this.ball.x - centerX;
        const dy = this.ball.y - centerY;
        
        const restitution = wall.type === 'magnetic' ? 1.1 : 0.8;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          this.ball.vx *= -restitution;
          this.ball.x = dx > 0 ? wall.x + wall.w + this.ball.radius : wall.x - this.ball.radius;
        } else {
          this.ball.vy *= -restitution;
          this.ball.y = dy > 0 ? wall.y + wall.h + this.ball.radius : wall.y - this.ball.radius;
        }
        
        const color = wall.type === 'magnetic' ? '#00ffff' : '#ffffff';
        this.createImpactParticles(this.ball.x, this.ball.y, color);
        this.playSound(wall.type === 'magnetic' ? 800 : 500, 0.15);
      }
    }
  }

  checkSpikeCollisions() {
    if (this.ball.invulnerable > 0 || (this.powerUp?.type === 'shield')) return;
    
    for (let spike of this.level.spikes) {
      const distance = Math.hypot(this.ball.x - spike.x, this.ball.y - spike.y);
      if (distance < this.ball.radius + spike.size) {
        this.loseLife();
        return;
      }
    }
  }

  checkBlackHoleCollisions() {
    if (this.ball.invulnerable > 0 || (this.powerUp?.type === 'shield')) return;
    
    for (let blackHole of this.level.blackHoles) {
      const distance = Math.hypot(this.ball.x - blackHole.x, this.ball.y - blackHole.y);
      if (distance < blackHole.radius) {
        this.loseLife();
        this.createBlackHoleEffect(blackHole.x, blackHole.y);
        return;
      }
    }
  }

  checkTeleporterCollisions() {
    for (let teleporter of this.level.teleporters) {
      const distance = Math.hypot(this.ball.x - teleporter.x, this.ball.y - teleporter.y);
      if (distance < this.ball.radius + teleporter.radius) {
        this.ball.x = teleporter.targetX;
        this.ball.y = teleporter.targetY;
        this.ball.vx *= 0.6;
        this.ball.vy *= 0.6;
        this.createTeleportEffect(teleporter.x, teleporter.y);
        this.createTeleportEffect(teleporter.targetX, teleporter.targetY);
        this.playSound(1400, 0.4);
        break;
      }
    }
  }

  checkStarCollisions() {
    for (let star of this.level.stars) {
      if (star.collected) continue;
      
      const distance = Math.hypot(this.ball.x - star.x, this.ball.y - star.y);
      if (distance < this.ball.radius + 15) {
        star.collected = true;
        this.collectedStars++;
        this.score += 200 * this.currentLevel;
        this.createStarEffect(star.x, star.y);
        this.playSound(1200, 0.3);
        this.updateUI();
        
        if (this.collectedStars === this.level.stars.length) {
          this.level.goal.active = true;
          this.playSound(1600, 0.4);
        }
      }
    }
  }

  checkGoalCollision() {
    if (!this.level.goal.active) return;
    
    const distance = Math.hypot(this.ball.x - this.level.goal.x, this.ball.y - this.level.goal.y);
    if (distance < this.ball.radius + this.level.goal.radius) {
      this.completeLevel();
    }
  }

  checkPowerUpCollisions() {
    for (let powerUp of this.level.powerUps) {
      if (!powerUp.active) continue;
      
      const distance = Math.hypot(this.ball.x - powerUp.x, this.ball.y - powerUp.y);
      if (distance < this.ball.radius + 20) {
        powerUp.active = false;
        this.activatePowerUp(powerUp.type);
        this.createPowerUpEffect(powerUp.x, powerUp.y, powerUp.type);
        this.playSound(1800, 0.3);
      }
    }
  }

  activatePowerUp(type) {
    const durations = {
      energy: 0,
      speed: 900,
      shield: 600,
      magnet_boost: 750
    };
    
    this.powerUp = { type, duration: durations[type] };
    
    if (type === 'energy') {
      this.energy = this.maxEnergy;
    }
    
    this.updateUI();
  }

  // Particle Effects System
  createMagnetParticles() {
    if (Math.random() > 0.7) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: this.ball.x + (Math.random() - 0.5) * 30,
          y: this.ball.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 40,
          maxLife: 40,
          size: 2 + Math.random() * 3,
          color: '#00ccff',
          type: 'magnet'
        });
      }
    }
  }

  createImpactParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 35,
        maxLife: 35,
        size: 2 + Math.random() * 4,
        color,
        type: 'impact'
      });
    }
  }

  createStarEffect(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x,
        y,
        vx: Math.cos(i * Math.PI / 10) * 8,
        vy: Math.sin(i * Math.PI / 10) * 8,
        life: 60,
        maxLife: 60,
        size: 3 + Math.random() * 4,
        color: '#ffdd00',
        type: 'star'
      });
    }
  }

  createTeleportEffect(x, y) {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 50,
        maxLife: 50,
        size: 2 + Math.random() * 5,
        color: '#ff00ff',
        type: 'teleport'
      });
    }
  }

  createPowerUpEffect(x, y, type) {
    const colors = {
      energy: '#00ff00',
      speed: '#ff00ff',
      shield: '#ffffff',
      magnet_boost: '#00ffff'
    };
    
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 55,
        maxLife: 55,
        size: 3 + Math.random() * 4,
        color: colors[type],
        type: 'powerup'
      });
    }
  }

  createBlackHoleEffect(x, y) {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 70,
        maxLife: 70,
        size: 2 + Math.random() * 6,
        color: '#440044',
        type: 'blackhole'
      });
    }
  }

  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      return particle.life > 0;
    });
  }

  // Enhanced Rendering System
  render() {
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    
    this.drawBackground();
    this.drawMagneticField();
    this.drawGameObjects();
    this.drawParticles();
    this.drawBall();
  }

  drawBackground() {
    // Space gradient
    const gradient = this.ctx.createRadialGradient(
      this.WIDTH / 2, this.HEIGHT / 2, 0,
      this.WIDTH / 2, this.HEIGHT / 2, Math.max(this.WIDTH, this.HEIGHT)
    );
    gradient.addColorStop(0, '#001a33');
    gradient.addColorStop(0.5, '#000d1a');
    gradient.addColorStop(1, '#000511');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    
    // Background stars
    for (let star of this.backgroundStars) {
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() / 1000 * star.twinkleSpeed));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * star.brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Parallax scrolling
      star.x = (star.x + 0.02 * star.size) % this.WIDTH;
    }
  }

  drawMagneticField() {
    if (!this.mouse.active || this.energy <= 0) return;
    
    const time = Date.now() / 1000;
    const pulseRadius = 60 + 20 * Math.sin(time * 5);
    
    // Main field
    const gradient = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 0,
      this.mouse.x, this.mouse.y, pulseRadius
    );
    gradient.addColorStop(0, 'rgba(0, 204, 255, 0.2)');
    gradient.addColorStop(0.7, 'rgba(0, 204, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 204, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, pulseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Field lines
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + time;
      const x = this.mouse.x + Math.cos(angle) * pulseRadius * 0.8;
      const y = this.mouse.y + Math.sin(angle) * pulseRadius * 0.8;
      
      this.ctx.strokeStyle = `rgba(0, 204, 255, ${0.3 + 0.2 * Math.sin(time * 3 + i)})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouse.x, this.mouse.y);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  drawGameObjects() {
    this.drawWalls();
    this.drawSpikes();
    this.drawBlackHoles();
    this.drawTeleporters();
    this.drawStars();
    this.drawGoal();
    this.drawPowerUps();
  }

  drawWalls() {
    for (let wall of this.level.walls) {
      if (wall.type === 'magnetic') {
        const gradient = this.ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(0.5, '#0033aa');
        gradient.addColorStop(1, '#001a33');
        this.ctx.fillStyle = gradient;
        
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 15;
      } else {
        this.ctx.fillStyle = '#2a2a3a';
        this.ctx.shadowBlur = 0;
      }
      
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      
      this.ctx.strokeStyle = wall.type === 'magnetic' ? '#00ccff' : '#666666';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
    this.ctx.shadowBlur = 0;
  }

  drawSpikes() {
    for (let spike of this.level.spikes) {
      this.ctx.save();
      this.ctx.translate(spike.x, spike.y);
      this.ctx.rotate(spike.rotation + Date.now() / 2000);
      
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, spike.size);
      gradient.addColorStop(0, '#ff6666');
      gradient.addColorStop(1, '#ff0000');
      
      this.ctx.fillStyle = gradient;
      this.ctx.strokeStyle = '#ffaaaa';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = i % 2 === 0 ? spike.size : spike.size * 0.4;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawBlackHoles() {
    for (let blackHole of this.level.blackHoles) {
      blackHole.rotation += 0.05;
      
      // Accretion disk
      for (let i = 0; i < 3; i++) {
        const radius = blackHole.radius + i * 15;
        const gradient = this.ctx.createRadialGradient(
          blackHole.x, blackHole.y, radius * 0.3,
          blackHole.x, blackHole.y, radius
        );
        gradient.addColorStop(0, `rgba(66, 0, 66, ${0.8 - i * 0.2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(blackHole.x, blackHole.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Event horizon
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Edge glow
      this.ctx.strokeStyle = '#440044';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(blackHole.x, blackHole.y, blackHole.radius + 2, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawTeleporters() {
    for (let teleporter of this.level.teleporters) {
      teleporter.pulsePhase += 0.1;
      const pulse = 0.7 + 0.3 * Math.sin(teleporter.pulsePhase);
      
      // Portal effect
      const gradient = this.ctx.createRadialGradient(
        teleporter.x, teleporter.y, 0,
        teleporter.x, teleporter.y, teleporter.radius * 1.5
      );
      gradient.addColorStop(0, `rgba(255, 0, 255, ${pulse * 0.8})`);
      gradient.addColorStop(0.7, `rgba(255, 0, 255, ${pulse * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(teleporter.x, teleporter.y, teleporter.radius * 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Inner portal
      this.ctx.fillStyle = teleporter.color;
      this.ctx.globalAlpha = pulse;
      this.ctx.beginPath();
      this.ctx.arc(teleporter.x, teleporter.y, teleporter.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      
      // Portal ring
      this.ctx.strokeStyle = teleporter.color;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(teleporter.x, teleporter.y, teleporter.radius + 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawStars() {
    for (let star of this.level.stars) {
      if (star.collected) continue;
      
      star.rotation += 0.03;
      star.pulsePhase += 0.08;
      const pulse = 0.8 + 0.2 * Math.sin(star.pulsePhase);
      
      this.ctx.save();
      this.ctx.translate(star.x, star.y);
      this.ctx.rotate(star.rotation);
      this.ctx.scale(pulse, pulse);
      
      // Star glow
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      gradient.addColorStop(0, 'rgba(255, 221, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 221, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Star shape
      this.ctx.fillStyle = '#ffdd00';
      this.ctx.strokeStyle = '#ffaa00';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5;
        const x = Math.cos(angle) * 16;
        const y = Math.sin(angle) * 16;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawGoal() {
    this.level.goal.pulsePhase += 0.12;
    const active = this.level.goal.active;
    const pulse = active ? 0.6 + 0.4 * Math.sin(this.level.goal.pulsePhase) : 0.3;
    
    if (active) {
      // Goal glow
      const gradient = this.ctx.createRadialGradient(
        this.level.goal.x, this.level.goal.y, 0,
        this.level.goal.x, this.level.goal.y, this.level.goal.radius * 2
      );
      gradient.addColorStop(0, `rgba(0, 255, 0, ${pulse * 0.6})`);
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.level.goal.x, this.level.goal.y, this.level.goal.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Swirling energy
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + this.level.goal.pulsePhase;
        const innerRadius = this.level.goal.radius * 0.6;
        const outerRadius = this.level.goal.radius * 1.2;
        
        this.ctx.beginPath();
        this.ctx.arc(this.level.goal.x, this.level.goal.y, innerRadius + (outerRadius - innerRadius) * (i / 8), 
                    angle, angle + Math.PI / 6);
        this.ctx.stroke();
      }
    }
    
    // Main portal
    this.ctx.fillStyle = active ? '#00ff00' : '#333333';
    this.ctx.globalAlpha = pulse;
    this.ctx.beginPath();
    this.ctx.arc(this.level.goal.x, this.level.goal.y, this.level.goal.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    
    if (active) {
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(this.level.goal.x, this.level.goal.y, this.level.goal.radius + 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawPowerUps() {
    const powerUpColors = {
      energy: '#00ff00',
      speed: '#ff00ff',
      shield: '#ffffff',
      magnet_boost: '#00ffff'
    };
    
    for (let powerUp of this.level.powerUps) {
      if (!powerUp.active) continue;
      
      powerUp.rotation += 0.05;
      powerUp.pulsePhase += 0.1;
      const pulse = 0.7 + 0.3 * Math.sin(powerUp.pulsePhase);
      
      this.ctx.save();
      this.ctx.translate(powerUp.x, powerUp.y);
      this.ctx.rotate(powerUp.rotation);
      this.ctx.scale(pulse, pulse);
      
      // Power-up glow
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      const color = powerUpColors[powerUp.type];
      gradient.addColorStop(0, color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Power-up icon
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawBall() {
    // Ball trail
    for (let i = 0; i < this.ball.trail.length; i++) {
      const alpha = (i / this.ball.trail.length) * 0.5;
      const size = (i / this.ball.trail.length) * this.ball.radius;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = this.ball.magnetized ? '#00ccff' : '#4488aa';
      this.ctx.beginPath();
      this.ctx.arc(this.ball.trail[i].x, this.ball.trail[i].y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    
    // Ball glow
    if (this.ball.magnetized || this.ball.glowIntensity > 0) {
      const glowRadius = this.ball.radius * (2 + this.ball.glowIntensity);
      const gradient = this.ctx.createRadialGradient(
        this.ball.x, this.ball.y, 0,
        this.ball.x, this.ball.y, glowRadius
      );
      gradient.addColorStop(0, `rgba(0, 204, 255, ${this.ball.glowIntensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 204, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Main ball
    const gradient = this.ctx.createRadialGradient(
      this.ball.x - 5, this.ball.y - 5, 0,
      this.ball.x, this.ball.y, this.ball.radius
    );
    gradient.addColorStop(0, this.ball.magnetized ? '#ffffff' : '#ccddff');
    gradient.addColorStop(1, this.ball.magnetized ? '#0088ff' : '#4488aa');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Power-up effects
    if (this.powerUp) {
      const effectColors = {
        speed: '#ff00ff',
        shield: '#ffffff',
        magnet_boost: '#00ffff'
      };
      
      if (effectColors[this.powerUp.type]) {
        this.ctx.strokeStyle = effectColors[this.powerUp.type];
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
    
    // Invulnerability flash
    if (this.ball.invulnerable > 0 && Math.floor(this.ball.invulnerable / 8) % 2) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawParticles() {
    for (let particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * (0.5 + 0.5 * alpha);
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  // Audio System
  playSound(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  // Game Logic
  loseLife() {
    this.lives--;
    this.ball.invulnerable = 180;
    this.ball.x = 80;
    this.ball.y = 80;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.powerUp = null;
    this.energy = this.maxEnergy;
    
    this.createImpactParticles(this.ball.x, this.ball.y, '#ff4444');
    this.playSound(250, 0.5, 'sawtooth', 0.15);
    
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.updateUI();
    }
  }

  completeLevel() {
    this.gameState = 'levelComplete';
    const energyBonus = Math.floor(this.energy * 5);
    const timeBonus = Math.max(0, 1000 - (Date.now() - this.levelStartTime) / 1000) * 2;
    const totalBonus = energyBonus + timeBonus;
    this.score += totalBonus;
    
    document.getElementById('finalStars').textContent = this.collectedStars;
    document.getElementById('bonusScore').textContent = totalBonus;
    document.getElementById('levelCompleteModal').style.display = 'flex';
    
    this.playSound(2000, 0.6, 'sine', 0.2);
    
    this.updateUI();
  }

  nextLevel() {
    document.getElementById('levelCompleteModal').style.display = 'none';
    
    if (this.currentLevel >= 15) {
      this.victory();
      return;
    }
    
    this.loadLevel(this.currentLevel + 1);
    this.levelStartTime = Date.now();
  }

  gameOver() {
    this.gameState = 'gameOver';
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('levelsCompleted').textContent = this.currentLevel - 1;
    document.getElementById('gameOverModal').style.display = 'flex';
    
    this.playSound(150, 1.0, 'sawtooth', 0.2);
  }

  victory() {
    this.gameState = 'victory';
    document.getElementById('totalScore').textContent = this.score;
    document.getElementById('victoryModal').style.display = 'flex';
    
    // Victory fanfare
    this.playSound(523, 0.3);
    setTimeout(() => this.playSound(659, 0.3), 300);
    setTimeout(() => this.playSound(784, 0.3), 600);
    setTimeout(() => this.playSound(1047, 0.6), 900);
  }

  restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('victoryModal').style.display = 'none';
    
    this.currentLevel = 1;
    this.score = 0;
    this.lives = 3;
    this.loadLevel(1);
    this.levelStartTime = Date.now();
  }

  updateUI() {
    document.getElementById('level').textContent = this.currentLevel;
    document.getElementById('stars').textContent = this.collectedStars;
    document.getElementById('totalStars').textContent = this.level.stars.length;
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('energyPercent').textContent = Math.floor(this.energy) + '%';
    document.getElementById('energyFill').style.width = (this.energy / this.maxEnergy) * 100 + '%';
    
    const powerUpNames = {
      energy: 'Energy Boost',
      speed: 'Speed Boost',
      shield: 'Force Shield',
      magnet_boost: 'Magnet Amplifier'
    };
    
    document.getElementById('powerUpStatus').textContent = 
      this.powerUp ? powerUpNames[this.powerUp.type] : 'None';
  }

  setupEventListeners() {
    // Mouse controls
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.gameState !== 'playing') return;
      
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
      this.playSound(800, 0.1);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.active = false;
      this.playSound(600, 0.1);
    });

    // Touch controls
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.gameState !== 'playing') return;
      
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      this.mouse.active = true;
      this.playSound(800, 0.1);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mouse.active = false;
      this.playSound(600, 0.1);
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'r':
        case 'R':
          if (this.gameState === 'playing') {
            this.restartGame();
          }
          break;
        case 'h':
        case 'H':
          togglePanel('instructionsPanel');
          break;
        case 'u':
        case 'U':
          togglePanel('gameUI');
          break;
        case 'Escape':
          // Pause functionality could be added here
          break;
      }
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  // Main Game Loop
  gameLoop(timestamp) {
    this.updateBall();
    this.updateParticles();
    this.render();
    
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  start() {
    this.levelStartTime = Date.now();
    this.gameLoop();
  }
}

// Global Functions for HTML interaction
function nextLevel() {
  game.nextLevel();
}

function restartGame() {
  game.restartGame();
}

// Initialize and start the game
const game = new CosmicGame();
game.start();

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
  if (game.audioContext && game.audioContext.state === 'suspended') {
    game.audioContext.resume();
  }
}, { once: true });