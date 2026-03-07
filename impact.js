// Generate realistic 7.5 years of donation data
function generateRealisticDonations() {
    const donations = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 7);
    startDate.setMonth(startDate.getMonth() - 6); // 7.5 years ago

    const monthlyAmounts = [
        15, 15, 20, 15, 15, 10, 15, 20, 15, 15, 15, 20,  // Year 1
        15, 15, 25, 30, 35, 35, 30, 25, 20, 15, 15, 15,  // Year 2 (peak period)
        15, 15, 10, 10, 15, 15, 20, 15, 15, 15, 20, 25,  // Year 3
        15, 15, 15, 20, 25, 30, 35, 30, 25, 20, 15, 15,  // Year 4 (another peak)
        10, 10, 15, 15, 15, 20, 15, 15, 10, 10, 15, 15,  // Year 5 (lower period)
        15, 15, 20, 25, 30, 30, 25, 20, 15, 15, 15, 20,  // Year 6
        15, 15, 15, 20, 15, 15, 15, 20, 25, 30, 20, 15,  // Year 7
        15, 15, 20, 15, 15, 10                             // Year 7.5 (6 months)
    ];

    for (let i = 0; i < monthlyAmounts.length; i++) {
        const donationDate = new Date(startDate);
        donationDate.setMonth(donationDate.getMonth() + i);
        donations.push({
            amount: monthlyAmounts[i],
            date: donationDate.toISOString().split('T')[0]
        });
    }

    const largerDonations = [
        { amount: 150, monthOffset: 18 },
        { amount: 300, monthOffset: 36 },
        { amount: 450, monthOffset: 60 },
        { amount: 200, monthOffset: 80 }
    ];

    largerDonations.forEach(large => {
        const donationDate = new Date(startDate);
        donationDate.setMonth(donationDate.getMonth() + large.monthOffset);
        donationDate.setDate(15);
        donations.push({
            amount: large.amount,
            date: donationDate.toISOString().split('T')[0]
        });
    });

    donations.sort((a, b) => new Date(a.date) - new Date(b.date));
    return donations;
}

// Toast notification system
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

// Impact Dashboard Logic
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));

    if (!localStorage.getItem('donations')) {
        const sampleDonations = generateRealisticDonations();
        localStorage.setItem('donations', JSON.stringify(sampleDonations));
    }

    const donations = JSON.parse(localStorage.getItem('donations'));

    displayMetrics(donations);
    displayChart(donations);
    displayAllocationChart();
    displayCausesBreakdown(userData.themes, donations);
    displayDonationHistory(donations);
    setupResetDemoData();
    setupDonationForm();
    setupPredictionCalculator();
    setupHistoryToggle(donations);

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });
});

