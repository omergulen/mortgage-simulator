// Application State
let scenarios = [];
let charts = {
    balance: null,
    networth: null
};
let editingScenarioId = null;
let sortState = { column: null, direction: null }; // null, 'asc', 'desc'

/**
 * Parse number from various formats:
 * - EEE,CC (European: 1000,50)
 * - EEE.CC (US: 1000.50)
 * - EEE CC (with spaces: 1 000,50 or 1 000.50)
 * - Also handles thousands separators: 1.000,50 or 1,000.50
 */
function parseNumber(value) {
    if (!value || value === '') return 0;
    
    // Convert to string and trim
    let cleaned = value.toString().trim();
    
    // Check if it's empty after trimming
    if (cleaned === '') return 0;
    
    // Remove all spaces (thousands separator)
    cleaned = cleaned.replace(/\s/g, '');
    
    // Determine format by checking for comma and period
    const hasComma = cleaned.includes(',');
    const hasPeriod = cleaned.includes('.');
    
    if (hasComma && hasPeriod) {
        // Both comma and period: determine which is decimal separator
        // Usually the last one is the decimal separator
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');
        
        if (lastComma > lastPeriod) {
            // Comma is decimal separator (European: 1.000,50)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            // Period is decimal separator (US with thousands: 1,000.50)
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (hasComma) {
        // Only comma: could be decimal (European) or thousands separator
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            // Single comma with 1-2 digits after = decimal separator
            cleaned = cleaned.replace(',', '.');
        } else {
            // Multiple commas or more digits = thousands separator
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (hasPeriod) {
        // Only period: could be decimal (US) or thousands separator (European)
        const parts = cleaned.split('.');
        if (parts.length === 2 && parts[1] && parts[1].length <= 2) {
            // Single period with 1-2 digits after = decimal separator (US format)
            // Keep as is (already correct format)
        } else {
            // Multiple periods or more digits = thousands separator (European)
            cleaned = cleaned.replace(/\./g, '');
        }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadScenarios();
    setupEventListeners();
    updateUI();
});

function setupEventListeners() {
    document.getElementById('scenario-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('harvesting-strategy').addEventListener('change', () => {
        updateStrategyDescription();
        updateUI();
        // Refresh detailed view if one is selected
        const select = document.getElementById('detail-scenario-select');
        if (select.value) {
            showDetailedView();
        }
    });
    document.getElementById('horizon-select').addEventListener('change', () => {
        updateUI();
        // Refresh detailed view if one is selected
        const select = document.getElementById('detail-scenario-select');
        if (select.value) {
            showDetailedView();
        }
    });
    document.getElementById('detail-scenario-select').addEventListener('change', showDetailedView);
    updateStrategyDescription(); // Initial description
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const scenario = {
        id: editingScenarioId || Date.now().toString(),
        name: document.getElementById('scenario-name').value,
        loanAmount: parseNumber(document.getElementById('loan-amount').value),
        interestRate: parseNumber(document.getElementById('interest-rate').value),
        monthlyPayment: parseNumber(document.getElementById('monthly-payment').value),
        extraYearly: parseNumber(document.getElementById('extra-yearly').value),
        propertyValue: parseNumber(document.getElementById('property-value').value),
        initialETF: parseNumber(document.getElementById('initial-etf').value),
        monthlyETF: parseNumber(document.getElementById('monthly-etf').value),
        etfReturn: parseNumber(document.getElementById('etf-return').value) || 7.0,
        inflation: parseNumber(document.getElementById('inflation').value) || 2.0
    };

    if (editingScenarioId) {
        // Update existing scenario
        const index = scenarios.findIndex(s => s.id === editingScenarioId);
        if (index !== -1) {
            scenarios[index] = scenario;
        }
        editingScenarioId = null;
    } else {
        // Add new scenario
        scenarios.push(scenario);
    }
    
    saveScenarios();
    updateUI();
    closeModal('scenario-modal');
    e.target.reset();
    document.getElementById('submit-btn').textContent = 'Add Scenario';
}

function clearAllScenarios() {
    if (confirm('Are you sure you want to clear all scenarios?')) {
        scenarios = [];
        saveScenarios();
        updateUI();
    }
}

// Make functions globally accessible for onclick handlers
window.duplicateScenario = function(scenarioId) {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const duplicated = {
        ...scenario,
        id: Date.now().toString(),
        name: `${scenario.name} (Copy)`
    };

    scenarios.push(duplicated);
    saveScenarios();
    updateUI();
    // Don't populate form - just create the duplicate
};

window.editScenario = function(scenarioId) {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    editingScenarioId = scenarioId;
    populateForm(scenario);
    document.getElementById('modal-title').textContent = 'Edit Mortgage Scenario';
    document.getElementById('submit-btn').textContent = 'Update Scenario';
    openModal('scenario-modal');
};

window.deleteScenario = function(scenarioId) {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    if (confirm(`Are you sure you want to delete "${scenario.name}"?`)) {
        scenarios = scenarios.filter(s => s.id !== scenarioId);
        saveScenarios();
        updateUI();
        
        // Clear detailed view if deleted scenario was selected
        const select = document.getElementById('detail-scenario-select');
        if (select.value === scenarioId) {
            select.value = '';
            document.getElementById('detailed-results').innerHTML = '';
        }
    }
};

function populateForm(scenario) {
    document.getElementById('scenario-name').value = scenario.name || '';
    document.getElementById('loan-amount').value = formatNumberInput(scenario.loanAmount || '');
    document.getElementById('interest-rate').value = formatNumberInput(scenario.interestRate || '');
    document.getElementById('monthly-payment').value = formatNumberInput(scenario.monthlyPayment || '');
    document.getElementById('extra-yearly').value = formatNumberInput(scenario.extraYearly || 0);
    document.getElementById('property-value').value = formatNumberInput(scenario.propertyValue || '');
    document.getElementById('initial-etf').value = formatNumberInput(scenario.initialETF || 0);
    document.getElementById('monthly-etf').value = formatNumberInput(scenario.monthlyETF || 0);
    document.getElementById('etf-return').value = formatNumberInput(scenario.etfReturn || 7.0);
    document.getElementById('inflation').value = formatNumberInput(scenario.inflation || 2.0);
}

/**
 * Format number for input display (preserves user's format preference)
 */
function formatNumberInput(value) {
    if (!value || value === '') return '';
    // Return as string, preserving decimal places if present
    return value.toString();
}

function openAddModal() {
    editingScenarioId = null;
    document.getElementById('scenario-form').reset();
    document.getElementById('modal-title').textContent = 'Add Mortgage Scenario';
    document.getElementById('submit-btn').textContent = 'Add Scenario';
    openModal('scenario-modal');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
    editingScenarioId = null;
    document.getElementById('scenario-form').reset();
    document.getElementById('submit-btn').textContent = 'Add Scenario';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
}

function saveScenarios() {
    localStorage.setItem('mortgageScenarios', JSON.stringify(scenarios));
}

function loadScenarios() {
    const saved = localStorage.getItem('mortgageScenarios');
    if (saved) {
        scenarios = JSON.parse(saved);
    }
}

function updateUI() {
    updateComparison();
    updateScenarioSelector();
    updateCharts();
    
    // Show/hide sections based on scenarios
    const hasScenarios = scenarios.length > 0;
    document.getElementById('comparison-section').style.display = hasScenarios ? 'block' : 'none';
    document.getElementById('detailed-view-section').style.display = hasScenarios ? 'block' : 'none';
    document.getElementById('charts-section').style.display = hasScenarios ? 'block' : 'none';
}

function updateComparison() {
    if (scenarios.length === 0) return;

    const harvestingStrategy = document.getElementById('harvesting-strategy').value;
    const horizonYears = parseInt(document.getElementById('horizon-select').value);
    
    let comparisons = MortgageCalculator.compareScenarios(scenarios, horizonYears, harvestingStrategy);
    
    // Apply sorting if active
    if (sortState.column && sortState.direction) {
        comparisons = sortComparisons(comparisons, sortState.column, sortState.direction);
    }
    
    // Build dynamic table header
    const thead = document.getElementById('comparison-header');
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    const sortableColumns = [
        { key: 'name', label: 'Scenario' },
        { key: 'loanAmount', label: 'Loan Amount' },
        { key: 'interestRate', label: 'Interest Rate' }
    ];
    
    // Add columns based on horizon
    if (horizonYears >= 10) {
        sortableColumns.push(
            { key: 'balance10y', label: 'Remaining at 10y' },
            { key: 'totalPaid10y', label: 'Total Paid (10y)' },
            { key: 'totalInterest10y', label: 'Total Interest (10y)' },
            { key: 'equity10y', label: 'Equity (10y)' },
            { key: 'etfValue10y', label: 'ETF Value (10y)' },
            { key: 'netWorth10y', label: 'Net Worth (10y)' }
        );
    }
    if (horizonYears >= 20) {
        sortableColumns.push(
            { key: 'balance20y', label: 'Remaining at 20y' },
            { key: 'totalPaid20y', label: 'Total Paid (20y)' },
            { key: 'totalInterest20y', label: 'Total Interest (20y)' },
            { key: 'equity20y', label: 'Equity (20y)' },
            { key: 'etfValue20y', label: 'ETF Value (20y)' },
            { key: 'netWorth20y', label: 'Net Worth (20y)' }
        );
    }
    if (horizonYears >= 30) {
        sortableColumns.push(
            { key: 'balance30y', label: 'Remaining at 30y' },
            { key: 'totalPaid30y', label: 'Total Paid (30y)' },
            { key: 'totalInterest30y', label: 'Total Interest (30y)' },
            { key: 'equity30y', label: 'Equity (30y)' },
            { key: 'etfValue30y', label: 'ETF Value (30y)' },
            { key: 'netWorth30y', label: 'Net Worth (30y)' }
        );
    }
    
    sortableColumns.push(
        { key: 'payoffYears', label: 'Payoff Years' },
        { key: 'actions', label: 'Actions', sortable: false }
    );
    
    let headerHTML = '';
    sortableColumns.forEach((col, idx) => {
        let classes = '';
        if (idx === 0) {
            classes = 'sticky-left'; // First column (Scenario)
        } else if (col.key === 'actions') {
            classes = 'sticky-right'; // Last column (Actions)
        }
        
        if (col.sortable === false) {
            headerHTML += `<th class="${classes}">${col.label}</th>`;
        } else {
            const sortIcon = sortState.column === col.key 
                ? (sortState.direction === 'asc' ? ' ↑' : ' ↓')
                : '';
            headerHTML += `<th class="sortable ${classes}" onclick="sortTable('${col.key}')">${col.label}${sortIcon}</th>`;
        }
    });
    
    headerRow.innerHTML = headerHTML;
    thead.appendChild(headerRow);

    // Build table body
    const tbody = document.getElementById('comparison-body');
    tbody.innerHTML = '';

    comparisons.forEach((comp, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'even-row' : 'odd-row';
        let rowHTML = `
            <td class="sticky-left"><strong>${comp.name}</strong></td>
            <td class="currency">${MortgageCalculator.formatCurrency(comp.loanAmount)}</td>
            <td>${MortgageCalculator.formatPercent(comp.interestRate)}</td>
        `;
        
        // Add data columns based on horizon
        if (horizonYears >= 10) {
            rowHTML += `
                <td class="currency">${MortgageCalculator.formatCurrency(comp.balance10y)}</td>
                <td class="currency">${MortgageCalculator.formatCurrency(comp.totalPaid10y)}</td>
                <td class="currency negative">${MortgageCalculator.formatCurrency(comp.totalInterest10y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.equity10y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.etfValue10y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.netWorth10y)}</td>
            `;
        }
        if (horizonYears >= 20) {
            rowHTML += `
                <td class="currency">${MortgageCalculator.formatCurrency(comp.balance20y)}</td>
                <td class="currency">${MortgageCalculator.formatCurrency(comp.totalPaid20y)}</td>
                <td class="currency negative">${MortgageCalculator.formatCurrency(comp.totalInterest20y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.equity20y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.etfValue20y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.netWorth20y)}</td>
            `;
        }
        if (horizonYears >= 30) {
            rowHTML += `
                <td class="currency">${MortgageCalculator.formatCurrency(comp.balance30y)}</td>
                <td class="currency">${MortgageCalculator.formatCurrency(comp.totalPaid30y)}</td>
                <td class="currency negative">${MortgageCalculator.formatCurrency(comp.totalInterest30y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.equity30y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.etfValue30y)}</td>
                <td class="currency positive">${MortgageCalculator.formatCurrency(comp.netWorth30y)}</td>
            `;
        }
        
        rowHTML += `
            <td>${comp.payoffYears.toFixed(1)}</td>
            <td class="action-buttons-cell sticky-right">
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editScenario('${comp.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="duplicateScenario('${comp.id}')" title="Duplicate">
                        📋
                    </button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteScenario('${comp.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
}

function updateScenarioSelector() {
    const select = document.getElementById('detail-scenario-select');
    const currentValue = select.value; // Preserve current selection
    select.innerHTML = '<option value="">-- Select a scenario --</option>';
    
    scenarios.forEach(scenario => {
        const option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = scenario.name;
        select.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentValue && scenarios.find(s => s.id === currentValue)) {
        select.value = currentValue;
    }
    
    // Update action buttons visibility
    const actionsDiv = document.getElementById('scenario-actions');
    if (actionsDiv) {
        actionsDiv.style.display = scenarios.length > 0 ? 'flex' : 'none';
    }
}

window.editSelectedScenario = function() {
    const select = document.getElementById('detail-scenario-select');
    if (select.value) {
        editScenario(select.value);
    }
};

window.duplicateSelectedScenario = function() {
    const select = document.getElementById('detail-scenario-select');
    if (select.value) {
        duplicateScenario(select.value);
    }
};

window.deleteSelectedScenario = function() {
    const select = document.getElementById('detail-scenario-select');
    if (select.value) {
        deleteScenario(select.value);
    }
};

window.sortTable = function(column) {
    if (sortState.column === column) {
        // Cycle: asc -> desc -> null
        if (sortState.direction === 'asc') {
            sortState.direction = 'desc';
        } else if (sortState.direction === 'desc') {
            sortState.column = null;
            sortState.direction = null;
        }
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }
    updateComparison();
};

function sortComparisons(comparisons, column, direction) {
    const sorted = [...comparisons];
    
    sorted.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle string comparison for name
        if (column === 'name') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Handle string comparison
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

function showDetailedView() {
    const scenarioId = document.getElementById('detail-scenario-select').value;
    if (!scenarioId) {
        document.getElementById('detailed-results').innerHTML = '';
        return;
    }

    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    // Detailed view uses global configs
    const harvestingStrategy = document.getElementById('harvesting-strategy').value;
    const horizonYears = parseInt(document.getElementById('horizon-select').value);
    
    const comparison = MortgageCalculator.compareScenarios([scenario], horizonYears, harvestingStrategy)[0];
    const amortization = MortgageCalculator.calculateAmortization(scenario, horizonYears);
    const etfResult = MortgageCalculator.calculateETF(scenario, horizonYears, harvestingStrategy);
    
    // Build metrics for all relevant years
    const metrics = [];
    if (horizonYears >= 10) {
        metrics.push({ year: 10, data: comparison });
    }
    if (horizonYears >= 20) {
        metrics.push({ year: 20, data: comparison });
    }
    if (horizonYears >= 30) {
        metrics.push({ year: 30, data: comparison });
    }

    // Build loan metrics dynamically based on horizon
    let loanMetricsHTML = `
        <div class="metric-card">
            <h3>Loan Metrics</h3>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Loan Amount</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.loanAmount)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Interest Rate</span>
                    <span class="metric-value">${MortgageCalculator.formatPercent(scenario.interestRate)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Monthly Payment</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.monthlyPayment)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Extra Yearly Payment</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.extraYearly)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Years to Payoff</span>
                    <span class="metric-value">${comparison.payoffYears.toFixed(1)} years</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Extra Payments</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(amortization.totalExtra)}</span>
                </div>
    `;
    
    if (horizonYears >= 10) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Remaining at 10 years</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.balance10y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Paid (10y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.totalPaid10y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Interest (10y)</span>
                    <span class="metric-value currency negative">${MortgageCalculator.formatCurrency(comparison.totalInterest10y)}</span>
                </div>
        `;
    }
    if (horizonYears >= 20) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Remaining at 20 years</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.balance20y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Paid (20y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.totalPaid20y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Interest (20y)</span>
                    <span class="metric-value currency negative">${MortgageCalculator.formatCurrency(comparison.totalInterest20y)}</span>
                </div>
        `;
    }
    if (horizonYears >= 30) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Remaining at 30 years</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.balance30y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Paid (30y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.totalPaid30y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Interest (30y)</span>
                    <span class="metric-value currency negative">${MortgageCalculator.formatCurrency(comparison.totalInterest30y)}</span>
                </div>
        `;
    }
    
    loanMetricsHTML += `
            </div>
        </div>

        <div class="metric-card">
            <h3>Equity & Property</h3>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Property Value</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.propertyValue)}</span>
                </div>
    `;
    
    if (horizonYears >= 10) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity at 10 years</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(comparison.equity10y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Loan-to-Value (10y)</span>
                    <span class="metric-value">${MortgageCalculator.formatPercent((comparison.balance10y / scenario.propertyValue) * 100)}</span>
                </div>
        `;
    }
    if (horizonYears >= 20) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity at 20 years</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(comparison.equity20y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Loan-to-Value (20y)</span>
                    <span class="metric-value">${MortgageCalculator.formatPercent((comparison.balance20y / scenario.propertyValue) * 100)}</span>
                </div>
        `;
    }
    if (horizonYears >= 30) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity at 30 years</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(comparison.equity30y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Loan-to-Value (30y)</span>
                    <span class="metric-value">${MortgageCalculator.formatPercent((comparison.balance30y / scenario.propertyValue) * 100)}</span>
                </div>
        `;
    }
    
    loanMetricsHTML += `
            </div>
        </div>

        <div class="metric-card">
            <h3>ETF Investment ${getHarvestingStrategyName(harvestingStrategy)}</h3>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Initial Investment</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.initialETF)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Monthly Contribution</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(scenario.monthlyETF)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Expected Return</span>
                    <span class="metric-value">${MortgageCalculator.formatPercent(scenario.etfReturn)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Future Value (${horizonYears}y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(etfResult.futureValue)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Gains</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(etfResult.gains)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Tax Paid During Years</span>
                    <span class="metric-value currency negative">${MortgageCalculator.formatCurrency(etfResult.tax || 0)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Tax to Pay at End</span>
                    <span class="metric-value currency negative"><strong>${MortgageCalculator.formatCurrency(etfResult.finalTax || 0)}</strong></span>
                </div>
                ${etfResult.totalHarvested !== undefined ? `
                <div class="metric-item">
                    <span class="metric-label">Total Harvested (Tax-Free)</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(etfResult.totalHarvested || 0)}</span>
                </div>
                ` : ''}
                <div class="metric-item">
                    <span class="metric-label">After-Tax Value</span>
                    <span class="metric-value currency positive"><strong>${MortgageCalculator.formatCurrency(etfResult.afterTaxValue)}</strong></span>
                </div>
            </div>
        </div>

        <div class="metric-card">
            <h3>Net Worth Summary</h3>
            <div class="metric-grid">
    `;
    
    if (horizonYears >= 10) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity (10y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.equity10y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">ETF Value (10y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.etfValue10y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Net Worth (10y)</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(comparison.netWorth10y)}</span>
                </div>
        `;
    }
    if (horizonYears >= 20) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity (20y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.equity20y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">ETF Value (20y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.etfValue20y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Net Worth (20y)</span>
                    <span class="metric-value currency positive">${MortgageCalculator.formatCurrency(comparison.netWorth20y)}</span>
                </div>
        `;
    }
    if (horizonYears >= 30) {
        loanMetricsHTML += `
                <div class="metric-item">
                    <span class="metric-label">Equity (30y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.equity30y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">ETF Value (30y)</span>
                    <span class="metric-value currency">${MortgageCalculator.formatCurrency(comparison.etfValue30y)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Net Worth (30y)</span>
                    <span class="metric-value currency positive" style="font-size: 1.5rem;"><strong>${MortgageCalculator.formatCurrency(comparison.netWorth30y)}</strong></span>
                </div>
        `;
    }
    
    loanMetricsHTML += `
            </div>
        </div>

        <div class="metric-card">
            <h3>Amortization Schedule (Full ${horizonYears} Years)</h3>
            <div class="amortization-table">
                <table>
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Month</th>
                            <th>Balance</th>
                            <th>Interest</th>
                            <th>Principal</th>
                            <th>Extra</th>
                            <th>Total Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${amortization.schedule
                            .map(e => `
                                <tr>
                                    <td>${e.year}</td>
                                    <td>${e.month}</td>
                                    <td class="currency">${MortgageCalculator.formatCurrency(e.balance)}</td>
                                    <td class="currency">${MortgageCalculator.formatCurrency(e.interestPayment)}</td>
                                    <td class="currency">${MortgageCalculator.formatCurrency(e.principalPayment)}</td>
                                    <td class="currency">${e.extraPayment > 0 ? MortgageCalculator.formatCurrency(e.extraPayment) : '-'}</td>
                                    <td class="currency">${MortgageCalculator.formatCurrency(e.totalPayment)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('detailed-results').innerHTML = loanMetricsHTML;
}

function updateCharts() {
    if (scenarios.length === 0) return;

    const harvestingStrategy = document.getElementById('harvesting-strategy').value;
    const horizonYears = parseInt(document.getElementById('horizon-select').value);
    
    updateBalanceChart(harvestingStrategy, horizonYears);
    updateNetWorthChart(harvestingStrategy, horizonYears);
}

function getHarvestingStrategyName(strategy) {
    const names = {
        'none': '(No Harvesting)',
        'full': '(Full Buy/Sell Every Year)',
        'partial': '(Partial Harvest - Tax-Free Limit)',
        'optimal': '(Optimal Harvest)'
    };
    return names[strategy] || '';
}

function updateStrategyDescription() {
    const strategy = document.getElementById('harvesting-strategy').value;
    const descriptions = {
        'none': 'No harvesting. All gains accumulate unrealized. Tax is calculated and paid only at the end.',
        'full': 'Sell everything and rebuy every year. Realize all gains annually, pay tax on amounts above the 1,000€ tax-free limit each year.',
        'partial': 'Harvest only up to the tax-free limit (1,000€) each year. Remaining gains accumulate. Final tax shown on remaining unrealized gains.',
        'optimal': 'Harvest the optimal amount each year (up to tax-free limit), keeping the rest invested. Final tax shown on remaining unrealized gains. This maximizes after-tax returns.'
    };
    document.getElementById('strategy-description').textContent = descriptions[strategy] || '';
}

function updateBalanceChart(harvestingStrategy, horizonYears) {
    const ctx = document.getElementById('balance-chart');
    if (!ctx) return;

    if (charts.balance) {
        charts.balance.destroy();
    }

    const years = Array.from({ length: horizonYears + 1 }, (_, i) => i);
    const datasets = scenarios.map((scenario, idx) => {
        const balances = years.map(year => {
            if (year === 0) return scenario.loanAmount;
            return MortgageCalculator.getBalanceAtYear(scenario, year);
        });
        
        return {
            label: scenario.name,
            data: balances,
            borderColor: getColor(idx),
            backgroundColor: getColor(idx, 0.1),
            tension: 0.4
        };
    });

    charts.balance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Remaining Loan Balance Over Time'
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return MortgageCalculator.formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                }
            }
        }
    });
}

function updateNetWorthChart(harvestingStrategy, horizonYears) {
    const ctx = document.getElementById('networth-chart');
    if (!ctx) return;

    if (charts.networth) {
        charts.networth.destroy();
    }

    const comparisons = MortgageCalculator.compareScenarios(scenarios, horizonYears, harvestingStrategy);
    const labels = comparisons.map(c => c.name);
    const netWorths = comparisons.map(c => c.netWorth20y);

    charts.networth = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Net Worth (20 years)',
                data: netWorths,
                backgroundColor: comparisons.map((_, idx) => getColor(idx, 0.7)),
                borderColor: comparisons.map((_, idx) => getColor(idx)),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Net Worth Comparison (20 years)'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return MortgageCalculator.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function getColor(index, alpha = 1) {
    const colors = [
        `rgba(37, 99, 235, ${alpha})`,   // blue
        `rgba(16, 185, 129, ${alpha})`,  // green
        `rgba(239, 68, 68, ${alpha})`,   // red
        `rgba(245, 158, 11, ${alpha})`,  // yellow
        `rgba(139, 92, 246, ${alpha})`,  // purple
        `rgba(236, 72, 153, ${alpha})`,  // pink
    ];
    return colors[index % colors.length];
}

