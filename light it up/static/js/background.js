// background.js — layered kid-friendly animated scene with sun, clouds, hills and balloons
(function() {
    const containerId = 'animatedBackground';
    const container = document.getElementById(containerId);
    if (!container) return;
    container.classList.add('kids-bg');
    container.innerHTML = '';
    container.style.pointerEvents = 'none';

    // Sky gradient (handled by CSS), add sun
    const sun = document.createElement('div');
    sun.className = 'bg-sun';
    container.appendChild(sun);

    // Hills layer
    const hills = document.createElement('div');
    hills.className = 'bg-hills';
    container.appendChild(hills);

    // Add drifting clouds
    const cloudCount = 6;
    for (let i = 0; i < cloudCount; i++) {
        const c = document.createElement('div');
        c.className = 'bg-cloud';
        c.style.left = (i * 20 - Math.random() * 10) + '%';
        c.style.top = (5 + Math.random() * 20) + '%';
        c.style.animationDuration = (30 + Math.random() * 30) + 's';
        container.appendChild(c);
    }

    // Balloons layer - gentle float and stop at top
    const balloonCount = 7;
    for (let i = 0; i < balloonCount; i++) {
        const b = document.createElement('div');
        b.className = 'bg-balloon';
        b.style.left = (5 + Math.random() * 90) + '%';
        b.style.bottom = (-60 - Math.random() * 80) + 'px';
        const size = 50 + Math.floor(Math.random() * 70);
        b.style.width = size + 'px';
        b.style.height = Math.floor(size * 1.2) + 'px';
        b.style.background = ['#FF6B6B','#FFD166','#06D6A0','#118AB2','#F8B195'][i % 5];
        b.style.animationDuration = (18 + Math.random() * 18) + 's';
        container.appendChild(b);
        const s = document.createElement('div'); s.className = 'bg-balloon-string'; b.appendChild(s);
    }

    // Reduced motion toggle (prefers-reduced-motion aware)
    function prefersReduce() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) { return false; }
    }

    if (prefersReduce()) {
        container.classList.add('reduced-motion');
    }

    // expose a small API
    window.KidsBackground = {
        toggleReducedMotion() {
            container.classList.toggle('reduced-motion');
        }
    };
})();
