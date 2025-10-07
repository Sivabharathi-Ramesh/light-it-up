// Waves Simulations
class WavesSimulations {
    constructor() {
        this.currentSimulation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSimulations();
    }

    setupEventListeners() {
        document.addEventListener('start-waves-simulation', (e) => {
            this.startSimulation(e.detail.type, e.detail.options);
        });
    }

    initializeSimulations() {
        this.simulations = {
            transverse_wave: this.transverseWaveSimulation.bind(this),
            longitudinal_wave: this.longitudinalWaveSimulation.bind(this),
        };
    }

    startSimulation(type, options = {}) {
        const simulation = this.simulations[type];
        if (simulation) {
            this.currentSimulation = type;
            simulation(options);
        }
    }

    transverseWaveSimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = `
            <div class="wave-container">
                <div class="wave transverse"></div>
            </div>
            <p style="text-align: center; margin-top: 20px;">Transverse Wave Simulation</p>
        `;
    }

    longitudinalWaveSimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = `
            <div class="wave-container">
                <div class="wave longitudinal"></div>
            </div>
            <p style="text-align: center; margin-top: 20px;">Longitudinal Wave Simulation</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.wavesSimulations = new WavesSimulations();
});