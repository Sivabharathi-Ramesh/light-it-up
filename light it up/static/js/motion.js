class MotionPageManager {
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
        this.buildNavigation();
        this.loadConceptByIndex(0);
        this.elements.nextButton.addEventListener('click', () => this.loadNextConcept());
    }

    async fetchConcepts() {
        try {
            const response = await fetch('/get_concepts/motion');
            this.concepts = await response.json();
            this.conceptKeys = Object.keys(this.concepts);
        } catch (error) {
            console.error("Failed to fetch concepts:", error);
            this.elements.explanation.innerHTML = `<p>Error loading concepts. Please try refreshing the page.</p>`;
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
        if (index < 0 || index >= this.conceptKeys.length) return;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.currentConceptIndex = index;
        const key = this.conceptKeys[index];
        const concept = this.concepts[key];

        this.updateActiveNavItem();
        this.displayExplanation(concept);
        this.displayFunFormula(concept);
        this.displayQuiz(key, concept);
        this.startSimulation(concept.animation);
    }

    updateActiveNavItem() {
        this.elements.navigation.querySelectorAll('.concept-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentConceptIndex);
        });
    }

    displayExplanation(concept) {
        this.elements.explanation.innerHTML = `
            <h3>${concept.title}</h3>
            <p>${concept.definition}</p>
            <hr style="margin: 15px 0;">
            <h4>For example...</h4>
            <p><em>${concept.example}</em></p>
        `;
    }

    displayFunFormula(concept) {
        if (!concept.formula_breakdown) {
            this.elements.formula.innerHTML = '';
            return;
        }

        let breakdownHtml = concept.formula_breakdown.map((item, index) => `
            <li style="animation-delay: ${index * 0.2}s">
                <div class="formula-part">${item.part} <span class="icon">${item.icon}</span></div>
                <div class="formula-desc">${item.description}</div>
            </li>
        `).join('');

        this.elements.formula.innerHTML = `
            <h3>The Secret Formula! 🤫</h3>
            <div class="formula-display">${concept.formula}</div>
            <ul class="formula-breakdown">${breakdownHtml}</ul>
        `;
    }

    displayQuiz(key, concept) {
        const quiz = concept.quiz;
        if (!quiz) {
            this.elements.quiz.innerHTML = '<div style="text-align:center; padding-top: 50px;">No quiz for this one!</div>';
            return;
        }

        const optionsHtml = quiz.options.map(option => 
            `<div class="quiz-option" data-answer="${option}">${option}</div>`
        ).join('');

        this.elements.quiz.innerHTML = `
            <h3>Game Time! 🧠</h3>
            <p class="quiz-question">${quiz.question}</p>
            <div class="quiz-options">${optionsHtml}</div>
            <div class="quiz-feedback"></div>
        `;

        this.elements.quiz.querySelectorAll('.quiz-option').forEach(optionEl => {
            optionEl.addEventListener('click', (e) => this.handleQuizAnswer(e, key, quiz.answer));
        });
    }

    handleQuizAnswer(event, conceptKey, correctAnswer) {
        const selectedOption = event.currentTarget;
        const feedbackEl = this.elements.quiz.querySelector('.quiz-feedback');
        
        this.elements.quiz.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        if (selectedOption.dataset.answer === correctAnswer) {
            selectedOption.classList.add('correct');
            feedbackEl.textContent = 'Awesome! Correct! 🎉';
            feedbackEl.style.color = 'var(--success)';
            window.audioManager.play('success');
            this.markConceptAsCompleted(conceptKey);
            
            // Send progress update to the backend
            fetch('/update_progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: 'motion', score: 10 })
            });

        } else {
            selectedOption.classList.add('incorrect');
            feedbackEl.textContent = 'Not quite! The correct answer is highlighted.';
            feedbackEl.style.color = 'var(--danger)';
            window.audioManager.play('pop');
            const correctEl = this.elements.quiz.querySelector(`[data-answer="${correctAnswer}"]`);
            if (correctEl) correctEl.classList.add('correct');
        }
    }

    markConceptAsCompleted(conceptKey) {
        if (this.completedConcepts.has(conceptKey)) return; // Don't award points twice
        this.completedConcepts.add(conceptKey);
        const progress = (this.completedConcepts.size / this.conceptKeys.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
    }

    loadNextConcept() {
        this.loadConceptByIndex((this.currentConceptIndex + 1) % this.conceptKeys.length);
    }

    startSimulation(type) {
        const container = this.elements.simulation;
        container.innerHTML = '<div class="road"><div class="road-lines"></div></div>';

        switch (type) {
            case 'speed': this.speedSimulation(container); break;
            case 'velocity': this.velocitySimulation(container); break;
            case 'acceleration': this.accelerationSimulation(container); break;
            case 'friction': this.frictionSimulation(container); break;
            case 'newtons_first_law': this.newtonsFirstLawSimulation(container); break;
            default: container.innerHTML = `<p>Coming soon!</p>`;
        }
    }

    createSimButton(text) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'btn btn-motion';
        button.style.position = 'absolute';
        button.style.top = '10px';
        button.style.left = '50%';
        button.style.transform = 'translateX(-50%)';
        return button;
    }

    speedSimulation(container) {
        container.innerHTML += `<div id="sim-car">🚗</div>`;
        const car = document.getElementById('sim-car');
        car.style.bottom = '50px';
        let pos = -100;
        const animate = () => {
            pos += 3;
            if (pos > container.offsetWidth) pos = -100;
            car.style.left = pos + 'px';
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    velocitySimulation(container) {
        container.innerHTML += `<div id="sim-car">✈️</div><div class="velocity-arrow" id="arrow">➡️ East</div>`;
        const plane = document.getElementById('sim-car');
        const arrow = document.getElementById('arrow');
        plane.style.bottom = '100px';
        arrow.style.bottom = '120px';
        let pos = -100;
        const animate = () => {
            pos += 2.5;
            if (pos > container.offsetWidth) pos = -100;
            plane.style.left = pos + 'px';
            arrow.style.left = (pos + 80) + 'px';
            arrow.style.opacity = '1';
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    accelerationSimulation(container) {
        container.innerHTML += `<div id="sim-rocket">🚀</div>`;
        const rocket = document.getElementById('sim-rocket');
        rocket.style.left = '50%';
        rocket.style.transform = 'translateX(-50%)';
        let pos = 10;
        let speed = 0;
        const animate = () => {
            speed += 0.1;
            pos += speed;
            if (pos > container.offsetHeight + 50) {
                pos = 10;
                speed = 0;
            }
            rocket.style.bottom = pos + 'px';
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    frictionSimulation(container) {
        container.innerHTML = `<div class="surface grass">🌿🌿 Grass 🌿🌿</div><div id="sim-box-cat">📦...🐱</div>`;
        const catBox = document.getElementById('sim-box-cat');
        let pos = 50;
        let speed = 0;
        
        const pushButton = this.createSimButton('Push the Box!');
        pushButton.onclick = () => { if (speed === 0) speed = 8; };
        container.appendChild(pushButton);

        const animate = () => {
            pos += speed;
            speed *= 0.98;
            if (speed < 0.1) speed = 0;
            if (pos > container.offsetWidth - 100) speed = 0;
            catBox.style.left = pos + 'px';
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    newtonsFirstLawSimulation(container) {
        container.innerHTML = `<div id="sim-ball">⚽</div>`;
        const ball = document.getElementById('sim-ball');
        ball.style.left = '50px';
        
        const kickButton = this.createSimButton('Kick the Ball!');
        container.appendChild(kickButton);

        let speed = 0;
        let pos = 50;

        kickButton.onclick = () => {
            if (speed === 0) {
                speed = 8;
                window.audioManager.play('pop');
            }
        };

        const animate = () => {
            pos += speed;
            speed *= 0.99;
            if (speed < 0.05) speed = 0;
            if (pos > container.offsetWidth - 50) {
                pos = container.offsetWidth - 50;
                speed = 0;
            }
            ball.style.left = pos + 'px';
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MotionPageManager();
});