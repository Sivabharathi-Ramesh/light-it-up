// Audio Manager for Physics Playground
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.muted = false;
        this.volume = 0.7;
        
        this.init();
    }

    init() {
        // Try to initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupOscillators();
        } catch (e) {
            console.warn('Web Audio API not supported, using fallback sounds');
        }
        
        this.loadSoundEffects();
        this.setupEventListeners();
    }

    setupOscillators() {
        // Create oscillators for different physics phenomena
        this.oscillators = {
            electric: this.audioContext.createOscillator(),
            collision: this.audioContext.createOscillator(),
            wave: this.audioContext.createOscillator(),
            magnet: this.audioContext.createOscillator()
        };

        // Configure electric oscillator (high frequency buzz)
        this.oscillators.electric.type = 'sawtooth';
        this.oscillators.electric.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        // Configure collision oscillator (low frequency thud)
        this.oscillators.collision.type = 'sine';
        this.oscillators.collision.frequency.setValueAtTime(150, this.audioContext.currentTime);
        
        // Configure wave oscillator (medium frequency sine)
        this.oscillators.wave.type = 'sine';
        this.oscillators.wave.frequency.setValueAtTime(440, this.audioContext.currentTime);
        
        // Configure magnet oscillator (pulsating)
        this.oscillators.magnet.type = 'square';
        this.oscillators.magnet.frequency.setValueAtTime(300, this.audioContext.currentTime);

        // Create gain nodes for volume control
        Object.keys(this.oscillators).forEach(key => {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.oscillators[key].connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            this.oscillators[key].gainNode = gainNode;
            this.oscillators[key].start();
        });
    }

    loadSoundEffects() {
        // Predefined sound effects using Web Audio API
        this.sounds.set('click', this.createClickSound.bind(this));
        this.sounds.set('success', this.createSuccessSound.bind(this));
        this.sounds.set('electricity', this.createElectricitySound.bind(this));
        this.sounds.set('collision', this.createCollisionSound.bind(this));
        this.sounds.set('wave', this.createWaveSound.bind(this));
        this.sounds.set('magnet', this.createMagnetSound.bind(this));
        this.sounds.set('pop', this.createPopSound.bind(this));
        this.sounds.set('spring', this.createSpringSound.bind(this));
        this.sounds.set('gravity', this.createGravitySound.bind(this));
        this.sounds.set('nuclear', this.createNuclearSound.bind(this));
    }

    // Sound creation methods
    createClickSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createSuccessSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, this.audioContext.currentTime + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0.4 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createElectricitySound(duration = 1.0) {
        if (!this.audioContext) return;
        
        // Create noise for electric crackle
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 10;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + duration);
    }

    createCollisionSound(impactStrength = 1.0) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Base frequency based on impact strength
        const baseFreq = 100 + (impactStrength * 100);
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.5 * impactStrength * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createWaveSound(frequency = 440, duration = 2.0) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Add slight frequency modulation for wave-like effect
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 5; // 5 Hz modulation
        lfoGain.gain.value = frequency * 0.1; // 10% modulation depth
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        lfo.start();
        oscillator.stop(this.audioContext.currentTime + duration);
        lfo.stop(this.audioContext.currentTime + duration);
    }

    createMagnetSound(attraction = true) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (attraction) {
            // Rising tone for attraction
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.5);
        } else {
            // Falling tone for repulsion
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        }
        
        gainNode.gain.setValueAtTime(0.4 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createPopSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.5 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createSpringSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Bouncing spring effect
        const times = [0, 0.1, 0.2, 0.3, 0.4];
        const freqs = [400, 200, 300, 150, 350];
        
        times.forEach((time, index) => {
            oscillator.frequency.setValueAtTime(freqs[index], this.audioContext.currentTime + time);
        });
        
        gainNode.gain.setValueAtTime(0.4 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createGravitySound(distance = 1.0) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Falling object sound - frequency increases as it falls
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + distance * 0.5);
        
        gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + distance * 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + distance * 0.5);
    }

    createNuclearSound() {
        if (!this.audioContext) return;
        
        // Complex sound for nuclear reactions
        const oscillators = [];
        const frequencies = [80, 160, 320, 640]; // Harmonic series
        
        frequencies.forEach(freq => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 4, this.audioContext.currentTime + 1.0);
            
            const gain = (0.5 / frequencies.length) * this.volume;
            gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1.0);
            
            oscillators.push(oscillator);
        });
    }

    // Public methods
    play(soundName, options = {}) {
        if (this.muted) return;
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound(options);
        }
    }

    playContinuous(soundName) {
        if (this.muted || !this.audioContext) return null;
        
        const oscillator = this.oscillators[soundName];
        if (oscillator && oscillator.gainNode) {
            oscillator.gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
            return oscillator;
        }
        return null;
    }

    stopContinuous(soundName) {
        const oscillator = this.oscillators[soundName];
        if (oscillator && oscillator.gainNode) {
            oscillator.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            // Stop all continuous sounds
            Object.keys(this.oscillators).forEach(key => {
                this.stopContinuous(key);
            });
        }
        return this.muted;
    }

    setupEventListeners() {
        // Add click sounds to buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .topic-card, .concept-item')) {
                this.play('click');
            }
        });

        // Add success sound for correct answers
        document.addEventListener('quiz-correct', () => {
            this.play('success');
        });
    }
}

// Initialize audio manager
window.audioManager = new AudioManager();