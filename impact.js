// ── Date filter state ──────────────────────────────────────────────────────
let _impactFilterRange = 'all';
let _impactFilterFrom  = null;
let _impactFilterTo    = null;
let _impactUserData    = null;

function getFilteredDonations() {
    const all = JSON.parse(localStorage.getItem('donations_v2') || '[]');
    if (_impactFilterRange === 'all') return all;

    const today = new Date();

    if (_impactFilterRange === 'custom') {
        const from = _impactFilterFrom ? new Date(_impactFilterFrom) : null;
        const to   = _impactFilterTo   ? new Date(_impactFilterTo)   : today;
        return all.filter(d => {
            const date = new Date(d.date);
            return (!from || date >= from) && date <= to;
        });
    }

    const from = new Date(today);
    if (_impactFilterRange === '1y') from.setFullYear(from.getFullYear() - 1);
    if (_impactFilterRange === '3y') from.setFullYear(from.getFullYear() - 3);
    return all.filter(d => new Date(d.date) >= from);
}

function refreshImpactDisplays() {
    const donations = getFilteredDonations();
    displayMetrics(donations);
    displayChart(donations);
    if (_impactUserData) displayCausesBreakdown(_impactUserData.themes, donations);
    displayDonationHistory(donations);
    setupHistoryToggle(donations);
}

function setupDateFilter() {
    const presets     = document.querySelectorAll('.filter-preset');
    const customPanel = document.getElementById('filterCustom');
    const applyBtn    = document.getElementById('applyFilter');

    if (!presets.length) return;

    presets.forEach(btn => {
        btn.addEventListener('click', function () {
            presets.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            _impactFilterRange = this.dataset.range;

            if (customPanel) {
                customPanel.classList.toggle('filter-custom-visible', _impactFilterRange === 'custom');
            }

            if (_impactFilterRange !== 'custom') {
                refreshImpactDisplays();
            }
        });
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', function () {
            _impactFilterFrom = document.getElementById('filterFrom')?.value || null;
            _impactFilterTo   = document.getElementById('filterTo')?.value   || null;
            refreshImpactDisplays();
        });
    }
}

// ── Public entry point (called by dashboard.js) ───────────────────────────
window.initImpactDashboard = function (userData) {
    _impactUserData = userData;

    if (!localStorage.getItem('donations_v2')) {
        localStorage.setItem('donations_v2', JSON.stringify(generateRealisticDonations()));
    }

    const donations = getFilteredDonations();

    displayMetrics(donations);
    displayChart(donations);
    displayAllocationChart();
    displayCausesBreakdown(userData.themes, donations);
    displayDonationHistory(donations);
    setupResetDemoData();
    setupDonationForm();
    setupPredictionCalculator();
    setupHistoryToggle(donations);
    setupDateFilter();
};

// ── Demo data generator ───────────────────────────────────────────────────
function generateRealisticDonations() {
    const donations = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 7);
    startDate.setDate(1);

    for (let i = 0; i < 84; i++) {
        const donationDate = new Date(startDate);
        donationDate.setMonth(donationDate.getMonth() + i);
        donationDate.setDate(5);
        donations.push({ amount: 35, date: donationDate.toISOString().split('T')[0] });
    }

    return donations;
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

