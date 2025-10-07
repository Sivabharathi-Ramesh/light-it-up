// Energy Simulations
class EnergySimulations {
    constructor() {
        this.currentSimulation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSimulations();
    }

    setupEventListeners() {
        document.addEventListener('start-energy-simulation', (e) => {
            this.startSimulation(e.detail.type, e.detail.options);
        });
    }

    initializeSimulations() {
        this.simulations = {
            potential_energy: this.potentialEnergySimulation.bind(this),
            kinetic_energy: this.kineticEnergySimulation.bind(this),
        };
    }

    startSimulation(type, options = {}) {
        const simulation = this.simulations[type];
        if (simulation) {
            this.currentSimulation = type;
            simulation(options);
        }
    }

    potentialEnergySimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = `
            <div class="ball" style="left: 50%; top: 50px; background-color: var(--energy);"></div>
            <p style="text-align: center; margin-top: 20px;">Potential Energy Simulation</p>
        `;
    }

    kineticEnergySimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = `
            <div class="ball" style="left: 10%; top: 100px; background-color: var(--energy); animation: slideRight 2s linear infinite;"></div>
            <p style="text-align: center; margin-top: 20px;">Kinetic Energy Simulation</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.energySimulations = new EnergySimulations();
});