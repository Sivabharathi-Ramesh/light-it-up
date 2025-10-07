// Matter Simulations
class MatterSimulations {
    constructor() {
        this.currentSimulation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSimulations();
    }

    setupEventListeners() {
        document.addEventListener('start-matter-simulation', (e) => {
            this.startSimulation(e.detail.type, e.detail.options);
        });
    }

    initializeSimulations() {
        this.simulations = {
            states_of_matter: this.statesOfMatterSimulation.bind(this),
        };
    }

    startSimulation(type, options = {}) {
        const simulation = this.simulations[type];
        if (simulation) {
            this.currentSimulation = type;
            simulation(options);
        }
    }

    statesOfMatterSimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-around; align-items: center;">
                <div class="matter-state">
                    <h4>Solid</h4>
                    <div class="box solid"></div>
                </div>
                <div class="matter-state">
                    <h4>Liquid</h4>
                    <div class="box liquid"></div>
                </div>
                <div class="matter-state">
                    <h4>Gas</h4>
                    <div class="box gas"></div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 20px;">States of Matter Simulation</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.matterSimulations = new MatterSimulations();
});