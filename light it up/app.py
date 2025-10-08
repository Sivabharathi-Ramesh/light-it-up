from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import uuid
import os

app = Flask(__name__)
app.secret_key = 'science_playground_secret_key_2024'

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# In-memory storage (for demonstration)
user_data = {}
leaderboard = []

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
            return jsonify(all_concepts.get(topic, {}))
    except FileNotFoundError:
        return jsonify({"error": "Concepts file not found"}), 404

@app.route('/get_scientists')
def get_scientists():
    try:
        json_path = os.path.join(BASE_DIR, 'data', 'scientists.json')
        with open(json_path, 'r') as f:
            scientists_data = json.load(f)
            return jsonify(scientists_data)
    except FileNotFoundError:
        return jsonify({"error": "Scientists file not found"}), 404

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
def get_leaderboard():
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
    
    leaderboard.sort(key=lambda x: x['score'], reverse=True)


if __name__ == '__main__':
    app.run(debug=True)