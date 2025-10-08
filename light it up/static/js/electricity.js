// Electricity Simulations
class ElectricitySimulations {
    constructor() {
        this.currentSimulation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSimulations();
    }

    setupEventListeners() {
        document.addEventListener('start-electricity-simulation', (e) => {
            this.startSimulation(e.detail.type, e.detail.options);
        });
    }

    initializeSimulations() {
        this.simulations = {
            simple_circuit: this.simpleCircuitSimulation.bind(this),
        };
    }

    startSimulation(type, options = {}) {
        const simulation = this.simulations[type];
        if (simulation) {
            this.currentSimulation = type;
            simulation(options);
        }
    }

    simpleCircuitSimulation(options = {}) {
        const container = document.getElementById('simulationArea');
        container.innerHTML = '';
        // Try to use a Lottie animation if available via toolkit
        if (window.ConceptToolkit) {
            ConceptToolkit.loadLottie(container, 'electric_circuit').then(loaded => {
                if (!loaded) {
                    container.innerHTML = `
                        <div style="text-align: center;">
                            <img src="/static/images/battery.png" alt="Battery" style="width: 100px;">
                            <img src="/static/images/wire.png" alt="Wire" style="width: 100px;">
                            <img src="/static/images/bulb_off.png" alt="Bulb" style="width: 100px;">
                            <img src="/static/images/switch.png" alt="Switch" style="width: 100px;">
                        </div>
                        <p style="text-align: center; margin-top: 20px;">Simple Circuit Simulation</p>
                    `;
                }
            });
            return;
        }

        container.innerHTML = `
            <div style="text-align: center;">
                <img src="/static/images/battery.png" alt="Battery" style="width: 100px;">
                <img src="/static/images/wire.png" alt="Wire" style="width: 100px;">
                <img src="/static/images/bulb_off.png" alt="Bulb" style="width: 100px;">
                <img src="/static/images/switch.png" alt="Switch" style="width: 100px;">
            </div>
            <p style="text-align: center; margin-top: 20px;">Simple Circuit Simulation</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.electricitySimulations = new ElectricitySimulations();
});