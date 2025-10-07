// ===== NEW PHYSICS CONTENT =====
const content = {
    'grade_0': { // Discovery Mode
        learning: "<p><b>Let's Explore!</b> The world is full of amazing things. Some objects can be pushed or pulled. A magnet can pull some objects without even touching them!</p>",
        levels: [
            { type: 'image-choice', question: "Click the object a magnet will pull.", options: ['https://i.imgur.com/Qpyf0sN.png', 'https://i.imgur.com/x9n7K88.png', 'https://i.imgur.com/k6Db4Gf.png'], answer: 1 }, // Rock, Paperclip, Leaf
        ]
    },
    'grade_1-3': { // Easy
        learning: "<p><b>Push and Pull are forces.</b> A force can make something move. Pushing moves things away from you. Pulling brings them closer.</p>",
        levels: [
            { type: 'image-choice', question: "Which picture shows a PUSH?", options: ['https://i.imgur.com/jV3EM18.png', 'https://i.imgur.com/L365m9Y.png'], answer: 0 }, // Pushing a cart, Pulling a rope
            { type: 'image-choice', question: "Which object will sink in water?", options: ['https://i.imgur.com/k6Db4Gf.png', 'https://i.imgur.com/Qpyf0sN.png'], answer: 1 }, // Leaf, Rock
        ]
    },
    'grade_4-5': { // Medium
        learning: "<p><b>Simple Circuits:</b> For electricity to flow and light a bulb, it needs a complete path from a power source (like a battery), through the bulb, and back. This is a complete circuit.</p>",
        levels: [
            { type: 'image-choice', question: "Which circuit will light the bulb?", options: ['https://i.imgur.com/d5yU1mN.png', 'https://i.imgur.com/bTfWb3c.png'], answer: 1 }, // Broken circuit, Complete circuit
            { type: 'image-choice', question: "Which is a simple machine called a lever?", options: ['https://i.imgur.com/g0t6f7b.png', 'https://i.imgur.com/c4t3o7V.png'], answer: 0 }, // See-saw, Bicycle
        ]
    },
    'grade_6-8': { // Hard
        learning: "<p><b>Speed, Distance, and Time</b> are related. Speed is how fast something is moving. The formula is: </p><p><b>Speed = Distance / Time</b></p>",
        levels: [
            { type: 'calculation', question: "A car travels 100 meters in 10 seconds. What is its speed in m/s?", answer: "10" },
            { type: 'image-choice', question: "Which of these is an insulator (stops electricity)?", options: ['https://i.imgur.com/JdDWV7E.png', 'https://i.imgur.com/rN2kL6U.png'], answer: 1 }, // Copper wire, Rubber duck
        ]
    },
    'grade_9-10': { // Expert
        learning: "<p><b>Newton's Second Law of Motion</b> states that the force acting on an object is equal to its mass times its acceleration (F = ma).</p>",
        levels: [
            { type: 'calculation', question: "If a 5 kg box is pushed with a force of 20 Newtons, what is its acceleration in m/s²?", answer: "4" },
            { type: 'image-choice', question: "Which diagram represents Newton's Third Law (action-reaction)?", options: ['https://i.imgur.com/N1SjTWh.png', 'https://i.imgur.com/6U8u1fR.png'], answer: 1 }, // Ball falling (gravity), Rocket propulsion
        ]
    }
};


// ===== GAME STATE AND DOM ELEMENTS (Mostly the same) =====
let playerName = "", playerGrade = "", currentLevel = 0, score = 0, gameActive = true;
const screens = document.querySelectorAll('.screen');
const welcomeMessage = document.getElementById('welcome-message');
const learningTitle = document.getElementById('learning-title');
const learningContent = document.getElementById('learning-content');
const scoreboard = document.getElementById('scoreboard');
const levelTracker = document.getElementById('level-tracker');
const questionTitle = document.getElementById('question-title');
const questionContainer = document.getElementById('question-container');
const optionsContainer = document.getElementById('options-container');
const inputContainer = document.getElementById('input-container');
const answerInput = document.getElementById('answer-input');
const feedbackText = document.getElementById('feedback-text');
const controls = document.getElementById('controls');