// ── Core calculation ──────────────────────────────────────────────────────
function calculateCompounding(donations) {
    const ANNUAL_DIVIDEND_RATE  = 0.05;
    const REINVEST_RATE         = 0.50;
    const CAUSES_RATE           = 0.40;
    const ANNUAL_MARKET_RETURN  = 0.09; // S&P 500 price appreciation (excl. dividends)

    const sortedDonations = [...donations].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedDonations.length === 0) {
        return { dataPoints: [], totalDonated: 0, portfolioValue: 0, annualImpact: 0, totalDividends: 0 };
    }

    const startDate = new Date(sortedDonations[0].date);
    const today     = new Date();

    const dataPoints          = [];
    let portfolioValue        = 0;
    let cumulativeDonations   = 0;
    let cumulativeDividends   = 0;
    let currentDate           = new Date(startDate);
    let donationIndex         = 0;

    while (currentDate <= today) {
        const monthStr = currentDate.toISOString().slice(0, 7);
        const yearStr  = currentDate.getFullYear().toString();

        while (donationIndex < sortedDonations.length) {
            const donationDate = new Date(sortedDonations[donationIndex].date);
            if (donationDate.getFullYear() === currentDate.getFullYear() &&
                donationDate.getMonth()    === currentDate.getMonth()) {
                const amount = sortedDonations[donationIndex].amount;
                portfolioValue      += amount;
                cumulativeDonations += amount;
                donationIndex++;
            } else {
                break;
            }
        }

        const monthlyDividend     = portfolioValue * (ANNUAL_DIVIDEND_RATE / 12);
        const reinvestAmount      = monthlyDividend * REINVEST_RATE;
        const monthlyAppreciation = portfolioValue * (ANNUAL_MARKET_RETURN / 12);
        portfolioValue            += reinvestAmount + monthlyAppreciation;
        cumulativeDividends       += monthlyDividend;

        dataPoints.push({
            date:        monthStr,
            year:        yearStr,
            donations:   Math.round(cumulativeDonations * 100) / 100,
            portfolio:   Math.round(portfolioValue * 100)      / 100,
            causesYield: Math.round(cumulativeDividends * CAUSES_RATE * 100) / 100
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const annualDividend = portfolioValue * ANNUAL_DIVIDEND_RATE;
    const annualImpact   = annualDividend * CAUSES_RATE;

    return {
        dataPoints,
        totalDonated:   cumulativeDonations,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        annualImpact:   Math.round(annualImpact   * 100) / 100,
        totalDividends: Math.round(cumulativeDividends * 100) / 100
    };
}

// ── Metrics display ───────────────────────────────────────────────────────
function displayMetrics(donations) {
    const metrics = calculateCompounding(donations);

    const totalDonatedEl  = document.getElementById('totalDonated');
    const portfolioValueEl = document.getElementById('portfolioValue');
    if (totalDonatedEl)  totalDonatedEl.textContent  = `€${metrics.totalDonated.toLocaleString()}`;
    if (portfolioValueEl) portfolioValueEl.textContent = `€${metrics.portfolioValue.toLocaleString()}`;

    const growthPercent = metrics.totalDonated > 0
        ? ((metrics.portfolioValue - metrics.totalDonated) / metrics.totalDonated * 100).toFixed(1)
        : 0;
    const portfolioGrowthEl = document.getElementById('portfolioGrowth');
    const annualImpactEl    = document.getElementById('annualImpact');
    if (portfolioGrowthEl) portfolioGrowthEl.textContent = `+${growthPercent}% growth`;
    if (annualImpactEl)    annualImpactEl.textContent    = `€${metrics.annualImpact.toLocaleString()}`;

    const monthlyAvg     = calculateMonthlyAverage(donations);
    const monthlyElement = document.getElementById('monthlyDonations');
    if (monthlyElement) monthlyElement.textContent = `€${monthlyAvg.toFixed(0)}`;

    const years          = getYearsSinceFirstDonation(donations);
    const yearsGivingEl  = document.getElementById('yearsGiving');
    const yearsGivingBadge = document.getElementById('yearsGivingBadge');
    if (yearsGivingEl && years > 0) {
        const yearsLabel = years >= 1
            ? `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''}`
            : `${Math.round(years * 12)} months`;
        yearsGivingEl.textContent = yearsLabel;
        if (yearsGivingBadge) yearsGivingBadge.style.display = 'inline';
    }

    const avgAnnualDonation = metrics.totalDonated / Math.max(1, getYearsSinceFirstDonation(donations));
    const milestoneEl = document.getElementById('milestoneAlert');
    if (milestoneEl) {
        milestoneEl.style.display =
            (metrics.annualImpact > avgAnnualDonation && metrics.dataPoints.length > 12) ? 'flex' : 'none';
    }

    displayCumulativeSpending(metrics);
}

function calculateMonthlyAverage(donations) {
    if (donations.length === 0) return 0;
    const today          = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const recent = donations.filter(d => new Date(d.date) >= twelveMonthsAgo);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, d) => sum + d.amount, 0) / 12;
}

