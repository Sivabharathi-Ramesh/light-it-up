from flask import Flask, render_template, request, jsonify, session
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'physics_playground_secret_key_2024'

# Simple in-memory storage
user_data = {}
leaderboard = []

# Default concepts data (fallback if file not found)
DEFAULT_CONCEPTS = {
    "motion": {
        "speed": {
            "title": "Speed",
            "definition": "How fast an object is moving",
            "formula": "speed = distance ÷ time",
            "unit": "m/s",
            "example": "A car traveling 100 meters in 5 seconds has a speed of 20 m/s"
        }
    }
}

@app.route('/')
def index():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return render_template('index.html')

@app.route('/save_user', methods=['POST'])
def save_user():
    data = request.json
    user_id = session['user_id']
    
    user_data[user_id] = {
        'name': data['name'],
        'grade': data['grade'],
        'join_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'progress': {
            'motion': {'completed': 0, 'total': 6, 'score': 0},
            'energy': {'completed': 0, 'total': 5, 'score': 0},
            'electricity': {'completed': 0, 'total': 5, 'score': 0},
            'matter': {'completed': 0, 'total': 7, 'score': 0},
            'waves': {'completed': 0, 'total': 5, 'score': 0}
        },
        'total_score': 0,
        'badges': []
    }
    
    return jsonify({"status": "success", "user_id": user_id})

@app.route('/update_progress', methods=['POST'])
def update_progress():
    data = request.json
    user_id = session['user_id']
    
    if user_id in user_data:
        topic = data['topic']
        concept = data['concept']
        score = data.get('score', 10)
        
        user_data[user_id]['progress'][topic]['completed'] += 1
        user_data[user_id]['progress'][topic]['score'] += score
        user_data[user_id]['total_score'] += score
        
        # Update leaderboard
        update_leaderboard(user_id, user_data[user_id]['name'], user_data[user_id]['total_score'])
    
    return jsonify({"status": "success"})

@app.route('/get_user_data')
def get_user_data():
    user_id = session['user_id']
    if user_id in user_data:
        return jsonify(user_data[user_id])
    return jsonify({"error": "User not found"})

@app.route('/get_leaderboard')
def get_leaderboard():
    return jsonify(leaderboard[:10])

@app.route('/get_concepts/<topic>')
def get_concepts(topic):
    try:
        with open('data/concepts.json', 'r') as f:
            concepts = json.load(f)
            return jsonify(concepts.get(topic, {}))
    except FileNotFoundError:
        return jsonify(DEFAULT_CONCEPTS.get(topic, {}))

def update_leaderboard(user_id, name, score):
    global leaderboard
    
    for entry in leaderboard:
        if entry['user_id'] == user_id:
            entry['score'] = score
            break
    else:
        leaderboard.append({
            'user_id': user_id,
            'name': name,
            'score': score,
            'date': datetime.now().strftime("%Y-%m-%d")
        })
    
    leaderboard.sort(key=lambda x: x['score'], reverse=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)