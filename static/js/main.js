// Main application controller for Physics Playground
class PhysicsPlayground {
    constructor() {
        this.currentUser = null;
        this.currentTopic = null;
        this.currentConcept = null;
        this.userProgress = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingUser();
        this.loadLeaderboard();
        
        // Show initial tip
        setTimeout(() => {
            SpeechManager.showMessage("Hi! I'm Professor Proton! Ready to explore physics?");
        }, 1000);
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('startLearning').addEventListener('click', () => {
            this.registerUser();
        });

        // Personalized welcome
        document.getElementById('enterPlayground').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Topic navigation
        document.querySelectorAll('.topic-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const topic = e.currentTarget.dataset.topic;
                this.openTopic(topic);
            });
        });

        // Scoreboard
        document.getElementById('viewScoreboard').addEventListener('click', () => {
            this.showScoreboard();
        });

        document.getElementById('backToMenuFromScoreboard').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Back buttons
        document.getElementById('backToWelcome').addEventListener('click', () => {
            this.showWelcomeScreen();
        });

        // Audio controls
        document.getElementById('muteToggle').addEventListener('click', () => {
            if (window.audioManager) {
                const isMuted = window.audioManager.toggleMute();
                const icon = document.querySelector('#muteToggle i');
                icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
        });

        // Name input validation
        document.getElementById('playerName').addEventListener('input', (e) => {
            this.validateNameInput(e.target);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                if (window.audioManager) {
                    const isMuted = window.audioManager.toggleMute();
                    const icon = document.querySelector('#muteToggle i');
                    icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
                }
            }
        });
    }

    checkExistingUser() {
        // Check if user exists in session
        fetch('/get_user_data')
            .then(response => response.json())
            .then(userData => {
                if (userData && !userData.error) {
                    this.currentUser = userData;
                    this.userProgress = userData.progress;
                    this.showMainMenu();
                } else {
                    this.showWelcomeScreen();
                }
            })
            .catch(() => {
                this.showWelcomeScreen();
            });
    }

    validateNameInput(input) {
        const feedback = input.parentElement.querySelector('.input-feedback');
        const name = input.value.trim();
        
        if (name.length === 0) {
            feedback.textContent = '';
            input.style.borderColor = 'var(--primary)';
        } else if (name.length < 2) {
            feedback.textContent = 'Name must be at least 2 characters long';
            input.style.borderColor = 'var(--danger)';
        } else if (name.length > 20) {
            feedback.textContent = 'Name must be less than 20 characters';
            input.style.borderColor = 'var(--danger)';
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            feedback.textContent = 'Name can only contain letters and spaces';
            input.style.borderColor = 'var(--danger)';
        } else {
            feedback.textContent = '✓ Great name!';
            feedback.style.color = 'var(--success)';
            input.style.borderColor = 'var(--success)';
        }
    }

    registerUser() {
        const nameInput = document.getElementById('playerName');
        const gradeInput = document.getElementById('playerGrade');
        const name = nameInput.value.trim();
        
        // Validate name
        if (name.length < 2) {
            this.showInputError(nameInput, 'Please enter a valid name (at least 2 characters)');
            return;
        }
        
        if (name.length > 20) {
            this.showInputError(nameInput, 'Name must be less than 20 characters');
            return;
        }
        
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            this.showInputError(nameInput, 'Name can only contain letters and spaces');
            return;
        }

        // Play success sound
        if (window.audioManager) {
            window.audioManager.play('success');
        }

        this.currentUser = {
            name: name,
            grade: parseInt(gradeInput.value)
        };

        // Save user to server
        fetch('/save_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.currentUser)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.showPersonalizedWelcome();
            }
        })
        .catch(error => {
            console.error('Error saving user:', error);
            // Fallback to client-side only
            this.showPersonalizedWelcome();
        });
    }

    showInputError(input, message) {
        const feedback = input.parentElement.querySelector('.input-feedback');
        feedback.textContent = message;
        feedback.style.color = 'var(--danger)';
        input.style.borderColor = 'var(--danger)';
        
        // Shake animation
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
        
        // Play error sound
        if (window.audioManager) {
            window.audioManager.play('pop');
        }
    }

    showWelcomeScreen() {
        this.showScreen('welcome-screen');
    }

    showPersonalizedWelcome() {
        this.showScreen('personalized-welcome-screen');
        
        // Update personalized greeting
        const greeting = document.getElementById('personalizedGreeting');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        greeting.textContent = `Welcome, ${this.currentUser.name}!`;
        
        // Typewriter effect for welcome message
        this.typewriterEffect(welcomeMessage, 
            `Hello ${this.currentUser.name}! Get ready to explore the amazing world of physics! ` +
            `We'll discover how things move, what energy is, how electricity works, and much more!`);
        
        // Update stats
        this.updateWelcomeStats();
        
        // Play celebration sound
        if (window.audioManager) {
            setTimeout(() => {
                window.audioManager.play('success');
            }, 1000);
        }
    }

    typewriterEffect(element, text, speed = 50) {
        element.innerHTML = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    updateWelcomeStats() {
        // These would normally come from server
        document.getElementById('totalConcepts').textContent = '28';
        document.getElementById('totalBadges').textContent = '5';
    }

    showMainMenu() {
        this.showScreen('main-menu-screen');
        this.updateUserHeader();
        this.updateProgressDisplays();
        
        SpeechManager.showMessage(`Welcome back, ${this.currentUser.name}! What would you like to explore today?`);
    }

    updateUserHeader() {
        document.getElementById('userWelcome').textContent = `Welcome back, ${this.currentUser.name}!`;
        document.getElementById('userTotalScore').textContent = this.currentUser.total_score || '0';
    }

    updateProgressDisplays() {
        // Update overall progress
        const totalConcepts = 28; // Sum of all concepts
        let completedConcepts = 0;
        let totalScore = 0;
        
        Object.values(this.userProgress).forEach(topic => {
            completedConcepts += topic.completed;
            totalScore += topic.score;
        });
        
        const overallProgress = (completedConcepts / totalConcepts) * 100;
        
        document.getElementById('overallProgressBar').style.width = `${overallProgress}%`;
        document.getElementById('overallProgressText').textContent = 
            `${Math.round(overallProgress)}% Complete (${completedConcepts}/${totalConcepts} concepts)`;
        
        // Update topic progress
        Object.keys(this.userProgress).forEach(topic => {
            const progress = this.userProgress[topic];
            const progressBar = document.querySelector(`[data-topic="${topic}"]`);
            const progressText = progressBar.parentElement.nextElementSibling;
            
            if (progressBar) {
                const percentage = (progress.completed / progress.total) * 100;
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `${progress.completed}/${progress.total} Complete`;
            }
        });
    }

    showScoreboard() {
        this.showScreen('scoreboard-screen');
        this.updateScoreboard();
    }

    updateScoreboard() {
        fetch('/get_leaderboard')
            .then(response => response.json())
            .then(leaderboard => {
                this.renderLeaderboard(leaderboard);
                this.updateUserRank(leaderboard);
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
                this.renderLeaderboard([]);
            });
    }

    renderLeaderboard(leaderboard) {
        const container = document.getElementById('scoreboardEntries');
        container.innerHTML = '';
        
        if (leaderboard.length === 0) {
            container.innerHTML = `
                <div class="scoreboard-entry" style="grid-template-columns: 1fr; text-align: center; padding: 30px;">
                    <div>No scores yet. Be the first to play!</div>
                </div>
            `;
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const isCurrentUser = entry.user_id === this.currentUser?.id;
            const entryElement = document.createElement('div');
            entryElement.className = `scoreboard-entry ${isCurrentUser ? 'current-user' : ''}`;
            entryElement.innerHTML = `
                <div class="rank-col">#${index + 1}</div>
                <div class="name-col">
                    ${isCurrentUser ? '👤 ' : ''}${entry.name}
                </div>
                <div class="score-col">${entry.score}</div>
                <div class="badges-col">
                    <div class="badges-container">
                        ${entry.score >= 500 ? '<div class="badge">🏆 Pro</div>' : ''}
                        ${entry.score >= 200 ? '<div class="badge">⭐ Star</div>' : ''}
                    </div>
                </div>
            `;
            container.appendChild(entryElement);
        });
    }

    updateUserRank(leaderboard) {
        const userEntry = leaderboard.find(entry => entry.user_id === this.currentUser?.id);
        
        if (userEntry) {
            const rank = leaderboard.indexOf(userEntry) + 1;
            document.getElementById('userRank').textContent = `#${rank}`;
            document.getElementById('userScoreDisplay').textContent = userEntry.score;
        } else {
            document.getElementById('userRank').textContent = 'Unranked';
            document.getElementById('userScoreDisplay').textContent = '0';
        }
        
        // Update user badges
        this.updateUserBadges();
    }

    updateUserBadges() {
        const container = document.getElementById('userBadgesContainer');
        const badges = this.currentUser?.badges || [];
        
        if (badges.length === 0) {
            container.innerHTML = `
                <div class="badge-placeholder">
                    <i class="fas fa-medal"></i>
                    <p>Complete concepts to earn badges!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = badges.map(badge => {
            const badgeInfo = this.getBadgeInfo(badge);
            return `
                <div class="badge" style="background: linear-gradient(135deg, ${badgeInfo.color1}, ${badgeInfo.color2})">
                    <i class="${badgeInfo.icon}"></i>
                    ${badgeInfo.name}
                </div>
            `;
        }).join('');
    }

    getBadgeInfo(badgeType) {
        const badges = {
            'motion_master': { name: 'Motion Master', icon: 'fas fa-running', color1: '#3498DB', color2: '#2980B9' },
            'energy_master': { name: 'Energy Expert', icon: 'fas fa-bolt', color1: '#FFD700', color2: '#FFA500' },
            'electricity_master': { name: 'Circuit Wizard', icon: 'fas fa-bolt', color1: '#F39C12', color2: '#E67E22' },
            'matter_master': { name: 'Matter Maestro', icon: 'fas fa-vial', color1: '#9B59B6', color2: '#8E44AD' },
            'waves_master': { name: 'Wave Whiz', icon: 'fas fa-water', color1: '#1ABC9C', color2: '#16A085' },
            'physics_pro': { name: 'Physics Pro', icon: 'fas fa-atom', color1: '#E74C3C', color2: '#C0392B' },
            'high_scorer': { name: 'High Scorer', icon: 'fas fa-trophy', color1: '#FFD700', color2: '#FFA500' }
        };
        
        return badges[badgeType] || { name: 'Achievement', icon: 'fas fa-medal', color1: '#95A5A6', color2: '#7F8C8D' };
    }

    openTopic(topic) {
        this.currentTopic = topic;
        
        // In a real app, this would load topic-specific content
        // For now, we'll show a placeholder
        this.showTopicScreen(topic);
        
        SpeechManager.showMessage(`Let's explore ${topic}! So many amazing things to discover!`);
    }

    showTopicScreen(topic) {
        // This would load the actual topic screen
        // For now, we'll just show a message
        alert(`Opening ${topic} topic! This would load interactive simulations.`);
        
        // Simulate completing a concept
        setTimeout(() => {
            this.completeConcept(topic, 'speed');
        }, 2000);
    }

    completeConcept(topic, concept) {
        // Update progress
        fetch('/update_progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                concept: concept,
                score: 10
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Reload user data
                this.loadUserData();
                
                // Show celebration
                this.showConceptCompletionCelebration(topic, concept);
            }
        })
        .catch(error => {
            console.error('Error updating progress:', error);
        });
    }

    loadUserData() {
        fetch('/get_user_data')
            .then(response => response.json())
            .then(userData => {
                if (userData && !userData.error) {
                    this.currentUser = userData;
                    this.userProgress = userData.progress;
                    this.updateProgressDisplays();
                }
            })
            .catch(error => {
                console.error('Error loading user data:', error);
            });
    }

    showConceptCompletionCelebration(topic, concept) {
        // Play celebration sound
        if (window.audioManager) {
            window.audioManager.play('success');
        }
        
        // Show congratulatory message
        SpeechManager.showMessage(`Excellent! You've completed ${concept} in ${topic}!`);
        
        // Create celebration particles
        this.createCelebrationParticles();
    }

    createCelebrationParticles() {
        const container = document.querySelector('.screen.active');
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle celebration-particle';
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${this.getRandomColor()};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            // Random starting position
            const startX = Math.random() * (container?.offsetWidth || 300);
            const startY = Math.random() * (container?.offsetHeight || 300);
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            if (container) {
                container.appendChild(particle);
            }
            
            // Animate particle
            this.animateCelebrationParticle(particle, startX, startY);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }

    animateCelebrationParticle(particle, startX, startY) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const duration = 1000 + Math.random() * 1000;
        
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        
        particle.style.transition = `all ${duration}ms ease-out`;
        particle.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0)`;
        particle.style.opacity = '0';
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    loadLeaderboard() {
        // Preload leaderboard data
        fetch('/get_leaderboard')
            .then(response => response.json())
            .then(leaderboard => {
                // Store for later use
                this.leaderboard = leaderboard;
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
            });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
}

// Speech Manager
class SpeechManager {
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

    static showRandomTip() {
        const tips = [
            "Did you know? Light travels at 299,792,458 meters per second!",
            "Fun fact: Sound travels faster in water than in air!",
            "Interesting: The Earth's gravity is what keeps us from floating away!",
            "Cool fact: Magnets have been used for navigation for centuries!",
            "Amazing: Electricity can be generated from sunlight!",
            "Fascinating: Atoms are mostly empty space!",
            "Wow: The human ear can detect sounds from 20 Hz to 20,000 Hz!"
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showMessage(randomTip);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.physicsPlayground = new PhysicsPlayground();
});

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);