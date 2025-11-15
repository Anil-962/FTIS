import re
import random
from datetime import datetime

class MedicalChatbot:
    def __init__(self):
        self.context = {}
        self.medical_knowledge = self._initialize_knowledge()
        
    def _initialize_knowledge(self):
        """Initialize medical knowledge base"""
        return {
            "fever": {
                "definition": "Fever is a temporary increase in body temperature, often a sign that your body is fighting an illness. Normal body temperature is around 37°C (98.6°F).",
                "causes": [
                    "Viral infections (flu, COVID-19, common cold)",
                    "Bacterial infections (strep throat, UTI, pneumonia)",
                    "Inflammatory conditions",
                    "Heat exhaustion",
                    "Certain medications"
                ],
                "home_care": [
                    "Drink plenty of fluids (water, broth, electrolyte solutions)",
                    "Rest and avoid physical exertion",
                    "Use light clothing and keep room temperature comfortable",
                    "Take fever-reducers like acetaminophen or ibuprofen as directed",
                    "Use cool compresses on forehead and wrists"
                ],
                "warning_signs": [
                    "Temperature above 40°C (104°F)",
                    "Fever lasting more than 3 days",
                    "Severe headache or stiff neck",
                    "Difficulty breathing",
                    "Confusion or disorientation",
                    "Seizures",
                    "Rash that doesn't fade under pressure"
                ]
            },
            "dengue": {
                "definition": "Dengue is a mosquito-borne viral infection causing flu-like illness that can develop into severe dengue (dengue hemorrhagic fever).",
                "symptoms": [
                    "High fever (40°C/104°F)",
                    "Severe headache",
                    "Pain behind eyes",
                    "Muscle and joint pain",
                    "Nausea and vomiting",
                    "Skin rash",
                    "Mild bleeding (nose or gum bleed)"
                ],
                "treatment": [
                    "No specific antiviral treatment",
                    "Rest and hydration are crucial",
                    "Acetaminophen for fever and pain (avoid aspirin/ibuprofen)",
                    "Monitor platelet count regularly",
                    "Hospitalization if severe symptoms develop"
                ],
                "prevention": [
                    "Use mosquito repellent",
                    "Wear long-sleeved clothing",
                    "Use mosquito nets",
                    "Eliminate standing water where mosquitoes breed",
                    "Install window screens"
                ]
            },
            "malaria": {
                "definition": "Malaria is a serious parasitic disease transmitted through the bite of infected Anopheles mosquitoes.",
                "symptoms": [
                    "High fever with chills and shivering",
                    "Headache and muscle pains",
                    "Fatigue",
                    "Nausea and vomiting",
                    "Diarrhea",
                    "Anemia and jaundice",
                    "Cyclic fever episodes every 48-72 hours"
                ],
                "treatment": [
                    "Antimalarial medications (chloroquine, artemisinin-based therapy)",
                    "Early diagnosis and treatment are critical",
                    "Hospital care for severe cases",
                    "Supportive care for symptoms"
                ],
                "prevention": [
                    "Antimalarial prophylaxis when traveling to endemic areas",
                    "Mosquito bite prevention",
                    "Sleep under insecticide-treated nets",
                    "Indoor residual spraying"
                ]
            },
            "typhoid": {
                "definition": "Typhoid fever is a bacterial infection caused by Salmonella typhi, spread through contaminated food or water.",
                "symptoms": [
                    "Sustained high fever",
                    "Headache and weakness",
                    "Stomach pain",
                    "Loss of appetite",
                    "Rose-colored spots on chest",
                    "Diarrhea or constipation"
                ],
                "treatment": [
                    "Antibiotics (ceftriaxone, azithromycin)",
                    "Adequate hydration",
                    "Proper nutrition",
                    "Hospitalization for severe cases",
                    "Complete the full course of antibiotics"
                ],
                "prevention": [
                    "Vaccination for travelers to endemic areas",
                    "Drink boiled or bottled water",
                    "Eat well-cooked food",
                    "Practice good hand hygiene",
                    "Avoid raw fruits and vegetables unless peeled"
                ]
            },
            "covid": {
                "definition": "COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus, first identified in 2019.",
                "symptoms": [
                    "Fever or chills",
                    "Cough",
                    "Shortness of breath",
                    "Fatigue",
                    "Muscle or body aches",
                    "Loss of taste or smell",
                    "Sore throat",
                    "Congestion or runny nose"
                ],
                "treatment": [
                    "Rest and hydration",
                    "Fever reducers and pain relievers",
                    "Monitor oxygen saturation with pulse oximeter",
                    "Antiviral medications for high-risk patients",
                    "Hospital care for severe breathing difficulties"
                ],
                "prevention": [
                    "Vaccination and boosters",
                    "Mask-wearing in crowded places",
                    "Hand hygiene",
                    "Physical distancing",
                    "Good ventilation in indoor spaces"
                ]
            }
        }
    
    def _extract_keywords(self, message):
        """Extract medical keywords from user message"""
        message_lower = message.lower()
        keywords = []
        
        # Disease keywords
        diseases = ['fever', 'dengue', 'malaria', 'typhoid', 'covid', 'coronavirus', 'viral', 'flu']
        for disease in diseases:
            if disease in message_lower:
                keywords.append(disease)
        
        # Symptom keywords
        symptoms = ['headache', 'pain', 'rash', 'vomit', 'nausea', 'breath', 'cough', 
                   'temperature', 'chills', 'diarrhea', 'fatigue', 'weakness']
        for symptom in symptoms:
            if symptom in message_lower:
                keywords.append(symptom)
        
        # Question keywords
        questions = ['what', 'how', 'why', 'when', 'treatment', 'cure', 'prevent', 
                    'symptom', 'cause', 'diagnosis', 'test']
        for question in questions:
            if question in message_lower:
                keywords.append(question)
        
        return keywords
    
    def _generate_response(self, message, keywords):
        """Generate appropriate response based on keywords and context"""
        message_lower = message.lower()
        
        # Greeting patterns
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings']):
            return self._get_greeting_response()
        
        # Farewell patterns
        if any(word in message_lower for word in ['bye', 'goodbye', 'thanks', 'thank you']):
            return self._get_farewell_response()
        
        # Disease-specific queries
        for disease in ['dengue', 'malaria', 'typhoid', 'covid']:
            if disease in keywords:
                return self._get_disease_info(disease, message_lower)
        
        # General fever queries
        if 'fever' in keywords:
            return self._get_fever_info(message_lower)
        
        # Treatment queries
        if any(word in keywords for word in ['treatment', 'cure', 'medicine', 'medication']):
            return self._get_treatment_info(keywords)
        
        # Symptom queries
        if any(word in keywords for word in ['symptom', 'sign', 'feel']):
            return self._get_symptom_info(keywords)
        
        # Prevention queries
        if any(word in keywords for word in ['prevent', 'avoid', 'protection']):
            return self._get_prevention_info(keywords)
        
        # Emergency advice
        if any(word in message_lower for word in ['emergency', 'urgent', 'help', 'critical']):
            return self._get_emergency_response()
        
        # Default response for unrecognized queries
        return self._get_default_response()
    
    def _get_greeting_response(self):
        greetings = [
            "Hello! I'm FTIS Assistant. I can help answer questions about fevers, diseases, and general health information. What would you like to know?",
            "Hi there! I'm here to provide medical information about fevers and related conditions. How can I assist you today?",
            "Welcome! I'm your medical information assistant. I can explain symptoms, treatments, and prevention methods for various fever-related illnesses."
        ]
        return random.choice(greetings)
    
    def _get_farewell_response(self):
        farewells = [
            "You're welcome! Remember, I'm not a substitute for professional medical advice. Stay healthy!",
            "Glad I could help! Please consult a healthcare provider for personalized medical advice.",
            "Take care! If symptoms worsen or you have concerns, please seek medical attention."
        ]
        return random.choice(farewells)
    
    def _get_disease_info(self, disease, message):
        """Get information about specific diseases"""
        disease_info = self.medical_knowledge.get(disease, {})
        
        if 'what' in message or 'define' in message:
            return f"**{disease.upper()}**: {disease_info.get('definition', 'Information not available.')}"
        
        elif 'symptom' in message:
            symptoms = disease_info.get('symptoms', [])
            symptom_text = "\n• " + "\n• ".join(symptoms) if symptoms else "No specific symptoms listed."
            return f"**{disease.upper()} Symptoms**:\n{symptom_text}"
        
        elif 'treatment' in message or 'cure' in message:
            treatments = disease_info.get('treatment', [])
            treatment_text = "\n• " + "\n• ".join(treatments) if treatments else "Consult a doctor for treatment options."
            return f"**{disease.upper()} Treatment**:\n{treatment_text}"
        
        elif 'prevent' in message:
            prevention = disease_info.get('prevention', [])
            prevention_text = "\n• " + "\n• ".join(prevention) if prevention else "General hygiene practices are recommended."
            return f"**{disease.upper()} Prevention**:\n{prevention_text}"
        
        else:
            # General disease overview
            definition = disease_info.get('definition', '')
            key_symptoms = disease_info.get('symptoms', [])[:3]
            symptoms_text = "\n• " + "\n• ".join(key_symptoms) if key_symptoms else ""
            return f"**{disease.upper()} Overview**:\n{definition}\n\n**Key Symptoms**:{symptoms_text}"
    
    def _get_fever_info(self, message):
        """Get information about fever"""
        fever_info = self.medical_knowledge['fever']
        
        if 'what' in message or 'define' in message:
            return f"**FEVER**: {fever_info['definition']}"
        
        elif 'cause' in message:
            causes = fever_info['causes']
            causes_text = "\n• " + "\n• ".join(causes)
            return f"**Common Causes of Fever**:{causes_text}"
        
        elif 'treatment' in message or 'home' in message or 'care' in message:
            home_care = fever_info['home_care']
            home_care_text = "\n• " + "\n• ".join(home_care)
            return f"**Fever Home Care**:{home_care_text}"
        
        elif 'warning' in message or 'danger' in message or 'emergency' in message:
            warnings = fever_info['warning_signs']
            warnings_text = "\n• " + "\n• ".join(warnings)
            return f"**Seek Medical Attention if you have**:{warnings_text}"
        
        else:
            return f"**FEVER**: {fever_info['definition']}\n\nFor specific information, ask about causes, home care, or warning signs."
    
    def _get_treatment_info(self, keywords):
        """Get treatment information"""
        for disease in ['dengue', 'malaria', 'typhoid', 'covid']:
            if disease in keywords:
                disease_info = self.medical_knowledge.get(disease, {})
                treatments = disease_info.get('treatment', [])
                treatment_text = "\n• " + "\n• ".join(treatments) if treatments else "Consult a doctor for specific treatment."
                return f"**{disease.upper()} Treatment**:{treatment_text}"
        
        return "Treatment depends on the specific condition. Could you specify which illness you're asking about?"
    
    def _get_symptom_info(self, keywords):
        """Get symptom information"""
        for disease in ['dengue', 'malaria', 'typhoid', 'covid']:
            if disease in keywords:
                disease_info = self.medical_knowledge.get(disease, {})
                symptoms = disease_info.get('symptoms', [])
                symptom_text = "\n• " + "\n• ".join(symptoms) if symptoms else "Symptoms vary by individual."
                return f"**{disease.upper()} Symptoms**:{symptom_text}"
        
        return "Symptoms vary by specific illness. Could you specify which condition you're concerned about?"
    
    def _get_prevention_info(self, keywords):
        """Get prevention information"""
        for disease in ['dengue', 'malaria', 'typhoid', 'covid']:
            if disease in keywords:
                disease_info = self.medical_knowledge.get(disease, {})
                prevention = disease_info.get('prevention', [])
                prevention_text = "\n• " + "\n• ".join(prevention) if prevention else "General preventive measures apply."
                return f"**{disease.upper()} Prevention**:{prevention_text}"
        
        return "For general fever prevention: Practice good hygiene, avoid sick individuals, and maintain a healthy immune system through proper nutrition and rest."
    
    def _get_emergency_response(self):
        emergency_response = """
🚨 **MEDICAL EMERGENCY ADVICE** 🚨

If you or someone else is experiencing:
• Difficulty breathing
• Chest pain or pressure
• Severe bleeding
• Confusion or loss of consciousness
• Seizures
• Severe allergic reaction

**Call emergency services immediately!**

Do not rely on chatbot advice for emergency situations.
"""
        return emergency_response
    
    def _get_default_response(self):
        suggestions = [
            "I'm not sure I understand. Could you try asking about specific diseases like dengue, malaria, typhoid, or COVID-19?",
            "I specialize in fever-related medical information. Try asking about symptoms, treatments, or prevention for specific conditions.",
            "I can help with information about fevers, dengue, malaria, typhoid, and COVID-19. What would you like to know?",
            "Please ask about specific fever-related topics like symptoms, causes, treatments, or prevention methods."
        ]
        return random.choice(suggestions)
    
    def process_message(self, message, user_context=None):
        """Process user message and return response"""
        if user_context:
            self.context.update(user_context)
        
        # Clean and process message
        message = message.strip()
        if not message:
            return "Please type a message so I can help you!"
        
        # Extract keywords
        keywords = self._extract_keywords(message)
        
        # Generate response
        response = self._generate_response(message, keywords)
        
        # Add disclaimer
        disclaimer = "\n\n---\n*Note: I'm an AI assistant providing general information. I'm not a substitute for professional medical advice, diagnosis, or treatment.*"
        
        return response + disclaimer

# Global chatbot instance
medical_chatbot = MedicalChatbot()