function displayCumulativeSpending(metrics) {
    const totalDividendsPaid = metrics.totalDividends;
    const totalReinvested    = totalDividendsPaid * 0.50;
    const totalToCauses      = totalDividendsPaid * 0.40;
    const totalMaintenance   = totalDividendsPaid * 0.10;

    const reinvestedEl  = document.getElementById('totalReinvested');
    const causesEl      = document.getElementById('totalCauses');
    const maintenanceEl = document.getElementById('totalMaintenance');

    if (reinvestedEl)  reinvestedEl.textContent  = `€${Math.round(totalReinvested).toLocaleString()}`;
    if (causesEl)      causesEl.textContent      = `€${Math.round(totalToCauses).toLocaleString()}`;
    if (maintenanceEl) maintenanceEl.textContent = `€${Math.round(totalMaintenance).toLocaleString()}`;
}

function getYearsSinceFirstDonation(donations) {
    if (donations.length === 0) return 1;
    const sorted    = [...donations].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    return Math.max(0, (new Date() - firstDate) / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Donut chart ───────────────────────────────────────────────────────────
let allocationChartInstance = null;

function displayAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    if (allocationChartInstance) allocationChartInstance.destroy();

    allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Reinvested (50%)', 'Your Causes (40%)', 'Foundation Operations (10%)'],
            datasets: [{
                data:            [50, 40, 10],
                backgroundColor: ['#32CD32', '#E89C5C', '#696969'],
                borderColor:     'rgba(26, 18, 32, 0.8)',
                borderWidth:     2,
                hoverOffset:     8
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
                    bodyColor:  '#F5F1E8',
                    borderColor: 'rgba(245, 241, 232, 0.2)',
                    borderWidth: 1,
                    callbacks: { label: ctx => ' ' + ctx.label }
                }
            }
        }
    });
}

// ── Line chart ────────────────────────────────────────────────────────────
let currentChartView     = 'monthly';
let currentChartInstance = null;

function displayChart(donations) {
    const metrics = calculateCompounding(donations);
    const ctx     = document.getElementById('compoundingChart');
    if (!ctx) return;

    if (currentChartInstance) currentChartInstance.destroy();

    const chartData = currentChartView === 'monthly'
        ? prepareMonthlyData(metrics.dataPoints)
        : prepareYearlyData(metrics.dataPoints);

    const isYearly = currentChartView === 'yearly';
    const avgLabel = isYearly ? 'Avg. Contribution (€450/yr)' : 'Avg. Contribution (€37.50/mo)';

    const datasets = [
        {
            label:           'Cumulative Donations',
            data:            chartData.donations,
            borderColor:     '#E89C5C',
            backgroundColor: 'rgba(232, 156, 92, 0.1)',
            borderWidth:     3,
            tension:         0.4,
            fill:            false,
            yAxisID:         'y'
        },
        {
            label:           'Portfolio Value (50% reinvested + market growth)',
            data:            chartData.portfolio,
            borderColor:     '#228B22',
            backgroundColor: 'rgba(34, 139, 34, 0.1)',
            borderWidth:     3,
            tension:         0.4,
            fill:            false,
            yAxisID:         'y'
        },
        {
            label:       avgLabel,
            data:        chartData.avgContribution,
            borderColor: 'rgba(255, 215, 0, 0.85)',
            borderWidth: 2,
            borderDash:  [8, 4],
            tension:     0,
            fill:        false,
            pointRadius: 0,
            yAxisID:     'y'
        },
        {
            label:           'Donations to Causes (40% of dividends)',
            data:            chartData.causesYield,
            borderColor:     '#9370DB',
            backgroundColor: 'rgba(147, 112, 219, 0.05)',
            borderWidth:     2,
            tension:         0.4,
            fill:            false,
            yAxisID:         'y'
        }
    ];

    const scales = {
        y: {
            beginAtZero: true,
            ticks: { color: '#A89E8C', callback: value => '€' + value.toLocaleString() },
            grid:  { color: 'rgba(245, 241, 232, 0.1)' }
        },
        x: {
            ticks: { color: '#A89E8C', maxRotation: 45, minRotation: 45 },
            grid:  { color: 'rgba(245, 241, 232, 0.05)' }
        }
    };

    currentChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: chartData.labels, datasets },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display:  true,
                    position: 'top',
                    labels: {
                        color:         '#F5F1E8',
                        usePointStyle: true,
                        padding:       15,
                        font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                    },
                    onClick: function (e, legendItem, legend) {
                        const meta = legend.chart.getDatasetMeta(legendItem.datasetIndex);
                        meta.hidden = !meta.hidden;
                        legend.chart.update();
                    }
                },
                tooltip: {
                    mode:            'index',
                    intersect:       false,
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor:      '#F5F1E8',
                    bodyColor:       '#F5F1E8',
                    borderColor:     'rgba(245, 241, 232, 0.2)',
                    borderWidth:     1,
                    padding:         12,
                    callbacks: {
                        label: ctx => ctx.dataset.label + ': €' + ctx.parsed.y.toLocaleString()
                    }
                }
            },
            scales,
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });

    setupChartViewToggle(donations);
}