function calculateCompounding(donations) {
    const ANNUAL_DIVIDEND_RATE = 0.05;
    const REINVEST_RATE = 0.50;
    const CAUSES_RATE = 0.40;

    const sortedDonations = [...donations].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    if (sortedDonations.length === 0) {
        return { dataPoints: [], totalDonated: 0, portfolioValue: 0, annualImpact: 0, totalDividends: 0 };
    }

    const startDate = new Date(sortedDonations[0].date);
    const today = new Date();

    const dataPoints = [];
    let portfolioValue = 0;
    let cumulativeDonations = 0;
    let cumulativeDividends = 0;
    let currentDate = new Date(startDate);
    let donationIndex = 0;

    while (currentDate <= today) {
        const monthStr = currentDate.toISOString().slice(0, 7);
        const yearStr = currentDate.getFullYear().toString();

        while (donationIndex < sortedDonations.length) {
            const donationDate = new Date(sortedDonations[donationIndex].date);
            if (donationDate.getFullYear() === currentDate.getFullYear() &&
                donationDate.getMonth() === currentDate.getMonth()) {
                const amount = sortedDonations[donationIndex].amount;
                portfolioValue += amount;
                cumulativeDonations += amount;
                donationIndex++;
            } else {
                break;
            }
        }

        const monthlyDividend = portfolioValue * (ANNUAL_DIVIDEND_RATE / 12);
        const reinvestAmount = monthlyDividend * REINVEST_RATE;
        portfolioValue += reinvestAmount;
        cumulativeDividends += monthlyDividend;

        dataPoints.push({
            date: monthStr,
            year: yearStr,
            donations: Math.round(cumulativeDonations * 100) / 100,
            dividends: Math.round(cumulativeDividends * 100) / 100,
            portfolio: Math.round(portfolioValue * 100) / 100
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const annualDividend = portfolioValue * ANNUAL_DIVIDEND_RATE;
    const annualImpact = annualDividend * CAUSES_RATE;

    return {
        dataPoints,
        totalDonated: cumulativeDonations,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        annualImpact: Math.round(annualImpact * 100) / 100,
        totalDividends: Math.round(cumulativeDividends * 100) / 100
    };
}

function displayMetrics(donations) {
    const metrics = calculateCompounding(donations);

    document.getElementById('totalDonated').textContent =
        `€${metrics.totalDonated.toLocaleString()}`;

    document.getElementById('portfolioValue').textContent =
        `€${metrics.portfolioValue.toLocaleString()}`;

    const growthPercent = metrics.totalDonated > 0
        ? ((metrics.portfolioValue - metrics.totalDonated) / metrics.totalDonated * 100).toFixed(1)
        : 0;
    document.getElementById('portfolioGrowth').textContent =
        `+${growthPercent}% growth`;

    document.getElementById('annualImpact').textContent =
        `€${metrics.annualImpact.toLocaleString()}`;

    const monthlyAvg = calculateMonthlyAverage(donations);
    const monthlyElement = document.getElementById('monthlyDonations');
    if (monthlyElement) {
        monthlyElement.textContent = `€${monthlyAvg.toFixed(0)}`;
    }

    // Show years of giving in header
    const years = getYearsSinceFirstDonation(donations);
    const yearsGivingEl = document.getElementById('yearsGiving');
    const yearsGivingBadge = document.getElementById('yearsGivingBadge');
    if (yearsGivingEl && years > 0) {
        const yearsLabel = years >= 1
            ? `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''}`
            : `${Math.round(years * 12)} months`;
        yearsGivingEl.textContent = yearsLabel;
        if (yearsGivingBadge) yearsGivingBadge.style.display = 'inline';
    }

    const avgAnnualDonation = metrics.totalDonated / Math.max(1, getYearsSinceFirstDonation(donations));
    if (metrics.annualImpact > avgAnnualDonation && metrics.dataPoints.length > 12) {
        document.getElementById('milestoneAlert').style.display = 'flex';
    }

    displayCumulativeSpending(metrics);
}

function calculateMonthlyAverage(donations) {
    if (donations.length === 0) return 0;

    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const recentDonations = donations.filter(d =>
        new Date(d.date) >= twelveMonthsAgo
    );

    if (recentDonations.length === 0) return 0;

    const total = recentDonations.reduce((sum, d) => sum + d.amount, 0);
    return total / 12;
}

function displayCumulativeSpending(metrics) {
    const totalDividendsPaid = metrics.portfolioValue - metrics.totalDonated;

    const totalReinvested = totalDividendsPaid * 0.50;
    const totalToCauses = totalDividendsPaid * 0.40;
    const totalMaintenance = totalDividendsPaid * 0.10;

    const reinvestedEl = document.getElementById('totalReinvested');
    const causesEl = document.getElementById('totalCauses');
    const maintenanceEl = document.getElementById('totalMaintenance');

    if (reinvestedEl) reinvestedEl.textContent = `€${Math.round(totalReinvested).toLocaleString()}`;
    if (causesEl) causesEl.textContent = `€${Math.round(totalToCauses).toLocaleString()}`;
    if (maintenanceEl) maintenanceEl.textContent = `€${Math.round(totalMaintenance).toLocaleString()}`;
}

function getYearsSinceFirstDonation(donations) {
    if (donations.length === 0) return 1;
    const sorted = [...donations].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    const today = new Date();
    return Math.max(0, (today - firstDate) / (365.25 * 24 * 60 * 60 * 1000));
}

// Donut chart for fund allocation
let allocationChartInstance = null;

function displayAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    if (allocationChartInstance) {
        allocationChartInstance.destroy();
    }

    allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Reinvested (50%)', 'Your Causes (40%)', 'Maintenance (10%)'],
            datasets: [{
                data: [50, 40, 10],
                backgroundColor: ['#32CD32', '#E89C5C', '#696969'],
                borderColor: 'rgba(26, 18, 32, 0.8)',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    borderColor: 'rgba(245, 241, 232, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label;
                        }
                    }
                }
            }
        }
    });
}

