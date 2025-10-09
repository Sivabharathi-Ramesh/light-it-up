class PhysicsPageManager {
    constructor() {
        this.concepts = {};
        this.conceptKeys = [];
        this.currentConceptIndex = 0;
        this.completedConcepts = new Set();
        this.animationFrameId = null;
        this.formulas = {};

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
        await this.fetchFormulas();
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

    async fetchFormulas() {
        try {
            const response = await fetch('/static/data/formulas.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.formulas = await response.json();
        } catch (error) {
            console.error("Failed to fetch formulas:", error);
            this.formulas = {};
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
            if (key.includes('thermodynamics')) iconClass = 'fa-thermometer-half';
            if (key.includes('optics')) iconClass = 'fa-eye';
            if (key.includes('newtons_laws_of_motion')) iconClass = 'fa-apple-alt';
            
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
        this.displayFunFormula(concept, key); // Pass key to identify concept
        this.displayQuiz(key, concept);
        
        // Clear previous content and start appropriate game
        this.elements.simulation.innerHTML = '';
        
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

    displayFunFormula(concept, key) {
        const formulaContainer = this.elements.formula;
        formulaContainer.innerHTML = ''; // Clear previous formula

        let formulaData = null;

        if (this.formulas.motion && key === 'newtons_laws_of_motion') {
            formulaData = this.formulas.motion.find(f => f.name.toLowerCase() === "newton's second law");
        } else if (this.formulas.motion) {
            formulaData = this.formulas.motion.find(f => f.name.toLowerCase() === key.replace(/_/g, ' '));
        }
        if (!formulaData && this.formulas.energy) {
            formulaData = this.formulas.energy.find(f => f.name.toLowerCase() === key.replace(/_/g, ' '));
        }
        if (!formulaData && this.formulas.electricity) {
            formulaData = this.formulas.electricity.find(f => f.name.toLowerCase() === key.replace(/_/g, ' '));
        }
        if (!formulaData && this.formulas.thermodynamics) {
            formulaData = this.formulas.thermodynamics.find(f => f.name.toLowerCase() === key.replace(/_/g, ' '));
        }
        if (!formulaData && this.formulas.optics) {
            formulaData = this.formulas.optics.find(f => f.name.toLowerCase() === key.replace(/_/g, ' '));
        }


        if (formulaData) {
            let breakdownHtml = Object.entries(formulaData.variables).map(([part, description], index) => `
                <li style="animation-delay: ${index * 0.2}s">
                    <div class="formula-part">${part}</div>
                    <div class="formula-desc">${description}</div>
                </li>
            `).join('');

            formulaContainer.innerHTML = `
                <h3>The Secret Formula! 🤫</h3>
                <div class="formula-display">${formulaData.formula}</div>
                <ul class="formula-breakdown">${breakdownHtml}</ul>
            `;
        } else {
            formulaContainer.innerHTML = '<p style="text-align:center; padding-top:50px;">No formula for this one!</p>';
        }
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
            case 'longitudinal_wave':
                this.longitudinalWaveGame(gameContainer);
                break;
            case 'newtons_laws_of_motion':
                this.newtonsLawsGame(gameContainer);
                break;
            case 'motion':
                this.motionGame(gameContainer);
                break;
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
                 this.staticElectricityGame(gameContainer);
                 break;
            case 'electric_circuits':
                this.electricityGame(gameContainer, concept);
                break;
            case 'force':
                this.forceGame(gameContainer);
                break;
            case 'centrifugal_force':
                this.centrifugalForceGame(gameContainer);
                break;
            case 'conservation_of_energy':
                this.conservationOfEnergyGame(gameContainer);
                break;
            case 'electromagnetism':
                this.electromagneticSpectrumGame(gameContainer);
                break;
            case 'doppler_effect':
                this.dopplerEffectGame(gameContainer);
                break;
            case 'thermodynamics':
                this.thermodynamicsGame(gameContainer);
                break;
            case 'optics':
                this.opticsGame(gameContainer);
                break;
            case 'unit_of_measurement':
                this.unitMatchingGame(gameContainer);
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
    longitudinalWaveGame(container) {
        container.innerHTML = `
            <div class="game-area" style="text-align:center;color:white;">
                <h2>🔊 Sound Wave Simulator</h2>
                <p>Click the button to create a sound wave and see how it travels.</p>
                <canvas id="waveCanvas" width="500" height="200" style="background:#0d1b2a;border-radius:10px;margin-top:10px;"></canvas>
                <button id="pulseBtn" class="btn btn-primary">Create Pulse</button>
            </div>
        `;

        const canvas = container.querySelector("#waveCanvas");
        const ctx = canvas.getContext("2d");
        const pulseBtn = container.querySelector("#pulseBtn");

        let particles = [];
        const numParticles = 50;
        const spacing = 400 / numParticles;

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: 50 + i * spacing,
                y: 100,
                baseX: 50 + i * spacing
            });
        }

        let time = 0;
        let pulseTime = -1000;

        pulseBtn.onclick = () => {
            pulseTime = time;
        };

        const draw = () => {
            if (!this.elements.contentGrid.contains(canvas)) {
                if(this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }

            ctx.clearRect(0, 0, 500, 200);

            particles.forEach((p, i) => {
                const wave = Math.sin(time * 0.1 + i * 0.5) * 10;
                const pulse = Math.exp(-Math.pow(time - (pulseTime + i * 2), 2) / 100) * 20;
                p.x = p.baseX + wave + pulse;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${180 + wave * 2}, 100%, 70%)`;
                ctx.fill();
            });

            time++;
            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    newtonsLawsGame(container) {
        container.innerHTML = `
            <div class="game-area" style="text-align:center;color:white;">
                <h2>🚀 Rocket Science - Newton's Third Law</h2>
                <p>Click the button to apply force and see the equal and opposite reaction!</p>
                <canvas id="newtonGame" width="500" height="300" style="background:#0d1b2a;border-radius:10px;margin-top:10px;"></canvas>
                <button id="applyForceBtn" class="btn btn-primary">Apply Force 🔥</button>
            </div>
        `;

        const canvas = container.querySelector("#newtonGame");
        const ctx = canvas.getContext("2d");
        let rocket = { x: 250, y: 250, vy: 0, thrust: 0 };
        let particles = [];

        const applyForceBtn = container.querySelector("#applyForceBtn");
        applyForceBtn.onclick = () => {
            rocket.thrust = -0.2;
            // Create exhaust particles
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: rocket.x,
                    y: rocket.y + 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 5 + 5,
                    alpha: 1
                });
            }
        };

        const draw = () => {
            if (!this.elements.contentGrid.contains(canvas)) {
                if(this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }

            ctx.clearRect(0, 0, 500, 300);

            // Apply thrust and gravity
            rocket.vy += rocket.thrust;
            rocket.vy += 0.05; // Gravity
            rocket.y += rocket.vy;

            // Reset thrust
            rocket.thrust = 0;

            // Bounce off top and bottom
            if (rocket.y < 20) {
                rocket.y = 20;
                rocket.vy *= -0.5;
            }
            if (rocket.y > 250) {
                rocket.y = 250;
                rocket.vy = 0;
            }

            // Draw rocket
            ctx.font = "40px sans-serif";
            ctx.fillText("🚀", rocket.x - 20, rocket.y);

            // Draw and update particles
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.05;
                if (p.alpha <= 0) {
                    particles.splice(index, 1);
                }
                ctx.fillStyle = `rgba(255, 165, 0, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
            
            this.animationFrameId = requestAnimationFrame(draw);
        };
        draw();
    }
    
    motionGame(container) {
        container.innerHTML = `
            <div style="text-align:center;color:white;">
              <h2>🏎️ Speed Racer - Motion Game</h2>
              <p>Adjust the car’s speed and see how distance changes over time!</p>
              <label>⚙️ Speed (m/s):</label>
              <input type="range" id="speedSlider" min="10" max="100" value="40" style="width:250px;">
              <span id="speedVal">40</span>
              <button id="startBtn" style="margin-left:10px;">▶️ Start</button>
              <canvas id="motionGame" width="500" height="250" style="background:#0d1b2a;border-radius:10px;margin-top:10px;"></canvas>
              <p id="stats" style="margin-top:5px;"></p>
            </div>
        `;
    
        const canvas = container.querySelector("#motionGame");
        const ctx = canvas.getContext("2d");
        let x = 50, startTime = null, running = false, speed = 40;
    
        const speedSlider = container.querySelector("#speedSlider");
        const speedVal = container.querySelector("#speedVal");
        const startBtn = container.querySelector("#startBtn");
        const stats = container.querySelector("#stats");
    
        speedSlider.oninput = e => {
            speed = parseInt(e.target.value);
            speedVal.textContent = speed;
        };
    
        startBtn.onclick = () => {
            x = 50;
            startTime = performance.now();
            running = true;
        };
    
        function drawCar() {
            ctx.fillStyle = "#ffea00";
            ctx.fillRect(x, 180, 40, 20);
            ctx.beginPath();
            ctx.arc(x + 10, 200, 6, 0, Math.PI * 2);
            ctx.arc(x + 30, 200, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#333";
            ctx.fill();
        }
    
        const drawMotion = () => {
            if (!this.elements.contentGrid.contains(canvas)) {
                if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }
            
            ctx.clearRect(0, 0, 500, 250);
            ctx.fillStyle = "#fff";
            ctx.font = "16px 'Comic Sans MS'";
            ctx.fillText("🏁 Finish Line", 420, 170);
            ctx.strokeStyle = "#ff5252";
            ctx.beginPath();
            ctx.moveTo(450, 150);
            ctx.lineTo(450, 210);
            ctx.stroke();
    
            drawCar();
    
            if (running) {
                let time = (performance.now() - startTime) / 1000; // seconds
                x = 50 + speed * (time / 5); // scaled motion
                stats.textContent = `⏱️ Time: ${time.toFixed(1)} s | 🛣️ Distance: ${(x - 50).toFixed(1)} m`;
                if (x >= 450) {
                    running = false;
                    stats.textContent += " ✅ Reached Finish Line!";
                }
            }
            this.animationFrameId = requestAnimationFrame(drawMotion);
        }
        drawMotion();
    }

    opticsGame(container) {
        container.innerHTML = `
            <div style="text-align:center;color:white;">
              <h2>🌈 Color Splitter - Prism Game</h2>
              <p>Use the slider to rotate the prism and create a rainbow!</p>
              <label>🔄 Prism Angle:</label>
              <input type="range" id="prismAngle" min="20" max="70" value="40" style="width:250px;">
              <span id="angleVal">40°</span>
              <canvas id="prismGame" width="500" height="300" style="background:#0d1b2a;border-radius:10px;margin-top:10px;"></canvas>
            </div>
        `;
    
        const prismCanvas = container.querySelector("#prismGame");
        const ctx = prismCanvas.getContext("2d");
        const angleSlider = container.querySelector("#prismAngle");
        const angleVal = container.querySelector("#angleVal");
    
        function drawPrism(angle) {
            ctx.clearRect(0, 0, 500, 300);
    
            // White light beam (before prism)
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(50, 150);
            ctx.lineTo(200, 150);
            ctx.stroke();
    
            // Prism (triangle)
            ctx.save();
            ctx.translate(250, 150);
            ctx.rotate((angle - 40) * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(-40, 40);
            ctx.lineTo(40, 40);
            ctx.lineTo(0, -40);
            ctx.closePath();
            ctx.fillStyle = "rgba(173,216,230,0.4)";
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
    
            // Dispersed rainbow beams
            const spread = (angle - 40) * 1.5;
            const colors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8f00ff"];
            colors.forEach((col, i) => {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.moveTo(250, 150);
                ctx.lineTo(450, 150 - (i - 3) * spread);
                ctx.stroke();
            });
    
            // Feedback
            angleVal.textContent = `${angle}°`;
            ctx.fillStyle = "#fff";
            ctx.font = "14px sans-serif";
            if (angle >= 38 && angle <= 44) {
                ctx.fillStyle = "#00e676";
                ctx.fillText("🌈 Perfect Rainbow Formed!", 160, 270);
            } else {
                ctx.fillText("Adjust the angle to make the rainbow clear!", 120, 270);
            }
        }
    
        angleSlider.addEventListener("input", e => {
            drawPrism(parseInt(e.target.value));
        });
    
        drawPrism(40);
    }

    unitMatchingGame(container) {
        container.innerHTML = `
            <div class="game-area">
              <h3>🎯 Match the Unit to Its Quantity!</h3>
              <div style="display:flex;gap:15px;justify-content:center;">
                <div draggable="true" class="unitCard" data-type="m">📏 meter (m)</div>
                <div draggable="true" class="unitCard" data-type="kg">⚖️ kilogram (kg)</div>
                <div draggable="true" class="unitCard" data-type="s">⏱️ second (s)</div>
                <div draggable="true" class="unitCard" data-type="A">⚡ ampere (A)</div>
              </div>
              <div style="margin-top:15px;display:flex;gap:20px;justify-content:center;">
                <div class="target" data-accept="m">Length</div>
                <div class="target" data-accept="kg">Mass</div>
                <div class="target" data-accept="s">Time</div>
                <div class="target" data-accept="A">Electric Current</div>
              </div>
              <p id="matchFeedback" style="text-align:center;"></p>
            </div>
        `;
    
        let draggedItem = null;
        container.querySelectorAll(".unitCard").forEach(card => {
            card.style.border = "2px solid #fff";
            card.style.padding = "10px";
            card.style.cursor = "grab";
            card.ondragstart = () => draggedItem = card;
        });
        container.querySelectorAll(".target").forEach(t => {
            t.style.border = "2px dashed #fff";
            t.style.padding = "15px";
            t.ondragover = e => e.preventDefault();
            t.ondrop = e => {
                if (draggedItem.dataset.type === t.dataset.accept) {
                    t.style.background = "#00e676";
                    container.querySelector("#matchFeedback").textContent = "✅ Correct!";
                } else {
                    t.style.background = "#f44336";
                    container.querySelector("#matchFeedback").textContent = "❌ Try again!";
                }
            };
        });
    }

    thermodynamicsGame(container) {
        container.innerHTML = `
            <div class="game-area" style="text-align:center;color:white;">
              <h2>🔥 Heat It Up! - Thermodynamics Game</h2>
              <p>Move the slider to change the temperature — watch molecules move faster or slower!</p>
              <label>🌡️ Temperature:</label>
              <input type="range" id="tempSlider" min="1" max="10" value="5" style="width:200px;">
              <span id="tempVal">5</span><br>
              <canvas id="heatGame" width="500" height="300" style="background:#0d1b2a;border-radius:10px;margin-top:10px;"></canvas>
            </div>
        `;
    
        const canvas = container.querySelector("#heatGame");
        const ctx = canvas.getContext("2d");
        let temp = 5;
    
        const tempSlider = container.querySelector("#tempSlider");
        const tempVal = container.querySelector("#tempVal");
    
        tempSlider.oninput = e => {
            temp = e.target.value;
            tempVal.textContent = temp;
        };
    
        let particles = [];
        for (let i = 0; i < 25; i++) {
            particles.push({
                x: Math.random() * 500,
                y: Math.random() * 300,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
    
        const draw = () => {
            if (!this.elements.contentGrid.contains(canvas)) {
                if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }
    
            ctx.clearRect(0, 0, 500, 300);
    
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 3;
            ctx.strokeRect(5, 5, 490, 290);
            ctx.fillStyle = "#fff";
            ctx.font = "16px 'Comic Sans MS'";
            ctx.fillText("🔥 Higher temperature = faster molecules!", 110, 20);
    
            particles.forEach(p => {
                p.x += p.vx * temp * 0.3;
                p.y += p.vy * temp * 0.3;
                if (p.x < 10 || p.x > 490) p.vx *= -1;
                if (p.y < 10 || p.y > 290) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${200 + temp * 10},100%,60%)`;
                ctx.fill();
            });
    
            this.animationFrameId = requestAnimationFrame(draw);
        }
        draw();
    }

    dopplerEffectGame(container) {
        container.innerHTML = `
            <div class="game-area doppler-game">
                <div id="ambulance">🚑</div>
                <div id="listener">🧍</div>
                <div class="sound-waves"></div>
                <button id="startDoppler" class="btn btn-primary">Start</button>
            </div>
        `;
    
        const ambulance = container.querySelector('#ambulance');
        const listener = container.querySelector('#listener');
        const soundWaves = container.querySelector('.sound-waves');
        const startBtn = container.querySelector('#startDoppler');
    
        let isMoving = false;
        let position = -100;
        let animationFrame;
    
        const resetAnimation = () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            isMoving = false;
            position = -100;
            ambulance.style.left = `${position}px`;
            soundWaves.innerHTML = '';
            startBtn.disabled = false;
        };
    
        const moveAmbulance = () => {
            if (!isMoving) return;
    
            position += 2;
            ambulance.style.left = `${position}px`;
    
            const ambulancePos = ambulance.getBoundingClientRect().left;
            const listenerPos = listener.getBoundingClientRect().left;
    
            // Generate a new sound wave periodically
            if (position % 20 === 0) {
                const wave = document.createElement('div');
                wave.className = 'sound-wave';
                wave.style.left = `${position + 20}px`;
                soundWaves.appendChild(wave);
    
                // Remove old waves
                if (soundWaves.children.length > 20) {
                    soundWaves.removeChild(soundWaves.firstChild);
                }
            }
    
            // Adjust pitch based on position relative to listener
            if (position > -50 && position < 600) {
                const pitch = 1.0 + (listenerPos - ambulancePos) / 300;
                // This is a simplified audio effect. A real implementation would be more complex.
                // For now, we'll just log it.
                // In a full version, you could use Web Audio API to change oscillator frequency.
            }
    
            if (position > container.offsetWidth) {
                resetAnimation();
                return;
            }
    
            animationFrame = requestAnimationFrame(moveAmbulance);
        };
    
        startBtn.addEventListener('click', () => {
            if (!isMoving) {
                isMoving = true;
                startBtn.disabled = true;
                moveAmbulance();
            }
        });
    }

    electromagneticSpectrumGame(container) {
        container.innerHTML = `
            <div class="game-area">
              <p style="text-align: center; margin-bottom: 10px;">🧠 Drag the waves in order — from lowest to highest energy!</p>
              <div id="emContainer" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                <div draggable="true" class="em-item">📻 Radio Waves</div>
                <div draggable="true" class="em-item">📡 Microwaves</div>
                <div draggable="true" class="em-item">🌈 Visible Light</div>
                <div draggable="true" class="em-item">📺 Infrared</div>
                <div draggable="true" class="em-item">☢️ Gamma Rays</div>
                <div draggable="true" class="em-item">🧬 X-Rays</div>
                <div draggable="true" class="em-item">💜 Ultraviolet</div>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <button id="checkOrder" class="btn btn-success">Check Order ✅</button>
              </div>
              <p id="result" style="text-align: center; margin-top: 10px; font-weight: bold;"></p>
            </div>
        `;

        const correctOrder = [
          "📻 Radio Waves",
          "📡 Microwaves",
          "📺 Infrared",
          "🌈 Visible Light",
          "💜 Ultraviolet",
          "🧬 X-Rays",
          "☢️ Gamma Rays"
        ];

        const emContainer = container.querySelector("#emContainer");
        let dragged = null;

        container.querySelectorAll(".em-item").forEach(el => {
          el.style.padding = "10px";
          el.style.border = "2px solid #fff";
          el.style.borderRadius = "8px";
          el.style.background = "#212121";
          el.style.cursor = "move";
          el.ondragstart = (e) => {
              dragged = e.target;
              e.target.style.opacity = '0.5';
          };
          el.ondragend = (e) => {
              e.target.style.opacity = '1';
          };
          el.ondragover = e => e.preventDefault();
          el.ondrop = e => {
            e.preventDefault();
            if (dragged && dragged !== e.target) {
                const draggedIndex = Array.from(emContainer.children).indexOf(dragged);
                const targetIndex = Array.from(emContainer.children).indexOf(e.target);
                if (draggedIndex < targetIndex) {
                    emContainer.insertBefore(dragged, e.target.nextSibling);
                } else {
                    emContainer.insertBefore(dragged, e.target);
                }
            }
          };
        });

        container.querySelector("#checkOrder").onclick = () => {
          const current = [...emContainer.children].map(c => c.textContent.trim());
          const result = container.querySelector("#result");
          if (JSON.stringify(current) === JSON.stringify(correctOrder)) {
            result.textContent = "✅ Correct! You built the EM spectrum!";
            result.style.color = 'var(--success)';
          } else {
            result.textContent = "❌ Try again — check the order!";
            result.style.color = 'var(--danger)';
          }
        };
    }
    
    staticElectricityGame(container) {
        container.innerHTML = `
            <div class="game-area">
                <p>Choose charge types:</p>
                <div class="game-controls" style="margin-bottom: 20px;">
                    <button id="posBtn" class="btn btn-primary">+ Positive</button>
                    <button id="negBtn" class="btn btn-danger">- Negative</button>
                </div>
              <canvas id="chargeCanvas" width="400" height="200"></canvas>
            </div>
        `;

        const c = container.querySelector("#chargeCanvas");
        const cx = c.getContext("2d");
        let chargeA = "+", chargeB = "+";

        container.querySelector("#posBtn").onclick = ()=> { chargeB = "+"; };
        container.querySelector("#negBtn").onclick = ()=> { chargeB = "-"; };
        
        const drawCharges = () => {
            if (!this.elements.contentGrid.contains(c)) {
                if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }
            cx.clearRect(0,0,400,200);
            cx.font = "24px 'Comic Sans MS'";
            
            cx.beginPath();
            cx.arc(120,100,20,0,Math.PI*2);
            cx.fillStyle="#00bcd4";
            cx.fill();
            cx.fillStyle="#fff";
            cx.fillText(chargeA,112,108);

            cx.beginPath();
            cx.arc(280,100,20,0,Math.PI*2);
            cx.fillStyle="#ff5252";
            cx.fill();
            cx.fillStyle="#fff";
            cx.fillText(chargeB,272,108);

            cx.strokeStyle="#fff";
            cx.lineWidth = 3;
            cx.font = "20px 'Comic Sans MS'";
            cx.textAlign = 'center';
            
            if (chargeA === chargeB){
                // Repel animation
                cx.beginPath();
                cx.moveTo(140, 100);
                cx.quadraticCurveTo(200, 80, 260, 100);
                cx.stroke();
                cx.beginPath();
                cx.moveTo(140, 100);
                cx.quadraticCurveTo(200, 120, 260, 100);
                cx.stroke();
                cx.fillText("❌ Repel!",200,150);
            } else {
                // Attract animation
                cx.beginPath();
                cx.moveTo(140,100);
                cx.lineTo(260,100);
                cx.stroke();
                cx.fillText("✅ Attract!",200,150);
            }
            this.animationFrameId = requestAnimationFrame(drawCharges);
        }
        drawCharges();
    }
    
    electricityGame(container, concept) {
        container.innerHTML = `
            <div class="game-area" style="position: relative;">
              <div id="lottie-container" style="width: 150px; height: 150px; position: absolute; top: 75px; right: 20px; pointer-events: none;"></div>
              <canvas id="circuitGame" width="500" height="300"></canvas>
              <button id="switchBtn" class="btn btn-primary">Switch: OFF</button>
            </div>
        `;
        
        const c = container.querySelector("#circuitGame");
        const ctx = c.getContext("2d");
        const lottieContainer = container.querySelector("#lottie-container");
        let circuitOn = false;
        let chargePos = 0;

        const switchBtn = container.querySelector("#switchBtn");
        switchBtn.onclick = ()=>{
          circuitOn = !circuitOn;
          switchBtn.innerText = "Switch: " + (circuitOn ? "ON" : "OFF");
          switchBtn.classList.toggle('btn-success', circuitOn);
          
          lottieContainer.innerHTML = ''; // Clear the container first
          
          if (circuitOn) {
              this.tryLoadLottie(lottieContainer, concept.animation);
          } else {
              lottieContainer.innerHTML = '<img src="/static/images/bulb_off.png" alt="Bulb off" style="width: 100%; height: 100%;">';
          }
        };

        // Initial state
        lottieContainer.innerHTML = '<img src="/static/images/bulb_off.png" alt="Bulb off" style="width: 100%; height: 100%;">';

        const drawCircuit = () => {
            if (!this.elements.contentGrid.contains(c)) {
                if(this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return;
            }
          ctx.clearRect(0,0,500,300);
          const bulbX = 400;
          const bulbY = 150;
          
          // battery
          ctx.fillStyle = "#f44336";
          ctx.fillRect(50, 130, 40, 60);
          ctx.fillStyle = "#333";
          ctx.fillRect(50, 125, 40, 5);
          ctx.fillRect(70, 120, 5, 5);
          ctx.fillStyle = "#fff";
          ctx.font = "16px 'Comic Sans MS'";
          ctx.fillText("Battery", 45, 210);
          
          // wires
          ctx.strokeStyle = "#95a5a6";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(90, 160); // From battery
          ctx.lineTo(200, 160); // To switch
          ctx.moveTo(270, 160); // From switch
          ctx.lineTo(bulbX - 40, 160); // To bulb
          
          ctx.moveTo(90, 160);
          ctx.lineTo(90, 250);
          ctx.lineTo(bulbX + 40, 250);
          ctx.lineTo(bulbX + 40, 160);
          ctx.stroke();

          // Switch terminals
          ctx.fillStyle = "#bdc3c7";
          ctx.beginPath();
          ctx.arc(200, 160, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(270, 160, 6, 0, Math.PI * 2);
          ctx.fill();

          // Switch arm
          ctx.save();
          ctx.translate(200, 160);
          if (!circuitOn) {
            ctx.rotate(-Math.PI / 6);
          }
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(70, 0);
          ctx.stroke();
          ctx.restore();


          // current animation
          if (circuitOn){
            chargePos = (chargePos + 1) % 40;
            ctx.fillStyle="#00e5ff";
            // Top wire
            for(let i=chargePos; i < (bulbX - 40 - 90); i+=40){
                ctx.beginPath();
                ctx.arc(90 + i, 160, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            // Bottom wire
            let bottomPathLength = (bulbX + 40 - 90) + (250-160)*2;
             for(let i=chargePos; i < bottomPathLength; i+=40){
                let x, y;
                if (i < 90) { // down
                    x = 90; y = 160 + i;
                } else if (i < 90 + (bulbX + 40 - 90)) { // across
                    x = 90 + (i-90); y = 250;
                } else { // up
                    x = bulbX + 40; y = 250 - (i - (90 + (bulbX + 40 - 90)));
                }

                if (y > 150) {
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
          }

          ctx.fillStyle="#fff";
          ctx.fillText("Electricity flows only when the circuit is closed!", 100, 280);
          this.animationFrameId = requestAnimationFrame(drawCircuit);
        }
        drawCircuit();
    }
    
    conservationOfEnergyGame(container) {
        container.innerHTML = `
            <div class="game-area">
              <p id="energyText" class="energy-text">☀️ Solar Energy → Click to start!</p>
              <button id="energyBtn" class="btn btn-primary">Transform</button>
            </div>
        `;

        const stages = [
          "☀️ Solar Energy → ⚡ Electrical Energy",
          "⚡ Electrical Energy → 🔩 Mechanical Energy",
          "🔩 Mechanical Energy → 💡 Light Energy",
          "💡 Light Energy → ☀️ Back to Solar!"
        ];
        let step = 0;
        const energyText = container.querySelector("#energyText");
        energyText.classList.add('active');

        container.querySelector("#energyBtn").onclick = ()=>{
          step = (step+1)%stages.length;
          energyText.classList.remove('active');
          setTimeout(() => {
            energyText.innerText = stages[step];
            energyText.classList.add('active');
          }, 100);
        };
    }

    centrifugalForceGame(container) {
        container.innerHTML = `
            <div class="game-area">
              <canvas id="bucketGame" width="400" height="400" style="max-width: 100%;"></canvas>
              <p id="gameText" style="text-align: center; margin-top: 10px;">Spin the bucket fast so water doesn't spill!</p>
              <div style="text-align: center; margin-top: 10px;">
                <button id="spinBtn" class="btn btn-primary">Spin!</button>
              </div>
            </div>
        `;

        const canvas = container.querySelector("#bucketGame");
        const ctx = canvas.getContext("2d");
        let angle = 0;
        let speed = 0;
        let waterParticles = [];

        container.querySelector("#spinBtn").onclick = () => {
          speed += 0.05; // tap increases spin speed
        };

        const draw = () => {
            if (!this.elements.contentGrid.contains(canvas)) {
                if(this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
                return; 
            }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw and update water particles
            waterParticles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity
                p.alpha -= 0.01;

                if (p.alpha <= 0) {
                    waterParticles.splice(index, 1);
                }

                ctx.fillStyle = `rgba(0, 191, 255, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(angle);
          // draw rope
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.lineTo(0, -120);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 4;
          ctx.stroke();
          // draw bucket
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(-25, -150, 50, 30);
          
          // Draw water in the bucket
          if (speed > 0.1 || (angle % (2 * Math.PI) > Math.PI / 2 && angle % (2 * Math.PI) < 3 * Math.PI / 2)) {
            ctx.fillStyle = "rgba(0, 191, 255, 0.8)";
            ctx.fillRect(-20, -145, 40, 20);
          }


          // Spill water if slow at the top
          if (speed < 0.1 && (angle % (2 * Math.PI) > Math.PI)) {
             for (let i = 0; i < 5; i++) {
                waterParticles.push({
                    x: canvas.width / 2 + Math.sin(angle) * -135,
                    y: canvas.height / 2 + Math.cos(angle) * -135,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2 - 2,
                    alpha: 1
                });
            }
          }
          
          ctx.restore();

          angle += speed;
          speed *= 0.99; // friction
          this.animationFrameId = requestAnimationFrame(draw);
        }
        draw();
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.physics-screen')) {
        new PhysicsPageManager();
    }
});