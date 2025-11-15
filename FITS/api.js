// API service for FTIS frontend
class FTISAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000'; // Backend API URL
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Patient Triage
    async triagePatient(patientData) {
        return await this.request('/predict', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    }

    // Cases Management
    async getCases(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await this.request(`/cases?${queryParams}`);
    }

    async getCase(caseId) {
        return await this.request(`/cases/${caseId}`);
    }

    async updateCase(caseId, updates) {
        return await this.request(`/cases/${caseId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    // Dashboard Stats
    async getStats() {
        return await this.request('/stats');
    }

    // Chatbot
    async sendChatMessage(message, context = {}) {
        return await this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message, context })
        });
    }

    async getChatSuggestions() {
        return await this.request('/chat/suggestions');
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Create global API instance
window.ftisAPI = new FTISAPI();

// Mock data for demo when backend is not available
class MockAPI {
    async triagePatient(patientData) {
        // Simulate API delay
        await this.delay(1000);
        
        // Calculate mock triage score
        const score = this.calculateMockScore(patientData);
        const triageLevel = this.getTriageLevel(score);
        
        return {
            triage_score: score,
            triage_level: triageLevel.level,
            triage_color: triageLevel.color,
            diagnoses: this.generateMockDiagnoses(patientData),
            explanations: this.generateMockExplanations(patientData),
            recommendation: this.generateMockRecommendation(triageLevel.level),
            case_id: `FTIS-${Date.now()}`,
            success: true
        };
    }

    calculateMockScore(patientData) {
        let score = 0;
        
        // Temperature scoring
        if (patientData.temperature >= 40) score += 4;
        else if (patientData.temperature >= 39) score += 3;
        else if (patientData.temperature >= 38.5) score += 2;
        
        // Duration scoring
        if (patientData.duration_days >= 7) score += 4;
        else if (patientData.duration_days >= 5) score += 3;
        else if (patientData.duration_days >= 3) score += 2;
        
        // Symptom scoring
        if (patientData.headache) score += 1;
        if (patientData.body_pain) score += 1;
        if (patientData.rash) score += 2;
        if (patientData.nausea_vomiting) score += 2;
        if (patientData.breathing_difficulty) score += 4;
        
        // Lab values
        const platelets = patientData.platelet_count || 250;
        if (platelets < 50) score += 5;
        else if (platelets < 100) score += 4;
        else if (platelets < 150) score += 3;
        
        // Risk factors
        if (patientData.travel_history) score += 2;
        if (patientData.mosquito_exposure) score += 1;
        
        return Math.min(20, Math.max(1, score));
    }

    getTriageLevel(score) {
        if (score >= 13) return { level: 'Critical', color: 'red' };
        if (score >= 9) return { level: 'High', color: 'orange' };
        if (score >= 5) return { level: 'Moderate', color: 'yellow' };
        return { level: 'Mild', color: 'green' };
    }

    generateMockDiagnoses(patientData) {
        const conditions = ['Dengue', 'Malaria', 'Typhoid', 'Viral_Fever', 'COVID'];
        const baseProbs = [0.3, 0.25, 0.2, 0.15, 0.1];
        
        // Adjust probabilities based on symptoms
        if (patientData.rash && patientData.platelet_count < 150) {
            baseProbs[0] += 0.3; // Dengue
        }
        if (patientData.travel_history && patientData.mosquito_exposure) {
            baseProbs[1] += 0.3; // Malaria
        }
        if (patientData.duration_days > 5) {
            baseProbs[2] += 0.2; // Typhoid
        }
        if (patientData.breathing_difficulty) {
            baseProbs[4] += 0.3; // COVID
        }
        
        // Normalize probabilities
        const total = baseProbs.reduce((sum, prob) => sum + prob, 0);
        const normalizedProbs = baseProbs.map(prob => prob / total);
        
        // Create diagnoses with probabilities
        const diagnoses = conditions.map((condition, index) => ({
            label: condition,
            prob: parseFloat(normalizedProbs[index].toFixed(3))
        }));
        
        // Sort by probability and return top 3
        return diagnoses.sort((a, b) => b.prob - a.prob).slice(0, 3);
    }

    generateMockExplanations(patientData) {
        const features = [
            { name: 'temperature', impact: Math.min(patientData.temperature - 37, 3) },
            { name: 'breathing_difficulty', impact: patientData.breathing_difficulty ? 0.8 : 0 },
            { name: 'platelet_count', impact: patientData.platelet_count ? Math.max(0, (250 - patientData.platelet_count) / 100) : 0 },
            { name: 'rash', impact: patientData.rash ? 0.6 : 0 },
            { name: 'duration_days', impact: Math.min(patientData.duration_days / 5, 1) }
        ];
        
        return features
            .filter(f => f.impact > 0)
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 3)
            .map(f => ({
                feature: f.name,
                impact: parseFloat(f.impact.toFixed(3))
            }));
    }

    generateMockRecommendation(triageLevel) {
        const recommendations = {
            'Critical': 'Seek emergency care immediately. Go to hospital ER now.',
            'High': 'Urgent doctor visit required within 12 hours. Consider CBC + specific tests.',
            'Moderate': 'Schedule clinic appointment within 24-48 hours. Monitor symptoms closely.',
            'Mild': 'Home care with rest, fluids, and fever medication. Monitor for worsening.'
        };
        return recommendations[triageLevel] || 'Consult healthcare provider for assessment.';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Use mock API if real API is not available
window.ftisAPI = new MockAPI();