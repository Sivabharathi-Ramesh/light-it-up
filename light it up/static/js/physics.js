class PhysicsPageManager {
    constructor() {
        this.concepts = {};
        this.conceptKeys = [];
        this.currentConceptIndex = 0;
        this.completedConcepts = new Set();
        this.animationFrameId = null;

        this.elements = {
            navigation: document.getElementById('conceptNavigation'),
            explanation: document.getElementById('conceptExplanation'),
            simulation: document.getElementById('simulationArea'),
            formula: document.getElementById('funFormulaArea'),
            quiz: document.getElementById('quizContainer'),
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
            this.concepts = await response.json();
        } catch (error) {
            console.error("Failed to fetch concepts:", error);
            this.elements.explanation.innerHTML = `<p style="color:var(--danger);">Error loading concepts.</p>`;
        }
    }

    buildNavigation() {
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
        
        if (!this.conceptKeys || index < 0 || index >= this.conceptKeys.length) return;

        this.currentConceptIndex = index;
        const key = this.conceptKeys[index];
        const concept = this.concepts[key];

        this.updateActiveNavItem();
        this.displayExplanation(concept);
        this.displayFunFormula(concept);
        this.displayQuiz(key, concept);
        this.startMiniGame(concept.animation);
    }

    updateActiveNavItem() {
        this.elements.navigation.querySelectorAll('.concept-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentConceptIndex);
        });
    }
    
    displayExplanation(concept) {
        this.elements.explanation.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> ${concept.title}</h3>
            <p>${concept.concept}</p>
            <hr>
            <h4><i class="fas fa-bullseye"></i> Goal</h4>
            <p><em>${concept.goal}</em></p>
        `;
    }

    displayFunFormula(concept) {
        this.elements.formula.innerHTML = `
            <h3>The Secret Formula! 🤫</h3>
            <div class="formula-display">${concept.formula}</div>`;
    }

    displayQuiz(key, concept) {
        const quiz = concept.quiz;
        if (!quiz) {
            this.elements.quiz.innerHTML = '<p style="text-align:center; padding-top:50px;">No quiz for this one!</p>';
            return;
        }
        const optionsHtml = quiz.options.map(option => `<div class="quiz-option" data-answer="${option}">${option}</div>`).join('');
        this.elements.quiz.innerHTML = `
            <h3>Test Your Knowledge! 🧠</h3>
            <p class="quiz-question">${quiz.question}</p>
            <div class="quiz-options">${optionsHtml}</div>
            <div class="quiz-feedback"></div>`;
        this.elements.quiz.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', e => this.handleQuizAnswer(e, key, quiz.answer));
        });
    }

    handleQuizAnswer(event, conceptKey, correctAnswer) {
        const selectedOption = event.currentTarget;
        const feedbackEl = this.elements.quiz.querySelector('.quiz-feedback');
        
        // Disable all options after an answer is selected
        this.elements.quiz.querySelectorAll('.quiz-option').forEach(opt => opt.style.pointerEvents = 'none');

        if (selectedOption.dataset.answer === correctAnswer) {
            selectedOption.classList.add('correct');
            feedbackEl.textContent = 'Awesome! Correct! 🎉';
            feedbackEl.style.color = 'var(--success)';
            window.audioManager.play('success');
            
            if (!this.completedConcepts.has(conceptKey)) {
                fetch('/update_progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: 'physics', score: 10 })
                });
            }
            this.markConceptAsCompleted(conceptKey);

        } else {
            selectedOption.classList.add('incorrect');
            feedbackEl.textContent = 'Not quite! Try the next one.';
            feedbackEl.style.color = 'var(--danger)';
            window.audioManager.play('pop');
        }
    }

    markConceptAsCompleted(conceptKey) {
        this.completedConcepts.add(conceptKey);
        const progress = (this.completedConcepts.size / this.conceptKeys.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
    }

    loadNextConcept() {
        this.loadConceptByIndex((this.currentConceptIndex + 1) % this.conceptKeys.length);
    }

    startMiniGame(type) {
        const container = this.elements.simulation;
        container.innerHTML = ''; // Clear previous game

        switch (type) {
            case 'speed': this.speedGame(container); break;
            case 'velocity': this.velocityGame(container); break;
            case 'acceleration': this.accelerationGame(container); break;
            case 'gravity': this.gravityGame(container); break;
            case 'energy': this.energyGame(container); break;
            case 'friction': this.frictionGame(container); break;
            case 'electricity': this.electricityGame(container); break;
            case 'magnetism': this.magnetismGame(container); break;
            default: container.innerHTML = `<p>Game coming soon!</p>`;
        }
    }

    // ===== MINI-GAME IMPLEMENTATIONS =====

    speedGame(container) {
        container.innerHTML = '<div class="road"><div class="road-lines"></div></div><div id="sim-car">🚗</div>';
        const car = container.querySelector('#sim-car');
        car.style.bottom = '50px';
        let pos = -100;
        const gameLoop = () => {
            pos += 3;
            if (pos > container.offsetWidth) pos = -100;
            car.style.left = pos + 'px';
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    velocityGame(container) {
        container.innerHTML = '<div id="sim-car">✈️</div><div class="velocity-arrow">➡️ East</div>';
        const plane = container.querySelector('#sim-car');
        const arrow = container.querySelector('.velocity-arrow');
        plane.style.bottom = '100px';
        arrow.style.bottom = '120px';
        let pos = -100;
        const gameLoop = () => {
            pos += 2.5;
            if (pos > container.offsetWidth) pos = -100;
            plane.style.left = pos + 'px';
            arrow.style.left = (pos + 80) + 'px';
            arrow.style.opacity = '1';
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    accelerationGame(container) {
        container.innerHTML = '<div class="road"></div><div id="sim-rocket">🚀</div>';
        const rocket = container.querySelector('#sim-rocket');
        rocket.style.left = '50%';
        rocket.style.transform = 'translateX(-50%)';
        let pos = 10, speed = 0;
        const gameLoop = () => {
            speed += 0.1;
            pos += speed;
            if (pos > container.offsetHeight) { pos = 10; speed = 0; }
            rocket.style.bottom = pos + 'px';
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    gravityGame(container) {
        // Placeholder for gravity game
        container.innerHTML = `<p>Gravity Game coming soon!</p>`;
    }

    energyGame(container) {
        // Placeholder for energy game
        container.innerHTML = `<p>Energy Game coming soon!</p>`;
    }

    frictionGame(container) {
        // Placeholder for friction game
        container.innerHTML = `<p>Friction Game coming soon!</p>`;
    }

    electricityGame(container) {
        // Placeholder for electricity game
        container.innerHTML = `<p>Electricity Game coming soon!</p>`;
    }
    
    magnetismGame(container) {
        // Placeholder for magnetism game
        container.innerHTML = `<p>Magnetism Game coming soon!</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.physics-screen')) {
        new PhysicsPageManager();
    }
});