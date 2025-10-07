class PhysicsPlayground {
    constructor() {
        this.currentUser = null;
        this.currentTopic = null;
        this.userProgress = {};
        this.init(); // Directly call init
    }

    init() {
        console.log("Physics Playground Initializing...");
        this.setupEventListeners();
        this.checkExistingUser();
        this.loadLeaderboard();
        
        setTimeout(() => {
            if (window.SpeechManager) {
                SpeechManager.showMessage("Hi! I'm Professor Proton! Ready to explore physics?");
            }
        }, 1000);
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        const startLearningBtn = document.getElementById('startLearning');
        if (startLearningBtn) {
            startLearningBtn.addEventListener('click', () => this.registerUser());
        }

        const enterPlaygroundBtn = document.getElementById('enterPlayground');
        if (enterPlaygroundBtn) {
            enterPlaygroundBtn.addEventListener('click', () => this.showMainMenu());
        }

        document.querySelectorAll('.topic-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const topic = e.currentTarget.dataset.topic;
                window.location.href = `/${topic}`;
            });
        });

        const viewScoreboardBtn = document.getElementById('viewScoreboard');
        if (viewScoreboardBtn) {
            viewScoreboardBtn.addEventListener('click', () => this.showScoreboard());
        }

        const backToMenuBtn = document.getElementById('backToMenuFromScoreboard');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showMainMenu());
        }

        const backToWelcomeBtn = document.getElementById('backToWelcome');
        if (backToWelcomeBtn) {
            backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());
        }
        
        const muteToggleBtn = document.getElementById('muteToggle');
        if (muteToggleBtn) {
            muteToggleBtn.addEventListener('click', () => {
                if (window.audioManager) {
                    const isMuted = window.audioManager.toggleMute();
                    const icon = muteToggleBtn.querySelector('i');
                    icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
                }
            });
        }

        const playerNameInput = document.getElementById('playerName');
        if (playerNameInput) {
            playerNameInput.addEventListener('input', (e) => this.validateNameInput(e.target));
        }
    }
    
    checkExistingUser() {
        fetch('/get_user_data')
            .then(response => response.json())
            .then(userData => {
                if (userData && !userData.error) {
                    this.currentUser = userData;
                    this.userProgress = userData.progress || {};
                    this.showMainMenu();
                } else {
                    this.showScreen('welcome-screen');
                }
            })
            .catch(() => {
                this.showScreen('welcome-screen');
            });
    }

    validateNameInput(input) {
        const feedback = input.parentElement.querySelector('.input-feedback');
        const name = input.value.trim();
        
        if (name.length === 0) {
            feedback.textContent = '';
            input.style.borderColor = 'var(--primary)';
            return false;
        } else if (name.length < 2) {
            feedback.textContent = 'Name must be at least 2 characters long';
            input.style.borderColor = 'var(--danger)';
            return false;
        } else if (name.length > 20) {
            feedback.textContent = 'Name must be less than 20 characters';
            input.style.borderColor = 'var(--danger)';
            return false;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            feedback.textContent = 'Name can only contain letters and spaces';
            input.style.borderColor = 'var(--danger)';
            return false;
        } else {
            feedback.textContent = '✓ Great name!';
            feedback.style.color = 'var(--success)';
            input.style.borderColor = 'var(--success)';
            return true;
        }
    }

    registerUser() {
        const nameInput = document.getElementById('playerName');
        const gradeInput = document.getElementById('playerGrade');
        
        if (!this.validateNameInput(nameInput)) {
            this.showInputError(nameInput, 'Please enter a valid name.');
            return;
        }
        
        const name = nameInput.value.trim();
        const grade = parseInt(gradeInput.value, 10);

        if (window.audioManager) {
            window.audioManager.play('success');
        }

        this.currentUser = { name, grade };

        fetch('/save_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.currentUser)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.checkExistingUser(); 
                this.showPersonalizedWelcome();
            }
        })
        .catch(error => {
            console.error('Error saving user:', error);
            this.showPersonalizedWelcome();
        });
    }

    showInputError(input, message) {
        const feedback = input.parentElement.querySelector('.input-feedback');
        feedback.textContent = message;
        feedback.style.color = 'var(--danger)';
        input.style.borderColor = 'var(--danger)';
        input.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => { input.style.animation = ''; }, 500);
        if (window.audioManager) {
            window.audioManager.play('pop');
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showWelcomeScreen() {
        this.showScreen('welcome-screen');
    }

    showPersonalizedWelcome() {
        this.showScreen('personalized-welcome-screen');
        document.getElementById('personalizedGreeting').textContent = `Welcome, ${this.currentUser.name}!`;
        this.typewriterEffect(
            document.getElementById('welcomeMessage'),
            'Get ready to explore the amazing world of physics!'
        );
        this.updateWelcomeStats();
    }
    
    typewriterEffect(element, text, speed = 50) {
        element.innerHTML = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        type();
    }

    updateWelcomeStats() {
        document.getElementById('totalConcepts').textContent = '28';
        document.getElementById('totalBadges').textContent = '5';
    }

    showMainMenu() {
        this.showScreen('main-menu-screen');
        this.updateUserHeader();
        this.updateProgressDisplays();
        SpeechManager.showMessage(`Welcome back, ${this.currentUser.name}! What would you like to explore?`);
    }

    updateUserHeader() {
        document.getElementById('userWelcome').textContent = `Welcome back, ${this.currentUser.name}!`;
        document.getElementById('userTotalScore').textContent = this.currentUser.total_score || '0';
    }

    updateProgressDisplays() {
        if (!this.userProgress || Object.keys(this.userProgress).length === 0) {
            return;
        }

        const totalConcepts = Object.values(this.userProgress).reduce((sum, topic) => sum + topic.total, 0);
        let completedConcepts = Object.values(this.userProgress).reduce((sum, topic) => sum + topic.completed, 0);

        const overallProgress = totalConcepts > 0 ? (completedConcepts / totalConcepts) * 100 : 0;
        
        document.getElementById('overallProgressBar').style.width = `${overallProgress}%`;
        document.getElementById('overallProgressText').textContent = 
            `${Math.round(overallProgress)}% Complete (${completedConcepts}/${totalConcepts} concepts)`;
        
        for (const topic in this.userProgress) {
            const progress = this.userProgress[topic];
            const progressBar = document.querySelector(`.topic-card[data-topic="${topic}"] .progress-bar`);
            const progressText = document.querySelector(`.topic-card[data-topic="${topic}"] .progress-text`);
            
            if (progressBar && progressText) {
                const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `${progress.completed}/${progress.total} Complete`;
            }
        }
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
            });
    }

    renderLeaderboard(leaderboard) {
        const container = document.getElementById('scoreboardEntries');
        container.innerHTML = '';
        if (leaderboard.length === 0) {
            container.innerHTML = `<div class="scoreboard-entry" style="text-align: center; grid-template-columns: 1fr;">No scores yet!</div>`;
            return;
        }
        leaderboard.forEach((entry, index) => {
            const isCurrentUser = this.currentUser && entry.user_id === this.currentUser.id;
            const entryHtml = `
                <div class="rank-col">#${index + 1}</div>
                <div class="name-col">${isCurrentUser ? '👤 ' : ''}${entry.name}</div>
                <div class="score-col">${entry.score}</div>
                <div class="badges-col">${this.getBadgesHtml(entry.score)}</div>
            `;
            const entryElement = document.createElement('div');
            entryElement.className = `scoreboard-entry ${isCurrentUser ? 'current-user' : ''}`;
            entryElement.innerHTML = entryHtml;
            container.appendChild(entryElement);
        });
    }
    
    getBadgesHtml(score) {
        let badgesHtml = '';
        if (score >= 500) badgesHtml += '<div class="badge">🏆 Pro</div>';
        if (score >= 200) badgesHtml += '<div class="badge">⭐ Star</div>';
        return badgesHtml || '---';
    }

    updateUserRank(leaderboard) {
        const userEntry = this.currentUser && leaderboard.find(entry => entry.user_id === this.currentUser.id);
        if (userEntry) {
            const rank = leaderboard.indexOf(userEntry) + 1;
            document.getElementById('userRank').textContent = `#${rank}`;
            document.getElementById('userScoreDisplay').textContent = userEntry.score;
        } else if(this.currentUser) {
            document.getElementById('userRank').textContent = 'N/A';
            document.getElementById('userScoreDisplay').textContent = this.currentUser.total_score || '0';
        }
        this.updateUserBadgesDisplay();
    }
    
    updateUserBadgesDisplay() {
        if (!this.currentUser) return;
        const container = document.getElementById('userBadgesContainer');
        const score = this.currentUser.total_score || 0;
        const badgesHtml = this.getBadgesHtml(score);
        if (badgesHtml === '---') {
            container.innerHTML = `<div class="badge-placeholder"><i class="fas fa-medal"></i><p>Complete concepts to earn badges!</p></div>`;
        } else {
            container.innerHTML = badgesHtml;
        }
    }
    
    loadLeaderboard() {
        fetch('/get_leaderboard').catch(error => console.error('Error pre-loading leaderboard:', error));
    }
}

// This waits for the HTML document to be fully parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {
    window.physicsPlayground = new PhysicsPlayground();
});