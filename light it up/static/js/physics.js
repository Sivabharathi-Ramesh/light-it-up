class PhysicsPageManager {
    constructor() {
        this.concepts = {};
        this.conceptKeys = [];
        this.currentConceptIndex = 0;
        this.animationFrameId = null;

        this.elements = {
            navigation: document.getElementById('conceptNavigation'),
            explanation: document.getElementById('conceptExplanation'),
            simulation: document.getElementById('simulationArea'),
            formula: document.getElementById('funFormulaArea'),
            progressBar: document.getElementById('topicProgressBar'),
            nextButton: document.getElementById('nextConceptButton'),
        };

        this.init();
    }

    async init() {
        await this.fetchConcepts();
        if (Object.keys(this.concepts).length > 0) {
            this.conceptKeys = Object.keys(this.concepts);
            this.buildNavigation();
            this.loadConceptByIndex(0);
            this.elements.nextButton.addEventListener('click', () => this.loadNextConcept());
        }
    }

    async fetchConcepts() {
        try {
            const response = await fetch('/get_concepts/physics');
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch data from server.');
            }
            this.concepts = data;
        } catch (error) {
            console.error("Failed to fetch concepts:", error);
            this.elements.explanation.innerHTML = `<p style="color:var(--danger);">Error loading concepts: ${error.message}</p>`;
        }
    }

    buildNavigation() {
        if (!this.conceptKeys || this.conceptKeys.length === 0) return;
        this.elements.navigation.innerHTML = '';
        this.conceptKeys.forEach((key, index) => {
            const concept = this.concepts[key];
            const navItem = document.createElement('div');
            navItem.className = 'concept-item';
            navItem.textContent = concept.title;
            navItem.addEventListener('click', () => this.loadConceptByIndex(index));
            this.elements.navigation.appendChild(navItem);
        });
    }

    loadConceptByIndex(index) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (!this.conceptKeys || this.conceptKeys.length === 0) return;

        this.currentConceptIndex = index;
        const key = this.conceptKeys[index];
        const concept = this.concepts[key];

        if (!concept) {
            console.error(`Concept not found for key: ${key}`);
            return;
        }

        this.updateActiveNavItem();
        this.displayConceptInfo(concept);
        this.startMiniGame(concept.animation);
    }

    updateActiveNavItem() {
        this.elements.navigation.querySelectorAll('.concept-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentConceptIndex);
        });
    }

    displayConceptInfo(concept) {
        this.elements.explanation.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> ${concept.title}</h3>
            <p>${concept.concept}</p>
            <hr>
            <h4><i class="fas fa-bullseye"></i> Learning Goal</h4>
            <p><em>${concept.goal}</em></p>
        `;
        
        // The formula area will be populated by each game
        this.elements.formula.innerHTML = '';
    }

    loadNextConcept() {
        this.loadConceptByIndex((this.currentConceptIndex + 1) % this.conceptKeys.length);
    }

    startMiniGame(type) {
        const container = this.elements.simulation;
        container.innerHTML = ''; // Clear previous game

        switch (type) {
            case 'force_and_motion': this.forceAndMotionGame(container); break;
            case 'gravity': this.gravityGame(container); break;
            case 'energy': this.energyGame(container); break;
            case 'friction': this.frictionGame(container); break;
            case 'light_and_reflection': this.lightAndReflectionGame(container); break;
            case 'sound_waves': this.soundWavesGame(container); break;
            case 'simple_machines': this.simpleMachinesGame(container); break;
            case 'electricity': this.electricityGame(container); break;
            case 'magnetism': this.magnetismGame(container); break;
            case 'pressure_and_buoyancy': this.pressureAndBuoyancyGame(container); break;
            default: container.innerHTML = `<div class="game-container"><p style="color:white;">Game not available.</p></div>`;
        }
    }

    // ===== MINI-GAME IMPLEMENTATIONS =====

    forceAndMotionGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class.formula-bar-container"><label>Force (F)</label><div class="formula-bar"><div id="force-bar"></div></div></div>
            <div class.formula-bar-container"><label>Friction (f)</label><div class="formula-bar"><div id="friction-bar" class="friction"></div></div></div>
            <div class="formula-display">F = m * a</div>`;
        container.innerHTML = `
            <div class="game-container force-game">
                <div class="ground"></div><div class="box-object">📦</div>
                <div class="force-arrow" style="opacity: 0;">➡️</div><div class="friction-arrow" style="opacity: 0;">⬅️</div>
                <div class="game-controls-panel">
                    <label>Force: <span id="force-val">50</span></label><input type="range" id="force-slider" min="0" max="100" value="50">
                    <button id="push-btn" class="btn btn-danger">Push!</button>
                </div>
            </div>`;
        const el = {
            box: container.querySelector('.box-object'), forceSlider: container.querySelector('#force-slider'),
            pushBtn: container.querySelector('#push-btn'), forceVal: container.querySelector('#force-val'),
            forceArrow: container.querySelector('.force-arrow'), frictionArrow: container.querySelector('.friction-arrow'),
            forceBar: this.elements.formula.querySelector('#force-bar'), frictionBar: this.elements.formula.querySelector('#friction-bar')
        };
        let pos = 50, vel = 0, mass = 20, friction = 0.98;
        el.forceSlider.oninput = () => el.forceVal.textContent = el.forceSlider.value;
        el.pushBtn.onclick = () => {
            if (Math.abs(vel) < 0.1) {
                 vel += el.forceSlider.value / mass;
                 window.audioManager.play('pop');
                 el.forceArrow.style.opacity = 1;
                 el.forceArrow.style.width = `${el.forceSlider.value * 1.5}px`;
                 el.forceBar.style.width = `${el.forceSlider.value}%`;
            }
        };
        const gameLoop = () => {
            vel *= friction;
            if (Math.abs(vel) < 0.1) {
                vel = 0; el.forceArrow.style.opacity = 0; el.frictionArrow.style.opacity = 0;
                el.forceBar.style.width = '0%'; el.frictionBar.style.width = '0%';
            } else {
                const frictionEffect = Math.abs(vel * (1-friction) * 50);
                el.frictionArrow.style.opacity = 1;
                el.frictionArrow.style.width = `${frictionEffect}px`;
                el.frictionBar.style.width = `${Math.min(frictionEffect, 100)}%`;
            }
            pos += vel;
            if (pos > container.offsetWidth - 80) { pos = container.offsetWidth - 80; vel *= -0.4; window.audioManager.play('collision'); }
            if (pos < 0) { pos = 0; vel *= -0.4; window.audioManager.play('collision');}
            el.box.style.left = `${pos}px`;
            el.forceArrow.style.left = `${pos - parseFloat(el.forceArrow.style.width || 0)}px`;
            el.frictionArrow.style.left = `${pos + 80}px`;
            this.animationFrameId = requestAnimationFrame(gameLoop);
        }; gameLoop();
    }
    
    gravityGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Launch Angle</label><div class="formula-bar"><div id="angle-bar"></div></div></div>
            <div class="formula-bar-container"><label>Launch Power</label><div class="formula-bar"><div id="power-bar" class="kinetic"></div></div></div>
            <div class="formula-display">Trajectory = f(angle, power)</div>`;
        container.innerHTML = `
            <div class="game-container gravity-game">
                <div class="slingshot">🪃</div><div class="projectile" style="display:none;">🏀</div><div class="target">🎯</div>
                <div class="game-controls-panel">
                    <label>Angle: <span id="angle-val">45</span>°</label><input type="range" id="angle-slider" min="20" max="90" value="45">
                    <label>Power: <span id="power-val">50</span></label><input type="range" id="power-slider" min="10" max="100" value="50">
                    <button id="launch-btn" class="btn btn-success">Launch!</button>
                </div>
            </div>`;
        const el = {
            slingshot: container.querySelector('.slingshot'), projectile: container.querySelector('.projectile'),
            target: container.querySelector('.target'), angleSlider: container.querySelector('#angle-slider'),
            powerSlider: container.querySelector('#power-slider'), launchBtn: container.querySelector('#launch-btn'),
            angleVal: container.querySelector('#angle-val'), powerVal: container.querySelector('#power-val'),
            angleBar: this.elements.formula.querySelector('#angle-bar'), powerBar: this.elements.formula.querySelector('#power-bar')
        };
        let isFlying = false;
        const updateBars = () => {
            el.angleVal.textContent = el.angleSlider.value;
            el.powerVal.textContent = el.powerSlider.value;
            el.slingshot.style.transform = `rotate(${-90 + parseInt(el.angleSlider.value)}deg)`;
            el.angleBar.style.width = `${(el.angleSlider.value - 20) / 70 * 100}%`;
            el.powerBar.style.width = `${el.powerSlider.value}%`;
        };
        el.angleSlider.oninput = updateBars; el.powerSlider.oninput = updateBars; updateBars();
        el.launchBtn.onclick = () => {
            if (isFlying) return; isFlying = true;
            el.projectile.style.display = 'block';
            let angle = el.angleSlider.value * (Math.PI / 180), power = el.powerSlider.value / 4, gravity = 0.2, time = 0;
            let startX = 80, startY = 80, vx = Math.cos(angle) * power, vy = Math.sin(angle) * power;
            window.audioManager.play('spring');
            const gameLoop = () => {
                vy -= gravity;
                let x = startX + vx * time, y = startY - (vy * time - 0.5 * gravity * time * time);
                el.projectile.style.left = `${x}px`; el.projectile.style.bottom = `${y}px`;
                time++;
                const pRect = el.projectile.getBoundingClientRect(), tRect = el.target.getBoundingClientRect();
                if (pRect.right > tRect.left && pRect.left < tRect.right && pRect.bottom > tRect.top && pRect.top < tRect.bottom) {
                    window.audioManager.play('success'); el.target.style.animation = 'pulse 0.5s';
                    setTimeout(() => el.target.style.animation = '', 500);
                    isFlying = false; el.projectile.style.display = 'none'; return;
                }
                if (y < 0) { isFlying = false; el.projectile.style.display = 'none'; return; }
                this.animationFrameId = requestAnimationFrame(gameLoop);
            }; gameLoop();
        };
    }

    energyGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Potential (PE)</label><div class="formula-bar"><div id="pe-bar" class="potential"></div></div></div>
            <div class="formula-bar-container"><label>Kinetic (KE)</label><div class="formula-bar"><div id="ke-bar" class="kinetic"></div></div></div>
            <div class="formula-display">Total Energy = PE + KE</div>`;
        container.innerHTML = `
            <div class="game-container energy-game">
                <svg id="track" width="100%" height="100%"></svg><div id="cart">🎢</div>
            </div>`;
        const el = { 
            peBar: this.elements.formula.querySelector('#pe-bar'), keBar: this.elements.formula.querySelector('#ke-bar'), 
            cart: container.querySelector('#cart'), trackSvg: container.querySelector('#track')
        };
        const w = container.offsetWidth, h = container.offsetHeight;
        const trackPoints = [[w*0.05, h*0.3], [w*0.2, h*0.5], [w*0.35, h*0.2], [w*0.6, h*0.7], [w*0.8, h*0.4], [w*0.95, h*0.6]];
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = "M " + trackPoints[0].join(" ");
        for(let i=1; i<trackPoints.length; i++) { pathData += " L " + trackPoints[i].join(" "); }
        path.setAttribute('d', pathData);
        path.setAttribute('id', 'roller-coaster-path');
        el.trackSvg.appendChild(path);
        const pathLength = path.getTotalLength();
        let distance = 0, velocity = 0, totalEnergy = (h - trackPoints[0][1]) * 0.5;
        const gameLoop = () => {
            const point = path.getPointAtLength(distance);
            const potentialEnergy = (h - point.y) * 0.5;
            let kineticEnergy = totalEnergy - potentialEnergy;
            if(kineticEnergy < 0) kineticEnergy = 0;
            velocity = Math.sqrt(kineticEnergy);
            el.peBar.style.width = (potentialEnergy / totalEnergy * 100) + '%';
            el.keBar.style.width = (kineticEnergy / totalEnergy * 100) + '%';
            distance += velocity;
            if (distance >= pathLength) distance = 0;
            const newPoint = path.getPointAtLength(distance);
            el.cart.style.left = `${newPoint.x - 15}px`; el.cart.style.top = `${newPoint.y - 15}px`;
            this.animationFrameId = requestAnimationFrame(gameLoop);
        }; gameLoop();
    }
    
    frictionGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Velocity</label><div class="formula-bar"><div id="vel-bar" class="kinetic"></div></div></div>
            <div class="formula-bar-container"><label>Friction</label><div class="formula-bar"><div id="fric-bar" class="friction"></div></div></div>
            <div class="formula-display">Friction opposes motion</div>`;
        container.innerHTML = `
            <div class="game-container friction-game"><div id="fric-obj">🛷</div>
                <div id="surface" class="ice"></div>
                <div class="game-controls-panel">
                    <label>Surface:</label>
                    <button class="btn btn-primary" data-surface="ice">Ice</button>
                    <button class="btn btn-warning" data-surface="wood">Wood</button>
                    <button class="btn btn-danger" data-surface="sandpaper">Sandpaper</button>
                </div>
            </div>`;
        const el = {
            obj: container.querySelector('#fric-obj'), surface: container.querySelector('#surface'),
            velBar: this.elements.formula.querySelector('#vel-bar'), fricBar: this.elements.formula.querySelector('#fric-bar')
        };
        let pos = 10, vel = 0;
        const frictions = { ice: { val: 0.995, display: 10 }, wood: { val: 0.97, display: 40 }, sandpaper: { val: 0.92, display: 90 } };
        let currentFriction = frictions.ice;
        container.querySelectorAll('button').forEach(btn => btn.onclick = () => {
            currentFriction = frictions[btn.dataset.surface];
            el.surface.className = btn.dataset.surface;
            pos = 10; vel = 15;
            window.audioManager.play('pop');
        });
        const gameLoop = () => {
            pos += vel; vel *= currentFriction.val;
            el.velBar.style.width = `${(vel / 15) * 100}%`;
            if(vel < 0.1) {
                vel = 0;
                el.fricBar.style.width = `0%`;
            } else {
                el.fricBar.style.width = `${currentFriction.display}%`;
            }
            if (pos > container.offsetWidth - 50) { pos = container.offsetWidth - 50; vel = 0; }
            el.obj.style.left = `${pos}px`;
            this.animationFrameId = requestAnimationFrame(gameLoop);
        }; gameLoop();
    }
    
    lightAndReflectionGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Angle In</label><div class="formula-bar"><div id="angle-in-bar" class="potential"></div></div></div>
            <div class="formula-bar-container"><label>Angle Out</label><div class="formula-bar"><div id="angle-out-bar" class="kinetic"></div></div></div>
            <div class="formula-display">Angle of Incidence = Angle of Reflection</div>`;
        container.innerHTML = `
            <div class="game-container light-game">
                <div class="light-source">🔦</div>
                <div class="light-target"></div>
                <div class="mirror"></div>
                <svg id="light-beam-svg"></svg>
                <div class="game-controls-panel"><label>Drag the mirror to reflect the light!</label></div>
            </div>`;

        const el = {
            mirror: container.querySelector('.mirror'),
            source: container.querySelector('.light-source'),
            target: container.querySelector('.light-target'),
            svg: container.querySelector('#light-beam-svg'),
            angleInBar: this.elements.formula.querySelector('#angle-in-bar'),
            angleOutBar: this.elements.formula.querySelector('#angle-out-bar'),
        };

        let mirrorAngle = 0;
        el.mirror.style.top = '150px';
        el.mirror.style.left = '200px';

        const drawBeams = () => {
            const sourceRect = el.source.getBoundingClientRect();
            const mirrorRect = el.mirror.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const sx = sourceRect.left - containerRect.left + sourceRect.width / 2;
            const sy = sourceRect.top - containerRect.top + sourceRect.height / 2;

            const mx = mirrorRect.left - containerRect.left + mirrorRect.width / 2;
            const my = mirrorRect.top - containerRect.top + mirrorRect.height / 2;

            const angleRad = Math.atan2(my - sy, mx - sx);
            const angleDeg = angleRad * (180 / Math.PI);
            
            const incidentAngle = 90 - (mirrorAngle - angleDeg);
            const reflectionAngle = mirrorAngle + (mirrorAngle - angleDeg);

            const reflectionRad = reflectionAngle * (Math.PI / 180);
            const endX = mx + Math.cos(reflectionRad) * 500;
            const endY = my + Math.sin(reflectionRad) * 500;
            
            el.svg.innerHTML = `
                <line x1="${sx}" y1="${sy}" x2="${mx}" y2="${my}" stroke="#FFF3B0" stroke-width="3" />
                <line x1="${mx}" y1="${my}" x2="${endX}" y2="${endY}" stroke="#FFF3B0" stroke-width="3" />
            `;

            el.angleInBar.style.width = `${Math.abs(incidentAngle) / 90 * 100}%`;
            el.angleOutBar.style.width = `${Math.abs(incidentAngle) / 90 * 100}%`;
        };
        
        el.mirror.onmousedown = (e) => {
            e.preventDefault();
            const onMouseMove = (move_e) => {
                let newLeft = move_e.clientX - container.getBoundingClientRect().left - el.mirror.offsetWidth / 2;
                el.mirror.style.left = `${newLeft}px`;
                drawBeams();
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        drawBeams();
    }
    
    soundWavesGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Frequency (Pitch)</label><div class="formula-bar"><div id="freq-bar" class="potential"></div></div></div>
            <div class="formula-bar-container"><label>Amplitude (Loudness)</label><div class="formula-bar"><div id="amp-bar" class="kinetic"></div></div></div>
            <div class="formula-display">Sound travels in waves</div>`;
        container.innerHTML = `
            <div class="game-container sound-game">
                <div class="speaker">🔊</div>
                <div class="sound-wave-display"></div>
                <div class="game-controls-panel">
                    <label>Frequency</label><input type="range" id="freq-slider" min="1" max="10" value="3">
                    <label>Amplitude</label><input type="range" id="amp-slider" min="10" max="50" value="20">
                </div>
            </div>`;
        const el = {
            display: container.querySelector('.sound-wave-display'), freqSlider: container.querySelector('#freq-slider'),
            ampSlider: container.querySelector('#amp-slider'), freqBar: this.elements.formula.querySelector('#freq-bar'),
            ampBar: this.elements.formula.querySelector('#amp-bar')
        };
        let time = 0;
        const updateBars = () => {
            el.freqBar.style.width = `${(el.freqSlider.value - 1) / 9 * 100}%`;
            el.ampBar.style.width = `${(el.ampSlider.value - 10) / 40 * 100}%`;
        };
        el.freqSlider.oninput = updateBars; el.ampSlider.oninput = updateBars; updateBars();
        const gameLoop = () => {
            const freq = el.freqSlider.value; const amp = el.ampSlider.value;
            let path = 'M 0 ' + (container.offsetHeight / 2);
            for(let x=0; x < container.offsetWidth; x++) {
                path += ` L ${x} ${Math.sin((x + time) * 0.05 * freq) * amp + (container.offsetHeight / 2)}`;
            }
            el.display.innerHTML = `<svg width="100%" height="100%"><path d="${path}" stroke="#80ffdb" stroke-width="3" fill="none"/></svg>`;
            time++;
            this.animationFrameId = requestAnimationFrame(gameLoop);
        }; gameLoop();
    }
    
    simpleMachinesGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Effort</label><div class="formula-bar"><div id="effort-bar" class="kinetic"></div></div></div>
            <div class="formula-bar-container"><label>Load</label><div class="formula-bar"><div id="load-bar" class="potential"></div></div></div>
            <div class="formula-display">Work = Force x Distance</div>`;
        container.innerHTML = `
            <div class="game-container machine-game">
                <div class="heavy-box">🧱</div><div class="platform"></div><div class="lever"></div>
                <div class="fulcrum">▲</div><div class="effort-arrow">👇</div>
                <div class="game-controls-panel"><label>Click the arrow to apply force!</label></div>
            </div>`;
        const el = {
            lever: container.querySelector('.lever'), box: container.querySelector('.heavy-box'),
            effortArrow: container.querySelector('.effort-arrow'), effortBar: this.elements.formula.querySelector('#effort-bar'),
            loadBar: this.elements.formula.querySelector('#load-bar')
        };
        el.loadBar.style.width = '80%'; // Represents the heavy box
        el.effortArrow.onclick = () => {
            el.lever.classList.add('activated'); el.box.classList.add('lifted');
            el.effortBar.style.width = '40%'; // Less effort needed due to mechanical advantage
            window.audioManager.play('click');
            setTimeout(() => {
                el.lever.classList.remove('activated'); el.box.classList.remove('lifted');
                el.effortBar.style.width = '0%';
            }, 1500);
        };
    }
    
    magnetismGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Magnetic Force</label><div class="formula-bar"><div id="mag-force-bar" class="kinetic"></div></div></div>
            <div class="formula-display">Opposites attract, Likes repel</div>`;
        container.innerHTML = `
            <div class="game-container magnet-game">
                <div id="magnet-ball"></div>
                <div class="magnet north">N</div>
                <div class="magnet south">S</div>
                <div class="magnet-target">🏁</div>
                <div class="game-controls-panel"><label>Drag magnets to move the ball!</label></div>
            </div>`;

        const el = {
            ball: container.querySelector('#magnet-ball'),
            north: container.querySelector('.magnet.north'),
            south: container.querySelector('.magnet.south'),
            forceBar: this.elements.formula.querySelector('#mag-force-bar'),
        };

        let ballPos = { x: 100, y: container.offsetHeight / 2 };
        let ballVel = { x: 0, y: 0 };

        const makeDraggable = (magnet) => {
            magnet.onmousedown = (e) => {
                e.preventDefault();
                const onMouseMove = (move_e) => {
                    magnet.style.left = `${move_e.clientX - container.getBoundingClientRect().left - magnet.offsetWidth / 2}px`;
                    magnet.style.top = `${move_e.clientY - container.getBoundingClientRect().top - magnet.offsetHeight / 2}px`;
                };
                const onMouseUp = () => document.removeEventListener('mousemove', onMouseMove);
                document.addEventListener('mousemove', onMouseMove);
                magnet.onmouseup = onMouseUp;
            };
        };
        makeDraggable(el.north);
        makeDraggable(el.south);

        const gameLoop = () => {
            let force = { x: 0, y: 0 };
            const magnets = [el.north, el.south];
            
            magnets.forEach(magnet => {
                const mRect = magnet.getBoundingClientRect();
                const bRect = el.ball.getBoundingClientRect();
                const mx = mRect.left + mRect.width/2;
                const my = mRect.top + mRect.height/2;
                const bx = bRect.left + bRect.width/2;
                const by = bRect.top + bRect.height/2;

                const dx = mx - bx;
                const dy = my - by;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const forceStrength = 1000 / (dist * dist);

                const multiplier = magnet.classList.contains('north') ? -1 : 1; // North repels, South attracts
                force.x += multiplier * forceStrength * (dx / dist);
                force.y += multiplier * forceStrength * (dy / dist);
            });

            ballVel.x += force.x;
            ballVel.y += force.y;

            ballVel.x *= 0.95; // Damping
            ballVel.y *= 0.95;

            ballPos.x += ballVel.x;
            ballPos.y += ballVel.y;
            
            // Boundary checks
            if (ballPos.x < 0) { ballPos.x = 0; ballVel.x *= -0.5; }
            if (ballPos.x > container.offsetWidth - 20) { ballPos.x = container.offsetWidth - 20; ballVel.x *= -0.5; }
            if (ballPos.y < 0) { ballPos.y = 0; ballVel.y *= -0.5; }
            if (ballPos.y > container.offsetHeight - 20) { ballPos.y = container.offsetHeight - 20; ballVel.y *= -0.5; }

            el.ball.style.left = `${ballPos.x}px`;
            el.ball.style.top = `${ballPos.y}px`;
            
            const totalForce = Math.sqrt(force.x*force.x + force.y*force.y);
            el.forceBar.style.width = `${Math.min(totalForce * 1000, 100)}%`;

            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    pressureAndBuoyancyGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Gravity</label><div class="formula-bar"><div id="grav-bar" class="friction"></div></div></div>
            <div class="formula-bar-container"><label>Buoyancy</label><div class="formula-bar"><div id="buoy-bar" class="potential"></div></div></div>
            <div class="formula-display">Object floats if Buoyancy ≥ Gravity</div>`;
        container.innerHTML = `
            <div class="game-container buoyancy-game">
                <div class="water-tank"><div class="water"></div></div>
                <div class="game-objects">
                    <div class="buoy-obj" data-density="0.5" data-name="Balloon">🎈</div>
                    <div class="buoy-obj" data-density="1.2" data-name="Brick">🧱</div>
                    <div class="buoy-obj" data-density="0.9" data-name="Wood">🪵</div>
                </div>
                 <div class="game-controls-panel"><label>Drag objects into the water!</label></div>
            </div>`;
        const el = { gravBar: this.elements.formula.querySelector('#grav-bar'), buoyBar: this.elements.formula.querySelector('#buoy-bar') };
        container.querySelectorAll('.buoy-obj').forEach(obj => {
            obj.onmousedown = e => {
                const density = parseFloat(obj.dataset.density);
                const gravForce = density * 50; // Arbitrary gravity force
                const buoyForce = 50; // Arbitrary buoyancy force of water
                el.gravBar.style.width = `${Math.min(gravForce, 100)}%`;
                el.buoyBar.style.width = `${buoyForce}%`;
                obj.style.position = 'absolute';
                document.onmousemove = move_e => {
                    obj.style.left = (move_e.clientX - container.getBoundingClientRect().left - 25) + 'px';
                    obj.style.top = (move_e.clientY - container.getBoundingClientRect().top - 25) + 'px';
                };
                obj.onmouseup = () => {
                    document.onmousemove = null; obj.onmouseup = null;
                    if(obj.getBoundingClientRect().top > container.querySelector('.water').getBoundingClientRect().top) {
                        if(gravForce > buoyForce) { obj.style.transition = 'top 1s'; obj.style.top = '85%'; }
                        else { obj.style.transition = 'top 1s'; obj.style.top = '50%'; }
                        window.audioManager.play('collision');
                    }
                };
            };
        });
    }

    electricityGame(container) {
        this.elements.formula.innerHTML = `
            <h3>Formula Explorer</h3>
            <div class="formula-bar-container"><label>Voltage (V)</label><div class="formula-bar"><div id="volt-bar" class="potential"></div></div></div>
            <div class="formula-bar-container"><label>Current (I)</label><div class="formula-bar"><div id="curr-bar" class="kinetic"></div></div></div>
            <div class="formula-display">V = I * R</div>`;
        container.innerHTML = `
        <div class="game-container electricity-game">
            <div id="battery" class="component battery">🔋<div class="wire-terminal" data-id="b1"></div><div class="wire-terminal" data-id="b2"></div></div>
            <div id="bulb" class="component bulb">💡<div class="wire-terminal" data-id="l1"></div><div class="wire-terminal" data-id="l2"></div></div>
            <svg id="wire-svg"></svg>
            <div class="game-controls-panel"><label>Connect terminals to light the bulb!</label></div>
        </div>`;
        const el = {
            bulb: container.querySelector('#bulb'), svg: container.querySelector('#wire-svg'),
            voltBar: this.elements.formula.querySelector('#volt-bar'), currBar: this.elements.formula.querySelector('#curr-bar'),
        };
        el.voltBar.style.width = '100%'; // Battery is always providing voltage
        let isDragging = null, activeWire = null, connections = [];
        const terminals = {};
        container.querySelectorAll('.wire-terminal').forEach(t => terminals[t.dataset.id] = t);
        const getRelativePos = (target, container, event = null) => {
            const tRect = target.getBoundingClientRect(), cRect = container.getBoundingClientRect();
            if (event) return { x: event.clientX - cRect.left, y: event.clientY - cRect.top };
            return { x: tRect.left - cRect.left + 10, y: tRect.top - cRect.top + 10 };
        };
        container.querySelectorAll('.wire-terminal').forEach(t => t.onmousedown = e => {
            isDragging = t; 
            activeWire = document.createElementNS('http://www.w3.org/2000/svg','line');
            const startPos = getRelativePos(e.target, container);
            Object.assign(activeWire.style, { stroke: '#fdd835', strokeWidth: '5', pointerEvents: 'none' });
            activeWire.setAttribute('x1', startPos.x); activeWire.setAttribute('y1', startPos.y);
            activeWire.setAttribute('x2', startPos.x); activeWire.setAttribute('y2', startPos.y);
            el.svg.appendChild(activeWire); window.audioManager.play('click');
        });
        container.onmousemove = e => {
            if (isDragging) {
                const movePos = getRelativePos(null, container, e);
                activeWire.setAttribute('x2', movePos.x); activeWire.setAttribute('y2', movePos.y);
            }
        };
        container.onmouseup = e => {
            if(isDragging && e.target.classList.contains('wire-terminal') && e.target !== isDragging) {
                connections.push([isDragging.dataset.id, e.target.dataset.id]);
                activeWire.setAttribute('x2', getRelativePos(e.target, container).x);
                activeWire.setAttribute('y2', getRelativePos(e.target, container).y);
                checkCircuit(); window.audioManager.play('click');
            } else if (activeWire) { activeWire.remove(); }
            isDragging = null; activeWire = null;
        };
        const checkCircuit = () => {
            const hasPath = (start, end, visited = new Set()) => {
                if (start === end) return true;
                visited.add(start);
                for (const [a, b] of connections) {
                    if (a === start && !visited.has(b)) { if (hasPath(b, end, visited)) return true; }
                    if (b === start && !visited.has(a)) { if (hasPath(a, end, visited)) return true; }
                }
                return false;
            };
            if ( (hasPath('b1', 'l1') && hasPath('b2', 'l2')) || (hasPath('b1', 'l2') && hasPath('b2', 'l1')) ) {
                el.bulb.classList.add('on'); el.currBar.style.width = '80%';
                window.audioManager.playContinuous('electricity');
            } else {
                el.bulb.classList.remove('on'); el.currBar.style.width = '0%';
                window.audioManager.stopContinuous('electricity');
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('conceptNavigation')) {
        new PhysicsPageManager();
    }
});

