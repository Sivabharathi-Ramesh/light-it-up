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
        this.elements.simulation.innerHTML = `<h2>${concept.title}</h2><p>Game for ${concept.title} coming soon!</p>`;
        // Attempt to render a Lottie animation if available via toolkit
        if (window.ConceptToolkit && concept.animation) {
            ConceptToolkit.loadLottie(this.elements.simulation, concept.animation).then(loaded => {
                if (loaded) {
                    const fallback = this.elements.simulation.querySelector('h2');
                    if (fallback) fallback.remove();
                }
            });
        } else if (concept.animation) {
            // keep existing tryLoadLottie fallback if toolkit not present
            this.tryLoadLottie(this.elements.simulation, concept.animation).then(loaded => {
                if (loaded) {
                    const fallback = this.elements.simulation.querySelector('h2');
                    if (fallback) fallback.remove();
                }
            });
        }
        this.elements.formula.innerHTML = '';
        // Start simulation for known interactive concepts
        this.startSimulation(key, concept);
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

    // Try to load a Lottie animation JSON from static/animations/<name>.json
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

    startSimulation(key, concept) {
        const container = this.elements.simulation;
        // clear previous
        container.innerHTML = '';
        if (!key) return;

        // Try Lottie first (if animation name provided)
        if (concept && concept.animation) {
            this.tryLoadLottie(container, concept.animation).then(loaded => {
                if (loaded) return;
                // fallback to built-in sims
                this.startBuiltInSim(key);
            });
            return;
        }

        // Start built-in simulations based on key
        this.startBuiltInSim(key);
    }

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

    momentumSimulation(container) {
        container.innerHTML = `
            <div class="momentum-sim">
                <div style="margin-bottom:10px">Drag the sliders to change mass and speed of the carts, then press <strong>Collide</strong>.</div>
                <div style="display:flex; gap:20px; align-items:center;">
                    <div>
                        <label>Cart A mass (kg): <span id="massAVal">2</span></label>
                        <input id="massA" type="range" min="1" max="10" value="2">
                    </div>
                    <div>
                        <label>Cart A speed (m/s): <span id="speedAVal">3</span></label>
                        <input id="speedA" type="range" min="0" max="10" value="3">
                    </div>
                </div>
                <div style="height:140px; position:relative; margin-top:20px; border:1px solid #ddd; background:linear-gradient(#fff,#f7f7f7);">
                    <div id="cartA" style="position:absolute; left:20px; bottom:20px; width:80px; height:60px; background:#5DADE2; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">A</div>
                    <div id="cartB" style="position:absolute; right:20px; bottom:20px; width:80px; height:60px; background:#F1948A; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">B</div>
                </div>
                <div style="margin-top:12px; display:flex; gap:10px;">
                    <button id="collideBtn" class="btn btn-primary">Collide</button>
                    <button id="resetBtn" class="btn">Reset</button>
                    <div id="result" style="margin-left:10px; font-weight:600"></div>
                </div>
            </div>`;

        const massA = container.querySelector('#massA');
        const massAVal = container.querySelector('#massAVal');
        const speedA = container.querySelector('#speedA');
        const speedAVal = container.querySelector('#speedAVal');
        const cartA = container.querySelector('#cartA');
        const cartB = container.querySelector('#cartB');
        const collideBtn = container.querySelector('#collideBtn');
        const resetBtn = container.querySelector('#resetBtn');
        const result = container.querySelector('#result');

        massA.addEventListener('input', () => massAVal.textContent = massA.value);
        speedA.addEventListener('input', () => speedAVal.textContent = speedA.value);

        let animId = null;
        function animateCollision(mA, vA, mB, vB) {
            // Start cartA moving right, cartB initially still (vB = 0)
            const width = container.offsetWidth || 600;
            let posA = 20;
            let posB = width - 100;
            cartA.style.left = posA + 'px';
            cartB.style.left = posB + 'px';

            // convert speed units to pixels per frame roughly
            const scale = 2.5;
            let velA = vA * scale;

            function step() {
                posA += velA;
                cartA.style.left = posA + 'px';
                if (posA + 80 >= posB) {
                    // collision — elastic collision equations
                    const newVA = ((mA - mB) / (mA + mB)) * vA + ((2 * mB) / (mA + mB)) * vB;
                    const newVB = ((2 * mA) / (mA + mB)) * vA + ((mB - mA) / (mA + mB)) * vB;
                    result.textContent = `After collision: vA=${newVA.toFixed(2)} m/s, vB=${newVB.toFixed(2)} m/s`;
                    // animate them apart based on new velocities
                    let velAp = newVA * scale;
                    let velBp = newVB * scale;
                    // push them apart frames
                    function step2() {
                        posA += velAp;
                        posB += velBp;
                        cartA.style.left = posA + 'px';
                        cartB.style.left = posB + 'px';
                        if (posA < width && posB < width && posA > -200 && posB > -200) {
                            animId = requestAnimationFrame(step2);
                        }
                    }
                    animId = requestAnimationFrame(step2);
                    return;
                }
                animId = requestAnimationFrame(step);
            }
            animId = requestAnimationFrame(step);
        }

        collideBtn.onclick = () => {
            if (animId) cancelAnimationFrame(animId);
            result.textContent = '';
            const mA = parseFloat(massA.value);
            const vA = parseFloat(speedA.value);
            const mB = 3; // fixed mass for B to keep simple
            const vB = 0;
            animateCollision(mA, vA, mB, vB);
        };

        resetBtn.onclick = () => {
            if (animId) cancelAnimationFrame(animId);
            cartA.style.left = '20px';
            cartB.style.left = (container.offsetWidth - 100) + 'px';
            result.textContent = '';
        };
    }

    newtonsLawsSimulation(container) {
        container.innerHTML = `
            <div style="text-align:left;">
                <h3>Newton's First Law (Inertia)</h3>
                <p>Objects keep doing what they're doing unless a force acts on them.</p>
                <div style="height:160px; position:relative; border:1px solid #ddd; background:#fff;">
                    <div id="ball" style="position:absolute; left:20px; bottom:30px; font-size:48px;">⚽</div>
                </div>
                <div style="margin-top:12px;"><button id="pushBtn" class="btn btn-primary">Push the ball</button> <button id="stopBtn" class="btn">Apply friction</button></div>
                <div id="nlResult" style="margin-top:10px;font-weight:600"></div>
            </div>
        `;

        const ball = container.querySelector('#ball');
        const pushBtn = container.querySelector('#pushBtn');
        const stopBtn = container.querySelector('#stopBtn');
        const nlResult = container.querySelector('#nlResult');

        let pos = 20;
        let speed = 0;
        let animId = null;

        function animate() {
            pos += speed;
            speed *= 0.995; // slight friction
            ball.style.left = pos + 'px';
            if (Math.abs(speed) > 0.01 && pos < container.offsetWidth - 50) {
                animId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animId);
            }
        }

        pushBtn.onclick = () => {
            speed = 6; nlResult.textContent = "The ball keeps moving until friction (or a force) stops it."; if (!animId) animate();
        };
        stopBtn.onclick = () => { speed = 0; nlResult.textContent = "A force (friction) stopped the ball."; };
    }

    energySimulation(container) {
        container.innerHTML = `
            <div>
                <h3>Kinetic & Potential Energy</h3>
                <p>Set the height of the hill and the mass of the cart. Watch potential energy convert to kinetic energy!</p>
                <div style="display:flex; gap:12px; align-items:center;">
                    <div>
                        <label>Height (m): <span id="heightVal">5</span></label>
                        <input id="height" type="range" min="1" max="20" value="5">
                    </div>
                    <div>
                        <label>Mass (kg): <span id="massVal">2</span></label>
                        <input id="mass" type="range" min="1" max="10" value="2">
                    </div>
                </div>
                <div style="height:160px; position:relative; border:1px solid #ddd; margin-top:12px;">
                    <div id="cart" style="position:absolute; left:10px; bottom:20px; width:80px; height:40px; background:#58D68D; display:flex; align-items:center; justify-content:center;">Cart</div>
                </div>
                <div style="margin-top:10px;"><button id="releaseBtn" class="btn btn-primary">Release</button> <span id="energyReadout" style="margin-left:10px; font-weight:600"></span></div>
            </div>
        `;

        const h = container.querySelector('#height');
        const hVal = container.querySelector('#heightVal');
        const m = container.querySelector('#mass');
        const mVal = container.querySelector('#massVal');
        const cart = container.querySelector('#cart');
        const release = container.querySelector('#releaseBtn');
        const readout = container.querySelector('#energyReadout');

        h.addEventListener('input', () => hVal.textContent = h.value);
        m.addEventListener('input', () => mVal.textContent = m.value);

        release.onclick = () => {
            const g = 9.8;
            const height = parseFloat(h.value);
            const mass = parseFloat(m.value);
            const potential = mass * g * height; // J
            // assume conversion to kinetic at bottom: KE = potential => v = sqrt(2gh)
            const v = Math.sqrt(2 * g * height);
            readout.textContent = `Potential: ${potential.toFixed(1)} J — Estimated speed at bottom: ${v.toFixed(2)} m/s`;

            // animate cart moving across to simulate descent
            let pos = 10;
            const width = container.offsetWidth || 600;
            const scale = 5;
            let animId = null;
            function step() {
                pos += Math.min(v / scale, 8);
                cart.style.left = pos + 'px';
                if (pos < width - 100) animId = requestAnimationFrame(step);
            }
            cart.style.left = '10px';
            animId = requestAnimationFrame(step);
        };
    }

    gravitySimulation(container) {
        container.innerHTML = `
            <div>
                <h3>Gravity & Free Fall</h3>
                <p>Drop an object and watch how long it takes to hit the ground. Try adding a parachute to slow it down.</p>
                <div style="margin-top:8px;">
                    <label><input id="parachute" type="checkbox"> Attach parachute</label>
                </div>
                <div style="height:220px; position:relative; border:1px solid #ddd; margin-top:8px; background:linear-gradient(#e6f7ff,#fff);">
                    <div id="object" style="position:absolute; left:50%; transform:translateX(-50%); top:10px; font-size:40px;">🪂</div>
                </div>
                <div style="margin-top:10px;"><button id="dropBtn" class="btn btn-primary">Drop</button> <span id="timeReadout" style="margin-left:10px; font-weight:600"></span></div>
            </div>
        `;

        const parachute = container.querySelector('#parachute');
        const obj = container.querySelector('#object');
        const drop = container.querySelector('#dropBtn');
        const readout = container.querySelector('#timeReadout');

        drop.onclick = () => {
            const start = performance.now();
            let velocity = 0;
            const g = 9.8; // m/s^2
            let pos = 10;
            const heightPx = container.offsetHeight - 60;
            let animId = null;
            function step(ts) {
                // simplified physics: v += a*dt; pos += v*dt
                const dt = 1 / 60;
                const drag = parachute.checked ? 0.6 : 0.02; // larger drag when parachute
                velocity += (g * (1 - drag)) * dt;
                pos += velocity * 5 * dt;
                obj.style.top = pos + 'px';
                if (pos < heightPx) {
                    animId = requestAnimationFrame(step);
                } else {
                    const elapsed = (performance.now() - start) / 1000;
                    readout.textContent = `Hit ground after ${elapsed.toFixed(2)} s`;
                    cancelAnimationFrame(animId);
                }
            }
            obj.style.top = '10px';
            animId = requestAnimationFrame(step);
        };
    }

    waveSimulation(container) {
        container.innerHTML = `
            <div>
                <h3>Waves — Amplitude & Frequency</h3>
                <p>Adjust the amplitude and frequency to see how the wave changes.</p>
                <div style="display:flex; gap:12px; align-items:center;">
                    <div>
                        <label>Amplitude: <span id="ampVal">30</span></label>
                        <input id="amp" type="range" min="5" max="80" value="30">
                    </div>
                    <div>
                        <label>Frequency: <span id="freqVal">1</span></label>
                        <input id="freq" type="range" min="1" max="6" value="1">
                    </div>
                </div>
                <canvas id="waveCanvas" width="600" height="180" style="border:1px solid #ddd; display:block; margin-top:12px;"></canvas>
            </div>
        `;

        const amp = container.querySelector('#amp');
        const ampVal = container.querySelector('#ampVal');
        const freq = container.querySelector('#freq');
        const freqVal = container.querySelector('#freqVal');
        const canvas = container.querySelector('#waveCanvas');
        const ctx = canvas.getContext('2d');

        amp.addEventListener('input', () => ampVal.textContent = amp.value);
        freq.addEventListener('input', () => freqVal.textContent = freq.value);

        let t = 0;
        function draw() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.beginPath();
            const A = parseFloat(amp.value);
            const k = 0.02 * parseFloat(freq.value);
            for (let x=0; x<canvas.width; x++) {
                const y = canvas.height/2 + A * Math.sin(k * x - t);
                if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2; ctx.stroke();
            t += 0.15 * parseFloat(freq.value);
            requestAnimationFrame(draw);
        }
        draw();
    }

    electricitySimulation(container) {
        container.innerHTML = `
            <div>
                <h3>Simple Circuit</h3>
                <p>Toggle the switch to light the bulb. Try adding/removing the battery.</p>
                <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
                    <label><input id="battery" type="checkbox" checked> Battery</label>
                    <label><input id="switchBtn" type="checkbox"> Switch (Open/Closed)</label>
                </div>
                <div id="circuitArea" style="margin-top:12px; display:flex; gap:20px; align-items:center;">
                    <img id="bulbImg" src="/static/images/bulb_off.png" style="width:64px; height:64px;">
                    <div id="wire" style="height:2px; background:#333; width:150px;"></div>
                </div>
            </div>
        `;

        const battery = container.querySelector('#battery');
        const sw = container.querySelector('#switchBtn');
        const bulbImg = container.querySelector('#bulbImg');

        function updateCircuit() {
            if (battery.checked && sw.checked) {
                bulbImg.src = '/static/images/bulb_off.png';
                // use bulb_glow lottie if available
                // fallback to changing image to bulb_off -> we'll keep simple here
                bulbImg.style.filter = 'brightness(2)';
            } else {
                bulbImg.src = '/static/images/bulb_off.png';
                bulbImg.style.filter = 'brightness(1)';
            }
        }

        battery.addEventListener('change', updateCircuit);
        sw.addEventListener('change', updateCircuit);
        updateCircuit();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.physics-screen')) {
        new PhysicsPageManager();
    }
});