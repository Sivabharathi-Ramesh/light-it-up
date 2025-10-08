// Concept Toolkit: small helpers for rendering quizzes, puzzles, and loading Lottie with fallback
const ConceptToolkit = (function() {
    const fallbackMap = {
        'periodic_table': 'bulb_glow',
        'dna_double_helix': 'bulb_glow',
        'momentum_collision': 'wire_spark',
        'energy': 'bulb_glow',
        'gravity': 'wire_spark'
    };

    async function loadLottie(container, animName) {
        if (!animName) return false;
        const tryLoad = async (name) => {
            const path = `/static/animations/${name}.json`;
            try {
                const res = await fetch(path, { method: 'HEAD' });
                if (!res.ok) return false;
                const player = document.createElement('lottie-player');
                player.setAttribute('src', path);
                player.setAttribute('background', 'transparent');
                player.setAttribute('speed', '1');
                player.setAttribute('loop', 'true');
                player.setAttribute('autoplay', 'true');
                player.style.width = '100%';
                player.style.maxWidth = '480px';
                container.appendChild(player);
                return true;
            } catch (e) {
                return false;
            }
        };

        if (await tryLoad(animName)) return true;
        if (fallbackMap[animName]) return await tryLoad(fallbackMap[animName]);
        return false;
    }

    function renderQuiz(container, quiz, onCorrect) {
        if (!quiz) {
            container.innerHTML = '<div style="text-align:center; padding-top: 40px;">No quiz for this concept.</div>';
            return;
        }
        const optionsHtml = quiz.options.map(opt => `<div class="quiz-option" data-answer="${opt}">${opt}</div>`).join('');
        container.innerHTML = `
            <div class="concept-quiz">
                <h3>Quiz</h3>
                <p class="quiz-question">${quiz.question}</p>
                <div class="quiz-options">${optionsHtml}</div>
                <div class="quiz-feedback" style="margin-top:8px"></div>
            </div>
        `;

        container.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const selected = e.currentTarget.dataset.answer;
                const feedback = container.querySelector('.quiz-feedback');
                container.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
                if (selected === quiz.answer) {
                    e.currentTarget.classList.add('correct');
                    feedback.textContent = 'Correct! 🎉';
                    feedback.style.color = 'var(--success)';
                    // post progress for topic if provided
                    if (quiz.topic) {
                        fetch('/update_progress', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ topic: quiz.topic, score: quiz.score || 10 }) });
                    }
                    if (onCorrect) onCorrect();
                } else {
                    e.currentTarget.classList.add('incorrect');
                    feedback.textContent = 'Not quite — check the correct answer.';
                    feedback.style.color = 'var(--danger)';
                    const correctEl = container.querySelector(`[data-answer="${quiz.answer}"]`);
                    if (correctEl) correctEl.classList.add('correct');
                }
            });
        });
    }

    function renderMatchingPuzzle(container, pairs) {
        // pairs: [{left: 'A', right: '1'}, ...]
        if (!pairs || pairs.length === 0) return;
        const lefts = pairs.map(p => p.left);
        const rights = pairs.map(p => p.right).sort(() => Math.random() - 0.5);
        container.innerHTML = `
            <div class="matching-puzzle">
                <h3>Match the pairs</h3>
                <div style="display:flex; gap:20px; align-items:flex-start;">
                    <div class="left-col">${lefts.map((l, i) => `<div class="left-item" data-index="${i}">${l}</div>`).join('')}</div>
                    <div class="right-col">${rights.map(r => `<div class="right-item" draggable="true">${r}</div>`).join('')}</div>
                </div>
                <div class="puzzle-feedback" style="margin-top:8px"></div>
            </div>
        `;

        const placed = {};
        const rightEls = Array.from(container.querySelectorAll('.right-item'));
        rightEls.forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', el.textContent);
            });
        });
        container.querySelectorAll('.left-item').forEach(leftEl => {
            leftEl.addEventListener('dragover', (e) => e.preventDefault());
            leftEl.addEventListener('drop', (e) => {
                const val = e.dataTransfer.getData('text/plain');
                const idx = parseInt(leftEl.dataset.index, 10);
                placed[idx] = val;
                leftEl.textContent = `${leftEl.textContent.split('\n')[0]} - ${val}`;
                check();
            });
        });

        function check() {
            let allCorrect = true;
            pairs.forEach((p, i) => {
                if (placed[i] !== p.right) allCorrect = false;
            });
            const fb = container.querySelector('.puzzle-feedback');
            if (allCorrect && Object.keys(placed).length === pairs.length) {
                fb.textContent = 'Great! All matched correctly! 🎉';
                fb.style.color = 'var(--success)';
            } else fb.textContent = 'Keep trying...';
        }
    }

    return { loadLottie, renderQuiz, renderMatchingPuzzle };
})();

// Expose to window
window.ConceptToolkit = ConceptToolkit;