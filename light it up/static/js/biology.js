class BiologyPage {
    constructor() {
        this.container = document.body;
        this.nav = document.getElementById('conceptNavigation');
        this.elements = {
            animation: document.getElementById('simulationArea'),
            description: document.getElementById('conceptExplanation') || document.getElementById('conceptExplanation'),
            quiz: document.getElementById('quizContainer')
        };

        this.concepts = {};
        this.init();
    }

    async init() {
        await this.loadConcepts();
        this.buildNav();
        // select first if present
        const firstKey = Object.keys(this.concepts)[0];
        if (firstKey) this.showConcept(firstKey);
    }

    async loadConcepts() {
        try {
            const res = await fetch('/get_concepts/biology');
            const data = await res.json();
            this.concepts = data;
        } catch (err) {
            console.error('Failed to load biology concepts', err);
        }
    }

    buildNav() {
        this.nav.innerHTML = '';
        Object.entries(this.concepts).forEach(([key, concept]) => {
            const btn = document.createElement('button');
            btn.className = 'concept-btn';
            btn.textContent = concept.title || key;
            btn.addEventListener('click', () => this.showConcept(key));
            this.nav.appendChild(btn);
        });
    }

    showConcept(key) {
        const concept = this.concepts[key];
        if (!concept) return;
        // clear areas
        this.elements.animation.innerHTML = '';
        this.elements.description.innerHTML = '';
        this.elements.quiz.innerHTML = '';

        // description
        const title = document.createElement('h2');
        title.textContent = concept.title || key;
        const desc = document.createElement('p');
        desc.innerHTML = concept.concept || concept.definition || '';
        this.elements.description.appendChild(title);
        this.elements.description.appendChild(desc);

        // load animation (use toolkit - will fallback if missing)
        if (window.ConceptToolkit) {
            ConceptToolkit.loadLottie(this.elements.animation, concept.animation || 'dna_double_helix');
        } else {
            this.elements.animation.innerHTML = '<div style="text-align:center; padding-top: 50px;">Animation not available</div>';
        }

        // If matching puzzle defined, use it
        if (concept.matching && Array.isArray(concept.matching.pairs)) {
            ConceptToolkit.renderMatchingPuzzle(this.elements.quiz, concept.matching.pairs);
            return;
        }

        // quiz
        if (concept.quiz) {
            ConceptToolkit.renderQuiz(this.elements.quiz, concept.quiz, () => {
                // progress hook
            });
        }
    }
}

// Initialize when DOM ready
window.addEventListener('DOMContentLoaded', () => {
    try {
        window.BiologyPage = new BiologyPage();
    } catch (e) {
        console.error('Biology page init failed', e);
    }
});
