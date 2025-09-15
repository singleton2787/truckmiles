// ===== CORE BUSINESS LOGIC =====

function calculatePay(miles) {
    if (miles <= 20) return miles * 2.85;
    if (miles <= 75) return miles * 2.00;
    if (miles <= 150) return miles * 1.85;
    if (miles <= 275) return miles * 1.70;
    if (miles <= 425) return miles * 1.45;
    if (miles <= 600) return miles * 1.35;
    if (miles <= 800) return miles * 1.28;
    if (miles <= 1000) return miles * 1.25;
    if (miles <= 1200) return miles * 1.20;
    if (miles <= 1800) return miles * 1.13;
    return miles * 1.12;
}

// Helper function to get Wednesday-Tuesday settlement cycle boundaries
function getSettlementCycleBoundaries(referenceDate = new Date()) {
    var now = new Date(referenceDate);
    var dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days until next Tuesday (cycle end)
    var daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    
    var cycleEnd = new Date(now);
    cycleEnd.setDate(now.getDate() + daysUntilTuesday);
    cycleEnd.setHours(23, 59, 59, 999);
    
    var cycleStart = new Date(cycleEnd);
    cycleStart.setDate(cycleEnd.getDate() - 6);
    cycleStart.setHours(0, 0, 0, 0);
    
    return { start: cycleStart, end: cycleEnd };
}

// Helper function to calculate prorated fixed costs
function getProratedFixedCosts(includeLease) {
    const FIXED_COSTS_WEEKLY = 277;
    const TRUCK_PAYMENT_WEEKLY = 835;
    
    var fullWeeklyCosts = FIXED_COSTS_WEEKLY + (includeLease ? TRUCK_PAYMENT_WEEKLY : 0);
    
    var cycleBoundaries = getSettlementCycleBoundaries();
    var now = new Date();
    var cycleStart = cycleBoundaries.start;
    var cycleEnd = cycleBoundaries.end;
    
    // If current time is before cycle start, we're in the previous cycle
    if (now < cycleStart) {
        var prevCycleEnd = new Date(cycleStart);
        prevCycleEnd.setMilliseconds(prevCycleEnd.getMilliseconds() - 1);
        var prevCycleStart = new Date(prevCycleEnd);
        prevCycleStart.setDate(prevCycleEnd.getDate() - 6);
        prevCycleStart.setHours(0, 0, 0, 0);
        cycleStart = prevCycleStart;
        cycleEnd = prevCycleEnd;
    }
    
    var totalCycleMs = cycleEnd.getTime() - cycleStart.getTime();
    var elapsedMs = Math.min(now.getTime() - cycleStart.getTime(), totalCycleMs);
    elapsedMs = Math.max(0, elapsedMs);
    
    var cycleProgress = elapsedMs / totalCycleMs;
    var proratedCosts = fullWeeklyCosts * cycleProgress;
    
    return {
        prorated: proratedCosts,
        full: fullWeeklyCosts,
        progress: cycleProgress
    };
}

// ===== GLOBAL VARIABLES =====

var currentHistoryFilter = 'all';
var weeklyGaugeChart = null;
var incentiveGaugeChart = null;
var currentEditingItem = null;
var currentPLPeriod = 'current-month';

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    initializeWeeklyGauge();
    initializeIncentiveGauge();
    initializeEventListeners();
    checkBackupReminder();
    updateDisplay();
});

function initializeEventListeners() {
    // Set default dates to today
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('expenseDate').valueAsDate = new Date();

    // Miles input listener for real-time pay calculation
    document.getElementById('miles').addEventListener('input', function() {
        var miles = parseInt(this.value) || 0;
        var pay = calculatePay(miles);
        var rate = miles > 0 ? pay / miles : 0;
        document.getElementById('calculatedPay').textContent = pay.toFixed(2);
        document.getElementById('ratePerMile').textContent = rate.toFixed(3);
    });

    // Form submission listeners
    document.getElementById('loadForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addLoad();
    });

    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addExpense();
    });
}

// ===== DATA MANAGEMENT =====

function loadData() {
    var loadsData = localStorage.getItem('loads');
    var expensesData = localStorage.getItem('expenses');
    return {
        loads: loadsData ? JSON.parse(loadsData) : [],
        expenses: expensesData ? JSON.parse(expensesData) : []
    };
}

