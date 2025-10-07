// Enhanced Motion Simulations with Animations and Sound
class MotionSimulations {
    constructor() {
        this.currentSimulation = null;
        this.animations = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSimulations();
    }

    setupEventListeners() {
        // Simulation control events
        document.addEventListener('start-motion-simulation', (e) => {
            this.startSimulation(e.detail.type, e.detail.options);
        });

        document.addEventListener('stop-motion-simulation', () => {
            this.stopCurrentSimulation();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') { // Space bar to pause/resume
                this.togglePause();
            }
        });
    }

    initializeSimulations() {
        this.simulations = {
            speed: this.speedSimulation.bind(this),
            acceleration: this.accelerationSimulation.bind(this),
            gravity: this.gravitySimulation.bind(this),
            pendulum: this.pendulumSimulation.bind(this),
            collision: this.collisionSimulation.bind(this),
            projectile: this.projectileSimulation.bind(this),
            circular: this.circularMotionSimulation.bind(this)
        };
    }

    startSimulation(type, options = {}) {
        this.stopCurrentSimulation();
        
        const simulation = this.simulations[type];
        if (simulation) {
            this.currentSimulation = type;
            simulation(options);
            
            // Play appropriate sound
            if (window.audioManager) {
                switch(type) {
                    case 'collision':
                        window.audioManager.play('collision', { impactStrength: options.strength || 1 });
                        break;
                    case 'pendulum':
                        window.audioManager.play('spring');
                        break;
                    default:
                        window.audioManager.play('click');
                }
            }
        }
    }

    stopCurrentSimulation() {
        if (this.currentSimulation) {
            AnimationManager.stopAnimation(this.currentSimulation);
            this.currentSimulation = null;
        }
    }

    togglePause() {
        if (this.currentSimulation) {
            const animationId = AnimationManager.animations.get(this.currentSimulation);
            if (animationId) {
                AnimationManager.stopAnimation(this.currentSimulation);
            } else {
                // Restart the simulation
                this.startSimulation(this.currentSimulation);
            }
        }
    }

    // Individual Simulations
    speedSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        // Clear previous content
        container.innerHTML = `
            <div class="car" id="speedCar" style="left: 50px; top: 100px;"></div>
            <div class="road" style="position: absolute; bottom: 50px; width: 100%; height: 10px; background: #7f8c8d;"></div>
            <div class="speed-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Speed: <span id="speedValue">0</span> m/s
            </div>
        `;

        const car = document.getElementById('speedCar');
        const speedValue = document.getElementById('speedValue');
        
        let position = 50;
        const speed = options.speed || 5;
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;
            
            position += speed * deltaTime * 60; // Normalize to 60fps
            
            if (position > container.offsetWidth - 100) {
                position = 50;
                
                // Play reset sound
                if (window.audioManager) {
                    window.audioManager.play('pop');
                }
            }
            
            car.style.left = `${position}px`;
            speedValue.textContent = speed.toFixed(1);
            
            // Add visual effects at different speeds
            if (speed > 8) {
                car.classList.add('pulse-glow');
            } else {
                car.classList.remove('pulse-glow');
            }
            
            AnimationManager.startAnimation('speed', animate);
        };
        
        animate(performance.now());
    }

    accelerationSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="ball" id="accelerationBall" style="left: 50px; top: 100px;"></div>
            <div class="ramp" style="position: absolute; bottom: 0; width: 100%; height: 100px; background: linear-gradient(to top, #34495e, #2c3e50);"></div>
            <div class="acceleration-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Acceleration: <span id="accelerationValue">0</span> m/s²<br>
                Velocity: <span id="velocityValue">0</span> m/s
            </div>
        `;

        const ball = document.getElementById('accelerationBall');
        const accelerationValue = document.getElementById('accelerationValue');
        const velocityValue = document.getElementById('velocityValue');
        
        let position = 50;
        let velocity = 0;
        const acceleration = options.acceleration || 2;
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            velocity += acceleration * deltaTime * 60;
            position += velocity * deltaTime * 60;
            
            if (position > container.offsetWidth - 50) {
                position = 50;
                velocity = 0;
                
                // Play reset sound
                if (window.audioManager) {
                    window.audioManager.play('collision', { impactStrength: velocity / 10 });
                }
            }
            
            ball.style.left = `${position}px`;
            accelerationValue.textContent = acceleration.toFixed(1);
            velocityValue.textContent = velocity.toFixed(1);
            
            // Visual feedback based on velocity
            const scale = 1 + (velocity * 0.01);
            ball.style.transform = `scale(${Math.min(scale, 1.5)})`;
            
            AnimationManager.startAnimation('acceleration', animate);
        };
        
        animate(performance.now());
    }

    gravitySimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="ball falling-object" id="gravityBall" style="left: 200px; top: 50px;"></div>
            <div class="ground" style="position: absolute; bottom: 0; width: 100%; height: 20px; background: #27ae60;"></div>
            <div class="gravity-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Height: <span id="heightValue">300</span> m<br>
                Velocity: <span id="gravityVelocity">0</span> m/s
            </div>
        `;

        const ball = document.getElementById('gravityBall');
        const heightValue = document.getElementById('heightValue');
        const gravityVelocity = document.getElementById('gravityVelocity');
        
        let position = 50;
        let velocity = 0;
        const gravity = 9.8 * (options.gravity || 1);
        const containerHeight = container.offsetHeight - 70; // Account for ball size and ground
        let lastTime = performance.now();
        let bounceCount = 0;
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Apply gravity
            velocity += gravity * deltaTime * 60;
            position += velocity * deltaTime * 60;
            
            // Check for ground collision
            if (position >= containerHeight) {
                position = containerHeight;
                velocity = -velocity * 0.7; // Bounce with energy loss
                bounceCount++;
                
                // Play bounce sound
                if (window.audioManager) {
                    window.audioManager.play('collision', { impactStrength: Math.min(velocity / 5, 2) });
                }
                
                // Stop after too many bounces
                if (bounceCount > 10 || Math.abs(velocity) < 5) {
                    position = 50;
                    velocity = 0;
                    bounceCount = 0;
                    
                    // Reset animation
                    setTimeout(() => {
                        position = 50;
                        velocity = 0;
                    }, 1000);
                }
            }
            
            ball.style.top = `${position}px`;
            heightValue.textContent = (containerHeight - position).toFixed(0);
            gravityVelocity.textContent = Math.abs(velocity).toFixed(1);
            
            // Squash effect on impact
            if (position >= containerHeight - 5) {
                ball.style.transform = `scale(${1 - (velocity * 0.01)}, ${1 + (velocity * 0.02)})`;
            } else {
                ball.style.transform = 'scale(1)';
            }
            
            AnimationManager.startAnimation('gravity', animate);
        };
        
        animate(performance.now());
    }

    pendulumSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="pendulum swing-pendulum" id="pendulum" style="left: 50%; top: 50px;">
                <div class="pendulum-ball"></div>
            </div>
            <div class="energy-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Kinetic Energy: <span id="kineticEnergy">0</span> J<br>
                Potential Energy: <span id="potentialEnergy">10</span> J
            </div>
        `;

        const pendulum = document.getElementById('pendulum');
        const kineticEnergy = document.getElementById('kineticEnergy');
        const potentialEnergy = document.getElementById('potentialEnergy');
        
        let angle = options.angle || 30;
        let angularVelocity = 0;
        const damping = options.damping || 0.99;
        const gravity = 9.8;
        const length = 200; // pixels
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Physics calculations
            const angularAcceleration = (-gravity / length) * Math.sin(angle * Math.PI / 180);
            angularVelocity += angularAcceleration * deltaTime * 60;
            angularVelocity *= damping; // Apply damping
            angle += angularVelocity * deltaTime * 60;
            
            pendulum.style.transform = `rotate(${angle}deg)`;
            
            // Energy calculations
            const height = length * (1 - Math.cos(angle * Math.PI / 180));
            const pe = gravity * height;
            const ke = 0.5 * angularVelocity * angularVelocity;
            
            kineticEnergy.textContent = ke.toFixed(2);
            potentialEnergy.textContent = pe.toFixed(2);
            
            // Sound effects at extremes
            if (Math.abs(angle) > 25 && Math.abs(angularVelocity) > 10) {
                if (window.audioManager && Math.abs(angle) > 29) {
                    window.audioManager.play('spring');
                }
            }
            
            AnimationManager.startAnimation('pendulum', animate);
        };
        
        animate(performance.now());
    }

    collisionSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="ball" id="ball1" style="left: 100px; top: 150px; background: radial-gradient(circle at 30% 30%, #e74c3c, #c0392b);"></div>
            <div class="ball" id="ball2" style="left: 300px; top: 150px; background: radial-gradient(circle at 30% 30%, #3498db, #2980b9);"></div>
            <div class="momentum-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Total Momentum: <span id="totalMomentum">10</span> kg·m/s
            </div>
        `;

        const ball1 = document.getElementById('ball1');
        const ball2 = document.getElementById('ball2');
        const totalMomentum = document.getElementById('totalMomentum');
        
        // Physics properties
        const balls = [
            { element: ball1, x: 100, vx: options.velocity1 || 5, mass: options.mass1 || 2, radius: 30 },
            { element: ball2, x: 300, vx: options.velocity2 || -3, mass: options.mass2 || 1, radius: 20 }
        ];
        
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update positions
            balls.forEach(ball => {
                ball.x += ball.vx * deltaTime * 60;
                ball.element.style.left = `${ball.x}px`;
            });
            
            // Check for collision
            const ball1 = balls[0];
            const ball2 = balls[1];
            const distance = Math.abs(ball1.x - ball2.x);
            const minDistance = ball1.radius + ball2.radius;
            
            if (distance < minDistance) {
                // Elastic collision calculation
                const v1f = ((ball1.mass - ball2.mass) * ball1.vx + 2 * ball2.mass * ball2.vx) / (ball1.mass + ball2.mass);
                const v2f = ((ball2.mass - ball1.mass) * ball2.vx + 2 * ball1.mass * ball1.vx) / (ball1.mass + ball2.mass);
                
                ball1.vx = v1f;
                ball2.vx = v2f;
                
                // Separate balls to prevent sticking
                const overlap = minDistance - distance;
                ball1.x -= overlap / 2;
                ball2.x += overlap / 2;
                
                // Play collision sound
                if (window.audioManager) {
                    const impactStrength = Math.abs(ball1.vx - ball2.vx) / 10;
                    window.audioManager.play('collision', { impactStrength });
                }
                
                // Visual effect
                ball1.classList.add('pulse-glow');
                ball2.classList.add('pulse-glow');
                setTimeout(() => {
                    ball1.classList.remove('pulse-glow');
                    ball2.classList.remove('pulse-glow');
                }, 300);
            }
            
            // Boundary collisions
            balls.forEach(ball => {
                if (ball.x < ball.radius || ball.x > container.offsetWidth - ball.radius) {
                    ball.vx = -ball.vx * 0.9; // Energy loss on wall collision
                    
                    if (window.audioManager) {
                        window.audioManager.play('pop');
                    }
                }
            });
            
            // Calculate total momentum
            const momentum = balls.reduce((total, ball) => 
                total + Math.abs(ball.mass * ball.vx), 0
            );
            totalMomentum.textContent = momentum.toFixed(2);
            
            AnimationManager.startAnimation('collision', animate);
        };
        
        animate(performance.now());
    }

    projectileSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="ball" id="projectile" style="left: 50px; top: 250px;"></div>
            <div class="ground" style="position: absolute; bottom: 0; width: 100%; height: 20px; background: #27ae60;"></div>
            <div class="trajectory" style="position: absolute; bottom: 20px; width: 100%; height: 2px; background: rgba(255,255,255,0.3);"></div>
            <div class="projectile-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Angle: <span id="projectileAngle">45</span>°<br>
                Velocity: <span id="projectileVelocity">20</span> m/s<br>
                Range: <span id="projectileRange">0</span> m
            </div>
        `;

        const projectile = document.getElementById('projectile');
        const angleDisplay = document.getElementById('projectileAngle');
        const velocityDisplay = document.getElementById('projectileVelocity');
        const rangeDisplay = document.getElementById('projectileRange');
        
        let x = 50;
        let y = 250;
        const angle = (options.angle || 45) * Math.PI / 180;
        let velocity = options.velocity || 20;
        let vx = velocity * Math.cos(angle);
        let vy = -velocity * Math.sin(angle); // Negative because y increases downward
        const gravity = 9.8;
        const groundLevel = container.offsetHeight - 70;
        let lastTime = performance.now();
        let hasLanded = false;
        
        const animate = (currentTime) => {
            if (hasLanded) return;
            
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update velocity
            vy += gravity * deltaTime * 60;
            
            // Update position
            x += vx * deltaTime * 60;
            y += vy * deltaTime * 60;
            
            // Check for landing
            if (y >= groundLevel) {
                y = groundLevel;
                hasLanded = true;
                
                // Play landing sound
                if (window.audioManager) {
                    window.audioManager.play('collision', { impactStrength: Math.abs(vy) / 20 });
                }
                
                // Show range
                const range = x - 50;
                rangeDisplay.textContent = range.toFixed(1);
                
                // Reset after delay
                setTimeout(() => {
                    x = 50;
                    y = 250;
                    vy = -velocity * Math.sin(angle);
                    hasLanded = false;
                }, 2000);
                
                return;
            }
            
            projectile.style.left = `${x}px`;
            projectile.style.top = `${y}px`;
            
            // Update displays
            angleDisplay.textContent = (options.angle || 45);
            velocityDisplay.textContent = velocity.toFixed(1);
            
            // Add trail effect
            const trail = document.createElement('div');
            trail.className = 'particle';
            trail.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                pointer-events: none;
            `;
            container.appendChild(trail);
            
            // Remove old trails
            setTimeout(() => {
                if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                }
            }, 1000);
            
            AnimationManager.startAnimation('projectile', animate);
        };
        
        animate(performance.now());
    }

    circularMotionSimulation(options = {}) {
        const container = document.getElementById('motionSimulation');
        if (!container) return;

        container.innerHTML = `
            <div class="gravity-well" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
                <div class="ball spin" id="orbitingBall" style="position: absolute;"></div>
            </div>
            <div class="circular-display" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                Angular Velocity: <span id="angularVelocity">1</span> rad/s<br>
                Centripetal Force: <span id="centripetalForce">10</span> N
            </div>
        `;

        const orbitingBall = document.getElementById('orbitingBall');
        const angularVelocityDisplay = document.getElementById('angularVelocity');
        const centripetalForceDisplay = document.getElementById('centripetalForce');
        
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        const radius = options.radius || 100;
        let angle = 0;
        const angularVelocity = options.angularVelocity || 1;
        const mass = options.mass || 1;
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update angle
            angle += angularVelocity * deltaTime * 60;
            if (angle > 2 * Math.PI) angle -= 2 * Math.PI;
            
            // Calculate position
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            orbitingBall.style.left = `${x - 15}px`;
            orbitingBall.style.top = `${y - 15}px`;
            
            // Calculate centripetal force: F = m * ω² * r
            const centripetalForce = mass * angularVelocity * angularVelocity * radius;
            
            angularVelocityDisplay.textContent = angularVelocity.toFixed(2);
            centripetalForceDisplay.textContent = centripetalForce.toFixed(2);
            
            // Visual effects
            const forceScale = 1 + (centripetalForce * 0.01);
            orbitingBall.style.transform = `scale(${Math.min(forceScale, 1.5)})`;
            
            AnimationManager.startAnimation('circular', animate);
        };
        
        animate(performance.now());
    }
}

// Initialize motion simulations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.motionSimulations = new MotionSimulations();
});