function prepareMonthlyData(dataPoints) {
    return {
        labels:          dataPoints.map(d => d.date),
        donations:       dataPoints.map(d => d.donations),
        portfolio:       dataPoints.map(d => d.portfolio),
        causesYield:     dataPoints.map(d => d.causesYield),
        avgContribution: dataPoints.map((_, i) => Math.round((i + 1) * (450 / 12) * 100) / 100)
    };
}

function prepareYearlyData(dataPoints) {
    const yearlyData = {};
    dataPoints.forEach(point => {
        if (!yearlyData[point.year] || point.date > yearlyData[point.year].date) {
            yearlyData[point.year] = point;
        }
    });
    const years = Object.keys(yearlyData).sort();
    return {
        labels:          years,
        donations:       years.map(y => yearlyData[y].donations),
        portfolio:       years.map(y => yearlyData[y].portfolio),
        causesYield:     years.map(y => yearlyData[y].causesYield),
        avgContribution: years.map((_, i) => (i + 1) * 450)
    };
}

function setupChartViewToggle(donations) {
    const monthlyBtn = document.getElementById('viewMonthly');
    const yearlyBtn  = document.getElementById('viewYearly');
    if (!monthlyBtn || !yearlyBtn) return;

    const newMonthlyBtn = monthlyBtn.cloneNode(true);
    const newYearlyBtn  = yearlyBtn.cloneNode(true);
    monthlyBtn.parentNode.replaceChild(newMonthlyBtn, monthlyBtn);
    yearlyBtn.parentNode.replaceChild(newYearlyBtn, yearlyBtn);

    newMonthlyBtn.addEventListener('click', function () {
        if (currentChartView === 'monthly') return;
        currentChartView = 'monthly';
        newMonthlyBtn.classList.add('active');
        newYearlyBtn.classList.remove('active');
        displayChart(donations);
    });

    newYearlyBtn.addEventListener('click', function () {
        if (currentChartView === 'yearly') return;
        currentChartView = 'yearly';
        newYearlyBtn.classList.add('active');
        newMonthlyBtn.classList.remove('active');
        displayChart(donations);
    });
}