function saveData(loads, expenses) {
    localStorage.setItem('loads', JSON.stringify(loads));
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// ===== TAB MANAGEMENT =====

function showTab(tabName, element) {
    var contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    element.classList.add('active');

    if (tabName === 'history') {
        updateHistoryDisplay();
    } else if (tabName === 'pl') {
        updatePLDisplay();
    }
}

// ===== LOAD MANAGEMENT =====

function addLoad() {
    var loadNumber = document.getElementById('loadNumber').value || '';
    var date = document.getElementById('date').value || '';
    var miles = parseInt(document.getElementById('miles').value) || 0;
    var origin = document.getElementById('origin').value || '';
    var destination = document.getElementById('destination').value || '';
    var notes = document.getElementById('notes').value || '';
    
    if (!date || miles <= 0) {
        alert('Please enter a valid date and miles');
        return;
    }
    
    var pay = calculatePay(miles);
    
    var load = {
        id: Date.now(),
        type: 'load',
        loadNumber: loadNumber,
        date: date,
        miles: miles,
        origin: origin,
        destination: destination,
        notes: notes,
        revenue: pay
    };
    
    var data = loadData();
    data.loads.unshift(load);
    saveData(data.loads, data.expenses);
    
    updateDisplay();
    clearForm();
    alert('Load added successfully!');
}

function clearForm() {
    document.getElementById('loadForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('calculatedPay').textContent = '0.00';
    document.getElementById('ratePerMile').textContent = '0.00';
}

// ===== EXPENSE MANAGEMENT =====

function addExpense() {
    var date = document.getElementById('expenseDate').value || '';
    var category = document.getElementById('expenseCategory').value || '';
    var amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    var miles = document.getElementById('expenseMiles').value ? parseInt(document.getElementById('expenseMiles').value) : null;
    var notes = document.getElementById('expenseNotes').value || '';
    
    if (!date || !category || amount <= 0) {
        alert('Please fill in date, category, and amount');
        return;
    }
    
    var expense = {
        id: Date.now(),
        type: 'expense',
        date: date,
        category: category,
        amount: amount,
        miles: miles,
        notes: notes
    };
    
    var data = loadData();
    data.expenses.unshift(expense);
    saveData(data.loads, data.expenses);
    
    updateDisplay();
    clearExpenseForm();
    alert('Expense added successfully!');
}

function clearExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
}

// ===== EDIT FUNCTIONALITY =====

function editItem(id, type) {
    var data = loadData();
    var item = null;
    
    if (type === 'load') {
        item = data.loads.find(load => load.id === id);
    } else {
        item = data.expenses.find(expense => expense.id === id);
    }
    
    if (!item) {
        alert('Item not found');
        return;
    }
    
    currentEditingItem = { item: item, type: type };
    showEditForm(item, type);
}

function showEditForm(item, type) {
    var historyContainer = document.getElementById('historyContainer');
    var editFormHtml = '';
    
    // Helper function to escape HTML attributes
    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    if (type === 'load') {
        editFormHtml = '<div class="edit-form" id="editForm">' +
            '<h4>Edit Load #' + (item.loadNumber || 'N/A') + '</h4>' +
            '<div class="form-grid">' +
                '<div class="form-group">' +
                    '<label>Load Number</label>' +
                    '<input type="text" id="editLoadNumber" value="' + escapeHtml(item.loadNumber || '') + '" placeholder="Load/Dispatch #">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Date</label>' +
                    '<input type="date" id="editDate" value="' + escapeHtml(item.date) + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Miles</label>' +
                    '<input type="number" id="editMiles" value="' + escapeHtml(item.miles) + '" min="1" required placeholder="Miles driven">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Origin</label>' +
                    '<input type="text" id="editOrigin" value="' + escapeHtml(item.origin || '') + '" placeholder="Starting location">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Destination</label>' +
                    '<input type="text" id="editDestination" value="' + escapeHtml(item.destination || '') + '" placeholder="Ending location">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Notes</label>' +
                '<textarea id="editNotes" rows="2" placeholder="Additional details...">' + escapeHtml(item.notes || '') + '</textarea>' +
            '</div>' +
            '<button type="button" class="btn btn-success" onclick="saveEdit()">Save Changes</button>' +
            '<button type="button" class="btn" onclick="cancelEdit()">Cancel</button>' +
        '</div>';
    } else {
        var categoryOptions = [
            {value: '', text: 'Select Category'},
            {value: 'fuel-tractor', text: 'Fuel - Tractor'},
            {value: 'fuel-tax', text: 'Fuel Tax'},
            {value: 'maintenance', text: 'Maintenance & Repairs'},
            {value: 'parking-tolls', text: 'Parking, Scales & Tolls'},
            {value: 'supplies', text: 'Supplies'},
            {value: 'travel-lodging', text: 'Travel & Lodging'},
            {value: 'truck-payment', text: 'Truck Payment'},
            {value: 'insurance-physical', text: 'Insurance - Physical Damage'},
            {value: 'insurance-bobtail', text: 'Insurance - Bobtail'},
            {value: 'insurance-workcomp', text: 'Insurance - Work Comp'},
            {value: 'other', text: 'Other'}
        ];
        
        var selectOptions = '';
        for (var i = 0; i < categoryOptions.length; i++) {
            var option = categoryOptions[i];
            var selected = (item.category === option.value) ? ' selected' : '';
            selectOptions += '<option value="' + option.value + '"' + selected + '>' + option.text + '</option>';
        }
        
        editFormHtml = '<div class="edit-form" id="editForm">' +
            '<h4>Edit Expense - ' + escapeHtml(item.category) + '</h4>' +
            '<div class="form-grid">' +
                '<div class="form-group">' +
                    '<label>Date</label>' +
                    '<input type="date" id="editExpenseDate" value="' + escapeHtml(item.date) + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Category</label>' +
                    '<select id="editExpenseCategory" required>' + selectOptions + '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Amount ($)</label>' +
                    '<input type="number" id="editExpenseAmount" value="' + escapeHtml(item.amount) + '" min="0" step="0.01" required placeholder="0.00">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Miles (if applicable)</label>' +
                    '<input type="number" id="editExpenseMiles" value="' + escapeHtml(item.miles || '') + '" min="0" placeholder="For per-mile expenses">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Description/Notes</label>' +
                '<textarea id="editExpenseNotes" rows="2" placeholder="Additional details...">' + escapeHtml(item.notes || '') + '</textarea>' +
            '</div>' +
            '<button type="button" class="btn btn-success" onclick="saveEdit()">Save Changes</button>' +
            '<button type="button" class="btn" onclick="cancelEdit()">Cancel</button>' +
        '</div>';
    }
    
    historyContainer.insertAdjacentHTML('afterbegin', editFormHtml);
    document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
}

function saveEdit() {
    if (!currentEditingItem) return;
    
    var data = loadData();
    var item = currentEditingItem.item;
    var type = currentEditingItem.type;
    
    if (type === 'load') {
        var updatedLoad = {
            ...item,
            loadNumber: document.getElementById('editLoadNumber').value || '',
            date: document.getElementById('editDate').value || '',
            miles: parseInt(document.getElementById('editMiles').value) || 0,
            origin: document.getElementById('editOrigin').value || '',
            destination: document.getElementById('editDestination').value || '',
            notes: document.getElementById('editNotes').value || ''
        };
        
        if (!updatedLoad.date || updatedLoad.miles <= 0) {
            alert('Please enter a valid date and miles');
            return;
        }
        
        updatedLoad.revenue = calculatePay(updatedLoad.miles);
        
        var loadIndex = data.loads.findIndex(load => load.id === item.id);
        if (loadIndex !== -1) {
            data.loads[loadIndex] = updatedLoad;
        }
    } else {
        var updatedExpense = {
            ...item,
            date: document.getElementById('editExpenseDate').value || '',
            category: document.getElementById('editExpenseCategory').value || '',
            amount: parseFloat(document.getElementById('editExpenseAmount').value) || 0,
            miles: document.getElementById('editExpenseMiles').value ? parseInt(document.getElementById('editExpenseMiles').value) : null,
            notes: document.getElementById('editExpenseNotes').value || ''
        };
        
        if (!updatedExpense.date || !updatedExpense.category || updatedExpense.amount <= 0) {
            alert('Please fill in date, category, and amount');
            return;
        }
        
        var expenseIndex = data.expenses.findIndex(expense => expense.id === item.id);
        if (expenseIndex !== -1) {
            data.expenses[expenseIndex] = updatedExpense;
        }
    }
    
    saveData(data.loads, data.expenses);
    cancelEdit();
    updateDisplay();
    alert('Changes saved successfully!');
}

function cancelEdit() {
    var editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.remove();
    }
    currentEditingItem = null;
}