// ===== HELPER FUNCTION to switch screens =====
function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}


// ===== REWRITTEN GAME LOGIC =====

function startGame() {
    playerName = document.getElementById('player-name-input').value;
    playerGrade = document.getElementById('player-grade-select').value;

    if (!playerName.trim() || !playerGrade) {
        alert("Please enter your name and select a level!");
        return;
    }

    welcomeMessage.innerText = `Hello, ${playerName}!`;
    showScreen('instructions-screen');
}

function startLearning() {
    const gradeContent = content[playerGrade];
    learningTitle.innerText = `Learning for ${document.querySelector(`#player-grade-select option[value="${playerGrade}"]`).innerText}`;
    learningContent.innerHTML = gradeContent.learning;
    showScreen('learning-screen');
}

function loadGame() {
    currentLevel = 0;
    score = 0;
    gameActive = true;
    updateScoreboard();
    loadLevel();
    showScreen('game-screen');
    controls.classList.remove('hidden');
}

function loadLevel() {
    if (!gameActive) return;

    const levelData = content[playerGrade].levels;

    if (currentLevel < levelData.length) {
        const level = levelData[currentLevel];
        questionTitle.innerText = level.question;
        levelTracker.innerText = `Level: ${currentLevel + 1}`;
        feedbackText.innerText = "";
        optionsContainer.innerHTML = ""; // Clear old options
        questionContainer.innerHTML = "";

        if (level.type === 'image-choice') {
            inputContainer.style.display = 'none';
            level.options.forEach((imgSrc, index) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.classList.add('option-image');
                img.dataset.index = index;
                img.onclick = () => submitAnswer(index);
                optionsContainer.appendChild(img);
            });
        } else if (level.type === 'calculation') {
            inputContainer.style.display = 'block';
            answerInput.value = "";
            answerInput.focus();
        }

    } else {
        gameActive = false;
        questionTitle.innerText = "You completed all levels!";
        questionContainer.innerText = `Great job, ${playerName}! Your final score is ${score}.`;
        optionsContainer.innerHTML = "";
        inputContainer.style.display = 'none';
    }
}

function submitAnswer(userAnswer) {
    if (!gameActive) return;

    const level = content[playerGrade].levels[currentLevel];
    const correctAnswer = level.answer;
    let isCorrect = false;

    if (level.type === 'image-choice') {
        isCorrect = (userAnswer == correctAnswer);
        const selectedImg = document.querySelector(`img[data-index='${userAnswer}']`);
        // Provide visual feedback
        document.querySelectorAll('.option-image').forEach(img => img.onclick = null); // Disable further clicks
        selectedImg.classList.add(isCorrect ? 'correct' : 'incorrect');
    } else { // Calculation
        isCorrect = (answerInput.value.trim() == correctAnswer);
    }
    
    if (isCorrect) {
        score += 10;
        feedbackText.innerText = "Correct! +10 points";
        feedbackText.style.color = 'green';
        currentLevel++;
    } else {
        feedbackText.innerText = `Not quite. Try the next one!`;
        feedbackText.style.color = 'red';
        currentLevel++; // Move to next question even if wrong
    }

    updateScoreboard();
    setTimeout(loadLevel, 2000); // Wait 2 seconds before loading next level
}


function updateScoreboard() {
    scoreboard.innerText = `Score: ${score}`;
}

function resetGame() {
    // Reset state variables
    playerName = "";
    playerGrade = "";
    currentLevel = 0;
    score = 0;
    gameActive = true;

    // Reset UI elements
    document.getElementById('player-name-input').value = "";
    document.getElementById('player-grade-select').value = "";
    controls.classList.add('hidden');
    
    showScreen('welcome-screen');
}


// ===== EVENT LISTENERS =====
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('learn-btn').addEventListener('click', startLearning);
document.getElementById('skip-learn-btn').addEventListener('click', loadGame);
document.getElementById('start-game-btn').addEventListener('click', loadGame);
document.getElementById('submit-answer-btn').addEventListener('click', () => submitAnswer(null)); // For calculation
answerInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') submitAnswer(null); });
document.getElementById('reset-btn').addEventListener('click', resetGame);