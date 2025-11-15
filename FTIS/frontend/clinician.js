const API_BASE = 'http://localhost:5000';

let cases = [];
let criticalCases = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    refreshDashboard();
    
    // Refresh every 10 seconds
    setInterval(refreshDashboard, 10000);
});

async function refreshDashboard() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();
        
        updateStats(stats);
        updateCasesTable(stats.recent_cases || []);
        checkCriticalCases(stats.recent_cases || []);
        
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        document.getElementById('casesTable').innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load cases. Please check backend connection.
                </td>
            </tr>
        `;
    }
}

function updateStats(stats) {
    document.getElementById('totalCases').textContent = stats.total_cases || 0;
    document.getElementById('criticalCases').textContent = stats.critical_cases || 0;
    
    // Calculate mild and moderate cases (simplified)
    const total = stats.total_cases || 0;
    const critical = stats.critical_cases || 0;
    const mild = Math.floor(total * 0.4); // Placeholder
    const moderate = total - critical - mild;
    
    document.getElementById('mildCases').textContent = mild;
    document.getElementById('moderateCases').textContent = moderate;
}

function updateCasesTable(recentCases) {
    const tbody = document.getElementById('casesTable');
    
    if (recentCases.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox me-2"></i>
                    No cases yet. Send some triage requests from the patient form.
                </td>
            </tr>
        `;
        return;
    }
    
    // Reverse to show newest first
    const casesToShow = [...recentCases].reverse();
    
    tbody.innerHTML = casesToShow.map(caseItem => {
        const badgeClass = `badge bg-${getRiskColor(caseItem.triage_level)}`;
        
        return `
            <tr class="case-card" onclick="showCaseDetails('${caseItem.id}')">
                <td><strong>FTIS-${caseItem.id}</strong></td>
                <td>${caseItem.timestamp.split(' ')[1]}</td>
                <td>${caseItem.temperature}°C</td>
                <td>${caseItem.triage_score}</td>
                <td><span class="${badgeClass}">${caseItem.triage_level}</span></td>
                <td>${caseItem.top_diagnosis}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); acknowledgeCase('${caseItem.id}')">
                        <i class="fas fa-check me-1"></i>Acknowledge
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getRiskColor(level) {
    switch(level.toLowerCase()) {
        case 'critical': return 'danger';
        case 'high': return 'danger';
        case 'moderate': return 'warning';
        case 'mild': return 'success';
        default: return 'secondary';
    }
}

function checkCriticalCases(recentCases) {
    criticalCases = recentCases.filter(caseItem => 
        caseItem.triage_level === 'Critical' || caseItem.triage_level === 'High'
    );
    
    const alertPanel = document.getElementById('alertPanel');
    const criticalAlerts = document.getElementById('criticalAlerts');
    
    if (criticalCases.length > 0) {
        alertPanel.style.display = 'block';
        
        criticalAlerts.innerHTML = criticalCases.map(caseItem => `
            <div class="alert alert-danger mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="alert-heading mb-1">
                            <i class="fas fa-triangle-exclamation me-2"></i>
                            ${caseItem.triage_level} Risk Case - FTIS-${caseItem.id}
                        </h6>
                        <p class="mb-1">Temperature: ${caseItem.temperature}°C | Score: ${caseItem.triage_score}</p>
                        <p class="mb-0"><strong>Action:</strong> ${caseItem.recommendation}</p>
                    </div>
                    <button class="btn btn-light btn-sm" onclick="acknowledgeCase('${caseItem.id}')">
                        <i class="fas fa-check me-1"></i> Ack
                    </button>
                </div>
            </div>
        `).join('');
        
        // Flash the browser tab for attention
        flashTitle(`(${criticalCases.length}) Critical Cases`);
        
    } else {
        alertPanel.style.display = 'none';
        document.title = "FTIS - Clinician Dashboard";
    }
}

function flashTitle(alertText) {
    let originalTitle = document.title;
    let isAlert = false;
    
    // Only start flashing if not already flashing
    if (!window.titleFlashInterval) {
        window.titleFlashInterval = setInterval(() => {
            document.title = isAlert ? alertText : originalTitle;
            isAlert = !isAlert;
        }, 1000);
    }
}

function stopFlashingTitle() {
    if (window.titleFlashInterval) {
        clearInterval(window.titleFlashInterval);
        window.titleFlashInterval = null;
    }
    document.title = "FTIS - Clinician Dashboard";
}

function acknowledgeCase(caseId) {
    // Remove from critical cases
    criticalCases = criticalCases.filter(caseItem => caseItem.id != caseId);
    
    // Update UI
    checkCriticalCases(cases);
    
    // Show confirmation
    showAlert(`Case FTIS-${caseId} acknowledged`, 'success');
    
    // Stop flashing if no more critical cases
    if (criticalCases.length === 0) {
        stopFlashingTitle();
    }
}

function showCaseDetails(caseId) {
    // For now, just show a simple modal with case info
    // In a real implementation, you'd fetch detailed case data
    
    const caseItem = cases.find(c => c.id == caseId) || {
        id: caseId,
        timestamp: 'N/A',
        temperature: 'N/A',
        triage_score: 'N/A',
        triage_level: 'N/A',
        top_diagnosis: 'N/A',
        recommendation: 'No detailed information available for this case.'
    };
    
    const modalBody = document.getElementById('caseDetails');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Case Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Case ID:</strong></td><td>FTIS-${caseItem.id}</td></tr>
                    <tr><td><strong>Timestamp:</strong></td><td>${caseItem.timestamp}</td></tr>
                    <tr><td><strong>Temperature:</strong></td><td>${caseItem.temperature}°C</td></tr>
                    <tr><td><strong>Triage Score:</strong></td><td>${caseItem.triage_score}</td></tr>
                    <tr><td><strong>Risk Level:</strong></td><td><span class="badge bg-${getRiskColor(caseItem.triage_level)}">${caseItem.triage_level}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Assessment</h6>
                <table class="table table-sm">
                    <tr><td><strong>Top Diagnosis:</strong></td><td>${caseItem.top_diagnosis}</td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Recommendation</h6>
                <div class="alert alert-${caseItem.triage_level === 'Critical' ? 'danger' : 'info'}">
                    ${caseItem.recommendation}
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <div class="d-grid gap-2">
                    <button class="btn btn-success" onclick="markCaseAsReviewed('${caseItem.id}')">
                        <i class="fas fa-check-double me-2"></i>Mark as Reviewed
                    </button>
                    <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('caseModal'));
    modal.show();
}

function markCaseAsReviewed(caseId) {
    showAlert(`Case FTIS-${caseId} marked as reviewed`, 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('caseModal'));
    modal.hide();
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
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}