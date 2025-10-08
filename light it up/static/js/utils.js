// Utility functions
class PhysicsUtils {
    static calculateSpeed(distance, time) {
        if (time === 0) return 0;
        return distance / time;
    }

    static calculateVelocity(displacement, time) {
        if (time === 0) return 0;
        return displacement / time;
    }

    static calculateAcceleration(initialVelocity, finalVelocity, time) {
        if (time === 0) return 0;
        return (finalVelocity - initialVelocity) / time;
    }

    static calculateMomentum(mass, velocity) {
        return mass * velocity;
    }

    static calculateKineticEnergy(mass, velocity) {
        return 0.5 * mass * velocity * velocity;
    }

    static calculatePotentialEnergy(mass, height, gravity = 9.8) {
        return mass * gravity * height;
    }

    static calculateOhmsLaw(voltage, resistance) {
        if (resistance === 0) return Infinity;
        return voltage / resistance;
    }

    static calculateDensity(mass, volume) {
        if (volume === 0) return Infinity;
        return mass / volume;
    }

    static calculateWaveSpeed(frequency, wavelength) {
        return frequency * wavelength;
    }
}

class AnimationManager {
    static animations = new Map();

    static startAnimation(key, callback) {
        if (this.animations.has(key)) {
            cancelAnimationFrame(this.animations.get(key));
        }
        const animationId = requestAnimationFrame(callback);
        this.animations.set(key, animationId);
        return animationId;
    }

    static stopAnimation(key) {
        if (this.animations.has(key)) {
            cancelAnimationFrame(this.animations.get(key));
            this.animations.delete(key);
        }
    }

    static stopAllAnimations() {
        this.animations.forEach(animationId => {
            cancelAnimationFrame(animationId);
        });
        this.animations.clear();
    }
}

class SpeechManager {
    static isInitialized = false;

    // This function should be called after the first user interaction (e.g., a click)
    static init() {
        if (this.isInitialized || !('speechSynthesis' in window)) {
            return;
        }
        // A dummy speak call to unlock the API in some browsers
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
        this.isInitialized = true;
        console.log("Speech synthesis initialized.");
    }

    static showMessage(message, duration = 5000) {
        const bubble = document.getElementById('speechBubble');
        if (bubble) {
            bubble.textContent = message;
            bubble.style.display = 'block';
            
            setTimeout(() => {
                bubble.style.display = 'none';
            }, duration);
        }
    }

    static speak(text) {
        if ('speechSynthesis' in window) {
            // Check if speech is already happening to avoid interruptions
            if (window.speechSynthesis.speaking) {
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1; // Slightly faster speech
            utterance.pitch = 1.2; // Slightly higher pitch
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-speech not supported in this browser.');
        }
    }

    static showRandomTip() {
        const tips = [
            "Did you know? Light travels at 299,792,458 meters per second!",
            "Fun fact: Sound travels faster in water than in air!",
            "Interesting: The Earth's gravity is what keeps us from floating away!",
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showMessage(randomTip);
    }
}

// DOM utility functions
const DOM = {
    showElement: (id) => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
    },
    
    hideElement: (id) => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    },
    
    setText: (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    },
    
    createElement: (tag, className, innerHTML = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }
};

// Local storage utilities
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhysicsUtils, AnimationManager, SpeechManager, DOM, Storage };
}