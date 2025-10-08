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
        };

        this.init();
    }

    async init() {
        await this.fetchConcepts();
        if (Object.keys(this.concepts).length > 0) {
            this.conceptKeys = Object.keys(this.concepts);
            this.buildNavigation();
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
        
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (!this.conceptKeys || index < 0 || index >= this.conceptKeys.length) return;

        this.currentConceptIndex = index;
        const key = this.conceptKeys[index];
        const concept = this.concepts[key];
        
        this.displayExplanation(concept);
        this.displayQuiz(key, concept);
        
        this.elements.simulation.innerHTML = `<h2>${concept.title}</h2><p>Game for ${concept.title} coming soon!</p>`;
        this.elements.formula.innerHTML = '';
    }
    
    displayExplanation(concept) {
        this.elements.explanation.innerHTML = `<h3>${concept.title}</h3><p>${concept.concept}</p><hr><h4>Goal</h4><p><em>${concept.goal}</em></p>`;
    }

    displayQuiz(key, concept) {
        this.elements.quiz.innerHTML = `<p style="text-align:center; padding-top:50px;">Quiz for ${concept.title} coming soon!</p>`;
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