// ===== DELETE FUNCTIONALITY =====

function deleteItem(id, type) {
    if (confirm('Are you sure you want to delete this ' + type + '?')) {
        var data = loadData();
        if (type === 'load') {
            data.loads = data.loads.filter(function(item) { return item.id !== id; });
        } else {
            data.expenses = data.expenses.filter(function(item) { return item.id !== id; });
        }
        saveData(data.loads, data.expenses);
        updateDisplay();
    }
}

// ===== HISTORY DISPLAY =====

function showHistoryType(type, element) {
    currentHistoryFilter = type;
    document.querySelectorAll('#history button.btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    var data = loadData();
    var historyContainer = document.getElementById('historyContainer');
    const VARIABLE_COST_PER_MILE = 0.372;
    
    // Remove any existing edit form
    var existingEditForm = document.getElementById('editForm');
    if (existingEditForm) {
        existingEditForm.remove();
    }
    
    var items = [];
    
    if (currentHistoryFilter === 'loads' || currentHistoryFilter === 'all') {
        items = items.concat(data.loads);
    }
    if (currentHistoryFilter === 'expenses' || currentHistoryFilter === 'all') {
        items = items.concat(data.expenses);
    }
    
    items.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    if (items.length === 0) {
        historyContainer.innerHTML = '<p>No records found. Add some loads and expenses!</p>';
        return;
    }
    
    var htmlContent = '';
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        
        if (item.type === 'load') {
            var loadNumber = item.loadNumber || '';
            var origin = item.origin || 'N/A';
            var destination = item.destination || 'N/A';
            var notes = item.notes || '';
            var miles = item.miles || 0;
            var revenue = item.revenue || 0;
            var revenuePerMile = miles > 0 ? (revenue / miles) : 0;
            var costPerMile = miles > 0 ? VARIABLE_COST_PER_MILE : 0;
            var profitPerMile = revenuePerMile - costPerMile;

            htmlContent += `<div class="history-item">`;
            htmlContent += `<div class="action-buttons">`;
            htmlContent += `<button class="edit-btn" onclick="editItem(${item.id}, 'load')">Edit</button>`;
            htmlContent += `<button class="delete-btn" onclick="deleteItem(${item.id}, 'load')">Delete</button>`;
            htmlContent += `</div>`;
            htmlContent += `<h3>Load - ${new Date(item.date).toLocaleDateString()}`;
            if (loadNumber) {
                htmlContent += `<span class="order-highlight">#${loadNumber}</span>`;
            }
            htmlContent += `</h3>`;
            htmlContent += `<div class="details">`;
            htmlContent += `<div class="detail-item"><strong>${miles}</strong><span>Miles</span></div>`;
            htmlContent += `<div class="detail-item"><strong>${revenue.toFixed(2)}</strong><span>Revenue</span></div>`;
            htmlContent += `<div class="detail-item"><strong>${revenuePerMile.toFixed(3)}</strong><span>Revenue/Mile</span></div>`;
            htmlContent += `<div class="detail-item"><strong>${costPerMile.toFixed(3)}</strong><span>Var. Cost/Mile</span></div>`;
            htmlContent += `<div class="detail-item"><strong>${profitPerMile.toFixed(3)}</strong><span>Profit/Mile</span></div>`;
            htmlContent += `</div>`;
            if (origin !== 'N/A' || destination !== 'N/A') {
                htmlContent += `<p><strong>Route:</strong> ${origin} to ${destination}</p>`;
            }
            if (notes) {
                htmlContent += `<p><strong>Notes:</strong> ${notes}</p>`;
            }
            htmlContent += `</div>`;
        } else {
            var categoryName = item.category || '';
            var notes = item.notes || '';
            var amount = item.amount || 0;
            var miles = item.miles || 0;
            
            htmlContent += `<div class="history-item expense-item">`;
            htmlContent += `<div class="action-buttons">`;
            htmlContent += `<button class="edit-btn" onclick="editItem(${item.id}, 'expense')">Edit</button>`;
            htmlContent += `<button class="delete-btn" onclick="deleteItem(${item.id}, 'expense')">Delete</button>`;
            htmlContent += `</div>`;
            htmlContent += `<h3>Expense - ${new Date(item.date).toLocaleDateString()}`;
            htmlContent += `</h3>`;
            htmlContent += `<div class="details">`;
            htmlContent += `<div class="detail-item"><strong>${categoryName}</strong><span>Category</span></div>`;
            htmlContent += `<div class="detail-item"><strong>${amount.toFixed(2)}</strong><span>Amount</span></div>`;
            if (miles > 0) {
                htmlContent += `<div class="detail-item"><strong>${miles}</strong><span>Miles</span></div>`;
                htmlContent += `<div class="detail-item"><strong>${(amount / miles).toFixed(3)}</strong><span>Per Mile</span></div>`;
            }
            htmlContent += `</div>`;
            if (notes) {
                htmlContent += `<p><strong>Notes:</strong> ${notes}</p>`;
            }
            htmlContent += `</div>`;
        }
    }
    
    historyContainer.innerHTML = htmlContent;
}

