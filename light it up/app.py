from flask import Flask, render_template, request, jsonify, session
import json
import uuid
import os

app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)
app.secret_key = 'science_playground_secret_key_2024'

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# In-memory storage (for demonstration, NOT thread-safe for production)
user_data = {}
leaderboard = []
PERSIST_PATH = os.path.join(BASE_DIR, 'data', 'user_progress.json')


def load_persisted_state():
    global user_data, leaderboard
    try:
        if os.path.exists(PERSIST_PATH):
            with open(PERSIST_PATH, 'r') as pf:
                payload = json.load(pf)
                user_data = payload.get('user_data', {})
                leaderboard = payload.get('leaderboard', [])
    except Exception:
        # If corrupted, ignore and start fresh
        user_data = {}
        leaderboard = []


def save_persisted_state():
    try:
        payload = {
            'user_data': user_data,
            'leaderboard': leaderboard
        }
        with open(PERSIST_PATH, 'w') as pf:
            json.dump(payload, pf, indent=2)
    except Exception as e:
        # Log to stdout for dev visibility
        print('Failed to save persisted state:', e)

@app.route('/')
def index():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return render_template('index.html')

# --- UNIFIED ROUTES FOR TOPICS ---
@app.route('/physics')
def physics():
    return render_template('physics.html')

@app.route('/chemistry')
def chemistry():
    return render_template('chemistry.html')

@app.route('/biology')
def biology():
    return render_template('biology.html')

@app.route('/astronomy')
def astronomy():
    return render_template('astronomy.html')

@app.route('/scientists')
def scientists():
    return render_template('scientists.html')

# --- API ROUTES ---
@app.route('/get_concepts/<topic>')
def get_concepts(topic):
    try:
        json_path = os.path.join(BASE_DIR, 'data', 'concepts.json')
        with open(json_path, 'r') as f:
            all_concepts = json.load(f)
            if topic in all_concepts:
                return jsonify(all_concepts[topic])
            else:
                return jsonify({"error": "Topic not found"}), 404
    except FileNotFoundError:
        return jsonify({"error": "Concepts file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Concepts file is corrupted"}), 500

@app.route('/get_scientists')
def get_scientists():
    try:
        json_path = os.path.join(BASE_DIR, 'data', 'scientists.json')
        with open(json_path, 'r') as f:
            scientists_data = json.load(f)
            return jsonify(scientists_data)
    except FileNotFoundError:
        return jsonify({"error": "Scientists file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Scientists file is corrupted"}), 500

@app.route('/save_user', methods=['POST'])
def save_user():
    data = request.json
    user_id = session.get('user_id')
    if not user_id or not data.get('name'):
        return jsonify({"status": "error", "message": "Invalid data"}), 400

    user_data[user_id] = {
        'id': user_id,
        'name': data['name'],
        'grade': data['grade'],
        'total_score': 0,
        'progress': {
            'physics': {'completed': 0, 'total': 10, 'score': 0},
            'chemistry': {'completed': 0, 'total': 3, 'score': 0},
            'biology': {'completed': 0, 'total': 3, 'score': 0},
            'astronomy': {'completed': 0, 'total': 3, 'score': 0}
        }
    }
    update_leaderboard(user_id, data['name'], 0)
    save_persisted_state()
    return jsonify({"status": "success", "user_id": user_id})

@app.route('/get_user_data')
def get_user_data():
    user_id = session.get('user_id')
    if user_id and user_id in user_data:
        return jsonify(user_data[user_id])
    return jsonify({"error": "User not found"}), 404

@app.route('/update_progress', methods=['POST'])
def update_progress():
    data = request.json
    user_id = session.get('user_id')

    if user_id and user_id in user_data:
        topic = data.get('topic')
        score = data.get('score', 10)

        if topic and topic in user_data[user_id]['progress']:
            # Prevent completed count from exceeding total
            if user_data[user_id]['progress'][topic]['completed'] < user_data[user_id]['progress'][topic]['total']:
                user_data[user_id]['progress'][topic]['score'] += score
                user_data[user_id]['progress'][topic]['completed'] += 1
                user_data[user_id]['total_score'] += score
                update_leaderboard(user_id, user_data[user_id]['name'], user_data[user_id]['total_score'])

            return jsonify({"status": "success", "new_total_score": user_data[user_id]['total_score']})

    return jsonify({"status": "error", "message": "User or topic not found"}), 404

@app.route('/get_leaderboard')
def get_leaderboard_api():
    # Only return top 10, already sorted in update_leaderboard
    return jsonify(leaderboard[:10])

def update_leaderboard(user_id, name, score):
    global leaderboard

    user_found = False
    for entry in leaderboard:
        if entry['id'] == user_id:
            entry['score'] = score
            user_found = True
            break

    if not user_found:
        leaderboard.append({
            'id': user_id,
            'name': name,
            'score': score
        })

    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    # persist leaderboard change
    save_persisted_state()


# Load persisted state on startup
load_persisted_state()

if __name__ == '__main__':
    # Allow overriding port via environment for easier testing
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)