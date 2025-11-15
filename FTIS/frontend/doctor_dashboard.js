const API_BASE = 'http://localhost:5000';

let allCases = [];
let currentFilters = {
    status: 'all',
    triage: 'all',
    time: 'all',
    sort: 'newest'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    refreshDashboard();
    
    // Refresh every 15 seconds
    setInterval(refreshDashboard, 15000);
    
    // Setup search functionality
    document.getElementById('searchCases').addEventListener('input', filterCases);
});

async function refreshDashboard() {
    try {
        const [statsResponse, casesResponse] = await Promise.all([
            fetch(`${API_BASE}/stats`),
            fetch(`${API_BASE}/cases?limit=100`)
        ]);
        
        const stats = await statsResponse.json();
        const casesData = await casesResponse.json();
        
        if (stats.error) throw new Error(stats.error);
        if (casesData.error) throw new Error(casesData.error);
        
        allCases = casesData.cases;
        updateStats(stats);
        filterCases();
        
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showAlert('Failed to load data. Please check backend connection.', 'danger');
    }
}

function updateStats(stats) {
    document.getElementById('totalCases').textContent = stats.total_cases || 0;
    document.getElementById('pendingCases').textContent = stats.pending_cases || 0;
    document.getElementById('criticalCases').textContent = stats.critical_cases || 0;
    document.getElementById('reviewingCases').textContent = stats.status_breakdown?.reviewing || 0;
    document.getElementById('completedCases').textContent = stats.status_breakdown?.completed || 0;
    
    // Calculate today's cases (simplified)
    const today = new Date().toDateString();
    const todayCases = allCases.filter(caseItem => 
        new Date(caseItem.timestamp).toDateString() === today
    ).length;
    document.getElementById('todayCases').textContent = todayCases;
}