// ===== CHART INITIALIZATION =====

function initializeWeeklyGauge() {
    const ctx = document.getElementById('weeklyGaugeCanvas').getContext('2d');
    weeklyGaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Loss', 'Profit'],
            datasets: [{
                data: [50, 50],
                backgroundColor: ['#e74c3c', '#27ae60'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: '80%',
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        }
    });
}

function initializeIncentiveGauge() {
    const ctx = document.getElementById('incentiveGaugeCanvas').getContext('2d');
    incentiveGaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['0-3999', '4000-5999', '6000-7999', '8000+'],
            datasets: [{
                data: [3999, 2000, 2000, 2000],
                backgroundColor: ['#dcdcdc', '#f1c40f', '#27ae60', '#3498db'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: '80%',
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        }
    });
}

// ===== MAIN UPDATE FUNCTION =====

function updateDisplay() {
    var data = loadData();
    
    var totalRevenue = data.loads.reduce((sum, load) => sum + (load.revenue || 0), 0);
    var totalMiles = data.loads.reduce((sum, load) => sum + (load.miles || 0), 0);
    var totalLoads = data.loads.length;

    const VARIABLE_COST_PER_MILE = 0.372;
    const FIXED_COSTS_WEEKLY = 277;
    const TRUCK_PAYMENT_WEEKLY = 835;
    
    var calculatedFixedCosts = FIXED_COSTS_WEEKLY;
    var includeLease = document.getElementById('includeLease').checked;
    if(includeLease) {
        calculatedFixedCosts += TRUCK_PAYMENT_WEEKLY;
    }

    var calculatedVariableCosts = totalMiles * VARIABLE_COST_PER_MILE;
    var manuallyEnteredExpenses = data.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    var overallTotalCosts = calculatedFixedCosts + calculatedVariableCosts + manuallyEnteredExpenses;
    var overallNetProfit = totalRevenue - overallTotalCosts;
    var avgCPM = totalMiles > 0 ? overallTotalCosts / totalMiles : 0;
    var avgProfitPerMile = totalMiles > 0 ? overallNetProfit / totalMiles : 0;
    
    if (data.loads.length === 0 && data.expenses.length === 0) {
        document.getElementById('totalRevenue').textContent = '$0.00';
        document.getElementById('totalExpenses').textContent = '$0.00';
        document.getElementById('netProfit').textContent = '$0.00';
        document.getElementById('totalMiles').textContent = '0';
        document.getElementById('totalLoads').textContent = '0';
        document.getElementById('avgCPM').textContent = '$0.000';
        document.getElementById('avgProfitPerMile').textContent = '$0.000';
    } else {
        document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
        document.getElementById('totalExpenses').textContent = '$' + overallTotalCosts.toFixed(2);
        document.getElementById('netProfit').textContent = '$' + overallNetProfit.toFixed(2);
        document.getElementById('totalMiles').textContent = totalMiles.toLocaleString();
        document.getElementById('totalLoads').textContent = totalLoads;
        document.getElementById('avgCPM').textContent = '$' + avgCPM.toFixed(3);
        document.getElementById('avgProfitPerMile').textContent = '$' + avgProfitPerMile.toFixed(3);
    }

    var profitCard = document.getElementById('netProfit').parentElement;
    if (overallNetProfit >= 0) {
        profitCard.className = 'stat-card profit';
    } else {
        profitCard.className = 'stat-card expense';
    }
    
    updateHistoryDisplay();
    updateWeeklyGauge();
    updateIncentiveGauge();
    updatePayCyclePreview();
    updatePLDisplay();
}