// ── Causes breakdown ──────────────────────────────────────────────────────
function displayCausesBreakdown(themes, donations) {
    const metrics      = calculateCompounding(donations);
    const annualToCauses = metrics.annualImpact;
    const perCause     = annualToCauses / 3;

    const themeNames = {
        'basic-needs':   'Basic Needs & Poverty',
        'health':        'Health & Medicine',
        'education':     'Education & Knowledge',
        'environment':   'Environment & Climate',
        'animals':       'Animals',
        'children':      'Children & Youth',
        'human-rights':  'Human Rights & Social Justice',
        'community':     'Community & Social Services',
        'culture':       'Culture, Arts & Heritage',
        'technology':    'Technology & Future Causes',
        'freedom':       'Freedom of Speech'
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

// ── Donation history ──────────────────────────────────────────────────────
const HISTORY_PREVIEW_COUNT = 8;

function displayDonationHistory(donations) {
    const container = document.getElementById('donationHistoryList');
    const countEl   = document.getElementById('donationCount');
    const toggleBtn = document.getElementById('toggleHistory');
    if (!container) return;

    const sorted = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (countEl) countEl.textContent = `${sorted.length} donation${sorted.length !== 1 ? 's' : ''}`;

    if (sorted.length === 0) {
        container.innerHTML = '<p class="no-donations">No donations yet. Add your first donation below.</p>';
        if (toggleBtn) toggleBtn.style.display = 'none';
        return;
    }

    renderHistoryItems(container, sorted, HISTORY_PREVIEW_COUNT);

    if (toggleBtn) {
        if (sorted.length > HISTORY_PREVIEW_COUNT) {
            toggleBtn.style.display     = 'block';
            toggleBtn.dataset.expanded  = 'false';
            toggleBtn.textContent       = `Show all ${sorted.length} donations`;
        } else {
            toggleBtn.style.display = 'none';
        }
    }
}

function renderHistoryItems(container, sorted, limit) {
    const toShow = limit ? sorted.slice(0, limit) : sorted;
    container.innerHTML = '';
    toShow.forEach(d => {
        const item      = document.createElement('div');
        item.className  = 'history-item';
        const date      = new Date(d.date);
        const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        item.innerHTML  = `
            <span class="history-date">${formatted}</span>
            <span class="history-amount">€${d.amount.toLocaleString()}</span>
        `;
        container.appendChild(item);
    });
}

function setupHistoryToggle(donations) {
    const toggleBtn = document.getElementById('toggleHistory');
    if (!toggleBtn) return;

    const newBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

    newBtn.addEventListener('click', function () {
        const container  = document.getElementById('donationHistoryList');
        const sorted     = [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));
        const isExpanded = newBtn.dataset.expanded === 'true';

        if (isExpanded) {
            renderHistoryItems(container, sorted, HISTORY_PREVIEW_COUNT);
            newBtn.textContent      = `Show all ${sorted.length} donations`;
            newBtn.dataset.expanded = 'false';
        } else {
            renderHistoryItems(container, sorted, null);
            newBtn.textContent      = 'Show less';
            newBtn.dataset.expanded = 'true';
        }
    });
}

// ── Donation form ─────────────────────────────────────────────────────────
function setupDonationForm() {
    const form      = document.getElementById('donationForm');
    if (!form) return;

    const dateInput = document.getElementById('donationDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('donationAmount').value);
        const date   = document.getElementById('donationDate').value;

        if (!amount || !date || amount <= 0) {
            showToast('Please enter a valid amount and date', 'error');
            return;
        }

        const donations = JSON.parse(localStorage.getItem('donations_v2') || '[]');
        donations.push({ amount, date });
        localStorage.setItem('donations_v2', JSON.stringify(donations));

        const filtered = getFilteredDonations();
        displayMetrics(filtered);

        const chartCanvas = document.getElementById('compoundingChart');
        const oldChart    = Chart.getChart(chartCanvas);
        if (oldChart) oldChart.destroy();
        displayChart(filtered);

        if (_impactUserData) displayCausesBreakdown(_impactUserData.themes, filtered);
        displayDonationHistory(filtered);
        setupHistoryToggle(filtered);

        form.reset();
        if (dateInput) dateInput.valueAsDate = new Date();

        showToast(`€${amount.toLocaleString()} donation added successfully`);
    });
}