function filterCases() {
    const statusFilter = document.getElementById('statusFilter').value;
    const triageFilter = document.getElementById('triageFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const searchTerm = document.getElementById('searchCases').value.toLowerCase();
    
    currentFilters = { status: statusFilter, triage: triageFilter, time: timeFilter, sort: sortFilter };
    
    let filteredCases = [...allCases];
    
    // Apply filters
    if (statusFilter !== 'all') {
        filteredCases = filteredCases.filter(caseItem => caseItem.status === statusFilter);
    }
    
    if (triageFilter !== 'all') {
        filteredCases = filteredCases.filter(caseItem => caseItem.triage_level === triageFilter);
    }
    
    if (timeFilter !== 'all') {
        const now = new Date();
        filteredCases = filteredCases.filter(caseItem => {
            const caseDate = new Date(caseItem.timestamp);
            switch(timeFilter) {
                case 'today':
                    return caseDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    return caseDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    return caseDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    // Apply search
    if (searchTerm) {
        filteredCases = filteredCases.filter(caseItem => 
            caseItem.case_id.toLowerCase().includes(searchTerm) ||
            (caseItem.patient_name && caseItem.patient_name.toLowerCase().includes(searchTerm)) ||
            caseItem.top_diagnosis.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    filteredCases.sort((a, b) => {
        switch(sortFilter) {
            case 'newest':
                return new Date(b.timestamp) - new Date(a.timestamp);
            case 'oldest':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'critical':
                const criticalOrder = { 'Critical': 4, 'High': 3, 'Moderate': 2, 'Mild': 1 };
                return criticalOrder[b.triage_level] - criticalOrder[a.triage_level];
            case 'score':
                return b.triage_score - a.triage_score;
            default:
                return 0;
        }
    });
    
    updateCasesTable(filteredCases);
}

function updateCasesTable(cases) {
    const tbody = document.getElementById('casesTable');
    const countElement = document.getElementById('casesCount');
    
    countElement.textContent = `${cases.length} cases`;
    
    if (cases.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-inbox me-2"></i>
                    No cases match your filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cases.map(caseItem => {
        const statusBadge = getStatusBadge(caseItem.status);
        const triageBadge = getTriageBadge(caseItem.triage_level);
        const patientInfo = caseItem.patient_name && caseItem.patient_name !== 'Anonymous' 
            ? `${caseItem.patient_name}${caseItem.patient_age ? `, ${caseItem.patient_age}` : ''}`
            : 'Anonymous';
        
        return `
            <tr class="case-row ${caseItem.status === 'pending' ? 'table-warning' : ''}">
                <td>
                    <strong>${caseItem.case_id}</strong>
                    ${caseItem.status === 'pending' ? '<i class="fas fa-clock text-warning ms-1" title="Pending Review"></i>' : ''}
                </td>
                <td>${patientInfo}</td>
                <td>${formatTime(caseItem.timestamp)}</td>
                <td>
                    <span class="badge ${caseItem.temperature >= 39 ? 'bg-danger' : 'bg-warning'}">
                        ${caseItem.temperature}°C
                    </span>
                </td>
                <td>
                    ${triageBadge}
                    <small class="text-muted d-block">Score: ${caseItem.triage_score}</small>
                </td>
                <td>
                    <div><strong>${caseItem.top_diagnosis}</strong></div>
                    <small class="text-muted">${Math.round(caseItem.diagnosis_confidence * 100)}% confidence</small>
                </td>
                <td>${statusBadge}</td>
                <td>${caseItem.assigned_doctor || '<span class="text-muted">Unassigned</span>'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewCaseDetails(${caseItem.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="reviewCase(${caseItem.id})" title="Review Case">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const statusConfig = {
        'pending': { class: 'bg-warning text-dark', text: 'Pending' },
        'reviewing': { class: 'bg-info', text: 'In Progress' },
        'completed': { class: 'bg-success', text: 'Completed' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return `<span class="badge ${config.class}">${config.text}</span>`;
}

function getTriageBadge(level) {
    const levelConfig = {
        'Critical': 'bg-danger',
        'High': 'bg-danger',
        'Moderate': 'bg-warning text-dark',
        'Mild': 'bg-success'
    };
    
    return `<span class="badge ${levelConfig[level]}">${level}</span>`;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function viewCaseDetails(caseId) {
    const caseItem = allCases.find(c => c.id === caseId);
    if (!caseItem) return;
    
    document.getElementById('modalCaseId').textContent = caseItem.case_id;
    
    const modalBody = document.getElementById('caseDetails');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">Patient Information</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr><td><strong>Name:</strong></td><td>${caseItem.patient_name || 'Anonymous'}</td></tr>
                            <tr><td><strong>Age:</strong></td><td>${caseItem.patient_age || 'Not specified'}</td></tr>
                            <tr><td><strong>Gender:</strong></td><td>${caseItem.patient_gender || 'Not specified'}</td></tr>
                            <tr><td><strong>Case ID:</strong></td><td>${caseItem.case_id}</td></tr>
                            <tr><td><strong>Submitted:</strong></td><td>${new Date(caseItem.timestamp).toLocaleString()}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">Vital Signs</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr><td><strong>Temperature:</strong></td><td>${caseItem.temperature}°C</td></tr>
                            <tr><td><strong>Fever Duration:</strong></td><td>${caseItem.duration_days} days</td></tr>
                            <tr><td><strong>Platelet Count:</strong></td><td>${caseItem.platelet_count || 'Not specified'} x10³/μL</td></tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0">Symptoms</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${['headache', 'body_pain', 'rash', 'nausea_vomiting', 'breathing_difficulty', 'travel_history', 'mosquito_exposure']
                                .map(symptom => `
                                    <div class="col-6 mb-2">
                                        <i class="fas ${caseItem[symptom] ? 'fa-check text-success' : 'fa-times text-muted'} me-1"></i>
                                        ${symptom.replace(/_/g, ' ').toUpperCase()}
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">AI Assessment</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr><td><strong>Triage Score:</strong></td><td><span class="badge ${getTriageBadge(caseItem.triage_level).split('"')[1]}">${caseItem.triage_score} - ${caseItem.triage_level}</span></td></tr>
                            <tr><td><strong>AI Diagnosis:</strong></td><td>${caseItem.top_diagnosis} (${Math.round(caseItem.diagnosis_confidence * 100)}% confidence)</td></tr>
                            <tr><td><strong>Recommendation:</strong></td><td>${caseItem.recommendation}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        ${caseItem.final_diagnosis ? `
        <div class="row mt-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">Doctor Review</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>Status:</strong> ${getStatusBadge(caseItem.status)}
                            </div>
                            <div class="col-md-4">
                                <strong>Assigned Doctor:</strong> ${caseItem.assigned_doctor || 'Not assigned'}
                            </div>
                            <div class="col-md-4">
                                <strong>Final Diagnosis:</strong> ${caseItem.final_diagnosis}
                            </div>
                        </div>
                        ${caseItem.doctor_notes ? `
                            <div class="mt-2">
                                <strong>Notes:</strong><br>
                                <div class="border rounded p-2 bg-light">${caseItem.doctor_notes}</div>
                            </div>
                        ` : ''}
                        ${caseItem.treatment_plan ? `
                            <div class="mt-2">
                                <strong>Treatment Plan:</strong><br>
                                <div class="border rounded p-2 bg-light">${caseItem.treatment_plan}</div>
                            </div>
                        ` : ''}
                        ${caseItem.reviewed_at ? `
                            <div class="mt-2 text-muted">
                                <small>Reviewed on: ${new Date(caseItem.reviewed_at).toLocaleString()}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('caseModal'));
    modal.show();
}

function reviewCase(caseId) {
    const caseItem = allCases.find(c => c.id === caseId);
    if (!caseItem) return;
    
    document.getElementById('reviewCaseId').textContent = caseItem.case_id;
    document.getElementById('reviewCaseDbId').value = caseItem.id;
    
    // Populate form
    document.getElementById('reviewStatus').value = caseItem.status;
    document.getElementById('assignedDoctor').value = caseItem.assigned_doctor || '';
    document.getElementById('finalDiagnosis').value = caseItem.final_diagnosis || '';
    document.getElementById('doctorNotes').value = caseItem.doctor_notes || '';
    document.getElementById('treatmentPlan').value = caseItem.treatment_plan || '';
    
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

async function saveCaseReview() {
    const caseId = document.getElementById('reviewCaseDbId').value;
    const formData = {
        status: document.getElementById('reviewStatus').value,
        assigned_doctor: document.getElementById('assignedDoctor').value,
        final_diagnosis: document.getElementById('finalDiagnosis').value,
        doctor_notes: document.getElementById('doctorNotes').value,
        treatment_plan: document.getElementById('treatmentPlan').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/cases/${caseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Failed to update case');
        
        const updatedCase = await response.json();
        
        // Update local data
        const caseIndex = allCases.findIndex(c => c.id === parseInt(caseId));
        if (caseIndex !== -1) {
            allCases[caseIndex] = updatedCase;
        }
        
        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();
        
        showAlert('Case review saved successfully!', 'success');
        filterCases();
        refreshDashboard();
        
    } catch (error) {
        console.error('Error saving review:', error);
        showAlert('Failed to save case review.', 'danger');
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}