// ===== GAUGE UPDATES =====

function updateWeeklyGauge() {
    if (!weeklyGaugeChart) initializeWeeklyGauge();

    var data = loadData();
    const VARIABLE_COST_PER_MILE = 0.372;
    
    var includeLease = document.getElementById('includeLease').checked;
    
    // Get current settlement cycle boundaries
    var cycleBoundaries = getSettlementCycleBoundaries();
    var cycleStart = cycleBoundaries.start;
    var cycleEnd = cycleBoundaries.end;
    
    // Filter loads for current settlement cycle
    var weeklyRevenue = data.loads.filter(load => {
        var loadDate = new Date(load.date);
        return loadDate >= cycleStart && loadDate <= cycleEnd;
    }).reduce((sum, load) => sum + (load.revenue || 0), 0);

    var weeklyMiles = data.loads.filter(load => {
        var loadDate = new Date(load.date);
        return loadDate >= cycleStart && loadDate <= cycleEnd;
    }).reduce((sum, load) => sum + (load.miles || 0), 0);

    // Calculate prorated fixed costs
    var fixedCostInfo = getProratedFixedCosts(includeLease);
    var totalVariableCosts = weeklyMiles * VARIABLE_COST_PER_MILE;
    
    // For weekly expenses, only include expenses within the current cycle
    var weeklyManualExpenses = data.expenses.filter(expense => {
        var expenseDate = new Date(expense.date);
        return expenseDate >= cycleStart && expenseDate <= cycleEnd;
    }).reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    var totalWeeklyCosts = fixedCostInfo.prorated + totalVariableCosts + weeklyManualExpenses;
    var weeklyProfit = weeklyRevenue - totalWeeklyCosts;
    
    let gaugeValue = 0;
    const MAX_GAUGE_RANGE = 2000;

    if (weeklyProfit <= 0) {
        if (totalWeeklyCosts > 0) {
            gaugeValue = Math.min(100, Math.max(0, (weeklyRevenue / totalWeeklyCosts) * 50));
        } else {
            gaugeValue = 0;
        }
        weeklyGaugeChart.data.datasets[0].data = [gaugeValue, 100 - gaugeValue];
        weeklyGaugeChart.data.datasets[0].backgroundColor = [`#e74c3c`, '#dcdcdc'];
    } else {
        let profitRatio = Math.min(weeklyProfit / MAX_GAUGE_RANGE, 1);
        gaugeValue = 50 + (profitRatio * 50);
        weeklyGaugeChart.data.datasets[0].data = [50, gaugeValue - 50, 100 - gaugeValue];
        weeklyGaugeChart.data.datasets[0].backgroundColor = [`#e74c3c`, `#27ae60`, '#dcdcdc'];
    }

    weeklyGaugeChart.update();

    document.getElementById('weeklyRevenue').textContent = '$' + weeklyRevenue.toFixed(2);
    document.getElementById('totalFixedCosts').textContent = '$' + fixedCostInfo.prorated.toFixed(2);
    document.getElementById('totalWeeklyCosts').textContent = '$' + totalWeeklyCosts.toFixed(2);
    document.getElementById('weeklyProfit').textContent = '$' + weeklyProfit.toFixed(2);
}