let currentChartView = 'monthly';
let currentChartInstance = null;

function displayChart(donations) {
    const metrics = calculateCompounding(donations);
    const ctx = document.getElementById('compoundingChart');

    if (!ctx) return;

    if (currentChartInstance) {
        currentChartInstance.destroy();
    }

    const chartData = currentChartView === 'monthly'
        ? prepareMonthlyData(metrics.dataPoints)
        : prepareYearlyData(metrics.dataPoints);

    currentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Cumulative Donations',
                    data: chartData.donations,
                    borderColor: '#E89C5C',
                    backgroundColor: 'rgba(232, 156, 92, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Cumulative Dividends',
                    data: chartData.dividends,
                    borderColor: '#4169E1',
                    backgroundColor: 'rgba(65, 105, 225, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Portfolio Value',
                    data: chartData.portfolio,
                    borderColor: '#228B22',
                    backgroundColor: 'rgba(34, 139, 34, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#F5F1E8',
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = !meta.hidden;
                        chart.update();
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    borderColor: 'rgba(245, 241, 232, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': €' +
                                context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#A89E8C',
                        callback: function(value) { return '€' + value.toLocaleString(); }
                    },
                    grid: { color: 'rgba(245, 241, 232, 0.1)' }
                },
                x: {
                    ticks: {
                        color: '#A89E8C',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { color: 'rgba(245, 241, 232, 0.05)' }
                }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });

    setupChartViewToggle(donations);
}

function prepareMonthlyData(dataPoints) {
    return {
        labels: dataPoints.map(d => d.date),
        donations: dataPoints.map(d => d.donations),
        dividends: dataPoints.map(d => d.dividends),
        portfolio: dataPoints.map(d => d.portfolio)
    };
}

function prepareYearlyData(dataPoints) {
    const yearlyData = {};
    dataPoints.forEach(point => {
        const year = point.year;
        if (!yearlyData[year] || point.date > yearlyData[year].date) {
            yearlyData[year] = point;
        }
    });

    const years = Object.keys(yearlyData).sort();
    return {
        labels: years,
        donations: years.map(y => yearlyData[y].donations),
        dividends: years.map(y => yearlyData[y].dividends),
        portfolio: years.map(y => yearlyData[y].portfolio)
    };
}

function setupChartViewToggle(donations) {
    const monthlyBtn = document.getElementById('viewMonthly');
    const yearlyBtn = document.getElementById('viewYearly');

    if (!monthlyBtn || !yearlyBtn) return;

    // Remove old listeners by replacing elements
    const newMonthlyBtn = monthlyBtn.cloneNode(true);
    const newYearlyBtn = yearlyBtn.cloneNode(true);
    monthlyBtn.parentNode.replaceChild(newMonthlyBtn, monthlyBtn);
    yearlyBtn.parentNode.replaceChild(newYearlyBtn, yearlyBtn);

    newMonthlyBtn.addEventListener('click', function() {
        if (currentChartView === 'monthly') return;
        currentChartView = 'monthly';
        newMonthlyBtn.classList.add('active');
        newYearlyBtn.classList.remove('active');
        displayChart(donations);
    });

    newYearlyBtn.addEventListener('click', function() {
        if (currentChartView === 'yearly') return;
        currentChartView = 'yearly';
        newYearlyBtn.classList.add('active');
        newMonthlyBtn.classList.remove('active');
        displayChart(donations);
    });
}

function displayCausesBreakdown(themes, donations) {
    const metrics = calculateCompounding(donations);
    const annualToCauses = metrics.annualImpact;
    const perCause = annualToCauses / 3;

    const themeNames = {
        'basic-needs': 'Basic Needs & Poverty',
        'health': 'Health & Medicine',
        'education': 'Education & Knowledge',
        'environment': 'Environment & Climate',
        'animals': 'Animals',
        'children': 'Children & Youth',
        'human-rights': 'Human Rights & Social Justice',
        'community': 'Community & Social Services',
        'culture': 'Culture, Arts & Heritage',
        'technology': 'Technology & Future Causes',
        'freedom': 'Freedom of Speech'
    };

    const causesList = document.getElementById('causesList');
    if (!causesList) return;

    causesList.innerHTML = '';
    themes.forEach(theme => {
        const div = document.createElement('div');
        div.className = 'cause-item';
        div.innerHTML = `
            <span class="cause-name">${themeNames[theme] || theme}</span>
            <span class="cause-amount">€${Math.round(perCause).toLocaleString()}/yr</span>
        `;
        causesList.appendChild(div);
    });
}

