// Patient Triage functionality
class PatientTriage {
    constructor() {
        this.demoCases = {
            mild: {
                temperature: 37.8,
                durationDays: 2,
                headache: true,
                bodyPain: true,
                rash: false,
                nauseaVomiting: false,
                breathingDifficulty: false,
                plateletCount: 280,
                travelHistory: false,
                mosquitoExposure: false
            },
            moderate: {
                temperature: 39.2,
                durationDays: 3,
                headache: true,
                bodyPain: true,
                rash: true,
                nauseaVomiting: true,
                breathingDifficulty: false,
                plateletCount: 120,
                travelHistory: false,
                mosquitoExposure: true
            },
            critical: {
                temperature: 40.5,
                durationDays: 5,
                headache: true,
                bodyPain: true,
                rash: false,
                nauseaVomiting: true,
                breathingDifficulty: true,
                plateletCount: 80,
                travelHistory: true,
                mosquitoExposure: true
            }
        };
        this.init();
    }

    init() {
        document.getElementById('patientForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTriage();
        });
    }

    async submitTriage() {
        const submitBtn = document.querySelector('#patientForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
            submitBtn.disabled = true;

            // Collect form data
            const formData = this.collectFormData();
            
            // Send to API
            const result = await window.ftisAPI.triagePatient(formData);
            
            // Display results
            this.displayResults(result);
            
            // Hide empty state
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('resultsPanel').style.display = 'block';
            
        } catch (error) {
            console.error('Triage error:', error);
            this.showError('Failed to process triage assessment. Please try again.');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    collectFormData() {
        return {
            patient_name: document.getElementById('patientName').value || 'Anonymous',
            patient_age: parseInt(document.getElementById('patientAge').value) || null,
            patient_gender: document.getElementById('patientGender').value || '',
            temperature: parseFloat(document.getElementById('temperature').value),
            duration_days: parseInt(document.getElementById('durationDays').value),
            headache: document.getElementById('headache').checked ? 1 : 0,
            body_pain: document.getElementById('bodyPain').checked ? 1 : 0,
            rash: document.getElementById('rash').checked ? 1 : 0,
            nausea_vomiting: document.getElementById('nauseaVomiting').checked ? 1 : 0,
            breathing_difficulty: document.getElementById('breathingDifficulty').checked ? 1 : 0,
            platelet_count: parseInt(document.getElementById('plateletCount').value) || 250,
            travel_history: document.getElementById('travelHistory').checked ? 1 : 0,
            mosquito_exposure: document.getElementById('mosquitoExposure').checked ? 1 : 0
        };
    }

    displayResults(result) {
        const panel = document.getElementById('resultsPanel');
        const colorClass = this.getColorClass(result.triage_color);
        
        panel.innerHTML = `
            <div class="card border-${colorClass}">
                <div class="card-header bg-${colorClass} text-white">
                    <h4 class="mb-0">
                        <i class="fas fa-diagnoses me-2"></i>
                        Triage Assessment Results
                    </h4>
                </div>
                <div class="card-body">
                    <!-- Triage Level -->
                    <div class="alert alert-${colorClass}">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-${this.getTriageIcon(result.triage_level)} fa-2x me-3"></i>
                            <div>
                                <h3 class="mb-0">${result.triage_level} Risk</h3>
                                <p class="mb-0">Triage Score: ${result.triage_score}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Diagnoses -->
                    <div class="mb-4">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-disease me-2"></i>Probable Diagnoses
                        </h5>
                        ${this.createDiagnosesHTML(result.diagnoses)}
                    </div>

                    <!-- Key Factors -->
                    <div class="mb-4">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-lightbulb me-2"></i>Key Factors
                        </h5>
                        ${this.createExplanationsHTML(result.explanations)}
                    </div>

                    <!-- Recommendation -->
                    <div class="alert alert-${colorClass}">
                        <h6 class="alert-heading">
                            <i class="fas fa-list-check me-2"></i>Recommended Action
                        </h6>
                        <p class="mb-0">${result.recommendation}</p>
                    </div>

                    <!-- Case Info -->
                    <div class="mt-4 p-3 bg-light rounded">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            Case ID: ${result.case_id} | Generated: ${new Date().toLocaleString()}
                        </small>
                    </div>
                </div>
            </div>
        `;

        // Scroll to results
        panel.scrollIntoView({ behavior: 'smooth' });
    }

    createDiagnosesHTML(diagnoses) {
        return diagnoses.map(diagnosis => `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${diagnosis.label}</strong>
                    <span class="badge bg-primary">${(diagnosis.prob * 100).toFixed(1)}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${diagnosis.prob * 100}%" 
                         aria-valuenow="${diagnosis.prob * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        `).join('');
    }

    createExplanationsHTML(explanations) {
        return explanations.map(exp => `
            <div class="mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${exp.feature.replace(/_/g, ' ').toUpperCase()}</span>
                    <span class="badge bg-info">${(exp.impact * 100).toFixed(1)}% impact</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-info" role="progressbar" 
                         style="width: ${exp.impact * 100}%">
                    </div>
                </div>
            </div>
        `).join('');
    }

    getColorClass(color) {
        const colorMap = {
            'red': 'danger',
            'orange': 'warning',
            'yellow': 'info',
            'green': 'success'
        };
        return colorMap[color] || 'secondary';
    }

    getTriageIcon(level) {
        const iconMap = {
            'Critical': 'exclamation-triangle',
            'High': 'exclamation-circle',
            'Moderate': 'info-circle',
            'Mild': 'check-circle'
        };
        return iconMap[level] || 'stethoscope';
    }

    loadDemoCase(caseType) {
        const demoCase = this.demoCases[caseType];
        
        // Fill form with demo data
        document.getElementById('temperature').value = demoCase.temperature;
        document.getElementById('durationDays').value = demoCase.durationDays;
        document.getElementById('plateletCount').value = demoCase.plateletCount;
        
        // Set checkboxes
        document.getElementById('headache').checked = demoCase.headache;
        document.getElementById('bodyPain').checked = demoCase.bodyPain;
        document.getElementById('rash').checked = demoCase.rash;
        document.getElementById('nauseaVomiting').checked = demoCase.nauseaVomiting;
        document.getElementById('breathingDifficulty').checked = demoCase.breathingDifficulty;
        document.getElementById('travelHistory').checked = demoCase.travelHistory;
        document.getElementById('mosquitoExposure').checked = demoCase.mosquitoExposure;
        
        this.showToast(`Loaded ${caseType} case demo data`, 'info');
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container-fluid').insertBefore(alert, document.querySelector('.row'));
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    showToast(message, type = 'info') {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        container.appendChild(toast);
        
        document.body.appendChild(container);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            container.remove();
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.patientTriage = new PatientTriage();
});

// Global function for demo cases
function loadDemoCase(caseType) {
    if (window.patientTriage) {
        window.patientTriage.loadDemoCase(caseType);
    }
}