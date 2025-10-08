class ChemistryPageManager {
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
            const response = await fetch('/get_concepts/chemistry');
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
        // Use ConceptToolkit to render quizzes (makes UI consistent)
        ConceptToolkit.renderQuiz(this.elements.quiz, quiz, () => {
            // optional: award progress via backend for chemistry (if desired)
            // fetch('/update_progress', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({topic: 'chemistry', score: 10}) });
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

    // Try to load a Lottie animation JSON from static/animations/<name>.json
    async loadLottie(container, animName) {
        if (!animName) return false;
        // Fallback map: map requested names to existing animations when possible
        const fallbackMap = {
            'periodic_table': 'bulb_glow',
            'dna_double_helix': 'bulb_glow',
            'momentum_collision': 'wire_spark',
            'energy': 'bulb_glow',
            'gravity': 'wire_spark'
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

        // Try requested name first
        if (await tryLoad(animName)) return true;

        // Try fallback
        if (fallbackMap[animName]) {
            return await tryLoad(fallbackMap[animName]);
        }

        return false;
    }

    startSimulation(type) {
        const container = this.elements.simulation;
        container.innerHTML = ''; 

        switch (type) {
            case 'atom': this.atomSimulation(container); break;
            case 'states_of_matter': this.statesOfMatterSimulation(container); break;
            case 'chemical_reaction': this.chemicalReactionSimulation(container); break;
            default:
                (async () => {
                    const loaded = await this.loadLottie(container, type);
                    if (!loaded) container.innerHTML = `<p>Coming soon!</p>`;
                })();
                break;
        }
    }

    atomSimulation(container) {
        container.innerHTML = `
            <div class="atom-sim">
                <div class="nucleus"></div>
                <div class="electron-path" style="width: 100px; height: 100px;"><div class="electron"></div></div>
                <div class="electron-path" style="width: 150px; height: 150px; animation-direction: reverse;"><div class="electron"></div></div>
                 <div class="electron-path" style="width: 200px; height: 200px;"><div class="electron"></div></div>
            </div>`;
    }

    statesOfMatterSimulation(container) {
        container.innerHTML = `
            <div class="matter-sim">
                <div class="matter-box solid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                <div class="matter-box liquid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                <div class="matter-box gas"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            </div>
            <div class="matter-labels"><p>Solid</p><p>Liquid</p><p>Gas</p></div>
        `;
    }
    
    chemicalReactionSimulation(container) {
        container.innerHTML = `
            <div class="reaction-sim">
                <div class="beaker left">
                    <div class="fluid blue"></div>
                    <div class="bubbles"></div>
                </div>
                <div class="plus-sign">+</div>
                <div class="beaker right">
                    <div class="fluid yellow"></div>
                </div>
            </div>`;
        
        container.onclick = () => {
            container.querySelector('.reaction-sim').classList.add('reacting');
            window.audioManager.play('wave');
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChemistryPageManager();
});