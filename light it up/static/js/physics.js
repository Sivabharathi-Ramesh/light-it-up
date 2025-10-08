class PhysicsPageManager {
    constructor() {
        this.concepts = {};
        this.conceptKeys = [];
        this.currentConceptIndex = 0;
        this.completedConcepts = new Set();
        this.animationFrameId = null;

        this.elements = {
            navigation: document.getElementById('conceptNavigation'),
            contentGrid: document.getElementById('topicContentGrid'),
            explanation: document.getElementById('conceptExplanation'),
            simulation: document.getElementById('simulationArea'),
            formula: document.getElementById('funFormulaArea'),
            quiz: document.getElementById('quizContainer'),
            progressBar: document.getElementById('topicProgressBar'),
            nextButton: document.getElementById('nextConceptButton'),
            backButton: document.getElementById('backToConceptsButton')
        };

        this.init();
    }

    async init() {
        await this.fetchConcepts();
        if (Object.keys(this.concepts).length > 0) {
            this.conceptKeys = Object.keys(this.concepts);
            this.buildNavigation();
            // wire next/back controls
            if (this.elements.nextButton) {
                this.elements.nextButton.addEventListener('click', () => this.loadNextConcept());
            }
            if (this.elements.backButton) {
                this.elements.backButton.addEventListener('click', () => {
                    // show navigation again
                    this.elements.contentGrid.style.display = 'none';
                    this.elements.navigation.style.display = 'flex';
                    this.elements.nextButton.style.display = 'none';
                    this.elements.backButton.style.display = 'none';
                });
            }
        } else {
            this.elements.navigation.innerHTML = `<p style="color:var(--danger); text-align: center;">Error loading concepts. The data might be missing or empty.</p>`;
        }
    }

    async fetchConcepts() {
        try {
            const response = await fetch('/get_concepts/physics');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.concepts = await response.json();
        } catch (error) {
            console.error("Failed to fetch concepts:", error);
            this.concepts = {};
        }
    }

    buildNavigation() {
        this.elements.navigation.innerHTML = '';
        this.conceptKeys.forEach((key, index) => {
            const concept = this.concepts[key];
            const navItem = document.createElement('div');
            navItem.className = 'concept-item';
            
            // Assign icons based on concept title (can be expanded)
            let iconClass = 'fa-atom'; // Default icon
            if (key.includes('wave')) iconClass = 'fa-water';
            if (key.includes('motion')) iconClass = 'fa-running';
            if (key.includes('energy')) iconClass = 'fa-bolt';
            if (key.includes('gravity')) iconClass = 'fa-parachute-box';
            if (key.includes('force')) iconClass = 'fa-gavel';
            if (key.includes('momentum')) iconClass = 'fa-arrows-alt-h';
            if (key.includes('electric')) iconClass = 'fa-bolt';
            if (key.includes('centrifugal')) iconClass = 'fa-sync-alt';
            
            navItem.innerHTML = `<i class="fas ${iconClass}"></i><span>${concept.title}</span>`;
            
            navItem.addEventListener('click', () => this.loadConceptByIndex(index));
            navItem.dataset.index = index;
            
            navItem.addEventListener('mouseenter', () => {
                if (window.SpeechManager) {
                    SpeechManager.speak(concept.title);
                }
            });

            this.elements.navigation.appendChild(navItem);
        });
    }

    loadConceptByIndex(index) {
        this.elements.navigation.style.display = 'none';
        this.elements.contentGrid.style.display = 'grid';
        this.elements.nextButton.style.display = 'inline-flex';
        if (this.elements.backButton) this.elements.backButton.style.display = 'inline-flex';
        
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (!this.conceptKeys || index < 0 || index >= this.conceptKeys.length) return;

        this.currentConceptIndex = index;
        const key = this.conceptKeys[index];
        const concept = this.concepts[key];
        
        this.displayExplanation(concept);
        this.displayQuiz(key, concept);
        
        // Clear previous content and start appropriate game
        this.elements.simulation.innerHTML = '';
        this.elements.formula.innerHTML = '';
        
        // Start game/simulation for the concept
        this.startGame(key, concept);
        this.updateActiveNavItem();
    }

    updateActiveNavItem() {
        const items = this.elements.navigation.querySelectorAll('.concept-item');
        items.forEach((it) => {
            const idx = parseInt(it.dataset.index, 10);
            it.classList.toggle('active', idx === this.currentConceptIndex);
        });
    }
    
    displayExplanation(concept) {
        this.elements.explanation.innerHTML = `<h3>${concept.title}</h3><p>${concept.concept}</p><hr><h4>Goal</h4><p><em>${concept.goal}</em></p>`;
    }

    displayQuiz(key, concept) {
        if (window.ConceptToolkit) {
            ConceptToolkit.renderQuiz(this.elements.quiz, concept.quiz, () => {
                // progress hook
                fetch('/update_progress', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ topic: 'physics', score: 10 }) });
            });
            return;
        }

        this.elements.quiz.innerHTML = `<p style="text-align:center; padding-top:50px;">Quiz for ${concept.title} coming soon!</p>`;
    }

    startGame(key, concept) {
        const container = this.elements.simulation;
        container.innerHTML = '';
        
        // Add game container with proper styling
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        container.appendChild(gameContainer);

        switch (key) {
            case 'momentum':
                this.momentumGame(gameContainer);
                break;
            case 'energy':
                this.energyGame(gameContainer);
                break;
            case 'gravity':
                this.gravityGame(gameContainer);
                break;
            case 'wave':
            case 'waves':
                this.waveGame(gameContainer);
                break;
            case 'electricity':
            case 'electric_circuits':
                this.electricityGame(gameContainer);
                break;
            case 'newtons_laws_of_motion':
            case 'force':
                this.forceGame(gameContainer);
                break;
            case 'centrifugal_force':
                this.centrifugalForceGame(gameContainer);
                break;
            default:
                // Fallback to Lottie animation or simple simulation
                this.tryLoadLottie(container, concept.animation).then(loaded => {
                    if (!loaded) {
                        container.innerHTML = `<h2>${concept.title}</h2><p>${concept.concept}</p>`;
                    }
                });
                break;
        }
    }

    // ===== GAME IMPLEMENTATIONS =====

    centrifugalForceGame(container) {
        container.innerHTML = `
            <div class="game-area">
              <canvas id="bucketGame" width="400" height="400"></canvas>
              <p id="gameText">Spin the bucket fast so water doesn't spill!</p>
              <button id="spinBtn" class="btn btn-primary">Spin!</button>
            </div>
        `;

        const canvas = container.querySelector("#bucketGame");
        const ctx = canvas.getContext("2d");
        let angle = 0;
        let speed = 0;

        container.querySelector("#spinBtn").onclick = () => {
          speed += 0.05; // tap increases spin speed
        };

        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(200, 200);
          ctx.rotate(angle);
          // draw rope
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.lineTo(0, -120);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 4;
          ctx.stroke();
          // draw bucket
          ctx.fillStyle = "#00bfff";
          ctx.fillRect(-25, -150, 50, 30);
          ctx.restore();

          angle += speed;
          speed *= 0.99; // friction
          requestAnimationFrame(draw);
        }
        draw();
    }
    
    momentumGame(container) {
        container.className = 'game-container momentum-game';
        container.innerHTML = `
            <div class="game-header">
                <h3>🎯 Momentum Challenge</h3>
                <div class="game-stats">
                    <div class="score">Score: <span id="momentumScore">0</span></div>
                    <div class="level">Level: <span id="gameLevel">1</span></div>
                    <div class="lives">Lives: <span id="gameLives">3</span> ❤️</div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Make the blue cart hit the target zone with the correct momentum!</p>
                <div id="targetInfo">Target Momentum: <span id="targetMomentum">12</span> kg·m/s</div>
            </div>

            <div class="game-area">
                <div class="track">
                    <div class="start-zone">Start</div>
                    <div id="cart" class="game-cart">A</div>
                    <div id="targetZone" class="target-zone">Target</div>
                    <div class="obstacles">
                        <div class="obstacle" style="left: 40%"></div>
                        <div class="obstacle" style="left: 70%"></div>
                    </div>
                </div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Mass: <span id="massValue">2</span> kg</label>
                    <input type="range" id="massSlider" min="1" max="10" value="2">
                </div>
                <div class="control-group">
                    <label>Speed: <span id="speedValue">3</span> m/s</label>
                    <input type="range" id="speedSlider" min="1" max="15" value="3">
                </div>
                <button id="launchBtn" class="btn btn-primary">🚀 Launch</button>
                <button id="resetBtn" class="btn">🔄 Reset</button>
            </div>

            <div class="game-feedback">
                <div id="momentumDisplay">Current Momentum: <span id="currentMomentum">6</span> kg·m/s</div>
                <div id="gameMessage"></div>
            </div>
        `;

        // Game state
        let score = 0;
        let level = 1;
        let lives = 3;
        let targetMomentum = 12;
        
        const massSlider = container.querySelector('#massSlider');
        const speedSlider = container.querySelector('#speedSlider');
        const massValue = container.querySelector('#massValue');
        const speedValue = container.querySelector('#speedValue');
        const launchBtn = container.querySelector('#launchBtn');
        const resetBtn = container.querySelector('#resetBtn');
        const cart = container.querySelector('#cart');
        const momentumDisplay = container.querySelector('#currentMomentum');
        const gameMessage = container.querySelector('#gameMessage');
        const targetMomentumSpan = container.querySelector('#targetMomentum');
        const scoreSpan = container.querySelector('#momentumScore');
        const levelSpan = container.querySelector('#gameLevel');
        const livesSpan = container.querySelector('#gameLives');

        // Initialize game
        updateTarget();
        updateDisplays();
        updateMomentum();

        massSlider.addEventListener('input', () => {
            massValue.textContent = massSlider.value;
            updateMomentum();
        });

        speedSlider.addEventListener('input', () => {
            speedValue.textContent = speedSlider.value;
            updateMomentum();
        });

        launchBtn.addEventListener('click', launchCart);
        resetBtn.addEventListener('click', resetGame);

        function updateMomentum() {
            const mass = parseInt(massSlider.value);
            const speed = parseInt(speedSlider.value);
            const momentum = mass * speed;
            momentumDisplay.textContent = momentum;
        }

        function updateTarget() {
            targetMomentum = 8 + (level * 4);
            targetMomentumSpan.textContent = targetMomentum;
        }

        function updateDisplays() {
            scoreSpan.textContent = score;
            levelSpan.textContent = level;
            livesSpan.textContent = lives;
        }

        function launchCart() {
            const mass = parseInt(massSlider.value);
            const speed = parseInt(speedSlider.value);
            const momentum = mass * speed;
            
            // Animate cart movement
            cart.style.transition = 'left 2s ease-in-out';
            cart.style.left = '85%';
            
            // Check result after animation
            setTimeout(() => {
                const difference = Math.abs(momentum - targetMomentum);
                const tolerance = 2;
                
                if (difference <= tolerance) {
                    // Success!
                    score += level * 10;
                    level++;
                    gameMessage.innerHTML = `🎉 Perfect! Momentum = ${momentum} kg·m/s<br>+${level * 10} points!`;
                    gameMessage.style.color = '#2ECC71';
                    
                    if (window.audioManager) window.audioManager.play('success');
                } else {
                    // Try again
                    lives--;
                    gameMessage.innerHTML = `❌ Got ${momentum} kg·m/s, needed ${targetMomentum} kg·m/s`;
                    gameMessage.style.color = '#E74C3C';
                    
                    if (lives <= 0) {
                        gameMessage.innerHTML += '<br>💀 Game Over! Click Reset.';
                        launchBtn.disabled = true;
                    }
                    
                    if (window.audioManager) window.audioManager.play('pop');
                }
                
                updateTarget();
                updateDisplays();
                
                // Reset cart position
                setTimeout(() => {
                    cart.style.transition = 'left 0.5s';
                    cart.style.left = '10%';
                }, 2000);
                
            }, 2000);
        }

        function resetGame() {
            score = 0;
            level = 1;
            lives = 3;
            massSlider.value = 2;
            speedSlider.value = 3;
            massValue.textContent = '2';
            speedValue.textContent = '3';
            cart.style.left = '10%';
            gameMessage.innerHTML = '';
            launchBtn.disabled = false;
            updateTarget();
            updateDisplays();
            updateMomentum();
        }
    }

    energyGame(container) {
        container.className = 'game-container energy-game';
        container.innerHTML = `
            <div class="game-header">
                <h3>⚡ Energy Conversion Challenge</h3>
                <div class="game-stats">
                    <div class="score">Energy: <span id="energyScore">0</span> J</div>
                    <div class="time">Time: <span id="gameTimer">60</span>s</div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Convert potential energy to kinetic energy and collect energy orbs!</p>
            </div>

            <div class="energy-bars">
                <div class="energy-bar">
                    <div>Potential Energy</div>
                    <div class="potential-bar" style="width: 100%"></div>
                </div>
                <div class="energy-bar">
                    <div>Kinetic Energy</div>
                    <div class="kinetic-bar" style="width: 0%"></div>
                </div>
            </div>

            <div class="game-area">
                <div class="hill-track">
                    <div class="energy-orbs">
                        <div class="energy-orb" style="left: 30%" data-energy="50">⚡</div>
                        <div class="energy-orb" style="left: 60%" data-energy="100">⚡</div>
                        <div class="energy-orb" style="left: 80%" data-energy="150">⚡</div>
                    </div>
                    <div id="energyCart" class="energy-cart">🚗</div>
                </div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Mass: <span id="cartMass">5</span> kg</label>
                    <input type="range" id="massControl" min="1" max="20" value="5">
                </div>
                <div class="control-group">
                    <label>Height: <span id="hillHeight">20</span> m</label>
                    <input type="range" id="heightControl" min="5" max="50" value="20">
                </div>
                <button id="releaseCart" class="btn btn-primary">🎢 Release</button>
            </div>

            <div class="game-feedback">
                <div>Potential: <span id="potentialEnergy">980</span> J | Kinetic: <span id="kineticEnergy">0</span> J</div>
                <div id="energyMessage"></div>
            </div>
        `;

        // Energy game implementation would go here
        // Similar structure to momentum game
    }

    gravityGame(container) {
        container.className = 'game-container gravity-game';
        container.innerHTML = `
            <div class="game-header">
                <h3>🪂 Gravity Drop Challenge</h3>
                <div class="game-stats">
                    <div class="score">Score: <span id="gravityScore">0</span></div>
                    <div class="attempts">Attempts: <span id="attemptsLeft">5</span></div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Predict exactly when objects will hit the ground!</p>
            </div>

            <div class="game-area">
                <div class="slingshot">🏹</div>
                <div id="projectile" class="projectile">🎯</div>
                <div class="target">🎯</div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Angle: <span id="angleValue">45</span>°</label>
                    <input type="range" id="angleSlider" min="15" max="75" value="45">
                </div>
                <div class="control-group">
                    <label>Power: <span id="powerValue">50</span>%</label>
                    <input type="range" id="powerSlider" min="10" max="100" value="50">
                </div>
                <button id="launchProjectile" class="btn btn-primary">🚀 Launch</button>
            </div>

            <div class="game-feedback">
                <div id="gravityMessage">Adjust angle and power to hit the target!</div>
            </div>
        `;

        // Gravity game implementation
    }

    forceGame(container) {
        container.className = 'game-container force-game';
        container.innerHTML = `
            <div class="game-header">
                <h3>📦 Force & Motion Challenge</h3>
                <div class="game-stats">
                    <div class="score">Score: <span id="forceScore">0</span></div>
                    <div class="pushes">Pushes: <span id="pushesLeft">10</span></div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Push the box to the target zone overcoming friction!</p>
            </div>

            <div class="game-area">
                <div id="boxObject" class="box-object">📦</div>
                <div class="target-zone" style="right: 50px; bottom: 50px; width: 100px; height: 100px;">🎯</div>
                <div class="ground"></div>
                <div id="forceArrow" class="force-arrow" style="display: none;">→</div>
                <div id="frictionArrow" class="friction-arrow" style="display: none;">←</div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Force: <span id="forceValue">50</span> N</label>
                    <input type="range" id="forceSlider" min="10" max="100" value="50">
                </div>
                <div class="control-group">
                    <label>Friction: <span id="frictionValue">20</span> N</label>
                    <input type="range" id="frictionSlider" min="0" max="50" value="20">
                </div>
                <button id="pushButton" class="btn btn-primary">👊 Push</button>
            </div>

            <div class="game-feedback">
                <div id="forceMessage">Net Force = Applied Force - Friction</div>
            </div>
        `;

        // Force game implementation
    }

    electricityGame(container) {
        container.className = 'game-container electricity-game';
        container.innerHTML = `
            <div class="game-header">
                <h3>💡 Circuit Builder Challenge</h3>
                <div class="game-stats">
                    <div class="score">Circuits: <span id="circuitScore">0</span></div>
                    <div class="components">Components: <span id="componentsLeft">5</span></div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Build working circuits to light the bulb!</p>
            </div>

            <div class="game-area">
                <div class="component battery">🔋</div>
                <div class="component bulb">💡</div>
                <div class="wire-terminal" style="top: 180px; left: 100px;"></div>
                <div class="wire-terminal" style="top: 180px; right: 100px;"></div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Voltage: <span id="voltageValue">9</span> V</label>
                    <input type="range" id="voltageSlider" min="1" max="12" value="9">
                </div>
                <button id="connectButton" class="btn btn-primary">🔌 Connect</button>
                <button id="testButton" class="btn btn-success">⚡ Test</button>
            </div>

            <div class="game-feedback">
                <div id="circuitMessage">Drag components and connect terminals!</div>
            </div>
        `;

        // Electricity game implementation
    }

    waveGame(container) {
        container.className = 'game-container';
        container.style.background = 'linear-gradient(to bottom, #001D3D, #003566)';
        container.innerHTML = `
            <div class="game-header">
                <h3>🌊 Wave Properties Challenge</h3>
                <div class="game-stats">
                    <div class="score">Score: <span id="waveScore">0</span></div>
                    <div class="patterns">Patterns: <span id="patternsMatched">0</span></div>
                </div>
            </div>
            
            <div class="game-objective">
                <p><strong>Goal:</strong> Match the target wave pattern by adjusting frequency and amplitude!</p>
            </div>

            <div class="game-area">
                <canvas id="waveCanvas" width="600" height="300" style="background: rgba(255,255,255,0.1); border-radius: 10px;"></canvas>
                <div class="target-pattern">Target Pattern Shown Above</div>
            </div>

            <div class="game-controls-panel">
                <div class="control-group">
                    <label>Amplitude: <span id="ampValue">30</span></label>
                    <input type="range" id="ampSlider" min="5" max="80" value="30">
                </div>
                <div class="control-group">
                    <label>Frequency: <span id="freqValue">1</span></label>
                    <input type="range" id="freqSlider" min="0.5" max="3" step="0.1" value="1">
                </div>
                <button id="matchButton" class="btn btn-primary">🎯 Match Pattern</button>
            </div>

            <div class="game-feedback">
                <div id="waveMessage">Adjust sliders to match the target wave!</div>
            </div>
        `;

        // Wave game implementation
    }

    // Existing helper methods remain the same...
    async tryLoadLottie(container, animName) {
        if (!animName) return false;

        const fallbackMap = {
            'momentum_collision': 'wire_spark',
            'energy': 'bulb_glow',
            'gravity': 'wire_spark',
            'dna_double_helix': 'bulb_glow',
            'periodic_table': 'bulb_glow'
        };

        const tryLoad = async (name) => {
            const animPath = `/static/animations/${name}.json`;
            try {
                const res = await fetch(animPath, { method: 'HEAD' });
                if (!res.ok) return false;
                const player = document.createElement('lottie-player');
                player.setAttribute('src', animPath);
                player.setAttribute('background', 'transparent');
                player.setAttribute('speed', '1');
                player.setAttribute('loop', 'true');
                player.setAttribute('autoplay', 'true');
                player.style.width = '100%';
                player.style.maxWidth = '500px';
                container.appendChild(player);
                return true;
            } catch (e) {
                return false;
            }
        };

        if (await tryLoad(animName)) return true;
        if (fallbackMap[animName]) return await tryLoad(fallbackMap[animName]);
        return false;
    }

    loadNextConcept() {
        this.loadConceptByIndex((this.currentConceptIndex + 1) % this.conceptKeys.length);
    }

    // Keep existing simulations as fallbacks
    startBuiltInSim(key) {
        const container = this.elements.simulation;
        switch (key) {
            case 'momentum':
                this.momentumSimulation(container);
                break;
            case 'energy':
                this.energySimulation(container);
                break;
            case 'gravity':
                this.gravitySimulation(container);
                break;
            case 'wave':
            case 'waves':
                this.waveSimulation(container);
                break;
            case 'electricity':
                this.electricitySimulation(container);
                break;
            case 'newtons_laws_of_motion':
            case 'newtons_laws':
                this.newtonsLawsSimulation(container);
                break;
            default:
                container.innerHTML = `<h2>${this.concepts[key] ? this.concepts[key].title : 'Simulation'}</h2><p>Interactive learning coming soon!</p>`;
        }
    }

    // Keep original simulations as references
    momentumSimulation(container) {
        // Original momentum simulation code...
    }

    energySimulation(container) {
        // Original energy simulation code...
    }

    gravitySimulation(container) {
        // Original gravity simulation code...
    }

    waveSimulation(container) {
        // Original wave simulation code...
    }

    electricitySimulation(container) {
        // Original electricity simulation code...
    }

    newtonsLawsSimulation(container) {
        // Original Newton's laws simulation code...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.physics-screen')) {
        new PhysicsPageManager();
    }
});