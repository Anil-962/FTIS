from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class PatientCase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.String(20), unique=True, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Patient information
    patient_name = db.Column(db.String(100))
    patient_age = db.Column(db.Integer)
    patient_gender = db.Column(db.String(10))
    
    # Symptoms and vitals
    temperature = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    headache = db.Column(db.Boolean, default=False)
    body_pain = db.Column(db.Boolean, default=False)
    rash = db.Column(db.Boolean, default=False)
    nausea_vomiting = db.Column(db.Boolean, default=False)
    breathing_difficulty = db.Column(db.Boolean, default=False)
    platelet_count = db.Column(db.Float)
    travel_history = db.Column(db.Boolean, default=False)
    mosquito_exposure = db.Column(db.Boolean, default=False)
    
    # Assessment results
    triage_score = db.Column(db.Integer, nullable=False)
    triage_level = db.Column(db.String(20), nullable=False)
    top_diagnosis = db.Column(db.String(50))
    diagnosis_confidence = db.Column(db.Float)
    recommendation = db.Column(db.Text)
    
    # Doctor management
    status = db.Column(db.String(20), default='pending')  # pending, reviewing, completed
    assigned_doctor = db.Column(db.String(100))
    doctor_notes = db.Column(db.Text)
    final_diagnosis = db.Column(db.String(50))
    treatment_plan = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'timestamp': self.timestamp.isoformat(),
            'patient_name': self.patient_name,
            'patient_age': self.patient_age,
            'patient_gender': self.patient_gender,
            'temperature': self.temperature,
            'duration_days': self.duration_days,
            'headache': self.headache,
            'body_pain': self.body_pain,
            'rash': self.rash,
            'nausea_vomiting': self.nausea_vomiting,
            'breathing_difficulty': self.breathing_difficulty,
            'platelet_count': self.platelet_count,
            'travel_history': self.travel_history,
            'mosquito_exposure': self.mosquito_exposure,
            'triage_score': self.triage_score,
            'triage_level': self.triage_level,
            'top_diagnosis': self.top_diagnosis,
            'diagnosis_confidence': self.diagnosis_confidence,
            'recommendation': self.recommendation,
            'status': self.status,
            'assigned_doctor': self.assigned_doctor,
            'doctor_notes': self.doctor_notes,
            'final_diagnosis': self.final_diagnosis,
            'treatment_plan': self.treatment_plan,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }