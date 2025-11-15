// Doctor Dashboard functionality
class DoctorDashboard {
    constructor() {
        this.allCases = [];
        this.currentFilters = {
            status: 'all',
            triage: 'all',
            time: 'all',
            sort: 'newest'
        };
        this.init();
    }

    async init() {
        await this.loadDoctorData();
        this.setupEventListeners();
        this.setupAutoRefresh();
    }

    async loadDoctorData() {
        try {
            const [stats, cases] = await Promise.all([
                this.loadDoctorStats(),
                this.loadDoctorCases()
            ]);

            this.updateDoctorStats(stats);
            this.allCases = cases;
            this.filterCases();

        } catch (error) {
            console.error('Error loading doctor data:', error);
            this.showError('Failed to load doctor dashboard data');
        }
    }

    async loadDoctorStats() {
        // Simulate API call - replace with actual API
        return {
            total_cases: 1247,
            pending_cases: 45,
            critical_cases: 89,
            reviewing_cases: 23,
            completed_cases: 1090,
            today_cases: 15
        };
    }

    async loadDoctorCases() {
        // Simulate cases data
        const cases = [];
        const conditions = ['Dengue', 'Malaria', 'Typhoid', 'Viral_Fever', 'COVID'];
        const statuses = ['pending', 'reviewing', 'completed'];
        const triageLevels = ['Mild', 'Moderate', 'High', 'Critical'];
        
        for (let i = 0; i < 50; i++) {
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const triageLevel = triageLevels[Math.floor(Math.random() * triageLevels.length)];
            
            cases.push({
                id: 1000 + i,
                case_id: `FTIS-2024-${1000 + i}`,
                patient_name: `Patient ${1000 + i}`,
                patient_age: Math.floor(Math.random() * 60) + 20,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                condition: condition,
                temperature: (37.5 + Math.random() * 3.5).toFixed(1),
                triage_level: triageLevel,
                triage_score: Math.floor(Math.random() * 15) + 1,
                status: status,
                assigned_doctor: status === 'pending' ? '' : `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
                final_diagnosis: status === 'completed' ? condition : '',
                doctor_notes: status === 'completed' ? 'Patient responded well to treatment.' : '',
                treatment_plan: status === 'completed' ? 'Continue medication and follow up in 1 week.' : ''
            });
        }
        
        return cases;
    }

    updateDoctorStats(stats) {
        document.getElementById('doctorTotalCases').textContent = stats.total_cases.toLocaleString();
        document.getElementById('doctorPendingCases').textContent = stats.pending_cases.toLocaleString();
        document.getElementById('doctorCriticalCases').textContent = stats.critical_cases.toLocaleString();
        document.getElementById('doctorReviewingCases').textContent = stats.reviewing_cases.toLocaleString();
        document.getElementById('doctorCompletedCases').textContent = stats.completed_cases.toLocaleString();
        document.getElementById('doctorTodayCases').textContent = stats.today_cases.toLocaleString();
    }

    setupEventListeners() {
        document.getElementById('searchCases').addEventListener('input', () => this.filterCases());
    }

    filterCases() {
        const statusFilter = document.getElementById('statusFilter').value;
        const triageFilter = document.getElementById('triageFilter').value;
        const timeFilter = document.getElementById('timeFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;
        const searchTerm = document.getElementById('searchCases').value.toLowerCase();

        this.currentFilters = { status: statusFilter, triage: triageFilter, time: timeFilter, sort: sortFilter };

        let filteredCases = [...this.allCases];

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
                caseItem.condition.toLowerCase().includes(searchTerm)
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

        this.updateCasesTable(filteredCases);
    }

    updateCasesTable(cases) {
        const tbody = document.getElementById('doctorCasesTable');
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
            const statusBadge = this.getStatusBadge(caseItem.status);
            const triageBadge = this.getTriageBadge(caseItem.triage_level);
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
                    <td>${this.formatTime(caseItem.timestamp)}</td>
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
                        <div><strong>${caseItem.condition.replace('_', ' ')}</strong></div>
                        <small class="text-muted">AI Diagnosis</small>
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

    getStatusBadge(status) {
        const statusConfig = {
            'pending': { class: 'bg-warning text-dark', text: 'Pending' },
            'reviewing': { class: 'bg-info', text: 'In Progress' },
            'completed': { class: 'bg-success', text: 'Completed' }
        };

        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return `<span class="badge ${config.class}">${config.text}</span>`;
    }

    getTriageBadge(level) {
        const levelConfig = {
            'Critical': 'bg-danger',
            'High': 'bg-danger',
            'Moderate': 'bg-warning text-dark',
            'Mild': 'bg-success'
        };

        return `<span class="badge ${levelConfig[level]}">${level}</span>`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadDoctorData();
        }, 30000);
    }

    showError(message) {
        // Show error message
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
}

// Global functions for doctor dashboard
function viewCaseDetails(caseId) {
    const caseItem = window.doctorDashboard.allCases.find(c => c.id === caseId);
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
                            <tr><td><strong>Triage Score:</strong></td><td>${caseItem.triage_score}</td></tr>
                            <tr><td><strong>Triage Level:</strong></td><td><span class="badge ${window.doctorDashboard.getTriageBadge(caseItem.triage_level).split('"')[1]}">${caseItem.triage_level}</span></td></tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">AI Assessment</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr><td><strong>Condition:</strong></td><td>${caseItem.condition.replace('_', ' ')}</td></tr>
                            <tr><td><strong>Status:</strong></td><td>${window.doctorDashboard.getStatusBadge(caseItem.status)}</td></tr>
                            <tr><td><strong>Assigned Doctor:</strong></td><td>${caseItem.assigned_doctor || 'Not assigned'}</td></tr>
                        </table>
                    </div>
                </div>
                
                ${caseItem.final_diagnosis ? `
                <div class="card mt-3">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0">Doctor Review</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr><td><strong>Final Diagnosis:</strong></td><td>${caseItem.final_diagnosis}</td></tr>
                            ${caseItem.doctor_notes ? `
                                <tr><td><strong>Notes:</strong></td><td>${caseItem.doctor_notes}</td></tr>
                            ` : ''}
                            ${caseItem.treatment_plan ? `
                                <tr><td><strong>Treatment Plan:</strong></td><td>${caseItem.treatment_plan}</td></tr>
                            ` : ''}
                        </table>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('caseModal'));
    modal.show();
}

function reviewCase(caseId) {
    const caseItem = window.doctorDashboard.allCases.find(c => c.id === caseId);
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
        // In a real implementation, this would call the API
        // await window.ftisAPI.updateCase(caseId, formData);
        
        // For demo purposes, update locally
        const caseIndex = window.doctorDashboard.allCases.findIndex(c => c.id === parseInt(caseId));
        if (caseIndex !== -1) {
            window.doctorDashboard.allCases[caseIndex] = {
                ...window.doctorDashboard.allCases[caseIndex],
                ...formData
            };
        }

        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();

        showToast('Case review saved successfully!', 'success');
        window.doctorDashboard.filterCases();

    } catch (error) {
        console.error('Error saving review:', error);
        showToast('Failed to save case review.', 'danger');
    }
}

function refreshDoctorDashboard() {
    if (window.doctorDashboard) {
        window.doctorDashboard.loadDoctorData();
        showToast('Doctor dashboard refreshed successfully', 'success');
    }
}

function showToast(message, type = 'info') {
    // Create toast notification
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

    // Remove after hide
    toast.addEventListener('hidden.bs.toast', () => {
        container.remove();
    });
}

// Initialize doctor dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.doctorDashboard = new DoctorDashboard();
});