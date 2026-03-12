// ── Constants ─────────────────────────────────────────────────────────────
const DEMO_MONTHLY          = 50;
const DEMO_YEARS            = 22;
const ANNUAL_DIVIDEND_RATE  = 0.05;   // 5% dividend yield (high-yield ETF strategy)
const REINVEST_RATE         = 0.50;   // 50% of dividends reinvested
const CAUSES_RATE           = 0.40;   // 40% of dividends to your causes
const ANNUAL_MARKET_RETURN  = 0.09;   // 9% annual price appreciation

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

// ── Core simulation ───────────────────────────────────────────────────────
// Returns yearly data points + summary for a given monthly/years scenario.
function runScenario(monthly, years) {
    const yearlyPoints = [];
    let portfolio      = 0;
    let totalInvested  = 0;
    let crossoverMonth = -1;

    for (let m = 1; m <= years * 12; m++) {
        portfolio     += monthly;
        totalInvested += monthly;

        const monthlyDiv = portfolio * (ANNUAL_DIVIDEND_RATE / 12);
        const causesAmt  = monthlyDiv * CAUSES_RATE;

        portfolio += monthlyDiv * REINVEST_RATE + portfolio * (ANNUAL_MARKET_RETURN / 12);

        if (crossoverMonth < 0 && causesAmt >= monthly) {
            crossoverMonth = m;
        }

        if (m % 12 === 0) {
            yearlyPoints.push({
                year:          m / 12,
                portfolio:     Math.round(portfolio),
                totalInvested: Math.round(totalInvested),
                monthlyDiv,
                causesAmt
            });
        }
    }

    const last             = yearlyPoints[yearlyPoints.length - 1];
    const crossoverYear    = crossoverMonth > 0 ? crossoverMonth / 12 : -1;
    const crossoverYearIdx = crossoverYear > 0
        ? Math.min(Math.ceil(crossoverYear) - 1, yearlyPoints.length - 1)
        : -1;

    return {
        points:           yearlyPoints,
        crossoverMonth,
        crossoverYear,
        crossoverYearIdx,
        finalPortfolio:   last.portfolio,
        totalInvested:    last.totalInvested,
        monthlyDiv:       last.monthlyDiv,
        causesAmt:        last.causesAmt
    };
}

// ── Public entry point (called by dashboard.js) ───────────────────────────
window.initImpactDashboard = function (userData) {
    const scenario = runScenario(DEMO_MONTHLY, DEMO_YEARS);

    displayHeroMetrics(scenario);
    displayCrossoverChart(scenario, DEMO_MONTHLY);
    displayPortfolioGrowthChart(scenario);
    displayAllocationChart();

    if (userData && userData.themes) {
        displayCausesBreakdown(userData.themes, scenario);
    }

    setupSimulator();
};

// ── Hero metrics ──────────────────────────────────────────────────────────
function displayHeroMetrics(scenario) {
    const { finalPortfolio, totalInvested, crossoverYear, causesAmt } = scenario;
    const growthPct = ((finalPortfolio - totalInvested) / totalInvested * 100).toFixed(0);

    const heroInvested  = document.getElementById('heroInvested');
    const heroPortfolio = document.getElementById('heroPortfolio');
    const heroGrowth    = document.getElementById('heroGrowth');
    const heroCrossover = document.getElementById('heroCrossover');
    const heroCrossoverSub  = document.getElementById('heroCrossoverSub');
    const heroCrossoverCard = document.getElementById('heroCrossoverCard');

    if (heroInvested)  heroInvested.textContent  = `€${totalInvested.toLocaleString()}`;
    if (heroPortfolio) heroPortfolio.textContent = `€${finalPortfolio.toLocaleString()}`;
    if (heroGrowth)    heroGrowth.textContent    = `+${growthPct}% return on invested capital`;

    if (heroCrossover && crossoverYear > 0) {
        const yr = Math.floor(crossoverYear);
        const mo = Math.round((crossoverYear - yr) * 12);
        heroCrossover.textContent    = `Year ${yr}${mo > 0 ? `, Month ${mo}` : ''}`;
        heroCrossoverSub.textContent = `Portfolio now pays €${Math.round(causesAmt)}/mo to causes`;
        if (heroCrossoverCard) heroCrossoverCard.classList.add('crossover-reached');
    }
}

// ── Shared chart options ──────────────────────────────────────────────────
function baseChartOptions(yTickCallback) {
    return {
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
                padding:         12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#A89E8C', callback: yTickCallback || (v => '€' + v.toLocaleString()) },
                grid:  { color: 'rgba(245, 241, 232, 0.1)' }
            },
            x: {
                ticks: { color: '#A89E8C' },
                grid:  { color: 'rgba(245, 241, 232, 0.05)' }
            }
        }
    };
}

