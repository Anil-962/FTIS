const API_BASE = 'http://localhost:5000';

// Demo cases for quick testing
const demoCases = {
    mild: {
        temperature: 37.8,
        duration_days: 2,
        headache: 1,
        body_pain: 1,
        rash: 0,
        nausea_vomiting: 0,
        breathing_difficulty: 0,
        platelet_count: 280,
        travel_history: 0,
        mosquito_exposure: 0
    },
    moderate: {
        temperature: 39.2,
        duration_days: 3,
        headache: 1,
        body_pain: 1,
        rash: 1,
        nausea_vomiting: 1,
        breathing_difficulty: 0,
        platelet_count: 120,
        travel_history: 0,
        mosquito_exposure: 1
    },
    critical: {
        temperature: 40.5,
        duration_days: 5,
        headache: 1,
        body_pain: 1,
        rash: 0,
        nausea_vomiting: 1,
        breathing_difficulty: 1,
        platelet_count: 80,
        travel_history: 1,
        mosquito_exposure: 1
    }
};

function loadDemoCase(caseType) {
    const demoCase = demoCases[caseType];
    
    // Fill the form with demo data
    document.getElementById('temperature').value = demoCase.temperature;
    document.getElementById('duration_days').value = demoCase.duration_days;
    document.getElementById('platelet_count').value = demoCase.platelet_count;
    
    // Set checkboxes
    document.getElementById('headache').checked = demoCase.headache;
    document.getElementById('body_pain').checked = demoCase.body_pain;
    document.getElementById('rash').checked = demoCase.rash;
    document.getElementById('nausea_vomiting').checked = demoCase.nausea_vomiting;
    document.getElementById('breathing_difficulty').checked = demoCase.breathing_difficulty;
    document.getElementById('travel_history').checked = demoCase.travel_history;
    document.getElementById('mosquito_exposure').checked = demoCase.mosquito_exposure;
    
    // Show which case was loaded
    showAlert(`Loaded ${caseType} case demo data`, 'info');
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.row'));
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}

async function submitForm(event) {
    event.preventDefault();
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = {
            temperature: parseFloat(document.getElementById('temperature').value),
            duration_days: parseInt(document.getElementById('duration_days').value),
            headache: document.getElementById('headache').checked ? 1 : 0,
            body_pain: document.getElementById('body_pain').checked ? 1 : 0,
            rash: document.getElementById('rash').checked ? 1 : 0,
            nausea_vomiting: document.getElementById('nausea_vomiting').checked ? 1 : 0,
            breathing_difficulty: document.getElementById('breathing_difficulty').checked ? 1 : 0,
            platelet_count: parseInt(document.getElementById('platelet_count').value) || 250,
            travel_history: document.getElementById('travel_history').checked ? 1 : 0,
            mosquito_exposure: document.getElementById('mosquito_exposure').checked ? 1 : 0
        };
        
        // Send to API
        const response = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        console.error('Error:', error);
        showAlert(`Error: ${error.message}`, 'danger');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Create results HTML
    const triageClass = `bg-${result.triage_color}`;
    
    let resultsHTML = `
        <div class="card ${result.triage_level === 'Critical' ? 'alert-critical' : ''}">
            <div class="card-header ${triageClass} text-white">
                <h4 class="mb-0">
                    <i class="fas fa-triangle-exclamation me-2"></i>
                    Triage Result: ${result.triage_level} Risk
                </h4>
            </div>
            <div class="card-body">
                <!-- Triage Score -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="text-primary">Triage Score: ${result.triage_score}</h5>
                            <span class="triage-badge ${triageClass}">
                                ${result.triage_level} RISK
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Diagnosis Probabilities -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-diagnoses me-2"></i>
                            Probable Diagnoses
                        </h5>
                        <div class="diagnosis-card p-3 bg-light rounded">
    `;
    
    // Add probability bars for each diagnosis
    result.diagnoses.forEach(diagnosis => {
        const percentage = (diagnosis.prob * 100).toFixed(1);
        resultsHTML += `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <strong>${diagnosis.label}</strong>
                    <span>${percentage}%</span>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsHTML += `
                        </div>
                    </div>
                </div>
                
                <!-- Feature Explanations -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-lightbulb me-2"></i>
                            Key Factors Influencing Prediction
                        </h5>
                        <div class="explanation-card p-3 bg-light rounded">
    `;
    
    result.explanations.forEach(explanation => {
        const impactPercent = (explanation.impact * 100).toFixed(1);
        const featureName = explanation.feature.replace(/_/g, ' ').toUpperCase();
        resultsHTML += `
            <div class="mb-2">
                <div class="d-flex justify-content-between mb-1">
                    <span>${featureName}</span>
                    <span>${impactPercent}% impact</span>
                </div>
                <div class="feature-impact" style="width: ${impactPercent}%"></div>
            </div>
        `;
    });
    
    resultsHTML += `
                        </div>
                    </div>
                </div>
                
                <!-- Recommendation -->
                <div class="row">
                    <div class="col-12">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-list-check me-2"></i>
                            Recommended Action
                        </h5>
                        <div class="recommendation-card p-3 bg-light rounded">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-hand-point-right text-warning me-3 fs-4"></i>
                                <div>
                                    <h6 class="mb-1">${result.recommendation}</h6>
                                    <small class="text-muted">Case ID: FTIS-${result.case_id}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${result.triage_level === 'Critical' ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="alert alert-danger text-center">
                            <h4 class="alert-heading">
                                <i class="fas fa-bell me-2"></i>
                                CRITICAL ALERT
                            </h4>
                            <p class="mb-0">This case requires immediate medical attention. Please proceed to emergency care.</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
    
    // Play alert sound for critical cases
    if (result.triage_level === 'Critical') {
        playAlertSound();
    }
}

function playAlertSound() {
    // Create a simple alert sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio context not supported');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Add form submit handler
    document.getElementById('patientForm').addEventListener('submit', submitForm);
    
    // Test API connection
    fetch(`${API_BASE}/health`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'healthy') {
                console.log('API connection successful');
            }
        })
        .catch(error => {
            console.error('API connection failed:', error);
            showAlert('Warning: Backend API is not reachable. Please ensure the server is running on port 5000.', 'warning');
        });
});
// In submitForm function, update formData collection:
const formData = {
    patient_name: document.getElementById('patient_name').value || 'Anonymous',
    patient_age: parseInt(document.getElementById('patient_age').value) || null,
    patient_gender: document.getElementById('patient_gender').value || '',
    temperature: parseFloat(document.getElementById('temperature').value),
    // ... rest of the existing fields
};