// Donation history display
const HISTORY_PREVIEW_COUNT = 8;

function displayDonationHistory(donations) {
    const container = document.getElementById('donationHistoryList');
    const countEl = document.getElementById('donationCount');
    const toggleBtn = document.getElementById('toggleHistory');
    if (!container) return;

    const sorted = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (countEl) {
        countEl.textContent = `${sorted.length} donation${sorted.length !== 1 ? 's' : ''}`;
    }

    if (sorted.length === 0) {
        container.innerHTML = '<p class="no-donations">No donations yet. Add your first donation below.</p>';
        return;
    }

    renderHistoryItems(container, sorted, HISTORY_PREVIEW_COUNT);

    if (toggleBtn) {
        if (sorted.length > HISTORY_PREVIEW_COUNT) {
            toggleBtn.style.display = 'block';
            toggleBtn.dataset.expanded = 'false';
            toggleBtn.textContent = `Show all ${sorted.length} donations`;
        } else {
            toggleBtn.style.display = 'none';
        }
    }
}

function renderHistoryItems(container, sorted, limit) {
    const toShow = limit ? sorted.slice(0, limit) : sorted;
    container.innerHTML = '';

    toShow.forEach(d => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const date = new Date(d.date);
        const formatted = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        item.innerHTML = `
            <span class="history-date">${formatted}</span>
            <span class="history-amount">€${d.amount.toLocaleString()}</span>
        `;
        container.appendChild(item);
    });
}

function setupHistoryToggle(donations) {
    const toggleBtn = document.getElementById('toggleHistory');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function() {
        const container = document.getElementById('donationHistoryList');
        const sorted = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));
        const isExpanded = toggleBtn.dataset.expanded === 'true';

        if (isExpanded) {
            renderHistoryItems(container, sorted, HISTORY_PREVIEW_COUNT);
            toggleBtn.textContent = `Show all ${sorted.length} donations`;
            toggleBtn.dataset.expanded = 'false';
        } else {
            renderHistoryItems(container, sorted, null);
            toggleBtn.textContent = 'Show less';
            toggleBtn.dataset.expanded = 'true';
        }
    });
}

function setupDonationForm() {
    const form = document.getElementById('donationForm');
    if (!form) return;

    const dateInput = document.getElementById('donationDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('donationAmount').value);
        const date = document.getElementById('donationDate').value;

        if (!amount || !date || amount <= 0) {
            showToast('Please enter a valid amount and date', 'error');
            return;
        }

        const donations = JSON.parse(localStorage.getItem('donations') || '[]');
        donations.push({ amount, date });
        localStorage.setItem('donations', JSON.stringify(donations));

        // Refresh all displays
        displayMetrics(donations);

        const chartCanvas = document.getElementById('compoundingChart');
        const oldChart = Chart.getChart(chartCanvas);
        if (oldChart) oldChart.destroy();
        displayChart(donations);

        const userData = JSON.parse(localStorage.getItem('user'));
        displayCausesBreakdown(userData.themes, donations);
        displayDonationHistory(donations);
        setupHistoryToggle(donations);

        form.reset();
        if (dateInput) dateInput.valueAsDate = new Date();

        showToast(`€${amount.toLocaleString()} donation added successfully`);
    });
}

function setupResetDemoData() {
    const resetBtn = document.getElementById('resetDemoData');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', function() {
        if (confirm('Reset to demo data? This will replace your current donation history with 7.5 years of sample data.')) {
            const sampleDonations = generateRealisticDonations();
            localStorage.setItem('donations', JSON.stringify(sampleDonations));
            location.reload();
        }
    });
}

