from flask import Flask, render_template, request, jsonify, session
import json
from datetime import datetime
import uuid
import os  # <-- ADD THIS LINE

app = Flask(__name__)
app.secret_key = 'physics_playground_secret_key_2024'

# --- GET THE ABSOLUTE PATH FOR THE PROJECT DIRECTORY ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# In-memory storage (for demonstration)
user_data = {}
leaderboard = []

@app.route('/')
def index():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return render_template('index.html')

# --- ROUTES FOR TOPIC PAGES ---
@app.route('/motion')
def motion():
    return render_template('motion.html')

@app.route('/energy')
def energy():
    return render_template('energy.html')

@app.route('/electricity')
def electricity():
    return render_template('electricity.html')

@app.route('/matter')
def matter():
    return render_template('matter.html')

@app.route('/waves')
def waves():
    return render_template('waves.html')

# --- API ROUTES ---
@app.route('/get_concepts/<topic>')
def get_concepts(topic):
    try:
        # --- BUILD THE FULL, RELIABLE FILE PATH ---
        json_path = os.path.join(BASE_DIR, 'data', 'concepts.json')
        with open(json_path, 'r') as f:
            all_concepts = json.load(f)
            return jsonify(all_concepts.get(topic, {}))
    except FileNotFoundError:
        return jsonify({"error": "Concepts file not found"}), 404

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
            'motion': {'completed': 0, 'total': 5, 'score': 0},
            'energy': {'completed': 0, 'total': 3, 'score': 0},
            'electricity': {'completed': 0, 'total': 0, 'score': 0},
            'matter': {'completed': 0, 'total': 0, 'score': 0},
            'waves': {'completed': 0, 'total': 0, 'score': 0}
        }
    }
    # Also add user to the leaderboard
    update_leaderboard(user_id, data['name'], 0)
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
        score = data.get('score', 10) # Default to 10 points

        if topic and topic in user_data[user_id]['progress']:
            # Update score and completion
            user_data[user_id]['progress'][topic]['score'] += score
            user_data[user_id]['progress'][topic]['completed'] += 1
            user_data[user_id]['total_score'] += score
            
            # Update leaderboard with new total score
            update_leaderboard(user_id, user_data[user_id]['name'], user_data[user_id]['total_score'])
            
            return jsonify({"status": "success", "new_total_score": user_data[user_id]['total_score']})
    
    return jsonify({"status": "error", "message": "User or topic not found"}), 404

@app.route('/get_leaderboard')
def get_leaderboard():
    # Sort by score just in case, and return top 10
    sorted_leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)
    return jsonify(sorted_leaderboard[:10])

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
    
    # Sort the leaderboard every time it's updated
    leaderboard.sort(key=lambda x: x['score'], reverse=True)


if __name__ == '__main__':
    app.run(debug=True)