function updateIncentiveGauge() {
    if (!incentiveGaugeChart) initializeIncentiveGauge();

    var data = loadData();
    var now = new Date();
    
    // Get current calendar month miles (from 1st of month to today)
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var monthMiles = data.loads.filter(load => {
        var loadDate = new Date(load.date);
        return loadDate >= monthStart && loadDate <= now;
    }).reduce((sum, load) => sum + (load.miles || 0), 0);

    let milesToNextTier = 0;
    let incentiveRate = 0;
    let totalMilesForGauge = 8000;
    
    let slice1 = 0, slice2 = 0, slice3 = 0, slice4 = 0, remaining = 0;
    let tiers = [4000, 6000, 8000];

    if (monthMiles >= tiers[2]) {
        incentiveRate = 0.07;
        milesToNextTier = 0;
        slice1 = tiers[0];
        slice2 = tiers[1] - tiers[0];
        slice3 = tiers[2] - tiers[1];
        slice4 = monthMiles - tiers[2];
    } else if (monthMiles >= tiers[1]) {
        incentiveRate = 0.06;
        milesToNextTier = tiers[2] - monthMiles;
        slice1 = tiers[0];
        slice2 = tiers[1] - tiers[0];
        slice3 = monthMiles - tiers[1];
        remaining = totalMilesForGauge - monthMiles;
    } else if (monthMiles >= tiers[0]) {
        incentiveRate = 0.05;
        milesToNextTier = tiers[1] - monthMiles;
        slice1 = tiers[0];
        slice2 = monthMiles - tiers[0];
        remaining = totalMilesForGauge - monthMiles;
    } else {
        incentiveRate = 0.00;
        milesToNextTier = tiers[0] - monthMiles;
        slice1 = monthMiles;
        remaining = totalMilesForGauge - monthMiles;
    }

    incentiveGaugeChart.data.datasets[0].data = [slice1, slice2, slice3, slice4, remaining];
    incentiveGaugeChart.data.datasets[0].backgroundColor = [`#dcdcdc`, `#f1c40f`, `#27ae60`, `#3498db`, `#ffffff`];
    incentiveGaugeChart.update();
    
    var totalIncentivePay = monthMiles * incentiveRate;
    document.getElementById('monthMiles').textContent = monthMiles.toLocaleString();
    document.getElementById('incentiveRate').textContent = '$' + incentiveRate.toFixed(2);
    document.getElementById('milesToNextTier').textContent = milesToNextTier.toLocaleString();
    document.getElementById('totalIncentivePay').textContent = '$' + totalIncentivePay.toFixed(2);
}