function setupPredictionCalculator() {
    const calcButton = document.getElementById('calculatePrediction');
    if (!calcButton) return;

    calcButton.addEventListener('click', function() {
        const newMonthlyInput = document.getElementById('newMonthlyAmount');
        const yearsInput = document.getElementById('projectionYears');

        if (!newMonthlyInput || !yearsInput) return;

        const newMonthly = parseFloat(newMonthlyInput.value);
        const years = parseInt(yearsInput.value);

        if (!newMonthly || !years || newMonthly <= 0 || years <= 0) {
            showToast('Please enter a valid monthly amount and projection years', 'error');
            return;
        }

        const donations = JSON.parse(localStorage.getItem('donations') || '[]');

        if (donations.length === 0) {
            showToast('No donation data found. Add donations or reset to demo data first.', 'error');
            return;
        }

        const currentMetrics = calculateCompounding(donations);
        const currentMonthly = calculateMonthlyAverage(donations);

        if (currentMonthly === 0) {
            showToast('No donations in the last 12 months to calculate an average from.', 'error');
            return;
        }

        const currentProjection = projectFuture(currentMetrics.portfolioValue, currentMonthly, years);
        const newProjection = projectFuture(currentMetrics.portfolioValue, newMonthly, years);

        displayPredictionChart(currentProjection, newProjection, currentMonthly, newMonthly);

        document.getElementById('predictionResults').style.display = 'block';

        const currentFutureValue = currentProjection[currentProjection.length - 1].portfolio;
        const newFutureValue = newProjection[newProjection.length - 1].portfolio;
        const currentFutureImpact = currentFutureValue * 0.05 * 0.40;
        const newFutureImpact = newFutureValue * 0.05 * 0.40;

        document.getElementById('currentScenarioValue').textContent =
            `€${Math.round(currentFutureValue).toLocaleString()}`;
        document.getElementById('currentScenarioImpact').textContent =
            `€${Math.round(currentFutureImpact).toLocaleString()}`;
        document.getElementById('newScenarioValue').textContent =
            `€${Math.round(newFutureValue).toLocaleString()}`;
        document.getElementById('newScenarioImpact').textContent =
            `€${Math.round(newFutureImpact).toLocaleString()}`;

        const valueDiff = newFutureValue - currentFutureValue;
        const impactDiff = newFutureImpact - currentFutureImpact;

        document.getElementById('valueDifference').textContent =
            `${valueDiff >= 0 ? '+' : ''}€${Math.round(valueDiff).toLocaleString()}`;
        document.getElementById('impactDifference').textContent =
            `${impactDiff >= 0 ? '+' : ''}€${Math.round(impactDiff).toLocaleString()}`;

        // Scroll to results
        document.getElementById('predictionResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function projectFuture(currentPortfolio, monthlyDonation, years) {
    const ANNUAL_DIVIDEND_RATE = 0.05;
    const REINVEST_RATE = 0.50;

    const dataPoints = [];
    let portfolioValue = currentPortfolio;
    const totalMonths = years * 12;

    for (let month = 0; month <= totalMonths; month++) {
        portfolioValue += monthlyDonation;
        const monthlyDividend = portfolioValue * (ANNUAL_DIVIDEND_RATE / 12);
        portfolioValue += monthlyDividend * REINVEST_RATE;

        if (month % 3 === 0) {
            dataPoints.push({
                month: month,
                portfolio: Math.round(portfolioValue * 100) / 100
            });
        }
    }

    return dataPoints;
}

function displayPredictionChart(currentProjection, newProjection, currentMonthly, newMonthly) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: currentProjection.map(d => `Month ${d.month}`),
            datasets: [
                {
                    label: `Current (€${currentMonthly.toFixed(0)}/mo)`,
                    data: currentProjection.map(d => d.portfolio),
                    borderColor: '#A89E8C',
                    backgroundColor: 'rgba(168, 158, 140, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                },
                {
                    label: `New (€${newMonthly}/mo)`,
                    data: newProjection.map(d => d.portfolio),
                    borderColor: '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#F5F1E8',
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor: '#F5F1E8',
                    bodyColor: '#F5F1E8',
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': €' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#A89E8C',
                        callback: function(value) { return '€' + value.toLocaleString(); }
                    },
                    grid: { color: 'rgba(245, 241, 232, 0.1)' }
                },
                x: {
                    ticks: {
                        color: '#A89E8C',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { color: 'rgba(245, 241, 232, 0.05)' }
                }
            }
        }
    });
}