// ── Demo data reset ───────────────────────────────────────────────────────
function setupResetDemoData() {
    const resetBtn = document.getElementById('resetDemoData');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', function () {
        if (confirm('Reset to demo data? This will replace your current donation history with 7 years of sample data.')) {
            localStorage.setItem('donations_v2', JSON.stringify(generateRealisticDonations()));
            location.reload();
        }
    });
}

// ── Investment simulator ───────────────────────────────────────────────────
function setupPredictionCalculator() {
    const btn = document.getElementById('runSimulation');
    if (!btn) return;

    btn.addEventListener('click', function () {
        const monthly = parseFloat(document.getElementById('simMonthly')?.value);
        const years   = parseInt(document.getElementById('simYears')?.value);

        if (!monthly || !years || monthly <= 0 || years <= 0) {
            showToast('Please enter a valid monthly amount and period', 'error');
            return;
        }

        const { points, crossoverYearIdx, crossoverMonth } = runSimulation(monthly, years);
        const last        = points[points.length - 1];
        const totalInvested = monthly * years * 12;
        const returnPct   = ((last.portfolio - totalInvested) / totalInvested * 100).toFixed(0);

        document.getElementById('simFinalPortfolio').textContent =
            `€${Math.round(last.portfolio).toLocaleString()}`;
        document.getElementById('simTotalInvested').textContent =
            `€${Math.round(totalInvested).toLocaleString()}`;
        document.getElementById('simMonthlyDividend').textContent =
            `€${last.monthlyDiv.toFixed(2)}`;
        document.getElementById('simCausesMonthly').textContent =
            `€${last.causesAmt.toFixed(2)}`;
        document.getElementById('simReturn').textContent = `+${returnPct}%`;

        if (crossoverMonth > 0) {
            const yr  = Math.ceil(crossoverMonth / 12);
            const mo  = crossoverMonth % 12 || 12;
            document.getElementById('simCrossover').textContent =
                `Year ${yr}, Month ${mo}`;
            document.getElementById('simCrossover').style.color = '#32CD32';
        } else {
            document.getElementById('simCrossover').textContent = 'Not reached';
            document.getElementById('simCrossover').style.color = '#A89E8C';
        }

        document.getElementById('simResults').style.display = 'block';
        displayInvestedVsPortfolioChart(points, monthly, years);
        displayDividendCrossoverChart(points, monthly, crossoverYearIdx);
        document.getElementById('simResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function runSimulation(monthly, years) {
    const ANNUAL_DIVIDEND  = 0.05;
    const REINVEST_RATE    = 0.50;
    const CAUSES_RATE      = 0.40;
    const ANNUAL_MARKET    = 0.09;

    let portfolioValue = 0;
    let crossoverMonth = -1;
    const yearlyPoints = [];

    for (let m = 1; m <= years * 12; m++) {
        portfolioValue      += monthly;
        const monthlyDiv     = portfolioValue * (ANNUAL_DIVIDEND / 12);
        portfolioValue      += monthlyDiv * REINVEST_RATE;
        portfolioValue      += portfolioValue * (ANNUAL_MARKET / 12);
        const causesAmt      = monthlyDiv * CAUSES_RATE;

        if (crossoverMonth < 0 && causesAmt >= monthly) crossoverMonth = m;

        if (m % 12 === 0) {
            yearlyPoints.push({
                year:      m / 12,
                portfolio: Math.round(portfolioValue * 100) / 100,
                monthlyDiv: Math.round(monthlyDiv * 100) / 100,
                causesAmt:  Math.round(causesAmt * 100) / 100
            });
        }
    }

    const crossoverYearIdx = crossoverMonth > 0
        ? Math.min(Math.ceil(crossoverMonth / 12) - 1, yearlyPoints.length - 1)
        : -1;

    return { points: yearlyPoints, crossoverYearIdx, crossoverMonth };
}

// Chart 1 — Cash invested (red) vs Portfolio value (cyan) with shaded gain
function displayInvestedVsPortfolioChart(points, monthly, years) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels   = points.map(p => `Year ${p.year}`);
    const invested  = points.map(p => Math.round(p.year * 12 * monthly));
    const portfolio = points.map(p => Math.round(p.portfolio));

    const commonOpts = {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true, position: 'top',
                labels: {
                    color: '#F5F1E8', usePointStyle: true, padding: 15,
                    font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                }
            },
            tooltip: {
                mode: 'index', intersect: false,
                backgroundColor: 'rgba(26, 18, 32, 0.9)',
                titleColor: '#F5F1E8', bodyColor: '#F5F1E8',
                borderColor: 'rgba(245, 241, 232, 0.2)', borderWidth: 1, padding: 12,
                callbacks: { label: c => c.dataset.label + ': €' + c.parsed.y.toLocaleString() }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#A89E8C', callback: v => '€' + v.toLocaleString() },
                grid:  { color: 'rgba(245, 241, 232, 0.1)' }
            },
            x: {
                ticks: { color: '#A89E8C' },
                grid:  { color: 'rgba(245, 241, 232, 0.05)' }
            }
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:           'Cash Invested',
                    data:            invested,
                    borderColor:     '#E05252',
                    backgroundColor: 'rgba(224, 82, 82, 0)',
                    borderWidth:     2,
                    tension:         0,
                    fill:            false,
                    pointRadius:     3
                },
                {
                    label:           'Portfolio Value',
                    data:            portfolio,
                    borderColor:     '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.15)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            '-1',   // shade gap down to "Cash Invested" line
                    pointRadius:     3
                }
            ]
        },
        options: commonOpts
    });
}