function updatePayCyclePreview() {
    var data = loadData();
    const VARIABLE_COST_PER_MILE = 0.372;
    
    // Get current settlement cycle boundaries
    var currentCycleBoundaries = getSettlementCycleBoundaries();
    
    // Calculate next cycle boundaries
    var nextCycleStart = new Date(currentCycleBoundaries.end);
    nextCycleStart.setDate(nextCycleStart.getDate() + 1);
    nextCycleStart.setHours(0, 0, 0, 0);
    var nextCycleEnd = new Date(nextCycleStart);
    nextCycleEnd.setDate(nextCycleEnd.getDate() + 6);
    nextCycleEnd.setHours(23, 59, 59, 999);

    var currentCycleRevenue = 0;
    var currentCycleMiles = 0;
    var nextCycleRevenue = 0;
    var nextCycleMiles = 0;

    data.loads.forEach(load => {
        var loadDate = new Date(load.date);
        if (loadDate >= currentCycleBoundaries.start && loadDate <= currentCycleBoundaries.end) {
            currentCycleRevenue += load.revenue || 0;
            currentCycleMiles += load.miles || 0;
        } else if (loadDate >= nextCycleStart && loadDate <= nextCycleEnd) {
            nextCycleRevenue += load.revenue || 0;
            nextCycleMiles += load.miles || 0;
        }
    });

    // Calculate variable costs and profit for each cycle
    var currentCycleVariableCosts = currentCycleMiles * VARIABLE_COST_PER_MILE;
    var currentCycleProfit = currentCycleRevenue - currentCycleVariableCosts;
    
    var nextCycleVariableCosts = nextCycleMiles * VARIABLE_COST_PER_MILE;
    var nextCycleProfit = nextCycleRevenue - nextCycleVariableCosts;

    document.getElementById('currentCycleRevenue').textContent = '$' + currentCycleRevenue.toFixed(2);
    document.getElementById('currentCycleMiles').textContent = currentCycleMiles.toLocaleString();
    document.getElementById('currentCycleVariableCosts').textContent = '$' + currentCycleVariableCosts.toFixed(2);
    document.getElementById('currentCycleProfit').textContent = '$' + currentCycleProfit.toFixed(2);
    
    document.getElementById('nextCycleRevenue').textContent = '$' + nextCycleRevenue.toFixed(2);
    document.getElementById('nextCycleMiles').textContent = nextCycleMiles.toLocaleString();
    document.getElementById('nextCycleVariableCosts').textContent = '$' + nextCycleVariableCosts.toFixed(2);
    document.getElementById('nextCycleProfit').textContent = '$' + nextCycleProfit.toFixed(2);
}

// ===== DATA EXPORT/IMPORT =====

