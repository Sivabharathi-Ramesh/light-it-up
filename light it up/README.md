# Light It Up — Science Playground

A small Flask-based interactive learning platform with kid-friendly mini-games, quizzes and animations.

Quick start (development):

1. Create a Python 3.10+ virtual environment and install Flask:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install flask
```

2. Run the app on a custom port to avoid conflicts:

```bash
PORT=5002 python3 "light it up/app.py"
```

3. Open http://localhost:5002 in your browser.

What changed in this workspace:

- Added `ConceptToolkit` (`static/js/concept_toolkit.js`) — helpers to load Lottie animations with fallback, render quizzes and simple matching puzzles.
- Rewired topic pages to use the toolkit for consistent, kid-friendly quizzes and animation fallbacks.
- Added interactive physics simulations (momentum, energy, gravity, waves, electricity) using simple DOM/canvas logic.
- Added an animated child-friendly background and improved quiz UI in `static/css/style.css`.
- Added simple persistence for user progress in `data/user_progress.json` (auto-created on first save) handled by `app.py`.

Adding new concepts or animations:

- Edit `data/concepts.json` and add a new entry under a topic. Use keys like `title`, `concept`/`definition`, `goal`, `animation` (animation name without `.json`), and `quiz` (object with `question`, `options`, `answer`, optionally `topic` and `score`).
- To add a Lottie animation, place `<name>.json` under `static/animations/` and set `animation` to `<name>` in the concept entry. The toolkit will try the animation and fall back to a default if missing.

Persistence:

- User progress and leaderboard are saved to `data/user_progress.json` automatically when users are created or progress updates are made. This is a simple file-based persistence for development only.

Next suggestions:

- Add ARIA attributes and more accessibility improvements.
- Add automated tests and CI.
- Migrate persistence to SQLite for production use.

Enjoy building interactive science lessons for kids!"}