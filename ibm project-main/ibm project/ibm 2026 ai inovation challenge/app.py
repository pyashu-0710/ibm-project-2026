from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import time
import os
import db
from agent_logic import agent

app = Flask(__name__)
CORS(app)

# Ensure upload folder exists
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/issues', methods=['GET'])
def get_issues():
    return jsonify(db.get_all_issues())

@app.route('/api/issues', methods=['POST'])
def create_issue():
    data = request.json
    
    # Run Agentic Ward Assignment
    ward = agent.assign_ward(data.get('lat'), data.get('lng'))
    
    new_issue_data = {
        'category': data.get('category'),
        'desc': data.get('desc'),
        'lat': data.get('lat'),
        'lng': data.get('lng'),
        'status': 'Pending',
        'ward_assigned': ward,
        'image_analysis': data.get('image_analysis') # Passed from frontend for now if already analyzed
    }
    
    saved_issue = db.create_issue_db(new_issue_data)
    return jsonify(saved_issue), 201

@app.route('/api/ai-analyze', methods=['POST'])
def ai_analyze():
    if 'photo' not in request.files:
        return jsonify({'analysis': 'No photo uploaded'})
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'analysis': 'No photo selected'})

    if file:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        
        # Agentic Analysis
        analysis_result = agent.analyze_image(filepath)
        
        # Clean up file after analysis (optional, or keep it)
        # os.remove(filepath) 
        
        return jsonify({'analysis': analysis_result})
    
    return jsonify({'analysis': 'Error processing photo'})

if __name__ == '__main__':
    app.run(debug=True)
