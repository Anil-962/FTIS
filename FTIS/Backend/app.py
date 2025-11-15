from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, PatientCase
import joblib
import shap
import numpy as np
import pandas as pd
from chatbot import medical_chatbot
import json
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ftis_cases.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
CORS(app)

# Global variables
model = None
explainer = None
feature_names = None

def load_model():
    global model, explainer, feature_names
    try:
        model = joblib.load('models/ftis_model.joblib')
        feature_names = ['temperature', 'duration_days', 'headache', 'body_pain', 
                        'rash', 'nausea_vomiting', 'breathing_difficulty', 
                        'platelet_count', 'travel_history', 'mosquito_exposure']
        
        # Create SHAP explainer
        background = shap.utils.sample(model, 100)
        explainer = shap.TreeExplainer(model, background)
        
        print("Model and explainer loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

def calculate_triage_score(input_data):
    """Calculate triage score based on input symptoms"""
    score = 0
    
    # Temperature scoring
    if input_data['temperature'] >= 40: score += 4
    elif input_data['temperature'] >= 39: score += 3
    elif input_data['temperature'] >= 38.5: score += 2
    
    # Duration scoring
    if input_data['duration_days'] >= 7: score += 4
    elif input_data['duration_days'] >= 5: score += 3
    elif input_data['duration_days'] >= 3: score += 2
    
    # Symptom scoring
    if input_data.get('rash', 0): score += 2
    if input_data.get('nausea_vomiting', 0): score += 2
    if input_data.get('breathing_difficulty', 0): score += 4
    if input_data.get('headache', 0): score += 1
    if input_data.get('body_pain', 0): score += 1
    
    # Lab values
    if input_data.get('platelet_count', 250) < 50: score += 5
    elif input_data.get('platelet_count', 250) < 100: score += 4
    elif input_data.get('platelet_count', 250) < 150: score += 3
    
    # Risk factors
    if input_data.get('travel_history', 0): score += 2
    if input_data.get('mosquito_exposure', 0): score += 1
    
    return score

def get_triage_level(score):
    if score >= 13:
        return "Critical", "red"
    elif score >= 9:
        return "High", "orange"
    elif score >= 5:
        return "Moderate", "yellow"
    else:
        return "Mild", "green"

def get_recommendation(triage_level, top_diagnosis):
    recommendations = {
        "Critical": "Seek emergency care immediately. Go to hospital ER now.",
        "High": "Urgent doctor visit required within 12 hours. Consider CBC + specific tests.",
        "Moderate": "Schedule clinic appointment within 24-48 hours. Monitor symptoms closely.",
        "Mild": "Home care with rest, fluids, and fever medication. Monitor for worsening."
    }
    
    base_rec = recommendations[triage_level]
    
    # Add test suggestions based on likely diagnosis
    test_suggestions = {
        "Dengue": "NS1 antigen test, CBC with platelet count",
        "Malaria": "Malaria parasite test, CBC",
        "Typhoid": "Widal test, Blood culture",
        "COVID": "RT-PCR test, Chest X-ray if breathing difficulty",
        "Viral_Fever": "CBC, CRP if prolonged fever"
    }
    
    test_rec = test_suggestions.get(top_diagnosis, "CBC, CRP based on symptoms")
    
    if triage_level in ["High", "Critical"]:
        return f"{base_rec} Recommended tests: {test_rec}"
    else:
        return base_rec

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Prepare input for model
        input_features = [
            float(data['temperature']),
            float(data['duration_days']),
            int(data.get('headache', 0)),
            int(data.get('body_pain', 0)),
            int(data.get('rash', 0)),
            int(data.get('nausea_vomiting', 0)),
            int(data.get('breathing_difficulty', 0)),
            float(data.get('platelet_count', 250)),  # default normal
            int(data.get('travel_history', 0)),
            int(data.get('mosquito_exposure', 0))
        ]
        
        # Convert to DataFrame for model
        X = pd.DataFrame([input_features], columns=feature_names)
        
        # Get predictions
        probabilities = model.predict_proba(X)[0]
        diagnoses = []
        
        for i, class_name in enumerate(model.classes_):
            diagnoses.append({
                "label": class_name.replace('_', ' '),
                "prob": float(probabilities[i])
            })
        
        # Sort by probability
        diagnoses.sort(key=lambda x: x['prob'], reverse=True)
        top_diagnoses = diagnoses[:3]
        
        # Calculate triage score
        triage_score = calculate_triage_score(data)
        triage_level, triage_color = get_triage_level(triage_score)
        
        # Get SHAP explanations
        shap_values = explainer.shap_values(X)
        
        # For multiclass, use the top class
        top_class_idx = np.argmax(probabilities)
        feature_impacts = []
        
        for i, feature in enumerate(feature_names):
            feature_impacts.append({
                "feature": feature,
                "impact": float(np.abs(shap_values[top_class_idx][0][i]))
            })
        
        # Sort by impact
        feature_impacts.sort(key=lambda x: x['impact'], reverse=True)
        top_explanations = feature_impacts[:3]
        
        # Get recommendation
        recommendation = get_recommendation(triage_level, top_diagnoses[0]['label'])
        
        # Create and save case record
        case_id = f"FTIS-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        new_case = PatientCase(
            case_id=case_id,
            patient_name=data.get('patient_name', 'Anonymous'),
            patient_age=data.get('patient_age'),
            patient_gender=data.get('patient_gender'),
            temperature=data['temperature'],
            duration_days=data['duration_days'],
            headache=bool(data.get('headache', 0)),
            body_pain=bool(data.get('body_pain', 0)),
            rash=bool(data.get('rash', 0)),
            nausea_vomiting=bool(data.get('nausea_vomiting', 0)),
            breathing_difficulty=bool(data.get('breathing_difficulty', 0)),
            platelet_count=data.get('platelet_count', 250),
            travel_history=bool(data.get('travel_history', 0)),
            mosquito_exposure=bool(data.get('mosquito_exposure', 0)),
            triage_score=triage_score,
            triage_level=triage_level,
            top_diagnosis=top_diagnoses[0]['label'],
            diagnosis_confidence=top_diagnoses[0]['prob'],
            recommendation=recommendation,
            status='pending'
        )
        
        db.session.add(new_case)
        db.session.commit()
        
        response = {
            "triage_score": triage_score,
            "triage_level": triage_level,
            "triage_color": triage_color,
            "diagnoses": top_diagnoses,
            "explanations": top_explanations,
            "recommendation": recommendation,
            "case_id": case_id,
            "db_id": new_case.id
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Doctor Dashboard Endpoints
@app.route('/cases', methods=['GET'])
def get_cases():
    try:
        status_filter = request.args.get('status', 'all')
        triage_filter = request.args.get('triage_level', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        query = PatientCase.query
        
        if status_filter != 'all':
            query = query.filter(PatientCase.status == status_filter)
        
        if triage_filter != 'all':
            query = query.filter(PatientCase.triage_level == triage_filter)
        
        cases = query.order_by(PatientCase.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'cases': [case.to_dict() for case in cases],
            'total': len(cases)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cases/<int:case_id>', methods=['GET'])
def get_case(case_id):
    try:
        case = PatientCase.query.get_or_404(case_id)
        return jsonify(case.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cases/<int:case_id>', methods=['PUT'])
def update_case(case_id):
    try:
        case = PatientCase.query.get_or_404(case_id)
        data = request.json
        
        # Update fields
        if 'status' in data:
            case.status = data['status']
            if data['status'] == 'completed':
                case.reviewed_at = datetime.utcnow()
        
        if 'assigned_doctor' in data:
            case.assigned_doctor = data['assigned_doctor']
        
        if 'doctor_notes' in data:
            case.doctor_notes = data['doctor_notes']
        
        if 'final_diagnosis' in data:
            case.final_diagnosis = data['final_diagnosis']
        
        if 'treatment_plan' in data:
            case.treatment_plan = data['treatment_plan']
        
        db.session.commit()
        
        return jsonify(case.to_dict())
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # Add to imports
from chatbot import medical_chatbot

# Add new routes after existing endpoints
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        user_context = data.get('context', {})
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Process message through chatbot
        response = medical_chatbot.process_message(user_message, user_context)
        
        # Log the interaction (optional)
        chat_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_message": user_message,
            "bot_response": response,
            "context": user_context
        }
        
        return jsonify({
            "response": response,
            "timestamp": chat_log["timestamp"]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat/suggestions', methods=['GET'])
def get_chat_suggestions():
    """Get suggested questions for the chatbot"""
    suggestions = [
        "What is dengue fever and its symptoms?",
        "How to treat malaria at home?",
        "What are the warning signs for fever?",
        "How to prevent typhoid fever?",
        "What's the difference between viral fever and COVID-19?",
        "When should I go to hospital for fever?",
        "What home remedies help reduce fever?",
        "How long does a typical fever last?"
    ]
    return jsonify({"suggestions": suggestions})

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_cases = PatientCase.query.count()
        pending_cases = PatientCase.query.filter_by(status='pending').count()
        critical_cases = PatientCase.query.filter(PatientCase.triage_level.in_(['Critical', 'High'])).count()
        
        # Cases by status
        status_counts = db.session.query(
            PatientCase.status, 
            db.func.count(PatientCase.id)
        ).group_by(PatientCase.status).all()
        
        # Cases by triage level
        triage_counts = db.session.query(
            PatientCase.triage_level, 
            db.func.count(PatientCase.id)
        ).group_by(PatientCase.triage_level).all()
        
        # Recent cases for dashboard
        recent_cases = PatientCase.query.order_by(
            PatientCase.timestamp.desc()
        ).limit(10).all()
        
        return jsonify({
            "total_cases": total_cases,
            "pending_cases": pending_cases,
            "critical_cases": critical_cases,
            "status_breakdown": dict(status_counts),
            "triage_breakdown": dict(triage_counts),
            "recent_cases": [case.to_dict() for case in recent_cases]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy", 
        "model_loaded": model is not None,
        "database": "connected"
    })

# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        print("Database initialized")

if __name__ == '__main__':
    print("Initializing FTIS database...")
    init_db()
    
    print("Loading FTIS model...")
    load_model()
    
    print("Starting FTIS server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)