// Chart 2 — Monthly dividend (green) vs flat monthly input (orange) with purple crossover line
function displayDividendCrossoverChart(points, monthly, crossoverYearIdx) {
    const ctx = document.getElementById('predictionChart2');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels = points.map(p => `Year ${p.year}`);

    const crossoverPlugin = {
        id: 'crossoverLine',
        afterDraw(chart) {
            if (crossoverYearIdx < 0) return;
            const { ctx: c, chartArea, scales } = chart;
            const x = scales.x.getPixelForTick(crossoverYearIdx);
            c.save();
            c.beginPath();
            c.moveTo(x, chartArea.top);
            c.lineTo(x, chartArea.bottom);
            c.strokeStyle = 'rgba(147, 112, 219, 0.9)';
            c.lineWidth   = 2;
            c.setLineDash([6, 4]);
            c.stroke();
            c.fillStyle = 'rgba(147, 112, 219, 0.9)';
            c.font      = `11px 'IBM Plex Sans', sans-serif`;
            c.textAlign = 'left';
            c.fillText('Crossover', x + 6, chartArea.top + 16);
            c.restore();
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:       `Monthly Investment (€${monthly})`,
                    data:        points.map(() => monthly),
                    borderColor: 'rgba(255, 165, 0, 0.9)',
                    borderWidth: 2,
                    borderDash:  [8, 4],
                    tension:     0,
                    fill:        false,
                    pointRadius: 0
                },
                {
                    label:           'Monthly Dividend Income',
                    data:            points.map(p => p.monthlyDiv),
                    borderColor:     '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.08)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            false,
                    pointRadius:     3
                }
            ]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true, position: 'top',
                    labels: {
                        color: '#F5F1E8', usePointStyle: true, padding: 15,
                        font: { size: 12, family: "'IBM Plex Sans', sans-serif" }
                    }
                },
                tooltip: {
                    mode: 'index', intersect: false,
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor: '#F5F1E8', bodyColor: '#F5F1E8',
                    borderColor: 'rgba(245, 241, 232, 0.2)', borderWidth: 1, padding: 12,
                    callbacks: { label: c => c.dataset.label + ': €' + c.parsed.y.toFixed(2) }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#A89E8C', callback: v => '€' + v.toFixed(0) },
                    grid:  { color: 'rgba(245, 241, 232, 0.1)' }
                },
                x: {
                    ticks: { color: '#A89E8C' },
                    grid:  { color: 'rgba(245, 241, 232, 0.05)' }
                }
            }
        },
        plugins: [crossoverPlugin]
    });
}
