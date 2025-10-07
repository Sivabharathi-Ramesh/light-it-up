class AstronomyPageManager {
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
            const response = await fetch('/get_concepts/astronomy');
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
        if (!concept.formula) {
            this.elements.formula.innerHTML = '';
            return;
        }
        this.elements.formula.innerHTML = `<h3>Did you know?</h3><p>${concept.formula}</p>`;
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
            feedbackEl.textContent = 'Stellar! Correct! 🎉';
            feedbackEl.style.color = 'var(--success)';
            window.audioManager.play('success');
            this.markConceptAsCompleted(conceptKey);
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
        this.completedConcepts.add(conceptKey);
        const progress = (this.completedConcepts.size / this.conceptKeys.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
    }

    loadNextConcept() {
        this.loadConceptByIndex((this.currentConceptIndex + 1) % this.conceptKeys.length);
    }

    startSimulation(type) {
        const container = this.elements.simulation;
        container.innerHTML = '<div class="stars-bg"></div>'; 

        switch (type) {
            case 'solar_system': this.solarSystemSimulation(container); break;
            case 'stars': this.starsSimulation(container); break;
            case 'galaxy': this.galaxySimulation(container); break;
            default: container.innerHTML += `<p>Coming soon!</p>`;
        }
    }

    solarSystemSimulation(container) {
        container.innerHTML += `
            <div class="solar-system-sim">
                <div class="sun-astro"></div>
                <div class="orbit" style="width: 100px; height: 100px;"><div class="planet mercury"></div></div>
                <div class="orbit" style="width: 150px; height: 150px;"><div class="planet venus"></div></div>
                <div class="orbit" style="width: 200px; height: 200px;"><div class="planet earth"></div></div>
                <div class="orbit" style="width: 250px; height: 250px;"><div class="planet mars"></div></div>
            </div>`;
    }

    starsSimulation(container) {
        // The stars-bg div is already a good background
        container.innerHTML += `<p style="color: white; font-size: 2rem; text-shadow: 2px 2px 4px #000;">Twinkle, twinkle...</p>`;
    }
    
    galaxySimulation(container) {
        container.innerHTML += `<div class="galaxy-sim"></div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AstronomyPageManager();
});