// ── Primary chart: crossover ──────────────────────────────────────────────
function displayCrossoverChart(scenario, monthly) {
    const ctx = document.getElementById('crossoverChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const { points, crossoverYearIdx } = scenario;
    monthly = monthly || DEMO_MONTHLY;

    const labels      = points.map(p => `Yr ${p.year}`);
    const causesData  = points.map(p => parseFloat(p.causesAmt.toFixed(2)));
    const donationLine = points.map(() => monthly);

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
            c.font      = `bold 11px 'IBM Plex Sans', sans-serif`;
            c.textAlign = 'left';
            c.fillText('Crossover', x + 6, chartArea.top + 18);
            c.restore();
        }
    };

    const opts = baseChartOptions(v => '€' + v.toFixed(0));
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toFixed(2)
    };

    new Chart(ctx, {
        type:    'line',
        data: {
            labels,
            datasets: [
                {
                    label:       `Your monthly donation (€${monthly})`,
                    data:        donationLine,
                    borderColor: 'rgba(255, 165, 0, 0.9)',
                    borderWidth: 2,
                    borderDash:  [8, 4],
                    tension:     0,
                    fill:        false,
                    pointRadius: 0
                },
                {
                    label:           'Monthly causes payout (40% of dividends)',
                    data:            causesData,
                    borderColor:     '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.1)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            false,
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [crossoverPlugin]
    });
}

// ── Secondary chart: portfolio growth ────────────────────────────────────
function displayPortfolioGrowthChart(scenario) {
    const ctx = document.getElementById('portfolioGrowthChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const { points } = scenario;
    const labels    = points.map(p => `Yr ${p.year}`);
    const invested  = points.map(p => p.totalInvested);
    const portfolio = points.map(p => p.portfolio);

    const opts = baseChartOptions();
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toLocaleString()
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
                    fill:            '-1',
                    pointRadius:     3
                }
            ]
        },
        options: opts
    });
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
            responsive:          true,
            maintainAspectRatio: true,
            cutout:              '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 18, 32, 0.9)',
                    titleColor:      '#F5F1E8',
                    bodyColor:       '#F5F1E8',
                    borderColor:     'rgba(245, 241, 232, 0.2)',
                    borderWidth:     1,
                    callbacks: { label: ctx => ' ' + ctx.label }
                }
            }
        }
    });
}

// ── Causes breakdown ──────────────────────────────────────────────────────
function displayCausesBreakdown(themes, scenario) {
    const annualCauses = scenario.causesAmt * 12;
    const perCause     = annualCauses / themes.length;

    const themeNames = {
        'basic-needs':  'Basic Needs & Poverty',
        'health':       'Health & Medicine',
        'education':    'Education & Knowledge',
        'environment':  'Environment & Climate',
        'animals':      'Animals',
        'children':     'Children & Youth',
        'human-rights': 'Human Rights & Social Justice',
        'community':    'Community & Social Services',
        'culture':      'Culture, Arts & Heritage',
        'technology':   'Technology & Future Causes',
        'freedom':      'Freedom of Speech'
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

// ── Simulator ─────────────────────────────────────────────────────────────
function setupSimulator() {
    const btn = document.getElementById('runSimulation');
    if (!btn) return;

    btn.addEventListener('click', function () {
        const monthly = parseFloat(document.getElementById('simMonthly')?.value);
        const years   = parseInt(document.getElementById('simYears')?.value);

        if (!monthly || !years || monthly <= 0 || years <= 0) {
            showToast('Please enter a valid monthly amount and period', 'error');
            return;
        }

        const scenario = runScenario(monthly, years);
        const returnPct = ((scenario.finalPortfolio - scenario.totalInvested) / scenario.totalInvested * 100).toFixed(0);

        document.getElementById('simFinalPortfolio').textContent = `€${scenario.finalPortfolio.toLocaleString()}`;
        document.getElementById('simTotalInvested').textContent  = `€${scenario.totalInvested.toLocaleString()}`;
        document.getElementById('simMonthlyDividend').textContent = `€${scenario.monthlyDiv.toFixed(2)}`;
        document.getElementById('simCausesMonthly').textContent   = `€${scenario.causesAmt.toFixed(2)}`;
        document.getElementById('simReturn').textContent          = `+${returnPct}%`;

        const crossoverEl = document.getElementById('simCrossover');
        if (scenario.crossoverMonth > 0) {
            const yr = Math.ceil(scenario.crossoverMonth / 12);
            const mo = scenario.crossoverMonth % 12 || 12;
            crossoverEl.textContent = `Year ${yr}, Month ${mo}`;
            crossoverEl.style.color = '#32CD32';
        } else {
            crossoverEl.textContent = 'Not reached';
            crossoverEl.style.color = '#A89E8C';
        }

        document.getElementById('simResults').style.display = 'block';
        displaySimInvestedChart(scenario.points, monthly);
        displaySimCrossoverChart(scenario.points, monthly, scenario.crossoverYearIdx);
        document.getElementById('simResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function displaySimInvestedChart(points, monthly) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels    = points.map(p => `Year ${p.year}`);
    const invested  = points.map(p => p.totalInvested);
    const portfolio = points.map(p => p.portfolio);

    const opts = baseChartOptions();
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toLocaleString()
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
                    fill:            '-1',
                    pointRadius:     3
                }
            ]
        },
        options: opts
    });
}

function displaySimCrossoverChart(points, monthly, crossoverYearIdx) {
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

    const opts = baseChartOptions(v => '€' + v.toFixed(0));
    opts.plugins.tooltip.callbacks = {
        label: c => c.dataset.label + ': €' + c.parsed.y.toFixed(2)
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:       `Monthly Donation (€${monthly})`,
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
                    data:            points.map(p => parseFloat(p.monthlyDiv.toFixed(2))),
                    borderColor:     '#32CD32',
                    backgroundColor: 'rgba(50, 205, 50, 0.08)',
                    borderWidth:     3,
                    tension:         0.4,
                    fill:            false,
                    pointRadius:     3
                }
            ]
        },
        options: opts,
        plugins: [crossoverPlugin]
    });
}