function exportData() {
    var data = loadData();
    var exportData = {
        loads: data.loads,
        expenses: data.expenses,
        exportDate: new Date().toISOString()
    };
    var dataStr = JSON.stringify(exportData, null, 2);
    var dataBlob = new Blob([dataStr], {type: 'application/json'});
    var url = URL.createObjectURL(dataBlob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'trucking-data-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('lastExportDate', new Date().toISOString());
}

function importData(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var importedData = JSON.parse(e.target.result);
            if (importedData.loads && importedData.expenses) {
                if (confirm('This will replace all existing data. Continue?')) {
                    saveData(importedData.loads, importedData.expenses);
                    updateDisplay();
                    alert('Data imported successfully!');
                }
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            alert('Error reading file');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
        if (confirm('Last chance - this will permanently delete everything!')) {
            localStorage.removeItem('loads');
            localStorage.removeItem('expenses');
            updateDisplay();
            alert('All data cleared');
        }
    }
}

function showRawData() {
    var data = loadData();
    var formattedData = JSON.stringify(data, null, 2);
    document.getElementById('dataDisplayArea').textContent = formattedData;
}

// ===== BACKUP REMINDER SYSTEM =====

function checkBackupReminder() {
    var lastExportDate = localStorage.getItem('lastExportDate');
    var now = new Date();
    
    if (!lastExportDate) {
        // First time user - set last export to now, no reminder yet
        localStorage.setItem('lastExportDate', now.toISOString());
        return;
    }
    
    var daysSinceExport = (now - new Date(lastExportDate)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceExport >= 30) {
        setTimeout(function() {
            showBackupReminder();
        }, 2000); // Show after 2 seconds to not interrupt initial load
    }
}

function showBackupReminder() {
    var shouldExport = confirm(
        "ðŸ“± Backup Reminder\n\n" +
        "It's been 30+ days since your last data export.\n\n" +
        "Would you like to backup your trucking data now?\n\n" +
        "This saves your loads and expenses to your device so you don't lose your records."
    );
    
    if (shouldExport) {
        exportData();
    } else {
        // Ask again in 7 days
        var nextReminder = new Date();
        nextReminder.setDate(nextReminder.getDate() - 23); // 30-7=23 days ago
        localStorage.setItem('lastExportDate', nextReminder.toISOString());
    }
}

// ===== PROFIT & LOSS FUNCTIONALITY =====

function showPLPeriod(period, element) {
    currentPLPeriod = period;
    document.querySelectorAll('#pl button.btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    updatePLDisplay();
}

function getPLDateRange(period) {
    var now = new Date();
    var start, end, title;
    
    switch(period) {
        case 'current-month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            title = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            break;
            
        case 'last-month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            title = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            break;
            
        case 'ytd':
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
            title = now.getFullYear() + ' Year to Date';
            break;
            
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            title = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return { start, end, title };
}

function updatePLDisplay() {
    var data = loadData();
    const VARIABLE_COST_PER_MILE = 0.372;
    
    var dateRange = getPLDateRange(currentPLPeriod);
    var start = dateRange.start;
    var end = dateRange.end;
    
    // Filter data for the selected period
    var periodLoads = data.loads.filter(load => {
        var loadDate = new Date(load.date);
        return loadDate >= start && loadDate <= end;
    });
    
    var periodExpenses = data.expenses.filter(expense => {
        var expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
    });
    
    // Calculate revenue
    var loadRevenue = periodLoads.reduce((sum, load) => sum + (load.revenue || 0), 0);
    var totalMiles = periodLoads.reduce((sum, load) => sum + (load.miles || 0), 0);
    
    // Calculate incentive pay based on period
    var incentivePay = 0;
    if (currentPLPeriod === 'current-month') {
        // Use current month miles for incentive calculation
        var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        var monthMiles = data.loads.filter(load => {
            var loadDate = new Date(load.date);
            return loadDate >= monthStart && loadDate <= new Date();
        }).reduce((sum, load) => sum + (load.miles || 0), 0);
        
        var incentiveRate = 0;
        if (monthMiles >= 8000) incentiveRate = 0.07;
        else if (monthMiles >= 6000) incentiveRate = 0.06;
        else if (monthMiles >= 4000) incentiveRate = 0.05;
        
        incentivePay = monthMiles * incentiveRate;
    }
    
    var totalRevenue = loadRevenue + incentivePay;
    
    // Calculate costs
    var variableCosts = totalMiles * VARIABLE_COST_PER_MILE;
    var grossProfit = totalRevenue - variableCosts;
    
    // Calculate period-based fixed costs
    var periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    var weeksInPeriod = periodDays / 7;
    
    var fixedCosts = 277 * weeksInPeriod;
    var truckPayment = 835 * weeksInPeriod;
    var manualExpenses = periodExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    var totalOperatingExpenses = fixedCosts + truckPayment + manualExpenses;
    var netProfit = grossProfit - totalOperatingExpenses;
    
    // Calculate metrics
    var profitPerMile = totalMiles > 0 ? netProfit / totalMiles : 0;
    var profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    var revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
    var totalCosts = variableCosts + totalOperatingExpenses;
    var costPerMile = totalMiles > 0 ? totalCosts / totalMiles : 0;
    
    // Update display
    document.getElementById('plPeriodTitle').textContent = dateRange.title;
    document.getElementById('plLoadRevenue').textContent = '$' + loadRevenue.toFixed(2);
    document.getElementById('plIncentivePay').textContent = '$' + incentivePay.toFixed(2);
    document.getElementById('plTotalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    
    document.getElementById('plTotalMiles').textContent = totalMiles.toLocaleString();
    document.getElementById('plVariableCosts').textContent = '$' + variableCosts.toFixed(2);
    document.getElementById('plGrossProfit').textContent = '$' + grossProfit.toFixed(2);
    
    document.getElementById('plFixedCosts').textContent = '$' + fixedCosts.toFixed(2);
    document.getElementById('plTruckPayment').textContent = '$' + truckPayment.toFixed(2);
    document.getElementById('plManualExpenses').textContent = '$' + manualExpenses.toFixed(2);
    
    document.getElementById('plNetProfit').textContent = '$' + netProfit.toFixed(2);
    
    document.getElementById('plProfitPerMile').textContent = '$' + profitPerMile.toFixed(3);
    document.getElementById('plProfitMargin').textContent = profitMargin.toFixed(1) + '%';
    document.getElementById('plRevenuePerMile').textContent = '$' + revenuePerMile.toFixed(3);
    document.getElementById('plCostPerMile').textContent = '$' + costPerMile.toFixed(3);
    
    // Color code net profit
    var netProfitElement = document.getElementById('plNetProfit');
    if (netProfit >= 0) {
        netProfitElement.style.color = '#27ae60';
    } else {
        netProfitElement.style.color = '#e74c3c';
    }
}
